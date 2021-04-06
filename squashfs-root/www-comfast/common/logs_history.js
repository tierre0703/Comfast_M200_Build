define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

	var color_array = [];
	var cpu_hour_data = [];
	var cpu_day_data = [];
	var cpu_week_data = [];

	var interface_hour_data = [];
	var interface_day_data = [];
	var interface_week_data = [];

    var mwan_list, lanlist, wanlist;

    var randomnumber = Math.floor(Math.random() * 100000);


	var str_timestamp = "timestamp";
	var str_cpu_usage = "cpu_usage";
	var str_cpu_user_usage = "cpu_user_usage";
	var str_cpu_nice_total = "cpu_nice_total";
	var str_cpu_system_total = "cpu_system_total";
	var str_cpu_irq_total = "cpu_irq_total";
	var str_cpu_softirq_total = "cpu_softirq_total";

	var str_rx_bytes = "rx_bytes";
	var str_tx_bytes = "tx_bytes";

	var firstRun_Interface_hour = false;
	var firstRun_Interface_week = false;
	var firstRun_Interface_day = false;
	var firstRun_Cpu_hour = false;
	var firstRun_Cpu_week = false;
	var firstRun_Cpu_day = false;

	var interface_interval_hour,
		interface_interval_week,
		interface_interval_day= 0;

	var interface_interval_timeout = 0;
	
	var wan_ext_info;
	var lan_ext_info;


    function init() {
		firstRun_Interface_hour = false;
		firstRun_Interface_week = false;
		firstRun_Interface_day = false;

		firstRun_Cpu_hour = false;
		firstRun_Cpu_week = false;
		firstRun_Cpu_day = false;

        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {

		 d.ajax({
            type: 'GET',
            dataType: 'json',
            url: '/js/color.json',
            cache: false,
            async: false,
            success: function (data) {
                color_array[0] = data.color5;
                color_array[1] = data.color6;
                color_array[2] = data.color7;
                color_array[3] = data.color8;
				color_array[4] = data.color9;
				color_array[5] = data.color10;

				color_array[6] = data.color1;
				color_array[7] = data.color2;
				color_array[8] = data.color3;
				color_array[9] = data.color4;
            }
        });
        
        f.getSHConfig('network_config.php?method=GET&action=wan_info', function(data){
			wan_ext_info = data || [];
		},false);

		f.getSHConfig('bandwidth_config.php?method=GET&action=lan_list', function(data){
            lan_ext_info = data || [];
        },false);

        f.getMConfig('mwan_capability_config', function (data) {
            if (data && data.errCode == 0) {
                mwan_list = data;
                lanlist = data.lanlist || [];
                wanlist = data.wanlist || [];
                showmwanlist();
				getdefault();
            }
        });
        getcpuimg();

    }
    
    function getInterfaceString(iface) {
			var interfaceStr = "";
			
			d.each(wan_ext_info, function(n, m){
				if(iface == m.iface){
					if(m.hostname != "")
						interfaceStr = g.ifacetoname(iface) + " " + "(" + m.hostname +")";
					else 
						interfaceStr = g.ifacetoname(iface);
					interfaceStr = interfaceStr.toUpperCase();
					return false;
				}
			});

			
			d.each(lan_ext_info, function(n, m){
				if(iface == m.ifname){
					if(m.hostname != "")
						interfaceStr = g.ifacetoname(iface) + " " + "(" + m.hostname +")";
					else 
						interfaceStr = g.ifacetoname(iface);
					interfaceStr = interfaceStr.toUpperCase();
					return false;
				}
			});
			
			return interfaceStr;
	}

    function showmwanlist() {
        d("#interfacelist").html('');
        var this_html = '';
       
        /*
        d.each(lanlist, function (n, m) {
            if (device.mlan == 0) {
                this_html += '<option value="' + m.iface + '">' + m.iface.toUpperCase() + '</option>';
                return false;
            }
            this_html += '<option value="' + m.iface + '">' + g.ifacetoname(m.iface) + '</option>';
        });

        d.each(wanlist, function (n, m) {
            if (device.mlan == 0) {
                this_html += '<option value="' + m.iface + '">' + m.iface.toUpperCase() + '</option>';
                return false;
            }
            this_html += '<option value="' + m.iface + '">' + g.ifacetoname(m.iface) + '</option>';
        });
        */
		d.each(lanlist, function (n, m) {
            if (device.mlan == 0) {
                this_html += '<option value="' + m.iface + '">' + getInterfaceString(m.iface )+ '</option>';
                return false;
            }
            this_html += '<option value="' + m.iface + '">' + getInterfaceString(m.iface)+ '</option>';
        });

        d.each(wanlist, function (n, m) {
            if (device.mlan == 0) {
                this_html += '<option value="' + m.iface + '">' + getInterfaceString(m.iface) + '</option>';
                return false;
            }
            this_html += '<option value="' + m.iface + '">' + getInterfaceString(m.iface)+ '</option>';
        });
        d("#interfacelist").html(this_html);
    }

    function getcpuimg() {
        f.getMConfig('update_cpu_png', function (data) {
            if (data && data.errCode == 0) {
                //d("#cpu_hour_pic").attr("src", "/rrd/cpu_hour.png?" + randomnumber);
                //d("#cpu_day_pic").attr("src", "/rrd/cpu_day.png?" + randomnumber);
                //d("#cpu_week_pic").attr("src", "/rrd/cpu_week.png?" + randomnumber);
				drawcpuimg();
				
				setTimeout(getcpuimg, 30000);
            }
        },false);
        //setTimeout(getdefault,1000);
	}
	

	/*
	function parseInterfaceRRDData(data)
	{
		
		var json_data = {};
		json_data[str_rx_bytes] = [];
		json_data[str_tx_bytes] = [];
		var arr = data.match(/[^\r\n]+/g);
		if(arr.length < 2)
			return json_data;
		var _timestamp = 0;
		var rx_bytes = 0;
		var tx_bytes = 0;
		
		for(var i = 1; i < arr.length; i++)
		{
			arr[i] = arr[i].replace(":", "");
			var tokens = arr[i].split(/\s+/);
			var obj = {};
			//timestamp
			//obj[str_timestamp] = parseInt(tokens[0]) * 1000;
			_timestamp = parseInt(tokens[0]) * 1000;
			if(isNaN(parseFloat(tokens[1])))
				rx_bytes = 0;
			else
				rx_bytes = parseFloat(tokens[1]);
			json_data[str_rx_bytes].push({x:_timestamp, y: rx_bytes});
	
			if(isNaN(parseFloat(tokens[2])))
				tx_bytes = 0;
			else
				tx_bytes = parseFloat(tokens[2]);
			json_data[str_tx_bytes].push({x:_timestamp, y: tx_bytes});
		}
		return json_data;
	}
	*/
function parseInterfaceRRDData(data)
	{
		

		var json_data = {};
		json_data[str_rx_bytes] = [];
		json_data[str_tx_bytes] = [];

		var arr = data.match(/[^\r\n]+/g);
		if(arr.length < 2)
			return json_data;

		var _timestamp = 0;
		var rx_bytes = 0;
		var tx_bytes = 0;
		
		for(var i = 1; i < arr.length - 1; i++)
		{
			arr[i] = arr[i].replace(":", "");
			var tokens = arr[i].split(/\s+/);
			var obj = {};
			//timestamp
			//obj[str_timestamp] = parseInt(tokens[0]) * 1000;
			_timestamp = parseInt(tokens[0]) * 1000;


			if(isNaN(parseFloat(tokens[1])))
				rx_bytes = 0;
			else
				rx_bytes = g.bytesToMb(parseFloat(tokens[1]));

			if(rx_bytes < 0.01)
				rx_bytes = 0;

			json_data[str_rx_bytes].push({x:_timestamp, y: rx_bytes});
	
			if(isNaN(parseFloat(tokens[2])))
				tx_bytes = 0;
			else
				tx_bytes = g.bytesToMb(parseFloat(tokens[2]));

			if(tx_bytes < 0.01)
				tx_bytes = 0;

			json_data[str_tx_bytes].push({x:_timestamp, y: tx_bytes});
		}

		return json_data;

	}

	
	function parseCpuRRDData(data)
	{
		

		var json_data = {};
		json_data[str_cpu_usage] = [];
		json_data[str_cpu_user_usage] = [];
		json_data[str_cpu_nice_total] = [];
		json_data[str_cpu_system_total] = [];
		json_data[str_cpu_irq_total] = [];
		json_data[str_cpu_softirq_total] = [];

		var arr = data.match(/[^\r\n]+/g);
		if(arr.length < 2)
			return json_data;

		var _timestamp = 0;
		var cpu_usage = 0;
		var cpu_user_usage = 0;
		var cpu_nice_total = 0;
		var cpu_system_total = 0;
		var cpu_irq_total = 0;
		var cpu_softirq_total = 0;

		for(var i = 1; i < arr.length - 1; i++)
		{
			arr[i] = arr[i].replace(":", "");
			var tokens = arr[i].split(/\s+/);
			var obj = {};
			//timestamp
			//obj[str_timestamp] = parseInt(tokens[0]) * 1000;
			_timestamp = parseInt(tokens[0]) * 1000;


			if(isNaN(parseFloat(tokens[1])))
				cpu_usage = 0;
			else
				cpu_usage = parseFloat(tokens[1]);

			json_data[str_cpu_usage].push({x:_timestamp, y: cpu_usage});
	
			if(isNaN(parseFloat(tokens[2])))
				cpu_user_usage = 0;
			else
				cpu_user_usage = parseFloat(tokens[2]);

			json_data[str_cpu_user_usage].push({x:_timestamp, y: cpu_user_usage});


			if(isNaN(parseFloat(tokens[3])))
				cpu_nice_total = 0;
			else
				cpu_nice_total = parseFloat(tokens[3]);
			json_data[str_cpu_nice_total].push({x:_timestamp, y: cpu_nice_total});


			if(isNaN(parseFloat(tokens[4])))
			
				cpu_system_total = 0;
			else
				cpu_system_total = parseFloat(tokens[4]);

			json_data[str_cpu_system_total].push({x:_timestamp, y: cpu_system_total});


			if(isNaN(parseFloat(tokens[5])))
			
				cpu_irq_total = 0;
			else
				cpu_irq_total = parseFloat(tokens[5]);

			json_data[str_cpu_irq_total].push({x:_timestamp, y: cpu_irq_total});

			if(isNaN(parseFloat(tokens[6])))
			
				cpu_softirq_total = 0;
			else
				cpu_softirq_total = parseFloat(tokens[6]);
			json_data[str_cpu_softirq_total].push({x:_timestamp, y: cpu_softirq_total});

		}
		return json_data;
	}





	function drawcpuimg() {
		f.getRRDData("/rrd/cpu_hour.dump", function(data){
			//console.log(data);
			cpu_hour_data = parseCpuRRDData(data);
			if(!firstRun_Cpu_hour)
			{
				drawCpuHourChart();
				firstRun_Cpu_hour = true;
			}
		});

		f.getRRDData("/rrd/cpu_day.dump", function(data){
			//console.log(data);
			cpu_day_data = parseCpuRRDData(data);
			if(!firstRun_Cpu_day)
			{
				drawCpuDayChart();
				firstRun_Cpu_day = true;
			}
		});
		f.getRRDData("/rrd/cpu_week.dump", function(data){
			//console.log(data);
			cpu_week_data = parseCpuRRDData(data);
			if(!firstRun_Cpu_week)
			{
				drawCpuWeekChart();
				firstRun_Cpu_week = true;
			}
		});
	}

	function averageData(srcData, step)
	{
		var outData = [];
		if(srcData.length == 0) return outData;

		var average = 0;
		var interval = step;


		for(var i = 0; i < srcData.length; i++)
		{
			average += srcData[i].y;
			if(i % step == 0)
			{
				outData.push({x: srcData[i].x, y: average / step});
				average = 0;
			}
		}

		interval = srcData.length % step;
		outData.push({x: srcData[srcData.length - 1].x, y: average / interval});

		return outData;
	}


	function drawCpuWeekChart()
	{
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });
        var mchart = Highcharts.chart('cpuweekchart', {
            chart: {
                type: 'area',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
				events: {
					load: function () {
						var series1 = this.series[0], 
							series2 = this.series[1],
							series3 = this.series[2],
							series4 = this.series[3],
							series5 = this.series[4],
							series6 = this.series[5];
						setInterval(function () {
							var cpu_usage_data = averageData(cpu_hour_data[str_cpu_usage], 60);
							var cpu_user_usage_data = averageData(cpu_hour_data[str_cpu_user_usage], 60);
							var cpu_nice_total_data = averageData(cpu_hour_data[str_cpu_nice_total], 60);
							var cpu_system_total_data = averageData(cpu_hour_data[str_cpu_system_total], 60);
							var cpu_irq_total_data = averageData(cpu_hour_data[str_cpu_irq_total], 60);
							var cpu_softirq_total_data = averageData(cpu_hour_data[str_cpu_softirq_total], 60);
							var curtime1 = 0;
							if(series1.data.length > 0)
								curtime1 = series1.data[series1.data.length - 1].x;
							
							var curtime2 = 0;
							if(series2.data.length > 0)
								curtime2 = series2.data[series2.data.length - 1].x;

							var curtime3 = 0;
							if(series3.data.length > 0)
								curtime3 = series3.data[series3.data.length - 1].x;

							var curtime4 = 0;
							if(series4.data.length > 0)
								curtime4 = series4.data[series4.data.length - 1].x;

							var curtime5 = 0;
							if(series5.data.length > 0)
								curtime5 = series5.data[series5.data.length - 1].x;
 
							var curtime6 = 0;
							if(series6.data.length > 0)
								curtime6 = series6.data[series6.data.length - 1].x;

							for(var i = 0; i < cpu_usage_data.length; i++)
							{
								if(curtime1 >= cpu_usage_data[i].x) continue;
								series1.addPoint([cpu_usage_data[i].x, cpu_usage_data[i].y], true, true);
								
							}
							for(var i = 0; i < cpu_user_usage_data.length; i++)
							{
								if(curtime2 >= cpu_user_usage_data[i].x) continue;
								series2.addPoint([cpu_user_usage_data[i].x, cpu_user_usage_data[i].y], true, true);
							}
							for(var i = 0; i < cpu_nice_total_data.length; i++)
							{
								if(curtime3 >= cpu_nice_total_data[i].x) continue;
								series3.addPoint([cpu_nice_total_data[i].x, cpu_nice_total_data[i].y], true, true);
							}
							for(var i = 0; i < cpu_system_total_data.length; i++)
							{
								if(curtime4 >= cpu_system_total_data[i].x) continue;
								series4.addPoint([cpu_system_total_data[i].x, cpu_system_total_data[i].y], true, true);
							}

							for(var i = 0; i < cpu_irq_total_data.length; i++)
							{
								if(curtime5 >= cpu_irq_total_data[i].x) continue;
								series5.addPoint([cpu_irq_total_data[i].x, cpu_irq_total_data[i].y], true, true);
							}
							for(var i = 0; i < cpu_softirq_total_data.length; i++)
							{
								if(curtime6 >= cpu_softirq_total_data[i].x) continue;
								series6.addPoint([cpu_softirq_total_data[i].x, cpu_softirq_total_data[i].y], true, true);
							}

							activeLastPointToolip()
						}, 30000);
					}
                }
                
            },
            title: {
                text: 'CPU Utilization (Last 1 Week)'
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
                title: {
                    text: 'percentage'
                },
				min: 0,
				max: 100,
                labels: {
                    formatter: function () {
                        //return this.value+"KB/s";
                        return this.value + "%";
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
                        var totalusage = this.points[0].series.chart.series[0].points[nowx].y;
						var user = this.points[0].series.chart.series[1].points[nowx].y;
						var nice = this.points[0].series.chart.series[2].points[nowx].y;
						var system = this.points[0].series.chart.series[3].points[nowx].y;
						var irq = this.points[0].series.chart.series[4].points[nowx].y;
						var softirq = this.points[0].series.chart.series[5].points[nowx].y;

                        s += '<br/><span style="color:' + color_array[0] + '" sh_lang ="cpu_totalusage">' + cpu_totalusage + '</span>: ' + totalusage.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[1] + '" sh_lang ="cpu_user">' + cpu_user + '</span>: ' + user.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[2] + '" sh_lang ="cpu_nice">' + cpu_nice + '</span>: ' + nice.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[3] + '" sh_lang ="cpu_system">' + cpu_system + '</span>: ' + system.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[4] + '" sh_lang ="cpu_irq">' + cpu_irq + '</span>: ' + irq.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[5] + '" sh_lang ="cpu_softirq">' + cpu_softirq + '</span>: ' + softirq.toFixed(2) + '%';
                        return s;
                    }
                },
                shared: true,
                crosshairs: true
            },
            legend: {
                align: 'right'
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
            
            series: [
				{
                name: cpu_totalusage,
                data: averageData(cpu_week_data[str_cpu_usage], 60),
                color: color_array[0]
            }, 
			{
                name: cpu_user,
                data: averageData(cpu_week_data[str_cpu_user_usage], 60),
                color: color_array[1]
            },
			{
                name: cpu_nice,
                data: averageData(cpu_week_data[str_cpu_nice_total], 60),
                color: color_array[2]
            },
			{
                name: cpu_system,
                data: averageData(cpu_week_data[str_cpu_system_total],60),
                color: color_array[3]
            },
			{
                name: cpu_irq,
                data: averageData(cpu_week_data[str_cpu_irq_total],60),
                color: color_array[4]
            },
			{
                name: cpu_softirq,
                data: averageData(cpu_week_data[str_cpu_softirq_total],60),
                color: color_array[5]
            }],
            credits: {
                enabled: false // 禁用版权信息
            }
        });

        function activeLastPointToolip() {
            mchart.redraw();
        }
	}




	
	
	function drawCpuDayChart()
	{
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });
        var mchart = Highcharts.chart('cpudaychart', {
            chart: {
                type: 'area',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
				events: {
					load: function () {
						// set up the updating of the chart each second
						var series1 = this.series[0], 
							series2 = this.series[1],
							series3 = this.series[2],
							series4 = this.series[3],
							series5 = this.series[4],
							series6 = this.series[5];
						setInterval(function () {
							var cpu_usage_data = averageData(cpu_hour_data[str_cpu_usage], 15);
							var cpu_user_usage_data = averageData(cpu_hour_data[str_cpu_user_usage], 15);
							var cpu_nice_total_data = averageData(cpu_hour_data[str_cpu_nice_total], 15);
							var cpu_system_total_data = averageData(cpu_hour_data[str_cpu_system_total], 15);
							var cpu_irq_total_data = averageData(cpu_hour_data[str_cpu_irq_total], 15);
							var cpu_softirq_total_data = averageData(cpu_hour_data[str_cpu_softirq_total], 15);
							var curtime1 = 0;
							if(series1.data.length > 0)
								curtime1 = series1.data[series1.data.length - 1].x;
							
							var curtime2 = 0;
							if(series2.data.length > 0)
								curtime2 = series2.data[series2.data.length - 1].x;

							var curtime3 = 0;
							if(series3.data.length > 0)
								curtime3 = series3.data[series3.data.length - 1].x;

							var curtime4 = 0;
							if(series4.data.length > 0)
								curtime4 = series4.data[series4.data.length - 1].x;

							var curtime5 = 0;
							if(series5.data.length > 0)
								curtime5 = series5.data[series5.data.length - 1].x;
 
							var curtime6 = 0;
							if(series6.data.length > 0)
								curtime6 = series6.data[series6.data.length - 1].x;

							for(var i = 0; i < cpu_usage_data.length; i++)
							{
								if(curtime1 >= cpu_usage_data[i].x) continue;
								series1.addPoint([cpu_usage_data[i].x, cpu_usage_data[i].y], true, true);
								
							}
							for(var i = 0; i < cpu_user_usage_data.length; i++)
							{
								if(curtime2 >= cpu_user_usage_data[i].x) continue;
								series2.addPoint([cpu_user_usage_data[i].x, cpu_user_usage_data[i].y], true, true);
							}
							for(var i = 0; i < cpu_nice_total_data.length; i++)
							{
								if(curtime3 >= cpu_nice_total_data[i].x) continue;
								series3.addPoint([cpu_nice_total_data[i].x, cpu_nice_total_data[i].y], true, true);
							}
							for(var i = 0; i < cpu_system_total_data.length; i++)
							{
								if(curtime4 >= cpu_system_total_data[i].x) continue;
								series4.addPoint([cpu_system_total_data[i].x, cpu_system_total_data[i].y], true, true);
							}

							for(var i = 0; i < cpu_irq_total_data.length; i++)
							{
								if(curtime5 >= cpu_irq_total_data[i].x) continue;
								series5.addPoint([cpu_irq_total_data[i].x, cpu_irq_total_data[i].y], true, true);
							}
							for(var i = 0; i < cpu_softirq_total_data.length; i++)
							{
								if(curtime6 >= cpu_softirq_total_data[i].x) continue;
								series6.addPoint([cpu_softirq_total_data[i].x, cpu_softirq_total_data[i].y], true, true);
							}

							activeLastPointToolip()
						}, 30000);
					}
                }

                
            },
            title: {
                text: 'CPU Utilization (Last 24 Hours)'
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
                title: {
                    text: 'percentage'
                },
				min: 0,
				max: 100,
                labels: {
                    formatter: function () {
                        //return this.value+"KB/s";
                        return this.value + "%";
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
                        var totalusage = this.points[0].series.chart.series[0].points[nowx].y;
						var user = this.points[0].series.chart.series[1].points[nowx].y;
						var nice = this.points[0].series.chart.series[2].points[nowx].y;
						var system = this.points[0].series.chart.series[3].points[nowx].y;
						var irq = this.points[0].series.chart.series[4].points[nowx].y;
						var softirq = this.points[0].series.chart.series[5].points[nowx].y;

                        s += '<br/><span style="color:' + color_array[0] + '" sh_lang ="cpu_totalusage">' + cpu_totalusage + '</span>: ' + totalusage.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[1] + '" sh_lang ="cpu_user">' + cpu_user + '</span>: ' + user.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[2] + '" sh_lang ="cpu_nice">' + cpu_nice + '</span>: ' + nice.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[3] + '" sh_lang ="cpu_system">' + cpu_system + '</span>: ' + system.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[4] + '" sh_lang ="cpu_irq">' + cpu_irq + '</span>: ' + irq.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[5] + '" sh_lang ="cpu_softirq">' + cpu_softirq + '</span>: ' + softirq.toFixed(2) + '%';
                        return s;
                    }
                },
                shared: true,
                crosshairs: true
            },
            legend: {
                align: 'right'
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

		
            series: [
				{
                name: cpu_totalusage,
                data: averageData(cpu_day_data[str_cpu_usage], 15),
                color: color_array[0]
            }, 
			{
                name: cpu_user,
                data: averageData(cpu_day_data[str_cpu_user_usage], 15),
                color: color_array[1]
            },
			{
                name: cpu_nice,
                data: averageData(cpu_day_data[str_cpu_nice_total], 15),
                color: color_array[2]
            },
			{
                name: cpu_system,
                data: averageData(cpu_day_data[str_cpu_system_total],15),
                color: color_array[3]
            },
			{
                name: cpu_irq,
                data: averageData(cpu_day_data[str_cpu_irq_total],15),
                color: color_array[4]
            },
			{
                name: cpu_softirq,
                data: averageData(cpu_day_data[str_cpu_softirq_total],15),
                color: color_array[5]
            }],
            credits: {
                enabled: false // 禁用版权信息
            }
        });

        function activeLastPointToolip() {
            mchart.redraw();
        }
	}


	function drawCpuHourChart()
	{
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });
        var mchart = Highcharts.chart('cpuhourchart', {
            chart: {
                type: 'area',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
				events: {
					load: function () {
						// set up the updating of the chart each second
						var series1 = this.series[0], 
							series2 = this.series[1],
							series3 = this.series[2],
							series4 = this.series[3],
							series5 = this.series[4],
							series6 = this.series[5];
						setInterval(function () {

							var cpu_usage_data = cpu_hour_data[str_cpu_usage];
							var cpu_user_usage_data = cpu_hour_data[str_cpu_user_usage];
							var cpu_nice_total_data = cpu_hour_data[str_cpu_nice_total];
							var cpu_system_total_data = cpu_hour_data[str_cpu_system_total];
							var cpu_irq_total_data = cpu_hour_data[str_cpu_irq_total];
							var cpu_softirq_total_data = cpu_hour_data[str_cpu_softirq_total];
							var curtime1 = 0;
							if(series1.data.length > 0)
								curtime1 = series1.data[series1.data.length - 1].x;
							
							var curtime2 = 0;
							if(series2.data.length > 0)
								curtime2 = series2.data[series2.data.length - 1].x;

							var curtime3 = 0;
							if(series3.data.length > 0)
								curtime3 = series3.data[series3.data.length - 1].x;

							var curtime4 = 0;
							if(series4.data.length > 0)
								curtime4 = series4.data[series4.data.length - 1].x;

							var curtime5 = 0;
							if(series5.data.length > 0)
								curtime5 = series5.data[series5.data.length - 1].x;
 
							var curtime6 = 0;
							if(series6.data.length > 0)
								curtime6 = series6.data[series6.data.length - 1].x;

							for(var i = 0; i < cpu_usage_data.length; i++)
							{
								if(curtime1 >= cpu_usage_data[i].x) continue;
								series1.addPoint([cpu_usage_data[i].x, cpu_usage_data[i].y], true, true);
								
							}
							for(var i = 0; i < cpu_user_usage_data.length; i++)
							{
								if(curtime2 >= cpu_user_usage_data[i].x) continue;
								series2.addPoint([cpu_user_usage_data[i].x, cpu_user_usage_data[i].y], true, true);
							}
							for(var i = 0; i < cpu_nice_total_data.length; i++)
							{
								if(curtime3 >= cpu_nice_total_data[i].x) continue;
								series3.addPoint([cpu_nice_total_data[i].x, cpu_nice_total_data[i].y], true, true);
							}
							for(var i = 0; i < cpu_system_total_data.length; i++)
							{
								if(curtime4 >= cpu_system_total_data[i].x) continue;
								series4.addPoint([cpu_system_total_data[i].x, cpu_system_total_data[i].y], true, true);
							}

							for(var i = 0; i < cpu_irq_total_data.length; i++)
							{
								if(curtime5 >= cpu_irq_total_data[i].x) continue;
								series5.addPoint([cpu_irq_total_data[i].x, cpu_irq_total_data[i].y], true, true);
							}
							for(var i = 0; i < cpu_softirq_total_data.length; i++)
							{
								if(curtime6 >= cpu_softirq_total_data[i].x) continue;
								series6.addPoint([cpu_softirq_total_data[i].x, cpu_softirq_total_data[i].y], true, true);
							}


							activeLastPointToolip()
						}, 30000);
					}
                }
                
            },
            title: {
                text: 'CPU Utilization (Last 8 Hours)'
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
                title: {
                    text: 'percentage'
                },
				min: 0,
				max: 100,
                labels: {
                    formatter: function () {
                        //return this.value+"KB/s";
                        return this.value + "%";
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
                        var totalusage = this.points[0].series.chart.series[0].points[nowx].y;
						var user = this.points[0].series.chart.series[1].points[nowx].y;
						var nice = this.points[0].series.chart.series[2].points[nowx].y;
						var system = this.points[0].series.chart.series[3].points[nowx].y;
						var irq = this.points[0].series.chart.series[4].points[nowx].y;
						var softirq = this.points[0].series.chart.series[5].points[nowx].y;

                        s += '<br/><span style="color:' + color_array[0] + '" sh_lang ="cpu_totalusage">' + cpu_totalusage + '</span>: ' + totalusage.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[1] + '" sh_lang ="cpu_user">' + cpu_user + '</span>: ' + user.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[2] + '" sh_lang ="cpu_nice">' + cpu_nice + '</span>: ' + nice.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[3] + '" sh_lang ="cpu_system">' + cpu_system + '</span>: ' + system.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[4] + '" sh_lang ="cpu_irq">' + cpu_irq + '</span>: ' + irq.toFixed(2) + '%';
                        s += '<br/><span style="color:' + color_array[5] + '" sh_lang ="cpu_softirq">' + cpu_softirq + '</span>: ' + softirq.toFixed(2) + '%';
                        return s;
                    }
                },
                shared: true,
                crosshairs: true
            },
            legend: {
                align: 'right'
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

		
            series: [
				{
                name: cpu_totalusage,
                data: cpu_hour_data[str_cpu_usage],
                color: color_array[0]
            }, 
			{
                name: cpu_user,
                data: cpu_hour_data[str_cpu_user_usage],
                color: color_array[1]
            },
			{
                name: cpu_nice,
                data: cpu_hour_data[str_cpu_nice_total],
                color: color_array[2]
            },
			{
                name: cpu_system,
                data: cpu_hour_data[str_cpu_system_total],
                color: color_array[3]
            },
			{
                name: cpu_irq,
                data: cpu_hour_data[str_cpu_irq_total],
                color: color_array[4]
            },
					{
                name: cpu_softirq,
                data: cpu_hour_data[str_cpu_softirq_total],
                color: color_array[5]
            }],
            credits: {
                enabled: false // 禁用版权信息
            }
        });

        function activeLastPointToolip() {
            mchart.redraw();
        }
	}

