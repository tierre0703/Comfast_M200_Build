#!/bin/sh

# ${INTERFACE} -- logical network interface (e.g. wan) which goes online or offline
# ${DEVICE} -- physical device (e.g. eth0) which goes online or offline
# ${GLOBAL} -- global state ONLINE or OFFLINE depending on wether device is online thru other interfaces
#echo ${INTERFACE} >> /etc/pingcheck.tmp

uci set pingcheck.${INTERFACE}.status=online
uci commit pingcheck
