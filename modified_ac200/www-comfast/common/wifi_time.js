define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var radios_info, schedules_info;
    var lock_web = false, tip_num = 0;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {
        var i, time_hour = "", time_minute = "";
        for (i = 0; i < 24; i++) {
            time_hour += "<option value=" + i + ">" + i + "</option>";
        }

        for (i = 0; i < 60; i = i + 5) {
            time_minute += "<option value=" + i + ">" + i + "</option>";
        }

        d("#form_hour_24g").html(time_hour);
        d("#to_hour_24g").html(time_hour);
        d("#form_minute_24g").html(time_minute);
        d("#to_minute_24g").html(time_minute);

        d("#form_hour_58g").html(time_hour);
        d("#to_hour_58g").html(time_hour);
        d("#form_minute_58g").html(time_minute);
        d("#to_minute_58g").html(time_minute);

        f.getMConfig('guide_config', function (data) {
            if (data && data.errCode == '0') {
                radios_info = data.radios;
                d.each(radios_info, function (n, m) {
                    if (m.hwmode.indexOf('a') > -1) {
                        m.flag = '58g';
                        d("#radio_58g_box").removeClass("hidden");
                        if (radios_info.length == 1) {
                            d("#radio_24g_box").remove();
                        }
                    } else {
                        m.flag = '24g';
                        d("#radio_24g_box").removeClass("hidden");
                        if (radios_info.length == 1) {
                            d("#radio_58g_box").remove();
                        }
                    }
                });
            }
        }, false);

        f.getMConfig('wireless_schedule_info_get', function (data) {
            if (data && data.errCode == '0') {
                schedules_info = data.schedule;
                show_schedule();
            }
        });
    }

    function show_schedule() {
        var week_arr = [], sched_info;
        d.each(radios_info, function (n, m) {
            d("#to_hour_" + m.flag).val("23");
            d("#to_minute_" + m.flag).val("55");
            sched_info = schedules_info[n];

            d("#swich_time_" + m.flag).val(sched_info.schedule_enable || 0);
            show_time_box(sched_info.schedule_enable, m.flag);
            if (sched_info.schedule_start_time != "") {
                var formtime_array = sched_info.schedule_start_time.split(":");
                d("#form_hour_" + m.flag).val(formtime_array[0]);
                d("#form_minute_" + m.flag).val(formtime_array[1]);
            }
            if (sched_info.schedule_start_time != "") {
                var totime_array = sched_info.schedule_end_time.split(":");
                d("#to_hour_" + m.flag).val(totime_array[0]);
                d("#to_minute_" + m.flag).val(totime_array[1]);
            }

            if (sched_info.schedule_weeks != "") {
                week_arr = sched_info.schedule_weeks.split(",");
            }

            if (week_arr.length == '7' || week_arr.length == '0') {
                d("#weeks_" + m.flag).prop("checked", true).attr("data-value", "1");
            }
            if (week_arr.length != 0) {
                d.each(week_arr, function (x, y) {
                    d("#" + y + "_" + m.flag).prop("checked", true).attr("data-value", "1");
                })
            } else {
                d(".check_week_" + m.flag).prop("checked", true).attr("data-value", "1");
            }

        })
    }

    et.swich_time = function (evt) {
        show_time_box(evt.val(), evt.attr("data-flag"));
    };

    function show_time_box(data, flag) {
        if (data == "1") {
            d("#time_box_" + flag).removeClass("hidden");
        } else {
            d("#time_box_" + flag).addClass("hidden");
        }
    }

    et.check_week = function (evt) {
        var flag = evt.attr("data-flag");
        if (d(".check_week_" + flag + ":checked").length == 7) {
            d("#weeks_" + flag).prop("checked", true).attr("data-value", "1");
        } else {
            d("#weeks_" + flag).prop("checked", false).attr("data-value", "0");
        }
    };

    et.check_weeks = function (evt) {
        all_week(evt.attr("data-value"), evt.attr("data-flag"));
    };

    function all_week(data, flag) {
        if (data == 0) {
            d("#weeks_" + flag).attr("data-value", "1");
            d(".check_week_" + flag).prop("checked", true).attr("data-value", "1")
        } else {
            d("#weeks_" + flag).attr("data-value", "0");
            d(".check_week_" + flag).prop("checked", false).attr("data-value", "0");
        }
    }

    function time_volide() {
        var time_array = {}, form_hour, form_minute, to_hour, to_minute;
        time_array.schedule_radio = [];
        for (var i = 0; i < radios_info.length; i++) {
            var arr = [];
            time_array.schedule_radio[i] = {};
            var m = radios_info[i];
            form_hour = d("#form_hour_" + m.flag).val();
            form_minute = d("#form_minute_" + m.flag).val();
            to_hour = d("#to_hour_" + m.flag).val();
            to_minute = d("#to_minute_" + m.flag).val();

            time_array.schedule_radio[i].schedule_radio = "radio" + i;
            time_array.schedule_radio[i].schedule_enable = d("#swich_time_" + m.flag).val();

            if (time_array.schedule_radio[i].schedule_enable == "1") {

                if (d(".check_week_" + m.flag + ":checked").length == 0) {
                    h.ErrorTip(tip_num++, wire_days_select);
                    return false;
                } else {
                    d(".check_week_" + m.flag + ":checked").each(function (n, m) {
                        arr.push(d(m).val());
                    });
                }

                time_array.schedule_radio[i].schedule_weeks = arr.join(",");

                if (parseInt(form_hour + form_minute) == 0 && parseInt(to_hour + to_minute) == 0) {
                    h.ErrorTip(tip_num++, wire_timeslot_select);
                    return false;
                }

                if (parseInt(form_hour) > parseInt(to_hour) || (parseInt(form_hour) == parseInt(to_hour) && parseInt(form_minute) > parseInt(to_minute))) {
                    time_array.schedule_radio[i].schedule_start_time = to_hour + ":" + to_minute;
                    time_array.schedule_radio[i].schedule_end_time = form_hour + ":" + form_minute;
                } else {
                    time_array.schedule_radio[i].schedule_start_time = form_hour + ":" + form_minute;
                    time_array.schedule_radio[i].schedule_end_time = to_hour + ":" + to_minute;
                }
            }
        }
        return time_array;
    }

    et.saveConfig = function (evt) {
        d(evt).blur();
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = time_volide()) {
            set_timeconfig(arg_data)
        } else {
            lock_web = false;
        }
    };

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
    };

    function set_timeconfig(arg) {
        f.setMConfig('wireless_schedule_config', arg, function (data) {
            if (data.errCode != 0) {
                lock_web = false;
            } else {
                g.setting(10, gohref);
            };
        })
    }

    function gohref() {
        location.href = location.href;
    }

    b.init = init;
});
