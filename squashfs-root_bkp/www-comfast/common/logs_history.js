define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var mwan_list, lanlist, wanlist;

    var randomnumber = Math.floor(Math.random() * 100000);

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('mwan_capability_config', function (data) {
            if (data && data.errCode == 0) {
                mwan_list = data;
                lanlist = data.lanlist || [];
                wanlist = data.wanlist || [];
                showmwanlist();
            }
        });
        getcpuimg();
    }

    function showmwanlist() {
        d("#interfacelist").html('');
        var this_html = '';
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

        d("#interfacelist").html(this_html);
    }

    function getcpuimg() {
        f.getMConfig('update_cpu_png', function (data) {
            if (data && data.errCode == 0) {
                d("#cpu_hour_pic").attr("src", "/rrd/cpu_hour.png?" + randomnumber);
                d("#cpu_day_pic").attr("src", "/rrd/cpu_day.png?" + randomnumber);
                d("#cpu_week_pic").attr("src", "/rrd/cpu_week.png?" + randomnumber);
            }
        },false)
        setTimeout(getdefault,1000);
    }

    function getdefault() {
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
        f.setMConfig('update_interface_png', arg, function (data) {
            if (data.errCode == 0) {
                var pic_name = "/rrd/" + lanlist[0].iface + "_hour.png?" + randomnumber;
                d("#interface_hour_pic").attr("src", pic_name);
                var pic_name = "/rrd/" + lanlist[0].iface + "_day.png?" + randomnumber;
                d("#interface_day_pic").attr("src", pic_name);
                var pic_name = "/rrd/" + lanlist[0].iface + "_week.png?" + randomnumber;
                d("#interface_week_pic").attr("src", pic_name);
            }

        });
    }

    et.displayinterfacepng = function () {
        var graphinterface = d("#interfacelist").val();
        var interfacename = d('#interfacelist').find("option:selected").text();
        var a = {};
        a.interface = graphinterface;
        a.display_name = interfacename;

        f.setMConfig('update_interface_png', a, function (a) {
            if (a.errCode == 0) {
                var pic_name = "/rrd/" + graphinterface + "_hour.png";
                d("#interface_hour_pic").attr("src", pic_name);
                var pic_name = "/rrd/" + graphinterface + "_day.png";
                d("#interface_day_pic").attr("src", pic_name);
                var pic_name = "/rrd/" + graphinterface + "_week.png";
                d("#interface_week_pic").attr("src", pic_name);
            }

        });
    }

    b.init = init;
});