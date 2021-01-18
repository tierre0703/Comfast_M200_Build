define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        i = require('channels_select'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);
    require('datatables')(d);
    require('tabletool')(d);

    var ac_group_info, vlan_list, aplist, current_ac_status, group_obj, one_radio_wifi, one_device, wifi_langht,  dev_config = {};
    var perfor_table, manage_table, lock_web = false, tip_num = 0, default_num = 10, wilrmaxnum = 7, interval_flush, flush_time = 'auto';

    var weeks_num = ['1', '2', '3', '4', '5', '6', '0'];

    function init() {
        d('.select_line').val(default_num);
        d('.select_flush').val(flush_time);
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('ac_group_config', function (data) {
            if (data && data.errCode == 0) {
                ac_group_info = data;
                vlan_list = data.vid_list || [];
                ac_group_init();
            }
        }, false);

        f.getMConfig('ac_list_get', function (data) {
            if (data && data.errCode == 0) {
                aplist = data.list_all || [];
                acap_status();
                showtable();
            }
        });
    }

    function acap_status() {
        if (aplist && (aplist.length > 0)) {
            current_ac_status = "ac";
        } else {
            current_ac_status = "ap";
        }
    }

    function ac_group_init() {
        if (!ac_group_info) {
            return;
        }
        getobjname();
        group_option()
    }

    function getobjname() {
        var group_num = ac_group_info.group_sum.group_sum;
        group_obj = [];
        if (group_num == 0) {
            f.getMConfig('add_default_group_config', function () {
                gohref();
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
                this_html += '<option class="text-center" data-value="' + n + '" sh_lang="defalut_group" value="' + m.group_id + '">' + defalut_group + '</option>';
            } else {
                this_html += '<option class="text-center" data-value="' + n + '" value="' + m.group_id + '">' + m.group_name + '</option>';
            }
        });
        d('#acgroupselect').html(this_html);
    }

    et.movegroup = function (evt) {
        var arg;
        if (lock_web) {
            return;
        }
        lock_web = true;
        if (arg = volid_movegroup(evt)) {
            set_apconfig(arg);
        } else {
            lock_web = false;
        }
    };

    function volid_movegroup() {
        var a = {}, this_checked, group_array = [];

        this_checked = d('#manage_tbody').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }

        this_checked.each(function (n, m) {
            group_array[n] = {};
            group_array[n].member_mac = d(m).parents('tr').find('.apmac').text().toLowerCase();
            group_array[n].group_id_old = d(m).parents('tr').find('.ap_group_oid').text();
            group_array[n].group_id_new = d('#acgroupselect').val();
            group_array[n].group_name = d('#acgroupselect').find("option:selected").text();
        });
        a.group_member_list = group_array;
        return a;
    }

    et.head_nav = function (evt) {
        if (evt.attr('data-value') == 'perfor') {
            d('#manage_nav').addClass('hide');
        } else if (evt.attr('data-value') == 'manage') {
            d('#manage_nav').removeClass('hide');
        }
    };

    et.flush = function (evt) {
        if (evt.val() != 'auto') {
            flush_time = evt.val() * 60 * 1000;
            if (interval_flush != '') {
                clearInterval(interval_flush);
            }
            interval_flush = setInterval(refresh_init, flush_time);
        } else {
            flush_time = evt.val();
            clearInterval(interval_flush)
        }

        d(evt).blur();
    };

    et.click_flush = function () {
        refresh_init();
    };

    et.displayline = function (evt) {
        default_num = d(evt).val();
        perfor_table.page.len(default_num).draw();
        manage_table.page.len(default_num).draw();
        d(evt).blur();
    };

    function showtable() {
        d('#select_laber').text(selectall_tab);
        d('#allchecked').attr('data-value', '0');

        aplist.sort(function (n, m) {
            if (n.offline_flag == 'online') {
                n.online = '1';
            } else {
                n.online = '0';
            }

            if (m.offline_flag == 'online') {
                m.online = '1';
            } else {
                m.online = '0';
            }

            return m.online - n.online;
        });
        list_show();
    }

    function list_show() {
        var perfor_html = '', manage_html = '';

        d('#perfor_table').dataTable().fnClearTable();
        d('#perfor_table').dataTable().fnDestroy();
        d('#manage_table').dataTable().fnClearTable();
        d('#manage_table').dataTable().fnDestroy();

        d.each(aplist, function (n, m) {
            var hasradio_24g = 0, hasradio_58g = 0, stacount_sum_24g = 0, stacount_sum_58g = 0, stacount_sum, txbytes_sum = 0, rxbytes_sum = 0;
            var txbytes_sum_24g = 0, txbytes_sum_58g = 0, ssid_24g = [], ssid_58g = [], maxassoc_24g, maxassoc_58g, ap_status;
            var txpowerlevel_24g, txpowerlevel_58g, channel_24g, channel_58g;
            var group_config, group_config_name;


            if (m.vif.length < 1) {
                return true;
            }
            for (var x = 0; x < m.vif.length; x++) {
                var y = m.vif[x];
                if (y.tx_bytes == '' || y.tx_bytes == undefined) {
                    y.tx_bytes = '0';
                }
                if (y.rx_bytes == '' || y.rx_bytes == undefined) {
                    y.rx_bytes = '0';
                }
                if (y.is_5g == 0) {
                    stacount_sum_24g += y.staCount;
                    txbytes_sum_24g += parseInt(y.tx_bytes);
                    ssid_24g.push(y.ssid);
                } else if (y.is_5g == 1) {
                    stacount_sum_58g += y.staCount;
                    txbytes_sum_58g += parseInt(y.tx_bytes);
                    ssid_58g.push(y.ssid);
                }
                txbytes_sum += parseInt(y.tx_bytes);
                rxbytes_sum += parseInt(y.rx_bytes);
            }

            d.each(m.radio, function (x, y) {
                if (y.is_5g == 0) {
                    txpowerlevel_24g = (y.txpower_level != '0' ? (y.txpower_level || '1000') : '0') / 10 + '%';
                    channel_24g = y.channel || 'auto';
                    hasradio_24g = 1;
                } else if (y.is_5g == 1) {
                    txpowerlevel_58g = (y.txpower_level != '0' ? (y.txpower_level || '1000') : '0') / 10 + '%';
                    channel_58g = y.channel || 'auto';
                    hasradio_58g = 1;
                }
            });
            txbytes_sum = g.bytesTosize(txbytes_sum);
            rxbytes_sum = g.bytesTosize(rxbytes_sum);
            txbytes_sum_24g = g.bytesTosize(txbytes_sum_24g);
            txbytes_sum_58g = g.bytesTosize(txbytes_sum_58g);

            if (m.offline_flag == 'online') {
                ap_status = acconfig_online;
            } else {
                ap_status = acconfig_offline;
            }
            stacount_sum = stacount_sum_24g + stacount_sum_58g;

            maxassoc_24g = m.wlan_maxassoc_24g;
            maxassoc_58g = m.wlan_maxassoc_5g;

            if (!hasradio_24g) {
                stacount_sum_24g = '*';
                txbytes_sum_24g = '*';
                ssid_24g.push('*');
                maxassoc_24g = '*';
                txpowerlevel_24g = '*';
                channel_24g = '*'
            }

            if (!hasradio_58g) {
                stacount_sum_58g = '*';
                txbytes_sum_58g = '*';
                ssid_58g.push('*');
                maxassoc_58g = '*';
                txpowerlevel_58g = '*';
                channel_58g = '*'
            }
            var is_defalut_group = 0;
            group_config = findgroup(m.mac);
            if (group_config.group_name == "" || group_config.group_name == "ac_group_default") {
                is_defalut_group = 1;
                group_config_name = defalut_group;
            } else {
                group_config_name = group_config.group_name;
            }
            var deviceReg = new RegExp("(.+)-(.+)");
            var deviceName = deviceReg.exec(m.soft_version)[1];
            var deviceVersion = deviceReg.exec(m.soft_version)[2];

            perfor_html += '<tr class="text-center">';
            perfor_html += '<td>' + (n + 1) + '</td>';
            perfor_html += '<td class="apmac">' + m.mac.toUpperCase() + '</td>';
            perfor_html += '<td>' + m.wan_ip + '</td>';
            perfor_html += '<td>' + stacount_sum_24g + '/' + stacount_sum_58g + '/' + stacount_sum + '</td>';
            perfor_html += '<td>';
            perfor_html += rxbytes_sum + '/' + txbytes_sum;
            perfor_html += '</td>';
            if (m.ssid_vid_sup == 1) {
                perfor_html += '<td>' + global_support + '</td>';
            } else {
                perfor_html += '<td>' + global_nonsupport + '</td>';
            }

            perfor_html += '<td>' + g.formatsecond(m.uptime) + '</td>';
            perfor_html += '<td>' + ap_status + '</td>';
            if (is_defalut_group) {
                perfor_html += '<td sh_lang="defalut_group">' + group_config_name + '</td>';
            } else {
                perfor_html += '<td title="' + group_config_name + '">' + g.omittext(group_config_name, 6) + '</td>';
            }
            perfor_html += '<td >' + m.alias + '</td>';
            if (m.led_state == '1') {
                perfor_html += '<td><span class="fa-stack"><i class="fa fa-closeglim fa-stack-2x"></i></span></td>';
            } else {
                perfor_html += '<td><span class="fa-stack"><i class="fa fa-openglim fa-stack-2x" style="color: #0e90d2"></i></span></td>';
            }
            perfor_html += '</tr>';

            if (ssid_24g.length < 1) {
                ssid_24g[0] = "undefined";
            }

            if (ssid_58g.length < 1) {
                ssid_58g[0] = "undefined";
            }

            manage_html += '<tr class="text-center">';
            manage_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            manage_html += '<td>' + (n + 1) + '</td>';
            manage_html += '<td class="apmac">' + m.mac.toUpperCase() + '</td>';
            manage_html += '<td title="' + ssid_24g[0] + '">' + ssid_24g[0].split('').slice(0, 16).join('') + '</td>';
            manage_html += '<td title="' + ssid_58g[0] + '">' + ssid_58g[0].split('').slice(0, 16).join('') + '</td>';
            manage_html += '<td>' + maxassoc_24g + '/' + maxassoc_58g + '</td>';
            manage_html += '<td>' + txpowerlevel_24g + '/' + txpowerlevel_58g + '</td>';
            manage_html += '<td>' + channel_24g + '/' + channel_58g + '</td>';
            manage_html += '<td>' + deviceName.toUpperCase() + '</td>';
            manage_html += '<td>' + deviceVersion + '</td>';
            manage_html += '<td>' + ap_status + '</td>';
            if (is_defalut_group) {
                manage_html += '<td sh_lang="defalut_group">' + group_config_name + '</td>';
            } else {
                manage_html += '<td title="' + group_config_name + '">' + g.omittext(group_config_name, 6) + '</td>';
            }
            manage_html += '<td >' + m.alias + '</td>';
            if (m.radio.length == 0) {
                manage_html += '<td><a data-toggle="modal" class="table-link gray"><span class="fa-stack" et="click tap:editlist"><i class="fa fa-square fa-stack-2x"></i><i data-modal="modal-4"  title="' + edit + '" class="md-trigger fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger"><span class="fa-stack" et="click tap:delap"><i class="fa fa-square fa-stack-2x" ></i><i class="fa fa-trash-o fa-stack-1x fa-inverse"  title="' + ac_group_del_btn + '"></i></span></a></td>';
            } else {
                manage_html += '<td><a data-toggle="modal" data-target="#modal_edit" class="table-link" et="click tap:editlist"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i data-modal="modal-4"  title="' + edit + '" class="md-trigger fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger"><span class="fa-stack" et="click tap:delap"><i class="fa fa-square fa-stack-2x" ></i><i class="fa fa-trash-o fa-stack-1x fa-inverse"  title="' + ac_group_del_btn + '"></i></span></a></td>';
            }
            manage_html += '<td class="ap_list_num hidden">' + n + '</td>';
            manage_html += '<td class="ap_group_oid hidden">' + group_config.group_id + '</td>';
            manage_html += '<td class="ap_group_name hidden">' + group_config.group_name + '</td>';
            manage_html += '</tr>';
        });
        d("#perfor_tbody").html(perfor_html);
        d("#manage_tbody").html(manage_html);

        if (aplist.length > 0) {
            perfor_table = d('#perfor_table').DataTable({
                "bDestroy": true,
                "aaSorting": [[0, "asc"]],
                "columns": [
                    null,
                    {"orderable": false},
                    null,
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    null,
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false}
                ],
                "drawCallback": function (settings) {
                    //清空全选状态
                    //laber_text(false);
                    d(":checkbox", d('#table_wrapper')).prop('checked', false);
                }
            });
            perfor_table.page.len(default_num).draw();

            manage_table = d('#manage_table').DataTable({
                "bDestroy": true,
                "aaSorting": [[1, "asc"]],
                "columns": [
                    {"orderable": false},
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                ],
                "drawCallback": function (settings) {
                    //清空全选状态
                    laber_text(false);
                    d(":checkbox", d('#manage_table_wrapper')).prop('checked', false);
                }
            });
            manage_table.page.len(default_num).draw();
        }
    }

    d('#manage_table').on("change", ":checkbox", function () {
        if (d(this).is("[name='checked-all']")) {
            d(":checkbox:enabled", d('#manage_table')).prop("checked", d(this).prop("checked"));
            laber_text(d(this).prop("checked"));
        } else {
            var checkbox = d("tbody :checkbox:enabled", d('#manage_table'));
            d(":checkbox[name='checked-all']", d('#manage_table')).prop('checked', checkbox.length == checkbox.filter(':checked:enabled').length);
            laber_text(checkbox.length == checkbox.filter(':checked:enabled').length);
        }
    }).on("click", ".row-checkbox", function (event) {
        !d(event.target).is(":checkbox") && d(":checkbox", this).trigger("click");
    });

    function laber_text(status) {
        if (status) {
            d("[for='allchecked']").text(disselectall_tab);
        } else {
            d("[for='allchecked']").text(selectall_tab);
        }
    }

    function findgroup(mymac) {
        var group_info = {};
        for (var i = 0; i < ac_group_info.group_sum.group_sum; i++) {
            var group_num_str = "group" + i;
            var one_group = ac_group_info[group_num_str];
            if (one_group.group_name && one_group.member_mac && (one_group.member_mac.indexOf(mymac) > -1)) {
                group_info = one_group;
                break;
            } else {
                group_info = ac_group_info['group0'];
            }
        }
        return group_info;
    }

    et.editlist = function (evt) {
        clear_all();
        d('li[id^="tab_nav_"]').removeClass('hide');
        var array_num = evt.parents('tr').find('.ap_list_num').html();
        ap_config_show(array_num);
    };

    function clear_all() {
        d('[id^=wifilist_]').html('');
    }

    function ap_config_show(num) {
        d('.require').unbind('blur');
        one_device = aplist[num];
        var wifi_list_id, ssid_id, passwd_id, vlan_id, disabled_id;
        var hwmode_id, htmode_id, shortgi_id, txpower_id, txpower, encrypt_id;
        var disabled_mgnt, hidessid_mgnt, ssid_mgnt, encry_mgnt, key_mgnt;
        var radio_sum = one_device.radio.length;

        if (radio_sum && radio_sum < 2) {
            show_div_box(one_device);
        } else {
            d('[id^=tab_nav_]').removeClass('hide');
        }

        d('#wifitab>li').each(function (n, m) {
            if (!d(m).hasClass('hide')) {
                d(m).click();
                return false;
            }
        });

        ceartrwinfo(one_device);

        g.swich('#switch_hidessid_24g', one_device.wlan_hidden_24g);
        g.swich('#switch_hidessid_58g', one_device.wlan_hidden_5g);

        d('#rename_alias').val(one_device.alias);
        d('#wlan_beacon_int').val(one_device.wlan_beacon_int || 100);
        d('#radio_rts').val(one_device.radio_rts || 2347);
        d('#wlan_dtim_period').val(one_device.wlan_dtim_period || 2);
        d('#maxassoc_24g').val(one_device.wlan_maxassoc_24g);
        d('#maxassoc_58g').val(one_device.wlan_maxassoc_5g);
        g.swich('#switch_isolate', one_device.wlan_isolate || 0, 1);

        d("#kickout_check_period").val(one_device.kickout_check_period);
        d("#kickout_kickout_period").val(one_device.kickout_kickout_period / 60);
        d("#kickout_signal_flag").val(one_device.kickout_signal_flag);
        g.swich('#switch_wlroam', one_device.kickout_disable, 0);

        if (one_device.timing_weeks != undefined) {
            var timing_weeks = one_device.timing_weeks;

            if (timing_weeks != '') {
                checked_week(timing_weeks.split(','));
            }

            d('#times_0').val(one_device.timing_time);
            g.swich('#reboot_switch', one_device.timing_enable);
            if (one_device.timing_enable == '1') {
                d('#workdays').removeClass('hidden');
                d('#times_0').attr('disabled', false);
            } else {
                d('#workdays').addClass('hidden');
                d('#times_0').attr('disabled', true);
            }

            g.swich('#interval_enable', one_device.interval_enable);
            if (one_device.interval_enable == '1') {
                d('#interval_time_box').removeClass('hidden');
                d('#interval_redial_time').attr('disabled', false);
            } else {
                d('#interval_time_box').addClass('hidden');
                d('#interval_redial_time').attr('disabled', true);
            }
            d('#interval_redial_time').val(one_device.interval_time);
        }


        d.each(one_radio_wifi, function (n, m) {
            var handle_html, this_html;

            hwmode_id = '#hwmode_' + m.flag;
            txpower_id = '#txpower_' + m.flag;
            disabled_id = '#switch_wireless_' + m.flag;
            htmode_id = '#htmode_' + m.flag;
            shortgi_id = '#short_gi_' + m.flag;

            d(htmode_id).val(m.htmode);

            if (m.flag == '24g') {
                d(hwmode_id).val(m.hwmode)
            }

            txpower = m.txpower_level;
            if (txpower === 1000 || txpower === 750 || txpower === 500 || txpower === 250 || txpower === 125 || txpower === 0) {
                d(txpower_id).val(txpower);
            } else {
                d(txpower_id).val(1000);
            }

            d('.country_change').val(m.country || "CN");

            i.append_channel(m.country, m.channel, m.flag, m.htmode, 0, 1);
            i.append_htmode(m.htmode, m.flag);

            g.swich(shortgi_id, String(m.shortgi) || 1, 1);

            d.each(m.wifis, function (x, y) {
                if (x < m.wifis.length - 1) {
                    if (y.ssid == "") return true;
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
                    encry_mgnt = '#encry_mgnt_' + m.flag;
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
        d.each(weeks, function (n, m) {
            d('#weeks_0_' + m).prop('checked', true).attr('data-value', '1');
        })
        if (d('.week_0').length == d('.week_0:checked').length) {
            d('#weeks_all_0').prop('checked', true).attr('data-value', '1');
        }
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
            '<td class="form_right"><span class="tip_name hide" sh_lang="name_or_ssid">' + name_or_ssid + '</span><input maxlength="32" class="form-control require isSSID" type="text" id="' + ssid_id + '"></td>' +
            '<td><select class="form-control" id="' + encrypt_id + '" et="change:changeencrypt"><option value="psk2" selected="selected" >WPA2-PSK</option><option value="none">NONE</option></td>' +
            '<td class="form_right"><span class="tip_name hide" sh_lang="ddns_passwd">' + ddns_passwd + '</span><input maxlength="32" type="text" class="form-control require isSSIDPwd" id="' + passwd_id + '"></td>' +
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

    //add wifilist
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
        this_html += '<td class="form_right"><span class="tip_name hide" sh_lang="name_or_ssid">' + name_or_ssid + '</span><input type="text" maxlength="32" id="ssid_' + n + '_' + i + '" class="form-control require isSSID"></td>';
        this_html += '<td><select id="encrypt_' + n + '_' + i + '" class="form-control" et="change:changeencrypt"><option value="none" selected="selected">NONE</option><option value="psk2">WPA2-PSK</option></select></td>';
        this_html += '<td class="form_right"><span class="tip_name hide" sh_lang="ddns_passwd">' + ddns_passwd + '</span><input type="text" id="passwd_' + n + '_' + i + '" disabled="disabled" class="form-control require notip isSSIDPwd"></td>';
        this_html += '<td class="form_right"><select  class="form-control" id="vid_' + n + '_' + i + '">' + vlan_option(1) + '</select></td>';
        this_html += '<td><a class="table-link" et="click tap:wifi_del"><span class="fa-stack"><i class="fa fa-minus-square-o fa-stack-2x"></i></span></a></td>';
        this_html += '</tr>';
        return this_html;
    }

    //del wifilist
    et.wifi_del = function (evt) {
        evt.parents('tr').remove();
    };

    function show_div_box(one_device) {
        var hide_radio;
        if (one_device.radio[0].is_5g == 0) {
            hide_radio = '58g';
        } else if (one_device.radio[0].is_5g == 1) {
            hide_radio = '24g';
        }
        d('#tab_nav_' + hide_radio).addClass('hide');
    }

    function ceartrwinfo(one_device) {
        var tmp_num, dub_radio;
        dub_radio = one_device.radio.length;
        one_radio_wifi = [];
        d.each(one_device.radio, function (n, m) {
            if (m.hwmode.indexOf('a') < 0) {
                tmp_num = 0;
                one_radio_wifi[tmp_num] = m;
                one_radio_wifi[tmp_num].flag = '24g';
                one_radio_wifi[tmp_num].is_5g = 0;
                one_radio_wifi[tmp_num].radio = 'radio0'
            } else if (m.hwmode.indexOf('a') > -1) {
                if (dub_radio == 1) {
                    tmp_num = 0;
                } else if (dub_radio == 2) {
                    tmp_num = 1;
                }
                one_radio_wifi[tmp_num] = m;
                one_radio_wifi[tmp_num].flag = '58g';
                one_radio_wifi[tmp_num].is_5g = 1;
                one_radio_wifi[tmp_num].radio = 'radio1'
            }

            one_radio_wifi[tmp_num].wifis = [];
            d.each(one_device.vif, function (x, y) {
                if (m.is_5g == y.is_5g) {
                    one_radio_wifi[tmp_num].wifis.push(y);
                }
            });
        });
    }

    et.close_glim = function () {
        volid_glim(0);
    };

    et.open_glim = function () {
        volid_glim(1);
    };

    function volid_glim(status) {
        var a = {}, arg = [], arg_array = [];
        var this_checked = d('#manage_tbody').find('input:checked');


        if (this_checked.length < 1) {
            return;
        }

        if (status == '1') {
            a.led_action = 'on';
        } else {
            a.led_action = 'off';
        }

        this_checked.each(function (n, m) {
            arg = {};
            arg.device_mac = d(m).parents('tr').find('.apmac').text().toLowerCase();
            arg_array.push(arg);
        });

        a.led_ap_member = arg_array;
        set_ledglim(a);
    }

    et.delap = function (evt) {
        var arg;
        if (lock_web) {
            return;
        }
        lock_web = true;
        if (arg = volid_delap(evt)) {
            d('.closewin').click();
            set_delap(arg);
        } else {
            lock_web = false;
        }
    };

    function volid_delap(evt) {
        var a = {}, b = [];
        b[0] = {};
        b[0].mac = evt.parents('tr').find('.apmac').text().toLowerCase();
        a.maclist = b;
        return a;
    }

    et.changestatus = function (evt) {
        var swich_status = evt.attr('data-value');
        var swich_defaut = evt.attr('data-default');
        if (swich_status == 1) {
            swich_status = 0;
        } else {
            swich_status = 1;
        }
        g.swich(evt, swich_status, swich_defaut);
    };

    et.change_htmode = function (evt) {
        var htmode_val = d(evt).val();
        var country_val = d('.country_change').val();
        i.append_channel(country_val, "0", '58g', htmode_val, 0, 1);
    };

    et.change_country = function (evt) {
        var country_val = d(evt).val();
        d('.country_change').val(country_val);

        d.each(one_radio_wifi, function (n, m) {
            i.append_channel(country_val, "0", m.flag, d('#htmode_' + m.flag).val(), 0, 1);
        })
    };

    et.changeencrypt = function (evt) {
        var evt_change = evt.parents('tr').find('input[class*="isSSIDPwd"]');
        if (evt_change.attr('disabled')) {
            evt_change.attr('disabled', false);
        } else {
            evt_change.attr('disabled', true).removeClass('borError');
        }
    };

    et.mgntencrychange = function (evt) {
        var radio_flag = evt.attr('data-value');
        var encry = evt.val();
        if (encry == 'none' || encry == '') {
            d('#key_mgnt_' + radio_flag).attr('disabled', true);
        } else {
            d('#key_mgnt_' + radio_flag).attr('disabled', false);
        }
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

    et.rebootap = function () {
        var this_checked = d('#manage_tbody').find('input:checked');
        var arg, arg_array = [], reboot_mac = {};

        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            arg = {};
            arg.device_mac = d(m).parents('tr').find('.apmac').text().toLowerCase();
            arg_array.push(arg);
        });

        reboot_mac.reboot_ap_member = arg_array;
        reboot_ap_list(reboot_mac);
    };

    et.saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg;

        if (lock_web) {
            return;
        }
        lock_web = true;
        if (arg = volid_wire()) {
            d('.closewin').click();
            set_apconfig(arg);
        } else {
            lock_web = false;
        }
    };

    function volid_wire() {
        var oThis, listsinfo, listlength, hidden, disabled, encryp_way, ssid_value, psk_value, vid_value, radio_config = [], wifi_array = [], config = {};

        var week_arr = [];

        var error_flag = 0;
        d.each(one_radio_wifi, function (n, m) {
            var channels_val = d('#channels_' + m.flag).val();
            if (channels_val == 'auto') {
                channels_val = 0;
            }

            var only_radio_wifi = [];
            radio_config[n] = {};

            radio_config[n].phyname = m.radio;
            radio_config[n].htmode = d('#htmode_' + m.flag).val();
            radio_config[n].country = d('.country_change').val();
            radio_config[n].channel = parseInt(channels_val);
            radio_config[n].txpower_level = parseInt(d('#txpower_' + m.flag).val());
            radio_config[n].shortgi = parseInt(d('#short_gi_' + m.flag).attr('data-value'));
            radio_config[n].is_5g = m.is_5g;

            delete(radio_config[n].txPower);

            disabled = d('#switch_wireless_' + m.flag).attr('data-value');
            /*get wifi_config*/
            listsinfo = d("[id^='wifi_" + m.flag + "_']");
            listlength = listsinfo.length;
            for (var i = 0; i < listlength; i++) {
                oThis = d(listsinfo[i]);
                ssid_value = oThis.find('[id^="ssid_' + m.flag + '_"]').val();
                encryp_way = oThis.find('[id^="encrypt_' + m.flag + '_"]').val();
                psk_value = oThis.find('[id^="passwd_' + m.flag + '_"]').val();

                if (encryp_way == "psk2") {
                    if (psk_value.length < 8 || psk_value.length > 32) {
                        error_flag = 1;
                        return false;
                    }
                }
                vid_value = oThis.find('[id^="vid_' + m.flag + '_"]').val();
                only_radio_wifi[i] = new_iface(disabled, ssid_value, encryp_way, psk_value, 8 * n + i, m.flag, vid_value);
            }

            disabled = d('#switch_wireless_mgnt_' + m.flag).attr('data-value');
            encryp_way = d('#encry_mgnt_' + m.flag).val();
            psk_value = d('#key_mgnt_' + m.flag).val();

            if (encryp_way == "psk2") {
                if (psk_value.length < 8 || psk_value.length > 32) {
                    error_flag = 1;
                    return false;
                }
            }

            ssid_value = d('#ssid_mgnt_' + m.flag).val();
            hidden = d('#switch_hidessid_mgnt_' + m.flag).attr('data-value');

            var mgnt_flag;
            if (m.flag == '24g') {
                mgnt_flag = '2g'
            } else {
                mgnt_flag = '5g'
            }
            only_radio_wifi.push(manager_iface(disabled, ssid_value, encryp_way, psk_value, '_admin_' + mgnt_flag, m.flag));
            //m.wifis[m.wifis.length - 1] = manager_iface(n, d('#ssid_manger_' + m.flag).val(), d('#passwd_manger_' + m.flag).val(), '_admin_' + adminflag);
            d.each(only_radio_wifi, function (x, y) {
                wifi_array.push(y);
            })
        });

        if (error_flag) {
            h.ErrorTip(tip_num++, key_length_note);
            return;
        }

        d.each(weeks_num, function (x, y) {
            var week_id = "#weeks_0_" + y;
            if (d(week_id).prop("checked") == true) {
                week_arr.push(y)
            }
        });

        dev_config.timing_enable = d('#reboot_switch').attr('data-value');
        dev_config.timing_weeks = week_arr.join(',');
        dev_config.timing_time = d('#times_0').val();
        dev_config.interval_enable = d('#interval_enable').attr('data-value');
        dev_config.interval_time = d('#interval_redial_time').val();

        dev_config.device_mac = one_device.mac;
        dev_config.alias = d('#rename_alias').val();
        dev_config.wlan_hidden_24g = parseInt(d('#switch_hidessid_24g').attr('data-value')) || 0;
        dev_config.wlan_hidden_5g = parseInt(d('#switch_hidessid_58g').attr('data-value') || 0);
        dev_config.wlan_maxassoc_24g = parseInt(d('#maxassoc_24g').val());
        dev_config.wlan_maxassoc_5g = parseInt(d('#maxassoc_58g').val());
        dev_config.wlan_beacon_int = parseInt(d('#wlan_beacon_int').val());
        dev_config.wlan_dtim_period = parseInt(d('#wlan_dtim_period').val());
        dev_config.wlan_isolate = parseInt(d('#switch_isolate').attr('data-value'));
        dev_config.radio_rts = parseInt(d("#radio_rts").val());
        dev_config.radio = radio_config;
        dev_config.vif = wifi_array;
        dev_config.kickout_disable = parseInt(d('#switch_wlroam').attr('data-value'));
        dev_config.kickout_check_period = parseInt(d("#kickout_check_period").val());
        dev_config.kickout_kickout_period = d("#kickout_kickout_period").val() * 60;
        dev_config.kickout_signal_flag = parseInt(d("#kickout_signal_flag").val());
        config.config_ap = [];
        config.config_ap.push(dev_config);
        return config
    }

    function new_iface(disabled, ssid, encryp, passwd, wlannum, flag, vid) {
        var wlanname = "wlan" + wlannum;
        var iface_config = {};

        iface_config.ssid = ssid;
        iface_config.encryp_way = encryp;
        if (encryp != 'none') {
            iface_config.key = passwd || '';
        }

        iface_config.disabled = parseInt(disabled);
        //iface_config.phyname = radioname;
        iface_config.name = wlanname;

        if (flag == '24g') {
            iface_config.is_5g = 0;
            iface_config.phyname = 'radio0';
        } else {
            iface_config.is_5g = 1;
            iface_config.phyname = 'radio1';
        }
        //iface_config.vid = parseInt(vid);

        return iface_config;
    }

    function manager_iface(radio_num, disabled, ssid, encryp, passwd, wlannum, flag) {
        return new_iface(radio_num, disabled, ssid, encryp, passwd, wlannum, flag);
    }

    function reboot_ap_list(arg) {
        f.setMConfig('ap_reboot_action', arg, function (d) {
            if (d.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        })
    }

    /*设置*/
    function set_apconfig(arg) {
        f.setMConfig('ap_detail_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        })
    }

    function set_ledglim(arg) {
        f.setMConfig('ap_led_action', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        })
    }

    function set_delap(arg) {
        f.setMConfig('system_ac_list_del', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        })
    }

    function reset_lock_web() {
        lock_web = false;
    }

    function gohref() {
        location.href = location.href;
    }

    b.init = init;
});
