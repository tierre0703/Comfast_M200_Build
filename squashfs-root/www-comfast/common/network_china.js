define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var wanlists_info, dns_type;
    var lock_web = false, tip_num = 0, wan_num = '0';

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('wan_config', function (data) {
            if (data.errCode == 0) {
                wanlists_info = data.wanlist;
                dns_type = wanlists_info[0].dns_type;
                fillvalue();
            }
        });
    }

    function fillvalue() {
        if (dns_type == '2') {
            d('#vpn_proxy').val('1');
        } else {
            d('#vpn_proxy').val('0');
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
    };

    function set_volide() {
        var arg = {};
        var vpn_proxy = d('#vpn_proxy').val();
        if (vpn_proxy == "1") {
            arg.dns_type = '2';
        } else {
            arg.dns_type = "0";
        }
        return arg;
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