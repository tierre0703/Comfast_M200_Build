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

    var action, iplimit, qos_info, macfilter, flow_net;
    var this_table, lock_web = false, tip_num = 0, default_num = 100;

    function init() {
        d('.select_line').val(default_num);
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('qos_ip_limit', function (data) {
            if (data && data.errCode == 0) {
                iplimit = data.list || [];
                qos_info = data.qos;
            }
        }, false);

        f.getMConfig('macft_config', function (data) {
            if (data && data.errCode == 0) {
                macfilter = data.macfilter_list || [];
            }
        }, false);

        netstats();
    }

    function netstats() {
        f.getSConfig('net_stats_get', function (data) {
            if (data && data.errCode == 0) {
                flow_net = data.flow_net.sort(function (n, m) {
                    return m.ur - n.ur;
                }) || [];
                showtable();
            }
        })
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(flow_net, function (n, m) {
            var devip, txrate, upload, rxrate, download, uptime, mac, limit_real_num = '', limit_uprate = '',
                limit_downrate = '';
            devip = m.ip;
            txrate = m.ur;
            upload = m.ub;
            mac = m.mac;
            uptime = m.t;
            rxrate = m.dr;
            download = m.db;

            // && iplimit.length
            if (iplimit.length > 0) {
                d.each(iplimit, function (x, y) {
                    if (y.ip == devip) {
                        limit_real_num = y.real_num || '';
                        (y.uprate.length == 0) ? limit_uprate : limit_uprate = y.uprate / 8;
                        (y.downrate.length == 0) ? limit_downrate : limit_downrate = y.downrate / 8;
                        return false;
                    }
                });
            }

            this_html += '<tr class="text-center">';
            this_html += '<td class="hide limit_real_num">' + limit_real_num || '' + '</td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="dev_ip">' + devip + '</td>';
            this_html += '<td>' + g.bytesTosizePerSec(txrate, 2) + '</td>';
            this_html += '<td>' + g.bytesTosizePerSec(rxrate, 2) + '</td>';
            this_html += '<td>' + g.bytesTosize(upload, 2) + '</td>';
            this_html += '<td>' + g.bytesTosize(download, 2) + '</td>';
            this_html += '<td>' + (uptime ? g.formatTime(parseInt(uptime)) : acconfig_offline) + '</td>';
            this_html += '<td class="hide filter_mac">' + mac + '</td>';
            this_html += '<td class="hide limit_uprate">' + limit_uprate || '' + '</td>';
            this_html += '<td class="hide limit_downrate">' + limit_downrate || '' + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:editConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a>';
            this_html += '<a data-toggle="modal" data-target="#modal_filter" class="table-link danger"  et="click tap:filtermac"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + blacklist_add + '" class="fa fa-arrow-circle-up fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '</tr>';
        });
        d('#tbody_info').html(this_html);

        if (flow_net.length > 0) {
            this_table = d('#table').DataTable({
                "aaSorting": [[1, "asc"]],
                "columns": [
                    {"orderable": false},
                    null,
                    {type: 'ip', targets: 0},
                    {type: 'traffic', targets: 0},
                    {type: 'traffic', targets: 1},
                    {type: 'traffic', targets: 2},
                    {type: 'traffic', targets: 3},
                    null,
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": false}
                ]
            });
            this_table.page.len(default_num).draw();
        }
    }

    et.refresh_list = function () {
        gohref();
    };

    et.displayline = function (evt) {
        default_num = d(evt).val();
        if (flow_net.length > 0) {
            this_table.page.len(default_num).draw();
        }
        d(evt).blur();
    };

    et.editConfig = function (evt) {
        g.clearall();
        action = 'add';
        d('#ip').val(d(evt).parents('tr').find('.dev_ip').html() || '');
        d('#limit_real_num').val(d(evt).parents('tr').find('.limit_real_num').html() || '');
        d('#limit_uprate').val(d(evt).parents('tr').find('.limit_uprate').html() || '');
        d('#limit_downrate').val(d(evt).parents('tr').find('.limit_downrate').html() || '');
    };

    et.saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_volide()) {
            lock_web = false;
            d('.closewin').click();
            if (iplimit.length == 0 && arg_data.operate == "del") {
                set_ok_tip();
            } else {
                set_config(arg_data);
            }
        } else {
            lock_web = false;
        }
    };

    et.filtermac = function (evt) {
        var filter_mac = evt.parents('tr').find('.filter_mac').html();
        var real_num_mac = evt.parents('tr').find('.rnum_mac').html() || '';
        d('#filter_mac').html(filter_mac);
        d('#filter_real_num').val(real_num_mac);
    };

    et.savefilter = function () {
        d('.closewin').click();
        var filter_mac = d('#filter_mac').html();
        var a = {};

        var optflag = "add";
        d.each(macfilter, function (n, m) {
            if (m.src_mac == filter_mac.toLowerCase()) {
                a.real_num = m.real_num;
                optflag = 'edit'
            }
        });
        a.mac_black = '1';
        a.operate = optflag;
        a.src_mac = filter_mac.toLowerCase();
        set_macfilter(a);
    };

    et.del_select = function () {
        action = 'del';
        var a = {}, this_checked;
        a.list = [];
        a.list[0] = {};
        a.list[0].list = '';
        this_checked = d('#tbody_info').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            a.list[0].list += d(m).parents('tr').find('.real_num').text() + ',';
        });
        a.list[0].action = action;
        set_config(a);
    };

    function set_volide() {
        var a = {};
        var optflag;

        a.enable = "1";
        a.ip = d("#ip").val();
        (d("#limit_uprate").val() == 0) ? a.uprate = '' : a.uprate = '' + d("#limit_uprate").val() * 8;
        (d("#limit_downrate").val() == 0) ? a.downrate = '' : a.downrate = '' + d("#limit_downrate").val() * 8;
        a.share = "1";

        if (d("#limit_real_num").val() != "" ) {
            if(a.uprate != "" || a.downrate != ""){
                optflag = 'edit';
                a.real_num = parseInt(d("#limit_real_num").val());
            }else {
                a.list = d("#limit_real_num").val() + ',';
                optflag = 'del';
            }
        } else {
            if(a.uprate != "" || a.downrate != ""){
                optflag = 'add';
            }
        }

        a.operate = optflag;
        a.enable_limit = "1";
        return a;
    }

    function set_config(arg) {
        f.setMConfig('qos_ip_limit', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000);
            }
        });
    }

    function set_ok_tip() {
        h.SetOKTip(tip_num++, set_success);
        setTimeout(reset_lock_web, 3000);
    }

    function set_macfilter(arg) {
        f.setMConfig('macft_config', arg, function (data) {
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

    function gohref() {
        location.href = location.href;
    }

    b.init = init;
});
