define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var tip_num = 0;

    var lock_web = false;

    function init() {
        e.plugInit(et, start_model);
    }


    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig("probe_server",function (data) {
            if (data && data.errCode == 0) {
                d('#probe_val').val(data.probe.server);
            }
        })
    }

    et.saveConfig = function () {
        var arg = {} ,arg_arr = [];
        var regExp_num = new RegExp("^\\d+$");
        arg_arr = d('#probe_val').val().split(':');
        if (arg_arr[0].indexOf('.') < 0 || !regExp_num.test(arg_arr[1])){
            h.ErrorTip(tip_num++, probe_server_url_ok);
            lock_web = false;
            return false;
        }
        arg.server = d('#probe_val').val();

        f.setMConfig("probe_server",arg, function (data) {
            if (data && data.errCode == 0) {
                h.SetOKTip(tip_num++, set_success);
            }
        });
    };

    b.init = init;
});