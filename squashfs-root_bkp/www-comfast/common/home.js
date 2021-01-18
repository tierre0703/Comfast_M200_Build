define(function (require, exports) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        et = {}, device;

    require('bootstrap')(d);

    var color_array = [], cpu_model, firmware_info, ac_enable = 1, cpuflow_info, memory_info, portlist_info, portnum,
        portarr, online_ap;
    var flow_data_store = [], data_rx = 0, data_tx = 0;

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
            }
        });

        initchart();
        // setTimeout(delayed_fun,50);
        delayed_fun();
    }

    function initchart() {
        $('#cpuusage').easyPieChart({barColor: color_array[0]});
        $('#memory').easyPieChart({barColor: color_array[1]});
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
                setTimeout(refresh_upgrade, 60000);
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

        f.getMConfig('network_config', function (data) {
            if (data.errCode == 0) {
                d("#online_devices").text(data.dhcp.num || "0");
                acmodel(data.ac_ap_status);
                portarr = data.wanlist.concat(data.lanlist);
                iface_show();
                setTimeout(refresh_iface, 30000);
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
            var used_stauts = 0, used_info = {};
            d.each(portarr, function (x, y) {
                if (y.ifname.indexOf(m.ifname) > -1) {
                    used_stauts = 1;
                    used_info = y;
                    return false;
                }
            });

            this_html += '<tr class="text-center">';
            if (device.mwan == '1') {
                this_html += '<td><span>' + mwan_interface + n + '</span></td>';
            }

            if (used_stauts) {
                this_html += '<td><span>' + used_info.name.toUpperCase() + '</td>';

                if (used_info.ipaddr || used_info.wan_ipaddr) {
                    this_html += '<td><span>' + (used_info.ipaddr || used_info.wan_ipaddr) + '</span></td>';
                } else {
                    this_html += '<td><span><i class="fa fa-minus"></i></span></td>';
                }
                if (m.up == 0) {
                    this_html += '<td><span><i class="fa fa-times red"></i></span></td>'
                } else {
                    this_html += '<td><span><i class="fa fa-check green"></i></span></td>'
                }
            } else {
                this_html += '<td><span><i class="fa fa-minus"></i></span></td>';
                this_html += '<td><span><i class="fa fa-minus"></i></span></td>';
                this_html += '<td><span><i class="fa fa-minus"></i></span></td>';
            }
            this_html += '</tr>';
        });
        d('#iface_list').html(this_html);
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
                setTimeout(refresh_cpuflow_memusage, 1000);
            }
        })
    }

    function refresh_uptime() {
        f.getMConfig('uptime_get', function (data) {
            if (data.errCode == 0) {
                var uptime_str = gen_uptime_str(parseInt(data.uptime.time));
                d("#runtime").text(uptime_str);
                setTimeout(refresh_uptime, 60000);
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
                        setInterval(function () {
                            var x = (new Date()).getTime(); // current time
                            series1.addPoint([x, data_tx], false, true);
                            series2.addPoint([x, data_rx], false, true);
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
                        return this.value;
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
                        s += '<br/><span style="color:' + color_array[2] + '" sh_lang ="upname">' + upname + '</span>: ' + upy + 'KB/s';
                        s += '<br/><span style="color:' + color_array[3] + '" sh_lang ="downname">' + downname + '</span>: ' + downy + 'KB/s';
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
                enabled: false // 禁用版权信息
            }
        });

        function activeLastPointToolip() {
            mchart.redraw();
        }
    };

});