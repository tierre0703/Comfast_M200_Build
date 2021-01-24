define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var wanlists_info, lanlists_info, vlanlists_info, localauth, action_flag = 'edit', list_num = 0, wan_num, real_num, gloable_iface = "wan", gloable_ifname = "eth0", set_time;
    var lock_web = false, tip_num = 0;
    
    var wan_extra_info;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        wan_num = 0;
        action_flag = 'edit';
        
        f.getSHConfig('network_config.php?method=GET&action=wan_info', function(data){
			wan_extra_info = data || [];
		},false);

        f.getMConfig('multi_pppoe', function (data) {
            if (data.errCode == 0) {
                wanlists_info = data.wanlist || [];
                network_init();
            }
        });

        f.getMConfig('lan_dhcp_config', function (data) {
            if (data.errCode == 0) {
                lanlists_info = data.lanlist || [];
                vlanlists_info = data.vlanlist || [];
            }
        });

        f.getMConfig('wifilith_config', function (data) {
            if (data && data.errCode == '0') {
                localauth = data.localauth;
            }
        });
    }

    function network_init() {
        var this_html = '';
        if (!wanlists_info) {
            return;
        }
        if (device.mwan == 1) {
            //d("#more_line").removeClass("hidden");
            d.each(wanlists_info, function (n, m) {
                if (n == list_num) {
                    this_html += '<li class="active">';
                    this_html += '<a href="#" data-toggle="tab" data-value="' + n + '" et="click tap:extranet" aria-expanded="true">' + wanlists_info[n][0].name.toUpperCase() + '</a>';
                } else {
                    this_html += '<li>';
                    this_html += '<a href="#" data-toggle="tab" data-value="' + n + '" et="click tap:extranet">' + wanlists_info[n][0].name.toUpperCase() + '</a>';
                }
                this_html += '</li>';
            });
            d('#if_extranet').html(this_html);
        }
        fillvalue();
    }

    function fillvalue() {
        var dnsarry, proto, proto_model;
        var dialing_html = '';
        proto = wanlists_info[list_num][wan_num].proto;

        proto_model = wanlists_info[list_num][wan_num][proto];
        real_num = wanlists_info[list_num][wan_num].real_num;

        d.each(wanlists_info[list_num], function (n, m) {
            if (n == wan_num) {
                dialing_html += '<option value="' + n + '" selected>' + (n + 1) + '</option>';
            } else {
                dialing_html += '<option value="' + n + '">' + (n + 1) + '</option>';
            }
        });
        d('#dialing').html(dialing_html);

        d('#linename').val(wanlists_info[list_num][wan_num].name.toUpperCase());
        if (wan_num == 0) {
            d('#linename').attr('readonly','readonly');
        } else {
            d('#linename').removeAttr('readonly');
        }

        d("#wan_aotu_ip").val(wanlists_info[list_num][wan_num].wan_ipaddr);
        d("#pppoe_aotu_ip").val(wanlists_info[list_num][wan_num].wan_ipaddr);
        d("#wan_mac").val(wanlists_info[list_num][wan_num].macaddr.toUpperCase() || "00:00:00:00:00:00");
        d("#macclone").val(wanlists_info[list_num][wan_num].macclone.toUpperCase() || "");
        d("#proto").val(proto);
        d("#mtu").val(wanlists_info[list_num][wan_num].mtu || '');
        d("#upload").val(wanlists_info[list_num][wan_num].upload / 1000 || '1000');
        d("#download").val(wanlists_info[list_num][wan_num].download / 1000 || '1000');
        
        var iface = wanlists_info[list_num][wan_num].iface || "";
        var wan_hostname = "";
        d.each(wan_extra_info, function(ex_index, ex_info){
			if(ex_info.iface == iface) {
				wan_hostname = ex_info.hostname;
				return false;
			}
		});
		d('#wan_hostname').val(wan_hostname);

        if (proto != '') {
            d("#ipaddr").val(proto_model.ipaddr || '');
            d("#netmask").val(proto_model.netmask || "255.255.255.0");
            d("#gateway").val(proto_model.gateway || '');

            if (proto_model.dns) {
                dnsarry = proto_model.dns.split(' ');
                d("#dns_main").val(dnsarry[0] || '');
                d("#dns_backup").val(dnsarry[1] || '');
            } else {
                d("#dns_main").val('');
                d("#dns_backup").val('');
            }

            d("#dhcp_hostname").val(proto_model.hostname || "");

            d("#username").val(proto_model.username || "");
            d("#password").val(proto_model.password || "");
            d("#sev_name").val(proto_model.service || "");
        }

        et.wanTypeConfig();
        gloable_iface = wanlists_info[list_num][wan_num].phy_interface;
        gloable_ifname = wanlists_info[list_num][wan_num].ifname;
    }

    et.addConfig = function () {
        if (wanlists_info[list_num].length == device.multi_pppoe_num) {
            h.ErrorTip(tip_num++, max_add);
            return false;
        }
        action_flag = 'add';
        d('.require').val('').removeClass('borError');
        d('#linename').removeAttr('readonly');
        d('.icon_margin').remove();
        d('#pppoe_aotu_ip').val('');
        d('#wan_aotu_ip').val('');
        d('#dialing').html();
        d('#proto').val('dhcp');
        d('#dhcp_div').removeClass('hide');
        d('#static_div').addClass('hide');
        d('#pppoe_div').addClass('hide');
        d("#upload").val("1000");
        d("#download").val("1000");

        if (d('#dialing').html().indexOf('add_dialing') < 0) {
            d('#dialing').append('<option sh_lang="add_dialing" selected>' + add_dialing + '</option>')
        }
        f.getMConfig('multi_pppoe_macaddr_config', function (data) {
            if (data.errCode == 0) {
                d('#wan_mac').val(data.macaddr.macaddr.toUpperCase())
            }
        })
    };

    et.delConfig = function () {
        var data = {};
        if (wan_num == 0) {
            h.ErrorTip(tip_num++, no_del);
            return;
        }
        data.action = "del";
        //data.macaddr = wanlists_info[list_num][wan_num].macaddr;
        data.real_num = wanlists_info[list_num][wan_num].real_num;
        data.phy_interface = wanlists_info[list_num][wan_num].phy_interface;
        set_config(data);
    };

    et.dialing_change = function (evt) {
        action_flag = 'edit';
        d('.require').removeClass('borError');
        wan_num = parseInt(evt.val());
        fillvalue();
    };

    et.extranet = function (evt) {
        list_num = evt.attr('data-value');
        wan_num = 0;
        fillvalue();
    };

    et.wanTypeConfig = function () {
        var proto_value = d("#proto").val();
        if (proto_value == "static") {
            d("#static_div").removeClass('hide');
            d("#pppoe_div").addClass('hide');
            d("#dhcp_div").addClass('hide');
        } else if (proto_value == "pppoe") {
            d("#static_div").addClass('hide');
            d("#pppoe_div").removeClass('hide');
            d("#dhcp_div").addClass('hide');
        } else if (proto_value == "dhcp") {
            d("#static_div").addClass('hide');
            d("#pppoe_div").addClass('hide');
            d("#dhcp_div").removeClass('hide');
        }
    }

    et.saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_volide()) {
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
    }

    et.redial = function () {
        var arg = {};
        arg.real_num = wanlists_info[list_num][wan_num].real_num;
        arg.action = 'one_click_redial';
        arg.phy_interface = wanlists_info[list_num][wan_num].phy_interface;
        set_config(arg);
    };

    function set_volide() {
        var a = {}, dnsarry = [], i, l, m;
        //set_time = 8000;

        a.action = action_flag;
        if (a.action == 'edit') {
            a.real_num = real_num;
        }
        a.name = d('#linename').val();

        a.proto = d("#proto").val();
        a.upload = '' + d("#upload").val() * 1000;
        a.download = '' + d("#download").val() * 1000;
        a.macaddr = d("#wan_mac").val().toLowerCase();
        a.macclone = d("#macclone").val().toLowerCase();

        for (i = 0; i < wanlists_info.length; i++) {
            for (l = 0; l < wanlists_info[i].length; l++) {
                m = wanlists_info[i][l];

                if (a.macclone == m.macaddr) {
                    h.ErrorTip(tip_num++, tips_has_same_mac);
                    return false;
                }

                if (a.macaddr == m.macaddr) continue;

                if (a.name == m.name.toUpperCase()) {
                    h.ErrorTip(tip_num++, same_name);
                    return false;
                }

                if (a.macclone == m.macaddr || (a.macclone != '' && a.macclone == m.macclone)) {
                    h.ErrorTip(tip_num++, tips_has_same_mac);
                    return false;
                }
            }
        }

        var first_mac = a.macclone.split(':')[0];
        if (a.macclone != '' && parseInt(first_mac, 16) % 2 != 0) {
            h.ErrorTip(tip_num++, tips_correct_mac);
            return false;
        }

        a.phy_interface = gloable_iface;
        if (a.proto == "static") {
            dnsarry[0] = d("#dns_main").val();
            dnsarry[1] = d("#dns_backup").val();
            a.ipaddr = d("#ipaddr").val();
            a.netmask = d("#netmask").val();
            a.gateway = d("#gateway").val();
            a.dns = filterdns(dnsarry).join(' ') || '';

            for (i = 0; i < wanlists_info.length; i++) {
                for (l = 0; l < wanlists_info[i].length; l++) {
                    m = wanlists_info[i][l];
                    if (a.macaddr == m.macaddr) continue;
                    if (a.ipaddr == m.wan_ipaddr) {
                        h.ErrorTip(tip_num++, local_subnet_conflict_tip1 + m.name.toUpperCase() + local_subnet_conflict_tip3);
                        return false;
                    }
                }
            }

            for (i = 0; i < lanlists_info.length; i++) {
                m = lanlists_info[i];
                if (a.iface == m.iface) continue;
                if (h.isEqualIP(a.ipaddr, a.netmask, m.ipaddr, m.netmask)) {
                    //if (device.mwan) {
                    //    h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + m.name + local_subnet_conflict_tip2);
                    //} else {
                        h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + m.name.toUpperCase() + local_subnet_conflict_tip2);
                    //}
                    return false;
                }
            }

            for (i = 0; i < vlanlists_info.length; i++) {
                m = vlanlists_info[i];
                if (a.iface == m.iface) continue;
                if (h.isEqualIP(a.ipaddr, a.netmask, m.ipaddr, m.netmask)) {
                    h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + m.name.toUpperCase() + local_subnet_conflict_tip2);
                    return false;
                }
            }

            if (localauth.guest_ipaddr != '' && localauth.guest_netmask != '' && h.isEqualIP(a.ipaddr, a.netmask, localauth.guest_ipaddr, localauth.guest_netmask)) {
                h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + auth_segment + local_subnet_conflict_tip2);
                return false;
            }

        } else if (a.proto == "pppoe") {
            a.username = d("#username").val();
            a.password = d("#password").val();
            a.service = d("#sev_name").val();
            a.mtu = d("#mtu").val();
        } else if (a.proto == "dhcp") {
            a.hostname = d("#dhcp_hostname").val();
        }
        return a;
    }

    function filterdns(data) {
        var newdata = [];
        d.each(data, function (n, m) {
            if (m != '') {
                newdata.push(m);
            }
        });
        return newdata;
    }

    function set_config(arg) {
		
		var iface = wanlists_info[list_num][wan_num].phy_interface;
		var wan_hostname = d('#wan_hostname').val();
		var ext_arg = {iface:iface, hostname:wan_hostname};
		f.setSHConfig('network_config.php?method=SET&action=wan_info', ext_arg, function (data){
		}, false);
		
		
        f.setMConfig('multi_pppoe', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                setTimeout(refresh_init, 1000);
                setTimeout(reset_lock_web, 3000)
            }
        })
    }

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});
