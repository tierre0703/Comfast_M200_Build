define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);
    require('datatables')(d);
    require('tabletool')(d);

    var action, timing_redial, edit_num;
    var this_table, lock_web = false, tip_num = 0, default_num = 100, unit = ' min';

    var weeks_num = ['1', '2', '3', '4', '5', '6', '0'];
    var weeks_name = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    function init() {
        d('.select_line').val(default_num);
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('timing_redial', function (data) {
            if (data && data.errCode == 0) {
                timing_redial = data.timing_redial_list || [];
                showtable();
            }
        })
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(timing_redial, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td>' + m.name.toUpperCase() + '</td>';
            this_html += '<td class="redial_enable hidden">' + m.redial_enable + '</td>';
            if (m.redial_enable == '1') {
                this_html += '<td>ON</td>';
            } else {
                this_html += '<td>OFF</td>';
            }
            this_html += '<td class="interval_enable hidden">' + m.interval_redial_enable + '</td>';
            if (m.interval_redial_enable == '1') {
                this_html += '<td>' + m.interval_redial_time + unit + ' </td>';
            } else {
                this_html += '<td>OFF</td>';
            }
            this_html += '<td class="redial_time">' + show_config(m.redial_time) + '</td>';
            this_html += '<td class="num hidden" >' + n + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link"><span class="fa-stack" et="click tap:editConfig"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '"  class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '</tr>';
        });
        d('#tbody_info').html(this_html);

        if (timing_redial.length > 0) {
            this_table = d('#table').DataTable({
                "bDestroy": true,
                "columns": [
                    {"orderable": false},
                    null,
                    null,
                    null,
                    null,
                    {"orderable": false},
                    null,
                    {"orderable": false}
                ]
            });
            this_table.page.len(default_num).draw();
        }
    }

    function show_config(redial_time) {
        var this_html = '';
        d.each(redial_time, function (n, m) {
            this_html += '<p>(';
            var weeks_arr = m.weeks.split(',');
            if (weeks_arr.length == 7) {
                this_html += '<span sh_lang="everyday">' + everyday + '</span>';
            } else {
                d.each(weeks_arr, function (x, y) {
                    //console.dir(weeks_name[d.inArray('1', weeks_num)])
                    if (x < weeks_arr.length - 1) {
                        this_html += '<span sh_lang="' + weeks_name[d.inArray(y, weeks_num)] + '">' + eval(weeks_name[d.inArray(y, weeks_num)]) + '</span>、';
                    } else {
                        this_html += '<span sh_lang="' + weeks_name[d.inArray(y, weeks_num)] + '">' + eval(weeks_name[d.inArray(y, weeks_num)]) + '</span>';
                    }
                });
            }
            this_html += ')<span>' + m.time + '</span><span sh_lang="redial">' + redial + '</span></p>';
        });
        return this_html;
    }

    et.vlantype = function (evt) {
        var type_value = evt.val();
        if (type_value == 2) {
            d('#vlan_port_div').addClass('hide');
            d('#vlan_line_div').removeClass('hide')
        } else if (type_value == 1) {
            d('#vlan_port_div').removeClass('hide');
            d('#vlan_line_div').addClass('hide')
        }
    };

    et.radiobox = function (evt) {
        g.radiobox(evt);
    };

    et.changestatus = function (evt) {
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

        if (d(evt).attr('id') == 'interval_redial_enable') {
            if (swich_status == swich_defaut) {
                d('#interval_redial_time').attr('disabled', false);
            } else {
                d('#interval_redial_time').attr('disabled', true).removeClass('borError');
                d('#interval_redial_time').parents('.list').find('.icon_margin').remove();
            }
        }

        if (d(evt).attr('id') == 'autoredial') {
            if (swich_status == swich_defaut) {
                d('#workdays').removeClass('hidden');
            } else {
                d('#workdays').addClass('hidden');
            }
        }
    };

    et.editConfig = function (evt) {
        action = 'edit';
        g.clearall();
        edit_num = parseInt(d(evt).parents('tr').find('.num').text());
        editConfig();
    };

    function editConfig() {
        var line_config = timing_redial[edit_num];
        var redial_time = line_config.redial_time;
        checked_week(redial_time);
        edit_config(line_config);
    }

    function checked_week(redial_time) {
        var this_html = '';
        if (redial_time.length == 0) {
            createweeks(0);
            return false;
        }

        d.each(redial_time, function (n, m) {
            var weeks_arr = m.weeks.split(',');
            this_html += '<div class="row list">';
            this_html += '<div class="col-lg-8 col-sm-10 col-xs-12 col-lg-offset-2 col-sm-offset-1 col-xs-offset-0 weeks_check_' + n + '">';
            this_html += '<div class="col-lg-3 col-sm-3 col-xs-6 text-center">';
            this_html += '<label for="weeks_all_' + n + '" sh_lang="weeks_all">' + weeks_all + '</label>';
            if (weeks_arr.length == weeks_num.length) {
                this_html += '<input type="checkbox" data-value="1" data-group="' + n + '" et="change:select_all_week" checked id="weeks_all_' + n + '">';
            } else {
                this_html += '<input type="checkbox" data-value="0" data-group="' + n + '" et="change:select_all_week" id="weeks_all_' + n + '">';
            }
            this_html += '</div>';
            d.each(weeks_num, function (x, y) {
                var is_set = 0;
                d.each(weeks_arr, function (o, p) {
                    if (y == p) {
                        this_html += '<div class="col-lg-3 col-sm-3 col-xs-6 text-center">';
                        this_html += '<label for="weeks_' + n + '_' + y + '" sh_lang="' + weeks_name[d.inArray(y, weeks_num)] + '">' + eval(weeks_name[d.inArray(y, weeks_num)]) + '</label>';
                        this_html += '<input type="checkbox" checked data-value="1" data-group="' + n + '" et="change:select_one_week" class="week_' + n + '" id="weeks_' + n + '_' + y + '">';
                        this_html += '</div>';
                        is_set = 1;
                        return false;
                    }
                });

                if (is_set) {
                    return true;
                }

                this_html += '<div class="col-lg-3 col-sm-3 col-xs-6 text-center">';
                this_html += '<label for="weeks_' + n + '_' + y + '" sh_lang="' + weeks_name[d.inArray(y, weeks_num)] + '">' + eval(weeks_name[d.inArray(y, weeks_num)]) + '</label>';
                this_html += '<input type="checkbox" data-value="0" data-group="' + n + '" et="click tap:select_one_week" class="week_' + n + '" class="week_' + n + '" id="weeks_' + n + '_' + y + '">';
                this_html += '</div>';
            });

            this_html += '</div></div>';
            this_html += '<div class="row list">';
            this_html += '<div class="col-lg-5 col-sm-4 col-xs-4 form_left text-right">';
            this_html += '<span sh_lang="timing_redial_time">' + timing_redial_time + '</span>';
            this_html += '</div>';
            this_html += '<div class="col-lg-4 col-sm-5 col-xs-7 form_right">';
            this_html += '<span class="tip_name hide" sh_lang="timing_redial_time">' + timing_redial_time + '</span>';
            //this_html += '<input type="text" class="form-control myTime" readonly style="background: none;cursor: pointer" id="times_' + n + '" value="' + m.time + '">';
            this_html += '<input type="text" class="form-control require isUNNULL isTime" id="times_' + n + '" value="' + m.time + '"><p sh_lang="tip_time_format">' + tip_time_format + '</p>';
            this_html += '</div></div>';
        });
        d('#workdays').html(this_html);
        h.volide('body');
    }

    function createweeks(n) {
        var this_html = '';
        this_html += '<div class="row list">';
        this_html += '<div class="col-lg-8 col-sm-10 col-xs-12 col-lg-offset-2 col-sm-offset-1 col-xs-offset-0 weeks_check_' + n + '">';
        this_html += '<div class="col-lg-3 col-sm-3 col-xs-6 text-center">';
        this_html += '<label for="weeks_all_0" sh_lang="weeks_all">' + weeks_all + '</label>';
        this_html += '<input type="checkbox" name="mport" data-value="0" data-group="' + n + '" et="change:select_all_week" id="weeks_all_0">';
        this_html += '</div>';
        d.each(weeks_num, function (x, y) {
            this_html += '<div class="col-lg-3 col-sm-3 col-xs-6 text-center">';
            this_html += '<label for="weeks_0_' + y + '" sh_lang="' + weeks_name[d.inArray(y, weeks_num)] + '">' + eval(weeks_name[d.inArray(y, weeks_num)]) + '</label>';
            this_html += '<input type="checkbox" data-value="0" data-group="' + n + '" et="change:select_one_week" class="week_' + n + '" id="weeks_0_' + y + '">';
            this_html += '</div>';
            //this_html += '<div class="col-lg-3 col-sm-3 col-xs-6"><label for="weeks_sun"></label><input type="checkbox" name="mport" data-value="' + m + '" id="weeks_sun"></div>';
        });
        this_html += '</div></div>';
        this_html += '<div class="row list">';
        this_html += '<div class="col-lg-5 col-sm-4 col-xs-4 form_left text-right">';
        this_html += '<span sh_lang="timing_redial_time">' + timing_redial_time + '</span>';
        this_html += '</div>';
        this_html += '<div class="col-lg-4 col-sm-5 col-xs-7 form_right">';
        this_html += '<span class="tip_name hide" sh_lang="timing_redial_time">' + timing_redial_time + '</span>';
        //this_html += '<input type="text" class="form-control " value="" id="times_0">';
        this_html += '<input type="text" class="form-control require isUNNULL isTime" value="00:00" id="times_0"><p sh_lang="tip_time_format">' + tip_time_format + '</p>';
        this_html += '</div></div>';
        d('#workdays').html(this_html);
    }

    function edit_config(data) {
        d('.require').unbind('blur');

        d('#linename_id').val((data.name == '' ? g.ifacetoname(data.iface) : data.name));
        g.swich('#autoredial', data.redial_enable);
        if (data.redial_enable == '1') {
            d('#workdays').removeClass('hidden');
        } else {
            d('#workdays').addClass('hidden');
        }
        g.swich('#interval_redial_enable', data.interval_redial_enable);

        if (data.interval_redial_enable == 0) {
            d('#interval_redial_time').val('').attr('disabled', true).removeClass('borError');
        } else {
            d('#interval_redial_time').val(data.interval_redial_time);
        }
        //d('.myTime').timepicki({'value': d('.myTime').val()});
        h.volide('body');
    }

    et.select_all_week = function (evt) {
        var group_num = d(evt).attr('data-group');
        if (d(evt).attr('data-value') == '0') {
            d(evt).prop('checked', true).attr('data-value', '1');
            d('.week_' + group_num).prop('checked', true).attr('data-value', '1');
        } else if (d(evt).attr('data-value') == '1') {
            d(evt).prop('checked', false).attr('data-value', '0');
            d('.week_' + group_num).prop('checked', false).attr('data-value', '0');
        }
    };

    et.select_one_week = function (evt) {
        var weekcheck = d(evt).attr('data-value');
        var weekgroup = d(evt).attr('data-group');
        if (weekcheck == '1') {
            d(evt).prop('checked', false).attr('data-value', '0');
            d('#weeks_all_' + weekgroup).prop('checked', false).attr('data-value', '0');
        } else {
            d(evt).prop('checked', true).attr('data-value', '1');
        }

        if (d('.week_' + weekgroup).length == d('.week_' + weekgroup + ':checked').length) {
            d('#weeks_all_' + weekgroup).prop('checked', true).attr('data-value', '1');
        }
    }

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
        var arg = {}, redial_time = [];
        arg.iface = timing_redial[edit_num].iface;
        arg.name = timing_redial[edit_num].name;
        arg.timing_disabled = d('#autoredial').attr('data-value');
        arg.interval_disabled = d('#interval_redial_enable').attr('data-value');
        arg.interval_time = d('#interval_redial_time').val();
        arg.redial_time = timing_redial[edit_num].redial_time || [];

        /*        if (d('.myTime').val() == '') {
         h.ErrorTip(tip_num++, timing_redial_time + null_tips);
         d('.myTime').focus();
         return false;
         }*/

        d('[class*=weeks_check_]').each(function (n, m) {
            var week_arr = [], time_arr;
            redial_time[n] = {};
            d.each(weeks_num, function (x, y) {
                var week_id = "#weeks_" + n + "_" + y;
                if (d(week_id).prop("checked") == true) {
                    week_arr.push(y)
                }
            });
            redial_time[n].weeks = week_arr.join(',');
            if (redial_time[n].weeks == '') {
                redial_time[n].weeks = weeks_num.join(',');
            }
            time_arr = d('#times_' + n).val().split(':');
            if (time_arr[0].length < 2) {
                time_arr[0] = '0' + time_arr[0];
            }
            redial_time[n].time = time_arr.join(':');
        });

        arg.redial_time = redial_time;
        return arg;
    }

    function set_config(arg) {
        f.setMConfig('timing_redial', arg, function (data) {
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

    b.init = init;
});
