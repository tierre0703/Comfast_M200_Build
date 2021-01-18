define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        i = require('channels_select'),
        j = require('validate'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);
    require('datatables')(d);
    require('tabletool')(d);
    require("upload")(d);
    require("wizard")(d);

    var group_id_new = '2', vlan_list, ac_group_info, action, group_obj, group_radio_wifi = [], wifi_langht, setstep,
        groupid = 1, groupnum = 0;
    var lock_web = false, tip_num = 0, wilrmaxnum = 7, refresh_flag = 0;

    var weeks_num = ['1', '2', '3', '4', '5', '6', '0'];

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {
        if (refresh_flag) {
            groupid = 1;
            show_default();
            show_value(0);
            refresh_flag = 0;
        }

        f.getMConfig('ac_group_config', function (data) {
            if (data && data.errCode == 0) {
                ac_group_info = data;
                vlan_list = data.vid_list || [];
                if (ac_group_info) {
                    getobjname();
                    group_option();
                    show_value(groupnum);
                }
            }
        });
    }

    function getobjname() {
        group_obj = [];
        var group_num = ac_group_info.group_sum.group_sum;
        if (group_num == 0) {
            f.getMConfig('add_default_group_config', function () {
                location.href = location.href;
            });
            return;
        }
        for (var i = 0; i < group_num; i++) {
            group_obj.push(ac_group_info['group' + i]);
        }
    }

    function group_option() {
        var this_html = '';
        d.each(group_obj, function (n, m) {
            if (m.group_name == 'ac_group_default') {
                this_html += '<option class="text-center" data-value="' + n + '" value="' + m.group_id + '" sh_lang="defalut_group">' + defalut_group + '</option>';
            } else {
                this_html += '<option class="text-center" data-value="' + n + '" value="' + m.group_id + '">' + m.group_name + '</option>';
            }
        });
        d('#acgroupselect').html(this_html);
        d('#acgroupselect').val(groupid);
    }

    et.groupselect = function (evt) {
        groupnum = evt.find("option:selected").attr('data-value');
        groupid = evt.val();
        if (groupnum != 0) {
            show_config();
        } else {
            show_default();
        }
        show_value(groupnum);
    };

    et.gonext = function (evt) {
        var step_all = d('.steps li').length;
        setstep = d('.steps li.active').index() + 1;
        d("#prev").removeClass('hide');
        if (step_all == setstep) {
            evt.html(tcpip_apply);
            evt.attr('et', 'click tap:goend');
        }
    };

    et.goprev = function (a) {
        var setstep = d('.steps li.active').index();
        if (setstep == 0) {
            d("#prev").addClass('hide');
        }
        d('#next').attr('et', 'click tap:gonext').attr('sh_lang', 'menu_zjnextbutton').text(menu_zjnextbutton);
    };

    et.goend = function () {
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = addnewgroup()) {
            d('.closewin').click();
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    et.addgroup = function () {
        action = 'add';
        d('#myWizard input').val('');
        d('#myWizard select').val('none');
        d(".newpasswd").attr("disabled", "disabled");
        d('#prev').addClass('hide');
        d('#stepfirst').click();

        d('#next').attr('et', 'click tap:gonext').attr('sh_lang', 'menu_zjnextbutton').html(menu_zjnextbutton);
    };

    d('#myWizard').on('click', '.complete', function () {
        showactive(d(this));
    });

    function showactive(evt) {
        if (evt.attr('data-target') == '#step1') {
            d('#prev').addClass('hide');
        }
        d('#next').attr('et', 'click tap:gonext').attr('sh_lang', 'menu_zjnextbutton').text(menu_zjnextbutton);
    }

    et.reset_list = function () {
        location.href = location.href;
    };

    et.encry_type = function (evt) {
        var now_flag = evt.attr('data-value');
        if (evt.val() == "psk2") {
            d("#newpasswd_" + now_flag).attr("disabled", false);
        } else {
            d("#newpasswd_" + now_flag).attr("disabled", "disabled");
        }
    };

    et.removegroup = function () {
        action = 'delete';
        var delgroupname = d('#acgroupselect').find("option:selected").text();
        var removestr = global_delete + "  " + wlan_group + " < " + delgroupname + " > ?";
        d('#delgeoup_tip').removeClass('hide');
        d('#edit_group_name').addClass('hide');
        d('#delgruop_tip').html(removestr);
        d('#modal_title').html(global_delete);
    };

    et.grouprename = function () {
        action = 'edit';
        var delgroupnum = d('#acgroupselect').val();
        var delgroupname = d('#acgroupselect').find("option:selected").text();
        d('#delgeoup_tip').addClass('hide');
        d('#edit_group_name').removeClass('hide');
        d('#edit_group_num').val(delgroupnum);
        d('#old_group_name').val(delgroupname);
        d('#new_group_name').val('');
        d('#modal_title').html(global_modify);
    };

    et.reboot_status = function (evt) {
        if (d(evt).attr("data-value") == undefined && !d(evt).hasClass('switch_ext')) {
            evt = d(evt).parent();
        }
        var swich_status = evt.attr('data-value');
        var swich_defaut = evt.attr('data-default') || 1;
        if (swich_status == 1) {
            swich_status = 0;
        } else {
            swich_status = 1;
        }
        g.swich(evt, swich_status, swich_defaut);

        if (d(evt).attr('id') == 'interval_enable') {
            if (swich_status == swich_defaut) {
                d('#interval_time_box').removeClass('hidden');
                d('#interval_redial_time').attr('disabled', false);
            } else {
                d('#interval_time_box').addClass('hidden');
                d('#interval_redial_time').attr('disabled', true);
            }
        }

        if (d(evt).attr('id') == 'reboot_switch') {
            if (swich_status == swich_defaut) {
                d('#workdays').removeClass('hidden');
                d('#times_0').attr('disabled', false)
            } else {
                d('#workdays').addClass('hidden');
                d('#times_0').attr('disabled', true)
            }
        }
    };

    et.select_all_week = function (evt) {
        if (d(evt).attr('data-value') == '0') {
            d(evt).prop('checked', true).attr('data-value', '1');
            d('.week_0').prop('checked', true).attr('data-value', '1');
        } else if (d(evt).attr('data-value') == '1') {
            d(evt).prop('checked', false).attr('data-value', '0');
            d('.week_0').prop('checked', false).attr('data-value', '0');
        }
    };

    et.select_one_week = function (evt) {
        var weekcheck = d(evt).attr('data-value');
        if (weekcheck == '1') {
            d(evt).prop('checked', false).attr('data-value', '0');
            d('#weeks_all_0').prop('checked', false).attr('data-value', '0');
        } else {
            d(evt).prop('checked', true).attr('data-value', '1');
        }

        if (d('.week_0').length == d('.week_0:checked').length) {
            d('#weeks_all_0').prop('checked', true).attr('data-value', '1');
        }
    };

    et.saveeditgruop = function () {
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (action == 'delete') {
            arg_data = delgroup();
        } else if (action == 'edit') {
            arg_data = edit_groupname();
        }

        if (arg_data) {
            d('.closewin').click();
            refresh_flag = 1;
            groupnum = 0;
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    function delgroup() {
        var arg = {}, b = [];
        var delgroupnum = d('#acgroupselect').val();
        var delgroupname = d('#acgroupselect').find("option:selected").text();
        b[0] = {};
        b[0].group_id = delgroupnum;
        b[0].group_name = delgroupname;
        arg.group_config = b;
        arg.group_action = 'delete';
        return arg;
    }

    function edit_groupname() {
        var arg = {}, b = [], double_name;
        var groupnum = d('#acgroupselect').val();
        var old_groupname = d('#old_group_name').val();
        var new_groupname = d('#new_group_name').val();
        b[0] = {};
        b[0].group_id = groupnum;
        if (new_groupname == '') {
            b[0].group_name = old_groupname;
        } else {
            b[0].group_name = new_groupname;
        }

        d.each(ac_group_info, function (n, m) {
            if (m.group_name && m.group_name == b[0].group_name || b[0].group_name == defalut_group) {
                h.ErrorTip(tip_num++, ac_group_name + '"' + b[0].group_name + '"' + groupname_exist);
                double_name = 1;
                return false;
            }
        });

        if (double_name) {
            return false;
        }

        arg.group_config = b;
        arg.group_action = 'modify';
        return arg;
    }

    function show_default() {
        d('.disabled_click').attr('disabled', true);
    }

    function show_config() {
        d('.disabled_click').removeAttr('disabled');
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

    function show_value(num) {
        var groupconfig = ac_group_info['group' + num];
        var wifi_list_id, ssid_id, passwd_id, vlan_id, disabled_id;
        var hwmode_id, htmode_id, shortgi_id, txpower_id, txpower, encrypt_id, radio_rekey_id;
        var disabled_mgnt, hidessid_mgnt, ssid_mgnt, encry_mgnt, key_mgnt;

        d('#wifitab > li').each(function (n, m) {
            if (!d(m).hasClass('hide')) {
                d(m).click();
                return false;
            }
        });

        ceartrwinfo(groupconfig);
        g.swich('#switch_hidessid_24g', groupconfig.wlan_hidden_24g);
        g.swich('#switch_hidessid_58g', groupconfig.wlan_hidden_5g);

        d('#wlan_beacon_int').val(groupconfig.wlan_beacon_int || 100);
        d('#radio_rts').val(groupconfig.radio_rts || 2347);
        d('#wlan_dtim_period').val(groupconfig.wlan_dtim_period || 2);
        d('#maxassoc_24g').val(groupconfig.wlan_maxassoc_24g);
        d('#maxassoc_58g').val(groupconfig.wlan_maxassoc_5g);
        g.swich('#switch_isolate', groupconfig.wlan_isolate || 0, 1);

        d("#kickout_check_period").val(groupconfig.kickout_check_period);
        d("#kickout_kickout_period").val(groupconfig.kickout_kickout_period / 60 || "60");
        d("#kickout_signal_flag").val(groupconfig.kickout_signal_flag);
        g.swich('#switch_wlroam', groupconfig.kickout_disable, 0);

        var timing_weeks = groupconfig.timing_weeks || '';

        if (timing_weeks != '') {
            checked_week(timing_weeks.split(','));
        }

        d('#times_0').val(groupconfig.timing_time);
        g.swich('#reboot_switch', groupconfig.timing_enable);
        if (groupconfig.timing_enable == '1') {
            d('#workdays').removeClass('hidden');
            d('#times_0').attr('disabled', false);
        } else {
            d('#workdays').addClass('hidden');
            d('#times_0').attr('disabled', true);
        }

        g.swich('#interval_enable', groupconfig.interval_enable);
        if (groupconfig.interval_enable == '1') {
            d('#interval_time_box').removeClass('hidden');
            d('#interval_redial_time').attr('disabled', false);
        } else {
            d('#interval_time_box').addClass('hidden');
            d('#interval_redial_time').attr('disabled', true);
        }
        d('#interval_redial_time').val(groupconfig.interval_time);

        d.each(group_radio_wifi, function (n, m) {
            var handle_html = '', this_html = '';
            d('#wifilist_' + m.flag).html('');

            hwmode_id = '#hwmode_' + m.flag;
            txpower_id = '#txpower_' + m.flag;
            disabled_id = '#switch_wireless_' + m.flag;
            htmode_id = '#bandwidth_' + m.flag;
            shortgi_id = '#short_gi_' + m.flag;
            radio_rekey_id = '#radio_rekey_' + m.flag;

            d(radio_rekey_id).val(m.wpa_group_rekey || 86400);
            d(htmode_id).val(m.htmode);

            if (m.flag == '24g') {
                d(hwmode_id).val(m.hwmode)
            }

            txpower = m.txpower_level;
            if (txpower != '') {
                d(txpower_id).val(txpower);
            } else {
                d(txpower_id).val(1000);
            }

            d('.country_change').val(m.country || "CN");
            i.append_htmode(m.htmode, m.flag, m.no_ht80_with_11a);
            i.append_channel(m.country, m.channel, m.flag, m.htmode, 0, 0);

            g.swich(shortgi_id, String(m.shortgi) || 1, 1);
            d.each(m.wifis, function (x, y) {
                if (x < m.wifis.length - 1) {
                    wifi_list_id = 'wifi_' + m.flag + '_' + x;
                    ssid_id = 'ssid_' + m.flag + '_' + x;
                    passwd_id = 'passwd_' + m.flag + '_' + x;
                    encrypt_id = 'encrypt_' + m.flag + '_' + x;
                    vlan_id = 'vid_' + m.flag + '_' + x;

                    handle_html = buildhandlehtml(x, m.flag);
                    this_html = buildlisthtml(wifi_list_id, ssid_id, passwd_id, encrypt_id, vlan_id, handle_html);
                    d('#wifilist_' + m.flag).append(this_html);

                    d('#' + ssid_id).val(y.ssid);
                    d('#' + encrypt_id).val(y.encryp_way || 'none');
                    if (y.encryp_way == 'psk2') {
                        d('#' + passwd_id).val(y.key);
                    } else {
                        d('#' + passwd_id).attr('disabled', true).val('');
                    }
                    d("#" + vlan_id).val(y.vid || "1");
                    if (x == 0) {
                        g.swich(disabled_id, y.disabled, 0);
                    }
                } else {
                    disabled_mgnt = '#switch_wireless_mgnt_' + m.flag;
                    hidessid_mgnt = '#switch_hidessid_mgnt_' + m.flag;
                    ssid_mgnt = '#ssid_mgnt_' + m.flag;
                    encry_mgnt = '#mgnt_encry_' + m.flag;
                    key_mgnt = '#key_mgnt_' + m.flag;

                    d(ssid_mgnt).val(y.ssid);
                    d(encry_mgnt).val(y.encryp_way);
                    if (y.encryp_way == "psk2") {
                        d(key_mgnt).val(y.key).attr('disabled', false);
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

    function checked_week(weeks) {
        d('.week_0').prop('checked', false);
        d.each(weeks, function (n, m) {
            d('#weeks_0_' + m).prop('checked', true).attr('data-value', '1');
        })
        if (d('.week_0').length == d('.week_0:checked').length) {
            d('#weeks_all_0').prop('checked', true).attr('data-value', '1');
        }
    }

    function ceartrwinfo(one_group) {
        d.each(one_group.radio, function (n, m) {
            group_radio_wifi[n] = m;
            if (m.is_5g == 0) {
                group_radio_wifi[n].flag = '24g';
            } else if (m.is_5g == 1) {
                group_radio_wifi[n].flag = '58g';
            }
            group_radio_wifi[n].wifis = [];
            d.each(one_group.vif, function (x, y) {
                if (m.is_5g == y.is_5g) {
                    group_radio_wifi[n].wifis.push(y);
                }
            })
        });
    }

    function buildhandlehtml(i, rflag) {
        if (i == 0) {
            return '<td><a class="table-link" data-value="' + rflag + '" et="click tap:wifi_add"><span class="fa-stack"><i class="fa fa-plus-square-o fa-stack-2x"></i><i></i></span></a></td>';
        } else {
            return '<td><a class="table-link" et="click tap:wifi_del"><span class="fa-stack"><i class="fa fa-minus-square-o fa-stack-2x"></i><i></i></span></a></td>';
        }
    }

    function buildlisthtml(wifi_list_id, ssid_id, passwd_id, encrypt_id, vlan_id, handle_html) {
        return '<tr class="text-center" id ="' + wifi_list_id + '">' +
            '<td class="form_right"><span class="tip_name hide" sh_lang="name_or_ssid">' + name_or_ssid + '</span><input maxlength="32" autocomplete="off" class="form-control require isSSID" type="text" id="' + ssid_id + '"></td>' +
            '<td><select class="form-control" id="' + encrypt_id + '" et="change:changeencrypt"><option value="psk2" selected="selected" >WPA2-PSK</option><option value="none">NONE</option></td>' +
            '<td class="form_right"><span class="tip_name hide" sh_lang="ddns_passwd">' + ddns_passwd + '</span><input maxlength="32" autocomplete="off" type="text" class="form-control require isSSIDPwd" id="' + passwd_id + '"></td>' +
            '<td class="form_right"><select class="form-control" id="' + vlan_id + '">' + vlan_option() + '</select></td>' + handle_html;
    }

    function vlan_option(vlan_id) {
        var this_html = '';
        if (vlan_id == "1" || vlan_id == "") {
            this_html = '<option value="1" selected>' + ssid_vlan_disabled + '</option>';
        } else {
            this_html = '<option value="1">' + ssid_vlan_disabled + '</option>';
        }

        d.each(vlan_list, function (n, m) {
            //if (vlan_id == m.id) {
            //    this_html += '<option value="' + m.id + '" selected>' + m.iface.toUpperCase() + '</option>';
            //} else {
            this_html += '<option value="' + m.id + '">' + m.iface.toUpperCase() + '</option>';
            //}

        });
        return this_html;
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
        n++;
        d('#' + uid).append($html);
        h.volide('body');
    };

    function wifihtml(n, i) {
        var this_html = '';
        this_html += '<tr class="text-center" id="wifi_' + n + '_' + i + '">';
        this_html += '<td class="form_right"><span class="tip_name hide" sh_lang="name_or_ssid">' + name_or_ssid + '</span><input type="text" autocomplete="off" id="ssid_' + n + '_' + i + '" maxlength="32" class="form-control require isSSID"></td>';
        this_html += '<td><select id="encrypt_' + n + '_' + i + '" class="form-control" et="change:changeencrypt"><option value="none" selected="selected">NONE</option><option value="psk2">WPA2-PSK</option></select></td>';
        this_html += '<td class="form_right"><span class="tip_name hide" sh_lang="ddns_passwd">' + ddns_passwd + '</span><input type="text" id="passwd_' + n + '_' + i + '" disabled="disabled" class="form-control require notip isSSIDPwd"></td>';
        this_html += '<td class="form_right"><select  class="form-control" id="vid_' + n + '_' + i + '">' + vlan_option(1) + '</select></td>';
        this_html += '<td><a class="table-link" et="click tap:wifi_del"><span class="fa-stack"><i class="fa fa-minus-square-o fa-stack-2x"></i></span></a></td>';
        this_html += '</tr>';
        return this_html;
    }

    et.wifi_del = function (evt) {
        evt.parents('tr').remove();
    };

    et.change_country = function (evt) {
        var rodia_flag, country_str = d(evt).val();
        d('.country_change').val(country_str);
        d.each(ac_group_info['group' + groupnum].radio, function (n, m) {
            var htmode_str;
            if (m.is_5g == '0') {
                rodia_flag = '24g';
            } else if (m.is_5g == '1') {
                rodia_flag = '58g';
            }
            htmode_str = d('#bandwidth_' + rodia_flag).val();
            i.append_channel(country_str, "0", rodia_flag, htmode_str, 0, 0);
        });
    };

    et.change_htmode = function (evt) {
        var htmode_str = d(evt).val(), country_str = d('.country_change').val();
        i.append_channel(country_str, "0", '58g', htmode_str, 0, 0);
    };

    function addnewgroup() {
        var arg = {}, d_radio = [], d_vif = [], double_name = 0;
        var groupname = d("#newgroupname").val();
        var ssid_24g = d("#newssid_24g").val();
        var encry_24g = d("#newencry_24g").val();
        var passwd_24g = d("#newpasswd_24g").val();
        var ssid_58g = d("#newssid_58g").val();
        var encry_58g = d("#newencry_58g").val();
        var passwd_58g = d("#newpasswd_58g").val();

        if (groupname == "") {
            h.ErrorTip(tip_num++, group_name_is_null);
            return false;
        }

        if (groupname.indexOf(" ") > -1) {
            h.ErrorTip(tip_num++, ac_group_name + ac_group_name_have_blank);
            return false;
        }

        d.each(ac_group_info, function (n, m) {
            if (m.group_name && m.group_name == groupname || groupname == defalut_group) {
                h.ErrorTip(tip_num++, ac_group_name + '"' + groupname + '"' + groupname_exist);
                double_name = 1;
                return false;
            }
        });

        if (double_name) {
            return false;
        }

        if (ssid_24g == "") {
            h.ErrorTip(tip_num++, radio_24g_name + ssid_name_is_null);
            return false;
        }

        if (h.error_ssid(ssid_24g)) {
            h.ErrorTip(tip_num++, radio_24g_name + ssid_is_too_long);
            return false;
        }

        if (encry_24g == "psk2") {
            if (h.error_ssidpsk(passwd_24g)) {
                h.ErrorTip(tip_num++, radio_24g_name + ' ' + password + format_tips);
                return false;
            }
        }

        if (ssid_58g == "") {
            h.ErrorTip(tip_num++, radio_58g_name + ssid_name_is_null);
            return false;
        }

        if (h.error_ssid(ssid_58g)) {
            h.ErrorTip(tip_num++, radio_58g_name + ssid_is_too_long);
            return false;
        }

        if (encry_58g == "psk2") {
            if (h.error_ssidpsk(passwd_58g)) {
                h.ErrorTip(tip_num++, radio_58g_name + ' ' + password + format_tips);
                return false;
            }
        }

        var dy = {};
        //2.4G radio config
        d_radio[0] = {};
        d_radio[0].phyname = "radio0";
        d_radio[0].htmode = "HT20";
        d_radio[0].country = "CN";
        d_radio[0].channel = 0;
        d_radio[0].txpower_level = 1000;
        d_radio[0].wpa_group_rekey = 86400;
        d_radio[0].shortgi = 1;
        d_radio[0].is_5g = 0;
        d_radio[0].disabled = 0;

        //5G radio config
        d_radio[1] = {};
        d_radio[1].phyname = "radio1";
        d_radio[1].htmode = "HT40";
        d_radio[1].country = "CN";
        d_radio[1].channel = 0;
        d_radio[1].txpower_level = 1000;
        d_radio[1].wpa_group_rekey = 86400;
        d_radio[1].shortgi = 1;
        d_radio[1].is_5g = 1;
        d_radio[1].disabled = 0;

        //2.4G vif config
        d_vif[0] = {};
        d_vif[0].ssid = ssid_24g;
        d_vif[0].encryp_way = encry_24g;
        if (encry_24g == "none") {
            d_vif[0].key = "";
        } else {
            d_vif[0].key = passwd_24g;
        }

        d_vif[0].phyname = "radio0";
        d_vif[0].name = "wlan0";
        d_vif[0].is_5g = 0;

        d_vif[1] = {};
        //2.4G wlan_admin config
        d_vif[1].ssid = "COMFAST_ADMIN_2G";
        d_vif[1].encryp_way = "psk2";
        d_vif[1].key = "12345678";
        d_vif[1].phyname = "radio0";
        d_vif[1].name = "wlan_admin_2g";
        d_vif[1].is_5g = 0;
        d_vif[1].disabled = 1;

        d_vif[2] = {};
        //5G vif config
        d_vif[2].ssid = ssid_58g;
        d_vif[2].encryp_way = encry_58g;
        if (encry_58g == "none") {
            d_vif[2].key = "";
        } else {
            d_vif[2].key = passwd_58g;
        }
        d_vif[2].phyname = "radio1";
        d_vif[2].name = "wlan8";
        d_vif[2].is_5g = 1;

        d_vif[3] = {};
        //5G wlan_admin config
        d_vif[3].ssid = "COMFAST_ADMIN_5G";
        d_vif[3].encryp_way = "psk2";
        d_vif[3].key = "12345678";
        d_vif[3].phyname = "radio1";
        d_vif[3].name = "wlan_admin_5g";
        d_vif[3].is_5g = 1;
        d_vif[3].disabled = 1;

        dy.group_name = groupname;
        dy.group_id = group_id_new;
        dy.kickout_disable = 0;
        dy.kickout_check_period = 5;
        dy.kickout_kickout_period = 600;
        dy.kickout_signal_flag = 65;
        dy.wlan_maxassoc_24g = 256;
        dy.wlan_maxassoc_5g = 256;
        dy.radio = d_radio;
        dy.vif = d_vif;
        dy.radio_rts = 2347;
        dy.timing_enable = "1";
        dy.timing_time = "03:00";
        dy.timing_weeks = "1,2,3,4,5,6,0";
        dy.wlan_beacon_int = 100;
        dy.wlan_dtim_period = 2;
        dy.wlan_hidden_5g = 0;
        dy.wlan_hidden_24g = 0;
        arg.group_action = 'add';
        arg.group_config = [];
        arg.group_config.push(dy);
        return arg;
    }

    et.changeencrypt = function (evt) {
        var evt_change = evt.parents('tr').find('input[class*="isSSIDPwd"]');
        if (evt_change.attr('disabled')) {
            evt_change.attr('disabled', false);
        } else {
            evt_change.attr('disabled', true).removeClass('borError');
        }
    };

    et.encryChange_mgnt = function (evt) {
        var rflag = evt.attr('data-value');

        if (evt.val() == 'none') {
            d('#key_mgnt_' + rflag).attr('disabled', true);
        } else {
            d('#key_mgnt_' + rflag).removeAttr('disabled');
        }
    };

    et.saveConfig = function () {
        var arg;
        if (!g.format_wifi_ok()) {
            return;
        }
        if (lock_web) {
            return;
        }
        lock_web = true;
        if (arg = volid_group_config()) {
            set_config(arg);
        } else {
            lock_web = false;
        }
    };

    function volid_group_config() {
        var arg = {}, dy = {}, d_radio = [], d_vif = [], week_arr = [];
        var oThis, listsinfo, listlength, disabled_ssid, hidden_ssid, ssid_value, encrypt, psk_value, vid_value;
        var maxassoc_24g, maxassoc_58g, hidden_24g, hidden_58g;
        //var disabled_status = d('#switch_wireless_' + m.flag).attr('data-value')

        d.each(group_radio_wifi, function (n, m) {
            var channels_val = d('#channels_' + m.flag).val();
            if (channels_val == 'auto') {
                channels_val = 0;
            }

            d_radio[n] = {};
            d_radio[n].phyname = m.phyname;
            d_radio[n].htmode = d('#bandwidth_' + m.flag).val();
            d_radio[n].country = d('.country_change').val();
            d_radio[n].channel = parseInt(channels_val);
            d_radio[n].txpower_level = parseInt(d('#txpower_' + m.flag).val());
            d_radio[n].wpa_group_rekey = parseInt(d('#radio_rekey_' + m.flag).val());
            d_radio[n].shortgi = parseInt(d('#short_gi_' + m.flag).attr('data-value'));
            d_radio[n].is_5g = parseInt(m.is_5g);

            disabled_ssid = d('#switch_wireless_' + m.flag).attr('data-value');
            hidden_ssid = d('#switch_hidessid_' + m.flag).attr('data-value');

            listsinfo = d("[id^='wifi_" + m.flag + "_']");
            listlength = listsinfo.length;
            for (var i = 0; i < listlength; i++) {
                oThis = d(listsinfo[i]);

                ssid_value = oThis.find('[id^="ssid_' + m.flag + '_"]').val();
                encrypt = oThis.find('[id^="encrypt_' + m.flag + '_"]').val();

                if (encrypt == 'none' || encrypt == '') {
                    psk_value = '';
                } else {
                    psk_value = oThis.find('[id^="passwd_' + m.flag + '_"]').val();
                }
                vid_value = oThis.find('[id^="vid_' + m.flag + '_"]').val();
                d_vif.push(new_iface(ssid_value, encrypt, psk_value, disabled_ssid, m.phyname, 8 * n + i, m.is_5g, vid_value))
            }

            for (i = listlength; i < wilrmaxnum; i++) {
                d_vif.push[i] = disable_iface(8 * n + i);
            }

            ssid_value = d('#ssid_mgnt_' + m.flag).val();
            encrypt = d('#mgnt_encry_' + m.flag).val();
            if (encrypt == 'none' || encrypt == '') {
                psk_value = '';
            } else {
                psk_value = d('#key_mgnt_' + m.flag).val();
            }
            disabled_ssid = d('#switch_wireless_mgnt_' + m.flag).attr('data-value');
            d_vif.push(mgnt_iface(ssid_value, encrypt, psk_value, disabled_ssid, m.phyname, 8 * n + 7, m.is_5g, "1"))
        });

        hidden_24g = d('#switch_hidessid_24g').attr('data-value');
        hidden_58g = d('#switch_hidessid_58g').attr('data-value');
        maxassoc_24g = d('#maxassoc_24g').val();
        maxassoc_58g = d('#maxassoc_58g').val();

        d.each(weeks_num, function (x, y) {
            var week_id = "#weeks_0_" + y;
            if (d(week_id).prop("checked") == true) {
                week_arr.push(y)
            }
        });

        dy.timing_enable = d('#reboot_switch').attr('data-value');
        dy.timing_weeks = week_arr.join(',');
        dy.timing_time = d('#times_0').val();
        dy.interval_enable = d('#interval_enable').attr('data-value');
        dy.interval_time = d('#interval_redial_time').val();

        dy.radio = d_radio;
        dy.vif = d_vif;
        dy.group_id = d('#acgroupselect').val();
        dy.group_name = d('#acgroupselect').find("option:selected").text();
        if (d('#acgroupselect').val() == "1") {
            dy.group_name = "ac_group_default";
        }
        dy.wlan_hidden_24g = parseInt(hidden_24g);
        dy.wlan_hidden_5g = parseInt(hidden_58g);
        dy.wlan_maxassoc_24g = parseInt(maxassoc_24g);
        dy.wlan_maxassoc_5g = parseInt(maxassoc_58g);
        dy.wlan_beacon_int = parseInt(d('#wlan_beacon_int').val());
        dy.wlan_dtim_period = parseInt(d('#wlan_dtim_period').val());
        dy.wlan_isolate = parseInt(d('#switch_isolate').attr('data-value'));
        dy.radio_rts = parseInt(d('#radio_rts').val());
        dy.kickout_disable = parseInt(d('#switch_wlroam').attr('data-value'));
        dy.kickout_check_period = parseInt(d('#kickout_check_period').val());
        dy.kickout_kickout_period = (d('#kickout_kickout_period').val() * 60) || 3600;
        dy.kickout_signal_flag = parseInt(d('#kickout_signal_flag').val());
        arg.group_action = 'modify';
        arg.group_config = [];
        arg.group_config.push(dy);
        return arg;
    }

    function mgnt_iface(ssid, encrypt, passwd, disabled, phyname, namenum, is5g, vid) {
        var wlanname;

        if (is5g == 1) {
            wlanname = "wlan_admin_5g";
        } else {
            wlanname = "wlan_admin_2g";
        }

        var iface_config = {};

        iface_config.ssid = ssid;
        iface_config.encryp_way = encrypt;
        iface_config.key = passwd;
        iface_config.disabled = parseInt(disabled);
        iface_config.phyname = phyname;
        iface_config.name = wlanname;
        iface_config.is_5g = parseInt(is5g);
        iface_config.vid = parseInt(vid);
        return iface_config;
    }

    function disable_iface() {
        return new_iface("", "", "", "", "", "", "", "1");
    }

    function new_iface(ssid, encrypt, passwd, disabled, phyname, namenum, is5g, vid) {
        var wlanname = "wlan" + namenum;
        var iface_config = {};

        iface_config.ssid = ssid;
        iface_config.encryp_way = encrypt;
        iface_config.key = passwd;
        iface_config.disabled = parseInt(disabled);
        iface_config.phyname = phyname;
        iface_config.name = wlanname;
        iface_config.is_5g = parseInt(is5g);
        iface_config.vid = parseInt(vid);

        return iface_config;
    }

    /*设置*/
    function set_config(arg) {
        f.setMConfig('ac_group_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                if (arg.group_action == "delete") {
                    location.href = location.href;
                } else {
                    refresh_init();
                    setTimeout(reset_lock_web, 3000)
                }
            }
        })
    }

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});
