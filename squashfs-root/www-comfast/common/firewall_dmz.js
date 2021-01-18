define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var dmz_info, lock_web = false, tip_num = 0;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('dmz_config', function (data) {
            if (data && data.errCode == 0) {
                dmz_info = data.dmz;
                dmz_init();
            }
        })
    }

    function dmz_init() {
        d('#enable').val(dmz_info.enable);
        d('#dest_ip').val(dmz_info.dest_ip || '');
        if (dmz_info.enable == 0) {
            d('#dest_ip').attr('disabled', true)
        }
    }

    et.enableConfig = function (evt) {
        if (d(evt).val() == 1) {
            d('#dest_ip').attr('disabled', false)
        } else {
            d('#dest_ip').attr('disabled', true)
        }
    };

    et.reset_list = function () {
        d('input').val('');
    };

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
        var arg = {};
        arg.enable = d("#enable").val();

        if (arg.enable == "1") {
            arg.dest_ip = d("#dest_ip").val();
        }
        return arg;
    }

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
    };

    function set_config(arg) {
        f.setMConfig('dmz_config', arg, function (data) {
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