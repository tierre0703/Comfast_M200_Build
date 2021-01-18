define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var lock_web = false;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        notimeout();
    }

    function notimeout() {
        f.getMConfig('system_usage', function () {
        });
        setTimeout(notimeout, 60000)
    }

    et.ping_now = function () {
        var arg = {};
        if (lock_web) return;
        lock_web = true;

        arg.destination = d("#addr").val();

        if (arg.destination == '') {
            lock_web = false;
            return;
        }

        d("#pingtext").text(wlsurvey_wait_explain).removeClass('hide');
        d("#btn-ping").attr("disabled", true);

        f.setMConfig('ping_config', arg, function (data) {
            if (data && data.errCode == 0) {
                lock_web = false;
                if (data.pinglog.pinglog == "") {
                    return;
                }
                d("#pingtext").text(data.pinglog.pinglog);
                d("#btn-ping").removeAttr("disabled");
            }
        });
    };

    b.init = init;
});