#!/bin/sh
# Copyright (C) 2009 OpenWrt.org

setup_switch_dev() {
	local name
	config_get name "$1" name
	name="${name:-$1}"
	[ -d "/sys/class/net/$name" ] && ifconfig "$name" up
	swconfig dev "$name" load network
}

setup_switch() {
	config_load network
	config_foreach setup_switch_dev switch
}

setup_switch_dev_vlan() {
	local name
	config_get name "$1" name
	name="${name:-$1}"
	[ -d "/sys/class/net/$name" ] && ifconfig "$name" up
	swconfig dev "$name" load vlan
}

setup_switch_vlan() {
	config_load vlan
	config_foreach setup_switch_dev_vlan switch
}