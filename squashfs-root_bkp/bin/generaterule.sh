#!/bin/sh
[ -e /lib/functions.sh ] && . /lib/functions.sh || . ./functions.sh

local download
local qos_enabled
local qos_enabled_limit

local max_lo_rate="1Gbit"
local max_rate=1000000
local default_local_num=9
local ifb0_start_num=10
local ifb0_root_num=3
local lan_root_num=1
local wan_root_num=2
local default_rule_num=10
local rule_start_num=20
local rule_num
local limit_exist=0
local find_download
local ip
local downrate
local uprate
local share
local asure_per=2
local base_per=10
local surf_max
local p2p_max
local max_ip_limit_num=1000
local current_ip_sum=0

add_lan_rule()
{
	local network=$1
	local ipaddr
	local netmask
	local subnet
	local type
	local devname
	local chainname
	local download_str
	local download_connbytes

	config_get type $1 type

	if [ "$type" != "bridge" ];then
		return;
	fi
	config_get ipaddr $1 ipaddr
	config_get netmask $1 netmask

	network_str=`ipcalc.sh $ipaddr $netmask | grep NETWORK | awk -F "=" '{print $2}' 2>/dev/null`
	prefix_str=`ipcalc.sh $ipaddr $netmask | grep PREFIX | awk -F "=" '{print $2}' 2>/dev/null`
	subnet=$network_str/$prefix_str

	devname=br-$network
	chainname=${devname}_post
	download_str=`expr $download / 1000`"Mbit"
	if [ $download -lt 8000 ];then
		download_connbytes=`expr 8000 \* 1000 / 4`
	else
		download_connbytes=`expr $download \* 1000 / 4`
	fi
	r2qvalue=`expr $download / 8 / 60 + 1`
	
	tc qdisc del dev $devname root 2>/dev/null
	tc qdisc del dev $devname ingress 2>/dev/null
	tc qdisc add dev $devname ingress 2>/dev/null
	tc qdisc add dev $devname root handle $lan_root_num: htb default $(($default_rule_num)) r2q $r2qvalue

	tc class add dev $devname parent $lan_root_num: classid $lan_root_num:1 htb rate $(($download))kbit
	tc class add dev $devname parent $lan_root_num:1 classid $lan_root_num:$(($default_rule_num)) htb rate $(($download))kbit ceil $(($download))kbit prio 3 burst 20k
	tc qdisc add dev $devname parent $lan_root_num:$(($default_rule_num)) handle $(($default_rule_num)): sfq

	tc class add dev $devname parent $lan_root_num: classid $lan_root_num:2 htb rate $max_lo_rate
	tc class add dev $devname parent $lan_root_num:2 classid $lan_root_num:$(($default_local_num)) htb rate $max_lo_rate ceil $max_lo_rate prio 3 burst 20k
	tc qdisc add dev $devname parent $lan_root_num:$(($default_local_num)) handle $(($default_local_num)): sfq

	if [ x"$qos_enabled" == "x1" ] && [ "${network:0:3}" == "lan" ];then
		tc class add dev $devname parent $lan_root_num:1 classid $lan_root_num:$(($default_rule_num+1)) htb rate $(($download*$asure_per/$base_per))kbit ceil $(($download*$surf_max/$base_per))kbit prio 2 burst 20k
		tc class add dev $devname parent $lan_root_num:1 classid $lan_root_num:$(($default_rule_num+2)) htb rate $(($download*$asure_per/$base_per))kbit ceil $(($download*$p2p_max/$base_per))kbit prio 7 burst 20k

		tc qdisc add dev $devname parent $lan_root_num:$(($default_rule_num+1)) handle $(($default_rule_num+1)): sfq 
		tc qdisc add dev $devname parent $lan_root_num:$(($default_rule_num+2)) handle $(($default_rule_num+2)): sfq
		
		chain_exist=`iptables -t mangle -S |grep $chainname`
		if [ -z "$chain_exist" ];then
			iptables -t mangle -N $chainname
			iptables -t mangle -A POSTROUTING -o $devname -j $chainname
			iptables -t mangle -A $chainname -s $subnet -j ACCEPT
			iptables -t mangle -A $chainname -p tcp --tcp-flags FIN,SYN,RST,ACK ACK -m length --length :128 -j CLASSIFY --set-class $lan_root_num:$(($default_rule_num+1))
			iptables -t mangle -A $chainname -p udp --sport 53 -j CLASSIFY --set-class $lan_root_num:$(($default_rule_num+1))
			#download user add to ipset
			ipset -N p2p_$devname hash:ip --timeout 60
			iptables -t mangle -A $chainname -p tcp ! --sport 443 -m connbytes  --connbytes $download_connbytes: --connbytes-dir reply --connbytes-mode bytes -j SET --add-set p2p_$devname dst
			iptables -t mangle -A $chainname -p udp -m connbytes  --connbytes $download_connbytes: --connbytes-dir reply --connbytes-mode bytes -j SET --add-set p2p_$devname dst
			iptables -t mangle -A $chainname -p tcp -m set --match-set p2p_$devname dst -j CLASSIFY --set-class $lan_root_num:$(($default_rule_num+2))
			iptables -t mangle -A $chainname ! -p tcp -m set --match-set p2p_$devname dst -j CLASSIFY --set-class $lan_root_num:$(($default_rule_num+2))
		fi
	fi

	if [ x"$qos_enabled_limit" == "x1" ];then
		tc filter add dev $devname parent ffff: protocol ip u32 match u32 0 0 action connmark action mirred egress redirect dev ifb0
	fi
}

