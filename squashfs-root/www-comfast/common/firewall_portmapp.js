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

    var portward_info, lanlist_info, vlanlist_info, optflag;
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
        f.getMConfig('portfw_config', function (data) {
            if (data.errCode == 0) {
                portward_info = data.portfw_list || [];
                showtable();
            }
        });

        f.getMConfig('lan_dhcp_config', function (data) {
            if (data.errCode == 0) {
                lanlist_info = data.lanlist || [];
                vlanlist_info = data.vlanlist || [];
            }
        });
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(portward_info, function (n, m) {

            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden">' + m.real_num + '</td>';
            this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="portmapp_name">' + m.name + '</td>';
            if (m.proto.toUpperCase() == 'TCP UDP') {
                this_html += '<td class="proto">BOTH</td>';
            } else {
                this_html += '<td class="proto">' + m.proto.toUpperCase() + '</td>';
            }
            this_html += '<td class="outer_port">' + m.src_dport + '</td>';
            this_html += '<td class="inner_ip">' + m.dest_ip + '</td>';
            this_html += '<td class="inner_port">' + m.dest_port + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:editConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger"><span class="fa-stack" et="click tap:deleteConfig"><i class="fa fa-square fa-stack-2x"></i><i title="' + ac_group_del_btn + '" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a>' +
                '</td>';
            this_html += '</tr>';
        });
        d("#tbody_info").html(this_html);

        if (portward_info.length > 0) {
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
    };

    function set_volide() {
        var a = {}, b = [], iface_include = '';

        if (optflag == 'add' && portward_info.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        b[0] = {};
        b[0].name = d('#portmapp_name').val();

        b[0].proto = d('#portmapp_proto').val();
        if (b[0].proto == 'both') {
            b[0].proto = 'tcp udp'
        }

        b[0].src_dport = d('#outer_port').val();
        b[0].dest_ip = d('#inner_ip').val();
        b[0].dest_port = d('#inner_port').val();

        if (b[0].src_dport.indexOf('-') > -1) {
            b[0].src_dport = port_format(b[0].src_dport.split('-')[0], b[0].src_dport.split('-')[1]);
        }

        if (b[0].dest_port.indexOf('-') > -1) {
            b[0].dest_port = port_format(b[0].dest_port.split('-')[0], b[0].dest_port.split('-')[1]);
        }

        if (b[0].src_dport == "" && b[0].dest_port == "") {
            h.ErrorTip(tip_num++, outer_or_innet);
            return false;
        }

        if (b[0].src_dport == "") {
            b[0].src_dport = b[0].dest_port;
        }

        if (b[0].dest_port == "") {
            b[0].dest_port = b[0].src_dport;
        }

        if (optflag != 'add') {
            b[0].real_num = parseInt(d('#real_num').val());
        }

        d.each(lanlist_info, function (n, m) {
            if (h.isIncludeIP(b[0].dest_ip, m.ipaddr, m.netmask)) {
                iface_include = m.iface;
                return false;
            }
        });

        if (!iface_include) {
            d.each(vlanlist_info, function (n, m) {
                if (h.isIncludeIP(b[0].dest_ip, m.ipaddr, m.netmask)) {
                    iface_include = m.iface;
                    return false;
                }
            });
        }

        if (iface_include != '') {
            b[0].iface = iface_include;
        }

        for (var i = 0; i < portward_info.length; i++) {
            var m = portward_info[i];
            if (b[0].dest_ip == m.dest_ip && b[0].src_dport == m.src_dport && b[0].proto == m.proto && b[0].dest_port == m.dest_port) {
                if (b[0].real_num == m.real_num) {
                    continue;
                }
                h.ErrorTip(tip_num++, portfw_same);
                return false;
            }
        }

        b[0].action = optflag;
        a.portfw_list = b;
        return a;
    }

    function port_format(start_port, end_port) {
        if ((start_port != undefined) && (end_port != undefined)) {
            if (parseInt(start_port) > parseInt(end_port)) {
                temp = start_port;
                start_port = end_port;
                end_port = temp;
                return start_port + '-' + end_port;
            } else if (start_port == end_port)
                return start_port;
            else
                return start_port + '-' + end_port;
        } else {
            return start_port || end_port;
        }
    }

    et.del_select = function () {
        var a = {}, b = [], this_checked;
        this_checked = d('#tbody_info').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        b[0] = {};
        b[0].list = '';
        this_checked.each(function (n, m) {
            b[0].list += d(m).parents('tr').find('.real_num').text() + ',';
        });
        b[0].action = 'del';
        a.portfw_list = b;
        set_config(a);
    };

    et.deleteConfig = function (evt) {
        var a = {}, b = [];

        b[0] = {};
        b[0].list = d(evt).parents('tr').find('.real_num').text() + ",";
        b[0].action = "del";
        a.portfw_list = b;

        set_config(a);
    };

    et.editConfig = function (evt) {
        optflag = "edit";
        g.clearall();
        setform(evt);
    };

    function setform(evt) {
        var portmapp_name, proto, outer_port, inner_ip, inner_port, real_num;

        portmapp_name = d(evt).parents('tr').find('.portmapp_name').text();
        proto = d(evt).parents('tr').find('.proto').text().toLowerCase();
        //outer_port = d(evt).parents('tr').find('.outer_port').text() || '1-65535';
        outer_port = d(evt).parents('tr').find('.outer_port').text();
        inner_ip = d(evt).parents('tr').find('.inner_ip').text();
        //inner_port = d(evt).parents('tr').find('.inner_port').text() || '1-65535';
        inner_port = d(evt).parents('tr').find('.inner_port').text();
        real_num = d(evt).parents('tr').find('.real_num').text();

        d("#portmapp_name").val(portmapp_name);
        d("#portmapp_proto").val(proto);
        d("#outer_port").val(outer_port);
        d("#inner_ip").val(inner_ip);
        d("#inner_port").val(inner_port);
        d("#real_num").val(real_num);
    }

    function set_config(arg) {
        f.setMConfig('portfw_config', arg, function (data) {
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
