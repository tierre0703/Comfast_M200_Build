define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        i = require('channels_wifi'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var config, wanconfig, wan_num = 0, lan_info, radios_info, wan_info, wifis_info, set_time;
    var rwinfo, wifi_array = {}, tip_num = 0;

    var lock_web = false, link_type = '';

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        g.chgTabs('radio_tabs', 'radio_boxs');
        h.volide('body');
        refresh_init();
    }

    et.next = function (evt) {
        ifNext(evt);
    }

    et.nextend = function (evt) {
        ifNext(evt, readSet)
    }

    et.prev = function (evt) {
        var i = 0;
        if (d('.wizard_box').length) {
            i = d(evt).parents('.wizard_box').index() + 1;
        }
        if (i > 1) {
            showPics(i - 1);
        } else {
            history.go(-1);
            location.href = document.referrer;
        }
    }

    function ifNext(obj, callback) {
        if (!g.format_volide_ok()) {
            return
        }
        var require = d(obj).parents('.wizard_box');
        var requires = d(obj).parents('.wizard_box').find('.require');
        var num = require.index() + 2;
        for (var i = 0; i < requires.length; i++) {
            var _this = requires[i];
            if (d(_this).is(":visible")) {
                d(_this).trigger('blur');
            }
        }
        var errobj = d(require).find('.borError:visible');
        if (errobj.length == 0) {
            showPics(num, callback)
        } else {
            d(errobj[0]).trigger('blur').focus();
        }
    }

    function showPics(nIndex, func) {
        var steps = d('.wizard_box');
        var totle = d('.shstep li').length;
        d('.shstep li').removeClass('active');
        d('.shstep li:last-child').removeClass('complete');
        d('.shstep li:lt(' + nIndex + ')').addClass('active');
        steps.eq(nIndex - 1).removeClass('hide').siblings('.wizard_box').addClass('hide');
        steps.find('input').removeClass('borError');
        steps.find(".onError").remove();
        if (func) func();
        if (nIndex == totle) {
            d('.shstep li:last-child').addClass('complete');
        }
    }

    function readSet() {
        var $this_html = '';
        $this_html += listhtml('tcpip_wan_ip', '#lan_ip_id');
        $this_html += listhtml('tcpip_wan_mask', '#lan_netmask_id');

        if (d('.w24G').length) {
            $this_html += listhtml('ssid_24g_name', '#ssid_id_24g');
        }
        if (d('.w58G').length) {
            $this_html += listhtml('ssid_58g_name', '#ssid_id_58g');
        }
        d('#readSet').html($this_html);
    }

    function listhtml(text, obj) {
        var this_html = '';
        this_html += '<li class="list row">';
        this_html += '<div class="col-lg-4 col-md-6 col-xs-8  col-xs-offset-2 col-lg-offset-4 col-md-offset-3">';
        this_html += '<div class="row">';
        this_html += '<div class="col-lg-5 col-md-5 col-xs-5 form_left">';
        this_html += '<span sh_lang="' + text + '">' + eval(text) + '</span>';
        this_html += '</div>';
        this_html += '<div class="col-lg-7 col-md-7 col-xs-7 form_right">';
        this_html += '<span class="form_text width_full">' + d(obj).val() + '</span>';
        this_html += '</div></div></div></li>';
        return this_html;
    }

    function refresh_init() {
        f.getMConfig('wan_config', function (data) {
            if (data.errCode == '0') {
                wanconfig = data.wanlist[wan_num];
            }
        }, false);

        f.getMConfig('guide_config', function (data) {
            if (data.errCode == '0') {
                config = d.extend(true, {}, data);
                lan_info = data.lan;
                radios_info = data.radios;
                rwinfo = d.extend(true, [], radios_info);
                wan_info = data.wan;
                wifis_info = data.wifis;
                refresh_default();
            }
        })
    }

    function showstep() {
        var delradio;
        if (rwinfo.length > 1) {
            g.step('router_wizard');
        } else {
            if (rwinfo[0].flag == '24g') {
                delradio = '58g';
            } else {
                delradio = '24g';
            }
            g.step('router_wizard', delradio);
            d('.w' + delradio.toUpperCase()).remove();
        }
    }

    function ceartrwinfo() {
        wifi_group_radio();
        d.each(rwinfo, function (n, m) {
            if (m.hwmode.indexOf('a') > -1) {
                rwinfo[n].flag = '58g';
            } else {
                rwinfo[n].flag = '24g';
            }
            d.each(wifi_array, function (x, y) {
                if (y[0].device && n == x) {
                    rwinfo[n].wifis = y;
                }
            })
        });
        showstep();
    }

    function wifi_group_radio() {
        var num;
        var i = 0;
        for (var n = 0; n < radios_info.length; n++) {
            num = wifis_info.length / radios_info.length;
            wifi_array[n] = [];
            for (; num > 0; num--) {
                wifi_array[n].push(wifis_info[i]);
                i++;
            }
        }
    }

    function refresh_default() {
        if (!lan_info || !wan_info || !wifis_info || !radios_info) {
            return;
        }
        ceartrwinfo();

        /*wanstatus start*/
        var clickprotoid = "#" + wan_info.proto + "_addr_id";

        if (wan_info.mtu != "") {
            g.setvalue('#mtu', wan_info.mtu);
        } else {
            g.setvalue('#mtu', '1492');
        }
        g.setvalue('#pppoe_user_id', wan_info.username);
        g.setvalue('#pppoe_pwd_id', wan_info.password);
        g.setvalue('#pppoe_server_id', wan_info.service);
        g.setvalue('#static_ip_id', wan_info.ipaddr);
        g.setvalue('#static_gateway_id', wan_info.gateway);
        g.setvalue('#static_netmask_id', wan_info.netmask || '255.255.255.0');
        g.setvalue('#static_dns_id', wan_info.dns);
        g.setvalue('#upload', wanconfig.upload ? wanconfig.upload / 1000 : 1000);
        g.setvalue('#download', wanconfig.download ? wanconfig.download / 1000 : 1000);
        d(clickprotoid).click();
        /*wanstatus end*/

        /*lanstatus start*/
        g.setvalue('#lan_ip_id', lan_info.ipaddr);
        g.setvalue('#lan_netmask_id', lan_info.netmask);
        /*lanstatus end*/

        if (location.host == lan_info.ipaddr) {
            link_type = 'lan';
        } else {
            link_type = 'wan';
        }

        /*wifistatus start*/
        d.each(rwinfo, function (n, m) {
            var ssid_id = '#ssid_id_' + m.flag, psk_id = '#psk_id_' + m.flag, country = '.country';

            g.setvalue(ssid_id, m.wifis[0].ssid);
            if (m.wifis[0].encryption != "none") {
                g.setvalue(psk_id, m.wifis[0].key);
            }
            i.append_channel(m.country, m.channel, m.flag, m.htmode, m.no_ht80_with_11a, 1);
            i.append_htmode(m.htmode, m.flag, m.no_ht80_with_11a);
            d(country).val(m.country || "CN");
        });
        /*wifistatus end*/
    }

    et.change_country = function (evt) {
        var country_str = d(evt).val();
        d('.country').val(country_str);

        d.each(rwinfo, function (n, m) {
            var htmode_str = d('#htmode_' + m.flag).val();
            i.append_channel(country_str, "auto", m.flag, htmode_str, m.no_ht80_with_11a, 1);
        });
    };

    et.change_bandwidth = function (evt) {
        var htmode_str = evt.val();
        var country_str = d('.country').val();

        d.each(rwinfo, function (n, m) {
            if (m.flag == '58g') {
                i.append_channel(country_str, "auto", m.flag, htmode_str, m.no_ht80_with_11a, 1);
            }
        });
    }

    et.manually = function () {
        var autoproto = wan_info.proto;
        d('.guide_loading').addClass('hide');
        d('.wizard').removeClass('hide');
        d('#' + autoproto + '_addr_id').click();
    }

    et.setmode = function () {
        config_get();
        set_config(config);
    };

    function config_get() {
        var wan_config = {}, lan_config = {};
        wifi_array = [];

        lan_config.ipaddr = d("#lan_ip_id").val();
        lan_config.netmask = d("#lan_netmask_id").val();
        lan_config.enable = true;

        wan_config.mode = "router";

        wan_config.upload = '' + d('#upload').val() * 1000;
        wan_config.download = '' + d('#download').val() * 1000;
        wan_config.proto = wan_config.proto;
        wan_config.macclone = wanconfig.macclone || '';
        wan_config.iface = wanconfig.iface;

        if (d("input[name='addr_ip']:checked").val() == "pppoe") {
            //if ($("#pppoe_addr_id").attr("checked")) {
            wan_config.proto = "pppoe";
            wan_config.username = d("#pppoe_user_id").val();
            wan_config.password = d("#pppoe_pwd_id").val();
            wan_config.service = d("#pppoe_server_id").val();
            wan_config.service = d("#pppoe_server_id").val();
            wan_config.mtu = '1500';
        } else if (d("input[name='addr_ip']:checked").val() == "static") {
            wan_config.proto = "static";
            wan_config.ipaddr = d("#static_ip_id").val();
            wan_config.gateway = d("#static_gateway_id").val();
            wan_config.netmask = d("#static_netmask_id").val();
            wan_config.dns = d("#static_dns_id").val();
        } else if (d("input[name='addr_ip']:checked").val() == "dhcp") {
            wan_config.proto = "dhcp";
        }

        d.each(rwinfo, function (n, m) {
            /*get radios_config*/
            config.radios[n].country = d('.country').val();
            config.radios[n].htmode = d('#bandwidth_' + m.flag).val();
            config.radios[n].channel = d('#channels_' + m.flag).val();

            if (m.flag == '24g') {
                config.radios[n].hwmode = "11bgn";
            }
            delete(config.radios[n].txpower_level);
            delete(config.radios[n].txpower);

            /*get wifi_config*/
            m.wifis[0].ssid = d('#ssid_id_' + m.flag).val();

            if (d('#psk_id_' + m.flag).val() == "" || d('#psk_id_' + m.flag).val() == undefined) {
                m.wifis[0].encryption = "none";
                m.wifis[0].key = '';
            } else {
                m.wifis[0].encryption = "psk2";
                m.wifis[0].key = d('#psk_id_' + m.flag).val();
            }
            d.each(m.wifis, function (x, y) {
                wifi_array.push(y);
            })
        });
        if (config.lan && config.lan.ipaddr == lan_config.ipaddr && config.lan.netmask == lan_config.netmask) {
            set_time = 0;
            delete  config.lan;
        } else {
            set_time = 15000;
            config.lan = lan_config;
        }
        config.wan = wan_config;
        config.wifis = wifi_array;
    }

    function set_config(arg) {
        if (lock_web) {
            return;
        }
        lock_web = true;
        f.setMConfig('guide_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                if (set_time == "0") {
                    h.SetOKTip(tip_num++, set_success);
                    setTimeout(gohref, 5000)
                } else {
                    g.setting((set_time / 1000), gohref);
                }
            }
        });
    }

    function gohref() {
        if (link_type == 'lan') {
            location.href = 'http://' + d('#lan_ip_id').val() + '/index.html';
        } else {
            if (d('#static_addr_id').val() != '') {
                location.href = 'http://' + d('#static_addr_id').val() + '/index.html';
            } else {
                location.href = location.href;
            }
        }
    }

    b.init = init;
});