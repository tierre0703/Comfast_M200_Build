define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var wanlists_info, lanlists_info, vlanlists_info, localauth, lan_num = 0, gloable_iface = "lan", gloable_ifname = "eth5", set_time;
    var lock_web = false, tip_num = 0;

    var now_link_ip = location.hostname, now_link_iface;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {

        if (device.mlan == 1) {
            d("#other_lan").removeClass("hidden");
        }

        f.getMConfig('lan_dhcp_config', function (data) {
            if (data.errCode == 0) {
                lanlists_info = data.lanlist || [];
                vlanlists_info = data.vlanlist || [];
                network_init();
            }
        });

        f.getMConfig('wifilith_config', function (data) {
            if (data && data.errCode == '0') {
                localauth = data.localauth;
            }
        });

        f.getMConfig('multi_pppoe', function (data) {
            if (data && data.errCode == '0') {
                wanlists_info = data.wanlist || [];
            }
        })
    }

    function network_init() {
        var this_html = '';
        if (!lanlists_info) {
            return;
        }
        d.each(lanlists_info, function (n, m) {
            if (m.ipaddr == now_link_ip) {
                now_link_iface = m.iface;
            }
            if (n == lan_num) {
                this_html += '<li class="active">';
                this_html += '<a href="#" data-toggle="tab" data-value="' + n + '" et="click tap:localnet" aria-expanded="true">' + m.name.toUpperCase() + '</a>';
            } else {
                this_html += '<li>';
                this_html += '<a href="#" data-toggle="tab" data-value="' + n + '" et="click tap:localnet">' + m.name.toUpperCase() + '</a>';
            }
            this_html += '</li>';
        });
        if (device.mlan == 1) {
            d('#if_localnet').html(this_html);
        }
        fillvalue(lan_num);
    }

    function fillvalue(num) {
        var dnsarry;

        var lanlist_dhcp = lanlists_info[num].dhcp;
        if (lanlists_info[num].ifname != '') {
            d("#static_ip").val(lanlists_info[num].ipaddr || "");
            d("#static_netmask").val(lanlists_info[num].netmask || "255.255.255.0");
            d("#access_other_status").val(lanlists_info[num].otherlanaccess || "0");
            //	d("#static_gateway").val(lanlists_info[num].gateway || "");
            d("#lan_mac").val(lanlists_info[num].macaddr.toUpperCase() || "");
        }

        if (lanlist_dhcp.enable) {
            d('#dhcp_vessel').find('input[type=text]').removeAttr('readonly');
            d("#dhcp_server").val("enable");
        } else if (!lanlist_dhcp.enable) {
            d('#dhcp_vessel').find('input[type=text]').attr('readonly', 'readonly');
            d("#dhcp_server").val("disable");
        }
        d("#dhcp_start").val(lanlist_dhcp.start || "100");
        d("#dhcp_limit").val(lanlist_dhcp.limit || "150");
        d("#dhcp_leasetime").val(lanlist_dhcp.leasetime / 60 || "7200");
        d("#dhcp_domain").val(lanlist_dhcp.domain);
        if (lanlist_dhcp.dns) {
            dnsarry = lanlist_dhcp.dns.split(" ");
            d("#dns_main").val(dnsarry[0] || "");
            d("#dns_backup").val(dnsarry[1] || "");
        }

        gloable_iface = lanlists_info[num].iface;
        gloable_ifname = lanlists_info[num].ifname;
    }

    et.localnet = function (evt) {
        lan_num = evt.attr('data-value');
        g.clearall();
        fillvalue(lan_num);
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

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
    };

    function set_volide() {
        var a = {}, i, l, m;
        a.proto = "static";
        a.ipaddr = d("#static_ip").val();
        a.netmask = d("#static_netmask").val();
        a.otherlanaccess = d("#access_other_status").val();
        a.action = true;
        a.iface = gloable_iface;
        a.ifname = gloable_ifname;

        if (a.ipaddr == lanlists_info[lan_num].ipaddr && a.netmask == lanlists_info[lan_num].netmask && a.otherlanaccess == lanlists_info[lan_num].otherlanaccess) {
            h.SetOKTip(tip_num++, set_success);
            return;
        } else {
            set_time = 10000;
        }

        if (localauth.guest_ipaddr != '' && localauth.guest_netmask != '' && h.isEqualIP(a.ipaddr, a.netmask, localauth.guest_ipaddr, localauth.guest_netmask)) {
            h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + auth_segment + local_subnet_conflict_tip2);
            return false;
        }

        for (i = 0; i < lanlists_info.length; i++) {
            m = lanlists_info[i];
            if (a.iface == m.iface) continue;
            if (h.isEqualIP(a.ipaddr, a.netmask, m.ipaddr, m.netmask)) {
                h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + m.name.toUpperCase() + local_subnet_conflict_tip2);
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

        for (i = 0; i < wanlists_info.length; i++) {
            for (l = 0; l < wanlists_info[i].length; l++) {
                m = wanlists_info[i][l];
                if (h.isEqualIP(a.ipaddr, a.netmask, m.wan_ipaddr, m.wan_netmask)) {
                    h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + m.name.toUpperCase() + local_subnet_conflict_tip2);
                    return false;
                }
            }
        }
        return a;
    }

    function set_config(arg) {
        f.setMConfig('lan_dhcp_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                if (set_time == 0) {
                    h.SetOKTip(tip_num++, set_success);
                    setTimeout(gothishref, set_time)
                } else {
                    if (now_link_iface != arg.lan.iface) {
                        g.setting((set_time / 1000), gothishref);
                    } else {
                        g.setting((set_time / 1000), gohref);
                    }
                }
            }
        })
    }

    function gothishref() {
        location.href = location.href;
    }

    function gohref() {
        location.href = 'http://' + d('#static_ip').val() + location.pathname;
    }

    b.init = init;
});