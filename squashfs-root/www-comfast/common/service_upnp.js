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

    var upnp_enable, upnp_list, action;
    var this_table, lock_web = false, tip_num = 0, default_num = 10;

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

        f.getMConfig('upnp_config', function (data) {
            if (data && data.errCode == 0) {
                upnp_enable = data.upnpd.enable_upnp;
                upnp_switch();
            }
        });

        f.getMConfig('upnp_list', function (data) {
            upnp_list = [];
            if (data.errCode == 0 && upnp_enable && data.upnpd && data.upnpd.length > 0) {
                d.each(data.upnpd, function (n, m) {
                    upnp_list.push(m);
                });
                showtable();
            }
        });
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(upnp_list, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td class="hide"><input class="checked_list" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td>' + m.proto + '</td>';
            this_html += '<td>' + m.ipaddr + '</td>';
            this_html += '<td>' + m.eport + '</td>';
            this_html += '<td>' + m.iport + '</td>';
            this_html += '<td>' + m.desc + '</td>';
            this_html += '</tr>';
        })

        d("#tbody_info").html(this_html);

        if (upnp_list.length > 1) {
            this_table = d('#table').DataTable({
                "columns": [
                    {"orderable": false},
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
                ]
            });
            this_table.page.len(default_num).draw();
        }
    }

    function upnp_switch() {
        g.swich('#switch', upnp_enable);
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
        set_swich(swich_status);
        g.swich(evt, swich_status, swich_defaut);
    };

    function set_swich(arg) {
        var a = {};
        a.enable_upnp = '' + arg;
        f.setMConfig('upnp_config', a, function (data) {
        })
    }

    b.init = init;
});
