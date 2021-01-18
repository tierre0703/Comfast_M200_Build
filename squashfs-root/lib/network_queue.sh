#!/bin/sh
. /lib/functions.sh

NETWORK_QUEUE_FILE="/tmp/queue_file_network"
MAX_QUEUE_ID_FILE="$NETWORK_QUEUE_FILE/max_queue_id"
NEXT_NODE_ID_FILE="$NETWORK_QUEUE_FILE/next_node_id"
CURRENT_WAIT_LIST="$NETWORK_QUEUE_FILE/current_wait_list"
MAX_QUEUE_NUMBER=2
wait_times=0

current_id=0
next_id=0
max_id=0

add_network_queque()
{
	local get_max_id=0
	[ ! -d $NETWORK_QUEUE_FILE ] && mkdir -p $NETWORK_QUEUE_FILE
	[ -e $CURRENT_WAIT_LIST -a -n "$1" ] && {
	    is_in_list=`cat  $CURRENT_WAIT_LIST | grep $1 | wc -l`
	    [ $is_in_list -ge $MAX_QUEUE_NUMBER ] && exit 0
	}
	echo "$$,$1" >> $CURRENT_WAIT_LIST
	
	while [ -e $MAX_QUEUE_ID_FILE ]; do
		if [ x"$current_id" = "x0" ]; then
			max_id=`cat $MAX_QUEUE_ID_FILE`
			current_id=$(($max_id+1))
			echo $current_id > $MAX_QUEUE_ID_FILE
			continue
		else
			[ -e $NEXT_NODE_ID_FILE ] && {
				current_time=`date +%s`
				last_modify_time=`date +%s -r $NEXT_NODE_ID_FILE`
				[ $(($current_time - $last_modify_time)) -gt 30 ] && {
					next_id=`cat $NEXT_NODE_ID_FILE`
					[ -z "$next_id" ] && next_id=0
					next_id=$(($next_id+1))
					get_max_id=`cat $MAX_QUEUE_ID_FILE`
					[ $next_id -gt $get_max_id ] && next_id=$get_max_id
					echo "$next_id" > $NEXT_NODE_ID_FILE
				}
				next_id=`cat $NEXT_NODE_ID_FILE`
				[ x"$current_id" = x"$next_id" ] && break 1
			}
			[ -e $NEXT_NODE_ID_FILE ] || break 1
		fi
		sleep 1
	done
	sed -i "/$$/d" $CURRENT_WAIT_LIST
	[ -e $MAX_QUEUE_ID_FILE ] || echo $current_id > $MAX_QUEUE_ID_FILE
	[ -e $NEXT_NODE_ID_FILE ] || touch $NEXT_NODE_ID_FILE
}

quit_network_queue()
{
	sleep_times=$1
	[ -z "$sleep_times" ] && sleep_times=10
	sleep $sleep_times
	
	max_id=`cat $MAX_QUEUE_ID_FILE`
	if [ x"$max_id" = x"$current_id" ]; then
		[ -e $MAX_QUEUE_ID_FILE ] && rm $MAX_QUEUE_ID_FILE
		[ -e $NEXT_NODE_ID_FILE ] && rm $NEXT_NODE_ID_FILE
		[ -e $CURRENT_WAIT_LIST ] && rm $CURRENT_WAIT_LIST
	else
		next_id=$(($current_id+1))
		echo $next_id > $NEXT_NODE_ID_FILE
	fi
}

ht_hw_country_get(){
	local hwmode
	local htmode
	local country
	local result
	local channel
	config_get channel $1 channel
	config_get hwmode $1 hwmode
	config_get htmode $1 htmode
	config_get country $1 country
	[ "$channel" = "0" -o "$channel" = "auto" ] && {
		iw reg set $country
		op_channel=`iw autochannel $1 $hwmode $country $htmode`
		if [ "$hwmode" == "11a" ]; then
			echo "$op_channel" > /tmp/channel_select/optimum_channel_5g
		else
			echo "$op_channel" > /tmp/channel_select/optimum_channel_2g
		fi
	}
}

get_optimum_channel(){
	CURRENT_FILE="/tmp/channel_select/network_already"
	local current_t=`date +%s`
	local no_need_select=0
	local diff_time=0
	local current_time=0
	
    current_time=`cat /proc/uptime |awk '{print $1}' |awk -F "." '{print $1}'`
    [ $current_time -lt 50 ] && {
    	return 
    }

	if [ -n "$1" ];then
		touch $CURRENT_FILE
	else
		[ -e $CURRENT_FILE ] && {
			local last_modify_t=`date +%s -r $CURRENT_FILE`
			diff_time=$(($current_t - $last_modify_t))
			if [ $diff_time -le 30 ]; then
				no_need_select=1
				rm $CURRENT_FILE
			fi
		}
	fi
	[ "$no_need_select" == "0" ] && {
		config_load "${cfgfile:-wireless}"
		config_foreach ht_hw_country_get wifi-device
	}
}