define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var lock_web = false, tip_num = 0;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
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
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    function set_volide() {
        var arg = {};
        if (d("#cpasswd").val() != d('#npasswd').val()) {
            h.ErrorTip(tip_num++, password_passwd_unmatched);
            lock_web = false;
            return false;
        }
        arg.username = "admin";
        arg.password = d("#cpasswd").val();
        arg.oldPassword = d("#opasswd").val();
        return arg;
    }

    et.doResetConfig = function () {
        g.clearall();
    };

    function set_config(arg) {
        f.setSConfig('admin_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, check_password_note);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                setTimeout(gohref, 1000)
            }
        }, true, 1)
    }

    function gohref() {
        location.href = '/'
    }

    b.init = init;
});