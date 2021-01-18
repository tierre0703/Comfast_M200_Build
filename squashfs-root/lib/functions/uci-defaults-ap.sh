#!/bin/sh
# Copyright (C) 2011 OpenWrt.org

UCIDEF_LEDS_CHANGED=0

ucidef_set_led_netdev() {
	local cfg="led_$1"
	local name=$2
	local sysfs=$3
	local dev=$4

	uci -q get system.$cfg && return 0

	uci batch <<EOF
set system.$cfg='led'
set system.$cfg.name='$name'
set system.$cfg.sysfs='$sysfs'
set system.$cfg.trigger='netdev'
set system.$cfg.dev='$dev'
set system.$cfg.mode='link tx rx'
EOF
	local board_name=$(cat /tmp/sysinfo/board_name)
	local led_mode=$(cat /etc/defconfig/$board_name/led_mode)

	case $led_mode in
	only_wireless)
		uci batch <<EOF
set system.$cfg.mode='link'
EOF
		;;
	esac

	case $1 in
	WAN | \
	LAN | \
	wan | \
	lan)
	;;
	
	*)
		uci batch <<EOF
		set system.$cfg.mode='link tx rx'
EOF
	;;
	esac

	UCIDEF_LEDS_CHANGED=1
}

ucidef_set_led_usbdev() {
	local cfg="led_$1"
	local name=$2
	local sysfs=$3
	local dev=$4

	uci -q get system.$cfg && return 0

	uci batch <<EOF
set system.$cfg='led'
set system.$cfg.name='$name'
set system.$cfg.sysfs='$sysfs'
set system.$cfg.trigger='usbdev'
set system.$cfg.dev='$dev'
set system.$cfg.interval='50'
EOF
	UCIDEF_LEDS_CHANGED=1
}

ucidef_set_led_wlan() {
	local cfg="led_$1"
	local name=$2
	local sysfs=$3
	local trigger=$4

	uci -q get system.$cfg && return 0

	uci batch <<EOF
set system.$cfg='led'
set system.$cfg.name='$name'
set system.$cfg.sysfs='$sysfs'
set system.$cfg.trigger='$trigger'
EOF
	UCIDEF_LEDS_CHANGED=1
}

ucidef_set_led_switch() {
	local cfg="led_$1"
	local name=$2
	local sysfs=$3
	local trigger=$4
	local port_mask=$5

	uci -q get system.$cfg && return 0

	uci batch <<EOF
set system.$cfg='led'
set system.$cfg.name='$name'
set system.$cfg.sysfs='$sysfs'
set system.$cfg.trigger='$trigger'
set system.$cfg.port_mask='$port_mask'
EOF
	UCIDEF_LEDS_CHANGED=1
}

ucidef_set_led_default() {
	local cfg="led_$1"
	local name=$2
	local sysfs=$3
	local default=$4

	uci -q get system.$cfg && return 0

	uci batch <<EOF
set system.$cfg='led'
set system.$cfg.name='$name'
set system.$cfg.sysfs='$sysfs'
set system.$cfg.default='$default'
EOF
	UCIDEF_LEDS_CHANGED=1
}

ucidef_set_led_rssi() {
	local cfg="led_$1"
	local name=$2
	local sysfs=$3
	local iface=$4
	local minq=$5
	local maxq=$6
	local offset=$7
	local factor=$8

	uci -q get system.$cfg && return 0

	uci batch <<EOF
set system.$cfg='led'
set system.$cfg.name='$name'
set system.$cfg.sysfs='$sysfs'
set system.$cfg.trigger='rssi'
set system.$cfg.iface='rssid_$iface'
set system.$cfg.minq='$minq'
set system.$cfg.maxq='$maxq'
set system.$cfg.offset='$offset'
set system.$cfg.factor='$factor'
EOF
	UCIDEF_LEDS_CHANGED=1
}

ucidef_set_led_timer() {
	local cfg="led_$1"
	local name=$2
	local sysfs=$3
	local delayon=$4
	local delayoff=$5

	uci -q get system.$cfg && return 0

	uci batch <<EOF
set system.$cfg='led'
set system.$cfg.name='$name'
set system.$cfg.sysfs='$sysfs'
set system.$cfg.trigger='timer'
set system.$cfg.delayon='$delayon'
set system.$cfg.delayoff='$delayoff'
EOF
	UCIDEF_LEDS_CHANGED=1
}

ucidef_set_led_mmc() {
	local cfg="led_$1"
	local name=$2
	local sysfs=$3
	local trigger=$4

	uci -q get system.$cfg && return 0

	uci batch <<EOF
set system.$cfg='led'
set system.$cfg.name='$name'
set system.$cfg.sysfs='$sysfs'
set system.$cfg.trigger='$trigger'
EOF
	UCIDEF_LEDS_CHANGED=1
}

