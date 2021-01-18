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

    var dhcp_status, arp_list, dhcp_info, assoc_info, filter_data, filter_type, filter_info = [], assoc_array = [], filter_array, set_num = [], now_num, optflag;

    var online_table, black_table, lock_web = false, tip_nums = 0, default_num = 10;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('wireless_filter_config', function (data) {
            filter_data = data.wifi_filters;
            if (filter_data.length > 0) {
                filter_type = filter_data[0].macfilter;
                filter_info = filter_data[0].wifi_filter || [];
            }
        }, false);

        f.getMConfig('lan_dhcp_config', function (data) {
            if (data.errCode == 0) {
                dhcp_status = data.lanlist[0].dhcp.enable;
            }
        }, false);

        f.getMConfig('wireless_assoc_client_info', function (data) {
            if (data.errCode == 0) {
                assoc_info = data['wifi-iface'];
            }
        }, false);

        f.getMConfig('arp_list', function (data) {
            if (data.errCode == 0) {
                arp_list = data.arp_list;
            }
        }, false);

        f.getMConfig('dhcp_list', function (data) {
            if (data.errCode == 0) {
                dhcp_info = data.dhcp;
            }
        }, false);
        assoc_and_filter();
    }

    function assoc_and_filter() {
        filter_init();
        assoc_init();
    }

    function assoc_init() {
        var i = 0;
        assoc_array = [];
        d.each(assoc_info, function (n, m) {
            if (m && m.length > 1 && m.ifname != 'vif-sta0') {
                d.each(m, function (x, y) {
                    if (x != 0) {
                        var filter_flag;
                        d.each(filter_array, function (z, l) {
                            if (y.mac == l.macaddr || y.mac.toUpperCase() == l.macaddr || y.mac == l.macaddr.toUpperCase()) {
                                filter_flag = 1;
                                return false;
                            }
                        })
                        if (filter_flag) {
                            return false;
                        }
                        assoc_array[i] = y;
                        var dhcp_flag = 0, arp_flag = 0;
                        if (dhcp_status == '1') {
                            d.each(dhcp_info, function (z, l) {
                                if (y.mac == l.mac || y.mac == l.mac.toUpperCase() || y.mac.toUpperCase() == l.mac) {
                                    dhcp_flag = 1;
                                    assoc_array[i] = d.extend({}, y, l);
                                }
                            })
                        }
                        if (dhcp_flag) {
                            i++;
                            return true;
                        }

                        d.each(arp_list, function (z, l) {
                            if (y.mac.toUpperCase() == l.mac.toUpperCase()) {
                                arp_flag = 1;
                                assoc_array[i] = d.extend({}, y, l);
                            }
                        });

                        if (arp_flag) {
                            i++;
                            return true;
                        }
                        i++;
                    }
                })
            }
        });
        show_online_table();
    }

    function show_online_table() {
        var this_html = '';

        d('#online_table').dataTable().fnClearTable();
        d('#online_table').dataTable().fnDestroy();

        d.each(assoc_array, function (n, m) {
            var commentname, mip;
            if (m.commentname == undefined) {
                commentname = '*'
            } else {
                commentname = m.commentname;
            }

            if (m.ip == undefined) {
                mip = '*'
            } else {
                mip = m.ip;
            }

            this_html += '<tr>';
            this_html += '<td class="hidden"></td>';
            this_html += '<td class="text-center user_name" style="width: 10%">' + commentname || '' + '</td>';
            this_html += '<td class="text-center user_ip">' + mip + '</td>';
            this_html += '<td class="text-center user_mac">' + m.mac.toUpperCase() + '</td>';
            this_html += '<td class="text-center user_rxbytes">' + bytesToSize(m.rxbytes) + '</td>';
            this_html += '<td class="text-center user_txbytes">' + bytesToSize(m.txbytes) + '</td>';
            this_html += '<td class="text-center user_time">' + contimes(m.contime) + '</td>';
            this_html += '<td class="text-center"><a class="table-link danger" et="click tap:add_black"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i sh_title="prohibited_link" title="' + prohibited_link + '" class="fa fa-unlink fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '</tr>';
        });
        d("#online_device_list").html(this_html);

        if (assoc_array.length > 0) {
            online_table = d('#online_table').DataTable({
                "columns": [
                    {"orderable": false},
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    {"orderable": false}
                ]
            });
            online_table.page.len(default_num).draw();
        }
    }

    function bytesToSize(bytes) {
        if (!bytes) {
            return '*';
        }
        if (bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));

        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }

    function contimes(totalSeconds) {
        if (totalSeconds < 86400) {
            var dt = new Date("01/01/2000 0:00");
            dt.setSeconds(totalSeconds);
            return formatTime(dt);
        } else {
            return null;
        }
    }

    function formatTime(dt) {
        var h = dt.getHours(),
            m = dt.getMinutes(),
            s = dt.getSeconds(),
            r = "";
        if (h > 0) {
            r += (h > 9 ? h.toString() : "0" + h.toString()) + ":";
        }
        r += (m > 9 ? m.toString() : "0" + m.toString()) + ":";
        r += (s > 9 ? s.toString() : "0" + s.toString());
        return r;
    }

    function filter_init() {
        filter_array = [];
        if (!filter_info.length) {
            filter_info = [];
        }

        d.each(filter_info, function (n, m) {
            filter_array.push(m);
        });
        show_black_table();
    }

    function show_black_table() {
        var this_html = '';

        d('#black_table').dataTable().fnClearTable();
        d('#black_table').dataTable().fnDestroy();

        d.each(filter_array, function (n, m) {
            set_num.push(m.num);
            this_html += '<tr>';
            this_html += '<td class="text-center user_num hide">' + m.num + '</td>';
            this_html += '<td class="text-center user_name">' + (m.name || '*' ) + '</td>';
            this_html += '<td class="text-center user_mac">' + m.macaddr.toUpperCase() + '</td>';
            this_html += '<td class="text-center"><a class="table-link link" et="click tap:del_black"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i sh_title = "allow_link" title="' + allow_link + '" class="fa fa-link fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '</tr>';
        });
        d("#prohibited_device_list").html(this_html);

        if (filter_array.length > 0) {
            black_table = d('#black_table').DataTable({
                "columns": [
                    {"orderable": false},
                    null,
                    null,
                    {"orderable": false}
                ]
            });
            black_table.page.len(default_num).draw();
        }
    }

    function reckonnum() {
        if (set_num.join(',').indexOf(now_num) > -1) {
            now_num++;
            reckonnum();
        }
    }

    et.add_black = function (evt) {
        var a = {}, b = [], c = [];
        now_num = 0;
        c[0] = {};

        c[0].num = reckonnum() || now_num;
        c[0].macaddr = d(evt).parents('tr').find('.user_mac').text().toLowerCase();
        c[0].name = d(evt).parents('tr').find('.user_name').text().toLowerCase();

        d.each(assoc_info, function (n, m) {
            if (m.ifname != 'vif-sta0') {
                b[n] = {};
                b[n].maclist = c;
                b[n].iface = n;
                b[n].macfilter = "deny";
                b[n].action = "add";
            }
        });
        a.wifi_filters = b;
        set_config(a);
    }

    et.prev = function () {
        location.href = 'index.html';
    }

    et.del_black = function (evt) {
        var a = {}, b = [], c = [], remove_mac, remove_num;
        c[0] = {};
        remove_mac = d(evt).parents('tr').find('.user_mac').text().toLowerCase();
        remove_num = d(evt).parents('tr').find('.user_num').text().toLowerCase();
        d.each(filter_info, function (n, m) {
            if (remove_mac == m.macaddr) {
                c[0].num = parseInt(remove_num);
                c[0].macaddr = m.macaddr;
            }
        });
        c[0].name = "";

        d.each(filter_data, function (n, m) {
            b[n] = {};
            b[n].maclist = c;
            b[n].macfilter = "deny";
            b[n].iface = n;
            b[n].action = "del";
        });
        a.wifi_filters = b;
        set_config(a);
    }

    function set_config(arg) {
        f.setMConfig('wireless_filter_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_nums++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_nums++, set_success);
                setTimeout(refresh_init, 1000);
                setTimeout(reset_lock_web, 3000);
            }
        });
    }

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});
