define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var logs_info;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {
        getlogs();
    }

    function getlogs() {
        f.getMConfig('systemlog_get',function (data) {
            d("#log_tab").html('');
            if (data && data.errCode == 0) {
                logs_info = data.systemlog.systemlog;
                if (logs_info == "") {
                    return;
                }
                showloglist(logs_info);
            }
        });
    }

    function showloglist(logs) {
        var list_arry, this_html = "";

        list_arry = logs.split("\n").reverse();

        d.each(list_arry, function (n, m) {
            var reg1 = /^((.*?\s){5}.*?)/, reg2 = /^((.*?\s){7}.*?)/;
            var m_str, time, level, log;
            m_str = m.replace(/\s+/g, ' ');
            time = m_str.match(reg1);
            level = m_str.match(reg2)[0].replace(reg1, '').split(' ')[0].split('.')[1];
            log = m_str.replace(reg2, '');
            if (log == '') {
                return true;
            }
            this_html += '<tr>';
            this_html += '<td style="text-align: center;width: 200px">' + format_time(time[0]) + '</td>';
            this_html += '<td style="text-align: center;width: 120px">' + check_level(level) + '</td>';
            this_html += '<td>' + log + '</td></tr>';
        });
        d("#log_tab").html(this_html);
    }

    et.log_now = function () {
        getlogs();
    };

    function format_time(time) {
        var null_index = 0;
        var time_arr = time.split(' ');

        if (time_arr[2] == "") {
            null_index = 1;
        }
        time = time_arr[(4 + null_index)] + "/" + check_mounth(time_arr[1]) + "/" + time_arr[(2 + null_index)] + " " + time_arr[(3 + null_index)];
        return time;
    }

    function check_mounth(month) {
        var list = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var index;
        for (index = 0; index < list.length; index++) {
            if (month == list[index]) {
                return (index + 1);
            }
        }
    }

    function check_level(level) {
        var list = ["err_log", "debug_log", "info_log", "notice_log", "warn_log", "crit_log", "emerg_log", "alert_log"];
        var list_level = ["Error", "Debug", "Info", "Notice", "Waring", "Crit", "Emerg", "Alert"];
        var index;
        for (index = 0; index < list.length; index++) {
            if (list[index].indexOf(level) > -1) {
                return "<span class =\"" + list[index] + "\" style='letter-spacing: 1px;'>" + list_level[index] + "</span>";
            }
        }
    }

    b.init = init;
});