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

    var action, iplimit, qos_info, macfilter, flow_net;
    var this_table, lock_web = false, tip_num = 0, default_num = 0;
    var handleInterval = 0;
    var dhcp_clients, arpbind_info, vlan_config, dev_vlan_type, double_support, lan_list;
    var dropdown_list = [];
    var quantity_qos_list;
    var first_run = 0;
    var sortCol=1, sortDir= "asc";

    var selectedRow = "";
    var bm_conf = false;
    
    var selected_vlan = '';
    var search_key = '';
    
    var b_vlan_selected = false;
    var b_keyword_selected = false;
    
    d('#page-wrapper').css('visibility', 'hidden');

    function init() {
        d('.select_line').val(default_num);
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');

        var dropdown_list_txt =  d.cookie('dropdown_list');
        if(typeof dropdown_list_txt == 'undefined')
        {
            first_run = 1;
        }
        else
            dropdown_list = JSON.parse(dropdown_list_txt);
        
        refresh_init();
    }

    function refresh_init() {
         f.getSHConfig('bandwidth_config.php?method=GET&action=bm_config', function(data){
            if(data){
                bm_conf = data;
                if(bm_conf.bm_enabled == 1)
                {
                    bm_enabled = true;
                }
                else
                {
                    bm_enabled = false;
                }
            }
        }, false);

        f.getSHConfig('bandwidth_config.php?method=GET&action=lan_list', function(data){
            lan_list = data || [];
        },false);


        f.getSHConfig('client_config.php?method=GET&action=client_info2', function(data){
            arpbind_info = data || [];
        },false);
    

        f.getSHConfig('client_config.php?method=GET&action=client_info', function(data){
            dhcp_clients = data || [];
        },false);

        f.getSHConfig('client_config.php?method=GET&action=quantity_qos_list', function(data){
            quantity_qos_list = data || [];
        },false);

        f.getMConfig('vlan_config', function (data) {
            if (data && data.errCode == 0) {
                double_support = data.double_support;
                dev_vlan_type = data.vlan_itype;
                vlan_config = data.vlan || [];
                showVlanList();
                
            }
         }, false);


        f.getMConfig('qos_ip_limit', function (data) {
            if (data && data.errCode == 0) {
                iplimit = data.list || [];
                qos_info = data.qos;
            }
        }, false);

        f.getMConfig('macft_config', function (data) {
            if (data && data.errCode == 0) {
                macfilter = data.macfilter_list || [];
            }
        }, false);



        netstats();
        d('#page-wrapper').css('visibility', 'visible');
        
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

    function netstats() {
        f.getSConfig('net_stats_get', function (data) {
            if (data && data.errCode == 0) {
                //flow_net = data.flow_net.sort(function (n, m) {
                //    return m.ur - n.ur;
                //}) || [];
                flow_net = data.flow_net || [];
                showtable();
                showDropdownList();
            }
        })

        if(handleInterval != 0)
        {
            clearInterval(handleInterval);
        }

        handleInterval = setInterval(function(){
            netstats();
        }, 5000);
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(flow_net, function (n, m) {
            var devip, txrate, upload, rxrate, download, uptime, mac, limit_real_num = '', limit_uprate = '',
                limit_downrate = '', limit_download = '', limit_upload = '';
                var arp_data = {};
            devip = m.ip;
            txrate = m.ur;
            upload = m.ub;
            mac = m.mac;
            uptime = m.t;
            rxrate = m.dr;
            download = m.db;

            d.each(quantity_qos_list, function(qos_idx, qos){
                if(mac.toLowerCase() == qos.mac.toLowerCase())
                {
                    limit_download = qos.download_limit;
                    limit_upload = qos.upload_limit;
                }

            });
            

            // && iplimit.length
            if (iplimit.length > 0) {
                d.each(iplimit, function (x, y) {
                    if (y.ip == devip) {
                        limit_real_num = y.real_num || '';
                        (y.uprate.length == 0) ? limit_uprate : limit_uprate = y.uprate / 1000;
                        (y.downrate.length == 0) ? limit_downrate : limit_downrate = y.downrate / 1000;
                        return false;
                    }
                });
            }

            var client = {};
            d.each(dhcp_clients, function(client_index, client_info){
                if(client_info.ip == devip)
                {
                    client = client_info;
                    return false;
                }
            });

            var dec_ip = IpSubnetCalculator.toDecimal(devip);
            var vlan_name = "Default VLAN";
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

            var selected = "";

            if(selectedRow != "")
            {
                if(selectedRow == devip)
                {
                    selected = "highlight";
                }
            }

            this_html += '<tr class="text-left ' + selected + '">';
            this_html += '<td class="hide limit_real_num">' + limit_real_num || '' + '</td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="dev_ip tbl_IPAddress text-left">' + devip + '</td>';
            
            d.each(arpbind_info, function(arp_index, arp_info){
                if(mac.toLowerCase() == arp_info.mac.toLowerCase())
                {
                    arp_data = arp_info;
                    return false;
                }

            });

            this_html += '<td class="dev_description tbl_Description">' + (arp_data.remark || "*") + '</td>';
            this_html += '<td class="dev_clientname tbl_ClientName">' + (client.commentname || "*") + '</td>';
            this_html += '<td class="dev_vlan tbl_VLAN text-left">' + (vlan_name.toUpperCase()) + '</td>';
            this_html += '<td class="dev_vlan tbl_VID text-left">' + (vlan_iface.toUpperCase()) + '</td>';
            
            this_html += '<td class="tbl_UploadRate text-left">' + g.bytesTosizePerSec(txrate, 2) + '</td>';
            this_html += '<td class="tbl_DownloadRate text-left">' + g.bytesTosizePerSec(rxrate, 2) + '</td>';
            this_html += '<td class="tbl_TotalUpload text-left">' + g.bytesTosize(upload, 2) + '</td>';
            this_html += '<td class="tbl_TotalDownload text-left">' + g.bytesTosize(download, 2) + '</td>';
            if(limit_upload == "" && limit_download == "")
            {
                this_html += '<td class="tbl_UploadLimit">Unlimited</td>';
                this_html += '<td class="tbl_DownloadLimit">Unlimited</td>';
    
            }
            else
            {
                this_html += '<td class="tbl_UploadLimit">' + (limit_upload != "" ? g.bytesTosize(parseInt(limit_upload) * 1024 * 1024, 2) : "") + '</td>';
                this_html += '<td class="tbl_DownloadLimit">' + (limit_download != "" ? g.bytesTosize(parseInt(limit_download) * 1024 * 1024, 2) : "")  + '</td>';
    
            }
            
            //this_html += '<td class="tbl_UploadRateLimit">' + (limit_uprate == '' ? '---' : limit_uprate  + " Mbps") || '---' + '</td>';
            //this_html += '<td class="tbl_DownloadRateLimit">' + (limit_downrate == '' ? '---' : limit_downrate + " Mbps") || '---' + '</td>';

            this_html += '<td class="tbl_OnlineTime">' + (uptime ? g.formatTime(parseInt(uptime)) : acconfig_offline) + '</td>';
            this_html += '<td class="text-center"><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:editConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a>';
            this_html += '<a data-toggle="modal" data-target="#modal_filter" class="table-link danger"  et="click tap:filtermac"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + blacklist_add + '" class="fa fa-arrow-circle-up fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '<td class="hide filter_mac">' + mac + '</td>';
            this_html += '<td class="hide limit_uprate">' + limit_uprate || '' + '</td>';
            this_html += '<td class="hide limit_downrate">' + limit_downrate || '' + '</td>';
            this_html += '<td class="hide limit_download">' + limit_download || '' + '</td>';
            this_html += '<td class="hide limit_upload">' + limit_upload || '' + '</td>';
			this_html += '<td class="hide src_iface">' + (vlan_iface || '')  + '</td>';
            this_html += '</tr>';
        });
        d('#tbody_info').html(this_html);
        
        if(b_vlan_selected)
			showTableByVlan();
		
		if(b_keyword_selected)
			showTableByKeyword();
        
         d('#search_input').on("keyup", function(){
			search_key = d(this).val();
			
			showTableByKeyword();
			d('.select_vlan').val('');
			selected_vlan = '';
			b_keyword_selected = true;
			b_vlan_selected = false;
		
		});

        if (flow_net.length > 0) {
            this_table = d('#table').DataTable({
                "aaSorting": [[sortCol, sortDir]],
                "columns": [
                    {"orderable": false},
                    null,
                    {type: 'ip', targets: 0},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {type: 'traffic', targets: 0},
                    {type: 'traffic', targets: 1},
                    {type: 'traffic', targets: 2},
                    {type: 'traffic', targets: 3},
                    null,
                    null,
                    //{"orderable": false},
                    //{"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false}

                ],
                "fnDrawCallback": function() {
                    sortCol = this.fnSettings().aaSorting[0][0];
                    sortDir = this.fnSettings().aaSorting[0][1];
                    }
            });
            if(default_num > 0)
                this_table.page.len(default_num).draw();
            else 
                this_table.page.len(flow_net.length).draw();
            
        }

        d('#tbody_info tr').on('click', function(){
            selectedRow = d(this).find('.dev_ip').html();
            d('#tbody_info tr').removeClass('highlight');
            d(this).addClass('highlight');

        });
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
		/*
		if(selected_vlan == "") {
			this_table.clear();
			if(default_num > 0)
                this_table.page.len(default_num).draw();
            else
                this_table.page.len(status_array.length).draw();
		}
		else
		{
			//this_table.columns(10).search(selected_vlan, true, false).draw();
			
			var filterData = this_table.column(10).data().filter(function(value, index) {
					return value == selected_vlan ? true : false;
				})
			this_table.clear();
			this_table.rows.add(filterData);
			this_table.draw();
		}
		* */
	}


    et.refresh_list = function () {
        gohref();
    };

    et.displayline = function (evt) {
        default_num = d(evt).val();
        if (flow_net.length > 0) {
            if(default_num > 0)
                this_table.page.len(default_num).draw();
            else
                this_table.page.len(flow_net.length).draw();
            
        }
        d(evt).blur();
    };


    
    et.changeDropdownListAll = function(evt){
        var val = evt.attr('data-value');
        var inputs = d('.dropdown-list').find('input[type="checkbox"]');
  
        dropdown_list = [];

        if(val == 0)
        {
            evt.attr('data-value', 1);
            d.each(inputs, function(n, m){
                d(m).attr('data-value', 1);
                var td_name = d(m).val();
                d('#table').find('.' + td_name).show();
                dropdown_list.push(td_name);
                
            });

        }
        else
        {
            evt.attr('data-value', 0);
            d.each(inputs, function(n, m){
                d(m).attr('data-value', 0);
                var td_name = d(m).val();
                d('#table').find('.' + td_name).hide();
            });
       }
       d.cookie('dropdown_list', JSON.stringify(dropdown_list));
    }

    et.changeDropdownList = function(evt) {
        var val = evt.attr('data-value');
        var td_name = evt.val();
        if(val == 0)
        {
            evt.attr('data-value', 1);
            d('#table').find('.' + td_name).show();
            var idx = dropdown_list.indexOf(td_name);
            if(idx < 0)
            {
                dropdown_list.push(td_name);
            }

        }
        else
        {
            evt.attr('data-value', 0);
            d('#table').find('.' + td_name).hide();
            var idx = dropdown_list.indexOf(td_name);
            if(idx >= 0)
            {
                dropdown_list.splice(idx, 1);
            }
        }

        d.cookie('dropdown_list', JSON.stringify(dropdown_list));
    }

    function showDropdownList()
    {
        var inputs = d('.dropdown-list').find('input[type="checkbox"]');
        if(first_run == 1)
        {
            d.each(inputs, function(n, m){
                d(m).attr('data-value', 1);
                d(m).prop('checked', true);
                var td_name = d(m).val();
                d('#table').find('.' + td_name).show();
            });
        }
        else
        {
            d.each(inputs, function(n, m){
                var td_name = d(m).val();
                d(m).attr('data-value', 0);
                d('#table').find('.' + td_name).hide();
                d(m).prop('checked',  false);

                d.each(dropdown_list, function(idx, input){
                    if(input == td_name)
                    {
                        d(m).attr('data-value', 1);
                        d('#table').find('.' + td_name).show();
                        d(m).prop('checked', true);
                    }
                });
            });

        }

    }

    et.editConfig = function (evt) {
        g.clearall();
        action = 'add';
        d('#ip').val(d(evt).parents('tr').find('.dev_ip').html() || '');
        d('#mac').val(d(evt).parents('tr').find('.filter_mac').html() || '');
        d('#limit_real_num').val(d(evt).parents('tr').find('.limit_real_num').html() || '');
        d('#limit_uprate').val(d(evt).parents('tr').find('.limit_uprate').html() || '');
        d('#limit_downrate').val(d(evt).parents('tr').find('.limit_downrate').html() || '');
        if(bm_enabled == true) {
			d('#limit_uprate').prop('disabled', true);
			d('#limit_downrate').prop('disabled', true);
			
		}

        d('#limit_download_quantity').val(d(evt).parents('tr').find('.limit_download').html() || '');
        d('#limit_upload_quantity').val(d(evt).parents('tr').find('.limit_upload').html() || '');
    };


    et.saveConfig = function () {

        if (lock_web) return;
        lock_web = true;
        
        set_qos_config();
        var limit_uprate = d('#limit_uprate').val();
        var limit_downrate = d('#limit_downrate').val();
        if(limit_uprate == "" && limit_downrate == "") 
        {
            d('.closewin').click();
            return;
        }
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (arg_data = set_volide()) {
            lock_web = false;
            d('.closewin').click();
            if (iplimit.length == 0 && arg_data.operate == "del") {
                set_ok_tip();
            } else {
                set_config(arg_data);
            }
        } else {
            lock_web = false;
        }
    };

    et.filtermac = function (evt) {
        var filter_mac = evt.parents('tr').find('.filter_mac').html();
        var real_num_mac = evt.parents('tr').find('.rnum_mac').html() || '';
        d('#filter_mac').html(filter_mac);
        d('#filter_real_num').val(real_num_mac);
    };

    et.savefilter = function () {
        d('.closewin').click();
        var filter_mac = d('#filter_mac').html();
        var a = {};

        var optflag = "add";
        d.each(macfilter, function (n, m) {
            if (m.src_mac == filter_mac.toLowerCase()) {
                a.real_num = m.real_num;
                optflag = 'edit'
            }
        });
        a.mac_black = '1';
        a.operate = optflag;
        a.src_mac = filter_mac.toLowerCase();
        set_macfilter(a);
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
        var a = {};
        var optflag;

        a.enable = "1";
        a.ip = d("#ip").val();
        (d("#limit_uprate").val() == 0) ? a.uprate = '' : a.uprate = '' + d("#limit_uprate").val() * 1000;
        (d("#limit_downrate").val() == 0) ? a.downrate = '' : a.downrate = '' + d("#limit_downrate").val() * 1000;
        a.share = "1";

        if (d("#limit_real_num").val() != "" ) {
            if(a.uprate != "" || a.downrate != ""){
                optflag = 'edit';
                a.real_num = parseInt(d("#limit_real_num").val());
            }else {
                a.list = d("#limit_real_num").val() + ',';
                optflag = 'del';
            }
        } else {
            if(a.uprate != "" || a.downrate != ""){
                optflag = 'add';
            }
        }

        a.operate = optflag;
        a.enable_limit = "1";
        return a;
    }

    function set_qos_config(){
        var download_limit = d('#limit_download_quantity').val();
        var upload_limit = d('#limit_upload_quantity').val();
        var mac = d('#mac').val();

        var arg = {mac: mac, download_limit: download_limit, upload_limit: upload_limit};

        
        f.setSHConfig('client_config.php?method=SET&action=quantity_qos_list', arg, function(data){
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000);
            }

        },false);
    }

    function set_config(arg) {
        f.setMConfig('qos_ip_limit', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000);
            }
        });
    }

    function set_ok_tip() {
        h.SetOKTip(tip_num++, set_success);
        setTimeout(reset_lock_web, 3000);
    }

    function set_macfilter(arg) {
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

    function gohref() {
        //location.href = location.href;
        refresh_init();
    }

    b.init = init;
});
