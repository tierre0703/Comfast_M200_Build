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
        f.getMConfig("ac_enable_get", function (data) {
            //data = {"ac_enable": {"ac_enable": 0}, "errCode": 0, "errMsg": "OK", "configDone": false};
            if (data && data.errCode == 0) {
                d('#enable').val(data.ac_enable.ac_enable);
            }
        })
    }

    et.saveConfig = function () {
        var arg = {};
        arg.ac_enable = parseInt(d('#enable').val());

        f.setMConfig("ac_enable_set", arg, function (data) {
            if (data && data.errCode == 0) {
                h.SetOKTip(tip_num++, set_success);
            }
        });
    };

    b.init = init;
});