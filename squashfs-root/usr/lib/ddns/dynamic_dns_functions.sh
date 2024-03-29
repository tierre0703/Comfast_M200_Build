#!/bin/sh
#.Distributed under the terms of the GNU General Public License (GPL) version 2.0
#.Christian Schoenebeck <christian dot schoenebeck at gmail dot com>
. /lib/functions.sh
. /lib/functions/network.sh
SECTION_ID=""
VERBOSE_MODE=1
LOGFILE=""
PIDFILE=""
UPDFILE=""
DATFILE=""
ERRFILE=""
TLDFILE=/usr/lib/ddns/tld_names.dat
CHECK_SECONDS=0
FORCE_SECONDS=0
RETRY_SECONDS=0
LAST_TIME=0
CURR_TIME=0
NEXT_TIME=0
EPOCH_TIME=0
REGISTERED_IP=""
LOCAL_IP=""
URL_USER=""
URL_PASS=""
ERR_LAST=0
ERR_UPDATE=0
PID_SLEEP=0
ALLOW_LOCAL_IP=$(uci -q get ddns.global.allow_local_ip) || ALLOW_LOCAL_IP=0
RUNDIR=$(uci -q get ddns.global.run_dir) || RUNDIR="/var/run/ddns"
[ -d $RUNDIR ] || mkdir -p -m755 $RUNDIR
LOGDIR=$(uci -q get ddns.global.log_dir) || LOGDIR="/var/log/ddns"
[ -d $LOGDIR ] || mkdir -p -m755 $LOGDIR
LOGLINES=$(uci -q get ddns.global.log_lines) || LOGLINES=250
LOGLINES=$((LOGLINES + 1))
DATE_FORMAT=$(uci -q get ddns.global.date_format) || DATE_FORMAT="%F %R"
DATE_PROG="date +'$DATE_FORMAT'"
IPV4_REGEX="[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}"
IPV6_REGEX="\(\([0-9A-Fa-f]\{1,4\}:\)\{1,\}\)\(\([0-9A-Fa-f]\{1,4\}\)\{0,1\}\)\(\(:[0-9A-Fa-f]\{1,4\}\)\{1,\}\)"
[ "$(basename $0)" = "dynamic_dns_lucihelper.sh" ] && LUCI_HELPER="TRUE" || LUCI_HELPER=""
USE_CURL=$(uci -q get ddns.global.use_curl) || USE_CURL=0
[ -x /usr/bin/curl ] || USE_CURL=0
load_all_config_options()
{
	local __PKGNAME="$1"
	local __SECTIONID="$2"
	local __VAR
	local __ALL_OPTION_VARIABLES=""
	config_cb()
	{
		if [ ."$2" = ."$__SECTIONID" ]; then
			option_cb()
			{
				__ALL_OPTION_VARIABLES="$__ALL_OPTION_VARIABLES $1"
			}
		else
			option_cb() { return 0; }
		fi
	}
	config_load "$__PKGNAME"
	[ -z "$__ALL_OPTION_VARIABLES" ] && return 1
	for __VAR in $__ALL_OPTION_VARIABLES
	do
		config_get "$__VAR" "$__SECTIONID" "$__VAR"
	done
	return 0
}
load_all_service_sections() {
	local __DATA=""
	config_cb()
	{
		[ "$1" = "service" ] && __DATA="$__DATA $2"
	}
	config_load "ddns"
	eval "$1=\"$__DATA\""
	return
}
start_daemon_for_all_ddns_sections()
{
	local __EVENTIF="$1"
	local __SECTIONS=""
	local __SECTIONID=""
	local __IFACE=""
	load_all_service_sections __SECTIONS
	for __SECTIONID in $__SECTIONS; do
		config_get __IFACE "$__SECTIONID" interface "wan"
		[ -z "$__EVENTIF" -o "$__IFACE" = "$__EVENTIF" ] || continue
		/usr/lib/ddns/dynamic_dns_updater.sh $__SECTIONID 0 >/dev/null 2>&1 &
	done
}
stop_section_processes() {
	local __PID=0
	local __PIDFILE="$RUNDIR/$1.pid"
	[ $# -ne 1 ] && write_log 12 "Error calling 'stop_section_processes()' - wrong number of parameters"
	[ -e "$__PIDFILE" ] && {
		__PID=$(cat $__PIDFILE)
		ps | grep "^[\t ]*$__PID" >/dev/null 2>&1 && kill $__PID || __PID=0
	}
	[ $__PID -eq 0 ]
}
stop_daemon_for_all_ddns_sections() {
	local __EVENTIF="$1"
	local __SECTIONS=""
	local __SECTIONID=""
	local __IFACE=""
	load_all_service_sections __SECTIONS
	for __SECTIONID in $__SECTIONS;	do
		config_get __IFACE "$__SECTIONID" interface "wan"
		[ -z "$__EVENTIF" -o "$__IFACE" = "$__EVENTIF" ] || continue
		stop_section_processes "$__SECTIONID"
	done
}
write_log() {
	local __LEVEL __EXIT __CMD __MSG
	local __TIME=$(date +%H%M%S)
	[ $1 -ge 10 ] && {
		__LEVEL=$(($1-10))
		__EXIT=1
	} || {
		__LEVEL=$1
		__EXIT=0
	}
	shift
	[ $__EXIT -eq 0 ] && __MSG="$*" || __MSG="$* - TERMINATE"
	case $__LEVEL in
		0)	__CMD="logger -p user.emerg -t ddns-scripts[$$] $SECTION_ID: $__MSG"
			__MSG=" $__TIME EMERG : $__MSG" ;;
		1)	__CMD="logger -p user.alert -t ddns-scripts[$$] $SECTION_ID: $__MSG"
			__MSG=" $__TIME ALERT : $__MSG" ;;
		2)	__CMD="logger -p user.crit -t ddns-scripts[$$] $SECTION_ID: $__MSG"
			__MSG=" $__TIME  CRIT : $__MSG" ;;
		3)	__CMD="logger -p user.err -t ddns-scripts[$$] $SECTION_ID: $__MSG"
			__MSG=" $__TIME ERROR : $__MSG" ;;
		4)	__CMD="logger -p user.warn -t ddns-scripts[$$] $SECTION_ID: $__MSG"
			__MSG=" $__TIME  WARN : $__MSG" ;;
		5)	__CMD="logger -p user.notice -t ddns-scripts[$$] $SECTION_ID: $__MSG"
			__MSG=" $__TIME  note : $__MSG" ;;
		6)	__CMD="logger -p user.info -t ddns-scripts[$$] $SECTION_ID: $__MSG"
			__MSG=" $__TIME  info : $__MSG" ;;
		7)	__MSG=" $__TIME       : $__MSG";;
		*) 	return;;
	esac
	[ $VERBOSE_MODE -gt 0 -o $__EXIT -gt 0 ] && echo -e "$__MSG"
	if [ ${use_logfile:-1} -eq 1 -o $VERBOSE_MODE -gt 1 ]; then
		echo -e "$__MSG" >> $LOGFILE
		[ $VERBOSE_MODE -gt 1 ] || sed -i -e :a -e '$q;N;'$LOGLINES',$D;ba' $LOGFILE
	fi
	[ $LUCI_HELPER ]   && return
	[ $__LEVEL -eq 7 ] && return
	__CMD=$(echo -e "$__CMD" | tr -d '\n' | tr '\t' '     ')
	[ $__EXIT  -eq 1 ] && {
		$__CMD
		exit 1
	}
	[ $use_syslog -eq 0 ] && return
	[ $((use_syslog + __LEVEL)) -le 7 ] && $__CMD
	return
}
urlencode() {
	local __STR __LEN __CHAR __OUT
	local __ENC=""
	local __POS=1
	[ $# -ne 2 ] && write_log 12 "Error calling 'urlencode()' - wrong number of parameters"
	__STR="$2"
	__LEN=${#__STR}
	while [ $__POS -le $__LEN ]; do
		__CHAR=$(expr substr "$__STR" $__POS 1)
		case "$__CHAR" in
		        [-_.~a-zA-Z0-9] )
				__OUT="${__CHAR}"
				;;
		        * )
		               __OUT=$(printf '%%%02x' "'$__CHAR" )
				;;
		esac
		__ENC="${__ENC}${__OUT}"
		__POS=$(( $__POS + 1 ))
	done
	eval "$1=\"$__ENC\""
	return 0
}
get_service_data() {
	local __LINE __FILE __NAME __URL __SERVICES __DATA
	local __SCRIPT=""
	local __OLD_IFS=$IFS
	local __NEWLINE_IFS='
'
	[ $# -ne 2 ] && write_log 12 "Error calling 'get_service_data()' - wrong number of parameters"
	__FILE="/usr/lib/ddns/services"
	[ $use_ipv6 -ne 0 ] && __FILE="/usr/lib/ddns/services_ipv6"
	__SERVICES=$(cat $__FILE | grep "^[\t ]*[^#]" | \
		awk ' gsub("\x27", "\"") { if ($1~/^[^\"]*$/) $1="\""$1"\"" }; { if ( $NF~/^[^\"]*$/) $NF="\""$NF"\""  }; { print $0 }')
	IFS=$__NEWLINE_IFS
	for __LINE in $__SERVICES; do
		__NAME=$(echo $__LINE | grep -o "^[\t ]*\"[^\"]*\"" | xargs -r -n1 echo)
		__DATA=$(echo $__LINE | grep -o "\"[^\"]*\"[\t ]*$" | xargs -r -n1 echo)
		if [ "$__NAME" = "$service_name" ]; then
			break
		fi
	done
	IFS=$__OLD_IFS
	__URL=$(echo "$__DATA" | grep "^http")
	[ -z "$__URL" ] && __SCRIPT="/usr/lib/ddns/$__DATA"
	eval "$1=\"$__URL\""
	eval "$2=\"$__SCRIPT\""
	return 0
}
get_seconds() {
	[ $# -ne 3 ] && write_log 12 "Error calling 'get_seconds()' - wrong number of parameters"
	case "$3" in
		"days" )	eval "$1=$(( $2 * 86400 ))";;
		"hours" )	eval "$1=$(( $2 * 3600 ))";;
		"minutes" )	eval "$1=$(( $2 * 60 ))";;
		* )		eval "$1=$2";;
	esac
	return 0
}
timeout() {
#.copied from http://www.ict.griffith.edu.au/anthony/software/timeout.sh
#.Anthony Thyssen     6 April 2011
	SIG=-TERM
	while [ $# -gt 0 ]; do
		case "$1" in
			--)
				shift;
				break ;;
			[0-9]*)
				TIMEOUT="$1" ;;
			-*)
				SIG="$1" ;;
			*)
				break ;;
		esac
		shift
	done
	"$@" &
	command_pid=$!
	sleep_pid=0
	(
		trap 'kill -TERM $sleep_pid; return 1' 1 2 3 15
		sleep $TIMEOUT &
		sleep_pid=$!
		wait $sleep_pid
		kill $SIG $command_pid >/dev/null 2>&1
		return 1
	) &
	timeout_pid=$!
	wait $command_pid
	status=$?
	kill $timeout_pid 2>/dev/null
	wait $timeout_pid 2>/dev/null
	return $status
}
verify_host_port() {
	local __HOST=$1
	local __PORT=$2
	local __IP __IPV4 __IPV6 __RUNPROG __PROG __ERR
	[ $# -ne 2 ] && write_log 12 "Error calling 'verify_host_port()' - wrong number of parameters"
	__IPV4=$(echo $__HOST | grep -m 1 -o "$IPV4_REGEX$")
	__IPV6=$(echo $__HOST | grep -m 1 -o "$IPV6_REGEX")
	[ -z "$__IPV4" -a -z "$__IPV6" ] && {
		if [ -x /usr/bin/host ]; then
			__PROG="BIND host"
			__RUNPROG="/usr/bin/host -t ANY $__HOST >$DATFILE 2>$ERRFILE"
		else
			__PROG="BusyBox nslookup"
			__RUNPROG="/usr/bin/nslookup $__HOST >$DATFILE 2>$ERRFILE"
		fi
		write_log 7 "#> $__RUNPROG"
		eval $__RUNPROG
		__ERR=$?
		[ $__ERR -gt 0 ] && {
			write_log 3 "DNS Resolver Error - $__PROG Error '$__ERR'"
			write_log 7 "$(cat $ERRFILE)"
			return 2
		}
		if [ -x /usr/bin/host ]; then
			__IPV4=$(cat $DATFILE | awk -F "address " '/has address/ {print $2; exit}' )
			__IPV6=$(cat $DATFILE | awk -F "address " '/has IPv6/ {print $2; exit}' )
		else
			__IPV4=$(cat $DATFILE | sed -ne "3,\$ { s/^Address[0-9 ]\{0,\}: \($IPV4_REGEX\).*$/\\1/p }")
			__IPV6=$(cat $DATFILE | sed -ne "3,\$ { s/^Address[0-9 ]\{0,\}: \($IPV6_REGEX\).*$/\\1/p }")
		fi
	}
	if [ $force_ipversion -ne 0 ]; then
		__ERR=0
		[ $use_ipv6 -eq 0 -a -z "$__IPV4" ] && __ERR=4
		[ $use_ipv6 -eq 1 -a -z "$__IPV6" ] && __ERR=6
		[ $__ERR -gt 0 ] && {
			[ $LUCI_HELPER ] && return 4
			write_log 14 "Verify host Error '4' - Forced IP Version IPv$__ERR don't match"
		}
	fi
	/usr/bin/nc --help 2>&1 | grep -i "NO OPT l!" >/dev/null 2>&1 && \
		write_log 12 "Busybox nc (netcat) compiled without '-l' option, error 'NO OPT l!'"
	/usr/bin/nc --help 2>&1 | grep "\-w" >/dev/null 2>&1 && __NCEXT="TRUE"
	[ $force_ipversion -ne 0 -a $use_ipv6 -ne 0 -o -z "$__IPV4" ] && __IP=$__IPV6 || __IP=$__IPV4
	if [ -n "$__NCEXT" ]; then
		__RUNPROG="/usr/bin/nc -w 1 $__IP $__PORT </dev/null >$DATFILE 2>$ERRFILE"
		write_log 7 "#> $__RUNPROG"
		eval $__RUNPROG
		__ERR=$?
		[ $__ERR -eq 0 ] && return 0
		write_log 3 "Connect error - BusyBox nc (netcat) Error '$__ERR'"
		write_log 7 "$(cat $ERRFILE)"
		return 3
	else
		__RUNPROG="timeout 2 -- /usr/bin/nc $__IP $__PORT </dev/null >$DATFILE 2>$ERRFILE"
		write_log 7 "#> $__RUNPROG"
		eval $__RUNPROG
		__ERR=$?
		[ $__ERR -eq 0 ] && return 0
		write_log 3 "Connect error - BusyBox nc (netcat) timeout Error '$__ERR'"
		return 3
	fi
}
verify_dns() {
	local __ERR=255
	local __CNT=0
	[ $# -ne 1 ] && write_log 12 "Error calling 'verify_dns()' - wrong number of parameters"
	write_log 7 "Verify DNS server '$1'"
	while [ $__ERR -ne 0 ]; do
		verify_host_port "$1" "53"
		__ERR=$?
		if [ $LUCI_HELPER ]; then
			return $__ERR
		elif [ $__ERR -ne 0 -a $VERBOSE_MODE -gt 1 ]; then
			write_log 4 "Verify DNS server '$1' failed - Verbose Mode: $VERBOSE_MODE - NO retry on error"
			return $__ERR
		elif [ $__ERR -ne 0 ]; then
			__CNT=$(( $__CNT + 1 ))
			[ $retry_count -gt 0 -a $__CNT -gt $retry_count ] && \
				write_log 14 "Verify DNS server '$1' failed after $retry_count retries"
			write_log 4 "Verify DNS server '$1' failed - retry $__CNT/$retry_count in $RETRY_SECONDS seconds"
			sleep $RETRY_SECONDS &
			PID_SLEEP=$!
			wait $PID_SLEEP
			PID_SLEEP=0
		fi
	done
	return 0
}
verify_proxy() {
	local __TMP __HOST __PORT
	local __ERR=255
	local __CNT=0
	[ $# -ne 1 ] && write_log 12 "Error calling 'verify_proxy()' - wrong number of parameters"
	write_log 7 "Verify Proxy server 'http://$1'"
	__TMP=$(echo $1 | awk -F "@" '{print $2}')
	[ -z "$__TMP" ] && __TMP="$1"
	__HOST=$(echo $__TMP | grep -m 1 -o "$IPV6_REGEX")
	if [ -n "$__HOST" ]; then
		__PORT=$(echo $__TMP | awk -F "]:" '{print $2}')
	else
		__HOST=$(echo $__TMP | awk -F ":" '{print $1}')
		__PORT=$(echo $__TMP | awk -F ":" '{print $2}')
	fi
	[ -z "$__PORT" ] && {
		[ $LUCI_HELPER ] && return 5
		write_log 14 "Invalid Proxy server Error '5' - proxy port missing"
	}
	while [ $__ERR -gt 0 ]; do
		verify_host_port "$__HOST" "$__PORT"
		__ERR=$?
		if [ $LUCI_HELPER ]; then
			return $__ERR
		elif [ $__ERR -gt 0 -a $VERBOSE_MODE -gt 1 ]; then
			write_log 4 "Verify Proxy server '$1' failed - Verbose Mode: $VERBOSE_MODE - NO retry on error"
			return $__ERR
		elif [ $__ERR -gt 0 ]; then
			__CNT=$(( $__CNT + 1 ))
			[ $retry_count -gt 0 -a $__CNT -gt $retry_count ] && \
				write_log 14 "Verify Proxy server '$1' failed after $retry_count retries"
			write_log 4 "Verify Proxy server '$1' failed - retry $__CNT/$retry_count in $RETRY_SECONDS seconds"
			sleep $RETRY_SECONDS &
			PID_SLEEP=$!
			wait $PID_SLEEP
			PID_SLEEP=0
		fi
	done
	return 0
}
do_transfer() {
	local __URL="$1"
	local __ERR=0
	local __CNT=0
	local __PROG  __RUNPROG
	[ $# -ne 1 ] && write_log 12 "Error in 'do_transfer()' - wrong number of parameters"
	grep -i "\+ssl" /usr/bin/wget >/dev/null 2>&1
	if [ $? -eq 0 -a $USE_CURL -eq 0 ]; then
		__PROG="/usr/bin/wget -nv -t 1 -O $DATFILE -o $ERRFILE"
		if [ -n "$bind_network" ]; then
			local __BINDIP
			[ $use_ipv6 -eq 0 ] && __RUNPROG="network_get_ipaddr" || __RUNPROG="network_get_ipaddr6"
			eval "$__RUNPROG __BINDIP $bind_network" || \
				write_log 13 "Can not detect local IP using '$__RUNPROG $bind_network' - Error: '$?'"
			write_log 7 "Force communication via IP '$__BINDIP'"
			__PROG="$__PROG --bind-address=$__BINDIP"
		fi
		if [ $force_ipversion -eq 1 ]; then
			[ $use_ipv6 -eq 0 ] && __PROG="$__PROG -4" || __PROG="$__PROG -6"
		fi
		if [ $use_https -eq 1 ]; then
			if [ "$cacert" = "IGNORE" ]; then
				__PROG="$__PROG --no-check-certificate"
			elif [ -f "$cacert" ]; then
				__PROG="$__PROG --ca-certificate=${cacert}"
			elif [ -d "$cacert" ]; then
				__PROG="$__PROG --ca-directory=${cacert}"
			else
				write_log 14 "No valid certificate(s) found at '$cacert' for HTTPS communication"
			fi
		fi
		[ -z "$proxy" ] && __PROG="$__PROG --no-proxy"
		__RUNPROG="$__PROG '$__URL'"
		__PROG="GNU Wget"
	elif [ -x /usr/bin/curl ]; then
		__PROG="/usr/bin/curl -RsS -o $DATFILE --stderr $ERRFILE"
		if [ -n "$bind_network" ]; then
			local __DEVICE
			network_get_physdev __DEVICE $bind_network || \
				write_log 13 "Can not detect local device using 'network_get_physdev $bind_network' - Error: '$?'"
			write_log 7 "Force communication via device '$__DEVICE'"
			__PROG="$__PROG --interface $__DEVICE"
		fi
		if [ $force_ipversion -eq 1 ]; then
			[ $use_ipv6 -eq 0 ] && __PROG="$__PROG -4" || __PROG="$__PROG -6"
		fi
		if [ $use_https -eq 1 ]; then
			if [ "$cacert" = "IGNORE" ]; then
				__PROG="$__PROG --insecure"
			elif [ -f "$cacert" ]; then
				__PROG="$__PROG --cacert $cacert"
			elif [ -d "$cacert" ]; then
				__PROG="$__PROG --capath $cacert"
			else
				write_log 14 "No valid certificate(s) found at '$cacert' for HTTPS communication"
			fi
		fi
		if [ -z "$proxy" ]; then
			__PROG="$__PROG --noproxy '*'"
		else
			grep -i "all_proxy" /usr/lib/libcurl.so* >/dev/null 2>&1 || \
				write_log 13 "cURL: libcurl compiled without Proxy support"
		fi
		__RUNPROG="$__PROG '$__URL'"
		__PROG="cURL"
	elif [ -x /usr/bin/wget ]; then
		__PROG="/usr/bin/wget -q -O $DATFILE"
		[ -n "$__BINDIP" ] && \
			write_log 14 "BusyBox Wget: FORCE binding to specific address not supported"
		[ $force_ipversion -eq 1 ] && \
			write_log 14 "BusyBox Wget: Force connecting to IPv4 or IPv6 addresses not supported"
		[ $use_https -eq 1 ] && \
			write_log 14 "BusyBox Wget: no HTTPS support"
		[ -z "$proxy" ] && __PROG="$__PROG -Y off"
		__RUNPROG="$__PROG '$__URL' 2>$ERRFILE"
		__PROG="Busybox Wget"
	else
		write_log 13 "Neither 'Wget' nor 'cURL' installed or executable"
	fi
	while : ; do
		write_log 7 "#> $__RUNPROG"
		eval $__RUNPROG
		__ERR=$?
		[ $__ERR -eq 0 ] && return 0
		[ $LUCI_HELPER ] && return 1
		write_log 3 "$__PROG Error: '$__ERR'"
		write_log 7 "$(cat $ERRFILE)"
		[ $VERBOSE_MODE -gt 1 ] && {
			write_log 4 "Transfer failed - Verbose Mode: $VERBOSE_MODE - NO retry on error"
			return 1
		}
		__CNT=$(( $__CNT + 1 ))
		[ $retry_count -gt 0 -a $__CNT -gt $retry_count ] && \
			write_log 14 "Transfer failed after $retry_count retries"
		write_log 4 "Transfer failed - retry $__CNT/$retry_count in $RETRY_SECONDS seconds"
		sleep $RETRY_SECONDS &
		PID_SLEEP=$!
		wait $PID_SLEEP
		PID_SLEEP=0
	done
	write_log 12 "Error in 'do_transfer()' - program coding error"
}
send_update() {
	local __IP
	[ $# -ne 1 ] && write_log 12 "Error calling 'send_update()' - wrong number of parameters"
	if [ $ALLOW_LOCAL_IP -eq 0 ]; then
		[ $use_ipv6 -eq 0 ] && __IP=$(echo $1 | grep -v -E "(^0|^10\.|^100\.6[4-9]\.|^100\.[7-9][0-9]\.|^100\.1[0-1][0-9]\.|^100\.12[0-7]\.|^127|^169\.254|^172\.1[6-9]\.|^172\.2[0-9]\.|^172\.3[0-1]\.|^192\.168)")
		[ $use_ipv6 -eq 1 ] && __IP=$(echo $1 | grep "^[0-9a-eA-E]")
		[ -z "$__IP" ] && write_log 14 "Private or invalid or no IP '$1' given! Please check your configuration"
	else
		__IP="$1"
	fi
	if [ -n "$update_script" ]; then
		write_log 7 "parsing script '$update_script'"
		. $update_script
	else
		local __URL __ERR
		__URL=$(echo $update_url | sed -e "s#\[USERNAME\]#$URL_USER#g" -e "s#\[PASSWORD\]#$URL_PASS#g" \
					       -e "s#\[DOMAIN\]#$domain#g" -e "s#\[IP\]#$__IP#g")
		[ $use_https -ne 0 ] && __URL=$(echo $__URL | sed -e 's#^http:#https:#')
		do_transfer "$__URL" || return 1
		write_log 7 "DDNS Provider answered:\n$(cat $DATFILE)"
		return 0
	fi
}
get_local_ip () {
	local __CNT=0
	local __RUNPROG __DATA __URL __ERR
	[ $# -ne 1 ] && write_log 12 "Error calling 'get_local_ip()' - wrong number of parameters"
	write_log 7 "Detect local IP on '$ip_source'"
	while : ; do
		case $ip_source in
			network)
				[ $use_ipv6 -eq 0 ] && __RUNPROG="network_flush_cache"
                                eval "$__RUNPROG"
				[ $use_ipv6 -eq 0 ] && __RUNPROG="network_get_ipaddr" \
						    || __RUNPROG="network_get_ipaddr6"
				eval "$__RUNPROG __DATA $ip_network" || \
					write_log 13 "Can not detect local IP using $__RUNPROG '$ip_network' - Error: '$?'"
				__DATA=`ifconfig pppoe-$ip_network|grep "inet addr:"|cut -d: -f2|awk '{ print $1}'`
				[ -n "$__DATA" ] && write_log 7 "Local IP '$__DATA' detected on network '$ip_network'"
				;;
			interface)
				write_log 7 "#> ifconfig $ip_interface >$DATFILE 2>$ERRFILE"
				ifconfig $ip_interface >$DATFILE 2>$ERRFILE
				__ERR=$?
				if [ $__ERR -eq 0 ]; then
					if [ $use_ipv6 -eq 0 ]; then
						__DATA=$(awk '
							/inet addr:/ {
							$1="";
							$3="";
							$4="";
							FS=":";
							$0=$0;
							$1="";
							FS=" ";
							$0=$0;
							print $1;
							}' $DATFILE
						)
					else
						__DATA=$(awk '
							/inet6/ && /: [0-9a-eA-E]/ && !/\/128/ {
							FS="/";
							$0=$0;
							$2="";
							FS=" ";
							$0=$0;
							print $3;
							}' $DATFILE
						)
					fi
					[ -n "$__DATA" ] && write_log 7 "Local IP '$__DATA' detected on interface '$ip_interface'"
				else
					write_log 3 "ifconfig Error: '$__ERR'"
					write_log 7 "$(cat $ERRFILE)"
				fi
				;;
			script)
				write_log 7 "#> $ip_script >$DATFILE 2>$ERRFILE"
				eval $ip_script >$DATFILE 2>$ERRFILE
				__ERR=$?
				if [ $__ERR -eq 0 ]; then
					__DATA=$(cat $DATFILE)
					[ -n "$__DATA" ] && write_log 7 "Local IP '$__DATA' detected via script '$ip_script'"
				else
					write_log 3 "$ip_script Error: '$__ERR'"
					write_log 7 "$(cat $ERRFILE)"
				fi
				;;
			web)
				do_transfer "$ip_url"
				[ $use_ipv6 -eq 0 ] \
					&& __DATA=$(grep -m 1 -o "$IPV4_REGEX" $DATFILE) \
					|| __DATA=$(grep -m 1 -o "$IPV6_REGEX" $DATFILE)
				[ -n "$__DATA" ] && write_log 7 "Local IP '$__DATA' detected on web at '$ip_url'"
				;;
			*)
				write_log 12 "Error in 'get_local_ip()' - unhandled ip_source '$ip_source'"
				;;
		esac
		[ -n "$__DATA" ] && {
			eval "$1=\"$__DATA\""
			return 0
		}
		[ $LUCI_HELPER ] && return 1
		write_log 7 "Data detected:\n$(cat $DATFILE)"
		[ $VERBOSE_MODE -gt 1 ] && {
			write_log 4 "Get local IP via '$ip_source' failed - Verbose Mode: $VERBOSE_MODE - NO retry on error"
			return 1
		}
		__CNT=$(( $__CNT + 1 ))
		[ $retry_count -gt 0 -a $__CNT -gt $retry_count ] && \
			write_log 14 "Get local IP via '$ip_source' failed after $retry_count retries"
		write_log 4 "Get local IP via '$ip_source' failed - retry $__CNT/$retry_count in $RETRY_SECONDS seconds"
		sleep $RETRY_SECONDS &
		PID_SLEEP=$!
		wait $PID_SLEEP
		PID_SLEEP=0
	done
	write_log 12 "Error in 'get_local_ip()' - program coding error"
}
get_registered_ip() {
	local __CNT=0
	local __ERR=255
	local __REGEX  __PROG  __RUNPROG  __DATA
	[ $# -lt 1 -o $# -gt 2 ] && write_log 12 "Error calling 'get_registered_ip()' - wrong number of parameters"
	write_log 7 "Detect registered/public IP"
	[ $use_ipv6 -eq 0 ] && __REGEX="$IPV4_REGEX" || __REGEX="$IPV6_REGEX"
	if [ -x /usr/bin/host ]; then
		__PROG="/usr/bin/host"
		[ $use_ipv6 -eq 0 ] && __PROG="$__PROG -t A"  || __PROG="$__PROG -t AAAA"
		if [ $force_ipversion -eq 1 ]; then
			[ $use_ipv6 -eq 0 ] && __PROG="$__PROG -4"  || __PROG="$__PROG -6"
		fi
		[ $force_dnstcp -eq 1 ] && __PROG="$__PROG -T"
		__RUNPROG="$__PROG $domain $dns_server >$DATFILE 2>$ERRFILE"
		__PROG="BIND host"
	elif [ -x /usr/bin/nslookup ]; then
		[ $force_ipversion -ne 0 -o $force_dnstcp -ne 0 ] && \
			write_log 14 "Busybox nslookup - no support to 'force IP Version' or 'DNS over TCP'"
		__RUNPROG="/usr/bin/nslookup $domain $dns_server >$DATFILE 2>$ERRFILE"
		__PROG="BusyBox nslookup"
	else
		write_log 12 "Error in 'get_registered_ip()' - no supported Name Server lookup software accessible"
	fi
	while : ; do
		write_log 7 "#> $__RUNPROG"
		eval $__RUNPROG
		__ERR=$?
		if [ $__ERR -ne 0 ]; then
			write_log 3 "$__PROG error: '$__ERR'"
			write_log 7 "$(cat $ERRFILE)"
		else
			if [ "$__PROG" = "BIND host" ]; then
				__DATA=$(cat $DATFILE | awk -F "address " '/has/ {print $2; exit}' )
			else
				__DATA=$(cat $DATFILE | sed -ne "3,\$ { s/^Address[0-9 ]\{0,\}: \($__REGEX\).*$/\\1/p }" )
			fi
			[ -n "$__DATA" ] && {
				write_log 7 "Registered IP '$__DATA' detected"
				eval "$1=\"$__DATA\""
				return 0
			}
			write_log 4 "NO valid IP found"
			__ERR=127
		fi
		[ $LUCI_HELPER ] && return $__ERR
		[ -n "$2" ] && return $__ERR
		[ $VERBOSE_MODE -gt 1 ] && {
			write_log 4 "Get registered/public IP for '$domain' failed - Verbose Mode: $VERBOSE_MODE - NO retry on error"
			return $__ERR
		}
		__CNT=$(( $__CNT + 1 ))
		[ $retry_count -gt 0 -a $__CNT -gt $retry_count ] && \
			write_log 14 "Get registered/public IP for '$domain' failed after $retry_count retries"
		write_log 4 "Get registered/public IP for '$domain' failed - retry $__CNT/$retry_count in $RETRY_SECONDS seconds"
		sleep $RETRY_SECONDS &
		PID_SLEEP=$!
		wait $PID_SLEEP
		PID_SLEEP=0
	done
	write_log 12 "Error in 'get_registered_ip()' - program coding error"
}
get_uptime() {
	[ $# -ne 1 ] && write_log 12 "Error calling 'verify_host_port()' - wrong number of parameters"
	local __UPTIME=$(cat /proc/uptime)
	eval "$1=\"${__UPTIME%%.*}\""
}
trap_handler() {
	local __PIDS __PID
	local __ERR=${2:-0}
	local __OLD_IFS=$IFS
	local __NEWLINE_IFS='
'
	[ $PID_SLEEP -ne 0 ] && kill -$1 $PID_SLEEP 2>/dev/null
	case $1 in
		 0)	if [ $__ERR -eq 0 ]; then
				write_log 5 "PID '$$' exit normal at $(eval $DATE_PROG)\n"
			else
				write_log 4 "PID '$$' exit WITH ERROR '$__ERR' at $(eval $DATE_PROG)\n"
			fi ;;
		 1)	write_log 6 "PID '$$' received 'SIGHUP' at $(eval $DATE_PROG)"
			eval "/usr/lib/ddns/dynamic_dns_updater.sh $SECTION_ID $VERBOSE_MODE &"
			exit 0 ;;
		 2)	write_log 5 "PID '$$' terminated by 'SIGINT' at $(eval $DATE_PROG)\n";;
		 3)	write_log 5 "PID '$$' terminated by 'SIGQUIT' at $(eval $DATE_PROG)\n";;
		15)	write_log 5 "PID '$$' terminated by 'SIGTERM' at $(eval $DATE_PROG)\n";;
		 *)	write_log 13 "Unhandled signal '$1' in 'trap_handler()'";;
	esac
	__PIDS=$(pgrep -P $$)
	IFS=$__NEWLINE_IFS
	for __PID in $__PIDS; do
		kill -$1 $__PID
	done
	IFS=$__OLD_IFS
	[ -f $DATFILE ] && rm -f $DATFILE
	[ -f $ERRFILE ] && rm -f $ERRFILE
	trap - 0 1 2 3 15
	[ $1 -gt 0 ] && kill -$1 $$
}
split_FQDN() {
	[ $# -ne 4 ] && write_log 12 "Error calling 'split_FQDN()' - wrong number of parameters"
	_SET="$@"
	local _FHOST _FTLD _FOUND
	local _FDOM=$(echo "$1" | tr [A-Z] [a-z])
	set -- $(echo "$_FDOM" | tr "." " ")
	_FDOM=""
	while [ -n "$1" ] ; do
		_FTLD=$(echo $@ | tr " " ".")
		grep -E "^!$_FTLD$" $TLDFILE >/dev/null 2>&1 || {
			grep -E "^*.$_FTLD$" $TLDFILE >/dev/null 2>&1 && {
				_FOUND="VALID"
				break
			}
			grep -E "^$_FTLD$" $TLDFILE >/dev/null 2>&1 && {
				_FOUND="VALID"
				break
			}
		}
		_FHOST="$_FHOST $_FDOM"
		_FDOM="$1"
		_FTLD=""
		shift
	done
	set -- $_SET
	[ -n "$_FHOST" ] && _FHOST=$(echo $_FHOST | tr " " ".")
	[ -n "$_FOUND" ] && {
		eval "$2=$_FTLD"
		eval "$3=$_FDOM"
		eval "$4=$_FHOST"
		return 0
	}
	eval "$2=''"
	eval "$3=''"
	eval "$4=''"
	return 1
}
