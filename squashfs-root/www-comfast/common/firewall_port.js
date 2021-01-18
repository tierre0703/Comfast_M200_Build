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

    var port_info, optflag;
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
        f.getMConfig('portft_config', function (data) {
            if (data.errCode == 0) {
                port_info = data.portfilter_list || [];
                showtable();
            }
        });
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(port_info, function (n, m) {
            var src_port_start, src_port_end, dest_port_start, dest_port_end;

            if (m.src_port == '') {
                src_port_start = src_port_end = '';
            } else if (m.src_port.indexOf('-') < 0) {
                src_port_start = m.src_port;
                src_port_end = '';
            } else if (m.src_port.indexOf('-') > 0) {
                var port_array = m.src_port.split("-");
                src_port_start = port_array[0];
                src_port_end = port_array[1];
            }

            if (m.dest_port == '') {
                dest_port_start = dest_port_end = '';
            } else if (m.dest_port.indexOf('-') < 0) {
                dest_port_start = m.dest_port;
                dest_port_end = '';
            } else if (m.dest_port.indexOf('-') > 0) {
                var port_array = m.dest_port.split("-");
                dest_port_start = port_array[0];
                dest_port_end = port_array[1];
            }

            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden">' + m.real_num + '</td>';
            this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            if (m.proto.toUpperCase() == 'TCP UDP') {
                this_html += '<td class="proto">BOTH</td>';
            } else {
                this_html += '<td class="proto">' + m.proto.toUpperCase() + '</td>';
            }

            this_html += '<td class="src_startport">' + src_port_start + '</td>';
            this_html += '<td class="src_endport">' + src_port_end + '</td>';
            this_html += '<td class="dest_startport">' + dest_port_start + '</td>';
            this_html += '<td class="dest_endport">' + dest_port_end + '</td>';
            this_html += '<td class="remark">' + m.name + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:editConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger"><span class="fa-stack" et="click tap:deleteConfig"><i class="fa fa-square fa-stack-2x"></i><i title="' + ac_group_del_btn + '" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a>' +
                '</td>';
            this_html += '</tr>';
        });
        d("#tbody_info").html(this_html);

        if (port_info.length > 0) {
            this_table = d('#table').DataTable({
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    null,
                    null,
                    null,
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
        var listnum = d(evt).val();
        this_table.page.len(listnum).draw();
        d(evt).blur();
    };

    et.add_list = function () {
        optflag = "add";
        g.clearall();
    };

    et.protoselet = function () {
        var selval = d("#proto_select").val();
        if (selval == "all") {
            d("#startport").attr('disabled', "true").removeClass('borError').val('1');
            d("#endport").attr('disabled', "true").removeClass('borError').val('65535');
        } else {
            d("#startport").removeAttr("disabled").val('');
            d("#endport").removeAttr("disabled").val('');
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
    }

    function set_volide() {
        var a = {}, s_start_port, s_end_port, d_start_port, d_end_port, temp;

        if (optflag == 'add' && port_info.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        s_start_port = d("#source_start_port").val();
        s_end_port = d("#source_send_port").val();
        if ((s_start_port != "") && (s_end_port != "")) {
            if (parseInt(s_start_port) > parseInt(s_end_port)) {
                temp = s_start_port;
                s_start_port = s_end_port;
                s_end_port = temp;
                a.src_port = s_start_port + '-' + s_end_port;
            } else if (s_start_port == s_end_port) {
                a.src_port = s_start_port;
            }
            else {
                a.src_port = s_start_port + '-' + s_end_port;
            }
        } else {
            a.src_port = s_start_port || s_end_port;
        }

        d_start_port = d("#destination_start_port").val();
        d_end_port = d("#destination_end_port").val();
        if ((d_start_port != "") && (d_end_port != "")) {
            if (parseInt(d_start_port) > parseInt(d_end_port)) {
                temp = d_start_port;
                d_start_port = d_end_port;
                d_end_port = temp;
                a.dest_port = d_start_port + '-' + d_end_port;
            } else if (d_start_port == d_end_port) {
                a.dest_port = d_start_port;
            }
            else {
                a.dest_port = d_start_port + '-' + d_end_port;
            }
        } else {
            a.dest_port = d_start_port || d_end_port;
        }

        if (a.src_port == '' && a.dest_port == '') {
            h.ErrorTip(tip_num++, port_setting_tips);
            return false;
        }

        a.name = d('#comment').val();

        a.proto = d('#proto_select').val();
        if (a.proto == 'both') {
            a.proto = 'tcp udp'
        }

        if (optflag != 'add') {
            a.real_num = parseInt(d('#real_num').val());
        }

        for (var i = 0; i < port_info.length; i++) {
            var m = port_info[i];
            if (a.real_num == m.real_num) {
                continue;
            }
            if (a.proto == m.proto && a.dest_port == m.dest_port && a.src_port == m.src_port) {
                h.ErrorTip(tip_num++, portfw_same);
                return false;
            }
        }

        a.operate = optflag;
        //a.portfw_list = b;
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
        a.operate = 'del';
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
        var dest_ip, proto, start_port_src, end_port_src, start_port_dest, end_port_dest, real_num, remark;

        dest_ip = d(evt).parents('tr').find('.dest_ip').text();
        proto = d(evt).parents('tr').find('.proto').text().toLowerCase();
        if (proto == 'all') {
            d("#startport").attr('disabled', true);
            d("#endport").attr('disabled', true);
        }
        start_port_src = d(evt).parents('tr').find('.src_startport').text();
        end_port_src = d(evt).parents('tr').find('.src_endport').text();
        start_port_dest = d(evt).parents('tr').find('.dest_startport').text();
        end_port_dest = d(evt).parents('tr').find('.dest_endport').text();
        remark = d(evt).parents('tr').find('.remark').text();
        real_num = d(evt).parents('tr').find('.real_num').text();


        d("#proto_select").val(proto);
        d("#source_start_port").val(start_port_src);
        d("#source_send_port").val(end_port_src);
        d("#destination_start_port").val(start_port_dest);
        d("#destination_end_port").val(end_port_dest);
        d("#comment").val(remark);
        d("#real_num").val(real_num);
    }

    function set_config(arg) {
        f.setMConfig('portft_config', arg, function (data) {
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
