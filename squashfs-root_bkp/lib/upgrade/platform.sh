#
# Copyright (C) 2010 OpenWrt.org
#

. /lib/ramips.sh

PART_NAME=firmware
RAMFS_COPY_DATA=/lib/ramips.sh

platform_check_image() {
	local board=$(ramips_board_name)
	local magic="$(get_magic_long "$1")"

	[ "$#" -gt 1 ] && return 1

	case "$board" in
	3g-6200n | \
	3g-6200nl | \
	3g150b | \
	3g300m | \
	a5-v11 | \
	air3gii | \
	ai-br100 |\
	all0239-3g | \
	all0256n | \
	all5002 | \
	all5003 | \
	ar725w | \
	asl26555 | \
	awapn2403 | \
	awm002-evb | \
	awm003-evb | \
	bc2 | \
	broadway | \
	cf-ac100 | \
	cf-ac101 | \
	cf-ac200 | \
	cf-e320n | \
	cf-e330n | \
	cf-e500n | \
	cf-e510n | \
	cf-wr305n | \
	cf-wr380ac | \
	cf-wr627n | \
	cf-wr618ac | \
	cf-wr620n | \
	cf-wr625ac | \
	cf-wr752acv2 | \
	cf-wr753ac | \
	cf-wr754ac | \
	cf-wr755ac | \
	cf-wr800n | \
	carambola | \
	d105 | \
	dap-1350 | \
	dcs-930 | \
	dir-300-b1 | \
	dir-300-b7 | \
	dir-320-b1 | \
	dir-600-b1 | \
	dir-600-b2 | \
	dir-615-d | \
	dir-615-h1 | \
	dir-620-a1 | \
	dir-620-d1 | \
	dir-810l | \
	e1700 | \
	esr-9753 | \
	f7c027 | \
	fonera20n | \
	freestation5 | \
	firewrt |\
	hg255d | \
	hlk-rm04 | \
	ht-tm02 | \
	hw550-3g | \
	ip2202 | \
	m2m | \
	m3 | \
	m4 | \
	mlw221 | \
	mlwg2 | \
	mofi3500-3gn | \
	mpr-a1 | \
	mpr-a2 | \
	mzk-w300nh2 | \
	nbg-419n | \
	nw718 | \
	omni-emb | \
	omni-emb-hpm | \
	omni-plug | \
	psr-680w | \
	px4885 | \
	rp-n53 | \
	rt-g32-b1 | \
	rt-n10-plus | \
	rt-n13u | \
	rt-n14u | \
	rt-n15 | \
	rt-n56u | \
	rut5xx | \
	sl-r7205 | \
	tew-691gr | \
	tew-692gr | \
	ur-326n4g |\
	ur-336un |\
	v22rw-2x2 | \
	vocore | \
	w150m | \
	w306r-v20 |\
	w502u |\
	whr-g300n |\
	whr-600d |\
	whr-1166d |\
	wsr-600 |\
	wl-330n | \
	wl-330n3g | \
	wl-351 | \
	wl341v3 | \
	wli-tx4-ag300n | \
	wzr-agl300nh | \
	wmr300 |\
	wnce2001 | \
	wr512-3gn |\
	wr6202 |\
	wr8305rt |\
	wrtnode |\
	wt1520 |\
	wt3020 |\
	x5 |\
	x8 |\
	xiaomi-miwifi-mini |\
	y1 |\
	y1s |\
	zbt-wa05)
		[ "$magic" != "27051956" ] && {
			echo "Invalid image type."
			return 1
		}
		return 0
		;;
	wsr-1166)
		[ "$magic" != "48445230" ] && {
			echo "Invalid image type."
			return 1
		}
		return 0
		;;
	ar670w)
		[ "$magic" != "6d000080" ] && {
			echo "Invalid image type."
			return 1
		}
		return 0
		;;
	cy-swr1100 |\
	dir-610-a1 |\
	dir-645 |\
	dir-860l-b1)
		[ "$magic" != "5ea3a417" ] && {
			echo "Invalid image type."
			return 1
		}
		return 0
		;;
	br-6475nd)
		[ "$magic" != "43535953" ] && {
			echo "Invalid image type."
			return 1
		}
		return 0
		;;
	c20i)
		[ "$magic" != "03000000" ] && {
			echo "Invalid image type."
			return 1
		}
		return 0
		;;
	esac

	echo "Sysupgrade is not yet supported on $board."
	return 1
}

platform_do_upgrade() {
	local board=$(ramips_board_name)

	case "$board" in
	*)
		default_do_upgrade "$ARGV"
		;;
	esac
}

disable_watchdog() {
	killall watchdog
	( ps | grep -v 'grep' | grep '/dev/watchdog' ) && {
		echo 'Could not disable watchdog'
		return 1
	}
}

append sysupgrade_pre_upgrade disable_watchdog
