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
    require("upload")(d);

    var filter_name, white_list, black_list;
    var upgrade, list_init, remark_init, clusterlist, list_array, createarr = [], remark = {}, optflag;
    var this_table, lock_web = false, tip_num = 0;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('cluster_upgrade_file', function (data) {
            if (data && data.errCode == 0) {
                upgrade = data.multi_upgrade;
                get_upgrade();
            }
        });

        f.getMConfig('cluster_filter', function (data) {
            if (data && data.errCode == 0) {
                filter_name = data.filter.filter_name;
                white_list = data.filter.white_list || [];
                black_list = data.filter.black_list || [];
            }
        });

        f.getMConfig('cluster_list', function (data2) {
            if (data2 && data2.errCode == 0) {
                list_init = data2;
                clusterlist = data2.list || [];
                if (clusterlist.length == 0) {
                    return;
                }
            }
            f.getMConfig('cluster_remark', function (data3) {
                if (data3 && data3.errCode == 0) {
                    remark_init = data3;
                    create_arr();
                    showtable();
                }
            })
        })
    }

    function get_upgrade() {
        if (upgrade) {
            if ((upgrade.upgrade_file_name.length > 0) && (upgrade.file_exist > 0)) {
                d("#status").val(ac_fw_uploaded);
                d("#fw_name").val(upgrade.upgrade_file_name);
                d("#show_current_file").removeClass('hide');
                d("#upload_fw").val(ac_re_upload_fw);
            } else {
                d("#status").val(ac_fw_no_upload);
                d("#show_current_file").addClass('hide');
                d("#upload_fw").val(ac_upload_fw);
            }
        }
    }

    et.upload_file = function () {

        var Reg_type_name = new RegExp("/\.first$|\.img$|\.bin$|\.IMG$|\.BIN$|\.first$/i");
        if (!Reg_type_name.test(d("#upgrade_file").val())) {
            h.ErrorTip(tip_num++, upload_up_failed);
            return;
        }

        if (lock_web) return;
        lock_web = true;
        d("#upgrade_file").upload({
            url: '/cgi-bin/mbox-config?method=SET&section=system_cluster_upgrade_file',
            onComplate: function (data) {
                if (data && data.errCode != 0) {
                    h.ErrorTip(tip_num++, data.errCode);
                } else {
                    g.setting(5, gohref);
                }
            }
        });
        d("#upgrade_file").upload("ajaxSubmit");
    };

    var create_arr = function () {
        var refreshremark;
        list_array = list_init.list;
        if (list_array.length == -1) {
            return;
        }
        var i = 0;
        d.each(list_array, function (n, m) {
            if ((filter_name == 'black_list' && filter_remark(m.mid) == '2') || m.status == 'offline') {
                return true;
            }
            createarr[i] = {};
            createarr[i].hwsn = m.hwsn;
            createarr[i].mid = m.mid;
            createarr[i].version = m.version;
            createarr[i].product = m.product;
            createarr[i].status = m.status;
            createarr[i].group = filter_remark(m.mid);
            refreshremark = refresh_remark(m.mid);
            createarr[i].real_num = refreshremark.real_num;
            createarr[i].remark = refreshremark.remark;
            i++;
        });
    };

    var filter_remark = function (mac) {
        var group;
        if (white_list && white_list.indexOf(mac) != -1) {
            group = '1';
        } else if (black_list && black_list.indexOf(mac) != -1) {
            group = '2';
        } else {
            group = '0';
        }
        return group;
    };

    var refresh_remark = function (mac) {
        remark.real_num = '';
        remark.remark = '';
        var remark_list = remark_init.remark;
        if (!remark_list) {
            return remark;
        }
        d.each(remark_list, function (n, m) {
            if (m.mac == mac) {
                remark.real_num = m.real_num;
                remark.remark = m.remark;
                return false
            }
        });
        return remark;
    };

    function showtable() {
        var this_html = '';

        d.each(createarr, function (n, m) {
            this_html += '<tr class="text-center">' +
                '<td><input class="row_checkbox" et="click tap:select_row" type="checkbox"/></td>' +
                '<td>' + (n + 1) + '</td>';

            if (m.remark) {
                this_html += '<td class="src_name">' + m.remark + '</td>';
            } else {
                this_html += '<td class="src_name">' + m.mid.toUpperCase() + '</td>';
            }

            this_html += '<td class="src_product">' + m.product + '</td>';
            this_html += '<td class="src_hwsn">' + m.version + '</td>';
            this_html += '<td class="src_mac">' + m.mid.toUpperCase() + '</td>';

            this_html += '<td class="src_line hide">' + m.status + '</td>';
            this_html += '<td style="display:none"  class="rule_num">' + m.real_num + '</td>';
            this_html += '</tr>';
        })
        d("#tbody_info").html(this_html);

        if (createarr.length > 0) {
            this_table = d('#table').DataTable({
                "bDestroy": true,
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
                ],
                "drawCallback": function (settings) {
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

    et.saveApUpgradeList = function (a) {
        var arg;
        if (arg = get_info_from_table()) {
            set_upgrade(arg);
        } else {
            lock_web = false;
        }
    };

    et.doResetConfig = function () {
        g.clearall();
        d('#upgrade_file').val('');
        refresh_init();
    };

    function get_info_from_table() {
        var this_tr = d('#tbody_info').find('tr');
        var arg = {}, mac_arr = [], upconfig;

        if (!upgrade.file_exist || upgrade.upgrade_file_name == '') {
            h.ErrorTip(tip_num++, upgrade_file_empty);
            lock_web = false;
            return;
        }

        this_tr.find('input[type="checkbox"]:checked').each(function (n, m) {
            mac_arr.push(d(m).parents('tr').find('.src_mac').html().toLowerCase());
        });
        if (mac_arr.length <= 0) {
            return null;
        }
        upconfig = mac_arr.join(',') + ',';

        arg.upgrade_member = upconfig;
        return arg;
    }

    function set_upgrade(arg) {
        f.setMConfig('cluster_upgrade', arg, function (data) {
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

    function gohref() {
        location.href = location.href;
    }

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});
