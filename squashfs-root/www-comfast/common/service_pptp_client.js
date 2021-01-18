define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var pptp_info, lock_web = false, tip_num = 0;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('pptp_client_config', function (data) {
            if (data && data.errCode == 0) {
                pptp_info = data.pptp;
                pptp_init();
            }
        })
    }

    function pptp_init() {
        d('#switch').val(pptp_info.enable);
        d('#username').val(pptp_info.username || '');
        d('#passwd').val(pptp_info.password || '');
        d('#server').val(pptp_info.server || '');
        if (pptp_info.connected == 1) {
            d("#pptp_status").html(Connected);
        } else {
            if(pptp_info.enable == 1){
                d("#pptp_status").html(Connecting);
            }else {
                d("#pptp_status").html(ac_status_disabled);
            }
        }
        d("#pptp_ip").html(pptp_info.pptp_client_address || undistributed);
        if (pptp_info.enable == 0) {
            d('.main-box-body input').attr('disabled', true)
        }
    }

    et.enableConfig = function (evt) {
        if (d(evt).val() == 1) {
            d('.main-box-body input').attr('disabled', false)
        } else {
            d('.main-box-body input').attr('disabled', true)
        }
    };

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
    };

    et.save = function () {
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
        arg.enable = d("#switch").val();

        if (device.mwan == "1") {
            arg.metric = "100";
        }

        if (arg.enable == 1) {
            arg.username = d("#username").val();
            arg.password = d("#passwd").val();
            arg.server = d("#server").val();
        }
        return arg;
    }

    function set_config(arg) {
        f.setMConfig('pptp_client_config', arg, function (data) {
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