ucidef_set_rssimon() {
	local dev="$1"
	local refresh="$2"
	local threshold="$3"

	local cfg="rssid_$dev"

	uci -q get system.$cfg && return 0

	uci batch <<EOF
set system.$cfg='rssid'
set system.$cfg.dev='$dev'
set system.$cfg.refresh='$refresh'
set system.$cfg.threshold='$threshold'
EOF
	UCIDEF_LEDS_CHANGED=1
}

ucidef_commit_leds()
{
	[ "$UCIDEF_LEDS_CHANGED" = "1" ] && uci commit system
}

ucidef_set_interface_loopback() {
	uci batch <<EOF
set network.loopback='interface'
set network.loopback.ifname='lo'
set network.loopback.proto='static'
set network.loopback.ipaddr='127.0.0.1'
set network.loopback.netmask='255.0.0.0'
set network.globals='globals'
set network.globals.ula_prefix='auto'
EOF
}

ucidef_set_interface_relayd() {
	uci -q batch <<EOF
set network.relayd='interface'
set network.relayd.proto='relay'
set network.relayd.network='lan wan'
set network.relayd.forward_bcast='1'
set network.relayd.forward_dhcp='1'
EOF
}

ucidef_set_interface_raw() {
	local cfg=$1
	local ifname=$2
	local proto=${3:-"none"}

	uci batch <<EOF
set network.$cfg='interface'
set network.$cfg.ifname='$ifname'
set network.$cfg.proto='$proto'
EOF
}

ucidef_set_interface_lan() {
	local ifname=$1
	local board_name=$(cat /tmp/sysinfo/board_name)
	local workmode=$(cat /etc/defconfig/$board_name/workmode)
	local ac_mode=$(cat /tmp/sysinfo/ac_mode)

	case $ac_mode in
	1)
		uci batch <<EOF
set network.lan='interface'
set network.lan.ifname='$ifname'
set network.lan.force_link=1
set network.lan.type='bridge'
set network.lan.proto='static'
set network.lan.ipaddr='172.16.0.1'
set network.lan.netmask='255.255.0.0'
set network.lan.ip6assign='60'
set network.def_lan='$ifname'
EOF
		;;
	*)
		uci batch <<EOF
set network.lan='interface'
set network.lan.force_link=1
set network.lan.type='bridge'
set network.lan.proto='static'
set network.lan.ipaddr='192.254.254.254'
set network.lan.netmask='255.255.255.255'
set network.lan.ip6assign='60'
set network.def_lan='$ifname'
EOF
	;;
	esac

	case $board_name in
	cf-wr752ac)
		local ifname_wan=$2
		uci batch <<EOF
set network.lan.ifname='$ifname $ifname_wan'
set network.workmode='wisp'
EOF
		;;
	esac
}

ucidef_set_interface_wan() {
	local ifname=$1

	uci batch <<EOF
set network.wan='interface'
set network.wan.ifname='$ifname'
set network.wan.proto='dhcp'
set network.def_wan='$ifname'
EOF
	local board_name=$(cat /tmp/sysinfo/board_name)
	local workmode=$(cat /etc/defconfig/$board_name/workmode)

	case $workmode in
	 ap)
		local ifname_wan=$2
		uci batch <<EOF	
set network.wan.ifname='$ifname $ifname_wan'
set network.wan.type='bridge'
set network.workmode='ap'
EOF
		;;
	 router)
		uci batch <<EOF	
set network.wan.type='bridge'
set network.workmode='router'
EOF
		;;
	 *)
		uci batch <<EOF	
set network.wan.type='bridge'
EOF
		;;
	esac
}

ucidef_set_interfaces_lan_wan() {
	local lan_ifname=$1
	local wan_ifname=$2

	ucidef_set_interface_lan "$lan_ifname" "$wan_ifname"
	ucidef_set_interface_wan "$wan_ifname" "$lan_ifname"
}

ucidef_set_interface_macaddr() {
	local ifname=$1
	local mac=$2

	uci batch <<EOF
set network.$ifname.macaddr='$mac'
EOF
}

ucidef_set_interface_def_macaddr() {
	uci batch <<EOF
set network.def_lan_macaddr='$1'
set network.def_wan_macaddr='$2'
set network.def_wlan0_macaddr='$3'
set network.def_sta_macaddr='$4'
set network.def_wlan1_macaddr='$5'
set network.def_wlan2_macaddr='$6'
set network.def_wlan3_macaddr='$7'
set network.def_wlan4_macaddr='$8'
set network.def_wlan5_macaddr='$9'
set network.def_wlan6_macaddr='$10'
set network.def_wlan7_macaddr='$11'
set network.def_wlan8_macaddr='$12'
set network.def_wlan9_macaddr='$13'
set network.def_wlan10_macaddr='$14'
set network.def_wlan11_macaddr='$15'
set network.def_wlan12_macaddr='$16'
set network.def_wlan13_macaddr='$17'
set network.def_wlan14_macaddr='$18'
set network.def_wlan15_macaddr='$19'
EOF
}

