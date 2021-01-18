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

    var macfilter_info, filter_type, set_filter_type, optflag;
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
        f.getMConfig('macft_config', function (data) {
            if (data.errCode == 0) {
                filter_type = data.mode.enable_mac_w;
                if (filter_type) {
                    macfilter_info = data.macfilter_list_w || [];
                } else {
                    macfilter_info = data.macfilter_list || [];
                }
                type_init(filter_type);
                showtable();
            }
        });
    }

    function type_init(typenum) {
        d('.radiobox').attr('checked', false);
        if (typenum == 1) {
            d('#white_list').prop('checked', true);
        } else {
            d('#black_list').prop('checked', true);
        }
    }

    d('.radiobox').on('click', function (e) {
        var roster_title, rostertip;
        e.preventDefault();
        set_filter_type = d(this).attr('data-value');
        if (set_filter_type == filter_type) {
            e.stopPropagation();
            return;
        }

        if (set_filter_type == 1) {
            roster_title = bwroster;
            rostertip = filter_white_mac_tip;
        } else {
            roster_title = bwroster;
            rostertip = filter_black_mac_tip;
        }

        d('#roster_title').html(roster_title);
        d('#roster_tip').html(rostertip);
    });

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(macfilter_info, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num" style="display: none">' + m.real_num + '</td>';
            this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="src_mac">' + m.src_mac.toUpperCase() + '</td>';
            this_html += '<td class="remark">' + m.name + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:editConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger" et="click tap:deleteConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + ac_group_del_btn + '" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '</tr>';
        });
        d("#tbody_info").html(this_html);

        if (macfilter_info.length > 0) {
            this_table = d('#table').DataTable({
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": true},
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

    et.set_typeConfig = function () {
        var arg = {};
        arg.enable_mac_w = set_filter_type;
        filter_type = set_filter_type;
        d('.closewin').click();
        type_init(filter_type);
        f.setMConfig('filter_rbl_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
            } else {
                refresh_init();
            }
        });
    };

    et.displayline = function (evt) {
        default_num = d(evt).val();
        if (macfilter_info.length > 0) {
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
            d('.closewin').click();
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    function set_volide() {
        var a = {}, error_flag = 0;

        if (optflag == 'add' && macfilter_info.length >= 1024) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        a.src_mac = d("#mac").val().toLowerCase();
        a.name = d("#comment").val();
        if (d("#real_num").val() != "") {
            a.real_num = parseInt(d("#real_num").val());
        }

        d.each(macfilter_info, function (n, m) {
            if (a.src_mac == m.src_mac) {
                if (a.real_num == m.real_num) {
                    return true;
                }
                h.ErrorTip(tip_num++, tips_has_same_mac);
                error_flag = 1;
                return false;
            }
        });

        if (error_flag) {
            return false;
        }

        a.operate = optflag;
        return a;
    }

    et.del_select = function () {
        var a = {}, this_checked;
        this_checked = d('#tbody_info').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        a.list = '';
        this_checked.each(function (n, m) {
            a.list += d(m).parents('tr').find('.real_num').text() + ',';
        });
        a.operate = "del";
        set_config(a);
    };

    et.deleteConfig = function (evt) {
        var a = {};
        a.list = d(evt).parents('tr').find('.real_num').text() + ",";
        a.operate = "del";
        set_config(a);
    };

    et.editConfig = function (evt) {
        optflag = "edit";
        g.clearall();
        setform(evt);
    };

    function setform(evt) {
        var src_mac, remark, real_num;
        src_mac = d(evt).parents('tr').find('.src_mac').text().toLowerCase();
        remark = d(evt).parents('tr').find('.remark').text();
        real_num = d(evt).parents('tr').find('.real_num').text();
        d("#mac").val(src_mac);
        d("#comment").val(remark);
        d("#real_num").val(real_num);
    }

    function set_config(arg) {
        f.setMConfig('macft_config', arg, function (data) {
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
