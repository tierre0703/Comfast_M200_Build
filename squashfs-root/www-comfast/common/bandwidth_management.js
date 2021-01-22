define(function (require, exports) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        calc = require("calculator"),
        h = require('tips'),
        et = {}, et2={}, device;

    require('bootstrap')(d);

    var lock_web = false;
    //var wanlist_info, vlan_info;
    var wanlist, pptplist, l2tplist, wan_up_status;
    var double_support, vlan_config;
    var qos_info, iplimit;
    var wanlist_info;
    var has_change = false;
    var tip_num = 0;
    var ip_rules = [];
    var speedtest_result = [];
    var timezoneOffset = 0;

    var default_max_network_speed = 100 * 1024 * 1024; //100Mbps

    var bm_conf = {
        bm_enabled: true,
        save_data:[]
    };



    var bm_info = {
        bm_enabled:true,
        bm_data: [
            {
                vlan_id : 0,
                vlan_ifname: "",
                vlan_descname: "",
                vlan_realnum : 0,
                vlan_ipaddr : "",
                vlan_port   : 0,
                vlan_netmask : "",
                wan_ifname: "",
                wan_descname: "",

                ip_limit_ip : "",
                limit_up_rate : 0,
                limit_up_rate : 0,  //we will use down rate as base limit
                allocation_rate : 0,
                ip_limit_real_num : -1
            }
        ],
        wan_data: [
            {
                iface: "",
                proto: "",
                real_num: 0,
                descname: "",
                ipaddr: "",
                macaddr: "",
                macclone: "",
                mtu: "",
                upload: 0,
                download: 0,
                netmask: "",
                phy_interface: "",
                proto: "",
                dhcp: {
                    hostname: ""
                },

                isAutocheck: 1,
                autocheck_interval: 1, // in hours
                upload_auto: 0,
                download_auto: 0
            }

        ]
    };



    exports.init = function () {
        e.plugInit(et, start_model);
    };




    function set_change_flag(b_flag, b_tip)
    {
        has_change = b_flag;
        if(b_flag)
        {
            if(b_tip)
                h.WarnTipLong(tip_num++, need_change, 2000);
            $('#apply_btn').addClass('active');
            $('#apply_msg').removeClass('hidden');
        }
        else
        {
            $('#apply_btn').removeClass('active');
            $('#apply_msg').addClass('hidden');
        }

        //blink button;
    }



    function bm_info_to_bm_conf()
    {
        bm_conf.bm_enabled = bm_info.bm_enabled;
        bm_conf.save_data = [];
        bm_conf.wan_data = [];

        var bm_id = 200;

        var index = 0;

        d.each(bm_info.bm_data, function(vlan_index, vlan_info){

            var wan_index = 0;
            if(vlan_info.wan_ifname == "" || vlan_info.wan_ifname == "wan")
            {
            }
            else
            {
                var t_id = vlan_info.wan_ifname.substr(3);
                wan_index = parseInt(t_id);
            }
            bm_conf.save_data[vlan_index] = {};
            bm_conf.save_data[vlan_index].bm_id = bm_id + wan_index; //vlan_index;
            bm_conf.save_data[vlan_index].bm_wan = vlan_info.wan_ifname == "wan" ? "wan0" : vlan_info.wan_ifname;
            bm_conf.save_data[vlan_index].bm_br_wan = vlan_info.wan_ifname;
            bm_conf.save_data[vlan_index].bm_lansubnet = vlan_info.subnet;
            bm_conf.save_data[vlan_index].ip_limit_ip = vlan_info.ip_limit_ip;

            // limit data
            //bm_conf.save_data[vlan_index].ip_limit_ip =vlan_inf.ip_limit_ip;
            bm_conf.save_data[vlan_index].limit_up_rate = vlan_info.limit_up_rate;
            bm_conf.save_data[vlan_index].limit_down_rate = vlan_info.limit_down_rate;  //we will use down rate as base limit
            bm_conf.save_data[vlan_index].allocation_rate = vlan_info.allocation_rate;
            //ip_limit_real_num : -1
        });

        //wan_data
        d.each(bm_info.wan_data, function(wan_index, wan_data){
            bm_conf.wan_data[wan_index] = {};
            bm_conf.wan_data[wan_index].ifname = wan_data.ifname;
            bm_conf.wan_data[wan_index].isAutocheck = wan_data.isAutocheck;
            var schedule_time = $('#scheduler_' + wan_data.ifname).wickedpicker('time');
            schedule_time = schedule_time.replace(":", "");
            var h = schedule_time.split(/\s+/)[0];
            h = parseInt(h);
            var m = schedule_time.split(/\s+/)[1];
            m = parseInt(m);
            var ampm = schedule_time.split(/\s+/)[2];
            if (ampm == 'PM') {
                h = parseInt(h) + 12;
            }
            bm_conf.wan_data[wan_index].schedule_time = (h * 60 + m) + timezoneOffset;
        });
    }

    //delete ip limit info
    function bm_info_to_ip_limit_delete()
    {
        d.each(bm_info.bm_data, function(index, vlan_info){
            var str_ip = vlan_info.ip_limit_ip;
            var _ip_index = -1;
            d.each(iplimit, function(ip_index, ip_info){
                if(str_ip == ip_info.ip)
                {
                    real_num = ip_info.real_num;
                    _ip_index = ip_index;
                    return false;
                }
            });

            if(_ip_index != -1)
            {
                //delete
                //list: "3," operate: "del"
                /*
                //not delete just update it
                var arg = {};
                arg.list = "" + real_num + ",";
                arg.operate = "del";
                f.setMConfig('qos_ip_limit', arg, function (data) {
                    //deletion result
                }, false);
                */ 

               var arg = {};
               
                   arg.operate = "edit";
                   arg.real_num = real_num;
                   arg.enable = "0";
                   arg.ip = str_ip;
                   arg.uprate = iplimit[_ip_index].uprate; //parseInt(parseInt(upload_limit * allocation_rate/ 100 / 1000) * 1000).toString();
                   //if(arg.uprate == "0")
                   //    arg.uprate = "1000";

                   arg.downrate = iplimit[_ip_index].downrate; //parseInt(parseInt(download_limit * allocation_rate / 100 / 1000) * 1000).toString();
                   //if(arg.downrate == "0")
                   //    arg.downrate = "1000";
                   arg.comment = iplimit[_ip_index].comment; //vlan_info.descname + "limit " + parseInt(download_limit * allocation_rate / 100 / 1000) + "Mbps";
                   //arg.comment = arg.comment.substr(0, 20);
                   arg.share = iplimit[_ip_index].share; //"0";
                   //f.setMConfig('qos_ip_limit', arg, function (data) {
                       //deletion result

                   //}, false);
               
               f.setSHConfig('qos_config.php?action=set', arg, function(data){
						},false);
            }
            else
            {
                //skip
            }
        });
    }

    function bm_info_wan_save()
    {

        return;
        

        d.each(bm_info.wan_data, function(wan_index, wan_data){
            var arg = {};// wan_data;
            arg.download = parseInt(d('#text_limit_manual_' + wan_data.ifname).val())* 1000;
            arg.download = arg.download.toString();
            arg.upload = parseInt(d('#text_limit_manual_' + wan_data.ifname).val()) * 1000;
            arg.upload = arg.upload.toString();
            arg.hostname = wan_data.descname;
            arg.macaddr = wan_data.macaddr;
            arg.macclone = wan_data.macclone;
            arg.name = wan_data.name.toUpperCase();
            arg.phy_interface = wan_data.phy_interface;
            arg.proto = wan_data.proto;
            arg.real_num = wan_data.real_num;
            arg.action="edit";
            f.setMConfig('multi_pppoe', arg, function (data) {
            }, false);
    

        }, false);
    }


    //save ip limit data
    function bm_info_to_ip_limit()
    {
        /*
        comment: "VLAN AV limit 10 Mbps"
        downrate: "10000"
        enable: "1"
        ip: "40.40.40.1-40.40.40.254"
        operate: "edit", "del"
        real_num: 1
        share: "1"
        uprate: "10000"
        */
       /*
        list: "3,"
        operate: "del"
       */

       var ip_limit_data = [];

       d.each(bm_info.bm_data, function(index, vlan_info){
            var str_ip = vlan_info.ip_limit_ip;
            var real_num = -1;
            var _ip_index = -1;
            var _wan_index =  -1;
            var wan_ifname = vlan_info.wan_ifname;
            var upload_limit = vlan_info.limit_up_rate;
            var download_limit = vlan_info.limit_down_rate;
            var allocation_rate = vlan_info.allocation_rate;
            var comments = "";

            //get ip_limit idx
            d.each(iplimit, function(ip_index, ip_info){
                if(str_ip == ip_info.ip)
                {
                    comments = ip_info.comment;
                    real_num = ip_info.real_num;
                    _ip_index = ip_index;
                    return false;
                }
            });

            //get wan idx
            d.each(bm_info.wan_data, function(wan_idx, wan_info){
                if(wan_ifname == wan_info.ifname)
                {
                    _wan_index = wan_idx;
                    if(!wan_info.isAutocheck)
                    {
                        upload_limit = wan_info.upload;
                        download_limit = wan_info.download;
                    }
                    else
                    {
                        upload_limit = (wan_info.upload_limit_auto || 0) * 110 / 100; //usually 110%
                        download_limit = (wan_info.download_limit_auto || 0) * 110 / 100;
                    }
                    return false;
                }
            });

            //add
            if(real_num == -1)
            {
                if(_wan_index != -1)
                {//add
                    var arg = {};
                    //if(allocation_rate == 0)
                    //{
                    //    allocation_rate = 0;
                    //}
                    //if(allocation_rate > 0)
                    {
                        arg.operate = "add";
                        arg.enable = "1";
                        arg.ip = str_ip;
                        arg.uprate = allocation_rate == 0 ? "10" : parseInt(parseInt(upload_limit * allocation_rate/ 100 / 1000) * 1000).toString();
                        if(arg.uprate == "0")
                        {
                            arg.uprate = "10"; //"1000";
                        }

                        arg.downrate = allocation_rate == 0 ? "10" : parseInt(parseInt(download_limit * allocation_rate / 100 / 1000) * 1000).toString();
                        if(arg.downrate == "0")
                        {
                            arg.downrate = "10"; //"1000";
                        }
                        arg.comment = comments; //vlan_info.descname + "limit " + parseInt(download_limit * allocation_rate / 100 / 1000) + "Mbps";
                        arg.comment = arg.comment.substr(0, 20);
                        arg.share = "0";
                        //f.setMConfig('qos_ip_limit', arg, function (data) {
                            //deletion result
    
                        //}, false);
                        
                        f.setSHConfig('qos_config.php?action=set', arg, function(data){
						},false);

                    }
                }
                //else { // skip }
            }
            else
            {
                if(_wan_index == -1)
                {//delete
                    var arg = {};
                    arg.list = "" + real_num + ",";
                    arg.operate = "del";
                    //f.setMConfig('qos_ip_limit', arg, function (data) {
                        //deletion result
                    //}, false);
					f.setSHConfig('qos_config.php?action=set', arg, function(data){
					},false);

                }
                else
                {//edit
                    var arg = {};
                    //if(allocation_rate == 0)
                    //{
                    //    allocation_rate = 1;
                    //}

                    //if(allocation_rate > 0)
                    {
                        arg.operate = "edit";
                        arg.real_num = real_num;
                        arg.enable = "1";
                        arg.ip = str_ip;
                        arg.uprate =  allocation_rate == 0 ? "10" : parseInt(parseInt(upload_limit * allocation_rate/ 100 / 1000) * 1000).toString();
                        if(arg.uprate == "0")
                            arg.uprate = "1000";

                        arg.downrate = allocation_rate == 0 ? "10" : parseInt(parseInt(download_limit * allocation_rate / 100 / 1000) * 1000).toString();
                        if(arg.downrate == "0")
                            arg.downrate = "1000";
                        arg.comment = comments;//vlan_info.descname + "limit " + parseInt(download_limit * allocation_rate/ 100 / 1000) + "Mbps";
                        arg.comment = arg.comment.substr(0, 20);
                        arg.share = "0";
                        //f.setMConfig('qos_ip_limit', arg, function (data) {
                            //deletion result
                        //}, false);
                        f.setSHConfig('qos_config.php?action=set', arg, function(data){
						},false);

                    }
                }
            }
       });
    }
    
    function refresh_init() {
        //refresh timezoneoffset
        var curTime = new Date();
        timezoneOffset = curTime.getTimezoneOffset();
        f.getSHConfig('bandwidth_config.php?method=GET&action=wan_status', function(data){
            wan_up_status = data;
        },false);
        //read wan data
       f.getMConfig('multi_pppoe', function (data) {
            if (data.errCode == 0) {
                wanlist = data.wanlist || [];
                
                //read vlan data
                f.getMConfig('vlan_config', function (data) {
                    if (data && data.errCode == 0) {
                        double_support = data.double_support;
                        dev_vlan_type = data.vlan_itype;
                        vlan_config = data.vlan || [];
                        f.getSHConfig('bandwidth_config.php?method=GET&action=bandwidth_speed', function(data){
                            speedtest_result = data;
                        },false);
                        //read bandwidth management configuration
                        f.getSHConfig('bandwidth_config.php?method=GET&action=bm_config', function(data){
                            bm_info.bm_enabled = parseInt(data.bm_enabled);
                            bm_conf = data;
                            show_bandwidth_management(bm_info.bm_enabled );
                            
                            //read ip limit
                            f.getMConfig('qos_ip_limit', function (data) {
                                if (data && data.errCode == 0) {
                                    iplimit = data.list || [];
                                    qos_info = data.qos;

                                    get_bandwidth_data();
                                    page_init();
                                }
                            });
                        }, false);
                 
                    }
                });
            }
        }, false);
    }

    function parse_ip_rules(data)
    {
        if(data == null)
            return;
		var arr = data.match(/[^\r\n]+/g);
		if(arr.length < 1)
            return;
            
        //32763:  from 40.40.40.0/24 lookup wan0
        //32765:  from 20.20.20.0/24 lookup wan0

        var subnet = "";
        var wan_name = "";

        for(var i = 0; i < arr.length; i++)
		{

			arr[i] = arr[i].replace(":", "");
            var tokens = arr[i].split(/\s+/);
            if(tokens.length < 2) return;
			var obj = {};
			//timestamp
            //obj[str_timestamp] = parseInt(tokens[0]) * 1000;
            subnet = tokens[2];
            for(var j = 0; j < tokens.length; j++)
            {
                if(tokens[j].toLowerCase() == "lookup")
                {
                    wan_name = tokens[j + 1];
                    break;
                }                
            }

            ip_rules[i] = {};
            ip_rules[i].subnet = subnet;
            ip_rules[i].wan_name = wan_name;

            //var calc_data = calculator.calculateCIDRPrefix(vlan_info[j].ipaddr, vlan_info[j].netmask);
            //var vlan_subnet = calc_data.ipLowStr + '/' + calc_data.prefixSize;
		}
    }


    // this function should be modified in implementation 
    //this data is for only test

    function get_bandwidth_data()
    {
        bm_info.bm_data = [];
        bm_info.wan_data = [];
        

        var wan_num = 0;
        var proto_model = {};

        var bm_wan_idx = 0;

        d.each(wanlist, function (wan_index, wan_data) {

            var up_flag = false;
            var online = "online";
            d.each(wan_up_status, function(up_index, up_status){
                if(up_status.wan_ifname == wan_data[wan_num].iface)
                {
                    up_flag = up_status.up;
                    online = up_status.status;
                }
            });

            if(up_flag == false) return;

            bm_info.wan_data[bm_wan_idx] = {};
            bm_info.wan_data[bm_wan_idx].name = wan_data[wan_num].name;
            bm_info.wan_data[bm_wan_idx].ifname = wan_data[wan_num].iface;
            bm_info.wan_data[bm_wan_idx].proto = wan_data[wan_num].proto;
            bm_info.wan_data[bm_wan_idx].connection_status = online;
            proto = wan_data[wan_num].proto;
            propto_model =  wan_data[wan_num][proto];
            
            bm_info.wan_data[bm_wan_idx].real_num =  wan_data[wan_num].real_num;
            bm_info.wan_data[bm_wan_idx].ipaddr =  wan_data[wan_num].ipaddr;
            bm_info.wan_data[bm_wan_idx].macaddr =  wan_data[wan_num].macaddr;
            bm_info.wan_data[bm_wan_idx].macclone =  wan_data[wan_num].macclone;
            bm_info.wan_data[bm_wan_idx].mtu =  wan_data[wan_num].mtu;
            bm_info.wan_data[bm_wan_idx].upload =  wan_data[wan_num].upload;
            bm_info.wan_data[bm_wan_idx].download =  wan_data[wan_num].download;
            bm_info.wan_data[bm_wan_idx].descname = propto_model.hostname;
            bm_info.wan_data[bm_wan_idx].phy_interface = wan_data[wan_num].phy_interface;
            bm_info.wan_data[bm_wan_idx].real_num = wan_data[wan_num].real_num;


            bm_info.wan_data[bm_wan_idx].isAutocheck = 0;
            bm_info.wan_data[bm_wan_idx].autocheck_interval = 1; // in hours
            bm_info.wan_data[bm_wan_idx].network_speed_value_manual_download = wan_data[wan_num].download;
            bm_info.wan_data[bm_wan_idx].network_speed_value_manual_upload = wan_data[wan_num].upload;
            bm_info.wan_data[bm_wan_idx].schedule_time = 3 * 60 + wan_index * 30; // from 3:00 AM, 30 min interval start 

            d.each(speedtest_result, function(speed_index, speed_data){
                var wan_name = speed_data.wan_name == "wan0" ? "wan" : speed_data.wan_name;

                if(wan_name == bm_info.wan_data[bm_wan_idx].ifname)
                {
                    bm_info.wan_data[bm_wan_idx].download_limit_auto = parseInt(speed_data.rx_rate / 1000) * 1000;
                    bm_info.wan_data[bm_wan_idx].upload_limit_auto = parseInt(speed_data.tx_rate / 1000) * 1000;
                    bm_info.wan_data[bm_wan_idx].test_time = parseInt(speed_data.test_time);
                    return false;
                }
            });


            if(typeof bm_conf.wan_data != "undefined")
            {
                d.each(bm_conf.wan_data, function(conf_index, conf_wan_data){
                    if(conf_wan_data.ifname == bm_info.wan_data[bm_wan_idx].ifname)
                    {
                        bm_info.wan_data[bm_wan_idx].isAutocheck = conf_wan_data.isAutocheck;

                        if(typeof conf_wan_data.schedule_time != "undefined")
                        {
                            if(conf_wan_data.schedule_time == null)
                                conf_wan_data.schedule_time = 3 * 60 + wan_index * 30;
                            bm_info.wan_data[bm_wan_idx].schedule_time = parseInt(conf_wan_data.schedule_time);
                        }

                        return false;
                    }
    
                });
    
            }

            bm_wan_idx++;

        }); 

        d.each(vlan_config, function (vlan_index, vlan_data) {
            bm_info.bm_data[vlan_index] = {};
            bm_info.bm_data[vlan_index].vlan_id = vlan_data.id; 
            bm_info.bm_data[vlan_index].vlan_iface = vlan_data.iface;
            bm_info.bm_data[vlan_index].vlan_descname = vlan_data.desc;
            bm_info.bm_data[vlan_index].vlan_ipaddr = vlan_data.ipaddr;
            bm_info.bm_data[vlan_index].vlan_port = vlan_data.port;
            bm_info.bm_data[vlan_index].vlan_netmask = vlan_data.netmask;
            var calc_data = IpSubnetCalculator.calculateCIDRPrefix(vlan_data.ipaddr, vlan_data.netmask);
            var vlan_subnet = calc_data.ipLowStr + '/' + calc_data.prefixSize;
            bm_info.bm_data[vlan_index].subnet = vlan_subnet;
            bm_info.bm_data[vlan_index].wan_ifname = "";
            bm_info.bm_data[vlan_index].wan_descname = "";

            d.each(bm_conf.save_data, function(rule_index, rule_data){
                // check for saved value
                if(rule_data.bm_lansubnet == vlan_subnet)
                {
                    bm_info.bm_data[vlan_index].wan_tablename = rule_data.bm_wan;
                    if(rule_data.bm_wan == 'wan0')
                    {
                        bm_info.bm_data[vlan_index].wan_ifname = 'wan';
                        bm_info.bm_data[vlan_index].wan_descname = '';
                    }
                    else{
                        bm_info.bm_data[vlan_index].wan_ifname = rule_data.bm_wan;
                    }

                    //wan descname
                    d.each(bm_info.wan_data, function(wan_index, wan_info){
                        if(wan_info.ifname == bm_info.bm_data[vlan_index].wan_ifname)
                        {
                            bm_info.bm_data[vlan_index].descname = wan_info.descname;
                            return false;
                        }
                    });


                    //ip limit
                    //var ip_text = calc_data.ipLowStr + '-' + calc_data.ipHighStr;
                    var ip_text = IpSubnetCalculator.toString(calc_data.ipLow + 1) + '-' + IpSubnetCalculator.toString(calc_data.ipHigh - 1); 
                    bm_info.bm_data[vlan_index].ip_limit_ip = ip_text;
                    bm_info.bm_data[vlan_index].limit_up_rate = 0; //(typeof rule_data.limit_up_rate == 'undefined') ? 0 : rule_data.limit_up_rate;
                    bm_info.bm_data[vlan_index].limit_down_rate = 0; //(typeof rule_data.limit_down_rate == 'undefined') ? 0 : rule_data.limit_down_rate;  //we will use down rate as base limit
                    bm_info.bm_data[vlan_index].allocation_rate =(typeof rule_data.allocation_rate == 'undefined') ? 0 : rule_data.allocation_rate;

                    bm_info.bm_data[vlan_index].ip_limit_real_num = -1;

                    d.each(iplimit, function(ip_index, ip_data){
                        if(ip_data.ip == ip_text)
                        {
                            //here found ip limit
                            bm_info.bm_data[vlan_index].ip_limit_real_num = ip_data.real_num;
                            bm_info.bm_data[vlan_index].limit_up_rate = ip_data.uprate;
                            bm_info.bm_data[vlan_index].limit_down_rate = ip_data.downrate;
                            return false;
                        }
                    });

                    return false;
                }
            });
        });     
    }

    function vlan_id_scopen(vlan_min, vlan_max) {
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
    };

    et.saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_volide()) {
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    //init draw VLAN PANEL
    function page_init_vlan()
    {

        var text_html = "";
        d('#bandwidth_management_page').html('');

        d.each(bm_info.bm_data, function(n, m){
            var vlan_ifname = m.vlan_iface;
            var vlan_descname = m.vlan_descname;
            var _wan_ifname = m.wan_ifname;
            var pecentage = m.allocation_rate;
            var wan_speed = 0;
            var speed_limit = (typeof m.limit_down_rate == 'undefined' )? 0 : m.limit_down_rate;
            
            d.each(bm_info.wan_data, function(wan_index, wan_info){
				
				if(wan_info.ifname == _wan_ifname) {
					if(wan_info.isAutocheck == 0) {
						wan_speed = wan_info.download;
					}
					else
					{
						wan_speed = wan_info.download_limit_auto
					}
					
					return false;
				}
            
            });
            speed_limit = wan_speed * pecentage / 100;

            text_html += ` <div class="col-sm-2_5 border padding-r-md padding-l-md">
            <div class="">
                <div class="row border-bottom mrg-b-lg mrg-t-lg text-center">
                    <span class="vlan_heading">VLAN: ${vlan_descname}</span>
                    
                </div>
                <div style="padding-top:10px">`;

                d.each(bm_info.wan_data, function(wan_index, wan_data){

                    var wan_ifname = wan_data.ifname;
                    var wan_descname = wan_data.descname;
                    if(wan_descname == "")
                        wan_descname = wan_ifname;

                    var connection_status = wan_data.connection_status == "online" ? "" : "color:red;";

                        text_html += `<div class="">
                                            <a id="btn_${vlan_ifname}_${wan_ifname}" class="${wan_ifname == _wan_ifname ? "active" : ""} bm_btn btn btn-primary btn-block mrg-b-md beforebtn mrg-h-lg" et="click tap:func_select_wan" data-value="${vlan_ifname}" data-value2="${wan_ifname}">
                                                <span style="${connection_status}">${wan_descname}</span>
                                            </a>
                                    </div>`;
                });
                

                var maxPercent = getMaxAvailableAllocation(vlan_ifname, _wan_ifname);


                text_html += `</div><div class="list with-border mrg-b-md">
                <fieldset class="groupbox-border">
                <legend class="groupbox-border" style="white-space:nowrap;">Bandwidth allocation</legend>
                    <!--<p class="h6" sh_lang="select_allocated_to">Bandwidth allocation</p>-->
                    <select class="form-control percentage_selectbox mrg-b-sm" style="margin-left:auto; margin-right:auto; width:90%; height:30px;" id="percentage_${vlan_ifname}" data-value="${vlan_ifname}" et="click change:wanAllcationChange">
                        <option value="0" sh_lang="select_percentage" disabled ${_wan_ifname == ""? "selected" : ""}>Select Percentage</option>`;

                        for(var i = 0; i <= maxPercent / 10; i++)
                        {
                            text_html += `<option value="${i * 10}" ${pecentage==i * 10? "selected" : "" }>${i*10}%</option>`;
                        }
                text_html += `</select>
                <div class="border-top-light mrg-t-md mrg-b-md" style="margin-left:auto; margin-right:auto; width:90%; height:30px;" ><span>Applied limit: <span id="speed_${vlan_ifname}">${parseInt(speed_limit/ 1000) > 0 ? parseInt(speed_limit/ 1000) : 0.1}</span>Mb/s</span></div>
                </fieldset>
                </div>
            </div>
        </div>`;



        });

        d('#bandwidth_management_page').html(text_html);


    }

    function checkTime(i) {
        return (i < 10) ? "0" + i : i;
    }

    //init draw WAN PANEL
    function page_init_wlan()
    {
        set_change_flag(false, false);

        var text_html = "";
        d('#wan_panel').html('');
        d.each(bm_info.wan_data, function(n, m){

            var wan_descname = m.descname;
            var wan_ifname = m.ifname;
            //bm_info.wan_data[wan_index].isAutocheck = false;
            //bm_info.wan_data[wan_index].autocheck_interval = 1; // in hours
            //bm_info.wan_data[wan_index].network_speed_value_manual = 100*1024*1024;
            var wan_isAutocheck = m.isAutocheck;
            var download_limit = m.download / 1000; //m.network_speed_value_manual;
            var upload_limit = m.upload / 1000;

            var download_limit_auto = (m.download_limit_auto || 0)/ 1000;
            var upload_limit_auto = (m.upload_limit_auto || 0) / 1000;
            var date = new Date((m.test_time || 0) * 1000);
            var year = checkTime(date.getFullYear());
            var month = checkTime(date.getMonth() + 1);
            var day = checkTime(date.getDate());
            var h = checkTime(date.getHours());
            var mm = checkTime(date.getMinutes());
            var s = checkTime(date.getSeconds());
            var time_limit_auto = ""+ month +  "/" + day +  "/" + year + " " + h + ":" + mm + ":" + s;
            
            if(typeof m.test_time == 'undefined' ){
            time_limit_auto = "";
            }



            // test data
            //download_limit_auto = download_limit;
            //upload_limit_auto  = upload_limit;

            

            text_html += `<div class="row" id="wan_box_${wan_ifname}">  
            <div class="col-lg-12"> 
                <div class="main-box clearfix project-box emerald-box"> 
                    <div class="main-box-header  with-border clearfix"> 
                        <span sh_lang="internet_speed_test" class="vlan_heading">${internet_speed_test} </span> 
                        <span id="wan_id_${wan_ifname}" class="vlan_heading">${wan_descname}</span> 
                    </div> 
                    <div class="main-box-body clearfix">
                        <div class="mrg-t-md mrg-b-md with-border clearfix" style="margin-right:10px; margin-left:10px;"> 
                                <a id= "btn_manual_config_${wan_ifname}" data-value='${wan_ifname}'  class="bm_btn ${wan_isAutocheck ? "" : "active "}btn btn-primary beforebtn " et="click tap:func_manual_config">  
                                    <span sh_lang="manual_config">${manual_config}</span>  
                                </a> 
                                <a id="btn_auto_config_${wan_ifname}" data-value='${wan_ifname}'  class="bm_btn ${wan_isAutocheck ? "active " : ""}btn btn-primary beforebtn pull-right" et="click tap:func_auto_test">  
                                    <span sh_lang="str_auto_test">${str_auto_test}</span>  
                                </a> 
                        </div> 
                        <div class="row light-border">
                            <div id="container_limit_manual_${wan_ifname}" class="row list main-box-body ${wan_isAutocheck ? " hide" : ""}">  
                                <div class="col-lg-6 col-sm-6 col-xs-6 text-right"> 
                                    <input type="text" value="${download_limit}" placeholder="For Manual:Input value box" class="form-control require isNULL isALL" id="text_limit_manual_${wan_ifname}" data-value='${wan_ifname}' et="click change:func_manual_config_change" /> 
                                </div>  
                                <div class="col-lg-3 col-sm-3 col-xs-3 form_left text-left">  
                                    <span sh_lang="Mbps">${Mbps}</span>  
                                </div>  
                                <div class="col-lg-3 col-sm-3 col-xs-3 form_left text-left">  
                                	<a id="save_manual_${wan_ifname}" data-value='${wan_ifname}'  class="bm_btn btn btn-primary beforebtn pull-right" et="click tap:save_wan_manual">  
                                    <span>Apply</span>  
                                </a> 
                                </div>  
                            </div>  
                            <div id="container_limit_auto_${wan_ifname}" class="row mrg-t-sm main-box-body clearfix ${wan_isAutocheck ? "" : " hide"}">  
                                <div class="row mrg-t-sm clearfix">
                                    <div class="col-lg-7 col-sm-8 form-group text-left">
                                        <label class="col-lg-7 col-sm-4 mrg-t-sm" sh_lang="auto_test_schedule">${auto_test_schedule}</label>
                                        <div class=" col-lg-5 col-sm-5">
                                            <input id="scheduler_${wan_ifname}" type="text" class="timepicker form-control" et="click change:scheduler_change" data-value="${wan_ifname}" />
                                        </div>
                                    </div>

                                    <div class="col-lg-5 col-sm-4 col-xs-4 text-right"> 
                                        <a id="btn_start_auto_test_${wan_ifname}" data-value='${wan_ifname}' class="bm_btn btn btn-primary mrg-b-sm btn-sm beforebtn" et="click tap:func_start_test">  
                                            <span sh_lang="perform_test">${perform_test}</span>  
                                        </a>  
                                    </div>  

                                </div>
                                <div class="row mrg-t-sm clearfix">
                                    <fieldset class="groupbox-border">
                                        <legend class="groupbox-border mrg-b-sm">Auto Test Result</legend>
                                        <div class="row mrg-t-md mrg-b-md mrg-l-md mrg-r-md">
                                            <div class="col-lg-6  col-sm-6 col-xs-8 text-left">
                                                <span>Bandwidth Test Result: </span><span style="font-size:1em" id="text_limit_auto_${wan_ifname}">${download_limit_auto}</span><span sh_lang="Mbps">${Mbps}</span>  
                                            </div>
                                            <div class="col-lg-6  col-sm-6 col-xs-8 text-right">  
                                                <span sh_lang="last_test_performed_at">${last_test_performed_at}</span><span style="font-size:1em" id="time_limit_auto_${wan_ifname}">${time_limit_auto}</span><br/>
                                            </div>
                                        </div>
                                    </fieldset>
                                </div>
                            </div>
                        </div>
                    </div>  
                </div>  
            </div>
        </div>`;

        });

        d('#wan_panel').html(text_html);

        d.each(bm_info.wan_data, function(n, m){
            var wan_descname = m.descname;
            var wan_ifname = m.ifname;
            var schedule_time = parseInt(m.schedule_time) - timezoneOffset;
            var time_txt = "" + (schedule_time / 60) + ":" + (schedule_time % 60);

            var option = {
                now: time_txt, //hh:mm 24 hour format only, defaults to current time 
                twentyFour: false, //Display 24 hour format, defaults to false 
                upArrow: 'wickedpicker__controls__control-up', //The up arrow class selector to use, for custom CSS 
                downArrow: 'wickedpicker__controls__control-down', //The down arrow class selector to use, for custom CSS 
                close: 'wickedpicker__close', //The close class selector to use, for custom CSS 
                hoverState: 'hover-state', //The hover state class to use, for custom CSS 
                title: 'Auto Test Schedule', //The Wickedpicker's title, 
                showSeconds: false, //Whether or not to show seconds, 
                secondsInterval: 1, //Change interval for seconds, defaults to 1 , 
                minutesInterval: 10, //Change interval for minutes, defaults to 1 
                beforeShow: null, //A function to be called before the Wickedpicker is shown 
                show: null, //A function to be called when the Wickedpicker is shown 
                clearable: false, //Make the picker's input clearable (has clickable "x")
            };

            $('#scheduler_' + wan_ifname).wickedpicker(option);
            
            $('#text_limit_manual_' +wan_ifname).on('change', function(){
            	$('#save_manual_' + wan_ifname).addClass('active');
            });
        });
    }



    function page_init()
    {

        g.swich('#switch_bandwidth', bm_info.bm_enabled);
        show_bandwidth_management(bm_info.bm_enabled);
        page_init_wlan();
        page_init_vlan();
    }

    //show/hide bandwidth manage panel
    function show_bandwidth_management(status) {
        if (status == 0) {
            d('#bandwidth_management_page_panel').addClass('hide');
            d('#bandwidth_management_page_panel').attr('data-value', status);

            d('#wan_panel').addClass('hide');
            d('#wan_panel').attr('data-value', status);
        } else {
            d('#bandwidth_management_page_panel').removeClass('hide');
            d('#bandwidth_management_page_panel').attr('data-value', status);

            d('#wan_panel').removeClass('hide');
            d('#wan_panel').attr('data-value', status);
        }
    }

    function set_config(arg) {
        return;
        f.setMConfig('mwan_qos', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000);
            }
        })
    }

    //release web lock
    function reset_lock_web() {
        lock_web = false;
    }

    //calculate available percentage
    function getMaxAvailableAllocation(vlan_ifname, wan_ifname)
    {
        if(wan_ifname == "")
            return 0;
        var available = 100;
        d.each(bm_info.bm_data, function(n, m){
            if(m.vlan_iface == vlan_ifname)
            {

            }
            else{
                if(m.wan_ifname == wan_ifname)
                {
                    available -= m.allocation_rate;
                    if(available < 0)
                        available = 0;
                    
                }
            }
        });
        return available;
    }

    function draw_allocationrate()
    {
        d.each(bm_info.bm_data, function(n, m){

            if(m.wan_ifname == "") return;

            //if(vlan_name == m.vlan_iface)
            {
                var wan_name = m.wan_ifname;
                var vlan_name = m.vlan_iface;
                var speed = 1;
                var upload_limit = 0;
                var download_limit = 0;
                var allocation_rate = parseInt(m.allocation_rate) == 0 ? 0 : parseInt(m.allocation_rate);
                d.each(bm_info.wan_data, function(wan_index, wan_info){
                    if(wan_info.ifname == wan_name)
                    {

                        if(!wan_info.isAutocheck)
                        {
                            upload_limit = wan_info.upload;
                            download_limit = wan_info.download;
                        }
                        else
                        {
                            upload_limit = (wan_info.upload_limit_auto || 0 ) * 110 / 100; //usually 110%
                            download_limit = (wan_info.download_limit_auto || 0) * 110 / 100;
                        }
                        return false;
                    }
                });

                var uprate = allocation_rate == 0? 0 : parseInt(parseInt(upload_limit * allocation_rate/ 100 / 1000));
                var downrate = allocation_rate == 0? 0.1 :  parseInt(parseInt(download_limit * allocation_rate / 100 / 1000));
  
                speed = downrate;
                
               
                d('#speed_' + vlan_name).html(speed );
            }

        });
    }

    //redraw percentage select box
    function draw_percentage(vlan_name, wan_name, pecentage)
    {
        d.each(bm_info.bm_data, function(n, m){
            if(wan_name == m.wan_ifname)
            //if(vlan_name == m.vlan_iface)
            {
                var id=`#percentage_${m.vlan_iface}`;
                $(id).html('');
                var maxPercent = getMaxAvailableAllocation(m.vlan_iface, m.wan_ifname);
                var text_html = `<option value="0" sh_lang="select_percentage" disabled ${m.wan_ifname == "" ? "selected" : ""}>Select Percentage</option>`;
        
                for(var i = 0; i <= maxPercent / 10; i++)
                {
                    text_html += `<option value="${i * 10}" ${m.allocation_rate==i * 10? "selected" : "" }>${i*10}%</option>`;
                }
                $(id).html(text_html);

                /*

                if(vlan_name == m.vlan_iface)
                {
                    var speed = 1;
                    var upload_limit = 0;
                    var download_limit = 0;
                    var allocation_rate = m.allocation_rate == 0 ? 1 : m.allocation_rate;
                    d.each(bm_info.wan_data, function(wan_index, wan_info){
                        if(wan_info.ifname == wan_name)
                        {
    
                            if(!wan_info.isAutocheck)
                            {
                                upload_limit = wan_info.upload;
                                download_limit = wan_info.download;
                            }
                            else
                            {
                                upload_limit = wan_info.upload_limit_auto * 110 / 100; //usually 110%
                                download_limit = wan_info.download_limit_auto * 110 / 100;
                            }
                            return false;
                        }
                    });
    
                    var uprate = parseInt(parseInt(upload_limit * allocation_rate/ 100 / 1000));
                    var downrate = parseInt(parseInt(download_limit * allocation_rate / 100 / 1000));
      
                    speed = downrate;
                    
                   
                    d('#speed_' + vlan_name).html(speed );
                }
                */



    
            }
        });
        
    }

    // redraw WAN internet source buttons
    function refresh_vlan_wan(vlan_ifname, wan_ifname)
    {
        var bm_data_idx = -1;
        d.each(bm_info.bm_data, function(n, m){
            if(m.vlan_iface == vlan_ifname)
            {
                bm_data_idx = n;
                return false;
            }
        });

        if(bm_data_idx == -1) return;

        var btn_name = '';


        d.each(bm_info.wan_data, function(n, m)
        {
            btn_name = '#btn_' + vlan_ifname + '_' + m.ifname;
            if(m.ifname == wan_ifname)
            {
                d(btn_name).addClass('active');
            }
            else
            {
                d(btn_name).removeClass('active');
            }
        });        
    }
    
    et.save_wan_manual = function(evt) {
    
		var ifname = d(evt).attr('data-value');
    
    	d.each(bm_info.wan_data, function(wan_index, wan_data){
    	
    		if(wan_data.ifname == ifname) {
    		
    		var str = d('#text_limit_manual_' + wan_data.ifname).val();
    		if(str == ""){
    			h.ErrorTip(tip_num++, "Invalid WAN Interface Speed Limit.");
    			return false;
    		}
    		
    		var bandwidth_speed = parseInt(str);
    		if(bandwidth_speed == 0) {
    			h.ErrorTip(tip_num++, "Invalid WAN Interface Speed Limit.");
    			return false;
    		}
    		var speed = 1000;
    		d.each(wan_up_status, function(up_index, up_status){
    			if(up_status.ifname == ifname){
    				speed = up_status.speed;  				
	    			return false;	
    			}
    		});
    		
    		if(bandwidth_speed > speed) {
    			h.ErrorTip(tip_num++, "Input value is bigger than LINK Speed.");
    			return false;
    		}
    		
    		d.each(bm_info.wan_data, function(wan_index, wan_data){
            if(ifname == wan_data.ifname)
            {
				var speed = parseInt(d('#text_limit_manual_' + wan_data.ifname).val())* 1000 ;
                bm_info.wan_data[wan_index].upload = speed;
                bm_info.wan_data[wan_index].download = speed;
                return false;
            }

        });
    		            var arg = {};// wan_data;
			    arg.download = parseInt(d('#text_limit_manual_' + wan_data.ifname).val())* 1000;
			    arg.download = arg.download.toString();
			    arg.upload = parseInt(d('#text_limit_manual_' + wan_data.ifname).val()) * 1000;
			    arg.upload = arg.upload.toString();
			    arg.hostname = wan_data.descname;
			    arg.macaddr = wan_data.macaddr;
			    arg.macclone = wan_data.macclone;
			    arg.name = wan_data.name.toUpperCase();
			    arg.phy_interface = wan_data.phy_interface;
			    arg.proto = wan_data.proto;
			    arg.real_num = wan_data.real_num;
			    arg.action="edit";
			    
			    run_waitMe('ios');
			    f.setMConfig('multi_pppoe', arg, function (data) {
			     if (data.errCode != 0) {
				h.ErrorTip(tip_num++, data.errCode);
			    } else {
				h.SetOKTip(tip_num++, set_success);
			    }}, false);
			   d(evt).removeClass('active');
			    setTimeout(function(){
					
					
					// retrive bm_conf data
					bm_info_to_bm_conf();
					//retrieve ip limit data and save
					bm_info_to_ip_limit();
					//wan data save
					bm_info_wan_save();

			 
					f.setSHConfig('bandwidth_config.php?method=SET&action=bm_save_data', bm_conf, function (data){
					   

						if (data.errCode != 0) {
							h.ErrorTip(tip_num++, data.errCode);
							lock_web = false;
						} else {
							h.SetOKTip(tip_num++, set_success);
							set_change_flag(false, false);
							//refresh_init();
							setTimeout(reset_lock_web, 3000);
						}
						setTimeout(function(){
							refresh_init();
							release_loading(false);
						}, 20000);
					});
					
					
				}, 5000);
    			return false;
    		}
        }, false);	
    
    }

    et.scheduler_change = function(evt){

        var wan_ifname = evt.attr('data-value');
        set_change_flag(true, false);

    }

    
    //Apply Button Handler
    et.func_save_bandwidth_management = function(evt){
        if (lock_web) return;
        lock_web = true;
        if(!has_change) return;

        run_waitMe('ios');

      // retrive bm_conf data
        bm_info_to_bm_conf();
        //retrieve ip limit data and save
        bm_info_to_ip_limit();

        //wan data save
        bm_info_wan_save();


 
        f.setSHConfig('bandwidth_config.php?method=SET&action=bm_save_data', bm_conf, function (data){
           

            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                set_change_flag(false, false);
                //refresh_init();
                setTimeout(reset_lock_web, 3000);
            }
            setTimeout(function(){
                refresh_init();
                release_loading(false);
            }, 20000);
        });
 
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

    et.func_manual_config_change = function(evt) {
        set_change_flag(true, false);
    }

    et.func_auto_config_change=function(evt){
        set_change_flag(true, false);
    }

    
    // Percentage Select Box Change
    et.wanAllcationChange = function(evt) {
        var event_name = event.type;
        if(event_name == "change")
        {
            var vlan_name = evt.attr('data-value');
            //update vlan's allocation rate
            d.each(bm_info.bm_data, function(index, vlan_info){
    
                if(vlan_name == vlan_info.vlan_iface)
                {
                    vlan_info.allocation_rate = evt.val();
                    //redraw percentage select box
                    set_change_flag(true, false);
                    draw_percentage(vlan_name, vlan_info.wan_ifname, vlan_info.allocation_rate);
                    draw_allocationrate();
                    return false;
                }
            });
    
        }
 

    }

    //Select WAN Internet Source
    et.func_select_wan = function(evt) {
        var vlan_name = evt.attr('data-value');
        var wan_name = evt.attr('data-value2');

        var bm_data_idx = -1; //vlan index
        d.each(bm_info.bm_data, function(n, m){
            if(m.vlan_iface == vlan_name)
            {
                bm_data_idx = n;
                return false;
            }
        });
        // return if vlan index is null
        if(bm_data_idx == -1) return;
        // if internet source is changed, set allocation rate to 0
        if(bm_info.bm_data[bm_data_idx].wan_ifname != wan_name)
        {
            //wan changed
            bm_info.bm_data[bm_data_idx].allocation_rate = 0;
        }

        d.each(bm_info.wan_data, function(wan_idx, wan_data){
            // this is self
            if(wan_data.ifname == wan_name)
            {
                { 
                    // make it active
                    evt.addClass('active');
                    bm_info.bm_data[bm_data_idx].wan_ifname = wan_name;
                    bm_info.bm_data[bm_data_idx].wan_descname = wan_data.descname;
                    //bm_info.bm_data[bm_data_idx].allocation_rate = getMaxAvailableAllocation(vlan_name, wan_name);
                }
            }
        });
        //need apply data 
        set_change_flag(true, true);

        

        refresh_vlan_wan(vlan_name, wan_name);
        draw_percentage(vlan_name, wan_name, bm_info.bm_data[bm_data_idx].allocation_rate);
        draw_allocationrate();
    }

    //btn speed test handler
    et.func_start_test = function(evt){

        var wan_name = evt.attr('data-value');
        var obj = {};
        obj.wan_name = wan_name;
        if(lock_web) return;

        //check connectivity
        var online = "offline";
        d.each(wan_up_status, function(up_index, up_info){
            if(up_info.wan_ifname == wan_name)
            {
                online = up_info.status || "offline";
                return false;
            }
        });

        if(online == "offline")
        {
            h.ErrorTip(tip_num++, "Current Port has connectivity problem!");
            return;
        }



        lock_web = true;
        run_waitMe('ios');
        f.setSHConfig('bandwidth_config.php?method=GET&action=bandwidth_speedtest', obj, function (data){
            if (data.errCode != 0) {
            } else {
            }

            var rx_rate = parseInt(parseInt(data.rx_rate || "0") / 1000);
            var last_time = parseInt(data.test_time || "0");

            var date = new Date(last_time * 1000);
            var year = checkTime(date.getFullYear());
            var month = checkTime(date.getMonth() + 1);
            var day = checkTime(date.getDate());
            var h = checkTime(date.getHours());
            var m = checkTime(date.getMinutes());
            var s = checkTime(date.getSeconds());
            var updated_time = ""+ month +  "/" + day +  "/" + year + " " + h + ":" + m + ":" + s;
            
            if(typeof data.rx_rate == 'undefined') {
            	rx_rate = "0";
            }
            if(typeof data.test_time == 'undefined') {
            	updated_time = "";
            }




            d("#text_limit_auto_" + wan_name).html(rx_rate);
            d("#time_limit_auto_" + wan_name).html(updated_time);

            lock_web = false;
            release_loading(false);
            //setTimeout(release_loading, 30000);
        });

    }


    //Manual Test Button Handler
    et.func_manual_config = function (evt) {
        var wan_name = evt.attr('data-value');
        var isActive = evt.hasClass('active');
        {
            d('#btn_manual_config_' + wan_name).addClass('active');
            d('#btn_auto_config_' + wan_name).removeClass('active');
            d('#container_limit_manual_' + wan_name).removeClass('hide');
            d('#container_limit_auto_' + wan_name).addClass('hide');
        }

        d.each(bm_info.wan_data, function(wan_index, wan_data){
            if(wan_name == wan_data.ifname)
            {
                bm_info.wan_data[wan_index].isAutocheck = 0;
                return false;
            }

        });

        set_change_flag(true, false);
        draw_allocationrate();

    }

    //Auto Test Button Handler
    et.func_auto_test = function(evt) {
        var wan_name = evt.attr('data-value');
        var isActive = evt.hasClass('active');

        d('#btn_manual_config_' + wan_name).removeClass('active');
        d('#btn_auto_config_' + wan_name).addClass('active');
        d('#container_limit_manual_' + wan_name).addClass('hide');
        d('#container_limit_auto_' + wan_name).removeClass('hide');
    
        d.each(bm_info.wan_data, function(wan_index, wan_data){
            if(wan_name == wan_data.ifname)
            {
                bm_info.wan_data[wan_index].isAutocheck =  1;
                return false;
            }

        });
        set_change_flag(true, false);
        draw_allocationrate();
    }



    //Switch button Handler
    et.handle_switch_bandwidth = function (evt) {
        var swich_status = evt.attr('data-value');
        var swich_defaut = evt.attr('data-default');
        if (swich_status == 1) {
            swich_status = 0;
            bm_info.bm_enabled = 0;

        } else {
            swich_status = 1;
            bm_info.bm_enabled = 1;


            var arg = {};
            arg.enable = "0";

            f.setMConfig('mwan_qos', arg, function (data) {
            })
        }
        g.swich(evt, swich_status, swich_defaut);
        run_waitMe('ios');
        //generate bm_conf to save data
        bm_info_to_bm_conf();


        //if switching off delete ip_limit info
        if(swich_status == 0)
            bm_info_to_ip_limit_delete();
        else
        //if switching on restore ip_limit info
            bm_info_to_ip_limit();
        

        if (lock_web) return;
        lock_web = true;

        //show loading spinner
        //


        f.setSHConfig('bandwidth_config.php?method=SET&action=bm_save_data', bm_conf, function (data){
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                set_change_flag(false, false);
                //refresh_init();
                setTimeout(reset_lock_web, 3000);
            }
            //setTimeout(release_loading, 30000);
            //release_loading(false);
            setTimeout(function(){
                refresh_init();
                release_loading(false);
            }, 20000);
        });
        
        show_bandwidth_management(swich_status);
    };
});
