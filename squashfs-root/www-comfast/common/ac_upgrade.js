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

    var ac_group_info, aplist, online_ap, current_ac_status, upgrade;
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

        f.getMConfig('system_upload_file', function (data) {
            if (data && data.errCode == 0) {
                upgrade = data.ac_multi_upgrade;
                get_upgrade();
            }
        });

        f.getMConfig('ac_group_config', function (data) {
            if (data && data.errCode == 0) {
                ac_group_info = data;
            }
        }, false);

        f.getMConfig('ac_list_get', function (data) {
            if (data && data.errCode == 0) {
                aplist = data.list_all;
                acap_status();
                init_data();
            }
        })
    }

    function get_upgrade() {
        if (upgrade) {
            if ((upgrade.upgrade_file_name.length > 0) && (upgrade.file_exist != 0)) {
                d("#status").html(ac_fw_uploaded);
                d("#fw_name").html(upgrade.upgrade_file_name);
                d("#show_current_file").removeClass('hide');
                d("#upload_fw").val(ac_re_upload_fw);
            } else {
                d("#status").html(ac_fw_no_upload);
                d("#show_current_file").addClass('hide');
                d("#upload_fw").val(ac_upload_fw);
            }
        }
    }

    et.upload_file = function () {

        if (d("#upgrade_file").val() == '') {
            h.ErrorTip(tip_num++, upload_file_empty);
            return;
        }

        var Reg_type_name = new RegExp("/\.first|\.bin$|\.img$|\.BIN$|\.IMG$|\.end$/i");
        if (!Reg_type_name.test(d("#upgrade_file").val())) {
            h.ErrorTip(tip_num++, upload_file_format_error);
            return;
        }

        if (lock_web) return;
        lock_web = true;

        d("#upgrade_file").upload({
            url: '/cgi-bin/mbox-config?method=SET&section=system_upload_file',
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

    function acap_status() {
        if (aplist && (aplist.length > 0)) {
            current_ac_status = "ac";
        } else {
            current_ac_status = "ap";
        }
    }

    et.displayline = function (evt) {
        default_num = d(evt).val();
        this_table.page.len(default_num).draw();
        d(evt).blur();
    };

    function init_data() {
        online_ap = [];
        d.each(aplist, function (n, m) {
            if (m.offline_flag == 'online') {
                online_ap.push(m)
            }
        });
        showtable();
    }

    function showtable() {

        var this_html = '';

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(online_ap, function (n, m) {
            var deviceReg = new RegExp("(.+)-(.+)");
            var deviceName = deviceReg.exec(m.soft_version)[1];
            var deviceVersion = deviceReg.exec(m.soft_version)[2];
            this_html += '<tr class="text-center">';
            this_html += '<td class="hidden"></td>';
            this_html += '<td><input class="row_checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="src_product">' + deviceName.toUpperCase() + '</td>';
            this_html += '<td class="src_hwsn">' + deviceVersion + '</td>';
            this_html += '<td class="src_mac">' + m.mac.toUpperCase() + '</td>';
            if (m.vif.length > 0) {
                this_html += '<td class="src_ssid">' + m.vif[0].ssid.split('').slice(0, 16).join('') + '</td>';
            } else {
                this_html += '<td class="src_ssid">*</td>';
            }
            this_html += '<td class="src_group">' + findgroup(m.mac) + '</td>';
            this_html += '<td class="src_alias">' + m.alias + '</td>';
            this_html += '</tr>';
        });
        d("#tbody_info").html(this_html);

        if (online_ap.length > 0) {
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

    function findgroup(mymac) {
        var group_name;
        group_name = defalut_group;
        for (var i = 1; i < ac_group_info.group_sum.group_sum; i++) {
            var group_num_str = "group" + i;
            var one_group = ac_group_info[group_num_str];
            if (one_group.group_name && one_group.member_mac && (one_group.member_mac.indexOf(mymac) > -1)) {
                if (one_group.group_name == "" || one_group.group_name == "ac_group_default") {
                    group_name = defalut_group;
                } else {
                    group_name = one_group.group_name;
                }
                break;
            }
        }
        return group_name;
    }

    et.doResetConfig = function () {
        var ie = !-[1,];
        var afile = d("#upgrade_file");
        if (ie) {
            afile.replaceWith(afile.clone());
        } else {
            afile.val('');
        }
    };

    et.saveApUpgradeList = function () {
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = get_info_from_table()) {
            set_config(arg_data);
        } else {
            lock_web = false;
        }
    };

    function get_info_from_table() {
        var arg = {}, this_checked, mac_arr = [], dev_mac, device_model = [];

        this_checked = d('#tbody_info').find('input:checked');

        if (upgrade.upgrade_file_name.length == 0 || upgrade.file_exist == 0) {
            h.ErrorTip(tip_num++, ac_not_upload_note);
            return;
        }

        if (this_checked.length < 1) {
            return;
        }

        this_checked.each(function (n, m) {
            dev_mac = {};
            device_model.push(d(m).parents('tr').find('.src_product').html());
            dev_mac.device_mac = d(m).parents('tr').find('.src_mac').html().toLowerCase();
            mac_arr.push(dev_mac);
        });
        d.unique(device_model);

        if (device_model.length > 1 || mac_arr.length <= 0) {
            return;
        }

        arg.config_ap_upgrade_member = mac_arr;
        return arg;
    }

    /*设置*/
    function set_config(arg) {
        f.setMConfig('set_multi_upgrade_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                //refresh_init();
                setTimeout(reset_lock_web, 1000)
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
