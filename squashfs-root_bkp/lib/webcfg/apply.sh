#!/bin/sh
include apply_call.sh
logger -t webcfg "Applying configure $CHANGED_CONFIGS"

/lib/webcfg/apply_configs &

fw_reload_flag=0
dhcpd_restart_flag=0

safe_exit() {
	[ -f /tmp/network_change ] && rm /tmp/network_change
	[ -f /tmp/common_change ] && rm /tmp/common_change
	exit 0
}

handle_fw() {
	[ -n "$1" ] && {
		/etc/fw3_reload
		fw_reload_flag=1
	}
}

handle_dhcpd() {
	[ -f /etc/init.d/dhcpd ] && rm -f /tmp/dhcpd.leases && rm -f /tmp/dhcpd.leases~ && /etc/init.d/dhcpd restart &
	dhcpd_restart_flag=1
}

handle_ifup_wan() {
	[ -f /etc/wan_list ] && {
		wan_list=`cat /etc/wan_list`
		for iface in $wan_list ; do
			ifup $iface
		done
	}
	[ -f /etc/wan_list ] || ifup wan
}

handle_for_user_list(){
	local setting_flag="deny"
	local wlan_index=0
	local end_iface=7
	local user_list=`cat /etc/user_list_change`

	[ -z "$user_list" ] && return

	local work_mode_flag=`cat /tmp/status/workmode`
	[ "$work_mode_flag" == "router" -o "$work_mode_flag" == "wisp" -o "$work_mode_flag" == "wisp_c" ] && setting_flag="disable"
	[ -e "/sys/kernel/debug/ieee80211/phy1" ] && end_iface=15
	while [ $wlan_index -le $end_iface ]; do
	  uci set wireless.@wifi-iface[$wlan_index].macfilter=$setting_flag
	  let wlan_index++
	done
	uci commit
}

