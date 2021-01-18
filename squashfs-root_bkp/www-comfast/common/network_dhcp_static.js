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

    var arpstatic_info, arpbindlists_info, dhcp_static, arp_dhcp, arpstatue, action;
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
        arpbindlists_info = [];
        f.getMConfig('arp_static_bind', function (data) {
            if (data.errCode == 0) {
                arpstatic_info = data.arp_static;
                if (arpstatic_info && arpstatic_info.enable == 1) {
                    arpstatue = 1;
                } else {
                    arpstatue = 0;
                }
                showinit(arpstatue);
            }
        }, false);

        f.getMConfig('dhcp_static_list', function (data) {
            if (data && data.errCode == 0) {
                dhcp_static = data.dhcp || [];
                arp_dhcp = d.extend(true, [], dhcp_static);
                refresh_list();
            }
        });
    }

    function showinit(statue) {
        if (statue) {
            d("#arpset").text(dis_arp_static).attr('sh_lang', 'dis_arp_static');
            d("#arpset_icon").addClass("fa-sign-out").removeClass("fa-sign-in");

            f.getMConfig('arp_bind_list', function (data) {
                if (data && data.errCode == 0) {
                    arpbindlists_info = data.arp_bind || [];
                }
            }, false)
        } else {
            d("#arpset").text(arp_static).attr('sh_lang', 'arp_static');
            d("#arpset_icon").addClass("fa-sign-in").removeClass("fa-sign-out");
        }
    }

    function refresh_list() {
        var dub_flag;
        d.each(arpbindlists_info, function (n, m) {
            dub_flag = 0;
            d.each(dhcp_static, function (x, y) {
                if (m.ip == y.ip || m.mac == y.mac.toUpperCase()) {
                    dub_flag = 1;
                }
            });
            if (!dub_flag) {
                arp_dhcp.push(m)
            }
        });
        showtable();
    }

    function showtable() {
        var this_html = '', notcheck = 0;

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(arp_dhcp, function (n, m) {
            if (m.commentname == undefined) {
                notcheck = 1;
            }
            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden" >' + m.real_num + '</td>';
            if (notcheck) {
                this_html += '<td><input type="checkbox" disabled/></td>';
            } else {
                this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            }

            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="src_ip">' + m.ip + '</td>';
            this_html += '<td class="src_mac" >' + m.mac.toUpperCase() + '</td>';

            if (notcheck) {
                this_html += '<td class="src_name" >' + m.remark + '</td>';
            } else {
                this_html += '<td class="src_name" >' + m.commentname + '</td>';
            }

            if (notcheck) {
                this_html += '<td><a class="table-link gray"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i class="md-trigger fa fa-pencil fa-stack-1x fa-inverse"></i></span></a></td>';
            } else {
                this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:edit"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" sh_title="edit" class="md-trigger fa fa-pencil fa-stack-1x fa-inverse"></i></span></a></td>';

            }
            this_html += '</tr>';
        });
        d('#tbody_info').html(this_html);

        if (arp_dhcp.length > 0) {
            this_table = d('#table').DataTable({
                "aaSorting": [[2, "asc"]],
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    null,
                    null,
                    null,
                    null,
                    {"orderable": false}
                ],
                "drawCallback": function (settings) {
                    //清空全选状态
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
        if (arp_dhcp.length > 0) {
            default_num = d(evt).val();
            this_table.page.len(default_num).draw();
            d(evt).blur();
        }
    }

    et.arp_set = function () {
        var arg = {};

        if (arpstatue == 0) {
            arpstatue = 1;
        } else if (arpstatue == 1) {
            arpstatue = 0;
            arpbindlists_info = [];
        }

        arg.enable = '' + arpstatue;
        set_staticbind(arg);
    };

    et.add_list = function () {
        action = "add";
        g.clearall()
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
        var a = {}, error_flag = 0;
        a.list = [];
        a.list[0] = {};

        if (action == 'add' && dhcp_static.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        if (action == 'edit') {
            a.list[0].real_num = parseInt(d("#real_num").val());
        }
        a.list[0].action = action;
        a.list[0].ip = d("#src_ip").val();
        a.list[0].mac = d("#src_mac").val().toLowerCase();
        a.list[0].commentname = d("#src_name").val();

        d.each(dhcp_static, function (n, m) {
            if (a.list[0].ip == m.ip && a.list[0].mac == m.mac) {
                if (a.list[0].real_num == m.real_num) {
                    return true;
                }
                h.ErrorTip(tip_num++, dhcp_static_conflict);
                error_flag = 1;
                return false;
            }
        });
        if (error_flag) {
            lock_web = false;
            return false;
        }
        return a;
    }


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

    et.edit = function (evt) {
        action = "edit";
        g.clearall();
        showlistwin(evt);
    };

    function showlistwin(evt) {
        var src_ip, src_mac, src_name, real_num;
        src_ip = d(evt).parents('tr').find('.src_ip').text();
        src_mac = d(evt).parents('tr').find('.src_mac').text();
        src_name = d(evt).parents('tr').find('.src_name').text();
        real_num = d(evt).parents('tr').find('.real_num').text();

        d("#src_ip").val(src_ip);
        d("#src_mac").val(src_mac);
        d("#src_name").val(src_name);
        d("#real_num").val(real_num);
    }

    function set_staticbind(arg) {
        f.setMConfig('arp_static_bind', arg, function (data) {
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

    function set_config(arg) {
        f.setMConfig('static_dhcp', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
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