add_wan_rule()
{
	local network=$1
	local type
	local proto
	local devname
	local chainname
	local ifname
	local upload
	local upload_connbytes
	local upload_str
	
	upload=`uci get common.$network.upload 2>/dev/null`
	if [ -z "$upload" ] || [ "$upload" == "0" ];then
		upload=$max_rate
	fi
	upload_connbytes=`expr $upload \* 1000 / 4`

	config_get type $1 type
	config_get proto $1 proto
	
	if [ x"$proto" == "xpppoe" ];then
		devname=pppoe-$network
		[ -d /sys/class/net/$devname ] || return
	else
		if [ "$type" == "bridge" ];then
			devname=br-$network
		else
			config_get ifname $1 ifname
			devname=$ifname
		fi
	fi

	chainname=${devname}_post
	upload_str=`expr $upload / 1000`"Mbit"
	
	r2qvalue=`expr $upload / 8 / 60 + 1`

	tc qdisc del dev $devname root 2>/dev/null
	tc qdisc add dev $devname root handle $wan_root_num: htb default $(($default_rule_num)) r2q $r2qvalue

	tc class add dev $devname parent $wan_root_num: classid $wan_root_num:1 htb rate $(($upload))kbit
	tc class add dev $devname parent $wan_root_num:1 classid $wan_root_num:$(($default_rule_num)) htb rate $(($upload))kbit ceil $(($upload))kbit prio 2 burst 20k
	tc qdisc add dev $devname parent $wan_root_num:$(($default_rule_num)) handle $(($default_rule_num)): sfq   

	if [ x"$qos_enabled" == "x1" ];then
		tc class add dev $devname parent $wan_root_num:1 classid $wan_root_num:$(($default_rule_num+1)) htb rate $(($upload*$asure_per/$base_per))kbit ceil $(($upload*$surf_max/$base_per))kbit prio 3 burst 20k
		tc class add dev $devname parent $wan_root_num:1 classid $wan_root_num:$(($default_rule_num+2)) htb rate $(($upload*$asure_per/$base_per))kbit ceil $(($upload*$p2p_max/$base_per))kbit prio 7 burst 20k

		tc qdisc add dev $devname parent $wan_root_num:$(($default_rule_num+1)) handle $(($default_rule_num+1)): sfq 
		tc qdisc add dev $devname parent $wan_root_num:$(($default_rule_num+2)) handle $(($default_rule_num+2)): sfq

		chain_exist=`iptables -t mangle -S |grep $chainname`
		if [ -z "$chain_exist" ];then
			iptables -t mangle -N $chainname
			iptables -t mangle -A POSTROUTING -o $devname -j $chainname
			iptables -t mangle -A $chainname -p tcp --tcp-flags FIN,SYN,RST,ACK ACK -m length --length :128 -j CLASSIFY --set-class $wan_root_num:$(($default_rule_num+1))
			iptables -t mangle -A $chainname -p udp --dport 53 -j CLASSIFY --set-class $wan_root_num:$(($default_rule_num+1))
			#download user add to ipset
			ipset -N p2p_$devname hash:ip --timeout 60
			iptables -t mangle -A $chainname -m connbytes  --connbytes $upload_connbytes: --connbytes-dir original --connbytes-mode bytes -j SET --add-set p2p_$devname src
			iptables -t mangle -A $chainname -p tcp -m set --match-set p2p_$devname src -j CLASSIFY --set-class $wan_root_num:$(($default_rule_num+2))
			iptables -t mangle -A $chainname ! -p tcp -m set --match-set p2p_$devname src -j CLASSIFY --set-class $wan_root_num:$(($default_rule_num+2))
		fi
	fi
}


