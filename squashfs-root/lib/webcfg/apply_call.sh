#!/bin/sh

set_multi_pppoe() {
	logger -t webcfg "apply multi pppoe..."

	for cfg in $(seq 0 4) ; do
		[ $cfg = "0" ] && index=""
		[ $cfg = "0" ] || index=$cfg
		ifname=`uci get network.wan$index.ifname 2>/dev/null`
		[ -n $ifname ] && {
			multi_pppoe_list=`uci get network.multi_pppoe_list_wan$index.list 2>/dev/null`
			[ -n $multi_pppoe_list ] && {
				multi_pppoe_list=${multi_pppoe_list#*','}
				multi_pppoe_list=${multi_pppoe_list#*','}
				[ -n $multi_pppoe_list ] && {
					multi_pppoe_list=`echo $multi_pppoe_list | sed 's/[,]*/ /g'`
					for loop in $multi_pppoe_list ; do
						ip link add link br-wan$index name adsl$(($index+1))$loop type macvlan
					done
				}
			}
		}
	done
	exit 0
}

create_interval_redial_file() {
	#$1:filename $2:num $3:wan_num $4:sum $5:mwan_flag
	file=$1
	index=$2
	wan_num=$3
	interval_time=$4
	mwan_flag=$5
	rm $file
	touch $file
	chmod 755 $file
	echo "#!/bin/sh" >> $file
	if [ $wan_num = '0' ]; then
		num=""
	else
		num=$3
	fi
	echo "[ -f /tmp/timing_redial ] || mkdir /tmp/timing_redial" >> $file
	echo "[ -f /tmp/timing_redial/${wan_num}_${index}.file ] || echo 0 > /tmp/timing_redial/${wan_num}_${index}.file" >> $file
	echo "time_index=\`cat /tmp/timing_redial/${wan_num}_${index}.file\`" >> $file
	echo "[ \$time_index -ge $interval_time ] && {" >> $file
	if [ $mwan_flag = '1' ]; then
		echo "	ifdown wan$num; ifup wan$num" >> $file
	else
		echo "	sleep 2" >> $file
		echo "	ip link delete adsl$index type macvlan" >> $file
		echo "	ip link add link br-wan$num name adsl$index type macvlan" >> $file
	fi
	echo "	echo 0 > /tmp/timing_redial/${wan_num}_${index}.file" >> $file
	echo "}" >> $file
	echo "[ \$time_index -ge $interval_time ] || {" >> $file
	echo "	let time_index++" >> $file
	echo "	echo \${time_index} > /tmp/timing_redial/${wan_num}_${index}.file" >> $file
	echo "}" >> $file
	echo "exit 0" >> $file
	exit 0
}

crete_timing_redial_file() {
	# $1:filename $2:buf2 $3:wan_num $4:mwan_flag
	file=$1
	iface=$2
	wan_num=$3
	mwan_flag=$4
	rm $file
	touch $file
	chmod 755 $file
	echo "#!/bin/sh" >> $file
	if [ $wan_num = '0' ]; then
		num=""
	else
		num=$3
	fi
	if [ $mwan_flag = '1' ]; then
		echo "ifdown $iface; ifup $iface" >> $file
	else
		echo "sleep 2" >> $file
		echo "ip link delete $iface type macvlan" >> $file
		echo "ip link add link br-wan$num name $iface type macvlan" >> $file
	fi
	echo "exit 0" >> $file
	exit 0
}

[ $1 = "multi_pppoe" ] && set_multi_pppoe
[ $1 = "timing_redial" ] && crete_timing_redial_file $2 $3 $4 $5
[ $1 = "interval_redial" ] && create_interval_redial_file $2 $3 $4 $5 $6
