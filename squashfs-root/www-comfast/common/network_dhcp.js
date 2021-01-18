define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var lanlists_info, vlanlists_info, dhcp_action = 'lan', gloable_iface;
    var lock_web = false, tip_num = 0;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        var tmp_iparr = device.ip.split('.');
        var tmp_ip = tmp_iparr[0] + '.' + tmp_iparr[1] + '.' + tmp_iparr[2] + '.xxx';
        d('#defaut_ip').html(tmp_ip);
        if (device.mlan) {
            show_dns();
        }
        f.getMConfig('lan_dhcp_config', function (data) {
            if (data.errCode == 0) {
                lanlists_info = data.lanlist || [];
                vlanlists_info = data.vlanlist || [];
                network_init();
            }
        });
    }

    function show_dns() {
        d('#dns').removeClass('hide');
    }

    function network_init() {
        var this_html = '';

        if (device.mlan == 1 || device.vlan == 1) {
            d.each(lanlists_info, function (n, m) {
                var iface_name;
                if (device.mlan == 1) {
                    iface_name = g.ifacetoname(m.iface);
                } else {
                    iface_name = 'LAN';
                }
                if (m.iface == dhcp_action) {
                    this_html += '<li class="active">';
                    this_html += '<a href="#" data-toggle="tab" data-value="' + m.iface + '" et="click tap:dhcpnet" aria-expanded="true">' + iface_name + '</a>';
                } else {
                    this_html += '<li>';
                    this_html += '<a href="#" data-toggle="tab" data-value="' + m.iface + '" et="click tap:dhcpnet">' + iface_name + '</a>';
                }
                this_html += '</li>';
            });

            d.each(vlanlists_info, function (n, m) {
                if (m.iface == dhcp_action) {
                    this_html += '<li class="active">';
                    this_html += '<a href="#" data-toggle="tab" data-value="' + m.iface + '" et="click tap:dhcpnet" aria-expanded="true">' + m.iface.toUpperCase() + '</a>';
                } else {
                    this_html += '<li>';
                    this_html += '<a href="#" data-toggle="tab" data-value="' + m.iface + '" et="click tap:dhcpnet">' + m.iface.toUpperCase() + '</a>';
                }
                this_html += '</li>';
            });

            d('#if_dhcpnet').html(this_html);
        }
        fillvalue(dhcp_action);
    }

    function array_find(data, arg) {
        var return_data = {};
        d.each(data, function (n, m) {
            if (m.iface === arg) {
                return_data = m;
                return false;
            }
        })
        return return_data;
    }

    function fillvalue(dhcp_type) {
        var type_list, dnsarry, lanlist_dhcp;
        if (dhcp_type.indexOf('vlan') > -1) {
            type_list = array_find(vlanlists_info, dhcp_type);
        } else {
            type_list = array_find(lanlists_info, dhcp_type);
        }
        lanlist_dhcp = type_list.dhcp;
        gloable_iface = type_list.iface;
        if (lanlist_dhcp.dns) {
            dnsarry = lanlist_dhcp.dns.split(",");
            d("#dns_main").val(dnsarry[0] || "");
            d("#dns_backup").val(dnsarry[1] || "");
        }
        if (lanlist_dhcp.enable == "1") {
            d("#dhcp_server").val("enable");
            d('input[type=text]').removeAttr("disabled");
        } else {
            d("#dhcp_server").val("disable");
            d('input[type=text]').attr('disabled', 'disabled');
        }

        d("#dhcp_start").val(type_list.dhcp.start || "100");
        d("#dhcp_limit").val(type_list.dhcp.limit || "150");

        d("#dhcp_leasetime").val(type_list.dhcp.leasetime / 60 || "120");
        d("#dhcp_domain").val(type_list.dhcp.domain)
    }

    et.dhcpnet = function (evt) {
        dhcp_action = evt.attr('data-value');
        g.clearall();
        fillvalue(dhcp_action);
    };

    et.dhcpChange = function (evt) {
        if (d(evt).val() === "enable") {
            d('input[type=text].require').removeAttr('disabled');
        } else {
            d('input[type=text].require').attr('disabled', 'disabled').removeClass("borError");
            d(".icon-error").remove();
        }
    };

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
    };

    et.saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_volide()) {
            set_config({lan: arg_data})
        } else {
            lock_web = false;
        }
    };

    function set_volide() {
        var arg = {}, dnsarry = [], leasetime;

        dnsarry[0] = d("#dns_main").val();
        dnsarry[1] = d("#dns_backup").val();

        arg.dhcp = {};
        arg.dhcp.iface = gloable_iface;

        if (d("#dhcp_server").val() == "enable") {
            leasetime = d("#dhcp_leasetime").val() * 60;
            dnsarry[0] = d("#dns_main").val();
            dnsarry[1] = d("#dns_backup").val();

            arg.dhcp.enable = true;
            arg.dhcp.domain = d("#dhcp_domain").val();
            arg.dhcp.start = d("#dhcp_start").val();
            arg.dhcp.limit = d("#dhcp_limit").val();
            if (device.mwan) {
                arg.dhcp.dns = filterdns(dnsarry).join(',') || '';
            }

            arg.dhcp.leasetime = leasetime.toString();
        } else {
            arg.dhcp.enable = false;
        }
        return arg;
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
        f.setMConfig('lan_dhcp_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        })
    }

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});