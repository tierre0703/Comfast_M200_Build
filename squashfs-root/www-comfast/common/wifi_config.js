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

    var landhcp, landhcp_html, wlorm_info, wifi_array, config, radios_info, rwinfo, wifis_info, wwan_info, rep_flag,
        wifi_langht, distance_auth_enable, distance_auth_distance, prev_change;
    var wilrmaxnum = 5;

    var lock_web = false, tip_num = 0;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('lan_dhcp_config', function (data) {
            if (data.errCode == '0') {
                landhcp = data;
                refresh_landhcp();
            }
        }, false);

        f.getMConfig('wireless_roam', function (data) {
            if (data && data.errCode == 0) {
                wlorm_info = data.roams;
                refresh_wroam();
            }
        });
        f.getMConfig('wifi_config', function (data) {
            if (data.errCode == '0') {
                config = d.extend(true, {}, data);
                //lan_info = data.lan;
                radios_info = data.radios;
                rwinfo = d.extend(true, [], radios_info);
                //wan_info = data.wan;
                wifis_info = data.wifis;
                wwan_info = data.wwan;
                if (data.distance_auth) {
                    distance_auth_enable = data.distance_auth.enable;
                    distance_auth_distance = data.distance_auth.range || 1;
                } else {
                    distance_auth_enable = '0';
                }

                if (distance_auth_enable == '1') {
                    d('.ssid_psk').addClass('hide');
                    d('.distance_auth').removeClass('hide');
                    //d('.psk_td').addClass('hide')
                    //d('.auth_td').removeClass('hide')
                } else {
                    d('.ssid_psk').removeClass('hide');
                    d('.distance_auth').addClass('hide');
                    //d('.psk_td').removeClass('hide')
                    //d('.auth_td').addClass('hide')
                }
                refresh_default();
            }
        })
    }

    function refresh_landhcp() {
        landhcp_html = '';
        d.each(landhcp.lanlist, function (n, m) {
            if (device.mwan) {
                landhcp_html += '<option value="' + m.iface + '">' + g.ifacetoname(m.iface) + '</option>';
            } else {
                landhcp_html += '<option value="' + m.iface + '">' + m.iface.toUpperCase() + '</option>';
            }
        });

        if (landhcp.vlanlist != undefined) {
            d.each(landhcp.vlanlist, function (n, m) {
                landhcp_html += '<option value="' + m.iface + '">' + m.iface.toUpperCase() + '</option>';
            })
        }
    }

    et.changestatus = function (evt) {
        if (d(evt).attr("data-value") == undefined && !d(evt).hasClass('switch_ext')) {
            evt = d(evt).parent();
        }
        var swich_status = evt.attr('data-value');
        var swich_defaut = evt.attr('data-default');
        if (swich_status == 1) {
            swich_status = 0;
        } else {
            swich_status = 1;
        }
        g.swich(evt, swich_status, swich_defaut);
    };

    et.change_country = function (evt) {
        var country_str = d(evt).val();
        d('.country_change').val(country_str);

        d.each(rwinfo, function (n, m) {
            var htmode_str = d('#htmode_' + m.flag).val();
            i.append_channel(country_str, "auto", m.flag, htmode_str, m.no_ht80_with_11a, 1);
        });
    };

    d('[id^=wifilist_]').on('change', '.change_encrypt', function () {
        var evt_change = d(this).val();
        var pass_input = d(this).parents('tr').find('input[class*="isSSIDPwd"]');
        prev_change = distance_auth_enable;
        if (evt_change == 'psk2') {
            d('.ssid_psk').removeClass('hide');
            d('.distance_auth').addClass('hide');
            d('.psk_td').removeClass('hide');
            d('.auth_td').addClass('hide');
            distance_auth_enable = '0';
            if (prev_change == '1') {
                d('[id^=wifilist_] .psk_change').attr('disabled', true).removeClass('borError');
                d('.change_encrypt').val('none');
            }
            pass_input.attr('disabled', false);
            d(this).val(evt_change);
            prev_change = 0
        } else if (evt_change == 'none') {
            d('.ssid_psk').removeClass('hide');
            d('.distance_auth').addClass('hide');
            d('.psk_td').removeClass('hide');
            d('.auth_td').addClass('hide');
            pass_input.attr('disabled', true).removeClass('borError');
            distance_auth_enable = '0';
            if (prev_change == '1') {
                d('[id^=wifilist_] .psk_change').attr('disabled', true).removeClass('borError');
                d('.change_encrypt').val('none');
            }
            d(this).val(evt_change);
            prev_change = 0
        } else {
            d('.ssid_psk').addClass('hide');
            d('.distance_auth').removeClass('hide');
            d('.psk_td').addClass('hide');
            d('.auth_td').removeClass('hide');
            pass_input.attr('disabled', true).removeClass('borError');
            d('.change_encrypt').val('auth');
            distance_auth_enable = '1';
            prev_change = 1;

        }
    });

    function refresh_wroam() {
        var t_wlorm;
        if (wlorm_info && wlorm_info.length > 0) {
            t_wlorm = wlorm_info[0];
            g.swich('#switch_wlroam', t_wlorm.disable, 0);
            d("#kickout_check_period").val(t_wlorm.check_period);
            d("#kickout_kickout_period").val(t_wlorm.kickout_period / 60);
            d("#kickout_signal_flag").val(t_wlorm.signal_flag);
        }
    }

    function refresh_default() {
        var handle_html, this_html = '';
        if (!wifis_info || !radios_info) {
            return;
        }

        var wifi_list_id, ssid_id, passwd_id, disabled_id, hidden_id, wds_id, rekey_id, isolate_id, hwmode_id,
            htmode_id, wmm_id, maxnum_id, shortgi_id, frag_id, rts_id, txpower_id, country_id, txpower, encrypt_id,
            network_id;

        var disabled_mgnt, hidessid_mgnt, ssid_mgnt, encry_mgnt, key_mgnt;

        ceartrwinfo();

        country_id = '.country_change';
        isolate_id = '#switch_isolate';
        shortgi_id = '#switch_shortgi';
        wmm_id = '#switch_wmm';
        wds_id = '#switch_wds';
        rekey_id = '#switch_rekey';
        frag_id = '#frag';
        rts_id = '#rts';
        d.each(rwinfo, function (n, m) {
            d('#wifilist_' + m.flag).empty();
            //if (wwan_info) {
            //    if (wwan_info.device == "radio0") {
            //        rep_config.wwan_num = 6;
            //        rep_config.radio_num = 0;
            //    } else if (wwan_info.device == "radio1") {
            //        rep_config.wwan_num = 14;
            //        rep_config.radio_num = 1;
            //    }
            //    rep_flag = m.wifis.length - 2;
            //    defaultwifihtml('wifilist_', m.flag, '7');
            //} else {
            rep_flag = m.wifis.length - 3;
            //}

            hwmode_id = '#hwmode_' + m.flag;
            txpower_id = '#txpower_' + m.flag;
            disabled_id = '#switch_wireless_' + m.flag;
            hidden_id = '#switch_hidessid_' + m.flag;
            htmode_id = '#htmode_' + m.flag;

            g.swich(shortgi_id, m.shortgi, 1);
            d(frag_id).val(m.frag);
            d(rts_id).val(m.rts);
            d(htmode_id).val(m.htmode);

            if (m.flag == '24g') {
                d(hwmode_id).val(m.hwmode)
            }

            txpower = m.txpower_level;
            if (txpower == 1000 || txpower == 750 || txpower == 500 || txpower == 250 || txpower == 125) {
                d(txpower_id).val(txpower);
            } else {
                d(txpower_id).val(1000);
            }

            d(country_id).val(m.country);

            i.append_channel(m.country, m.channel, m.flag, m.htmode, m.no_ht80_with_11a, 1);
            i.append_htmode(m.htmode, m.flag, m.no_ht80_with_11a);

            d.each(m.wifis, function (x, y) {
                maxnum_id = '#maxassoc_' + m.flag;
                if (x < rep_flag) {
                    if (y.device != '' && y.encryption != "null" && y.ssid != '' && y.ifname.indexOf("vif-sta0") < 0) {
                        wifi_list_id = 'wifi_' + m.flag + '_' + x;
                        ssid_id = 'ssid_' + m.flag + '_' + x;
                        passwd_id = 'passwd_' + m.flag + '_' + x;
                        encrypt_id = 'encrypt_' + m.flag + '_' + x;
                        network_id = 'network_' + m.flag + '_' + x;

                        handle_html = buildhandlehtml(x, m.flag);
                        this_html = buildlisthtml(wifi_list_id, ssid_id, passwd_id, encrypt_id, network_id, handle_html);

                        d('#wifilist_' + m.flag).append(this_html);
                        d('#' + ssid_id).val(y.ssid);
                        if (distance_auth_enable == '1') {
                            d('#' + encrypt_id).val('auth');
                        } else {
                            d('#' + encrypt_id).val(y.encryption || 'none');
                        }

                        if (y.encryption == "psk2") {
                            d('#' + passwd_id).val(y.key);
                        } else {
                            d('#' + passwd_id).attr('disabled', true).val('');
                        }

                        if (distance_auth_enable == '1') {
                            d('.auth_distance').val(distance_auth_distance)
                        }

                        d('#' + network_id).val(y.network);

                        if (x == 0) {
                            g.swich(disabled_id, y.disabled, 0);
                            g.swich(wds_id, y.wds);
                            if (y.wpa_group_rekey == '' || y.wpa_group_rekey == 1) {
                                g.swich(rekey_id, 1);
                            } else {
                                g.swich(rekey_id, 0);
                            }

                            g.swich(isolate_id, y.isolate);
                            g.swich(wmm_id, y.wmm);
                        }

                        g.swich(hidden_id, y.hidden, 1);

                        if (x == 0) {
                            d(maxnum_id).val(y.maxassoc || 256);
                        }
                    }
                } else if (x == (m.wifis.length - 1)) {
                    disabled_mgnt = '#switch_wireless_mgnt_' + m.flag;
                    hidessid_mgnt = '#switch_hidessid_mgnt_' + m.flag;
                    ssid_mgnt = '#ssid_mgnt_' + m.flag;
                    encry_mgnt = '#encry_mgnt_' + m.flag;
                    key_mgnt = '#key_mgnt_' + m.flag;

                    d(ssid_mgnt).val(y.ssid);
                    d(encry_mgnt).val(y.encryption);
                    if (y.encryption == "psk2") {
                        d(key_mgnt).val(y.key);
                    } else {
                        d(key_mgnt).attr('disabled', true)
                    }
                    g.swich(disabled_mgnt, y.disabled, 0);
                    g.swich(hidessid_mgnt, 1, 1);
                }
            });
        });
        h.volide('body');
    }

    function ceartrwinfo() {
        var has24g = 0, has58g = 0;
        wifi_group_radio();
        d.each(rwinfo, function (n, m) {
            if (m.hwmode.indexOf('a') > -1) {
                rwinfo[n].flag = '58g';
                has58g = 1;

            } else {
                rwinfo[n].flag = '24g';
                has24g = 1;
            }
            d('#setting_box_' + rwinfo[n].flag).removeClass('hide');
            d.each(wifi_array, function (x, y) {
                if (y[0].device && n == x) {
                    rwinfo[n].wifis = y;
                }
            })
        });

        if (!has24g) {
            d('#setting_box_24g').remove();
            d('#settingbox_24g').remove();
        }
        if (!has58g) {
            d('#setting_box_58g').remove();
            d('#settingbox_58g').remove();

        }
        d('#wifitab>li:first').click();
    }

    function wifi_group_radio() {
        wifi_array = [];
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

    function buildhandlehtml(i, rflag) {
        if (i == 0) {
            return '<td><a class="table-link" data-value="' + rflag + '" et="click tap:wifi_add"><span class="fa-stack"><i class="fa fa-plus-square-o fa-stack-2x"></i><i></i></span></a></td>';
        } else {
            return '<td><a class="table-link" et="click tap:wifi_del"><span class="fa-stack"><i class="fa fa-minus-square-o fa-stack-2x"></i><i></i></span></a></td>';
        }
    }

    function buildlisthtml(wifi_list_id, ssid_id, passwd_id, encrypt_id, network_id, handle_html) {
        var this_html = '';
        this_html += '<tr class="text-center" id ="' + wifi_list_id + '">';
        this_html += '<td class="form_right"><span class="tip_name hide" sh_lang="name_or_ssid">' + name_or_ssid + '</span><input class="form-control require notip isSSID" maxlength="32" type="text" id="' + ssid_id + '"></td>';
        this_html += '<td><select class="form-control change_encrypt" id="' + encrypt_id + '"><option value="psk2" selected="selected" >WPA2-PSK</option><option value="none">NONE</option><option value="auth" sh_lang="auth_distance">' + auth_distance + '</option></td>';
        if (distance_auth_enable == '1') {
            this_html += '<td class="form_right psk_td hide"><span class="tip_name hide" sh_lang="ddns_passwd">' + ddns_passwd + '</span><input  maxlength="32" type="text" class="form-control require notip isSSIDPwd psk_change" id="' + passwd_id + '"></td>';
            this_html += '<td class="auth_td"><select class="form-control auth_distance" et="change:change_auth_distance"><option value="1">1</option><option value="5">5</option><option value="10">10</option></td>';
        } else {
            this_html += '<td class="form_right psk_td"><span class="tip_name hide" sh_lang="ddns_passwd">' + ddns_passwd + '</span><input  maxlength="32" type="text" class="form-control require notip isSSIDPwd psk_change" id="' + passwd_id + '"></td>';
            this_html += '<td class="auth_td hide"><select class="form-control auth_distance" et="change:change_auth_distance"><option value="1">1</option><option value="5">5</option><option value="10">10</option></td>';
        }
        this_html += '<td><select class="form-control" id="' + network_id + '">' + landhcp_html + '</select></td>';
        this_html += handle_html;
        return this_html
    }

    et.wifi_add = function (evt) {
        d('.require').unbind('blur');
        var rflag, n, uid, obj;
        rflag = evt.attr('data-value');
        uid = 'wifilist_' + rflag;
        obj = d('#' + uid).children();

        if (!wifi_langht) {
            wifi_langht = obj.length + 1;
        }

        n = obj.length + 1;
        if (n > wilrmaxnum) {
            h.volide('body');
            return;
        }
        var $html = wifihtml(rflag, wifi_langht);
        wifi_langht++;
        d('#' + uid).append($html);
        if (distance_auth_enable) {
            d('.auth_distance').val(distance_auth_distance || 1);
        }
        h.volide('body');
    }

    function wifihtml(n, i) {
        var this_html = '';
        this_html += '<tr class="text-center" id="wifi_' + n + '_' + i + '">';
        this_html += '<td class="form_right"><span class="tip_name hide" sh_lang="name_or_ssid">' + name_or_ssid + '</span><input type="text" maxlength="32" id="ssid_' + n + '_' + i + '" class="form-control require notip isSSID"></td>';
        if (distance_auth_enable == '1') {
            this_html += '<td><select id="encrypt_' + n + '_' + i + '" class="form-control change_encrypt"><option value="psk2">WPA2-PSK</option><option value="none">NONE</option><option value="auth" selected sh_lang="auth_distance">' + auth_distance + '</option></select></td>';
            this_html += '<td class="form_right psk_td hide"><span class="tip_name hide" sh_lang="ddns_passwd">' + ddns_passwd + '</span><input type="text" class="form-control require notip isSSIDPwd psk_change" disabled="disabled" id="passwd_' + n + '_' + i + '"></td>';
            this_html += '<td class="auth_td"><select class="form-control auth_distance" et="change:change_auth_distance" id="distance_' + n + '_' + i + '" ><option value="1">1</option><option value="5">5</option><option value="10">10</option></td>';
        } else {
            this_html += '<td><select id="encrypt_' + n + '_' + i + '" class="form-control change_encrypt"><option value="psk2" >WPA2-PSK</option><option value="none" selected="selected">NONE</option><option value="auth" sh_lang="auth_distance">' + auth_distance + '</option></select></td>';
            this_html += '<td class="form_right psk_td"><span class="tip_name hide" sh_lang="ddns_passwd">' + ddns_passwd + '</span><input type="text" class="form-control require notip isSSIDPwd psk_change" id="passwd_' + n + '_' + i + '" disabled="disabled"></td>';
            this_html += '<td class="auth_td hide"><select class="form-control auth_distance" et="change:change_auth_distance" id="distance_' + n + '_' + i + '" ><option value="1">1</option><option value="5">5</option><option value="10">10</option></td>';
        }
        this_html += '<td><select class="form-control"  id="network_' + n + '_' + i + '">' + landhcp_html + '</select></td>';
        this_html += '<td><a class="table-link" et="click tap:wifi_del"><span class="fa-stack"><i class="fa fa-minus-square-o fa-stack-2x"></i></span></a></td>';
        this_html += '</tr>';
        return this_html;
    }

    et.wifi_del = function (evt) {
        evt.parents('tr').remove();
    }

    et.encryChange_mgnt = function (evt) {
        var t_flag = evt.attr('data-value');
        var now_value = evt.val();
        disabledpsk(now_value, t_flag);
    }

    et.change_auth_distance = function (evt) {
        d('.auth_distance').val(evt.val());
    }

    function disabledpsk(v, flag) {
        if (v == 'none') {
            d('#key_mgnt_' + flag).prop('disabled', true).removeClass("borError");
        } else {
            d('#key_mgnt_' + flag).attr('disabled', false).removeClass("borError");
        }
    }

    et.change_htmode = function (evt) {
        var htmode_str = evt.val();
        var country_str = d('.country_change').val();

        d.each(rwinfo, function (n, m) {
            if (m.flag == '58g') {
                i.append_channel(country_str, "auto", m.flag, htmode_str, m.no_ht80_with_11a, 1);
            }
        });
    };

    et.saveConfig = function () {
        if (!g.format_wifi_ok()) {
            return;
        }
        var arg, kickout_arg;

        if (lock_web) {
            return;
        }
        lock_web = true;
        if (!(arg = volid_wire())) {
            lock_web = false;
            return;
        }
        set_wireless(arg);

        if (!(kickout_arg = volid_kickout())) {
            lock_web = false;
            return;
        }
        set_kickout(kickout_arg);
    }

    function volid_wire() {
        var oThis, listsinfo, listlength, hidden, disabled, wds, rekey, wmm, isolate, maxassoc, ssid_value, encrypt,
            network,
            psk_value;

        wifi_array = [];
        var mgntinfo, adminflag;

        d.each(rwinfo, function (n, m) {
            config.radios[n].country = d('.country_change').val();
            config.radios[n].htmode = d('#htmode_' + m.flag).val();
            config.radios[n].channel = d('#channels_' + m.flag).val();
            config.radios[n].frag = d('#frag').val();
            config.radios[n].rts = d('#rts').val();
            config.radios[n].txpower_level = d('#txpower_' + m.flag).val();
            delete(config.radios[n].txpower);

            config.radios[n].shortgi = d('#switch_shortgi').attr('data-value');

            /*get wifi_config*/
            wds = d('#switch_wds').attr('data-value');
            rekey = d('#switch_rekey').attr('data-value');
            wmm = d('#switch_wmm').attr('data-value');
            isolate = d('#switch_isolate').attr('data-value');

            maxassoc = d('#maxassoc_' + m.flag).val();
            listsinfo = d("[id^='wifi_" + m.flag + "_']");
            listlength = listsinfo.length;
            for (var i = 0; i < listlength; i++) {
                oThis = d(listsinfo[i]);
                disabled = d('#switch_wireless_' + m.flag).attr('data-value');
                hidden = d('#switch_hidessid_' + m.flag).attr('data-value');
                ssid_value = oThis.find('[id^="ssid_' + m.flag + '_"]').val();
                if (distance_auth_enable == '1') {
                    encrypt = 'none';
                } else {
                    encrypt = oThis.find('[id^="encrypt_' + m.flag + '_"]').val();
                }

                network = oThis.find('[id^="network_' + m.flag + '_"]').val();

                if (encrypt == 'none' || encrypt == '') {
                    psk_value = '';
                } else {
                    psk_value = oThis.find('[id^="passwd_' + m.flag + '_"]').val();
                }
                // Intel web device Wlan0 as raido0  wlan2 as radio1
                if (wifis_info[0].device && wifis_info[0].device.indexOf("wlan") >= 0) {
                    var radio_num_set = 0;
                    if(n == 1) radio_num_set = 2;
                    m.wifis[i] = iface_config("wlan" + radio_num_set, disabled, ssid_value, encrypt, network, psk_value, hidden, 'wlan' + (8 * n + i), wmm, maxassoc, isolate, rekey, wds, "ap");
                } else {
                    m.wifis[i] = iface_config("radio" + n, disabled, ssid_value, encrypt, network, psk_value, hidden, 'wlan' + (8 * n + i), wmm, maxassoc, isolate, rekey, wds, "ap");
                }
            }

            for (i = listlength; i < wilrmaxnum; i++) {
                m.wifis[i] = disable_iface();
            }
            if (m.flag == '24g') {
                adminflag = '2g';
            } else {
                adminflag = '5g';
            }

            mgntinfo = m.wifis[m.wifis.length - 1];
            mgntinfo.ssid = d('#ssid_mgnt_' + m.flag).val();
            mgntinfo.encryption = d('#encry_mgnt_' + m.flag).val();
            mgntinfo.key = d('#key_mgnt_' + m.flag).val();
            mgntinfo.disabled = d('#switch_wireless_mgnt_' + m.flag).attr('data-value');
            d.each(m.wifis, function (x, y) {
                wifi_array.push(y);
            })

        });

        var distance_auth_array = [];
        distance_auth_array[0] = {};
        if (distance_auth_enable == '1') {
            distance_auth_array[0].enable = '' + distance_auth_enable;
            distance_auth_array[0].range = d('.auth_distance').val();
        } else {
            distance_auth_array[0].enable = '0';
            distance_auth_array[0].range = '';
        }

        config.distance_auth = distance_auth_array;

        config.wifis = wifi_array;
        return config
    }

    function disable_iface() {
        return iface_config("", "", "", "", "", "", "", "", "", "", "", "1", "", "");
    }

    function iface_config(device, disabled, ssid, encry, network, passwd, hidden, ifname, wmm, maxassoc, isolate, rekey, wds, mode) {

        var iface_config = {};
        if (rekey == 0) {
            iface_config.wpa_group_rekey = '0';
            iface_config.wpa_pair_rekey = '0';
            iface_config.wpa_master_rekey = '0';
            iface_config.disassoc_low_ack = '0';
        }
        iface_config.device = device;
        iface_config.ifname = ifname;
        iface_config.mode = mode;
        iface_config.disabled = disabled;
        iface_config.hidden = hidden;
        iface_config.wmm = wmm;
        iface_config.isolate = isolate;
        iface_config.maxassoc = maxassoc;
        iface_config.wds = wds;
        iface_config.ssid = ssid;
        iface_config.encryption = encry;
        iface_config.key = passwd;
        iface_config.network = network;

        return iface_config;
    }

    function volid_kickout() {
        var a = {}, b = {}, kickout_period;
        a.roams = [];
        b.disable = d('#switch_wlroam').attr('data-value');
        b.check_period = d("#kickout_check_period").val();
        kickout_period = '' + d("#kickout_kickout_period").val() * 60;
        b.kickout_period = kickout_period || "3600";
        b.signal_flag = d("#kickout_signal_flag").val();
        a.roams.push(b);
        return a;
    }

    function set_wireless(arg) {
        f.setMConfig('wifi_config', arg, function (data) {
        })
    }

    function set_kickout(arg) {
        f.setMConfig('wireless_roam', arg, function (data) {
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

    b.init = init;
});
