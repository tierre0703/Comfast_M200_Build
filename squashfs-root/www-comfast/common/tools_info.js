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
    var device_hostname = "";
    var lock_web = false, tip_num = 0;

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
        


        // setTimeout(delayed_fun,50);
        delayed_fun();
    }

    

    function delayed_fun() {
        f.getSHConfig('network_config.php?method=GET&action=system_info', function(data){
				device_hostname = data.hostname || "";
		}, false);
        
        f.getMConfig('firmware_info', function (data) {
            if (data.errCode == 0) {
                cpu_model = data.cpumodel.cpumodel;
                firmware_info = data.firmware;
                load_Firmware();
                loadcpumode(cpu_model);
            }
        });
        
        //refresh_upgrade();
        
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
                setTimeout(refresh_upgrade, 60000);
            }
        })
    }


    function gen_uptime_str(uptime) {
        var uptime_str = "0s";
        var temp = 0, temp_res = 0;
        if (uptime < 60) {
            uptime_str = uptime + "s ";
        } else if (uptime < 3600) {
            temp = parseInt(uptime / 60);
            temp_res = parseInt(uptime % 60);
            uptime_str = temp.toString() + "m " + temp_res.toString() + "s ";
        } else if (uptime < 24 * 3600) {
            temp = parseInt(uptime / 3600);
            temp_res = parseInt(parseInt(uptime % 3600) / 60);
            if (temp_res == '0') {
                uptime_str = temp.toString() + "h ";
            } else {
                uptime_str = temp.toString() + "h " + temp_res.toString() + "m ";
            }
        } else {
            temp = parseInt(uptime / (24 * 3600));
            temp_res = parseInt(parseInt(uptime % (24 * 3600)) / 3600);
            if (temp_res == '0') {
                uptime_str = temp.toString() + "d ";
            } else {
                uptime_str = temp.toString() + "d " + temp_res.toString() + "h ";
            }
        }
        return uptime_str;
    }
    
    function loadcpumode(data) {
        if (data) {
            if (data) {
                var cputype = data.split(" ");
                var showtext;
                if (cputype[1] == "Atom(TM)") {
                    if (cputype[3] == "D525") {
                        showtext = cputype[0] + " " + cputype[1] + " @1.80GHz";
                        //d("#cpuinfo").text(showtext);
                        d("#cpuinfo").val(showtext);
                    } else {
                        //d("#cpuinfo").text(data);
                        d("#cpuinfo").val(data);
                    }
                } else if (cputype[1] == "Core(TM)") {
                    if (cputype[2] == "i7-3770S") {
                        showtext = cputype[0] + " " + cputype[1] + " @3.10GHz";
                        //d("#cpuinfo").text(data);
                        d("#cpuinfo").val(data);
                    } else {
                        //d("#cpuinfo").text(data);
                        d("#cpuinfo").val(data);
                    }
                } else if (cputype[0] == "Mediatek") {
                    if (cputype[1] == "MT7621") {
                        //d("#cpuinfo").text("Mediatek 880MHz");
                        d("#cpuinfo").val("Mediatek 880MHz");
                    } else
                        //d("#cpuinfo").text(data);
                        d("#cpuinfo").val(data);
                } else {
                    //d("#cpuinfo").text(data);
                    d("#cpuinfo").val(data);
                }
            }
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
            
            d('#device_hostname').val(device_hostname);

            if (deviceName.toUpperCase().indexOf("CF-") > -1) {
                if (cpu_model.indexOf("D525") > -1) {
                    d("#deice_model").val("CF-AC300");
                    //d("#deice_model").text("CF-AC300");
                } else if (cpu_model.indexOf("1037U") > -1) {
                    //d("#deice_model").text("CF-AC400");
                    d("#deice_model").val("CF-AC400");
                } else if (cpu_model.indexOf("i5") > -1) {
                    //d("#deice_model").text("CF-AC500");
                    d("#deice_model").val("CF-AC500");
                } else if (cpu_model.indexOf("i7") > -1) {
                    //d("#deice_model").text("CF-AC600");
                    d("#deice_model").val("CF-AC600");
                } else {
                    //d("#deice_model").text("SOLEUX:"+deviceName.toUpperCase());
                    d("#deice_model").val("SOLEUX:"+deviceName.toUpperCase());
                }
            } else {
                //d("#deice_model").text("SOLEUX:"+deviceName.toUpperCase());
                d("#deice_model").val("SOLEUX:"+deviceName.toUpperCase());
            }

            //d("#osinfo").text("OrangeOS");
            //d("#runtime").text(uptime_str);
            d("#runtime").val(uptime_str);
            //d("#uptime").text(firmware_info.maketime);
            d("#uptime").val(firmware_info.maketime);
            //d("#deviceinfo").text(deviceName.toUpperCase());
            //d("#versioninfo").text(deviceVersion.split('.', 3).join('.'));
            d("#versioninfo").val(deviceVersion.split('.', 3).join('.'));
            //d('#macinfo').html(firmware_info.macaddr.toUpperCase());
            d('#macinfo').val(firmware_info.macaddr.toUpperCase());
        }
    }
    
    
    et.apply_hostname = function(evt) {
		var hostname = d('#device_hostname').val();
		
		if(hostname.length == 0) {
			//show error message
			h.ErrorTip(tip_num++, "Host Name cannot be Empty!");
			return;
		}
		lock_web = true;
		var arg = {hostname:hostname};
		f.setSHConfig('network_config.php?method=SET&action=system_info', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                setTimeout(refresh_default, 1000);
                setTimeout(reset_lock_web, 3000)
            }
        })
	}
	
	function reset_lock_web() {
        lock_web = false;
    }

});