add_ifb0_config()
{
	local i
	local upload_total
	local wan_rate

	if [ x"$qos_enabled_limit" == "x1" ];then
		if [ -f /usr/sbin/mwan3 ];then
			for i in 0 1 2 3 4
			do
				if [ $i -eq 0 ];then
					upload_total=`uci get common.wan.upload 2>/dev/null`
				else
					wan_rate=`uci get common.wan$i.upload 2>/dev/null`
					if [ -z "$wan_rate" ];then
						continue
					fi
					let upload_total=upload_total+$wan_rate
				fi
			done
		else
			upload_total=`uci get common.wan.upload 2>/dev/null`
		fi

		if [ -z "$upload_total" ] || [ "$upload_total" == "0" ];then
			upload_total=$max_rate
		fi
		r2qvalue=`expr $upload_total / 8 / 60 + 1`
		
		ip link set dev ifb0 up 2>/dev/null

		tc qdisc del dev ifb0 root 2>/dev/null
		tc qdisc add dev ifb0 root handle $ifb0_root_num: htb default $ifb0_start_num r2q $r2qvalue

		tc class add dev ifb0 parent $ifb0_root_num classid $ifb0_root_num:1 htb rate $(($upload_total))kbit quantum 20000
		tc class add dev ifb0 parent $ifb0_root_num:1 classid $ifb0_root_num:$ifb0_start_num htb rate $(($upload_total))kbit ceil $(($upload_total))kbit
		tc qdisc add dev ifb0 parent $ifb0_root_num:$ifb0_start_num handle $ifb0_start_num: sfq

		tc class add dev ifb0 parent $ifb0_root_num classid $ifb0_root_num:2 htb rate $max_lo_rate
		tc class add dev ifb0 parent $ifb0_root_num:2 classid $ifb0_root_num:$default_local_num htb rate $max_lo_rate ceil $max_lo_rate prio 3 burst 20k
		tc qdisc add dev ifb0 parent $ifb0_root_num:$default_local_num handle $default_local_num: sfq

	fi
}

add_tc_class()
{
	local network=$1
	local iface=$2
	
	case "${network:0:3}" in
		vla | \
		lan)
			if [ "$iface" != "all" ] && [ "$iface" != "$network" ];then
				return
			fi
			add_lan_rule $network
			;;
		wan)
			if [ "$iface" != "all" ] && [ "$iface" != "$network" ];then
				return
			fi
			add_wan_rule $network
			;;
		*)
			;;
	esac
}

