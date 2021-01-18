#!/bin/sh
#
# Copyright (C) 2010-2013 OpenWrt.org
#

RAMIPS_BOARD_NAME=
RAMIPS_MODEL=

reset_by_uboot() {
	local dev
	local reset_flag
	local erase_desc="erase"

	dev=$(find_mtd_part "configs")
	reset_flag=`dd if=$dev bs=1 skip=0 count=5 2>/dev/null | hexdump -v -e '1/1 "%c"'| strings`
	if [ "$reset_flag" == "$erase_desc" ]
	then
		mtd erase rootfs_data
		mtd erase configs
	fi
}

generic_register_file() {
	local dev
	local register_flag
	local register_desc="ff"

	dev=$(find_mtd_part "factory")
	register_flag=`dd if=$dev bs=1 skip=3988 count=1 2>/dev/null | hexdump -v -e '1/1 "%02x:"'| sed '$s/.$//'`
	if [ "$register_flag" != "$register_desc" ]
	then
		echo $register_flag > /tmp/sysinfo/unregister
	fi
}

ramips_hwinfo() {
	local dev
	local new_board_name
	local new_board_name_uppercase
	local new_model
	local new_version
	local version

	version=`cat /etc/defconfig/$RAMIPS_BOARD_NAME/version`
	echo "$version" > /tmp/sysinfo/hwrev
	dev=$(find_mtd_part "factory")

#	support replace board name and model by uboot, at the same time should modify version descption.
	new_board_name=`dd if=$dev bs=1 skip=1024 count=256 2>/dev/null | hexdump -v -e '1/1 "%c"'| strings`
	new_model=`dd if=$dev bs=1 skip=1280 count=256 2>/dev/null | hexdump -v -e '1/1 "%c"'| strings`
	[ -z "$new_board_name" ] || {
		echo "$new_board_name" > /tmp/sysinfo/board_name
		echo "$new_model" > /tmp/sysinfo/model
		new_version=V${version##*-V}
		new_board_name_uppercase=`echo "$new_model" | cut -f2 -d ' '`
		echo "${new_board_name_uppercase}-${new_version}" > /tmp/sysinfo/hwrev
	}
}

ramips_board_detect() {
	local machine
	local name
	local def_wan
	local port_sum
	local port_list
	local ifname_list
	local vlan_support
	local vlan_min
	local vlan_max
	local vlan_board_type
	local vlan_qinq_support
	local vlan_multiple_port
	local vlan_wireless
	local vlan_switch
	local ssid_vid_min
	local ssid_vid_max
	local ip
	local reboot_time
	local factory_time
	local upgrade_time
	local mlan
	local mwan
	local multi_pppoe_num
	local board_type
	local ac_mode

	machine=$(awk 'BEGIN{FS="[ \t]+:[ \t]"} /machine/ {print $2}' /proc/cpuinfo)

	case "$machine" in
	*"7Links PX-4885")
		name="px4885"
		;;
	*"8devices Carambola")
		name="carambola"
		;;
	*"Edimax 3g-6200n")
		name="3g-6200n"
		;;
	*"Edimax 3g-6200nl")
		name="3g-6200nl"
		;;
	*"A5-V11")
		name="a5-v11"
		;;
	*"Aigale Ai-BR100")
		name="ai-br100"
		;;
	*"Airlink101 AR670W")
		name="ar670w"
		;;
	*"Airlink101 AR725W")
		name="ar725w"
		;;
	*"AirLive Air3GII")
		name="air3gii"
		;;
	*"Edimax BR-6425")
		name="br6425"
		;;
	*"Allnet ALL0239-3G")
		name="all0239-3g"
		;;
	*"Allnet ALL0256N")
		name="all0256n"
		;;
	*"Allnet ALL5002")
		name="all5002"
		;;
	*"Allnet ALL5003")
		name="all5003"
		;;
	*"ARC FreeStation5")
		name="freestation5"
		;;
	*"Archer C20i")
		name="c20i"
		;;
	*"Argus ATP-52B")
		name="argus-atp52b"
		;;
	*"AsiaRF AWM002 EVB")
		name="awm002-evb"
		;;
	*"AsiaRF AWM003 EVB")
		name="awm003-evb"
		;;
	*"AsiaRF AWAPN2403")
		name="awapn2403"
		;;
	*"Asus WL-330N")
		name="wl-330n"
		;;
	*"Asus WL-330N3G")
		name="wl-330n3g"
		;;
	*"Alpha ASL26555")
		name="asl26555"
		;;
	*"Aztech HW550-3G")
		name="hw550-3g"
		;;
	*"Buffalo WSR-600DHP")
		name="wsr-600"
		;;
	*"Buffalo WSR-1166DHP")
		name="wsr-1166"
		;;
	*"Firefly FireWRT")
		name="firewrt"
		;;
	*"CF-AC100" | \
	*"CF-AC101" | \
	*"CF-AC200")
		case "$machine" in
			*"CF-AC100")
				name="cf-ac100"
				multi_pppoe_num="2"
				;;
			*"CF-AC101")
				name="cf-ac101"
				multi_pppoe_num="2"
				;;
			*"CF-AC200")
				name="cf-ac200"
				multi_pppoe_num="4"
				;;
		esac
		ac_mode=1
		def_wan="switch0"
		port_sum="5"
		port_list="switch0,switch1,switch2,switch3,switch4,"
		ifname_list="eth0.1,eth0.2,eth0.3,eth0.4,eth0.5,"
		ip="10.10.11.1"
		reboot_time="55"
		factory_time="90"
		upgrade_time="180"
		vlan_support=1
		vlan_min="6"
		vlan_max="127"
		vlan_board_type="line"
		vlan_qinq_support="1"
		vlan_multiple_port="1"
		vlan_wireless="0"
		vlan_switch="1"
		board_type="ramips_mt7621"
		mlan=1
		mwan=1
		ssid_vid_min="6"
		ssid_vid_max="127"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_5_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_4_macaddr=$(macaddr_add "$lan_mac" 1)
		def_eth0_3_macaddr=$(macaddr_add "$lan_mac" 2)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 3)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 4)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo $def_eth0_3_macaddr > /tmp/sysinfo/defaultmac/eth0.3
		echo $def_eth0_4_macaddr > /tmp/sysinfo/defaultmac/eth0.4
		echo $def_eth0_5_macaddr > /tmp/sysinfo/defaultmac/eth0.5
		;;
	*"CF-E320N")
		name="cf-e320n"
		;;
	*"CF-E330N")
		name="cf-e330n"
		;;
	*"CF-E500N")
		name="cf-e500n"
		;;
	*"CF-E510N")
		name="cf-e510n"
		;;
	*"CF-WR305N")
		name="cf-wr305n"
		def_wan="switch0"
		port_sum="1"
		port_list="switch4,"
		ifname_list="eth0.1"
		ip="192.168.10.1"
		reboot_time="50"
		factory_time="50"
		upgrade_time="100"
		board_type="ar71xx"
		wan_switch_port="4"
		lan_switch_port="4"
		;;
	*"CF-WR380AC")
		name="cf-wr380ac"
		;;
	*"CF-WR618AC")
		name="cf-wr618ac"
		ac_mode=1
		def_wan="switch0"
		port_sum="5"
		port_list="switch0,switch1,switch2,switch3,switch4,"
		ifname_list="eth0.1,eth0.2,eth0.3,eth0.4,eth0.5,"
		ip="172.16.0.1"
		reboot_time="50"
		factory_time="50"
		upgrade_time="200"
		vlan_support=1
		vlan_min="6"
		vlan_max="127"
		vlan_board_type="line"
		vlan_qinq_support="1"
		vlan_multiple_port="1"
		vlan_wireless="0"
		vlan_switch="1"
		board_type="ramips_mt7621"
		mlan=1
		mwan=1
		ssid_vid_min="6"
		ssid_vid_max="127"
		multi_pppoe_num="2"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_5_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_4_macaddr=$(macaddr_add "$lan_mac" 1)
		def_eth0_3_macaddr=$(macaddr_add "$lan_mac" 2)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 3)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 4)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo $def_eth0_3_macaddr > /tmp/sysinfo/defaultmac/eth0.3
		echo $def_eth0_4_macaddr > /tmp/sysinfo/defaultmac/eth0.4
		echo $def_eth0_5_macaddr > /tmp/sysinfo/defaultmac/eth0.5
		echo $name >  /tmp/sysinfo/mt7615e
		echo "mtk" > /tmp/sysinfo/driver_tpye
		;;
	*"CF-WR620N")
		name="cf-wr620n"
		def_wan="switch0"
		port_sum="5"
		port_list="switch0,switch1,switch2,switch3,switch4,"
		ifname_list="eth0.2,eth0.1,eth0.1,eth0.1,eth0.1,"
		ip="172.16.0.1"
		reboot_time="50"
		factory_time="50"
		upgrade_time="200"
		vlan_support=1
		vlan_min="3"
		vlan_max="15"
		vlan_board_type="port"
		vlan_multiple_port="1"
		vlan_wireless="1"
		vlan_switch="1"
		ssid_vid_min="3"
		ssid_vid_max="15"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo "1" > /tmp/sysinfo/admin_wifi_exist
		;;
	*"CF-WR625AC")
		name="cf-wr625ac"
		;;
	*"CF-WR627N")
		name="cf-wr627n"
		def_wan="switch4"
		port_sum="4"
		port_list="switch4,switch3,switch2,switch1,switch0,"
		ifname_list="eth0.2,eth0.1,eth0.1,eth0.1,"
		ip="192.168.10.1"
		reboot_time="80"
		factory_time="80"
		upgrade_time="120"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo "1" > /tmp/sysinfo/admin_wifi_exist
		echo "1" > /tmp/sysinfo/mt7628_chip
		;;
	*"CF-WR752ACV2")
		name="cf-wr752acv2"
		def_wan="switch0"
		port_sum="1"
		port_list="switch4,"
		ifname_list="eth0.2,eth0.1,"
		ip="192.168.10.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7628"
		wan_switch_port="4"
		lan_switch_port="4"
		lan_mac=$(cat /sys/class/net/eth0/address)
		;;
	*"CF-WR753AC")
		name="cf-wr753ac"
		def_wan="switch0"
		port_sum="1"
		port_list="switch1,"
		ifname_list="eth0.1,eth0.2,"
		ip="192.168.10.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7620"
		lan_mac=$(cat /sys/class/net/eth0/address)
		;;
	*"CF-WR754AC")
		name="cf-wr754ac"
		def_wan="switch0"
		port_sum="2"
		port_list="switch4,switch3,"
		ifname_list="eth0.2,eth0.1,"
		ip="192.168.10.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7628"
		wan_switch_port="4"
		lan_switch_port="4"
		lan_mac=$(cat /sys/class/net/eth0/address)
		;;
	*"CF-WR755AC")
		name="cf-wr755ac"
		def_wan="switch0"
		port_sum="1"
		port_list="switch4,"
		ifname_list="eth0.2,eth0.1,"
		ip="192.168.10.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7628"
		wan_switch_port="4"
		lan_switch_port="4"
		lan_mac=$(cat /sys/class/net/eth0/address)
		;;
	*"CF-WR800N")
		name="cf-wr800n"
		;;
	*"CY-SWR1100")
		name="cy-swr1100"
		;;
	*"DCS-930")
		name="dcs-930"
		;;
	*"DIR-300 B1")
		name="dir-300-b1"
		;;
	*"DIR-300 B7")
		name="dir-300-b7"
		;;
	*"DIR-320 B1")
		name="dir-320-b1"
		;;
	*"DIR-600 B1")
		name="dir-600-b1"
		;;
	*"DIR-600 B2")
		name="dir-600-b2"
		;;
	*"DIR-610 A1")
		name="dir-610-a1"
		;;
	*"DIR-620 A1")
		name="dir-620-a1"
		;;
	*"DIR-620 D1")
		name="dir-620-d1"
		;;
	*"DIR-615 H1")
		name="dir-615-h1"
		;;
	*"DIR-615 D")
		name="dir-615-d"
		;;
	*"DIR-645")
		name="dir-645"
		;;
	*"DIR-810L")
		name="dir-810l"
		;;
	*"DIR-860L B1")
		name="dir-860l-b1"
		;;
	*"DAP-1350")
		name="dap-1350"
		;;
	*"ESR-9753")
		name="esr-9753"
		;;
	*"EASYACC WI-STOR WIZARD 8800")
		name="wizard8800"
		;;
	*"Edimax BR-6475nD")
		name="br-6475nd"
		;;
	*"F7C027")
		name="f7c027"
		;;
	*"F5D8235 v1")
		name="f5d8235-v1"
		;;
	*"F5D8235 v2")
		name="f5d8235-v2"
		;;
	*"Hauppauge Broadway")
		name="broadway"
		;;
	*"Huawei D105")
		name="d105"
		;;
	*"La Fonera 2.0N")
		name="fonera20n"
		;;
	*"Asus RT-N14U")
		name="rt-n14u"
		;;
	*"Asus RT-N13U")
		name="rt-n13u"
		;;
	*"MoFi Network MOFI3500-3GN")
		name="mofi3500-3gn"
		;;
	*"HILINK HLK-RM04")
		name="hlk-rm04"
		;;
	*"HooToo HT-TM02")
		name="ht-tm02"
		;;
	*"HAME MPR-A1")
 		name="mpr-a1"
 		;;
	*"HAME MPR-A2")
 		name="mpr-a2"
 		;;
	*"Kingston MLW221")
		name="mlw221"
		;;
	*"Kingston MLWG2")
		name="mlwg2"
		;;
	*"Linksys E1700")
		name="e1700"
		;;
	*"Planex MZK-750DHP")
		name="mzk-750dhp"
		;;
	*"NBG-419N")
		name="nbg-419n"
		;;
	*"Netgear WNCE2001")
		name="wnce2001"
		;;
	*"NexAira BC2")
		name="bc2"
		;;
	*"Nexx WT1520")
		name="wt1520"
		;;
	*"Nexx WT3020")
		name="wt3020"
		;;
	*"NW718")
		name="nw718"
		;;
	*"Intenso Memory 2 Move")
		name="m2m"
		;;
	*"Omnima EMB HPM")
		name="omni-emb-hpm"
		;;
	*"Omnima MiniEMBWiFi")
		name="omni-emb"
		;;
	*"Omnima MiniPlug")
		name="omni-plug"
		;;
	*"Petatel PSR-680W"*)
		name="psr-680w"
		;;
	*"Planex MZK-W300NH2"*)
		name="mzk-w300nh2"
		;;
	*"Poray IP2202")
		name="ip2202"
		;;
	*"Poray M3")
		name="m3"
		;;
	*"Poray M4")
		name="m4"
		;;
	*"Poray X5")
		name="x5"
		;;
	*"Poray X8")
		name="x8"
		;;
	*"PWH2004")
		name="pwh2004"
		;;
	*"Asus RP-N53")
		name="rp-n53"
		;;
	*"Ralink MT7620a + MT7530 evaluation board")
		name="mt7620a_mt7530"
		;;
	*"RT-G32 B1")
		name="rt-g32-b1"
		;;
	*"RT-N10+")
		name="rt-n10-plus"
		;;
	*"RT-N15")
		name="rt-n15"
		;;
	*"RT-N56U")
		name="rt-n56u"
		;;
	*"RUT5XX")
		name="rut5xx"
		;;
	*"Skyline SL-R7205"*)
		name="sl-r7205"
		;;
	*"Sparklan WCR-150GN")
		name="wcr-150gn"
		;;
	*"V22RW-2X2")
		name="v22rw-2x2"
		;;
	*"VoCore")
		name="vocore"
		;;
	*"W502U")
		name="w502u"
		;;
	*"WMR-300")
		name="wmr300"
		;;
	*"WHR-300HP2")
		name="whr-300hp2"
		;;
	*"WHR-600D")
		name="whr-600d"
		;;
	*"WHR-1166D")
		name="whr-1166d"
		;;
	*"WHR-G300N")
		name="whr-g300n"
		;;
	*"Sitecom WL-341 v3")
		name="wl341v3"
		;;
	*"Sitecom WL-351 v1 002")
		name="wl-351"
		;;
	*"Tenda 3G300M")
		name="3g300m"
		;;
	*"Tenda 3G150B")
		name="3g150b"
		;;
	*"Tenda W306R V2.0")
		name="w306r-v20"
		;;
	*"Tenda W150M")
		name="w150m"
		;;
	*"TEW-691GR")
		name="tew-691gr"
		;;
	*"TEW-692GR")
		name="tew-692gr"
		;;
	*"Ralink V11ST-FE")
		name="v11st-fe"
		;;
	*"WLI-TX4-AG300N")
		name="wli-tx4-ag300n"
		;;
	*"WZR-AGL300NH")
		name="wzr-agl300nh"
		;;
	*"WR512-3GN-like router")
		name="wr512-3gn"
		;;
	*"UR-326N4G Wireless N router")
		name="ur-326n4g"
		;;
	*"UR-336UN Wireless N router")
		name="ur-336un"
		;;
	*"AWB WR6202")
		name="wr6202"
		;;
	*"XDX RN502J")
		name="xdxrn502j"
		;;
	*"HG255D")
		name="hg255d"
		;;
	*"V22SG")
		name="v22sg"
		;;
	*"WRTNODE")
		name="wrtnode"
		;;
	*"Wansview NCS601W")
		name="ncs601w"
		;;
	*"Xiaomi MiWiFi Mini")
		name="xiaomi-miwifi-mini"
		;;
	*"Sercomm NA930")
		name="na930"
		;;
	*"Zbtlink ZBT-WA05")
		name="zbt-wa05"
		;;
	*"ZBT WR8305RT")
		name="wr8305rt"
		;;
	*"Lenovo Y1")
		name="y1"
		;;
	*"Lenovo Y1S")
		name="y1s"
		;;
	*"Mediatek MT7621 evaluation board")
		name="mt7621"
		;;
	*"Mediatek MT7628AN evaluation board")
		name="mt7628"
		;;
	*)
		name="generic"
		;;
	esac

	[ -z "$RAMIPS_BOARD_NAME" ] && RAMIPS_BOARD_NAME="$name"
	[ -z "$RAMIPS_MODEL" ] && RAMIPS_MODEL="$machine"

	[ -e "/tmp/sysinfo/" ] || mkdir -p "/tmp/sysinfo/"

	echo "$RAMIPS_BOARD_NAME" > /tmp/sysinfo/board_name
	echo "$RAMIPS_MODEL" > /tmp/sysinfo/model

	[ -n "$board_type" ] && echo -e "board_type=${board_type}\n" > /tmp/sysinfo/detect_wan_by_port
	[ -n "$ac_mode" ] && echo -e "$ac_mode" > /tmp/sysinfo/ac_mode
	[ -n "$board_type" ] && [ -n "$wan_switch_port" ] && {
		echo -e "board_type=${board_type}\nwan_switch_port=${wan_switch_port}\nlan_switch_port=${lan_switch_port}\n" > /tmp/sysinfo/detect_wan_by_port
	}
	[ -n "$def_wan" ] && [ -n "$port_sum" ] && [ -n "$port_list" ] && [ -n "$ifname_list" ] && {
		echo -e "def_wan=${def_wan}\nport_sum=${port_sum}\nport_list=${port_list}\nifname_list=${ifname_list}" >> /tmp/sysinfo/port_info
	}
	[ -n "$ip" ] && [ -n "$reboot_time" ] && [ -n "$factory_time" ] && [ -n "$upgrade_time" ] && {
		echo -e "ip:${ip}\nreboot_time:${reboot_time}\nfactory_time:${factory_time}\nupgrade_time:${upgrade_time}" > /tmp/sysinfo/common_config
	}
	[ -n "$multi_pppoe_num" ] && {
		echo -e "multi_pppoe_num:${multi_pppoe_num}" >> /tmp/sysinfo/common_config
	}
	[ -n "$vlan_support" ] && {
		echo -e "vlan_min=${vlan_min}\nvlan_max=${vlan_max}\nvlan_board_type=${vlan_board_type}\nvlan_qinq_support=${vlan_qinq_support}" > /tmp/sysinfo/vlan
		echo -e "vlan_multiple_port=${vlan_multiple_port}\nvlan_wireless=${vlan_wireless}\nvlan_switch=${vlan_switch}" >> /tmp/sysinfo/vlan
		echo -e "ssid_vid_min=${ssid_vid_min}\nssid_vid_max=${ssid_vid_max}" > /tmp/sysinfo/ssid_vid
	}
	[ -n "$mlan" ] && echo -e "$mlan" > /tmp/sysinfo/mlan
	[ -n "$mwan" ] && echo -e "$mwan" > /tmp/sysinfo/mwan
	[ -n "$lan_mac" ] && echo $lan_mac > /tmp/sysinfo/mac
	case $RAMIPS_BOARD_NAME in
	cf-e320n)
		echo 30 >> /tmp/sysinfo/txpower
		;;

	cf-e330n | \
	cf-wr620n)
		echo 18 >> /tmp/sysinfo/txpower
		;;

	cf-wr618ac)
		echo "mtk" > /tmp/sysinfo/driver_tpye
		;;

	#chip_type "1" is mtk project
	#light_type "1" is CF-WR754AC LIGHT, "2" is CF-WR627N LIGHT, "3" is CF-WR755AC
	#mode_switch "1" is CF-WR754AC MODE SWITCH
	#driver_type "mtk" is mtk driver, other is "openwrt"
	#ssid_type "1" is single ssid, "2" is multi ssid
	cf-wr627n)
		touch /tmp/sysinfo/repeater
		echo "1" > /tmp/sysinfo/chip_type
		echo "2" > /tmp/sysinfo/light_type
		echo "2" > /tmp/sysinfo/ssid_type
		;;
	cf-wr752acv2)
		touch /tmp/sysinfo/repeater
		echo "1" > /tmp/sysinfo/light_type
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "1" > /tmp/sysinfo/ssid_type
		;;
	cf-wr753ac)
		touch /tmp/sysinfo/repeater
		echo "1" > /tmp/sysinfo/light_type
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "1" > /tmp/sysinfo/ssid_type
		;;
	cf-wr754ac)
		touch /tmp/sysinfo/repeater
		echo "1" > /tmp/sysinfo/mode_switch
		echo "1" > /tmp/sysinfo/light_type
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "1" > /tmp/sysinfo/ssid_type
		;;
	cf-wr755ac)
		touch /tmp/sysinfo/repeater
		echo "3" > /tmp/sysinfo/light_type
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "1" > /tmp/sysinfo/ssid_type
		;;
	*)
		echo 25 >> /tmp/sysinfo/txpower
		;;
	esac

	ramips_hwinfo
	reset_by_uboot
	generic_register_file
}

ramips_board_name() {
	local name

	[ -f /tmp/sysinfo/board_name ] && name=$(cat /tmp/sysinfo/board_name)
	[ -z "$name" ] && name="unknown"
	
	echo "$name"
}