for cfg in $CHANGED_CONFIGS ; do 
	[ $cfg = "network" ] && {
		logger -t webcfg "Reloading network..."
		[ -e "/usr/bin/cluster_udp" ] && {
			touch /tmp/cluster_config_changed
			while [  -e "/tmp/cluster_config_changed"  ]; do
			sleep 1
			done;
		}

		net_chag=`cat /tmp/network_change`
		[ -f /tmp/network_change ] && rm /tmp/network_change
		lanip_flag=`echo $net_chag | grep lanip`
		workmode_flag=`echo $net_chag | grep workmode`
		firewall_exist=`echo "$CHANGED_CONFIGS" |grep firewall`
		portal_flag=`echo $net_chag | grep portal`

		[ -n "$workmode_flag" -a -e "/etc/user_list_change" ] && {
		     handle_for_user_list
		}

		[ -n "$workmode_flag" -o -n "$portal_flag" ] && {
			/etc/init.d/network restartall
			safe_exit
		}
		[ -n "$lanip_flag" ] && {
			[ -f /etc/init.d/dhcpd ] && {
				touch /tmp/changeIP
			}
			[ -f /tmp/sysinfo/noswitch ] && {
				ifname=`cat /tmp/ifname`
				for iface in $ifname ; do
					ifconfig $iface down
					ifconfig $iface up
				done
				ubus call network reload
				sleep 2
			}
			[ -f /tmp/sysinfo/noswitch ] || {
				[ -f /etc/init.d/network ] && /etc/init.d/network restart
				sleep 5
			}
			
			handle_dhcpd
			[ -f /etc/init.d/wifidog ] && /etc/init.d/wifidog restart
			[ -f /etc/init.d/arp_set ] && /etc/init.d/arp_set restart
			[ -f /etc/init.d/remote ] && /etc/init.d/remote restart
		}
		[ $net_chag = "wan" ] && {
			[ -f /tmp/ifname ] && {
				iface=`cat /tmp/ifname`
				ifconfig $iface down
				sleep 2
				ifconfig $iface up
			}
			ubus call network reload
			sleep 5
			fw_reload_flag=1
			handle_dhcpd
			[ -f /etc/init.d/customqos ] && /etc/init.d/customqos restart
			[ -f /etc/init.d/dnsmasq ] && /etc/init.d/dnsmasq restart
		}
		[ $net_chag = "vlan" ] && {
			swconfig dev switch0 load network
			ubus call network reload
			[ -f /tmp/sysinfo/noswitch ] || swconfig dev switch0 load vlan
			sleep 2
			handle_fw $firewall_exist
			handle_dhcpd
			[ -f /etc/init.d/wifidog ] && /etc/init.d/wifidog restart
			[ -f /etc/init.d/arp_set ] && /etc/init.d/arp_set restart
			[ -f /etc/init.d/remote ] && /etc/init.d/remote restart
			[ -f /etc/init.d/customqos ] && /etc/init.d/customqos restart
		}
		[ $net_chag = "portal&&wifilith" ] && {
			ubus call network reload
			handle_dhcpd
			handle_fw $firewall_exist
		}
		[ $net_chag = "vpn" -o $net_chag = "portal" -o $net_chag = "laniface" -o $net_chag = "waniface" ] && {
			ubus call network reload
			handle_dhcpd
			[ $net_chag = "laniface" -o $net_chag = "waniface" ] && {
				[ -f /etc/init.d/arp_set ] && /etc/init.d/arp_set restart
				[ $net_chag = "laniface" ] && [ -f "/tmp/sysinfo/noswitch" ] || swconfig dev switch0 load vlan
			}
			[ $net_chag = "vpn" ] && {
				ifup wan
			}
		}
		[ $net_chag = "wanpolicyroute" ] && {
			ubus call network reload
			[ -f /usr/sbin/mwanflushrule ] && /usr/sbin/mwanflushrule
			handle_dhcpd
		}
		[ $net_chag = "dns" ] && {
			ubus call network reload
			/etc/init.d/dnsmasq restart
			handle_dhcpd
		}
		[ $net_chag = "static_route" ] && {
			ubus call network reload
			handle_ifup_wan
			handle_dhcpd
		}
		continue;
	}

	[ $cfg = "dhcpd" ] && {
		[ $dhcpd_restart_flag = "1" ] || {
			logger -t webcfg "Restarting DHCPD services..."
			/etc/init.d/dhcpd restart
		}
		continue;
	}

	[ $cfg = "dhcp" ] && {
		network_exist=`echo "$CHANGED_CONFIGS" |grep network`
		[ -z "$network_exist" ] && {
			logger -t webcfg "Restarting DHCP services..."
			/etc/init.d/dnsmasq restart
		}
		continue;
	}

	[ $cfg = "wireless" ] && {
		[ -e "/usr/bin/cluster_udp" ] && {
			touch /tmp/cluster_config_changed
			while [  -e "/tmp/cluster_config_changed"  ]; do
				sleep 1
			done;
		}
		logger -t webcfg "Restarting wifi..."
		wifi
		[ -e /etc/init.d/wireless ] && /etc/init.d/wireless restart
		continue;
	}

	[ $cfg = "pptpd" ] && {
		logger -t webcfg "Restarting PPTPD and FIREWALL services..."
		/etc/init.d/pptpd restart
		handle_ifup_wan
		continue;
	}

	[ $cfg = "mwan3" ] && {
		firewall_exist=`echo "$CHANGED_CONFIGS" |grep firewall`
		[ -z "$firewall_exist" ] && {
			logger -t webcfg "Restarting MWAN services..."
			/usr/sbin/mwan3 restart
		}
		continue;
	}

	[ $cfg = "firewall" ] && {
		[ $net_chag = "vpn" -o -n "$lanip_flag" ] && sleep 15
		[ $fw_reload_flag = "1" ] || {
			logger -t webcfg "Restarting FIREWALL services..."
			/etc/init.d/firewall restartall
		}
		safe_exit
	}

	[ $cfg = "admin" ] && {
		logger -t webcfg "Restarting ADMIN services..."
		safe_exit
	}
	
	[ $cfg = "ntp" ] && {
		logger -t webcfg "Restarting NTP and SYSTEM services..."
		/etc/init.d/sysntpd restart
		/etc/init.d/system restart
		safe_exit
	}

	[ $cfg = "kickout" ] && {
		logger -t webcfg "Restarting kickout services..."
		/etc/init.d/kickout_sh restart
		safe_exit
	}

	[ $cfg = "system" ] && {
		logger -t webcfg "Restarting system services..."
		sys_chag=`cat /tmp/system_change`
		[ -f /tmp/system_change ] && {
			sleep 5
			rm /tmp/system_change
		}
		[ $sys_chag = "ac_group" ] && {
			touch /tmp/ac_group_changed
		}
		[ $sys_chag = "ap_config" ] && {
			touch /tmp/ac_group_changed
			touch /tmp/ap_config_changed
		}
		[ $sys_chag = "ap_upgrade" ] && {
			touch /tmp/ap_upgrade_member_changed
		}
		[ $sys_chag = "wtpd_restart" ] && {
			/etc/init.d/wtpd restart
		}
		[ $sys_chag = "wtpd_lan_ac_network_restart" ] && {
			/etc/init.d/wtpd restart && sleep 5
			/etc/init.d/network restart
		}
		safe_exit
	}

	[ $cfg = "probe" ] && {
		/etc/init.d/probe_init restart
		logger -t webcfg "Restarting PROBE services..."
		safe_exit
	}

	[ $cfg = "firmware" ] && {
		logger -t webcfg "Restarting FIREWARE services..."
		safe_exit
	}

	[ $cfg = "ddns" ] && {
		logger -t webcfg "Restarting DDNS services..."
		/etc/init.d/ddns restart
		safe_exit
	}

	[ $cfg = "upnpd" ] && {
		logger -t webcfg "Restarting UPNP services..."
		/etc/init.d/miniupnpd restart
		safe_exit
	}

	[ $cfg = "vpns_pptp" ] && {
		logger -t webcfg "Restarting VPN server PPTP services..."
		/etc/init.d/pptpd restart
		safe_exit
	}

	[ $cfg = "arp" ] && {
		logger -t webcfg "Restarting ARP services..."
		network_exist=`echo "$CHANGED_CONFIGS" |grep network`
		[ -z "$network_exist" ] && {
			[ -f /etc/init.d/arp_set ] && /etc/init.d/arp_set restart
			[ -f /etc/init.d/dnsmasq ] && /etc/init.d/dnsmasq restart
			[ -f /etc/init.d/dhcpd ] && /etc/init.d/dhcpd restart
		}
		safe_exit
	}

	[ $cfg = "wifilith" ] && {
		logger -t webcfg "Restarting PORTAL services..."
		/etc/init.d/wifilith restart
		[ -f /tmp/wifilith_change ] && {
			wifilith_chag=`cat /tmp/wifilith_change`
			rm /tmp/wifilith_change
		}
		[ $wifilith_chag = "radius" ] && {
			[ -f /etc/init.d/radius_h_b ] && /etc/init.d/radius_h_b restart
			[ -f /etc/init.d/radius_coa ] && /etc/init.d/radius_coa restart
		}
		safe_exit
	}

	[ $cfg = "wifidog" ] && {
		logger -t webcfg "Restarting wifidog services..."
		/etc/init.d/wifidog restart
		safe_exit
	}

	[ $cfg = "qos_custom" ] && {
		logger -t webcfg "Restarting qos_custom services..."
		/etc/init.d/customqos restart
		safe_exit
	}

	[ $cfg = "remote" ] && {
		remote_chag=`cat /tmp/remote_change`
		[ -f /tmp/remote_change ] && rm /tmp/remote_change
		[ $remote_chag = "remote" ] && {
			logger -t webcfg "Restarting remote services..."
			/etc/init.d/remote restart
		}
		[ $remote_chag = "remote_control" ] && {
			logger -t webcfg "remote control config..."
			[ -f /sbin/remote_control ] && /sbin/remote_control
		}
		safe_exit
	}

	[ $cfg = "login" ] && {
		logger -t webcfg "Restarting login services..."
		safe_exit
	}

	[ $cfg = "restore" ] && {
		logger -t webcfg "Restore system..."
		jffs2reset -y && sleep 1 && reboot
		safe_exit
	}

	[ $cfg = "reboot" ] && {
		logger -t webcfg "Reboot system..."
		reboot
		safe_exit
	}

	[ $cfg = "cluster" ] && {
		logger -t webcfg "cluster config..."
		safe_exit
	}

	[ $cfg = "common" ] && {
		logger -t webcfg "common config..."
		com_chag=`cat /tmp/common_change`
		[ -f /tmp/common_change ] && rm /tmp/common_change
		[ $com_chag = "wandirroute" ] && {
			[ -f /usr/sbin/direc-route ] && /usr/sbin/direc-route reset
		}
		[ $com_chag = "timing_redial" ] && {
			[ -f /etc/init.d/cron ] && /etc/init.d/cron restart &
		}
		[ $com_chag = "timing_reboot" ] && {
			[ -f /sbin/timing-reboot ] && /sbin/timing-reboot &
		}
		[ $com_chag = "schedule_radio" ] && {
			[ -f /etc/init.d/schedule ] && /etc/init.d/schedule restart 
		}
		safe_exit
	}
	
	[ $cfg = "led" ] && {
		logger -t webcfg "led config..."
		/etc/init.d/led restart
		[ -f /etc/init.d/ledctrl ] && /etc/init.d/ledctrl restart
		safe_exit
	}

done
safe_exit