add_tc_class_main()
{
	local iface=$1
	
	add_ifb0_config

	config_load network
	config_foreach add_tc_class interface $iface

	config_load vlan
	config_foreach add_tc_class interface $iface
}

add_lan_download()
{
	local network=$1
	local devname
	local ipaddr
	local netmask
	local created

	[ $find_download -eq 1 ] && return

	if [ ${network:0:3} == "lan" ] || [ ${network:0:4} == "vlan" ];then
		res=`echo $ip | grep '-'`
		if [ -n "$res" ];then
			ip_start=`echo $ip | awk -F "-" '{print $1}'`
			ip_end=`echo $ip | awk -F "-" '{print $2}'`
		else
			ip_start=$ip
			ip_end=$ip
		fi
		config_get ipaddr $1 ipaddr
		config_get netmask $1 netmask
		[ -z "$ipaddr" ] && return
		res=`/bin/calcip "judge" $ip_start $ipaddr $netmask`
		if [ "$res" == "0" ];then
			return
		fi
		res=`/bin/calcip "count" $ip_start $ip_end $netmask`
		let count=$res
		find_download=1
		startnum=`/bin/calcip "iptoint" $ip_start`
		i=0
		created=0

		while [ $i -le $count ]
		do
			[ $current_ip_sum -gt $max_ip_limit_num ] && break;
			let realnum=startnum+$i
			realip=`/bin/calcip "inttoip" $realnum`
			if [ "$realip" == "$ipaddr" ];then
				let i=i+1
				continue
			fi
			devname=br-$network
			
			if [ $created -eq 0 ] || [ -z "$share" ] || [ $share -eq 0 ];then
				#download
				tc class add dev ${devname} parent ${lan_root_num}:1 classid ${lan_root_num}:${rule_num} htb rate $(($downrate))kbit ceil $(($downrate))kbit
				tc qdisc add dev ${devname} parent ${lan_root_num}:${rule_num} handle ${rule_num}: sfq
				#upload
				tc class add dev ifb0 parent $ifb0_root_num:1 classid $ifb0_root_num:${rule_num} htb rate $(($uprate))kbit ceil $(($uprate))kbit
				tc qdisc add dev ifb0 parent $ifb0_root_num:${rule_num} handle ${rule_num}: sfq
				created=1
			fi
			#download
			tc filter add dev ${devname} parent ${lan_root_num}: proto ip u32 match ip dst ${realip}/32 flowid ${lan_root_num}:${rule_num}
			#upload
			tc filter add dev ifb0 parent $ifb0_root_num: proto ip u32 match ip src ${realip}/32 flowid $ifb0_root_num:${rule_num}
			let i=i+1
			[ x"$share" == "x1" ] || let rule_num=rule_num+1
			current_ip_sum=`expr $current_ip_sum + 1`
		done
		[ x"$share" == "x1" ] && let rule_num=rule_num+1
	fi
	
}

add_download_rule()
{
	config_load network
	config_foreach add_lan_download interface

	config_load vlan
	config_foreach add_lan_download interface
}

add_limit()
{
	local name=$1
	local enable

	config_get enable $1 enable

	[ x"$enable" == "x1" ] || return
	limit_exist=1
	find_download=0
	config_get ip $1 ip
	config_get downrate $1 downrate
	config_get uprate $1 uprate
	config_get share $1 share

	add_download_rule
}

