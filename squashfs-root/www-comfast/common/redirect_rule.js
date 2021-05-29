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

    var iface_to_name = {}, action, more_iface, static_route, static_rule;
    var this_table,this_table_src, lock_web = false, tip_num = 0, default_num = 0, default_num_src = 0;
    var wan_ext_info;
    
    var lan_list, wan_list, ip_exception_list = [];

    function init() {
        d('.select_line').val(default_num);
        d('.select_line_src').val(default_num_src);
        e.plugInit(et, start_model);
    }

    function start_model(data) {
		run_waitMe('ios');
        device = data;
        h.volide('body');
        refresh_init();
    }
    
    
    function run_waitMe(effect){
		$('#page-wrapper').waitMe({
			effect: effect,
			text: please_waiting,
			bg: 'rgba(255,255,255,0.7)',
			color:'#000'
		});
    }
    
    //loading finished
    function release_loading(bshowTip)
    {
        $('#page-wrapper').waitMe('hide');
        if(bshowTip)
            h.SetOKTip(tip_num++, set_success);
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
        f.getMConfig('lan_dhcp_config', function (data) {
            if (data && data.errCode == 0) {
                lan_list = data.lanlist || [];
                vlan_list = data.vlanlist || [];
                d.each(lan_list, function(n,m) {
					var ipaddr = m.ipaddr;
					if(ipaddr == "") return;
					var ip_num = h.ip2int(ipaddr);
					if(ip_num == 0) return;
					ip_exception_list.push(ip_num);
				});
            }
        }, false);

         f.getSHConfig('network_config.php?method=GET&action=wan_info', function(data){
			wan_ext_info = data || [];
		},false);
		
        f.getMConfig('multi_pppoe', function (data) {
            if (data.errCode == 0) {
                more_iface = data.wanlist || [];
                wan_list = data.wanlist || [];
                ifaceoption(more_iface);
                
                d.each(wan_list, function(n,m){
					var ipaddr = m[0].wan_ipaddr || "";
					if(ipaddr == "") return;
					var ip_num = h.ip2int(ipaddr);
					if(ip_num == 0) return;
					ip_exception_list.push(ip_num);
				});
			}
		}, false);
		
		f.getSHConfig('redirect_rule.php?method=GET&action=get_rule', function(data){
                static_route = data.target_rule || [];
                static_rule = data.src_rule || [];
                showtable();
                showtable_src();
		},false);
		
		d('#nav-col').css('opacity', '1');
        d('#content-wrapper').css('opacity', '1');
        release_loading(false);
        
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
			
            var ip_arr = m.target_ip;
            var color = m.enable == "1" ? 'style="background-color: #DEEAF6"' : 'style="background-color: #FFDEDD"';
            this_html += '<tr class="text-left" ' + color + '>';
            this_html += '<td class="tbl" >' + (n + 1) + '</td>';
            this_html += '<td class="start_ip tbl">' + ip_arr + '</td>';
            
            //this_html += '<td class="end_ip">' + ip_arr[1] + '</td>';
            this_html += '<td class="name tbl" >' + iface_to_name[m.iface] + '</td>';
            this_html += '<td class="dest_alias tbl">' + m.comment + '</td>';
            
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
    
    function showtable_src() {
        var this_html = '';

        d('#table_src').dataTable().fnClearTable();
        d('#table_src').dataTable().fnDestroy();

        d.each(static_rule, function (n, m) {
			
            var ip_arr = m.src_ip;
            var color = m.enable == "1" ? 'style="background-color: #DEEAF6"' : 'style="background-color: #FFDEDD"';
            this_html += '<tr class="text-left" ' + color + '>';
            this_html += '<td class="tbl" >' + (n + 1) + '</td>';
            this_html += '<td class="start_ip tbl">' + ip_arr + '</td>';
            this_html += '<td class="dest_alias tbl">' + m.comment + '</td>';
            
            var status = m.enable == "1" ? "Enabled" : "Disabled";
            this_html += '<td class="tbl">' + status + '</td>';
            this_html += '<td class="text-center tbl" ><a data-toggle="modal" data-target="#modal_two" class="table-link"><span class="fa-stack" et="click tap:editConfig_src"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger"><span class="fa-stack" et="click tap:delete_row_src"><i class="fa fa-square fa-stack-2x"></i><i title="Delete" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '<td class="real_num hidden" >' + m.real_num + '</td>';
            this_html += '<td class="hidden"><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td class="enable hidden">' + m.enable + '</td>';
            this_html += '</tr>';
        });
        d('#tbody_info_src').html(this_html);

        if (static_rule.length != 0) {
            this_table_src = d('#table_src').DataTable({
                "bDestroy": true,
                "columns": [
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false}
                ],
                "drawCallback": function () {
                    laber_text_src(false);
                    d(":checkbox", d('#table_src_wrapper')).prop('checked', false);
                }
            });
            if(default_num_src > 0)
				this_table_src.page.len(default_num_src).draw();
			else 
				this_table_src.page.len(static_rule.length).draw();
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
    
    d('#table_src').on("change", ":checkbox", function () {
        if (d(this).is("[name='checked-all']")) {
            d(":checkbox:enabled", d('#table_src')).prop("checked", d(this).prop("checked"));
            laber_text_src(d(this).prop("checked"));
        } else {
            var checkbox = d("tbody :checkbox:enabled", d('#table_src'));
            d(":checkbox[name='checked-all']", d('#table_src')).prop('checked', checkbox.length == checkbox.filter(':checked:enabled').length);
            laber_text_src(checkbox.length == checkbox.filter(':checked:enabled').length);
        }
    }).on("click", ".row-checkbox", function (event) {
        !d(event.target).is(":checkbox") && d(":checkbox", this).trigger("click");
    });
    
 

    function laber_text(status) {
        if (status) {
            d("#table [for='allchecked']").text(disselectall_tab);
        } else {
            d("#table [for='allchecked']").text(selectall_tab);
        }
    }
    
	function laber_text_src(status) {
        if (status) {
            d("#table_src [for='allchecked']").text(disselectall_tab);
        } else {
            d("#table_src [for='allchecked']").text(selectall_tab);
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
    
    et.displayline_src = function (evt) {
        default_num_src = d(evt).val();
        if(default_num_src > 0)
			this_table_src.page.len(default_num_src).draw();
		else
			this_table_src.page.len(static_rule.length).draw();
        d(evt).blur();
    };


    et.add_list = function () {
        g.clearall();
        action = "add";
    };
    
    et.add_list_src = function () {
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
    
    et.editConfig_src = function (evt) {
        g.clearall();
        action = 'edit';
        d('#src_real_num').val(d(evt).parents('tr').find('.real_num').html());
        d('#src_start_ip').val(d(evt).parents('tr').find('.start_ip').html());
        d('#src_dest_alias').val(d(evt).parents('tr').find('.dest_alias').html());
        d('#src_enable').val(d(evt).parents('tr').find('.enable').html());
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
    
     et.saveConfig_src = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_volide_src()) {
            d('#closewin_src').click();
            set_config_src(arg_data)
        } else {
            lock_web = false;
        }
    };
    
    et.closeModal_src = function(evt) {
		d('#modal_two').hide();
	}

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
    
    et.apply_select_src = function () {
        action = 'del';
        var a = {}, this_checked;
        a.del_list = '';
        this_checked = d('#tbody_info_src').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            a.del_list += d(m).parents('tr').find('.real_num').text() + ',';
        });
        a.action = action;
        set_config_src(a);
    };
    
    et.delete_row = function(evt) {
		var arg = {};
		arg.action = 'del';
		arg.del_list = d(evt).parents('tr').find('.real_num').html() +  ",";
		set_config(arg);
	}
	
	et.delete_row_src = function(evt) {
		var arg = {};
		arg.action = 'del';
		arg.del_list = d(evt).parents('tr').find('.real_num').html() +  ",";
		set_config_src(arg);
	}

	
	function parseCIDR(CIDR) {
		var beg = CIDR.substr(CIDR, CIDR.indexOf('/'));
		var end = beg;
		var off = (1<<(32 - parseInt(CIDR.substr(CIDR.indexOf('/') + 1)))) - 1;
		var sub = beg.split('.').map(function(a){return parseInt(a)});
		
		var buf = new ArrayBuffer(4);
		var i32 = new Uint32Array(buf);
		
		i32[0] = (sub[0] << 24) + (sub[1]<< 16) + (sub[2] << 8) + (sub[3]) + off;
		var end = Array.apply([], new Uint8Array(buf)).reverse().join('.');
		
		return [beg, end];
	}
	
	function parseCIDR2(cidr) {
	   var range = [2];
	   cidr = cidr.split('/');
	   var cidr_1 = parseInt(cidr[1])
	   range[0] = h.int2ip((h.ip2int(cidr[0])) & ((-1 << (32 - cidr_1))));
	   start = h.ip2int(range[0])
	   range[1] = h.int2ip( start + Math.pow(2, (32 - cidr_1)) - 1);
	   return range;
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
        if(start_ip == "") {
			h.ErrorTip(tip_num++, "Invalid IP Address");
            return false;
		}
		
		var ipTokens = start_ip.split(",");
		var ip_list = [];
		d.each(ipTokens, function(n, m){
			if(m.indexOf("-") > -1) {
				//ip range
				var ipRange = m.split("-");
				var firstIP = ipRange[0] || "";
				var secondIP = ipRange[1] || "";
				if(firstIP == "" || secondIP == "") return;
				if(h.ip2int(firstIP) == 0 || h.ip2int(secondIP) == 0) return;
				
				var firstIPNum = h.ip2int(firstIP);
				var secondIPNum = h.ip2int(secondIP);
				if(secondIPNum < firstIPNum) 
				{
					var tmp_num = firstIPNum;
					firstIPNum = secondIPNum;
					secondIPNum = tmp_num;
				}
				for(var i = firstIPNum; i <= secondIPNum; i++)
				{
					ip_list.push(i);
				}
			}
			else if(m.indexOf("/") > -1) {
				//subnet
				var ipRange = parseCIDR2(m);
				if(ipRange[0] == "" || ipRange[1] == "") return;
				
				var firstIPNum = h.ip2int(ipRange[0]);
				var sencondIPNum = h.ip2int(ipRange[1]);
				if(sencondIPNum < firstIPNum) 
				{
					var tmp_num = firstIPNum;
					firstIPNum = sencondIPNum;
					sencondIPNum = tmp_num;
				}
				for(var i = firstIPNum; i <= sencondIPNum; i++)
				{
					ip_list.push(i);
				}
			}
			else{
				//single ip
				if(m == "") return;
				ip_list.push(h.ip2int(m));
			}
		});
		
		var bFound = false;
		
		d.each(ip_list, function(n, m){
			d.each(ip_exception_list, function(ip_idx, ip){
				if(m == ip){
					bFound = true;
					return false;
				}
			});
			
			if(bFound == true) return false;
		});
		
		if(bFound){
			h.ErrorTip(tip_num++, "Invalid IP Address");
			return false;
		}
		
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
        arg.target_ip = start_ip;

        arg.iface = d("#iface").val();
        arg.comment = d("#dest_alias").val();
        arg.enable = d('#enable').val();

        d.each(static_route, function (n, m) {
            if (arg.real_num == m.real_num) return true;
            if (arg.target_ip == m.target_ip && arg.iface == m.iface) {
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
    
    
    function set_volide_src() {
        var arg = {}, error_falg = 0, ip_arr = [], start_ip, end_ip;

        if (action == 'add' && static_route.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        arg.action = action;

        if (action == 'edit') {
            arg.real_num = parseInt(d("#src_real_num").val());
        }
        start_ip = d("#src_start_ip").val();
        if(start_ip == "") {
			h.ErrorTip(tip_num++, "Invalid IP Address");
            return false;
		}
		
		var ipTokens = start_ip.split(",");
		var ip_list = [];
		d.each(ipTokens, function(n, m){
			if(m.indexOf("-") > -1) {
				//ip range
				var ipRange = m.split("-");
				var firstIP = ipRange[0] || "";
				var secondIP = ipRange[1] || "";
				if(firstIP == "" || secondIP == "") return;
				if(h.ip2int(firstIP) == 0 || h.ip2int(secondIP) == 0) return;
				
				var firstIPNum = h.ip2int(firstIP);
				var secondIPNum = h.ip2int(secondIP);
				if(secondIPNum < firstIPNum) 
				{
					var tmp_num = firstIPNum;
					firstIPNum = secondIPNum;
					secondIPNum = tmp_num;
				}
				for(var i = firstIPNum; i <= secondIPNum; i++)
				{
					ip_list.push(i);
				}
			}
			else if(m.indexOf("/") > -1) {
				//subnet
				var ipRange = parseCIDR2(m);
				if(ipRange[0] == "" || ipRange[1] == "") return;
				
				var firstIPNum = h.ip2int(ipRange[0]);
				var sencondIPNum = h.ip2int(ipRange[1]);
				if(sencondIPNum < firstIPNum) 
				{
					var tmp_num = firstIPNum;
					firstIPNum = sencondIPNum;
					sencondIPNum = tmp_num;
				}
				for(var i = firstIPNum; i <= sencondIPNum; i++)
				{
					ip_list.push(i);
				}
			}
			else{
				//single ip
				if(m == "") return;
				ip_list.push(h.ip2int(m));
			}
		});
		
		var bFound = false;
		
		d.each(ip_list, function(n, m){
			d.each(ip_exception_list, function(ip_idx, ip){
				if(m == ip){
					bFound = true;
					return false;
				}
			});
			
			if(bFound == true) return false;
		});
		
		if(bFound){
			h.ErrorTip(tip_num++, "Invalid IP Address");
			return false;
		}
		
        arg.src_ip = start_ip;

        arg.comment = d("#src_dest_alias").val();
        arg.enable = d('#src_enable').val();

        d.each(static_rule, function (n, m) {
            if (arg.real_num == m.real_num) return true;
            
            if (arg.src_ip == m.src_ip ) {
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
		f.setSHConfig('redirect_rule.php?method=SET&action=save_conf', arg, function (data){
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
    
    function set_config_src(arg) {
		f.setSHConfig('redirect_rule.php?method=SET&action=save_conf_src', arg, function (data){
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
