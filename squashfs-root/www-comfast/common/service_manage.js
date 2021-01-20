define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var remote_info, control_status;
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
        f.getMConfig('remote', function (data) {
            if (data && !data.errCode) {
                remote_info = data.remote;
                refresh_remote();
            }
        });

        f.getMConfig('remote_control', function (data) {
            if (data && !data.errCode) {
                control_status = data.remote_control.disable || 0;
                d("#control_enable").val(control_status);
            }
        });
    }

    function refresh_remote() {
        if (remote_info) {
            var enable = remote_info.enable || "0";
            var port = remote_info.port || "80";
            var ipaddr = remote_info.ipaddr || "";
            if (ipaddr == "0.0.0.0") {
                ipaddr = "";
            }
            if (enable == 0) {
                d("#port").attr('disabled', true);
                d("#ipaddr").attr('disabled', true);
            }
            d("#enable").val(enable);
            d("#port").val(port);
            d("#ipaddr").val(ipaddr);
        }
    }

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
    };

    et.control_doResetConfig = function () {
        g.clearall();
        refresh_init();
    };

    et.enableConfig = function (evt) {
        if (d(evt).val() == "0") {
            d("#port").attr("disabled", "disabled");
            d("#ipaddr").attr("disabled", "disabled");
        } else {
            d("#port").attr("disabled", false);
            d("#ipaddr").attr("disabled", false);
        }
    };

    et.saveConfig = function () {
        var arg_data;
        if (!g.format_volide_ok()) {
            return;
        }

        if (lock_web) return;
        lock_web = true;

        if (arg_data = set_volide()) {
            set_config(arg_data);
        } else {
            lock_web = false;
        }
    };

    function set_volide() {
        var arg = {};
        arg.enable = d("#enable").val();
        arg.port = d("#port").val();
        if (arg.port == '119') {
            h.ErrorTip(tip_num++, remote_port_tip);
            return false;
        }
        arg.ipaddr = d("#ipaddr").val() || "0.0.0.0";
        return arg;
    }

    et.control_saveConfig = function () {
        var arg = {};
        arg.disable = d("#control_enable").val();
        set_control_config(arg)
    };
    
    function gohref(){
       f.getSHConfig('remote_config.php', function(data){}, false);
    	window.location.href = "";
    }

    function set_config(arg) {
        f.setMConfig('remote', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
            } else {
            
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
                setTimeout(gohref, 2000);
            }
        })
    }

    function set_control_config(arg) {
        f.setMConfig('remote_control', arg, function (data) {
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
