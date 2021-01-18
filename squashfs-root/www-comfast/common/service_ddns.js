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

    var ddns_info, wanlist, iface_arr = [], line_name = {}, action;
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
        f.getMConfig('mwan_capability_config', function (data) {
            if (data.errCode == 0) {
                wanlist = data.wanlist || [];
                ifaceoption();
            }
        });

        f.getMConfig('ddns_config', function (data) {
            if (data.errCode == 0) {
                ddns_info = data.ddns || [];
                showtable();
            }
        });
    }

    function ifaceoption() {
        var this_html = '';
        d.each(wanlist, function (n, m) {
            iface_arr.push(m.iface);
            line_name[m.iface] = m.name.toUpperCase();
            this_html += '<option value="' + m.iface + '">' + m.name.toUpperCase() + '</option>';
        })
        d('#interfacename').html(this_html)
    }

    function showtable() {
        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(ddns_info, function (n, m) {
            var sourcename, nothing;
            if (m.ip_source == 'network') {
                sourcename = ddns_interface;
            } else {
                sourcename = ddns_web;
            }
            nothing = '<i class="fa fa-minus" style="padding: 6px;font-size: 0.875em;"></i>';

            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num" style="display: none">' + m.real_num + '</td>';
            this_html += '<td><input class="row-checkbox" type="checkbox"/></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            if (m.enabled == 1) {
                this_html += '<td class="ddns_enabled" data-value="1">' + main_enabled + '</td>';
            } else {
                this_html += '<td class="ddns_enabled" data-value="0">' + main_disabled + '</td>';
            }
            this_html += '<td class="ddns_sername">' + m.service_name + '</td>';
            this_html += '<td class="ddns_domain">' + m.domain + '</td>';
            this_html += '<td class="ddns_username">' + m.username + '</td>';
            this_html += '<td class="ddns_psd">' + m.password + '</td>';
            this_html += '<td >' + sourcename + '</td>';

            if (line_name[m.ip_network] == undefined || line_name[m.ip_network] == '') {
                this_html += '<td>' + nothing + '</td>';
            } else {
                this_html += '<td>' + line_name[m.ip_network] + '</td>';
            }

            this_html += '<td class="ddns_ipsource hidden">' + m.ip_source + '</td>';
            this_html += '<td class="ddns_ipnetwork hidden">' + m.ip_network + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:edit"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a>' +
                '</td>';
            this_html += '</tr>';
        });
        d("#tbody_info").html(this_html);

        if (ddns_info.length > 0) {
            this_table = d('#table').DataTable({
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
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
                    {"orderable": false}
                ],
                "drawCallback": function () {
                    laber_text(false);
                    d(":checkbox", d('#table_wrapper')).prop('checked', false);
                }
            });
            this_table.page.len(default_num).draw();
        }
    }

    d('#table').on("change", ":checkbox", function () {
        if (d(this).is("[name='checked-all']")) {
            d(":checkbox:enabled", d('#table')).prop("checked", d(this).prop("checked"));
            laber_text(d(this).prop("checked"));
        } else {
            var checkbox = d("tbody :checkbox:enabled", d('#table'));
            d(":checkbox[name='checked-all']", d('#table')).prop('checked', checkbox.length == checkbox.filter(':checked:enabled').length);
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

    et.displayline = function (evt) {
        default_num = d(evt).val();
        if (ddns_info.length != 0) {
            this_table.page.len(default_num).draw();
        }
        d(evt).blur();
    };

    et.switchConfig = function (evt) {
        switch_disabled(evt, evt.val())
    };

    function switch_disabled(obj, num) {
        if (num == 0) {
            d('.modal-body input').attr('disabled', true);
            d('.modal-body select').attr('disabled', true);
        } else {
            d('.modal-body input').attr('disabled', false);
            d('.modal-body select').attr('disabled', false);
        }
        d(obj).attr('disabled', false);
    }

    et.add_list = function () {
        action = "add";
        g.clearall();
        d('#interfacelist').removeClass('hide');
    };

    et.srcipselect = function () {
        var src_ip = d("#src_ip").val();
        if (src_ip == "network") {
            d("#interfacelist").removeClass('hide');
        } else {
            d("#interfacelist").addClass('hide');
        }
    };

    et.saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_volide()) {
            d('#closewin').click();
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    function set_volide() {
        var a = {}, b = {};

        if (action == 'add' && ddns_info.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        a.list = [];

        if (action == "edit") {
            b.real_num = parseInt(d("#real_num").val());
        }
        b.action = action;
        b.enabled = d("#switch").val();

        b.domain = d.trim(d("#domain").val());
        b.username = d("#username").val();
        b.password = d("#password").val();
        b.service_name = d("#service_name").val();
        b.ip_source = d("#src_ip").val();
        if (b.ip_source == 'network') {
            b.ip_network = d("#interfacename").val();
            if (d.inArray(b.ip_network, iface_arr) < 0) {
                h.ErrorTip(tip_num++, ddns_select_iface);
                return false;
            }
        } else {
            b.ip_network = '';
        }
        a.list.push(b);
        return a;
    }

    et.del_select = function () {
        var a = {}, b = {}, this_checked;
        a.list = [];
        this_checked = d('#tbody_info').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        b.action = "del";
        b.list = '';
        this_checked.each(function (n, m) {
            b.list += d(m).parents('tr').find('.real_num').text() + ',';
        });
        a.list.push(b);
        set_config(a);
    };

    et.edit = function (evt) {
        action = "edit";
        g.clearall();
        setform(evt);
    };

    function setform(evt) {
        var ddns_enabled, ddns_sername, ddns_domain, ddns_username, ddns_psd, ddns_ipsource, ddns_ipnetwork, real_num;
        ddns_enabled = d(evt).parents('tr').find('.ddns_enabled').attr('data-value');
        ddns_sername = d(evt).parents('tr').find('.ddns_sername').text();
        ddns_domain = d(evt).parents('tr').find('.ddns_domain').text();
        ddns_username = d(evt).parents('tr').find('.ddns_username').text();
        ddns_psd = d(evt).parents('tr').find('.ddns_psd').text();
        ddns_ipsource = d(evt).parents('tr').find('.ddns_ipsource').text();
        ddns_ipnetwork = d(evt).parents('tr').find('.ddns_ipnetwork').text();
        real_num = d(evt).parents('tr').find('.real_num').text();

        d("#switch").val(ddns_enabled);
        switch_disabled('#switch', ddns_enabled);
        d("#service_name").val(ddns_sername);
        d("#domain").val(ddns_domain);
        d("#username").val(ddns_username);
        d("#password").val(ddns_psd);
        d("#src_ip").val(ddns_ipsource);
        if (ddns_ipsource == 'network') {
            d("#interfacename").val(ddns_ipnetwork);
        } else {
            d("#interfacelist").addClass('hide')
        }

        d("#real_num").val(real_num);
    }

    function set_config(arg) {
        f.setMConfig('ddns_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        });
    }

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});
