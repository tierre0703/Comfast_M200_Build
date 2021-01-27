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

    var action, iplimit, qos_info;
    var this_table, lock_web = false, tip_num = 0, default_num = 10;
    var bm_conf = {bm_enabled: 0};
    var lan_list, vlan_config;
    var bm_enabled = false;

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
        d('#allchecked').prop('checked', false).attr('data-value', '0');
        var tmp_iparr = device.ip.split('.');
        var tmp_startip = tmp_iparr[0] + '.' + tmp_iparr[1] + '.' + tmp_iparr[2] + '.10';
        var tmp_endip = tmp_iparr[0] + '.' + tmp_iparr[1] + '.' + tmp_iparr[2] + '.100';
        d('#defaut_ip_tip').html('(' + tmp_startip + '-' + tmp_endip + ')');
        
        f.getSHConfig('bandwidth_config.php?method=GET&action=lan_list', function(data){
            lan_list = data || [];
        },false);
        
        f.getMConfig('vlan_config', function (data) {
            if (data && data.errCode == 0) {
                vlan_config = data.vlan || [];
            }
         }, false);
        
        f.getSHConfig('bandwidth_config.php?method=GET&action=bm_config', function(data){
            if(data){
                bm_conf = data;
                if(bm_conf.bm_enabled == 1)
                {
                    d('#btn_add_list').addClass('disabled');
                    d('#btn_del_select').addClass('disabled');
                    d('#header_tr_edit').addClass('hide');
                    bm_enabled = true;
                }
                else
                {
                    d('#btn_add_list').removeClass('disabled');
                    d('#btn_del_select').removeClass('disabled');
                    d('#header_tr_edit').removeClass('hide');
                    bm_enabled =  false;
                }
            }
        }, false);

        f.getMConfig('qos_ip_limit', function (data) {
            if (data && data.errCode == 0) {
                iplimit = data.list || [];
                qos_info = data.qos;
                refresh_table();
            }
        });

    }

    function refresh_table() {
        g.swich('#switch_iplimit', qos_info.enable_limit);
        showtable()
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(iplimit, function (n, m) {
            var mode_str, enable_str;
            if (m.share == 1) {
                mode_str = share_mode;
            } else {
                mode_str = vip_mode;
            }

            if (m.enable == 1) {
                enable_str = status_enabled;
            } else {
                enable_str = status_disabled;
            }
            
            var devip = (m.ip.indexOf("-") == -1 ) ? m.ip : m.ip.split("-")[0];
            
            
            var dec_ip = IpSubnetCalculator.toDecimal(devip);
            var vlan_name = "Default VLAN";
            var vlan_iface = "";

            d.each(vlan_config, function(vlan_index, vlan_info){
                var calc_data = IpSubnetCalculator.calculateCIDRPrefix(vlan_info.ipaddr, vlan_info.netmask);
                if(dec_ip >= calc_data.ipLow && dec_ip <= calc_data.ipHigh)
                {
                    //this ip is in this vlan_config
                    vlan_name = vlan_info.desc == "" ? vlan_info.iface.toUpperCase() : vlan_info.desc.toUpperCase();
                    vlan_iface = vlan_info.iface;
                    return false;
                }
            });

            
            d.each(lan_list, function(lan_index, lan_info){
                if(lan_info.ipaddr == "" || lan_info.netmask == "") return;
                var calc_data = IpSubnetCalculator.calculateCIDRPrefix(lan_info.ipaddr, lan_info.netmask);
                if(dec_ip >= calc_data.ipLow && dec_ip <= calc_data.ipHigh)
                {
                    //this ip is in this vlan_config
                    vlan_name = lan_info.hostname == "" ? lan_info.ifname.toUpperCase() : lan_info.hostname.toUpperCase();
                    vlan_iface = lan_info.ifname.toUpperCase();
                    return false;
                }
            });

            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden" >' + m.real_num + '</td>';
            this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="limit_ip">' + m.ip + '</td>';
            this_html += '<td class="limit_vlan">' + vlan_name + '</td>';
            this_html += '<td class="limit_uprate" data-value="'  + m.uprate / 1000 +  '" >' + m.uprate / 1000 + 'Mb/s</td>';
            this_html += '<td class="limit_downrate" data-value="'  + m.downrate / 1000 +  '">' + m.downrate / 1000 + 'Mb/s</td>';
            this_html += '<td >' + mode_str + '</td>';
            this_html += '<td class="limit_comment">' + m.comment + '</td>';
            this_html += '<td >' + enable_str + '</td>';
            this_html += '<td class="limit_share hide">' + m.share + '</td>';
            this_html += '<td class="limit_enable hide">' + m.enable + '</td>';
            
            
            if(bm_conf.bm_enabled == 1)
            {
                //this_html += '<td></td>';
                this_html += '<td  class="hide"><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:editConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a>';
                this_html += '<a class="table-link danger"><span class="fa-stack" et="click tap:delete_row"><i class="fa fa-square fa-stack-2x"></i><i title="' + global_delete + '" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a></td>';

            }
            else 
            {
                this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:editConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a>';
                this_html += '<a class="table-link danger"><span class="fa-stack" et="click tap:delete_row"><i class="fa fa-square fa-stack-2x"></i><i title="' + global_delete + '" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a></td>';
            }
            this_html += '</tr>';
        });
        d('#tbody_info').html(this_html);

        if (iplimit.length > 0) {
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
                    null,
                    {"orderable": false},
                    {"orderable": false},
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

    et.changestatus = function () {
        var a = {};
        if (qos_info.enable_limit == 1) {
            a.enable_limit = "0";
        } else {
           /* if(bm_conf.bm_enabled == 1)
            {
                h.ErrorTip(tip_num++, bm_already_enabled);
                return;
            }
            */

            a.enable_limit = "1";
        }
        set_switch(a);
    };

    et.radiobox = function (evt) {
        g.radiobox(evt);
    };

    et.displayline = function (evt) {
        default_num = d(evt).val();
        if (iplimit.length > 0) {
            this_table.page.len(default_num).draw();
        }
        d(evt).blur();
    };

    et.add_list = function () {
        //if(bm_conf.bm_enabled == 1)
        //    return;
        action = "add";
        g.clearall();
    };

    et.editConfig = function (evt) {
        g.clearall();
        action = 'edit';
        d('#real_num').val(d(evt).parents('tr').find('.real_num').html());
        d('#limit_ip').val(d(evt).parents('tr').find('.limit_ip').html());

        d('#limit_uprate').val(d(evt).parents('tr').find('.limit_uprate').attr('data-value'));
        d('#limit_downrate').val(d(evt).parents('tr').find('.limit_downrate').attr('data-value'));
 
        
        d('#limit_comment').val(d(evt).parents('tr').find('.limit_comment').html());
        d('#limit_share').val(d(evt).parents('tr').find('.limit_share').html());
        d('#limit_enable').val(d(evt).parents('tr').find('.limit_enable').html());
    };

    et.saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_volide()) {
            lock_web = false;
            d('.closewin').click();
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    et.delete_row = function (evt) {
        var a = {}, real_num, action = 'del';
        real_num = evt.parents('tr').find('.real_num').html();
        if (lock_web) {
            return;
        }
        a.list = real_num + ",";
        a.operate = action;
        set_config(a);
    };

    et.del_select = function () {
        //if(bm_conf.bm_enabled == 1)
         //   return;
        action = 'del';
        var a = {}, this_checked;
        a.list = '';
        this_checked = d('#tbody_info').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            a.list += d(m).parents('tr').find('.real_num').text() + ',';
        });
        a.operate = action;
        set_config(a);
    };

    function set_volide() {
        var error_flag = 0, arg = {}, iparray, set_ips;
        var iplimit_length = iplimit.length;

        arg.operate = action;
        if (action == 'edit') {
            arg.real_num = parseInt(d("#real_num").val());
        } else if (action == 'add' && iplimit_length >= 100) {
            h.ErrorTip(tip_num++, iplimit_option_over100);
            return false;
        }
        iparray = d("#limit_ip").val().split('-');

        if (iparray.length > 1 && h.ip2int(iparray[0]) > h.ip2int(iparray[1])) {
            set_ips = iparray.reverse().join('-');
        } else if (iparray.length > 1 && h.ip2int(iparray[0]) == h.ip2int(iparray[1])) {
            set_ips = iparray[0];
        } else {
            set_ips = d("#limit_ip").val();
        }
        arg.enable = d("#limit_enable").val();
        arg.ip = set_ips;
        arg.uprate = String(d("#limit_uprate").val() * 1000);
        arg.downrate = String(d("#limit_downrate").val() * 1000);
        arg.share = d("#limit_share").val();
        arg.comment = d("#limit_comment").val();

        d.each(iplimit, function (n, m) {
            if (arg.real_num == m.real_num) {
                return true;
            }
            if (m.ip == arg.ip) {
                h.ErrorTip(tip_num++, ipfilter_same);
                error_flag = 1;
            }
        });

        if (error_flag) {
            return false;
        }

        return arg;
    }

    function set_config(arg) {
        f.setMConfig('qos_ip_limit', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
            } else {
                h.SetOKTip(tip_num++, set_success);
                //f.getSHConfig('qos_config.php?action=arrange', function(data){}, false);
					refresh_init();
					reset_lock_web();
                //setTimeout(function(){
					
				//}, 3000);
            }
        });
    }

    function set_switch(arg) {
        f.setMConfig('mwan_qos', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
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
