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

    var arpstatic_info, arpbindlists_info, dhcp_static, arp_dhcp, arpstatue, action;
    var this_table, lock_web = false, tip_num = 0, default_num = 10;
    var dhcp_clients, vlan_config, double_support, dev_vlan_type, arpbind_info, lan_list;
    
        
    var selected_vlan = '';
    var search_key = '';
    var b_vlan_selected = false;
    var b_keyword_selected = false;


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
        arpbindlists_info = [];
        f.getSHConfig('bandwidth_config.php?method=GET&action=lan_list', function(data){
            lan_list = data || [];
        },false);

        f.getSHConfig('client_config.php?method=GET&action=client_info', function(data){
            dhcp_clients = data || [];
        },false);


        f.getMConfig('vlan_config', function (data) {
            if (data && data.errCode == 0) {
                double_support = data.double_support;
                dev_vlan_type = data.vlan_itype;
                vlan_config = data.vlan || [];
                showVlanList();
            }
         }, false);

        f.getSHConfig('client_config.php?method=GET&action=client_info2', function(data){
            arpbind_info = data || [];
        },false);


        f.getMConfig('arp_static_bind', function (data) {
            if (data.errCode == 0) {
                arpstatic_info = data.arp_static;
                if (arpstatic_info && arpstatic_info.enable == 1) {
                    arpstatue = 1;
                } else {
                    arpstatue = 0;
                }
                showinit(arpstatue);
            }
        }, false);

        f.getMConfig('dhcp_static_list', function (data) {
            if (data && data.errCode == 0) {
                dhcp_static = data.dhcp || [];
                arp_dhcp = d.extend(true, [], dhcp_static);
                refresh_list();
            }
        });
    }

    function showinit(statue) {
        if (statue) {
            d("#arpset").text(dis_arp_static).attr('sh_lang', 'dis_arp_static');
            d("#arpset_icon").addClass("fa-sign-out").removeClass("fa-sign-in");

            f.getMConfig('arp_bind_list', function (data) {
                if (data && data.errCode == 0) {
                    arpbindlists_info = data.arp_bind || [];
                }
            }, false)
        } else {
            d("#arpset").text(arp_static).attr('sh_lang', 'arp_static');
            d("#arpset_icon").addClass("fa-sign-in").removeClass("fa-sign-out");
        }
    }
    
    
    function showVlanList() {
		
		var txt_html = "";
			var vlan_name = "Default VLAN";
            var vlan_iface = "";
            
            txt_html += '<option value="">ALL</option>';

            d.each(vlan_config, function(vlan_index, vlan_info){
				vlan_name = vlan_info.desc == "" ? vlan_info.iface : vlan_info.desc;
				vlan_iface = vlan_info.iface;
				txt_html += '<option value="' + vlan_iface + '">' + vlan_name + '</option>';
            });

            d.each(lan_list, function(lan_index, lan_info){
				vlan_name = lan_info.hostname == "" ? lan_info.ifname.toUpperCase() : lan_info.hostname;
				vlan_iface = lan_info.ifname.toUpperCase();
				txt_html += '<option value="' + vlan_iface + '">' + vlan_name + '</option>';
            });
            
            d('.select_vlan').html(txt_html);
            
            d('.select_vlan').select(selected_vlan);
            d('.select_vlan').val(selected_vlan);
	
	}


    function refresh_list() {
        var dub_flag;
        d.each(arpbindlists_info, function (n, m) {
            dub_flag = 0;
            d.each(dhcp_static, function (x, y) {
                if (m.ip == y.ip || m.mac == y.mac.toUpperCase()) {
                    dub_flag = 1;
                }
            });
            if (!dub_flag) {
                arp_dhcp.push(m)
            }
        });
        showtable();
    }

    function showtable() {
        var this_html = '', notcheck = 0;

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(arp_dhcp, function (n, m) {
            if (m.commentname == undefined) {
                notcheck = 1;
            }

            var additional_info = {};
            d.each(dhcp_clients, function(client_index, client_info){
                if(client_info.mac.toLowerCase() == m.mac.toLowerCase())
                {
                    additional_info = client_info;
                    return false;
                }
            });
            var client_ip = m.ip;
            var dec_ip = IpSubnetCalculator.toDecimal(client_ip);
            var vlan_name = "";
            var vlan_iface = "";

            d.each(vlan_config, function(vlan_index, vlan_info){
                var calc_data = IpSubnetCalculator.calculateCIDRPrefix(vlan_info.ipaddr, vlan_info.netmask);
                if(dec_ip >= calc_data.ipLow && dec_ip <= calc_data.ipHigh)
                {
                    //this ip is in this vlan_config
                    vlan_name = vlan_info.desc == "" ? vlan_info.iface : vlan_info.desc;
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
                    vlan_name = lan_info.hostname == "" ? lan_info.ifname.toUpperCase() : lan_info.hostname;
                    vlan_iface = lan_info.ifname.toUpperCase();
                    return false;
                }
            });

            var arp_data = {};

            d.each(arpbind_info, function(arp_index, arp_info){
                if(m.mac.toLowerCase() == arp_info.mac.toLowerCase())
                {
                    arp_data = arp_info;
                    return false;
                }

            });


            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden" >' + m.real_num + '</td>';
            if (notcheck) {
                this_html += '<td><input type="checkbox" disabled/></td>';
            } else {
                this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            }

            this_html += '<td class="text-left">' + (n + 1) + '</td>';
            this_html += '<td class="src_ip text-left">' + m.ip + '</td>';
            this_html += '<td class="src_mac text-left" >' + m.mac.toUpperCase() + '</td>';

            if (notcheck) {
                this_html += '<td class="src_name text-left" >' + m.remark + '</td>';
            } else {
                this_html += '<td class="src_name text-left" >' + m.commentname + '</td>';
            }

            this_html += '<td class="tbl_Description text-left"><span class="hide">' + (arp_data.remark || "") + '</span><input type="text" value="' + (arp_data.remark || "") + '" style="min-width:170px;border:1px solid #ffffff;" id="description_' + n + '" class="input_description border_light_grey text-left" et="blur:changeDescription" /></td>';



            this_html += '<td class="src_vlan_name text-left">' + vlan_name.toUpperCase() +'</td>';
            this_html += '<td class="src_vlan_iface text-left">' + vlan_iface.toUpperCase() +'</td>';

            var status = additional_info.status || 'online';
            if(status == 'online')
            {
                this_html +='<td><div class="tooltips dot-blue"><span class="tooltiptext">Online</span><div></td>';
            }
            else if(status == "offline")
            {
                this_html +='<td><div class="tooltips dot-red"><span class="tooltiptext">Offline</span><div></td>';
            }
            else{
                this_html += '<td><div class="tooltips dot-green"><span class="tooltiptext">Inactive</span><div></td>';
            }

            if (notcheck) {
                this_html += '<td><a class="table-link gray"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i class="md-trigger fa fa-pencil fa-stack-1x fa-inverse"></i></span></a></td>';
            } else {
                this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:edit"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" sh_title="edit" class="md-trigger fa fa-pencil fa-stack-1x fa-inverse"></i></span></a></td>';

            }

            this_html += "<td class='hidden src_iface'>" + vlan_iface + "</td>";
            this_html += '</tr>';
        });
        d('#tbody_info').html(this_html);


        
        d('.input_description').on('blur', function(e){
            d('.input_description').on('blur', function(e){


                var val = d(this).val();
               var macaddr = d(this).parents('tr').find('.src_mac').html();
               var arg = {mac:macaddr, remark:val};
               f.setSHConfig('client_config.php?method=SET&action=client_info2', arg, function (data){
                f.getSHConfig('client_config.php?method=GET&action=client_info2', function(data){
                    arpbind_info = data || [];
                },false);
               });
            });
        });

        d('.input_description').on("keyup", function(event) {
            if(event.which == 13) 
            {
               
                d(this).blur();
            }
          });
          
        d('#search_input').on("keyup", function(){
			search_key = d(this).val();
			
			showTableByKeyword();
			
			d('.select_vlan').val('');
			selected_vlan = '';
			b_keyword_selected = true;
			b_vlan_selected = false;
		
		});  

        if (arp_dhcp.length > 0) {
            this_table = d('#table').DataTable({
                "aaSorting": [[2, "asc"]],
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    null,
                    null,
                    null,
                    null,
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false}
                ],
                "drawCallback": function (settings) {
                    //??????
                    laber_text(false);
                    d(":checkbox", d('#table_wrapper')).prop('checked', false);
                }
            });
            this_table.page.len(default_num).draw();
        }
        
        showTableByVlan();
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
        if (arp_dhcp.length > 0) {
            default_num = d(evt).val();
            this_table.page.len(default_num).draw();
            d(evt).blur();
        }
    }
    
    
     function showTableByKeyword() {
	
			d('#tbody_info tr').each(function(){
				var innerText = d(this).text();
				if(search_key == "")
				{
					d(this).show();
					 return;
				}
				if(innerText.toLowerCase().indexOf(search_key.toLowerCase()) > -1) {
					d(this).show();
				}
				else
				{
					d(this).hide();
				}
			});	
	}
    
    function showTableByVlan() {
	
		
		d('#tbody_info tr').each(function(){
				var iface = d(this).find(".src_iface").text();
				if(selected_vlan == "")
				{
					d(this).show();
					 return;
				}
				if(iface != selected_vlan) {
					d(this).hide();
				}
				else
				{
					d(this).show();
				}
			});
	
	}
    
    et.displayvlan = function(evt) {
		selected_vlan = d(evt).val();
		
		showTableByVlan();
		d('#search_input').val('');
		search_key = '';
		b_vlan_selected = true;
		b_keyword_selected = false;
		
	}



    et.arp_set = function () {
        var arg = {};

        if (arpstatue == 0) {
            arpstatue = 1;
        } else if (arpstatue == 1) {
            arpstatue = 0;
            arpbindlists_info = [];
        }

        arg.enable = '' + arpstatue;
        set_staticbind(arg);
    };

    et.add_list = function () {
        action = "add";
        g.clearall()
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

    function set_volide() {
        var a = {}, error_flag = 0;
        a.list = [];
        a.list[0] = {};

        if (action == 'add' && dhcp_static.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        if (action == 'edit') {
            a.list[0].real_num = parseInt(d("#real_num").val());
        }
        a.list[0].action = action;
        a.list[0].ip = d("#src_ip").val();
        a.list[0].mac = d("#src_mac").val().toLowerCase();
        a.list[0].commentname = d("#src_name").val();

        d.each(dhcp_static, function (n, m) {
            if (a.list[0].ip == m.ip && a.list[0].mac == m.mac) {
                if (a.list[0].real_num == m.real_num) {
                    return true;
                }
                h.ErrorTip(tip_num++, dhcp_static_conflict);
                error_flag = 1;
                return false;
            }
        });
        if (error_flag) {
            lock_web = false;
            return false;
        }
        return a;
    }


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

    et.edit = function (evt) {
        action = "edit";
        g.clearall();
        showlistwin(evt);
    };

    function showlistwin(evt) {
        var src_ip, src_mac, src_name, real_num;
        src_ip = d(evt).parents('tr').find('.src_ip').text();
        src_mac = d(evt).parents('tr').find('.src_mac').text();
        src_name = d(evt).parents('tr').find('.src_name').text();
        real_num = d(evt).parents('tr').find('.real_num').text();

        d("#src_ip").val(src_ip);
        d("#src_mac").val(src_mac);
        d("#src_name").val(src_name);
        d("#real_num").val(real_num);
    }

    function set_staticbind(arg) {
        f.setMConfig('arp_static_bind', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        })
    }

    function set_config(arg) {
        f.setMConfig('static_dhcp', arg, function (data) {
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
