define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var wanlists_info, wan_num, line_num, switch_status, dns_status;
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
        wan_num = 0;
        line_num = 0;
        f.getMConfig('multi_pppoe', function (data) {
            if (data.errCode == 0) {
                wanlists_info = data.wanlist || [];
                if (wanlists_info[0][0].dns_type == '1') {
                    switch_status = '1';
                    dns_status = '1';
                } else {
                    switch_status = '0';
                }
                g.swich('#switch_dns', switch_status);
                dns_show_box(switch_status);
            }
        });
    }

    et.switch_dns = function (evt) {
        var swich_status = evt.attr('data-value');
        var swich_defaut = evt.attr('data-default');
        if (swich_status == 1) {
            swich_status = 0;
        } else {
            swich_status = 1;
        }
        g.swich(evt, swich_status, swich_defaut);

        var click_value = evt.attr('data-value');
        var arg = {};
        if (click_value == '0') {
            arg.dns_type = "0";
        } else {
            arg.dns_type = "1";
            arg.mwan_list = [];
            var mwan_arr_num = 0;
            d.each(wanlists_info, function (x, single) {
                d.each(single, function (n, m) {
                    arg.mwan_list[mwan_arr_num] = {};
                    arg.mwan_list[mwan_arr_num].iface = m.iface;
                    arg.mwan_list[mwan_arr_num].enable = "1";
                    if (m.multi_dns != "") {
                        arg.mwan_list[mwan_arr_num].dns = m.multi_dns;
                    }
                    mwan_arr_num++;
                })
            });
            dns_show_box(swich_status);
        }
        set_status(arg);
    };

    function dns_show_box(data) {
        if (data == "1" || data == "3") {
            d("#more_dns_box").removeClass('hidden');
            more_wan_init(data);
        } else {
            d("#more_dns_box").addClass('hidden');
        }
    }

    function more_wan_init(data) {
        var tmp_html = "";
        d.each(wanlists_info, function (x, single) {
            d.each(single, function (n, m) {
                var dns_array = m.multi_dns.split(' ');
                tmp_html += "<tr class='text-center'>";
                tmp_html += "<td>" + m.name.toUpperCase() + "</td>";

                tmp_html += "<td class='dns_main'>" + (dns_array[0] || '') + "</td>";
                tmp_html += "<td class='dns_backup'>" + (dns_array[1] || '') + "</td>";
                if (m.multi_dns_enable == '1') {
                    tmp_html += "<td>" + status_enabled + "</td>";
                } else {
                    tmp_html += "<td>" + status_disabled + "</td>";
                }
                tmp_html += "<td class='wan_num hidden'>" + x + "</td>";
                tmp_html += "<td class='line_num hidden'>" + n + "</td>";
                tmp_html += '<td><a data-toggle="modal" data-target="#modal_one" sh_title="edit"  title="' + edit + '" class="table-link etid_btn" et="click tap:editConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a></td>';
                tmp_html += "</tr>";
            })
        });
        d("#tbody_info").html(tmp_html);
    }

    et.editConfig = function (evt) {
        g.clearall();
        port_config(evt);
    };

    function port_config(evt) {
        var dns_switch, dns_iface;

        wan_num = d(evt).parents('tr').find('.wan_num').text();
        line_num = d(evt).parents('tr').find('.line_num').text();
        dns_switch = wanlists_info[wan_num][line_num].multi_dns_enable || '0';
        dns_iface = wanlists_info[wan_num][line_num].iface;

        if (wanlists_info[wan_num][line_num].proto == 'static') {
            d("#more_dns_switch").attr('disabled', true);
        } else {
            d("#more_dns_switch").attr('disabled', false);
        }
        d("#more_dns_switch").val(dns_switch);
        d("#more_dns_iface").val(dns_iface);
        more_dns_swicth(dns_switch);
    }

    et.more_dns_switch = function (evt) {
        var dns_switch = evt.val();
        more_dns_swicth(dns_switch);
    };

    function more_dns_swicth(dns_switch) {
        var dns_array = wanlists_info[wan_num][line_num].multi_dns.split(' ');
        if (dns_switch == '1') {
            d("#more_dns_main").val(dns_array[0] || '').attr('readonly', false);
            d("#more_dns_backup").val(dns_array[1] || '').attr('readonly', false);
        } else {
            d("#more_dns_main").val(dns_array[0] || '').attr('readonly', true);
            d("#more_dns_backup").val(dns_array[1] || '').attr('readonly', true);
        }
    }

    et.more_saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = more_volide()) {
            d('.closewin').click();
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    function more_volide() {
        var arg = {}, dnsarry = [];

        dnsarry[0] = d("#more_dns_main").val();
        dnsarry[1] = d("#more_dns_backup").val();

        arg.dns_type = "1";
        arg.mwan_list = [];

        if (d("#network_same_dns").is(':checked')) {
            var mwan_arr_num = 0;
            for (var i = 0; i < wanlists_info.length; i++) {
                for (var j = 0; j < wanlists_info[i].length; j++ , mwan_arr_num++) {

                    var m = wanlists_info[i][j];
                    arg.mwan_list[mwan_arr_num] = {};
                    arg.mwan_list[mwan_arr_num].enable = d("#more_dns_switch").val();
                    arg.mwan_list[mwan_arr_num].iface = m.iface;
                    arg.mwan_list[mwan_arr_num].dns = filterdns(dnsarry).join(' ') || '';
                    if (m.proto == "static" && (arg.mwan_list[i].enable == "0" || arg.mwan_list[mwan_arr_num].dns == '')) {
                        arg.mwan_list[mwan_arr_num].enable = "1";
                        arg.mwan_list[mwan_arr_num].dns = m.dns;
                        continue;
                    }
                    if (arg.mwan_list[mwan_arr_num].dns == '') {
                        arg.mwan_list[mwan_arr_num].enable = "0"
                    }
                }
            }
        } else {
            arg.mwan_list[0] = {};
            arg.mwan_list[0].enable = d("#more_dns_switch").val();
            arg.mwan_list[0].iface = d("#more_dns_iface").val();
            arg.mwan_list[0].dns = filterdns(dnsarry).join(' ') || '';
            if (wanlists_info[wan_num][line_num].proto == "static" && arg.mwan_list[0].dns == '') {
                h.ErrorTip(tip_num++, vpn_dns_null);
                return false;
            }
            if (arg.mwan_list[0].dns == '') {
                arg.mwan_list[0].enable = "0"
            }
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

    function set_status(arg) {
        f.setMConfig('dns_config', arg, function (data) {
            if (data.errCode == 0) {
                refresh_init();
            }
        })
    }

    function set_config(arg) {
        f.setMConfig('dns_config', arg, function (data) {
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