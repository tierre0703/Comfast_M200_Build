define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var lock_web = false, tip_num = 0, qos_info, wanlist_info, qosstatus;

    var bm_conf;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('mwan_qos', function (data) {
            if (data && data.errCode == 0) {
                qos_info = data.qos;
                qosstatus = qos_info.enable;
                mwanwin();
            }
        }, false);

        f.getMConfig('mwan_config', function (data) {
            if (data && data.errCode == 0) {
                wanlist_info = data.wanlist;
                mwanconfig_init();
            }
        });

        f.getSHConfig('bandwidth_config.php?method=GET&action=bm_config', function(data){
            if(data){
                bm_conf = data || {};
               
            }
        }, false);
    }

    function mwanwin() {
        g.swich('#switch_upnp', qosstatus);
        d('#qos_simple_mode').val(qos_info.mode || '1');
        d('#prior_web_ratio').val(qos_info.surf_max);
        d('#prior_video_ratio').val(qos_info.p2p_max);
        if (qos_info.mode == "4") {
            d('#custom_box').removeClass('hidden');
        } else {
            d('#custom_box').addClass('hidden');
        }
        show_qos(qosstatus);
    }

    function show_qos(status) {
        if (status == 0) {
            d('#qossetdiv').addClass('hide');
        } else {
            d('#qossetdiv').removeClass('hide');
        }
    }

    function mwanconfig_init() {
        var this_html = '';
        if (wanlist_info) {
            d.each(wanlist_info, function (n, m) {
                this_html += '<tr class="text-center">';
                this_html += '<td class="wan_iface">' + m.name.toUpperCase() + '</td>';
                this_html += '<td class="text-right" sh_lang="flow_up">' + flow_up + '</td>';
                this_html += '<td class="form_right text-left">';
                this_html += '<span class="tip_name" sh_lang="flow_up">' + flow_up + '</span><input type="text" class="form-control wan_upload require isNUM" name="_@1_99999" value="' + (m.upload / 1000 || "1000") + '">';
                this_html += '</td>';
                this_html += '<td class="text-left">Mbps</td>';
                this_html += '<td class="text-right" sh_lang="flow_down">' + flow_down + '</td>';
                this_html += '<td class="form_right text-left">';
                this_html += '<span class="tip_name" sh_lang="flow_down">' + flow_down + '</span><input type="text" class="form-control wan_download require isNUM" name="_@1_99999" value="' + (m.download / 1000 || "1000") + '">';
                this_html += '</td>';
                this_html += '<td class="text-left">Mbps</td>';
                this_html += '</tr>';
            })
        }
        d('#qoslist').html(this_html);
        h.volide('body');
    }

    et.changestatus = function (evt) {
        var swich_status = evt.attr('data-value');
        var swich_defaut = evt.attr('data-default');
        if (swich_status == 1) {
            swich_status = 0;
        } else {
            
            if(bm_conf.bm_enabled == 1)
            {
                h.ErrorTip(tip_num++, bm_already_enabled);
                return;
            }

            swich_status = 1;
        }
        g.swich(evt, swich_status, swich_defaut);

        var click_value = evt.attr('data-value');
        var arg = {};
        if (click_value == '0' && qosstatus != 0) {
            qosstatus = 0;
            arg.enable = "0";
            set_config(arg);
            return;
        }
        show_qos(swich_status);
    };

    et.change_mode = function (evt) {
        if (evt.val() == "4") {
            d('#custom_box').removeClass('hidden');
        } else {
            d('#custom_box').addClass('hidden');
        }
    };

    et.change_web_ratio = function (evt) {
        d('#prior_video_ratio').val(10 - parseInt(evt.val()))
    };

    et.change_video_ratio = function (evt) {
        d('#prior_web_ratio').val(10 - parseInt(evt.val()))
    };

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

    function set_volide() {
        var a = {}, b = [], wanlists, iface, upload, download, error_flag;
        wanlists = d('#qoslist').find('tr');

        wanlists.each(function (n, m) {
            b[n] = {};
            iface = g.nametoiface(d(m).find('.wan_iface').html()).toLowerCase();
            upload = d(m).find('.wan_upload').val();
            download = d(m).find('.wan_download').val();

            b[n].iface = iface;
            b[n].upload = '' + (upload * 1000 || '');
            b[n].download = '' + (download * 1000 || '');
        });
        a.mode = d('#qos_simple_mode').val();
        switch (a.mode) {
            case '1':
                a.surf_max = '5';
                a.p2p_max = '5';
                break;
            case '2':
                a.surf_max = '7';
                a.p2p_max = '3';
                break;
            case '3':
                a.surf_max = '3';
                a.p2p_max = '7';
                break;
            case '4':
                a.surf_max = d('#prior_web_ratio').val();
                a.p2p_max = d('#prior_video_ratio').val();
                break;
            default:
                a.surf_max = '5';
                a.p2p_max = '5'
        }

        a.mwan_list = b;
        a.enable = '1';
        return a;
    }

    function set_config(arg) {
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

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});