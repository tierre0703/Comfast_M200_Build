define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);
    require('datatables')(d);
    require('tabletool')(d);

    var ac_group_info, vlan_list, aplist, new_aplist, current_ac_status, group_obj, tip_num = 0;
    var this_table, default_num = 10;

    var new_device_list, dhcp_list;

    function init() {
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

    function showtable() {
        d('#select_laber').text(selectall_tab);
        d('#allchecked').attr('data-value', '0');
        new_aplist = [];
        d.each(aplist, function (n, m) {
            if (m.offline_flag == 'online') {
                new_aplist.push(m);
            }
        });
        list_show();
    }

    function list_show() {
        var perfor_html = '';
        d('#perfor_table').dataTable().fnClearTable();
        d('#perfor_table').dataTable().fnDestroy();
        d.each(new_aplist, function (n, m) {
            var hasradio_24g = 0, hasradio_58g = 0, stacount_sum_24g = 0, stacount_sum_58g = 0, stacount_sum,
                group_config, group_config_name;

            d.each(m.vif, function (x, y) {
                if (y.is_5g == 0) {
                    stacount_sum_24g += y.staCount;
                } else if (y.is_5g == 1) {
                    stacount_sum_58g += y.staCount;
                }
            });

            d.each(m.radio, function (x, y) {
                if (y.is_5g == 0) {
                    hasradio_24g = 1;
                } else if (y.is_5g == 1) {
                    hasradio_58g = 1;
                }
            });

            stacount_sum = stacount_sum_24g + stacount_sum_58g;

            if (!hasradio_24g) {
                stacount_sum_24g = '*';
            }

            if (!hasradio_58g) {
                stacount_sum_58g = '*';
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

            perfor_html += '<tr id="tr_' + n + '" data-option = "trinfo_' + n + '" data-open="0" class="text-center row-click">';
            perfor_html += '<td>' + (n + 1) + '</td>';
            perfor_html += '<td class="apmac">' + m.mac.toUpperCase() + '</td>';
            perfor_html += '<td>' + m.wan_ip + '</td>';
            perfor_html += '<td>' + stacount_sum_24g + '/' + stacount_sum_58g + '/' + stacount_sum + '</td>';
            perfor_html += '<td>' + g.formatsecond(m.uptime) + '</td>';

            perfor_html += '<td>' + deviceName.toUpperCase() + '</td>';
            perfor_html += '<td>' + deviceVersion + '</td>';
            if (is_defalut_group) {
                perfor_html += '<td sh_lang="defalut_group">' + group_config_name + '</td>';
            } else {
                perfor_html += '<td title="' + group_config_name + '">' + g.omittext(group_config_name, 6) + '</td>';
            }
            perfor_html += '</tr>';
            perfor_html += '<tr id="trinfo_' + n + '" class="hidden"><td colspan="8" style="border-top: none;padding: 0"><div class="child_table_frame">';
            perfor_html += append_childtable(m.mac);
            perfor_html += '</div></td></tr>';
        });
        d("#perfor_tbody").html(perfor_html);
    }

    function append_childtable(n) {
        var tmp_html = '<table class="child_table">';
        tmp_html += '<thead><tr>';
        tmp_html += '<th class="text-center hidden"></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:80px">' + ac_terminalIp + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:120px">' + ac_terminalMac + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:120px">' + ac_apSsid + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:120px">' + ac_apSsidRange + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:120px">' + ac_apSignal + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:66px">' + ac_terminalLinkTime + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:66px">' + ac_terminalTxByte + '</span></th>';
        tmp_html += '<th class="text-center" style="width:10%"><span style="width:66px">' + ac_terminalRxByte + '</span></th>';
        tmp_html += '</tr></thead>';
        tmp_html += '<tbody class="tbody_' + n.split(":").join("") + '" id="tbody_' + n.split(":").join("") + '">';
        tmp_html += '</tbody></table>';
        return tmp_html;
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

    d("#perfor_tbody").on("click", ".row-click", function (n, m) {
        var data = {};
        var row_click = d(this);
        var trinfo = d(this).attr("data-option");
        var open_flag = d(this).attr("data-open");
        var mac_addr = row_click.find('.apmac').text().toLowerCase();

        if (open_flag == 0) {
            data.mac = mac_addr;
            f.getMConfig('dhcp_list', function (data) {
                if (data.errCode == 0) {
                    dhcp_list = data.dhcp;
                }
            }, false);
            f.setMConfig('ac_list_sta_mac', data, function (data) {
                if (data.errCode == 0) {
                    var ap_device = data.list_sta || [];
                    if (ap_device[0].vif.length > 0) {
                        row_click.attr("data-open", "1");
                        d("#" + trinfo).removeClass("hidden");
                        device_list(ap_device);
                        showchildtable(mac_addr.split(":").join(""));
                    } else {
                        h.WarnTip(tip_num++, ac_noterminal);
                    }
                }
            });
        } else {
            row_click.attr("data-open", "0");
            d("#" + trinfo).addClass("hidden");
        }
    });

    function device_list(data) {
        new_device_list = [];
        for (var a = 0; a < data.length; a++) {
            var alone_ap = data[a];
            for (var b = 0; b < alone_ap.vif.length; b++) {
                var alone_radio = alone_ap.vif[b];
                for (var c = 0; c < alone_radio.sta.length; c++) {
                    var alone_wifi_device = alone_radio.sta[c].msrtc;
                    var tmp_array = alone_wifi_device.split("|");
                    var tmp_info = {};
                    tmp_info.sup_mac = alone_ap.mac.toLowerCase();
                    tmp_info.sup_version = alone_ap.soft_version;
                    tmp_info.is_5g = alone_radio.is_5g;
                    tmp_info.ssid = alone_radio.ssid;
                    tmp_info.terminalMac = tmp_array[0].toLowerCase();
                    tmp_info.signal = tmp_array[1];
                    tmp_info.txbyte = tmp_array[2];
                    tmp_info.rxbyte = tmp_array[3];
                    tmp_info.linktime = tmp_array[4];
                    tmp_info.terminalIP = "*";
                    for (var d = 0; d < dhcp_list.length; d++) {
                        if (tmp_info.terminalMac == dhcp_list[d].mac) {
                            tmp_info.terminalIP = dhcp_list[d].ip;
                            break;
                        }
                    }
                    new_device_list.push(tmp_info);
                }
            }
        }
    }

    function showchildtable(macstr) {
        var this_html = '';
        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();
        d.each(new_device_list, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td>' + m.terminalIP + '</td>';
            this_html += '<td>' + m.terminalMac.toUpperCase() + '</td>';
            this_html += '<td title="' + m.ssid + '">' + m.ssid.split('').slice(0, 16).join('') + '</td>';
            if (m.is_5g == 0) {
                this_html += '<td>2G</td>';
            } else {
                this_html += '<td>5G</td>';
            }

            this_html += '<td>' + m.signal + '</td>';
            this_html += '<td>' + g.uptime_str(m.linktime) + '</td>';
            this_html += '<td>' + g.bytesTosize(parseInt(m.txbyte) * 1024) + '</td>';
            this_html += '<td>' + g.bytesTosize(parseInt(m.rxbyte) * 1024) + '</td>';
            this_html += '</tr>';
        });

        d("#tbody_" + macstr).html(this_html);
        if (new_device_list.length > 0) {
            this_table = d('#table').DataTable({
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true},
                    {"orderable": true}
                ],
                "drawCallback": function () {
                    d(":checkbox", d('#table_wrapper')).prop('checked', false);
                }
            });
            this_table.page.len(default_num).draw();
        }
    }

/*    d('#seach_device_mac').keyup(function () {
        var search_value = d(this).val().replace(/(^\s+)|(\s+$)/g, "");

        if (search_value != '') {
            console.dir("A");
        } else {
            d("#standard").removeClass("hidden");
            d("#seach_device").addClass("hidden");
        }
    });*/

    b.init = init;
});
