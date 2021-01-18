define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var def_wan, def_lan, ifnamelist, lanlist, used_ifname, used_waniface, used_laniface, used_macaddr, now_action, now_macaddr, wanlist, free_interface, iface_type, set_iface, iface_name;
    var lock_web = 0, lock_time, tip_num = 0;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        used_macaddr = [];
        lock_time = 3;
        if (lock_web == true) {
            setTimeout(reset_lock_web, 1000);
        }
        removeheight();
        f.getMConfig('mwan_capability_config', function (data) {
            if (data && data.errCode == 0) {
                default_lan_wan(data.defaultiface);
                ifnamelist = data.ifnamelist || [];
                lanlist = data.lanlist || [];
                used_ifname = data.used_ifname;
                wanlist = data.wanlist || [];
                loadinterfacelist();
            }
        })
    }

    function default_lan_wan(data) {
        def_wan = data.def_wan.split(' ')[0];
        //add this for intel must eth0_1 not delete
        if (data.def_lan != "eth0_1 eth0_2 eth0_3 eth0_4") {
            def_lan = data.def_lan.split(' ')[data.def_lan.split(' ').length - 1];
        } else {
            def_lan = data.def_lan.split(' ')[0];
        }
    }

    function loadinterfacelist() {
        var wan_html = '', lan_html = '', free_html = '', free_num = 0;
        used_waniface = [];
        used_laniface = [];
        free_interface = [];
        d.each(wanlist, function (n, m) {
            used_macaddr.push(m.macaddr);
            used_waniface[n] = g.ifacetoname(m.iface);
            wan_html += build_wanhtml(n, m);
        });
        d('#extrainterfaceTbody').html(wan_html);

        d.each(lanlist, function (n, m) {
            used_macaddr.push(m.macaddr);
            used_laniface[n] = g.ifacetoname(m.iface);
            lan_html += build_lanhtml(n, m);
        });
        d('#localinterfaceTbody').html(lan_html);
        d.each(ifnamelist, function (n, m) {
            if (used_ifname.ifname.indexOf(m.ifname) < 0) {
                free_interface[free_num] = m.ifname;
                free_num++;
                free_html += build_freehtml(free_num, m);
            }
        });
        if (free_interface.length < 1) {
            d('.interface_add').addClass('hide');
        } else {
            d('.interface_add').removeClass('hide');
        }
        d('#freeinterfaceTbody').html(free_html);
        setheight();
        now_action = '';
        used_macaddr = used_macaddr.join(',');
    }

    function build_wanhtml(n, m) {
        var this_html = '', name_num;
        name_num = n + 1;
        this_html += '<tr class="text-center">';
        this_html += '<td><span>' + name_num + '</span></td>';
        this_html += '<td class="iface_name">' + g.ifacetoname(m.iface) + '</td>';
        this_html += '<td class="iface hidden">' + m.iface + '</td>';
        this_html += '<td class="macaddr hidden">' + m.macaddr + '</td>';
        this_html += '<td class="ifname">' + m.ifname + '</td>';
        this_html += '<td>';
        if (m.ifname == def_wan) {
            this_html += '<a class="table-link"><span class="fa-stack"><i class="fa fa-square fa-stack-2x gray"></i><i data-modal="modal-4" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a>';
        } else {
            this_html += '<a href="#" data-toggle="modal" data-target="#modal_del" class="table-link"><span class="fa-stack" et="click tap:unbind"><i class="fa fa-square fa-stack-2x red"></i><i title="' + global_delete + '" sh_title="global_delete" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a>';
        }
        this_html += '</td></tr>';
        return this_html;
    }

    function build_lanhtml(n, m) {
        var this_html, name_num;
        name_num = n + 1;

        this_html = '<tr class="text-center">';
        this_html += '<td><span>' + name_num + '</span></td>';
        this_html += '<td class="iface_name">' + g.ifacetoname(m.iface) + '</td>';
        this_html += '<td class="iface hidden">' + m.iface + '</td>';
        this_html += '<td class="macaddr hidden">' + m.macaddr + '</td>';
        this_html += '<td class="ifname">' + m.ifname + '</td>';
        this_html += '<td>';
        this_html += '<a href="#" data-toggle="modal" data-target="#modal_one" class="table-link"><span class="fa-stack" et="click tap:edit_local"><i class="fa fa-square fa-stack-2x"></i><i data-modal="modal-4" title="' + edit + '" sh_title="edit" class="md-trigger fa fa-pencil fa-stack-1x fa-inverse"></i></span></a>';
        if (n == 0) {
            this_html += '<a  class="table-link" disabled="disabled"><span  class="fa-stack"><i  class="fa fa-square fa-stack-2x" style="color: #95a5a6;"></i><i class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a></td></tr>';
        } else {
            this_html += '<a href="#" class="table-link" data-toggle="modal" data-target="#modal_del"><span class="fa-stack" et="click tap:unbind"><i  class="fa fa-square fa-stack-2x red"></i><i title="' + global_delete + '" sh_title="global_delete" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a></td></tr>';
        }
        return this_html;
    }

    function build_freehtml(n, m) {
        var this_html;
        this_html = '<tr class="text-center">';
        this_html += '<td><span>' + n + '</span></td>';
        this_html += '<td>' + m.ifname + '</td></tr>';
        return this_html;
    }

    function get_freeiface() {
        var used_iface, freeiface = '', i = 1;
        if (iface_type == 'WAN') {
            used_iface = used_waniface;
        } else {
            used_iface = used_laniface;
        }
        d.each(ifnamelist, function (n, m) {
            freeiface = iface_type + i;
            if (used_iface.join(' ').indexOf(freeiface) < 0) {
                return false;
            } else {
                i++;
            }
        });
        return freeiface;
    }

    function removeheight() {
        d("#wanbody").css({'height': 'auto'});
        d("#lanbody").css({'height': 'auto'});
        d("#freebody").css({'height': 'auto'});
    }

    function setheight() {
        var height_array = [];
        height_array[0] = d("#wanbody").height();
        height_array[1] = d("#lanbody").height();
        height_array[2] = d("#freebody").height();
        height_array.sort(function (a, b) {
            return b - a;
        });
        d("#freebody").height(height_array[0]);
        d("#lanbody").height(height_array[0]);
        d("#wanbody").height(height_array[0]);
    }

    et.add_extra = function (evt) {
        var interface_title, freeiface;
        iface_type = evt.attr('data-value');
        freeiface = get_freeiface();
        set_iface = g.nametoiface(freeiface);
        if (iface_type == 'WAN') {
            interface_title = interface_new_extra + freeiface.toUpperCase();
        } else if (iface_type == 'LAN') {
            interface_title = interface_new_local + freeiface.toUpperCase();
        }
        d('#titile_interface').text(interface_title);
        if (iface_type == 'WAN') {
            d("#select_laber").text(wlactrl_fmwlan_select);
        } else if (iface_type == 'LAN') {
            d("#select_laber").text(selectall_tab);
        }
        add_extra();
    };

    function add_extra() {
        var this_html = '';
        d('#interfaceTbody').html();
        d.each(free_interface, function (n, m) {
            this_html += '<tr class="text-center">';
            if (iface_type == 'WAN') {
                this_html += '<td><input et="click tap:radiobox" type="checkbox"></td>';
            } else if (iface_type == 'LAN') {
                this_html += '<td><input class="row_checkbox" et="click tap:select_row" type="checkbox"></td>';
            }
            this_html += '<td><span class="extend">' + m + '</span></td>';
            this_html += '<td>' + free_tip + '</td></tr>';
        });
        d('#interfaceTbody').html(this_html);
    }

    et.radiobox = function (evt) {
        d('#interfaceTbody').find('input').attr('checked', false);
        evt.prop('checked', 'checked');
    };

    et.select_row = function (evt) {
        var rowcheck = d(evt).attr('data-value');
        if (rowcheck == '1') {
            d('#select_laber').text(selectall_tab);
            d(evt).prop('checked', false).attr('data-value', '0');
            d('#allchecked').prop('checked', false).attr('data-value', '0');
        } else {
            d(evt).prop('checked', true).attr('data-value', '1');
        }
        if (d('.row_checkbox').length == d('.row_checkbox:checked').length) {
            d('#select_laber').text(disselectall_tab);
            d('#allchecked').prop('checked', true).attr('data-value', '1');
        }
    };

    et.selectall = function () {
        if (iface_type == 'WAN') {
            return;
        }
        var allcheckvalue = d('#allchecked').attr('data-value');
        if (allcheckvalue == '0') {
            d('#select_laber').text(disselectall_tab);
            d('.row_checkbox').prop('checked', true).attr('data-value', '1');
            d('#allchecked').prop('checked', true).attr('data-value', '1');
        } else {
            d('#select_laber').text(selectall_tab);
            d('.row_checkbox').prop('checked', false).attr('data-value', '0');
            d('#allchecked').prop('checked', false).attr('data-value', '0');
        }
    };

    et.unbind = function (evt) {
        var warning_str;
        set_iface = evt.parents('tr').find('.iface').text();
        iface_name = evt.parents('tr').find('.iface_name').text();
        if (iface_name.indexOf('LAN') > -1) {
            iface_type = 'LAN';
        } else if (iface_name.indexOf('WAN') > -1) {
            iface_type = 'WAN';
        }
        warning_str = mwan_unbind + ' ' + iface_name + ' ' + unbind_tips;
        d("#unbind_warning").text(warning_str);
        d('#unbind_face').val(set_iface);
    };

    et.unbind_save = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) {
            h.WarnTip(tip_num++, tips_wait + lock_time + tips_sec);
            return;
        }
        lock_web = true;
        if (iface_type == 'WAN') {
            arg_data = volide_wan('unbind');
        } else if (iface_type == 'LAN') {
            arg_data = volide_lan('unbind');
        }
        if (iface_type == 'WAN' && arg_data) {
            d('.closewin').click();
            set_wan_config(arg_data)

        } else if (iface_type == 'LAN' && arg_data) {
            d('.closewin').click();
            set_lan_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    et.edit_local = function (evt) {
        var iface, interface_title;
        now_action = 'edit';
        iface_type = 'LAN';
        now_macaddr = evt.parents('tr').find('.macaddr').text();
        set_iface = evt.parents('tr').find('.iface').text();
        iface_name = evt.parents('tr').find('.iface_name').text();
        interface_title = iface_name + interface_setup;
        d('#titile_interface').text(interface_title);
        d("#selectall").text(selectall_tab);
        d('#saveface').attr('data-value', set_iface);
        edit_local(evt);
    };

    function edit_local(evt) {
        var this_html = '', ifname_array;
        ifname_array = evt.parents('tr').find('.ifname').text().split(' ');
        d.each(ifname_array, function (n, m) {
            this_html += '<tr class="text-center">';
            if (m == def_lan) {
                this_html += '<td><input checked="checked" disabled type="checkbox"></td>';
            } else {
                this_html += '<td><input class="row_checkbox" et="click tap:select_row" data-value="1" checked="checked" type="checkbox"></td>';
            }
            this_html += '<td><span class="extend">' + m + '</span></td>';
            this_html += '<td>' + busy_tips + '</td></tr>';
        });
        d.each(free_interface, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td><input class="row_checkbox" et="click tap:select_row" type="checkbox"></td>';
            this_html += '<td><span class="extend">' + m + '</span></td>';
            this_html += '<td>' + free_tip + '</td></tr>';
        });
        if (free_interface.length < 1) {
            d('#select_laber').text(disselectall_tab);
            d('.row_checkbox').prop('checked', true).attr('data-value', '1');
            d('#allchecked').prop('checked', true).attr('data-value', '1');
        } else {
            d('#select_laber').text(selectall_tab);
            d('.row_checkbox').prop('checked', false).attr('data-value', '0');
            d('#allchecked').prop('checked', false).attr('data-value', '0');
        }
        d('#interfaceTbody').html(this_html);
    }

    function volide_wan(state) {
        var a = {}, extend_array = [], this_checked;
        a.iface = set_iface.toLowerCase();
        if (state == "unbind") {
            a.action = false;
        } else {
            a.action = true;
            a.ifname = '';
            this_checked = d('#interfaceTbody').find('input:checked');
            if (this_checked.length < 1) {
                h.ErrorTip(tip_num++, interface_bind_error);
                return;
            }
            this_checked.each(function (n, m) {
                extend_array[n] = d(m).parents('tr').find('.extend').text();
            });
            a.ifname = extend_array.join(' ');
            if(now_action == 'edit'){
                a.macaddr = now_macaddr;
            }else {
                d.each(ifnamelist, function (n, m) {
                    if (used_macaddr.indexOf(m.macaddr) < 0) {
                        a.macaddr = m.macaddr;
                        return false;
                    }
                });
            }
            a.metric = (parseInt(set_iface.substring(3)) + 1) * 10;
        }
        return a;
    }

    function volide_lan(state) {
        var a = {}, b = {}, extend_array = [], this_checked;
        b.iface = set_iface.toLowerCase();
        if (state == "unbind") {
            b.action = false;
        } else {
            b.action = true;
            b.ifname = '';
            this_checked = d('#interfaceTbody').find('input:checked');
            if (this_checked.length < 1) {
                h.ErrorTip(tip_num++, interface_bind_error);
                return;
            }
            this_checked.each(function (n, m) {
                extend_array[n] = d(m).parents('tr').find('.extend').text();
            });
            b.ifname = extend_array.join(' ');
            if(now_action == 'edit'){
                b.macaddr = now_macaddr;
            }else {
                d.each(ifnamelist, function (n, m) {
                    if (used_macaddr.indexOf(m.macaddr) < 0) {
                        b.macaddr = m.macaddr;
                        return false;
                    }
                });
            }
        }
        a.lan = b;
        return a;
    }

    et.saveConfig = function (evt) {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) {
            h.WarnTip(tip_num++, tips_wait + lock_time + tips_sec);
            return;
        }
        lock_web = true;
        if (iface_type == 'WAN') {
            arg_data = volide_wan(evt);
        } else if (iface_type == 'LAN') {
            arg_data = volide_lan(evt);
        }

        if (iface_type == 'WAN' && arg_data) {
            d('.closewin').click();
            set_wan_config(arg_data)

        } else if (iface_type == 'LAN' && arg_data) {
            d('.closewin').click();
            set_lan_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    function set_wan_config(arg) {
        f.setMConfig('mwan_bind', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
            }
        });
    }

    function set_lan_config(arg) {
        f.setMConfig('lan_dhcp_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
            }
        });
    }

    function reset_lock_web() {
        lock_time--;
        if (lock_time != 0) {
            setTimeout(reset_lock_web, 1000);
        } else {
            lock_web = false;
        }
    }

    b.init = init;
})
;
