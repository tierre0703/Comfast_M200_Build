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

    var action, more_iface, vlan_iface, static_route,this_ifname = {};
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

        f.getMConfig('lan_dhcp_config', function (data) {
            if (data && data.errCode == 0) {
                vlan_iface = data.vlanlist || [];
            }
        }, false);

        f.getMConfig('mwan_capability_config', function (data) {
            if (data && data.errCode == 0) {
                var wanlist = data.wanlist || [];
                var lanlist = data.lanlist || [];
                more_iface = wanlist.concat(lanlist);
                ifaceoption();
            }
        });

        f.getMConfig('static_route', function (data) {
            if (data.errCode == 0) {
                static_route = data.static_route || [];
                showtable();
            }
        });
    }

    function ifaceoption() {
        var this_html = '';
        d.each(more_iface, function (n, m) {
            this_ifname[m.iface] =  m.name.toUpperCase();
            this_html += '<option value="' + m.iface + '" >' + m.name.toUpperCase() + '</option>';
        });

        d.each(vlan_iface, function (n, m) {
            this_html += '<option value="' + m.iface + '" >' + m.iface.toUpperCase() + '</option>';
        });

        d('#iface').html(this_html);
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(static_route, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden" >' + m.real_num + '</td>';
            this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="dest_ip">' + m.target + '</td>';
            this_html += '<td class="dest_netmask" >' + m.netmask + '</td>';
            this_html += '<td class="dest_gateway" >' + m.gateway + '</td>';
            if (!device.mwan || m.interface.indexOf("vlan") > -1) {
                this_html += '<td class="iface" data-iface="' + m.interface + '">' + m.interface.toUpperCase() + '</td>';
            } else {
                this_html += '<td class="iface" data-iface="' + m.interface + '">' + this_ifname[m.interface] + '</td>';
            }
            this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:editConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a>' +
                '</td>';
            this_html += '</tr>';
        });
        d('#tbody_info').html(this_html);

        if (static_route.length != 0) {
            this_table = d('#table').DataTable({
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    null,
                    null,
                    null,
                    null,
                    null,
                    {"orderable": false}
                ],
                "drawCallback": function (settings) {
                    //清空全选状态
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
        this_table.page.len(default_num).draw();
        d(evt).blur();
    };

    et.add_list = function () {
        g.clearall();
        d('#dest_netmask').val('255.255.255.0');
        action = "add";
    };

    et.editConfig = function (evt) {
        g.clearall();
        action = 'edit';
        d('#real_num').val(d(evt).parents('tr').find('.real_num').html());
        d('#dest_ip').val(d(evt).parents('tr').find('.dest_ip').html());
        d('#dest_netmask').val(d(evt).parents('tr').find('.dest_netmask').html());
        d('#dest_gateway').val(d(evt).parents('tr').find('.dest_gateway').html());
        d('#iface').val(d(evt).parents('tr').find('.iface').attr("data-iface").toLowerCase())
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

    et.del_select = function () {
        action = 'del';
        var a = {}, this_checked;
        a.list = [];
        a.list[0] = {};
        a.list[0].list = '';
        this_checked = d('#tbody_info').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            a.list[0].list += d(m).parents('tr').find('.real_num').text() + ',';
        });
        a.list[0].action = action;
        set_config(a);
    };

    function set_volide() {
        var arg = {}, error_falg = 0;

        if (action == 'add' && static_route.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }
        arg.list = [];
        arg.list[0] = {};
        arg.list[0].action = action;

        if (action == 'edit') {
            arg.list[0].real_num = parseInt(d("#real_num").val());
        }

        arg.list[0].target = d("#dest_ip").val();
        arg.list[0].interface = d("#iface").val();
        arg.list[0].netmask = d("#dest_netmask").val();
        arg.list[0].gateway = d("#dest_gateway").val();
        if (arg.list[0].target.split('.')[3] != '0' && arg.list[0].netmask != '255.255.255.255') {
            h.ErrorTip(tip_num++, static_route_netmask_error);
            return false;
        }

        d.each(static_route, function (n, m) {
            if (arg.list[0].real_num == m.real_num) return true;
            if (arg.list[0].target == m.target) {
                h.ErrorTip(tip_num++, static_route_ip_tip);
                error_falg = 1;
                return false;
            }
        });

        if (error_falg) {
            return false;
        }
        return arg
    }

    function set_config(arg) {
        f.setMConfig('static_route', arg, function (data) {
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