add_default_local_rule()
{
	local network=$1
	local iface=$2
	local ipaddr
	local netmask

	if [ ${network:0:3} == "lan" ];then
		if [ "$iface" != "all" ] && [ "$iface" != "$network" ];then
			return
		fi
		config_get ipaddr $1 ipaddr
		config_get netmask $1 netmask

		network_str=`/bin/ipcalc.sh $ipaddr $netmask |grep NETWORK|awk -F '=' '{print$2}'`
		prefix_str=`/bin/ipcalc.sh $ipaddr $netmask |grep PREFIX|awk -F '=' '{print$2}'`
		network_full=$network_str/$prefix_str
		tc filter add dev br-lan parent $lan_root_num: proto ip u32 match ip src $network_full flowid $lan_root_num:$default_local_num
		tc filter add dev ifb0 parent $ifb0_root_num: proto ip u32 match ip dst $network_full flowid $ifb0_root_num:$default_local_num 2>/dev/null
	fi
}

add_tc_default_local_rule()
{
	local iface=$1

	config_load network
	config_foreach add_default_local_rule interface $iface
}

add_tc_single_rule()
{
	local iface=$1

	[ x$qos_enabled_limit == "x1" ] || return
	
	if [ "$iface" != "all" ];then
		if [ "${iface:0:3}" != "lan" ];then
			return
		fi
	fi
	
	rule_num=$rule_start_num
	config_load common
    config_foreach add_limit rule
}

start_interface()
{
	qos_enabled=`uci get common.qos.enable 2>/dev/null`
	qos_enabled_limit=`uci get common.qos.enable_limit 2>/dev/null`
	if [ x"$qos_enabled" == "x1" ] || [ x"$qos_enabled_limit" == "x1" ];then
		echo enable 1>/dev/null
	else
		exit 0
	fi


	download=`uci get common.wan.download 2>/dev/null`
	wan_ipaddr=`ifstatus wan|grep \"address\" 2>/dev/null`

	[ -f /usr/sbin/mwan3 ] && {
		online_iface_str=`/usr/sbin/mwan3 status|grep online 2>/dev/null`

		for i in 1 2 3 4
		do
			iface=wan$i
			if [ -n "$online_iface_str" ];then
				online_wan=`echo $online_iface_str | grep -w "$iface"`
				[ -z "$online_wan" ] && continue
			else
				if [ -n "$wan_ipaddr" ];then
					break;
				else
					wan_ipaddr=`ifstatus $iface|grep \"address\" 2>/dev/null`
					if [ -z "$wan_ipaddr" ];then
						continue;
					else
						download=`uci get common.$iface.download 2>/dev/null`
						break;
					fi
				fi
			fi
			download_iface=`uci get common.$iface.download 2>/dev/null`
			[ -z "$download_iface" ] && continue
			[ -z "$download" ] || [ $download_iface -gt $download ] && {
				download=$download_iface
			}
		done
	}

	if [ -z "$download" ] || [ "$download" == "0" ];then
		download=$max_rate
	fi

	add_tc_class_main $1
	add_tc_single_rule $1
	add_tc_default_local_rule $1
}

surf_max=`uci get common.qos.surf_max 2>/dev/null`
[ -z "$surf_max" ] && surf_max=5
p2p_max=`uci get common.qos.p2p_max 2>/dev/null`
[ -z "$p2p_max" ] && p2p_max=5

case "$1" in
	"all")
		start_interface "all"
	;;
	"interface")
		start_interface "$2"
	;;
	"stop")
		qos_enabled=`uci get common.qos.enable 2>/dev/null`
		qos_enabled_limit=`uci get common.qos.enable_limit 2>/dev/null`
		[ -z "$qos_enabled" ] && [ -z "$qos_enabled_limit" ] && exit 0

		for iface in $(tc qdisc show | grep -E '(htb)' | awk '{print $5}'); do
			tc qdisc del dev "$iface" ingress 2>&- >&-
			tc qdisc del dev "$iface" root 2>&- >&-
			
			iptables -t mangle -D POSTROUTING -o $iface -j $iface"_post" 2>&- >&-
			iptables -t mangle -F $iface"_post" 2>&- >&-
			iptables -t mangle -X $iface"_post" 2>&- >&-

			#delete ipset
			ipset destroy p2p_$iface 2>&- >&-
		done
	;;
esac