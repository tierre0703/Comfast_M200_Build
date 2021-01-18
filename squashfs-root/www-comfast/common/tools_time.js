define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var lock_web = false, tip_num = 0, ntptime_info;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('ntp_timezone', function (data) {
            if (data && !data.errCode) {
                ntptime_info = data.ntp;
                refresh_ntptime();
            }
        });
    }

    function refresh_ntptime() {
        var servername;
        var time = "";
        if (ntptime_info) {
            //time format:1999-02/21/99-19:41:27
            time += ntptime_info.timestr.substring(0, 4);
            time += "-";
            time += ntptime_info.timestr.substring(5, 7);
            time += "-";
            time += ntptime_info.timestr.substring(8, 10);
            time += " ";
            time += ntptime_info.timestr.substring(14, 16);
            time += ":";
            time += ntptime_info.timestr.substring(17, 19);
            time += ":";
            time += ntptime_info.timestr.substring(20);
            d("#localtime").val(time);
            d("#ntp_switch").val(ntptime_info.ntp_client_enabled);
            if(ntptime_info.ntp_client_enabled == '1'){
                d('#syn_time').removeClass('hidden');
            }else {
                d('#syn_time').addClass('hidden');
            }
            d("#timezone").val(ntptime_info.zonename || "63");
            servername = ntptime_info.ntp_servername.split(" ")[0];
            d("#servername").val(servername || "");
        }
    }
    
    et.ntp_switch = function (evt) {
        if(evt.val() == '1'){
            d('#syn_time').removeClass('hidden');
        }else {
            d('#syn_time').addClass('hidden');
        }
    }

    et.cptime = function () {
        if (d('#ntp_switch').val() == 1) {
            refresh_init();
        } else {

            var date = new Date();
            var time = "";
            time += date.getFullYear();
            time += "-";
            if ((date.getMonth() + 1) < 10) {
                time += "0";
            }
            time += (date.getMonth() + 1);
            time += "-";
            if (date.getDate() < 10) {
                time += "0";
            }
            time += date.getDate();
            time += " ";
            if (date.getHours() < 10) {
                time += "0";
            }
            time += date.getHours();
            time += ":";
            if (date.getMinutes() < 10) {
                time += "0";
            }
            time += date.getMinutes();
            time += ":";
            if (date.getSeconds() < 10) {
                time += "0";
            }
            time += date.getSeconds();
            d("#localtime").val(time);
        }
    };

    et.doResetConfig = function () {
        refresh_init();
    };

    et.saveConfig = function () {
        var arg = {};

        arg.timestr = d("#localtime").val();
        arg.timezone = d("#timezone").find("option:selected").attr("data-value");
        arg.zonename = d("#timezone").val();
        arg.ntp_client_enabled = d("#ntp_switch").val();

        if (arg.ntp_client_enabled == "1" && d("#servername").val() == "") {
            h.ErrorTip(tip_num++, timeserver_is_null);
            return;
        }
        arg.ntp_servername = d("#servername").val();

        set_config(arg);
    };

    function set_config(arg) {
        f.setMConfig('ntp_timezone', arg, function (data) {
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