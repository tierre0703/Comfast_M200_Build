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
    var all_vlan_dhcp_list;
    var action, double_support, dev_vlan_type, vlan_config;
    var this_table, lock_web = false, tip_num = 0, default_num = 10;
    var mport_array = ['LAN1', 'LAN2', 'LAN3', 'LAN4'];
    var intervlan_list;

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
                all_vlan_dhcp_list = data.vlanlist || [];
                d.each(lan_list, function (n, m) {
                    if (device.mwan == "1") {
                        all_lan_iface.push(m.name.toLowerCase());
                    }
                })
            }
        }, false);
        f.getSHConfig('intervlan.php?method=GET&action=load_data', function(data){
            if(data && data.errCode == 0 )
            intervlan_list = data.vlans || [];
        },false);

        f.getMConfig('vlan_config', function (data) {
            if (data && data.errCode == 0) {
                double_support = data.double_support;
                dev_vlan_type = data.vlan_itype;
                vlan_config = data.vlan || [];
                vlan_id_scopen(data.vlan_min, data.vlan_max);
                page_init();
            }
        }, false);

        f.getMConfig('wifilith_config', function (data) {
            if (data && data.errCode == '0') {
                localauth = data.localauth;
            }
        }, false);

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
            //add dns
            var dns = "", main_dns, second_dns;
            
            d.each(all_vlan_dhcp_list, function(dhcp_index, dhcp_info){
                if(dhcp_info.iface == m.iface)
                {
                    if(typeof dhcp_info.dhcp !== "undefined")
                    {
                        if(typeof dhcp_info.dhcp.dns != "undefined")
                            dns = dhcp_info.dhcp.dns;
                    }
                }
            });
            dns_arr = dns.split(",");
            main_dns = dns_arr[0];
            second_dns = dns_arr.length > 1 ? dns_arr[1] : "";

            this_html += '<td class="vlan_dns">' + main_dns + '</td>';
            //add secondary dns
            this_html += '<td class="vlan_dns2">' + second_dns + '</td>';

            var vlan_intervlan = "";
            d.each(intervlan_list, function(intervlan_index, intervlan_info){
                if(m.iface == intervlan_info.vlan_name)
                {
                    vlan_intervlan = intervlan_info.vlan_intervlan;
                    return false;
                }
            });

            var vlan_arr_t = vlan_intervlan.split(',');
            var vlan_arr = [];
            for(var i = 0; i < vlan_arr_t.length; i++)
            {
                if(vlan_arr_t[i] == "") continue;


                d.each(lan_list, function(lan_index, lan){
                    if(lan.iface == vlan_arr_t[i])
                    {
                        vlan_arr_t[i] = lan.name;
                        return false;
                    }
                });

                vlan_arr.push(vlan_arr_t[i]);
            }
            vlan_intervlan = vlan_arr.join(',');
            if(vlan_arr.length >= intervlan_list.length - 1)
                vlan_intervlan = "All Enabled";
            if(vlan_intervlan == "")
                vlan_intervlan = "Disabled";

            vlan_intervlan = vlan_intervlan.toUpperCase();

            //intervlan
            this_html += '<td class="vlan_intervlan">' + vlan_intervlan +  '</td>';

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
                    {"orderable": false},
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


        d('#dest_vlan_intervlan').html('');
        var text_html = "<option value='' selected>Disabled</option>";
        //var text_html = "";

        d.each(intervlan_list, function(vlan_index, vlan_info){
            /*if(vlan_info.iface.toUpperCase() == vlan_name)
            {
                continue;
            }*/
            var active = "";
            var vlan_name = vlan_info.vlan_name;
            d.each(lan_list, function(lan_index, lan){
                if(lan.iface == vlan_name)
                {
                    vlan_name = lan.name;
                    return false;
                }

            });

            //text_html += "<option value='" + vlan_info.iface + "'>" + vlan_info.iface.toUpperCase() + "</option>";
            text_html += "<option value='" + vlan_info.vlan_name + "'>" + vlan_name.toUpperCase() + "</option>";

        });
        d('#dest_vlan_intervlan').html(text_html);
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

    function get_available_intervlan(src_vlan)
    {
        var ret_arr = [];

        if(src_vlan == false)
        {
            d.each(intervlan_list, function(vlan_index, vlan_info){
                ret_arr.push(vlan_info.vlan_name);  
            });
        }
        else
        {
            d.each(intervlan_list, function(vlan_index, vlan_info){
                if(src_vlan == vlan_info.vlan_name) return;
                ret_arr.push(vlan_info.vlan_name);  
            });
        }


        return ret_arr;

        if(src_vlan == false)
        {
            d.each(vlan_config, function(vlan_index, vlan_info){
                ret_arr.push(vlan_info.iface);  
            });
        }
        else
        {
            d.each(vlan_config, function(vlan_index, vlan_info){
                var target_vlan = vlan_info.iface;
                //remove self
                if(target_vlan == src_vlan) return;

                var bfound = false;
                //target has intervlan with me, then remove
                d.each(intervlan_list, function(intervlan_index, intervlan_info){
                    if(intervlan_info.vlan_name == src_vlan) return;

                    if(intervlan_info.vlan_name == target_vlan)
                    {
                        var intervlan = intervlan_info.vlan_intervlan;
                        var arr = intervlan.split(',');
                        for(var i = 0; i < arr.length; i++)
                        {
                            if(arr[i] == src_vlan)
                            {
                                bfound = true;
                                break;
                            }
                        }
                        return false;
                    }
                });

                if(!bfound)
                {
                    ret_arr.push(target_vlan);
                }


            });
        }

        return ret_arr;
    }

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
        d('#dest_vlan_dns').val(d(evt).parents('tr').find('.vlan_dns').html());
        d('#dest_vlan_dns2').val(d(evt).parents('tr').find('.vlan_dns2').html());
        var intervlan = d(evt).parents('tr').find('.vlan_intervlan').html();

        //intervlan
        d('#dest_vlan_intervlan').html('');
        var text_html = "";
        d.each(intervlan_list, function(n, m){
            if(m.vlan_name == vlan_name.toLowerCase())
            {
                intervlan = m.vlan_intervlan;
                return false;
            }
        });


        var intervlans = intervlan.split(',');


        var available_intervlans = get_available_intervlan(vlan_name.toLowerCase());
        text_html += "<option value=''>Disabled</option>";

        d.each(available_intervlans, function(vlan_index, vlan){
            var bActive = false;
            for(var i = 0; i < intervlans.length; i++)
            {
                if(intervlans[i] == vlan)
                {
                    bActive = true;
                    break;
                }
            }
            var vlan_name = vlan;
            d.each(lan_list, function(lan_index, lan){

                if(lan.iface == vlan)
                {
                    vlan_name = lan.name;
                    return false;
                }
            });

            
            text_html += "<option value='" + vlan + "' " + (bActive ? "selected" : "")  +  ">" + vlan_name.toUpperCase() + "</option>";
        });

        d('#dest_vlan_intervlan').html(text_html);

        //d('#dest_vlan_intervlan').val(intervlan == "Disabled" ? '0' : '1');
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
        b.dns = d('#dest_vlan_dns').val();
        b.dns2 = d('#dest_vlan_dns2').val();

        //b.intervlan = d('#dest_vlan_intervlan').val();
        b.intervlan = "";

        var select1 = document.getElementById("dest_vlan_intervlan");
        for (var i = 0; i < select1.length; i++) {
            if(select1.options[i].value == "") continue;
            if (select1.options[i].selected) b.intervlan += select1.options[i].value + ",";
        }
        if(b.intervlan == ",")
            b.intervlan = "";

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

        if(b.dns == "" && b.dns2 == "")
        {
            h.ErrorTip(tip_num++, invaild_dns);
            return false;
        }

        arg.list = [];
        arg.list.push(b);
        return arg;
    }

    function set_config(arg) {
		run_waitMe('ios');
        f.setMConfig('vlan_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {

                var dhcp_arg = {};
                var iface = "";
                var real_num = arg.list[0].real_num;
                for (i = 0; i < vlan_config.length; i++) {
                    var m = vlan_config[i];
                    if(m.real_num == real_num)
                    {
                        iface = m.iface;
                        break;
                    }
                }

                if(arg.list[0].action == "add")
                {
                    f.getMConfig('vlan_config', function (data) {
                        if(data.errCode != 0)
                        {

                        }
                        else
                        {
                            d.each(data.vlan, function(new_idx, new_info){
                                var bFound = false;
                                d.each(vlan_config, function(old_dx, old_info){
                                    if(old_info.real_num == new_info.real_num)
                                    {
                                        bFound = true;
                                        return false;
                                    }
                                });
                                if(bFound == false)
                                {
                                    real_num = new_info.real_num;
                                }

                            });
                            vlan_config  = data.vlan || [];
                        }
                    }, false);
                }



                

                if(arg.list[0].action == "add" ||
                arg.list[0].action == "edit")
                {
                    
                   
    
    
                    f.getMConfig('lan_dhcp_config', function(data){
                        if (data && data.errCode == 0) {
                            all_vlan_dhcp_list = data.vlanlist || [];
    
                            for (i = 0; i < vlan_config.length; i++) {
                                var m = vlan_config[i];
                                if(m.real_num == real_num)
                                {
                                    iface = m.iface;
                                }
                            }
                    
                            if(iface == "") return;
                            for(i = 0; i < all_vlan_dhcp_list.length; i++)
                            {
                                if(iface == all_vlan_dhcp_list[i].iface)
                                {
                                    dhcp_arg.dns = arg.list[0].dns;
                                    if(arg.list[0].dns2 != "")
                                    {
                                        dhcp_arg.dns = (dhcp_arg.dns == "") ? arg.list[0].dns2 : dhcp_arg.dns + "," + arg.list[0].dns2;
                                    }
                                    dhcp_arg.domain = all_vlan_dhcp_list[i].dhcp.domain;        // : "COMFAST"
                                    dhcp_arg.enable = all_vlan_dhcp_list[i].dhcp.enable == "1" ? true : false;        //: true
                                    dhcp_arg.iface = iface;                                     //: "vlan2"
                                    dhcp_arg.leasetime = all_vlan_dhcp_list[i].dhcp.leasetime;  //: "7200"
                                    dhcp_arg.limit = all_vlan_dhcp_list[i].dhcp.limit;          //: "1000"
                                    dhcp_arg.start = all_vlan_dhcp_list[i].dhcp.start; //: "100"
                                    var lan_arg = {lan:{dhcp: dhcp_arg}};
                                    f.setMConfig('lan_dhcp_config', lan_arg, function(data){
    
                                    }, false);
                            
                                    break;
                                }
                            }
                            
                            
                        }
                    }, false );
    
    
                    var intervlan_arg = [
                        {
                            vlan_name: iface,
                            vlan_intervlan: arg.list[0].intervlan
                        
    
                        }
                    ];
    
                    f.setSHConfig('intervlan.php?method=SET&action=save_data', intervlan_arg, function(data){
                    }, false);
                   
                }
                else if(arg.list[0].action == "del")
                {
                    //delete bandwidth
                    var real_num_arr = arg.list[0].list.split(',');
                    var iface_list = "";
                    for(var k = 0; k < real_num_arr.length; k++ )
                    {
                        for (i = 0; i < vlan_config.length; i++) {
                            var m = vlan_config[i];
                            if(m.real_num == parseInt(real_num_arr[k]))
                            {
                                iface_list += m.iface + ",";
                                break;
                            }
                        }
    
                    }
                    var del_arg = {
                        operate: 'del_vlan',
                        vlans: iface_list
                    };
                    f.setSHConfig('bandwidth_config.php?method=SET&action=bm_set_data', del_arg, function(data){
							
                    }, false);
                }

                h.SetOKTip(tip_num++, set_success);
                refresh_init();
				release_loading(false); 
                setTimeout(reset_lock_web, 500);
            }

        });


    }

    function reset_lock_web() {
        lock_web = false;
    }
    
    
    //loading finished
    function release_loading(bshowTip)
    {
        $('#page-wrapper').waitMe('hide');
        if(bshowTip)
            h.SetOKTip(tip_num++, set_success);
    }

    //
    function run_waitMe(effect){
		$('#page-wrapper').waitMe({
			effect: effect,
			text: please_waiting,
			bg: 'rgba(255,255,255,0.7)',
			color:'#000'
		});
    }

    b.init = init;
});
