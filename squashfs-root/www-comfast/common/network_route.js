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

    var iface_to_name = {}, action, more_iface, static_route;
    var this_table, lock_web = false, tip_num = 0, default_num = 0;
    var wan_ext_info;

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
		/*
        f.getMConfig('direction_routing', function (data) {
            if (data.errCode == 0) {
                more_iface = data.wanlist;
                static_route = data.dir_routing || [];
                ifaceoption(more_iface);
                showtable();
            }
        });
        */
         f.getSHConfig('network_config.php?method=GET&action=wan_info', function(data){
			wan_ext_info = data || [];
		},false);
		
        f.getMConfig('multi_pppoe', function (data) {
            if (data.errCode == 0) {
                more_iface = data.wanlist || [];
                ifaceoption(more_iface);
			}
		}, false);
		
		f.getSHConfig('dirroute_config.php?method=GET&action=read_conf', function(data){
                static_route = data || [];
                showtable();
		},false);
        
    }

    function ifaceoption(moreiface) {
        var this_html = '';
        d.each(moreiface, function (n, m) {
			var wan_name = m[0].name.toUpperCase();
			
			var description = "";
			 d.each(wan_ext_info, function(ext_index, ext_info){
				if(m[0].iface == ext_info.iface) {
					description = ext_info.hostname;
					return false;
				}
			});
			
			
			if(description != "") {
				wan_name = (m[0].name.toUpperCase() + "(" + description + ")");
			}
			//var wan_name = (m[0].dhcp.hostname == "") ? (m[0].name.toUpperCase() ) : (m[0].name.toUpperCase() + "(" + (m[0].dhcp.hostname || "") + ")");
            this_html += '<option value="' + m[0].iface + '" >' + wan_name + '</option>';
            iface_to_name[m[0].iface] = wan_name;
        });
        d('#iface').html(this_html);
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(static_route, function (n, m) {
			
            var ip_arr = m.ipaddr;
            var color = m.enable == "1" ? 'style="background-color: #DEEAF6"' : 'style="background-color: #FFDEDD"';
            this_html += '<tr class="text-left" ' + color + '>';
            this_html += '<td class="tbl" >' + (n + 1) + '</td>';
            this_html += '<td class="start_ip tbl">' + ip_arr + '</td>';
            
            //this_html += '<td class="end_ip">' + ip_arr[1] + '</td>';
            this_html += '<td class="name tbl" >' + iface_to_name[m.iface] + '</td>';
            this_html += '<td class="dest_alias tbl">' + m.desc + '</td>';
            
            var status = m.enable == "1" ? "Enabled" : "Disabled";
            this_html += '<td class="tbl">' + status + '</td>';
            this_html += '<td class="text-center tbl" ><a data-toggle="modal" data-target="#modal_one" class="table-link"><span class="fa-stack" et="click tap:editConfig"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger"><span class="fa-stack" et="click tap:delete_row"><i class="fa fa-square fa-stack-2x"></i><i title="Delete" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '<td class="real_num hidden" >' + m.real_num + '</td>';
            this_html += '<td class="hidden"><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td class="iface hidden" >' + m.iface + '</td>';
            this_html += '<td class="enable hidden">' + m.enable + '</td>';
            this_html += '</tr>';
        });
        d('#tbody_info').html(this_html);

        if (static_route.length != 0) {
            this_table = d('#table').DataTable({
                "bDestroy": true,
                "columns": [
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false}
                ],
                "drawCallback": function () {
                    laber_text(false);
                    d(":checkbox", d('#table_wrapper')).prop('checked', false);
                }
            });
            if(default_num > 0)
				this_table.page.len(default_num).draw();
			else 
				this_table.page.len(static_route.length).draw();
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
        if(default_num > 0)
			this_table.page.len(default_num).draw();
		else
			this_table.page.len(static_route.length).draw();
        d(evt).blur();
    };

    et.add_list = function () {
        g.clearall();
        action = "add";
    };

    et.editConfig = function (evt) {
        g.clearall();
        action = 'edit';
        d('#real_num').val(d(evt).parents('tr').find('.real_num').html());
        d('#start_ip').val(d(evt).parents('tr').find('.start_ip').html());
        //d('#end_ip').val(d(evt).parents('tr').find('.end_ip').html());
        d('#iface').val(d(evt).parents('tr').find('.iface').html().toLowerCase());
        d('#dest_alias').val(d(evt).parents('tr').find('.dest_alias').html());
        d('#enable').val(d(evt).parents('tr').find('.enable').html());
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

    et.apply_select = function () {
        action = 'del';
        var a = {}, this_checked;
        a.del_list = '';
        this_checked = d('#tbody_info').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            a.del_list += d(m).parents('tr').find('.real_num').text() + ',';
        });
        a.action = action;
        set_config(a);
    };
    
    et.delete_row = function(evt) {
		var arg = {};
		arg.action = 'del';
		arg.del_list = d(evt).parents('tr').find('.real_num').html() +  ",";
		set_config(arg);
	}

    function set_volide() {
        var arg = {}, error_falg = 0, ip_arr = [], start_ip, end_ip;

        if (action == 'add' && static_route.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        arg.action = action;

        if (action == 'edit') {
            arg.real_num = parseInt(d("#real_num").val());
        }
        start_ip = d("#start_ip").val();
        //end_ip = d("#end_ip").val();

	/*
        if (h.ip2int(start_ip) > h.ip2int(end_ip)) {
            var tmp_num;
            tmp_num = start_ip;
            start_ip = end_ip;
            end_ip = tmp_num;
            ip_arr[0] = start_ip;
            ip_arr[1] = end_ip;

        } else if (h.ip2int(start_ip) == h.ip2int(end_ip)) {
            ip_arr[0] = start_ip;
        } else {
            ip_arr[0] = start_ip;
            ip_arr[1] = end_ip;
        } */

        //arg.ipaddr = ip_arr.join('-');
        arg.ipaddr = start_ip;

        arg.iface = d("#iface").val();
        arg.desc = d("#dest_alias").val();
        arg.enable = d('#enable').val();

        d.each(static_route, function (n, m) {
            if (arg.real_num == m.real_num) return true;
            if (arg.ipaddr == m.ipaddr && arg.iface == m.iface) {
                h.ErrorTip(tip_num++, portfw_same);
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
		f.setSHConfig('dirroute_config.php?method=SET&action=save_conf', arg, function (data){
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
