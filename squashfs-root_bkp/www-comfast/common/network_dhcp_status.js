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

    var StaticList, DhcpList, status_array;
    var this_table, lock_web = false, tip_num = 0, default_num = 10;

    function init() {
        d('.select_line').val(default_num);
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {

        f.getMConfig('dhcp_static_list', function (data) {
            if (data && data.errCode == 0) {
                StaticList = data.dhcp || [];
            }
        }, false);

        f.getMConfig('dhcp_list', function (data) {
            if (data.errCode == 0) {
                DhcpList = data.dhcp || [];
                refresh_DList();
            }
        });
    }

    function refresh_DList() {
        var static_flag;
        status_array = [];
        d.each(DhcpList, function (n, m) {
            static_flag = 0;
            d.each(StaticList, function (x, y) {
                if (m.mac == y.mac) {
                    static_flag = 1;
                    return false;
                }
            });
            if (!static_flag) {
                status_array.push(m);
            }
        });
        showtable();
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(status_array, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden" >' + m.real_num + '</td>';
            this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="src_ip">' + m.ip + '</td>';
            this_html += '<td class="src_mac" >' + m.mac.toUpperCase() + '</td>';
            this_html += '<td class="src_name" >' + m.commentname + '</td>';
            this_html += '<td class="src_timestring" >' + m.rest_time_string + '</td>';
            this_html += '<td><a class="table-link"><span class="fa-stack" et="click tap:bindthis"><i class="fa fa-square fa-stack-2x"></i><i title="' + dhcp_list_add_static + '" class="fa fa-link fa-stack-1x fa-inverse"></i></span></a>' +
                '</td>';
            this_html += '</tr>';
        });
        d('#tbody_info').html(this_html);

        if (status_array.length > 0) {
            this_table = d('#table').DataTable({
                "bDestroy": true,
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": true},
                    null,
                    null,
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
        if (status_array.length > 0) {
            default_num = d(evt).val();
            this_table.page.len(default_num).draw();
            d(evt).blur();
        }
    };

    et.refresh_list = function () {
        d('#tbody_info').html('');
        refresh_init();
    };

    et.add_list = function () {
        var a = {}, this_checked;
        a.list = [];
        this_checked = d('#tbody_info').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            a.list[n] = {};
            a.list[n].ip = d(m).parents('tr').find('.src_ip').html();
            a.list[n].mac = d(m).parents('tr').find('.src_mac').html().toLowerCase();
            a.list[n].commentname = d(m).parents('tr').find('.src_name').html();
            a.list[n].action = 'add';
        });

        set_config(a);
    };

    et.bindthis = function (evt) {
        var a = {};
        a.list = [];
        a.list[0] = {};
        a.list[0].ip = d(evt).parents('tr').find('.src_ip').html();
        a.list[0].mac = d(evt).parents('tr').find('.src_mac').html().toLowerCase();
        a.list[0].commentname = d(evt).parents('tr').find('.src_name').html();
        a.list[0].action = "add";
        set_config(a);
    };

    function set_config(arg) {
        f.setMConfig('static_dhcp', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        });
    }

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});
