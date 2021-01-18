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

    var urlfilter_info, optflag;
    var this_table, lock_web = false, tip_num = 0, default_num = 10;

    function init() {
        d('.select_line').val(default_num);
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('urlft_config', function (data) {
            if (data.errCode == 0) {
                urlfilter_info = data.url_filter_list || [];
                showtable();
            }
        });
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(urlfilter_info, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden">' + m.url_com_num + '</td>';
            this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="url_name">' + m.url_name + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:editConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger" et="click tap:deleteConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + ac_group_del_btn + '" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '</tr>';
        });
        d("#tbody_info").html(this_html);

        if (urlfilter_info.length > 0) {
            this_table = d('#table').DataTable({
                "aaSorting": [[2, "asc"]],
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    null,
                    null,
                    {"orderable": false}
                ],
                "drawCallback": function () {
                    laber_text(false);
                    d(":checkbox", d('#table_wrapper')).prop('checked', false);
                }
            });
            this_table.page.len(default_num).draw();
        }
    }

    d('#table').on("change", ":checkbox", function () {
        if (d(this).is("[name='checked-all']")) {
            d(":checkbox:enabled", d('#table')).prop("checked", d(this).prop("checked"));
            laber_text(d(this).prop("checked"));
        } else {
            var checkbox = d("tbody :checkbox:enabled", d('#table'));
            d(":checkbox[name='checked-all']", d('#table')).prop('checked', checkbox.length == checkbox.filter(':checked:enabled').length);
            laber_text(checkbox.length == checkbox.filter(':checked:enabled').length);
        }
    }).on("click", ".row-checkbox", function (event) {
        !d(event.target).is(":checkbox") && d(":checkbox", this).trigger("click");
    });

    function laber_text(status) {
        if (status) {
            d("[for='allchecked']").text(disselectall_tab);
        } else {
            d("[for='allchecked']").text(selectall_tab);
        }
    }

    et.displayline = function (evt) {
        default_num = d(evt).val();
        if (urlfilter_info.length > 0) {
            this_table.page.len(default_num).draw();
        }
        d(evt).blur();
    };

    et.add_list = function () {
        optflag = "add";
        g.clearall();
    };

    et.saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_volide()) {
            d('#closewin').click();
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    function set_volide() {
        var a = {}, b = [], error_flag = 0, urlfilter_num = 0;

        if (optflag == 'add' && urlfilter_info.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        if (urlfilter_info.length) {
            urlfilter_num = g.getifacenum(urlfilter_info[urlfilter_info.length - 1].url_com_num);
        }
        urlfilter_num++;

        b[0] = {};
        b[0].url_name = d("#url").val();
        if (d("#real_num").val() != "") {
            b[0].url_com_num = d("#real_num").val();
        } else {
            b[0].url_com_num = "url_filter" + (parseInt(urlfilter_num));
        }
        if (urlfilter_info && urlfilter_info.length) {
            d.each(urlfilter_info, function (n, m) {
                if (b[0].url_name == m.url_name) {
                    if (b[0].url_com_num == m.url_com_num) {
                        return true;
                    }
                    h.ErrorTip(tip_num++, urlfilter_same);
                    error_flag = 1;
                    return false;
                }
            });
        }


        if (error_flag) {
            return false;
        }
        b[0].action = optflag;
        a.url_filter_list = b;
        return a;
    }

    et.del_select = function () {
        var a = {}, b = [], this_checked;
        this_checked = d('#tbody_info').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        a.list = '';
        this_checked.each(function (n, m) {
            b[n] = {};
            b[n].action = 'del';
            b[n].url_com_num = d(m).parents('tr').find('.real_num').text();
        });
        a.url_filter_list = b;
        set_config(a);
    }

    et.deleteConfig = function (evt) {
        var a = {}, b = [];
        b[0] = {};
        b[0].url_com_num = d(evt).parents('tr').find('.real_num').text();
        b[0].action = "del";
        a.url_filter_list = b;
        set_config(a);
    }

    et.editConfig = function (evt) {
        g.clearall();
        optflag = "edit";
        setform(evt);
    }

    function setform(evt) {
        var url_name, real_num;
        url_name = d(evt).parents('tr').find('.url_name').text();
        real_num = d(evt).parents('tr').find('.real_num').text();
        d("#url").val(url_name);
        d("#real_num").val(real_num);
    }

    function set_config(arg) {
        f.setMConfig('urlft_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000);
            }
        });
    }

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});