//####################  Interface chart #############################


	
	function drawInterfaceWeekChart(interface_name)
	{
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });
        var chartWidth = d('#content-wrapper').width() * 0.6;
        var mchart = Highcharts.chart('interface_week_pic', {
            chart: {
                type: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                width: chartWidth,
				events: {
					load: function () {
						// set up the updating of the chart each second
						var series1 = this.series[0], 
							series2 = this.series[1];
								
						interface_interval_week = setInterval(function () {
						var rx_data = averageData(interface_week_data[str_rx_bytes],60);
						var tx_data = averageData(interface_week_data[str_tx_bytes],60);
						var curtime_rx = 0;
							if(series1.data.length > 0)
								curtime_rx = series1.data[series1.data.length - 1].x;
							var curtime_tx = 0;
							if(series2.data.length > 0)
								curtime_tx = series2.data[series2.data.length - 1].x;

							for(var i = 0; i < rx_data.length; i++)
							{
								if(curtime_rx >= rx_data[i].x) continue;
								series1.addPoint([rx_data[i].x, rx_data[i].y], true, true);
								
							}

							for(var i = 0; i < tx_data.length; i++)
							{
								if(curtime_tx >= tx_data[i].x) continue;
								
								series2.addPoint([tx_data[i].x, tx_data[i].y], true, true);
								
							}

							activeLastPointToolip()
						}, 30000);
					}
                }

                
            },
            title: {
                text: interface_name + ' Traffic (Last 1 Week)'
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
				min: 0,
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
                        var down = this.points[0].series.chart.series[0].points[nowx].y;
						var up = this.points[0].series.chart.series[1].points[nowx].y;

                        s += '<br/><span style="color:' + color_array[8] + '" sh_lang ="flow_up">' + flow_up + '</span>: ' + up.toFixed(2) + 'Mb/s';
                        s += '<br/><span style="color:' + color_array[7] + '" sh_lang ="flow_down">' + flow_down + '</span>: ' + down.toFixed(2) + 'Mb/s';
                        return s;
                    }
                },
                shared: true,
                crosshairs: true
            },
            legend: {
                align: 'right'
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

		
            series: [
				{
                name: flow_down,
                data: averageData(interface_week_data[str_rx_bytes],60),
                color: color_array[7]
            }, 
			{
                name: flow_up,
                data: averageData(interface_week_data[str_tx_bytes],60),
                color: color_array[8]
            }],
            credits: {
                enabled: false // 禁用版权信息
            }
        });

        function activeLastPointToolip() {
            mchart.redraw();
        }
	}

	
	
	function drawInterfaceDayChart(interface_name)
	{
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });
        var chartWidth = d('#content-wrapper').width() * 0.6;
        var mchart = Highcharts.chart('interface_day_pic', {
            chart: {
                type: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                width: chartWidth,
				events: {
					load: function () {
						// set up the updating of the chart each second
						var series1 = this.series[0], 
							series2 = this.series[1];
								
						interface_interval_day = setInterval(function () {

						var rx_data = averageData(interface_day_data[str_rx_bytes],15);
						var tx_data = averageData(interface_day_data[str_tx_bytes],15);
						var curtime_rx = 0;
							if(series1.data.length > 0)
								curtime_rx = series1.data[series1.data.length - 1].x;
							var curtime_tx = 0;
							if(series2.data.length > 0)
								curtime_tx = series2.data[series2.data.length - 1].x;

							for(var i = 0; i < rx_data.length; i++)
							{
								if(curtime_rx >= rx_data[i].x) continue;
								series1.addPoint([rx_data[i].x, rx_data[i].y], true, true);
								
							}

							for(var i = 0; i < tx_data.length; i++)
							{
								if(curtime_tx >= tx_data[i].x) continue;
								
								series2.addPoint([tx_data[i].x, tx_data[i].y], true, true);
								
							}

							activeLastPointToolip()
						}, 30000);
					}
                }

                
            },
            title: {
                text: interface_name + ' Traffic (Last 24 Hours)'
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
				min: 0,

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
                        var down = this.points[0].series.chart.series[0].points[nowx].y;
						var up = this.points[0].series.chart.series[1].points[nowx].y;

                        s += '<br/><span style="color:' + color_array[8] + '" sh_lang ="flow_up">' + flow_up + '</span>: ' + up.toFixed(2) + 'Mb/s';
                        s += '<br/><span style="color:' + color_array[7] + '" sh_lang ="flow_down">' + flow_down + '</span>: ' + down.toFixed(2) + 'Mb/s';
                        return s;
                    }
                },
                shared: true,
                crosshairs: true
            },
            legend: {
                align: 'right'
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

		
            series: [
				{
                name: flow_down,
                data: averageData(interface_day_data[str_rx_bytes],15),
                color: color_array[7]
            }, 
			{
                name: flow_up,
                data: averageData(interface_day_data[str_tx_bytes],15),
                color: color_array[8]
            }],
            credits: {
                enabled: false // 禁用版权信息
            }
        });

        function activeLastPointToolip() {
            mchart.redraw();
        }
	}


	function drawInterfaceHourChart(interface_name)
	{
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });
        var chartWidth = d('#content-wrapper').width() * 0.6;
        
        var mchart = Highcharts.chart('interface_hour_pic', {
            chart: {
                type: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                width: chartWidth,
				events: {
					load: function () {
						// set up the updating of the chart each second
						var series1 = this.series[0], 
							series2 = this.series[1];
								
						interface_interval_hour = setInterval(function () {
							
							var curtime_rx = 0;
							if(series1.data.length > 0)
								curtime_rx = series1.data[series1.data.length - 1].x;
							var curtime_tx = 0;
							if(series2.data.length > 0)
								curtime_tx = series2.data[series2.data.length - 1].x;

							for(var i = 0; i < interface_hour_data[str_rx_bytes].length; i++)
							{
								if(curtime_rx >= interface_hour_data[str_rx_bytes][i].x) continue;
								series1.addPoint([interface_hour_data[str_rx_bytes][i].x, interface_hour_data[str_rx_bytes][i].y], true, true);
								
							}

							for(var i = 0; i < interface_hour_data[str_tx_bytes].length; i++)
							{
								if(curtime_tx >= interface_hour_data[str_tx_bytes][i].x) continue;
								
								series2.addPoint([interface_hour_data[str_tx_bytes][i].x, interface_hour_data[str_tx_bytes][i].y], true, true);
								
							}
							
							//series1.data =  interface_hour_data[str_rx_bytes];
							//series2.data =  interface_hour_data[str_tx_bytes];

							activeLastPointToolip()
						}, 10000);
					}
                }
                
            },
            title: {
                text: interface_name + ' Traffic (Last 8 Hours)'
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
				min: 0,
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
                        var down = this.points[0].series.chart.series[0].points[nowx].y;
						var up = this.points[0].series.chart.series[1].points[nowx].y;

                        s += '<br/><span style="color:' + color_array[8] + '" sh_lang ="flow_up">' + flow_up + '</span>: ' + up.toFixed(2) + 'Mb/s';
                        s += '<br/><span style="color:' + color_array[7] + '" sh_lang ="flow_down">' + flow_down + '</span>: ' + down.toFixed(2) + 'Mb/s';
                        return s;
                    }
                },
                shared: true,
                crosshairs: true
            },
            legend: {
                align: 'right'
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
            
            
            series: [
				{
                name: flow_down,
                data: interface_hour_data[str_rx_bytes],
					/*
					[function(){
					var data = [];
					for(var i = 0; i <interface_hour_data[str_rx_bytes].length; i++ )
						data.push({x:interface_hour_data[str_rx_bytes][i].x, y:interface_hour_data[str_rx_bytes][i].y });
					return data;
				}()],*/
                color: color_array[7]
            }, 
			{
                name: flow_up,
                data:interface_hour_data[str_tx_bytes],
					/*
					[function(){
					var data = [];
					for(var i = 0; i <interface_hour_data[str_tx_bytes].length; i++ )
						data.push({x:interface_hour_data[str_tx_bytes][i].x, y:interface_hour_data[str_tx_bytes][i].y });
					return data;
				}()],*/
                color: color_array[8]
            }],
            credits: {
                enabled: false // 禁用版权信息
            }
        });

        function activeLastPointToolip() {
            mchart.redraw();
        }

	}


    function getdefault() {
		/*
        var arg = {};
        if (lanlist) {
            arg.interface = lanlist[0].iface;
            arg.display_name = lanlist[0].iface.toUpperCase();
        } else if (wanlist) {
            arg.interface = wanlist[0].iface;
            arg.display_name = wanlist[0].iface.toUpperCase();
        } else {
            return;
        }
		*/
		 var graphinterface = d("#interfacelist").val();
        var interfacename = d('#interfacelist').find("option:selected").text();
        var arg = {};
        arg.interface = graphinterface;
        arg.display_name = interfacename;

		if(graphinterface == "")
			return;

        f.setMConfig('update_interface_png', arg, function (data) {
            if (data.errCode == 0) {

				f.getRRDData("/rrd/" + graphinterface + "_hour.dump", function(data){
						//console.log(data);
						interface_hour_data = parseInterfaceRRDData(data);
						if(!firstRun_Interface_hour)
						{
							//drawInterfaceHourChart(graphinterface.toUpperCase());
							drawInterfaceHourChart( getInterfaceString(graphinterface) );
							firstRun_Interface_hour = true;
						}
					});


				f.getRRDData("/rrd/" + graphinterface + "_day.dump", function(data){
						//console.log(data);
						interface_day_data = parseInterfaceRRDData(data);
						if(!firstRun_Interface_day)
						{
							//drawInterfaceDayChart(graphinterface.toUpperCase());
							drawInterfaceDayChart( getInterfaceString(graphinterface) );
							firstRun_Interface_day = true;
						}
					});
				

				f.getRRDData("/rrd/" + graphinterface + "_week.dump", function(data){
						//console.log(data);
						interface_week_data = parseInterfaceRRDData(data);
						if(!firstRun_Interface_week)
						{
							//drawInterfaceWeekChart(graphinterface.toUpperCase());
							drawInterfaceWeekChart( getInterfaceString(graphinterface) );
							firstRun_Interface_week = true;
						}
					});
					
            }

        });

		interface_interval_timeout = setTimeout(getdefault, 30000);

    }

    et.displayinterfacepng = function () {
        var graphinterface = d("#interfacelist").val();
        var interfacename = d('#interfacelist').find("option:selected").text();
        var a = {};
        a.interface = graphinterface;
        a.display_name = interfacename;

		firstRun_Interface_hour = false;
		firstRun_Interface_week = false;
		firstRun_Interface_day = false;
		if(interface_interval_hour != 0)
			clearInterval(interface_interval_hour);
		if(interface_interval_day != 0)
			clearInterval(interface_interval_day);
		if(interface_interval_week != 0)
			clearInterval(interface_interval_week);

		if(interface_interval_timeout != 0)
			clearTimeout(interface_interval_timeout);
		getdefault();
		/*
        f.setMConfig('update_interface_png', a, function (a) {
            if (a.errCode == 0) {
				f.getRRDData("/rrd/" + graphinterface + "_hour.dump", function(data){
						//console.log(data);
						interface_hour_data = parseInterfaceRRDData(data);
						drawInterfaceHourChart(interfacename);
					});
					
				f.getRRDData("/rrd/" + graphinterface + "_day.dump", function(data){
						//console.log(data);
						interface_day_data = parseInterfaceRRDData(data);
						drawInterfaceDayChart(interfacename);
					});
				
				f.getRRDData("/rrd/" + graphinterface + "_week.dump", function(data){
						//console.log(data);
						interface_week_data = parseInterfaceRRDData(data);
						drawInterfaceWeekChart(interfacename);
					});
            }
        });
		*/
    }

    b.init = init;
});
