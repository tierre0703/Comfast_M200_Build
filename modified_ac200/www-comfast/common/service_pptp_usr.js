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

    var pptpd_user, action;
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
        f.getMConfig('pptpd_user', function (data) {
            if (data && data.errCode == 0) {
                pptpd_user = data.pptpd_user || [];
                showtable();
            }
        });
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(pptpd_user, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td><input class="row-checkbox" type="checkbox"/></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="pptp_username">' + m.username + '</td>';
            this_html += '<td class="pptp_password" >' + m.password + '</td>';
            this_html += '<td style="display:none" class="real_num" >' + m.real_num + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:edit"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="md-trigger fa fa-pencil fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '</tr>';
        });
        d('#tbody_info').html(this_html);

        if (pptpd_user.length > 0) {
            this_table = d('#table').DataTable({
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
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
        default_num = d(evt).val();
        if (pptpd_user.length > 0) {
            this_table.page.len(default_num).draw();
        }
        d(evt).blur();
    };

    et.add_list = function () {
        action = "add";
        g.clearall();
    };

    et.save = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg;
        if (lock_web) {
            return;
        }
        lock_web = true;
        if (arg = set_volide()) {
            d('#closewin').click();
            set_config(arg);
        } else {
            lock_web = false;
        }
    };

    function set_volide() {
        var a = {}, double_flag = 0;

        if (action == 'add' && pptpd_user.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        if (action == "edit") {
            a.real_num = parseInt(d("#real_num").val());
        }

        a.operate = action;
        a.username = d("#username").val();
        a.password = d("#password").val();

        d.each(pptpd_user, function (n, m) {
            if (a.real_num != m.real_num && a.username == m.username) {
                double_flag = 1;
                return false;
            }
        });

        if (double_flag) {
            h.ErrorTip(tip_num++, vpn_same_name);
            return false;
        }
        return a;
    }

    et.del_select = function () {
        action = 'del';
        var a = {}, this_checked, del_arr = [];
        a.operate = action;
        a.list = '';
        this_checked = d('#tbody_info').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            del_arr.push(d(m).parents('tr').find('.real_num').text());
        });

        a.list = del_arr.sort(function (a, b) {
                return b - a;
            }).join(',') + ',';
        set_config(a);
    };

    et.edit = function (evt) {
        g.clearall();
        action = "edit";
        showlistwin(evt);
    };

    function showlistwin(evt) {
        var username, password, real_num;
        username = d(evt).parents('tr').find('.pptp_username').text();
        password = d(evt).parents('tr').find('.pptp_password').text();
        real_num = d(evt).parents('tr').find('.real_num').text();

        d("#username").val(username);
        d("#password").val(password);
        d("#real_num").val(real_num);
    }

    function set_config(arg) {
        f.setMConfig('pptpd_user', arg, function (data) {
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
