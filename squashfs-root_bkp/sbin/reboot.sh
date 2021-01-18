#!/bin/sh

backup_radius_user_config() {
	[ -f /tmp/radius_user ] && {
		cp /tmp/radius_user /etc/ -r
	}
}

set_time() {

	today=`date +"%Y%m%d %H:%M:%S"`

	year=`echo $today|cut -c 1-4`
	month=`echo $today|cut -c 5-6`
	day=`echo $today|cut -c 7-8`

	hour=`echo $today|cut -c 10-11`
	min=`echo $today|cut -c 13-14`
	sec=`echo $today|cut -c 16-17`

	time=$year"-"$month"-"$day"x"$hour":"$min":"$sec
	echo $time >> /reboot_time
	uci set common.time=$time
	uci commit common
}

reboot_action() {
	backup_radius_user_config
	set_time
	reboot
}

timing() {
	reboot_action
}

interval() {
	[ -f /tmp/time_index ] || echo 0 > /tmp/time_index
	index=`cat /tmp/time_index`
	let index++
	echo $index > /tmp/time_index
	interval_time=`uci get common.reboot.interval_time`
	[ $index -ge $interval_time ] && {
		reboot_action
	}
}

[ $1 = "timing_reboot" ] && timing
[ $1 = "interval_reboot" ] && interval

exit 0
