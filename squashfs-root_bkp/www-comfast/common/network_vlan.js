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

    var localauth, wan_list, lan_list, all_wan_iface, all_lan_iface, all_vlan_iface, used_vlan;
    var action, double_support, dev_vlan_type, vlan_config;
    var this_table, lock_web = false, tip_num = 0, default_num = 10;
    var mport_array = ['LAN1', 'LAN2', 'LAN3', 'LAN4'];

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
        all_wan_iface = [];
        all_lan_iface = [];
        all_vlan_iface = [];
        used_vlan = [];

        f.getMConfig('multi_pppoe', function (data) {
            if (data && data.errCode == '0') {
                wan_list = data.wanlist || [];
                d.each(wan_list, function (n, m) {
                    if (device.mwan == "1") {
                        all_wan_iface.push(m[0].name.toLowerCase());
                    }
                })
            }
        }, false);

        f.getMConfig('lan_dhcp_config', function (data) {
            if (data && data.errCode == 0) {
                lan_list = data.lanlist || [];
                d.each(lan_list, function (n, m) {
                    if (device.mwan == "1") {
                        all_lan_iface.push(m.name.toLowerCase());
                    }
                })
            }
        }, false);

        f.getMConfig('vlan_config', function (data) {
            if (data && data.errCode == 0) {
                double_support = data.double_support;
                dev_vlan_type = data.vlan_itype;
                vlan_config = data.vlan || [];
                vlan_id_scopen(data.vlan_min, data.vlan_max);
                page_init();
            }
        });

        f.getMConfig('wifilith_config', function (data) {
            if (data && data.errCode == '0') {
                localauth = data.localauth;
            }
        });

    }

    function vlan_id_scopen(vlan_min, vlan_max) {
        var scopen_tip, scopen_value;
        scopen_tip = '(' + vlan_min + '-' + vlan_max + ')';
        scopen_value = '_@' + vlan_min + '_' + vlan_max;
        d('#dest_vlan_id').attr('name', scopen_value);
        d('#vlan_id_scopen').html(scopen_tip)
    }

    function page_init() {
        showtable();
        if (dev_vlan_type == 'port') {
            vlan_type_port_init();
        } else if (dev_vlan_type == "line") {
            vlan_type_line_init();
        }
    }

    function vlan_type_port_init() {
        d("#vlan_line_th").remove();
        d("#vlan_port_div").removeClass('hide');
        d("#vlan_line_div").addClass('hide');
//        if (double_support != '0') {
//            d("#select_vlan_type_div").removeClass('hide');
//        }
        porttype_moreline('all');
    }

    function vlan_type_line_init() {
        d("#vlan_port_th").remove();
        d("#vlan_port_div").addClass('hide');
        d("#vlan_line_div").removeClass('hide');
        d("#select_vlan_type_div").addClass('hide');
        linetype_moreline();
    }

    function showtable() {

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        var this_html = '';
        d('#select_laber').text(selectall_tab);
        d('#allchecked').prop('checked', false).attr('data-value', '0');

        d.each(vlan_config, function (n, m) {
            if (m.port.indexOf("vlan") < 0) {
                all_vlan_iface.push(m.iface);
            }
            used_vlan.push(m.port);
            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden" >' + m.real_num + '</td>';
            this_html += '<td><input class="row_checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="vlan_name">' + m.iface.toUpperCase() + '</td>';
            this_html += '<td class="vlan_id">' + m.id + '</td>';
            if(m.ipaddr == ""){
                this_html += '<td>*</td>';
            }else {
                this_html += '<td class="vlan_ipaddr" >' + m.ipaddr + '</td>';
            }

            if(m.netmask == ""){
                this_html += '<td class="vlan_netmask">*</td>';
            }else {
                this_html += '<td class="vlan_netmask" >' + m.netmask + '</td>';
            }

            this_html += '<td class="vlan_port" >' + (m.port.toUpperCase() || undistributed) + '</td>';
            this_html += '<td class="vlan_desc" >' + m.desc + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:editConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '"  class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '</tr>';
        });
        d('#tbody_info').html(this_html);

        if (vlan_config.length != 0) {
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
                ]
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

    function builddefaultport() {
        var this_html = '';
        d.each(mport_array, function (n, m) {
            if (double_support == 0 && used_vlan.join(' ').indexOf(m) > -1) {
                this_html += '<div class="col-lg-4 col-sm-4 col-xs-6"><input type="checkbox" disabled name="mport" data-value="' + m + '" id="mport_' + (n + 1) + '"><label for="mport_' + (n + 1) + '">' + m + '</label></div>';
            } else {
                this_html += '<div class="col-lg-4 col-sm-4 col-xs-6"><input type="checkbox" name="mport" data-value="' + m + '" id="mport_' + (n + 1) + '"><label for="mport_' + (n + 1) + '">' + m + '</label></div>';

            }
        });
        d('#moreport').html(this_html);
    }

    function buildeditport(portname) {
        var this_html = '';
        d.each(mport_array, function (n, m) {
            if (used_vlan.join(' ').indexOf(m) > -1 && portname.indexOf(m) < 0) {
                this_html += '<div class="col-lg-4 col-sm-4 col-xs-6"><input type="checkbox" disabled name="mport" data-value="' + m + '" id="mport_' + (n + 1) + '"><label for="mport_' + (n + 1) + '">' + m + '</label></div>';
            } else if (portname.indexOf(m) > -1) {
                this_html += '<div class="col-lg-4 col-sm-4 col-xs-6"><input type="checkbox" checked="checked" name="mport" data-value="' + m + '" id="mport_' + (n + 1) + '"><label for="mport_' + (n + 1) + '">' + m + '</label></div>';
            } else {
                this_html += '<div class="col-lg-4 col-sm-4 col-xs-6"><input type="checkbox" name="mport" data-value="' + m + '" id="mport_' + (n + 1) + '"><label for="mport_' + (n + 1) + '">' + m + '</label></div>';
            }
        });
        d('#moreport').html(this_html);
    }

    function port_lineoption(isdouble) {
        var this_html;
        if (!isdouble) {
            this_html = '<option value="1" sh_lang="vlan_type_odd">' + vlan_type_odd + '</option>';
        } else {
            this_html = '<option value="1" sh_lang="vlan_type_odd">' + vlan_type_odd + '</option><option  value="2" sh_lang="vlan_type_even">' + vlan_type_even + '</option>'
        }
        d('#select_vlan_type').html(this_html)
    }

    function porttype_moreline(type, vlan_name) {
        var has_dbvlan;
        if (type == 'all') {
            has_dbvlan = '';
        } else {
            has_dbvlan = 0;
        }
        vlan_name = vlan_name || '';
        var line_html = '', surplus;

        surplus = d.grep(all_vlan_iface, function (value) {
            return value != vlan_name;
        });

        if (type != '0') {
            has_dbvlan = 1;
            d.each(surplus, function (n, m) {
                if (vlan_name != m) {
                    line_html += '<option value="' + m + '">' + m.toUpperCase() + '</option>';
                }
            })
        } else {
            has_dbvlan = 0;
        }
        port_lineoption(has_dbvlan);
        d('#moreline').html(line_html);
    }

    function linetype_moreline(vlan_name) {
        var line_html = '', surplus;
        vlan_name = vlan_name || '';

        d.each(all_lan_iface, function (n, m) {
            line_html += '<option value="' + m + '">' + m.toUpperCase() + '</option>';
        });

        //d.each(all_wan_iface, function (n, m) {
        //    line_html += '<option value="' + m + '">' + m.toUpperCase() + '</option>';
        //});

        surplus = d.grep(all_vlan_iface, function (value) {
            return value != vlan_name;
        });

        d.each(surplus, function (n, m) {
            if (vlan_name != m) {
                line_html += '<option value="' + m + '">' + m.toUpperCase() + '</option>';
            }
        });

        d('#moreline').html(line_html);
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

    et.wan_disabled = function (evt) {
        wan_disabled(evt.val());
    };

    function wan_disabled(data) {
        if (data.indexOf('wan') > -1) {
            d("#dest_vlan_ipaddr").attr("disabled", true);
            d("#dest_vlan_netmask").attr("disabled", true);
        } else {
            d("#dest_vlan_ipaddr").attr("disabled", false);
            d("#dest_vlan_netmask").attr("disabled", false);
        }
    }

    et.radiobox = function (evt) {
        g.radiobox(evt);
    };

    et.displayline = function (evt) {
        default_num = d(evt).val();
        if (vlan_config.length != 0) {
            this_table.page.len(default_num).draw();
        }
        d(evt).blur();
    };

    et.add_list = function () {
        g.clearall();
        action = "add";
        d('#dest_vlan_netmask').val('255.255.255.0');
        if (dev_vlan_type == 'line') {
            linetype_moreline();
        } else {
            builddefaultport();
            addConfig_port()
        }
    };

    function addConfig_port() {
        d('#vlan_port_div').removeClass('hide');
        d('#vlan_line_div').addClass('hide');
        porttype_moreline('all');
    }

    et.editConfig = function (evt) {
        action = 'edit';
        g.clearall();
        if (dev_vlan_type == 'line') {
            editConfig_line(evt);
        } else {
            builddefaultport();
            editConfig_port(evt)
        }
    };

    function editConfig_line(evt) {
        d('#vlan_port_div').addClass('hide');
        d('#vlan_line_div').removeClass('hide');
        var vlan_port = d(evt).parents('tr').find('.vlan_port').html();
        var vlan_name = d(evt).parents('tr').find('.vlan_name').html();
        d('#real_num').val(d(evt).parents('tr').find('.real_num').html());
        d('#dest_vlan_id').val(d(evt).parents('tr').find('.vlan_id').html());
        d('#dest_vlan_name').val(vlan_name);
        d('#dest_vlan_ipaddr').val(d(evt).parents('tr').find('.vlan_ipaddr').html());
        if(d(evt).parents('tr').find('.vlan_netmask').html() == "*") {
            d('#dest_vlan_netmask').val("255.255.255.0");
        }else {
            d('#dest_vlan_netmask').val(d(evt).parents('tr').find('.vlan_netmask').html());
        }
        d('#dest_vlan_desc').val(d(evt).parents('tr').find('.vlan_desc').html());
        linetype_moreline(vlan_name.toLowerCase());
        wan_disabled(vlan_port.toLowerCase());
        d('#moreline').val(vlan_port.toLowerCase())
    }

    function editConfig_port(evt) {
        var isdbtype, select_vlan_type_value = '1';
        var vlan_port = d(evt).parents('tr').find('.vlan_port').html();
        var vlan_name = d(evt).parents('tr').find('.vlan_name').html();

        d('#real_num').val(d(evt).parents('tr').find('.real_num').html());
        d('#dest_vlan_id').val(d(evt).parents('tr').find('.vlan_id').html());
        d('#dest_vlan_name').val(vlan_name);
        d('#dest_vlan_ipaddr').val(d(evt).parents('tr').find('.vlan_ipaddr').html());
        d('#dest_vlan_netmask').val(d(evt).parents('tr').find('.vlan_netmask').html());
        d('#dest_vlan_desc').val(d(evt).parents('tr').find('.vlan_desc').html());
        isdbtype = dbtype(vlan_name.toLowerCase());
        porttype_moreline(isdbtype, vlan_name.toLowerCase());
        d.each(vlan_port.split(' '), function (n, m) {
            if (select_vlan_type_value == '1' && mport_array.join(';').indexOf(m) < 0) {
                d('#vlan_port_div').addClass('hide');
                d('#vlan_line_div').removeClass('hide');
                select_vlan_type_value = '2';
                return false;
            } else {
                d('#vlan_port_div').removeClass('hide');
                d('#vlan_line_div').addClass('hide');
            }
            d('#mport_' + g.getifacenum(m)).prop('checked', true);
        });
        d('#select_vlan_type').val(select_vlan_type_value);
        if (double_support == '0') {
            buildeditport(vlan_port)
        }
    }

    function dbtype(vlan_name) {
        var has_doublebvlan;
        for (var i = 0; i < used_vlan.length; i++) {
            if (used_vlan[i] == vlan_name) {
                has_doublebvlan = 0;
            } else {
                has_doublebvlan = 1;
            }
        }
        return has_doublebvlan;
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
        var arg = {}, b = {}, i;
        var vlan_port_type = d('#select_vlan_type').val();
        b.action = action;
        if (action == 'edit') {
            b.real_num = parseInt(d("#real_num").val());
        }
        b.id = d("#dest_vlan_id").val();
        b.name = d("#dest_vlan_name").val();
        b.ipaddr = d("#dest_vlan_ipaddr").val();
        b.netmask = d("#dest_vlan_netmask").val();
        b.desc = d("#dest_vlan_desc").val();
        if (dev_vlan_type == 'port') {
            if (double_support == 1 && vlan_port_type == '1' || double_support == 0) {
                var mport = [];
                d('[name=mport]:checked').each(function (n, m) {
                    mport[n] = d(m).attr('data-value');
                });
                b.port = mport.join(' ');
            } else if (vlan_port_type == '2') {
                b.port = d('#moreline').val();
            }
        } else if (dev_vlan_type == 'line') {
            b.port = d('#moreline').val();
        }
        if (!b.port) {
            h.ErrorTip(tip_num++, vlan_port_error);
            return false;
        }

        if (b.port.indexOf("wan")  > -1){
            b.ipaddr = "";
            b.netmask = "";
        }

        if (localauth.guest_ipaddr != '' && localauth.guest_netmask != '' && h.isEqualIP(b.ipaddr, b.netmask, localauth.guest_ipaddr, localauth.guest_netmask)) {
            h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + auth_segment + local_subnet_conflict_tip2);
            return false;
        }

        for (i = 0; i < lan_list.length; i++) {
            var m = lan_list[i];
            if (h.isEqualIP(b.ipaddr, b.netmask, m.ipaddr, m.netmask)) {
                h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + m.name.toUpperCase() + local_subnet_conflict_tip2);
                return false;
            }
        }

        for (i = 0; i < wan_list.length; i++) {
            for (var l = 0; l < wan_list[i].length; l++) {
                var m = wan_list[i][l];
                if (h.isEqualIP(b.ipaddr, b.netmask, m.wan_ipaddr, m.wan_netmask)) {
                    h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + m.name.toUpperCase() + local_subnet_conflict_tip2);
                    return false;
                }
            }
        }

        for (i = 0; i < vlan_config.length; i++) {
            var m = vlan_config[i];

            if (b.real_num == m.real_num) {
                continue;
            }

            if (b.id == m.id) {
                h.ErrorTip(tip_num++, vlan_id + '"' + b.id + '"' + groupname_exist);
                return false;
            }

            if (h.isEqualIP(b.ipaddr, b.netmask, m.ipaddr, m.netmask)) {
                h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + m.iface + local_subnet_conflict_tip2);
                return false;
            }
        }

        arg.list = [];
        arg.list.push(b);
        return arg
    }

    function set_config(arg) {
        f.setMConfig('vlan_config', arg, function (data) {
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
