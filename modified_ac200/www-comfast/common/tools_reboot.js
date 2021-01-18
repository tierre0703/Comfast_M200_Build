define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var lock_web = false, reboot_info, tip_num = 0;

    var weeks_num = ['1', '2', '3', '4', '5', '6', '0'];

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('system_timing_reboot', function (data) {
            if (data && data.errCode == 0) {
                reboot_info = data.timing_reboot;

                var timing_weeks = reboot_info.timing_weeks;
                if (timing_weeks != '') {
                    checked_week(timing_weeks.split(','));
                }

                d('#times_0').val(reboot_info.timing_time);
                g.swich('#reboot_switch', reboot_info.timing_enable);
                if (reboot_info.timing_enable == '1') {
                    d('#workdays').removeClass('hidden');
                }
                g.swich('#interval_enable', reboot_info.interval_enable);
                if (reboot_info.interval_enable == '1') {
                    d('#interval_time_box').removeClass('hidden');
                }
                d('#interval_redial_time').val(reboot_info.interval_time);

            }
        })
    }

    function checked_week(weeks) {
        d.each(weeks, function (n, m) {
            d('#weeks_0_' + m).prop('checked', true).attr('data-value', '1');
        });
        if (d('.week_0').length == d('.week_0:checked').length) {
            d('#weeks_all_0').prop('checked', true).attr('data-value', '1');
        }
    }

    et.reboot_status = function (evt) {
        if (d(evt).attr("data-value") == undefined && !d(evt).hasClass('switch_ext')) {
            evt = d(evt).parent();
        }
        var swich_status = evt.attr('data-value');
        var swich_defaut = evt.attr('data-default') || 1;
        if (swich_status == 1) {
            swich_status = 0;
        } else {
            swich_status = 1;
        }
        g.swich(evt, swich_status, swich_defaut);

        if (d(evt).attr('id') == 'interval_enable') {
            if (swich_status == swich_defaut) {
                d('#interval_time_box').removeClass('hidden');
                //d('#interval_redial_time').attr('disabled', false);
            } else {
                d('#interval_time_box').addClass('hidden');
                //d('#interval_redial_time').attr('disabled', true).removeClass('borError');
                //d('#interval_redial_time').parents('.list').find('.icon_margin').remove();
            }
        }

        if (d(evt).attr('id') == 'reboot_switch') {
            if (swich_status == swich_defaut) {
                d('#workdays').removeClass('hidden');
            } else {
                d('#workdays').addClass('hidden');
            }
        }
    };

    et.select_all_week = function (evt) {
        if (d(evt).attr('data-value') == '0') {
            d(evt).prop('checked', true).attr('data-value', '1');
            d('.week_0').prop('checked', true).attr('data-value', '1');
        } else if (d(evt).attr('data-value') == '1') {
            d(evt).prop('checked', false).attr('data-value', '0');
            d('.week_0').prop('checked', false).attr('data-value', '0');
        }
    };

    et.select_one_week = function (evt) {
        var weekcheck = d(evt).attr('data-value');
        if (weekcheck == '1') {
            d(evt).prop('checked', false).attr('data-value', '0');
            d('#weeks_all_0').prop('checked', false).attr('data-value', '0');
        } else {
            d(evt).prop('checked', true).attr('data-value', '1');
        }
        if (d('.week_0').length == d('.week_0:checked').length) {
            d('#weeks_all_0').prop('checked', true).attr('data-value', '1');
        }
    };

    et.saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_volide()) {
            d('.closewin').click();
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    function set_volide() {
        var arg = {}, week_arr = [];

        d.each(weeks_num, function (x, y) {
            var week_id = "#weeks_0_" + y;
            if (d(week_id).prop("checked") == true) {
                week_arr.push(y)
            }
        });

        arg.timing_enable = d('#reboot_switch').attr('data-value');
        arg.timing_weeks = week_arr.join(',');
        arg.timing_time = d('#times_0').val();
        arg.interval_enable = d('#interval_enable').attr('data-value');
        arg.interval_time = d('#interval_redial_time').val();

        return arg;
    }

    et.doResetConfig = function () {
        location.href = location.href;
    };

    et.reboot = function () {
        if (!confirm(reboot_header)) {
            return false;
        }
        if (lock_web) return;
        lock_web = true;
        f.setMConfig('system_reboot', '', function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                g.setting(device.reboor_time, gohref);
            }
        });
    };

    function set_config(arg) {
        f.setMConfig('system_timing_reboot', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 500);
            }
        });
    }

    function reset_lock_web() {
        lock_web = false;
    }

    function gohref() {
        location.href = 'http://' + location.hostname;
    }

    b.init = init;
});