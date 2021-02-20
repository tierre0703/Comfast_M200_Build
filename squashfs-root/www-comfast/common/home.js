define(function (require, exports) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
		h = require('tips'),
        et = {}, device;

    require('bootstrap')(d);

    var color_array = [], cpu_model, firmware_info, ac_enable = 1, cpuflow_info, memory_info, portlist_info, portnum,
        portarr, online_ap;
    var color_green = "#2ECC71";
    var color_purple = "#9b59b6";
    var flow_data_store = [], data_rx = 0, data_tx = 0;
    var lan_list;
    var wan_ext_info;

    var wan_list = [];
    var wan_full_list = [];
    var wan_speed_list = [];
    var wan_speed_history = [];
    var time_lapse = 0;
    var wan_connect_status = [];
    var bm_conf;
    var tip_num = 0;
    
    var handleInterval = 0;
    var refresh_upgrade_interval = 0;
    var refresh_iface_interval = 0;
    var refresh_cpuflow_memusage_interval = 0;
    var refresh_wan_speed_interval = 0;
    var refresh_uptime_interval = 0;

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        device = data;
        refresh_default();
    }

    function refresh_default() {
        //if (device.ac == 1) {
        //    d('#system_name').removeClass('hide');
        //}

        d.ajax({
            type: 'GET',
            dataType: 'json',
            url: '/js/color.json',
            cache: false,
            async: false,
            success: function (data) {
                color_array[0] = data.color1;
                color_array[1] = data.color2;
                color_array[2] = data.color3;
                color_array[3] = data.color4;

                //color_green = data.color11;
                //color_purple = data.color12;
            }
        });
        
        f.getSHConfig('network_config.php?method=GET&action=wan_info', function(data){
			wan_ext_info = data || [];
		},false);
        
        f.getSHConfig('bandwidth_config.php?method=GET&action=bm_config', function(data){
	    bm_conf = data || {};
	}, false);

        f.getSHConfig('bandwidth_config.php?method=GET&action=lan_list', function(data){
            lan_list = data || [];
        },false);


        f.getMConfig('multi_pppoe', function (data) {
            if (data.errCode == 0) {
                wan_full_list = data.wanlist || [];
            }
        }, false);

        f.getSHConfig('bandwidth_config.php?method=GET&action=wan_status', function(data){
            wan_connect_status = data; 
        }, false);


        initchart();
        f.getSHConfig('bandwidth_config.php?method=GET&action=wan_speed', function(data){
            wan_speed_list = data;
            show_wan_speed_panel();
        }, false);
        // setTimeout(delayed_fun,50);
        delayed_fun();
    }

    function initchart() {
        $('#cpuusage').easyPieChart({barColor: color_array[0], size:120});
        $('#memory').easyPieChart({barColor: color_array[1], size:120});
    }

    function delayed_fun() {
        if (device.ac == '1') {
            d('#ac_mode').removeClass('hide');
        }

        f.getMConfig('firmware_info', function (data) {
            if (data.errCode == 0) {
                cpu_model = data.cpumodel.cpumodel;
                firmware_info = data.firmware;
                load_Firmware();
                loadcpumode(cpu_model);
            }
        });
        
        refresh_upgrade();
        refresh_iface();
        refresh_cpuflow_memusage();
        refresh_wan_speed();
        refresh_uptime();
        setevent();
    }

    function refresh_upgrade() {
        f.getMConfig('fota_status', function (data) {
            //data = {"errCode":0,"fota_status":{"fota_status":1,"fota_version":"v2.0.0"}};
            if (data.errCode == 0) {
                if (data.fota_status.fota_status == 1) {
                    d("#upgrade_flag").show();
                } else {
                    d("#upgrade_flag").hide();
                }
                if(refresh_upgrade_interval != 0) {
					clearTimeout(refresh_upgrade_interval);
				}
                refresh_upgrade_interval = setTimeout(refresh_upgrade, 60000);
            }
        })
    }

    function acmodel(data) {
        if (data) {
            if (ac_enable != 1) {
                d("#ac_status").text(global_close);
                d("#ac_status_icon").addClass("fa-times-circle-o").removeClass("newfont-newAC fonts-ac");
            } else {
                if (data.ac_type == "cascade") {
                    d("#ac_status").text(cascading_ac).attr('sh_lang', 'cascading_ac');
                    d("#ac_status_icon").addClass("newfont-newAC").removeClass("fonts-ac fa-times-circle-o");
                } else if (data.ac_type == "lan_ac") {
                    d("#ac_status").text(branch_ac).attr('sh_lang', 'branch_ac');
                    d("#ac_status_icon").addClass("newfont-newAC").removeClass("fonts-ac fa-times-circle-o");
                } else {
                    d("#ac_status").text(undistributed).attr('sh_lang', 'undistributed');
                    d("#ac_status_icon").addClass("fa-times-circle-o").removeClass("newfont-newAC fonts-ac");
                }
            }
        }
    }

    function refresh_iface() {
        f.getSConfig('port_status', function (data) {
            if (data && !data.errCode) {
                portlist_info = data.port_list;
                portnum = data.port_sum.port_sum;
            }
        }, false);

        f.getMConfig('ac_list_get', function (data) {
            if (data && !data.errCode) {
                online_ap = [];
                var ap_list_all = data.list_all || [];
                d.each(ap_list_all, function (n, m) {
                    if (m.offline_flag == 'online') {
                        online_ap.push(m)
                    }
                });
                d("#sum_totallink").text(online_ap.length || "0");
            }
        }, false);

        f.getMConfig('ac_enable_get', function (data) {
            //data = {"ac_enable": {"ac_enable": 1}, "errCode": 0, "errMsg": "OK", "configDone": false};
            if (data && data.errCode == 0) {
                ac_enable = data.ac_enable.ac_enable;
            }
        }, false);
        
        
        f.getSHConfig('client_config.php?method=GET&action=client_info', function(data){
            var dhcp_clients = data || [];
            var client_count = 0;
            d.each(dhcp_clients, function(dhcp_index, dhcp){
            client_count++;
            });
            d("#online_devices").text(client_count);
               
        });

        f.getMConfig('network_config', function (data) {
            if (data.errCode == 0) {
				var dhcp_num = (data.dhcp.num || "0");
				if(dhcp_num == "0")
					dhcp_num +=  " " + user_sum_num_client;
				else
					dhcp_num += " " + user_sum_num_clients;

                //d("#online_devices").text(data.dhcp.num || "0");
                //d("#online_devices").text(dhcp_num);
                acmodel(data.ac_ap_status);
                wan_list = data.wanlist;
                portarr = data.wanlist.concat(data.lanlist);
                iface_show();
                if(refresh_iface_interval != 0) {
					clearTimeout(refresh_iface_interval);
				}
                refresh_iface_interval = setTimeout(refresh_iface, 30000);
            }
        });
    }

    function loadcpumode(data) {
        if (data) {
            if (data) {
                var cputype = data.split(" ");
                var showtext;
                if (cputype[1] == "Atom(TM)") {
                    if (cputype[3] == "D525") {
                        showtext = cputype[0] + " " + cputype[1] + " @1.80GHz";
                        d("#cpuinfo").text(showtext);
                    } else {
                        d("#cpuinfo").text(data);
                    }
                } else if (cputype[1] == "Core(TM)") {
                    if (cputype[2] == "i7-3770S") {
                        showtext = cputype[0] + " " + cputype[1] + " @3.10GHz";
                        d("#cpuinfo").text(showtext);
                    } else {
                        d("#cpuinfo").text(data);
                    }
                } else if (cputype[0] == "Mediatek") {
                    if (cputype[1] == "MT7621") {
                        d("#cpuinfo").text("Mediatek 880MHz");
                    } else
                        d("#cpuinfo").text(data);
                } else {
                    d("#cpuinfo").text(data);
                }
            }
        }
    }

    function iface_show() {
        var this_html = '';
        if (device.mwan == 0) {
            d('#index_interfacebind').remove();
        }
        d.each(portlist_info, function (n, m) {
            var used_stauts = 0, used_info = {}, wan_connection = {};
            d.each(portarr, function (x, y) {
                if (y.ifname.indexOf(m.ifname) > -1) {
                    used_stauts = 1;
                    used_info = y;
                    return false;
                }
            });

            d.each(wan_connect_status, function(x, y){
                if(y.ifname.indexOf(m.ifname) > -1) {
                    wan_connection = y;
                    return false;
                }
            });

            var description = "";
            d.each(wan_full_list, function(wan_index, wan_data){
                if(wan_data[0].iface == used_info.iface)
                {
                    var proto = wan_data[0].proto;
                    var propto_model =  wan_data[0][proto];
                    description = propto_model.hostname;
                    return false;
                }
            });
            
            d.each(wan_ext_info, function(ext_index, ext_info){
				if(used_info.iface == ext_info.iface) {
					description = ext_info.hostname;
					return false;
				}
			});

            d.each(lan_list, function(lan_index, lan_info){
                if(lan_info.ifname == used_info.iface)
                {
                    description = lan_info.hostname;
                    return false;
                }

            });
            if(wan_connection.up == false)
            {
				this_html += '<tr class="text-center" style="background: #FFEEEE;" data-value="'+ wan_connection.wan_ifname +'">';
			}
			else
			{
				this_html += '<tr class="text-center" data-value="' + wan_connection.wan_ifname + '">';
			}

            if (device.mwan == '1') {
                this_html += '<td class="text-left row-click gohref"><span>' + mwan_interface + n + '</span></td>';
            }

            if (used_stauts) {
                this_html += '<td  class="text-left row-click gohref"><span>' + used_info.name.toUpperCase() + '</span></td>';
                this_html += '<td  class="text-left"><span>' + description + '</span></td>';

                if (used_info.ipaddr || used_info.wan_ipaddr) {
                    this_html += '<td  class="text-left"><span>' + (used_info.ipaddr || used_info.wan_ipaddr) + '</span></td>';
                } else {
                    this_html += '<td class="text-left"><span><i class="fa fa-minus"></i></span></td>';
                }
                //if (m.up == 0) {
                if(wan_connection.up == false){
					 this_html += '<td class="text-center"><span><i class="fa fa-times red"></i></span></td>'
                } else {
                    if(wan_connection.status == 'online'  || wan_connection.wan_ifname.indexOf('lan') > -1)
                        this_html += '<td class="text-center"><span><i class="fa fa-check green"></i></span></td>'
                    else 
                        this_html += '<td class="text-center"><span><i class="fa fa-check yellow"></i></span></td>'
                }

                //connection
                if(wan_connection.speed == "")
                    this_html += '<td class="text-left"><span>no link</span></td>'
                else
                {
                    if(wan_connection.speed >= 1000)
                        this_html += '<td class="text-left"><span>' + ( parseInt(wan_connection.speed/1000 ) ) + ' Gbps</span></td>'
                    else
                        this_html += '<td class="text-left"><span>' + ( wan_connection.speed ) + ' Mbps</span></td>'
                }

                //connection
                if(wan_connection.up == false)
                {
                    this_html += '<td class="text-left"><span>no connection</span></td>'
                }
                else
                {
                    if(wan_connection.status == 'online' || wan_connection.wan_ifname.indexOf('lan') > -1)
                    {
                        this_html += '<td class="text-left"><span>OK</span></td>'
                    }
                    else
                    {
                        this_html += '<td class="text-left"><span class="yellow">Connectivity problems</span></td>'
                    }
                }
                
                var bEnabled = 0;
                if(wan_connection.up == false) {
					bEnabled = 0;
				}
				else {
					bEnabled = 1;
				}
				if(wan_connection.wan_ifname.indexOf('lan') > -1)
				{
					this_html += '<td></td>';
				}
				else
				{
					this_html += '<td class="text-left select_iface"><select id="sel_' + used_info.iface + '" data-value="' +used_info.iface  + '" et="change:changeEnable"><option value="0" ' +(bEnabled==0?"selected":"")+ '>Disable</option><option value="1" ' + (bEnabled==1?"selected": "") + '>Enable</option></select></td>';
				}
				
                
            } else {
                this_html += '<td class="text-left"><span><i class="fa fa-minus"></i></span></td>';
                this_html += '<td class="text-left"><span><i class="fa fa-minus"></i></span></td>';
                this_html += '<td class="text-left"><span><i class="fa fa-minus"></i></span></td>';
                this_html += '<td class="text-left"><span><i class="fa fa-minus"></i></span></td>';
            }
            this_html += '</tr>';
        });
        d('#iface_list').html(this_html);
        d('#iface_list tr .gohref').on("click", function(){
			var wan_interface = d(this).parent('tr').attr('data-value');
			if(wan_interface.indexOf("lan") > - 1) {
				window.location.href = "/network/network_localnet.html?ifname=" + wan_interface;
			}
			else if(wan_interface.indexOf("wan") > - 1)
			{
				window.location.href = "/network/network_extranet.html?ifname=" + wan_interface;
			}
		});
	
    }
    
       et.changeEnable = function(evt) {
        var event_name = event.type;
        if(event_name == "change")
        {
			run_waitMe('ios');
			
			var enable_val = parseInt(evt.val());
			
			var interface = evt.attr('data-value');
			
			var arg = {iface: interface, enable: enable_val};
			f.setSHConfig('network_config.php?method=SET&action=enable_iface', arg, function(data){
				if (data.errCode != 0) {
					h.ErrorTip(tip_num++, data.errCode);
				} else {
					h.SetOKTip(tip_num++, set_success);
					

				}
				

			});
			
			setTimeout(function(){
				release_loading(false);
				refresh_default();
				}, 8000);

			
        }
    }

    function load_Firmware() {
        var uptime, deviceVersion, deviceName, deviceReg;
        if (firmware_info) {
            deviceReg = new RegExp("(.+)-(.+)");
            deviceName = deviceReg.exec(firmware_info.version)[1];
            deviceVersion = deviceReg.exec(firmware_info.version)[2];
            uptime = parseInt(firmware_info.uptime);
            var uptime_str = gen_uptime_str(uptime);

            if (deviceName.toUpperCase().indexOf("CF-") > -1) {
                if (cpu_model.indexOf("D525") > -1) {
                    d("#deice_model").text("CF-AC300");
                } else if (cpu_model.indexOf("1037U") > -1) {
                    d("#deice_model").text("CF-AC400");
                } else if (cpu_model.indexOf("i5") > -1) {
                    d("#deice_model").text("CF-AC500");
                } else if (cpu_model.indexOf("i7") > -1) {
                    d("#deice_model").text("CF-AC600");
                } else {
                    d("#deice_model").text(deviceName.toUpperCase());
                }
            } else {
                d("#deice_model").text(deviceName.toUpperCase());
            }

            //d("#osinfo").text("OrangeOS");
            d("#runtime").text(uptime_str);
            d("#uptime").text(firmware_info.maketime);
            //d("#deviceinfo").text(deviceName.toUpperCase());
            d("#versioninfo").text(deviceVersion.split('.', 3).join('.'));
            d('#macinfo').html(firmware_info.macaddr.toUpperCase());
        }
    }

    function gen_uptime_str(uptime) {
        var uptime_str = "0s";
        var temp = 0, temp_res = 0;
        if (uptime < 60) {
            uptime_str = uptime + "s";
        } else if (uptime < 3600) {
            temp = parseInt(uptime / 60);
            temp_res = parseInt(uptime % 60);
            uptime_str = temp.toString() + "m" + temp_res.toString() + "s";
        } else if (uptime < 24 * 3600) {
            temp = parseInt(uptime / 3600);
            temp_res = parseInt(parseInt(uptime % 3600) / 60);
            if (temp_res == '0') {
                uptime_str = temp.toString() + "h";
            } else {
                uptime_str = temp.toString() + "h" + temp_res.toString() + "m";
            }
        } else {
            temp = parseInt(uptime / (24 * 3600));
            temp_res = parseInt(parseInt(uptime % (24 * 3600)) / 3600);
            if (temp_res == '0') {
                uptime_str = temp.toString() + "d";
            } else {
                uptime_str = temp.toString() + "d" + temp_res.toString() + "h";
            }
        }
        return uptime_str;
    }

    function refresh_cpuflow_memusage() {
        f.getMConfig('system_usage', function (data) {
            if (data.errCode == 0) {
                cpuflow_info = data;
                load_CpuFlow();
                memory_info = data.memory;
                load_memory();
                if(refresh_cpuflow_memusage_interval != 0) {
					clearTimeout(refresh_cpuflow_memusage_interval);
				}
                refresh_cpuflow_memusage_interval = setTimeout(refresh_cpuflow_memusage, 1000);
            }
        })
    }

    function refresh_wan_speed(){
        f.getSHConfig('bandwidth_config.php?method=GET&action=wan_speed', function(data){
            wan_speed_list = data;
            update_wan_speed_list();
            if(refresh_wan_speed_interval != 0)
            {
				clearTimeout(refresh_wan_speed_interval);
			}
            refresh_wan_speed_interval = setTimeout(refresh_wan_speed, 1000);
        });
    }

    function refresh_uptime() {
        f.getMConfig('uptime_get', function (data) {
            if (data.errCode == 0) {
                var uptime_str = gen_uptime_str(parseInt(data.uptime.time));
                d("#runtime").text(uptime_str);
                
                if(refresh_uptime_interval != 0) {
					clearTimeout(refresh_uptime_interval);
				}
                refresh_uptime_interval = setTimeout(refresh_uptime, 60000);
            }
        })
    }

    function load_memory() {
        $('#memory').data('easyPieChart').update(Math.ceil(parseInt(memory_info.usage)));
        $('.percent', '#memory').text(Math.ceil(parseInt(memory_info.usage)));
    }

    function load_CpuFlow() {
        if (cpuflow_info) {
            var rtx_data = [];
            var rx_val, tx_val;
            rtx_data[0] = cpuflow_info.linedata.rx_history; //rx data
            rtx_data[1] = cpuflow_info.linedata.tx_history; //tx data
            get_flow(parseInt(rtx_data[0]), "down_unit", "download");
            get_flow(parseInt(rtx_data[1]), "up_unit", "upload");

            $("#cpuusage").data('easyPieChart').update(Math.ceil(parseInt(cpuflow_info.cpu_usage.cpu_used)));
            $('.percent', '#cpuusage').text(Math.ceil(parseInt(cpuflow_info.cpu_usage.cpu_used)));

            while (flow_data_store.length > 1) {
                flow_data_store = flow_data_store.slice(1);
            }
            flow_data_store.push(rtx_data);
            if (flow_data_store.length == 2) {
                rx_val = (flow_data_store[1][0] - flow_data_store[0][0]);
                tx_val = (flow_data_store[1][1] - flow_data_store[0][1]);
                if (rx_val < 0) rx_val = 0;
                if (tx_val < 0) tx_val = 0;
                data_rx = parseFloat(rx_val / 1000);
                data_tx = parseFloat(tx_val / 1000);
            }
        }
    }

    function get_flow(data, unit_id, data_id) {
        var data_t = 0;
        var unit = "#" + unit_id;
        var data_ = "#" + data_id;
        
        if (data > 1073741824) {
            d(unit).text("GB");
            data_t = data / 1073741824;
            d(data_).text(data_t.toFixed(2));
        } else if (data > 1048576) {
            d(unit).text("MB");
            data_t = data / 1048576;
            d(data_).text(data_t.toFixed(2));
        } else if (data > 1024) {
            d(unit).text("KB");
            data_t = data / 1024;
            d(data_).text(data_t.toFixed(2));
        } else {
            d(unit).text("B");
            d(data_).text(data);
        }
    }

    function update_wan_speed_list(){
        var dt = ((new Date()).getTime() - time_lapse) / 1000; //milli
        time_lapse= (new Date()).getTime();

        d.each(wan_speed_list, function(n, m){
            var wan_ifname = m.wan_ifname;
            var online_status = false;
           

            var rx_id = '#rx_rate_' + wan_ifname;
            var tx_id = '#tx_rate_' + wan_ifname;
            var heading_id = '#heading_' + wan_ifname;
            var history_idx = -1;
            var rx_rate = 0;
            var tx_rate = 0;

            d.each(wan_speed_history, function(history_index, history_info){
                if(history_info.wan_ifname == wan_ifname)
                {
                    history_idx = history_index;
                    return false;
                }
            });
            
            
            var link_speed = 0, manual_speed = 0, auto_speed = 0, speed = 0;
            var online_status = false;
            var status = 'online';
            d.each(wan_connect_status, function(con_idx, con_status){
                if(con_status.wan_ifname == wan_ifname)
                {
	            status = con_status.status;
                    online_status = con_status.up;
                    link_speed = (con_status.speed || 0) * 1000;
                    return false;
                }
            });
            
            if(status != "online")
            {
            	speed = link_speed;
            }
            else
            {
		    //check bm_enabled
		    var bm_enabled = bm_conf.bm_enabled || 0;
		    //if bm enabled, check manual, auto speed
		    if(bm_enabled == 1) {
		    	var wan_data = bm_conf.wan_data || [];
		    	d.each(wan_data, function(wan_index, wan_status){
		    		if(wan_ifname == wan_status.ifname){
		    			if(wan_status.isAutocheck == 0) {
		    				manual_speed = (wan_status.manual_speed || 0);            			
		    				speed = manual_speed;
		    			} else {
		    				auto_speed = (parseInt(m.download_limit || 0));
		    				speed = auto_speed;
		    			}
		    		}
		    	});            
		    }
            
            }
            
            

            var wan_bandwdith_speed_download = speed == 0 ? parseInt(wan_speed_history[history_idx].wan_download / 1000) : parseInt(speed / 1000);
            var wan_bandwidth_speed_upload = speed == 0 ? parseInt(wan_speed_history[history_idx].wan_upload/ 1000) : parseInt(speed / 1000);
           
            if(history_idx == -1) return;
            var wan_name = wan_speed_history[history_idx].wan_name;
            
            $(heading_id).html(wan_name  + '(' + wan_speed_history[history_idx].wan_descname + ')' +   wan_speed_panel_header + wan_bandwdith_speed_download + wan_speed_panel_header_suffix );


            //var dt = ((new Date()).getTime() - wan_speed_history[history_idx].last_time) / 1000; //milli
            //wan_speed_history[history_idx].last_time = (new Date()).getTime();

            wan_speed_history[history_idx].rx_rate = parseInt(m.rx_bytes) - wan_speed_history[history_idx].rx_bytes;
            if(wan_speed_history[history_idx].rx_bytes == 0)
            {
                wan_speed_history[history_idx].rx_rate = 0;
            }
            else
            {
                wan_speed_history[history_idx].rx_rate = wan_speed_history[history_idx].rx_rate ;
            }
    
            wan_speed_history[history_idx].rx_bytes = parseInt(m.rx_bytes);


            wan_speed_history[history_idx].tx_rate = parseInt(m.tx_bytes) - wan_speed_history[history_idx].tx_bytes;
            if(wan_speed_history[history_idx].tx_bytes == 0)
                wan_speed_history[history_idx].tx_rate = 0;
            else 
            {
                wan_speed_history[history_idx].tx_rate = wan_speed_history[history_idx].tx_rate ;
            }
            wan_speed_history[history_idx].tx_bytes = parseInt(m.tx_bytes);
            

            //validation
            wan_speed_history[history_idx].rx_rate = wan_speed_history[history_idx].rx_rate < 0 ? 0 : wan_speed_history[history_idx].rx_rate;
            wan_speed_history[history_idx].tx_rate = wan_speed_history[history_idx].tx_rate < 0 ? 0 : wan_speed_history[history_idx].tx_rate;
            rx_rate  = (wan_speed_history[history_idx].rx_rate * 8 / 1000000)   / dt;
            rx_rate_percent = rx_rate / wan_bandwdith_speed_download * 100;
            tx_rate =  (wan_speed_history[history_idx].tx_rate * 8 / 1000000)   / dt; 
            tx_rate_percent = tx_rate/ wan_bandwidth_speed_upload * 100;
        

            $(rx_id).data('easyPieChart').update(parseInt(rx_rate_percent));
            $('.percent', rx_id).text(parseInt(rx_rate));

            $(tx_id).data('easyPieChart').update(parseInt(tx_rate_percent));
            $('.percent', tx_id).text(parseInt(tx_rate));
        });
    }


    function show_wan_speed_panel(){

        d('#wan_speed_panel').html('');
        var wan_name = "";
        var wan_ifname = "wan";
        var wan_bandwidth_speed = 0;
        var rx_rate = 0;
        var tx_rate = 0;
        var text_html  = "";
        var wan_num = 0;
        time_lapse = (new Date()).getTime();
        
        var online_wan_num = 0;

        d.each(wan_speed_list, function(n, m){
            wan_ifname = m.wan_ifname;
            
            var online_status = false;
            var speed = 0;
            d.each(wan_connect_status, function(con_idx, con_status){
                if(con_status.wan_ifname == wan_ifname)
                {
                    online_status = con_status.up;
                    speed = con_status.speed;
                    return false;
                }
            });
            
            
            
            if(online_status == true) online_wan_num++;
            
            var t_num = m.wan_ifname.substr(3);
            wan_num = t_num == "" ? 1 : parseInt(t_num) + 1;
            wan_name = "WAN " + wan_num;

            wan_speed_history[n] = {};
            wan_speed_history[n].wan_ifname = wan_ifname;
            wan_speed_history[n].wan_name = wan_name;
            wan_speed_history[n].rx_rate = 0;
            wan_speed_history[n].rx_bytes = 0;
            wan_speed_history[n].tx_rate = 0;
            wan_speed_history[n].tx_bytes = 0;
            wan_speed_history[n].last_time = 0;
            wan_speed_history[n].first_run = true;
            wan_speed_history[n].wan_descname = "";
            wan_speed_history[n].wan_upload = 0;
            wan_speed_history[n].wan_download = 0;
            
            var descname = "";
            d.each(wan_ext_info, function(ext_index, ext_info) {
					if(wan_ifname == ext_info.iface){
						descname = ext_info.hostname;
						return false;
					}
			});
			

            d.each(wan_full_list, function(wan_index, wan_data){
                if(wan_data[0].iface == wan_ifname)
                {
                    var proto = wan_data[0].proto;
                    var propto_model =  wan_data[0][proto];
                    wan_data[0].upload = wan_data[0].upload == "" ? 1000 : wan_data[0].upload;
                    wan_data[0].download = wan_data[0].download == "" ? 1000 : wan_data[0].download;
                    wan_speed_history[n].wan_upload =  parseInt(wan_data[0].upload);
                    wan_speed_history[n].wan_download =  parseInt(wan_data[0].download);
                    wan_speed_history[n].wan_descname = descname; //propto_model.hostname;
                    return false;
                }
                
            });



            text_html += `<div class="main-box clearfix project-box emerald-box ${online_status==false ? "hidden": ""}">
            <div class="main-box-header  with-border clearfix">
                <h5 id="heading_${wan_ifname}">${wan_name + '(' + wan_speed_history[n].wan_descname + ')' +  wan_speed_panel_header + wan_bandwidth_speed + wan_speed_panel_header_suffix }</h5>
            </div>
            <div class="main-box-body clearfix" style="padding:0px;">
                <div class="row">
                    <div class="project-box-content col-lg-6  col-md-6 center-block" style="padding-top:10px; padding-bottom:10px;">
                                <span class="chart" id="rx_rate_${wan_ifname}" data-percent="0">
                                    <span class="percent">0</span>Mbps
                                <br/>
                                <span class="lbl" sh_lang="wan_speed_Download"></span>
                                </span>
                    </div>
                    <div class="project-box-content col-lg-6 col-md-6 center-block" style="padding-top:10px; padding-bottom:10px;">
                        <span class="chart" id="tx_rate_${wan_ifname}" data-percent="0">
                            <span class="percent">0</span>Mbps
                            <br/>
                            <span class="lbl" sh_lang="wan_speed_Upload"></span>
                        </span>
                    </div>
                </div>
            </div>
        </div>`;
        });

        d('#wan_speed_panel').html(text_html);
        d.each(wan_speed_list, function(n, m){
            wan_ifname = m.wan_ifname;
            $('#rx_rate_' + wan_ifname).easyPieChart({barColor: color_green, size:120});
            $('#tx_rate_' + wan_ifname).easyPieChart({barColor: color_purple, size:120});
        });
        
        if(online_wan_num == 0) {
        	d('.left-content-panel').css('width', '0%');
        	d('.right-content-panel').css('width', '100%');
        }
        else
        {
        	d('.left-content-panel').css('width', '33.3%');
        	d('.right-content-panel').css('width', '66.6%');
        }

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

    function setevent() {
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });
        var mchart = Highcharts.chart('flowchart', {
            chart: {
                type: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                events: {
                    load: function () {
                        // set up the updating of the chart each second
                        var series1 = this.series[0], series2 = this.series[1];
                        if(handleInterval != 0) {
							clearInterval(handleInterval);
						}
                        handleInterval = setInterval(function () {
                            var x = (new Date()).getTime(); // current time
                            series1.addPoint([x, (data_tx * 8 / 1000)], false, true);
                            series2.addPoint([x, (data_rx * 8 / 1000)], false, true);
                            activeLastPointToolip()
                        }, 1000);
                    }
                }
            },
            title: {
                text: ''
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
                title: {
                    text: ''
                },
                labels: {
                    formatter: function () {
                        //return this.value+"KB/s";
                        return this.value + "Mb/s";
                    }
                }
            },
            tooltip: {
                formatter: function () {
                    if (this.points) {
                        if (this.x < 1000) {
                            return '<b id="datatip">' + get_error + '</b>';
                        }
                        var s = '<b>' + Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '</b>';
                        var nowx = this.points[0].point.index;
                        var upname = this.points[0].series.chart.series[0].name;
                        var upy = this.points[0].series.chart.series[0].points[nowx].y.toFixed(2);
                        var downname = this.points[0].series.chart.series[1].name;
                        var downy = this.points[0].series.chart.series[1].points[nowx].y.toFixed(2);
                        s += '<br/><span style="color:' + color_array[2] + '" sh_lang ="upname">' + upname + '</span>: ' + upy + 'Mb/s';
                        s += '<br/><span style="color:' + color_array[3] + '" sh_lang ="downname">' + downname + '</span>: ' + downy + 'Mb/s';
                        return s;
                    }
                },
                shared: true,
                crosshairs: true
            },
            legend: {
                enabled: false
            },
            exporting: {
                enabled: false
            },
            rangeSelector: {
                enabled: false
            },
            scrollbar: {
                enabled: false
            },
            navigator: {
                enabled: false
            },
            series: [{
                name: flow_up,
                data: (function () {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;
                    for (i = -200; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: 0
                        });
                    }
                    return data;
                }()),
                color: color_array[2]
            }, {
                name: flow_down,
                data: (function () {
                    var data = [],
                        time = (new Date()).getTime(),
                        i;
                    for (i = -200; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: 0
                        });
                    }
                    return data;
                }()),
                color: color_array[3]
            }],
            credits: {
                enabled: false // ??????
            }
        });

        function activeLastPointToolip() {
            mchart.redraw();
        }
    };

});
