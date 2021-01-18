define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);
    require("upload")(d);

    var lock_web = false, tip_num = 0;

    var interval;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        interval = setInterval(function(){
            notimeout();
        }, 60000);
    }

    function notimeout() {
        f.getMConfig('system_usage', function () {});
    }

    et.factory_reset = function () {
        if (!confirm(reset_tip)) {
            return false;
        }
        clearInterval(interval);
        f.setMConfig('system_reset', '', function () {
            g.setting(device.reset_time, godefault);
        });
    };

    et.get_backfile = function () {
        f.getBackupFile();
    };

    et.set_setting = function () {
        if (d("#uploadfile").val().match(/\.file$|\.FILE$/i) == null) {
            h.ErrorTip(tip_num++, upload_back_failed);
            return;
        }

        if (lock_web) return;
        lock_web = true;
        d("#uploadfile").upload({
            url: '/cgi-bin/mbox-config?method=SET&section=system_load_config',
            onComplate: function (data) {
                if (data && data.errCode != 0) {
                    h.ErrorTip(tip_num++, data.errCode);
                    lock_web = false;
                } else {
                    g.setting(device.reset_time, gohref);
                }
            }
        });
        d("#uploadfile").upload("ajaxSubmit");
    };

    et.doResetConfig = function () {
        var ie = !-[1,];
        var afile = d("input");
        if (ie) {
            afile.replaceWith(afile.clone());
        } else {
            afile.val('');
        }
    }

    function godefault() {
        window.location.href = 'http://' + device.ip + '/login.html';
    }

    function gohref() {
        location.href = 'http://' + location.host;
    }

    b.init = init;
});