ucidef_set_interface_def_macaddr_lan_wan() {
	uci batch <<EOF
set network.def_lan_macaddr='$1'
set network.def_wan_macaddr='$2'
EOF
}

ucidef_set_wireless_macaddr() {
	local ifname=$1
	local mac=$2

	uci batch <<EOF
set wireless.$ifname.macaddr='$mac'
EOF

	case $ifname in
	radio0)
		uci batch <<EOF
set wireless.@wifi-iface[0].macaddr='$mac'
set wireless.@wifi-iface[1].macaddr='$3'
set wireless.@wifi-iface[2].macaddr='$4'
set wireless.@wifi-iface[3].macaddr='$5'
set wireless.@wifi-iface[4].macaddr='$6'
set wireless.@wifi-iface[5].macaddr='$7'
set wireless.@wifi-iface[6].macaddr='$8'
set wireless.@wifi-iface[7].macaddr='$9'
EOF
		;;
	radio1)
		uci batch <<EOF
set wireless.@wifi-iface[8].macaddr='$mac'
set wireless.@wifi-iface[9].macaddr='$3'
set wireless.@wifi-iface[10].macaddr='$4'
set wireless.@wifi-iface[11].macaddr='$5'
set wireless.@wifi-iface[12].macaddr='$6'
set wireless.@wifi-iface[13].macaddr='$7'
set wireless.@wifi-iface[14].macaddr='$8'
set wireless.@wifi-iface[15].macaddr='$9'
EOF
		;;
	esac
}


ucidef_set_wireless_nasid() {
	local ifname=$1
	local nasid0=$2

	uci batch <<EOF
set wireless.$ifname.nasid='$nasid0'
EOF

	case $ifname in
	radio0)
		uci batch <<EOF

set wireless.@wifi-iface[0].nasid='$nasid0'
set wireless.@wifi-iface[1].nasid='$3'
set wireless.@wifi-iface[2].nasid='$4'
set wireless.@wifi-iface[3].nasid='$5'
set wireless.@wifi-iface[4].nasid='$6'
set wireless.@wifi-iface[5].nasid='$7'
set wireless.@wifi-iface[6].nasid='$8'
EOF
		;;
	radio1)
		uci batch <<EOF
set wireless.@wifi-iface[8].nasid='$nasid0'
set wireless.@wifi-iface[9].nasid='$3'
set wireless.@wifi-iface[10].nasid='$4'
set wireless.@wifi-iface[11].nasid='$5'
set wireless.@wifi-iface[12].nasid='$6'
set wireless.@wifi-iface[13].nasid='$7'
set wireless.@wifi-iface[14].nasid='$8'
EOF
		;;
	esac
}


ucidef_add_switch() {
	local name=$1
	local reset=$2
	local enable=$3
	uci batch <<EOF
add network switch
set network.@switch[-1].name='$name'
set network.@switch[-1].reset='$reset'
set network.@switch[-1].enable_vlan='$enable'
EOF
}

ucidef_add_switch_vlan() {
	local device=$1
	local vlan=$2
	local ports=$3
	uci batch <<EOF
add network switch_vlan
set network.@switch_vlan[-1].device='$device'
set network.@switch_vlan[-1].vlan='$vlan'
set network.@switch_vlan[-1].ports='$ports'
EOF
}

ucidef_add_switch_port() {
	local device=$1
	local port=$2
	uci batch <<EOF
add network switch_port
set network.@switch_port[-1].device='$device'
set network.@switch_port[-1].port='$port'
EOF
}

ucidef_set_interface_guest() {
	uci batch <<EOF
set network.guest='interface'
set network.guest.proto='none'
EOF
}

ucidef_set_interface_cluster() {
	uci batch <<EOF
set network.cluster='interface'
set network.cluster.proto='static'
set network.cluster.type='bridge'
set network.cluster.ipaddr='192.10.20.1'
set network.cluster.netmask='255.255.255.0'
EOF
}

ucidef_set_interfaces_lan_guest() {
	local ifname_lan="$1"
	local ifname_guest="$2"
	uci batch <<EOF
set network.def='def'
set network.def.def_lan='$ifname_guest $ifname_lan'
set network.def.def_lan_local='$ifname_lan'
set network.def.def_lan_guest='$ifname_guest'
EOF
}
