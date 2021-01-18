define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var wifidog_info;
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
        f.getMConfig('wifidog_config', function (data) {
            if (data && data.errCode == 0) {
                wifidog_info = data.wifidog;
                dmz_init();
            }
        })
    }

    function dmz_init() {
        disabled_import(wifidog_info.enabled);
        d('#switch').val(wifidog_info.enabled);
        d('#gateway_id').val(wifidog_info.gateway_id);
        d("#hostname").val(wifidog_info.hostname || "");
        d("#httpport").val(wifidog_info.httpport || "");
        d("#path").val(wifidog_info.path || "");
        d("#httpd_max_conn").val(wifidog_info.httpd_max_conn || "");
        d("#trusted_mac_list").val(wifidog_info.trusted_mac_list.toUpperCase());
        d("#trusted_web_list").val(wifidog_info.trusted_web_list);
    }

    et.enableConfig = function (evt) {
        disabled_import(d(evt).val())
    };

    function disabled_import(v) {
        if (v == '0') {
            d('input').attr('disabled', true);
            d('textarea').attr('disabled', true)
        } else {
            d('input').attr('disabled', false);
            d('textarea').attr('disabled', false)
        }
    }

    et.reset_list = function () {
        d('input').val('');
    }

    et.saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_volide()) {
            d('#closewin').click();
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    function set_volide() {
        var arg = {}, mac_string, mac_array = [], url_string, url_array = [];

        mac_string = d("#trusted_mac_list").val().toLowerCase();
        url_string = d("#trusted_web_list").val().toLowerCase();

        if (mac_string != "") {
            var tmp_mac_arr = mac_string.split(';');
            d.each(tmp_mac_arr, function (n, m) {
                if (d.inArray(m, mac_array) < 0) {
                    mac_array.push(m);
                } else {
                    return true;
                }
            })
        }

        if (url_string != "") {
            var tmp_url_arr = url_string.split(';');
            d.each(tmp_url_arr, function (n, m) {
                if (d.inArray(m, url_array) < 0) {
                    url_array.push(m);
                } else {
                    return true;
                }
            })
        }

        arg.enabled = d("#switch").val();
        arg.gateway_id = d("#gateway_id").val();
        arg.hostname = d("#hostname").val();
        arg.httpport = d("#httpport").val();
        arg.path = d("#path").val();
        arg.httpd_max_conn = d("#httpd_max_conn").val();
        arg.trusted_mac_list = mac_array.join(';');
        arg.trusted_web_list = url_array.join(';');

        return arg;
    }

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
    }

    function set_config(arg) {
        f.setMConfig('wifidog_config',arg, function (data) {
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