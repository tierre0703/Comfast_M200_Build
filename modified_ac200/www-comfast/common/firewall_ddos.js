define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var ddos_info, lock_web = false, tip_num = 0;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('ddos_config', function (data) {
            if (data && data.errCode == 0) {
                ddos_info = data.ddos;
                ddos_fun();
            }
        })
    }

    function ddos_fun() {
        var enable_ucp = d('#ddos_udp'),
            enable_icmp = d('#ddos_icmp'),
            enable_syn = d('#ddos_syn'),
            enable_null = d('#ddos_null'),
            enable_fin = d('#ddos_fin'),
            enable_xmas = d('#ddos_xmas'),
            enable_ping = d('#ddos_ping'),
            enable_smurf = d('#ddos_smurf');

        d('#udp_thres').val(ddos_info.thres_udp || 2000);
        d('#icmp_thres').val(ddos_info.thres_icmp || 1000);
        d('#syn_thres').val(ddos_info.thres_syn || 200);

        if (ddos_info.enable_udp_flood) {
            d('#udp_box').removeClass('hidden');
            enable_ucp.prop("checked", true);
        } else {
            d('#udp_box').addClass('hidden');
            enable_ucp.prop("checked", false);
        }

        if (ddos_info.enable_icmp_flood) {
            d('#icmp_box').removeClass('hidden');
            enable_icmp.prop("checked", true);
        } else {
            d('#icmp_box').addClass('hidden');
            enable_icmp.prop("checked", false);
        }

        if (ddos_info.enable_syn_flood) {
            d('#syn_box').removeClass('hidden');
            enable_syn.prop("checked", true);
        } else {
            d('#syn_box').addClass('hidden');
            enable_syn.prop("checked", false);
        }

        if (ddos_info.enable_null_scan) {
            enable_null.prop("checked", true);
        } else {
            enable_null.prop("checked", false);
        }

        if (ddos_info.enable_fin_scan) {
            enable_fin.prop("checked", true);
        } else {
            enable_fin.prop("checked", false);
        }

        if (ddos_info.enable_xmas_tree) {
            enable_xmas.prop("checked", true);
        } else {
            enable_xmas.prop("checked", false);
        }

        if (ddos_info.enable_ping_of_death) {
            enable_ping.prop("checked", true);
        } else {
            enable_ping.prop("checked", false);
        }

        if (ddos_info.enable_smurf) {
            enable_smurf.prop("checked", true);
        } else {
            enable_smurf.prop("checked", false);
        }
    }

    et.icmp_status = function () {
        if (d("#ddos_icmp").is(':checked')) {
            d('#icmp_box').removeClass('hidden');
        } else {
            d('#icmp_box').addClass('hidden');
        }
    };

    et.udp_status = function () {
        if (d("#ddos_udp").is(':checked')) {
            d('#udp_box').removeClass('hidden');
        } else {
            d('#udp_box').addClass('hidden');
        }
    };

    et.syn_status = function () {
        if (d("#ddos_syn").is(':checked')) {
            d('#syn_box').removeClass('hidden');
        } else {
            d('#syn_box').addClass('hidden');
        }
    };

    et.saveConfig = function () {
        var ddos = {};
        var option = {};
        if (d("#ddos_udp").is(':checked')) {
            option.enable_udp_flood = 1;
        } else {
            option.enable_udp_flood = 0;
        }
        if (d("#ddos_icmp").is(':checked')) {
            option.enable_icmp_flood = 1;
        } else {
            option.enable_icmp_flood = 0;
        }
        if (d("#ddos_syn").is(':checked')) {
            option.enable_syn_flood = 1;
        } else {
            option.enable_syn_flood = 0;
        }
        if (d("#ddos_null").is(':checked')) {
            option.enable_null_scan = 1;
        } else {
            option.enable_null_scan = 0;
        }
        if (d("#ddos_fin").is(':checked')) {
            option.enable_fin_scan = 1;
        } else {
            option.enable_fin_scan = 0;
        }
        if (d("#ddos_xmas").is(':checked')) {
            option.enable_xmas_tree = 1;
        } else {
            option.enable_xmas_tree = 0;
        }
        if (d("#ddos_ping").is(':checked')) {
            option.enable_ping_of_death = 1;
        } else {
            option.enable_ping_of_death = 0;
        }
        if (d("#ddos_smurf").is(':checked')) {
            option.enable_smurf = 1;
        } else {
            option.enable_smurf = 0;
        }
        option.thres_icmp = parseInt(d('#icmp_thres').val());
        option.thres_udp = parseInt(d('#udp_thres').val());
        option.thres_syn = parseInt(d('#syn_thres').val());
        ddos.ddos = option;
        set_config(option);
    };

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
    };

    function set_config(arg) {
        f.setMConfig('ddos_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000);
            }
        })
    }

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});