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

    var filter_info, filter_value, set_filter, remark_init, clusterlist, createarr, remark = {}, selected;
    var this_table, lock_web = false, tipnum = 0, listpage = 1, listnum = 10;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        createarr = [];
        selected = 0;
        f.getMConfig('cluster_filter', function (data) {
            if (data && data.errCode == 0) {
                filter_info = data.filter;
                load_filter_starus();
            }
        }, false);

        refreshClusterList();
    }

    function refreshClusterList() {
        f.getMConfig('cluster_list', function (data) {
            if (data && data.errCode == 0) {
                clusterlist = data.list || [];
                if (!selected) {
                    clusterremark();
                    setTimeout(refreshClusterList, 5000);
                }
            }
        })
    }

    d('#tbody_info').on('change', '.row_checkbox', function () {
        if (d('#tbody_info').find('.row_checkbox:checked').length < 1) {
            selected = 0;
        } else {
            selected = 1
        }
    });

    function clusterremark() {
        f.getMConfig('cluster_remark', function (data) {
            if (data && data.errCode == 0) {
                remark_init = data;
                create_arr();
                showtable();
            }
        })
    }

    function load_filter_starus() {
        d('.radiobox').attr('checked', false);
        if (filter_info.filter_name == 'black_list') {
            filter_value = '2';
            d('#black_list').prop('checked', true);
            d('#add_list').attr('disabled', false);
            d('#add_list_txt').html(black_add)
        } else if (filter_info.filter_name == 'white_list') {
            filter_value = '1';
            d('#white_list').prop('checked', true);
            d('#add_list').attr('disabled', false);
            d('#add_list_txt').html(white_add)
        } else {
            filter_value = '0';
            d('#default_list').prop('checked', true);
            d('#add_list').attr('disabled', true);
            d('#add_list_txt').html(nodefault_add)
        }
    }

    var create_arr = function () {
        var refreshremark;
        d.each(clusterlist, function (n, m) {
            createarr[n] = {};
            createarr[n].hwsn = m.hwsn;
            createarr[n].mid = m.mid;
            createarr[n].product = m.product;
            createarr[n].status = m.status;
            createarr[n].group = filter_remark(m.mid);
            refreshremark = refresh_remark(m.mid);
            createarr[n].real_num = refreshremark.real_num;
            createarr[n].remark = refreshremark.remark;
        });
    };

    var filter_remark = function (mac) {
        var white_list = filter_info.white_list;
        var black_list = filter_info.black_list;
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

        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        d.each(createarr, function (n, m) {
            var cluster_stauts;
            if (m.mid == undefined || m.remark == undefined || m.status == undefined) {
                refreshClusterList();
                return false;
            }

            this_html += '<tr class="text-center">';
            this_html += '<td><input class="row_checkbox" type="checkbox" /></td>';
            this_html += '<td class="hide">' + (n + 1) + '</td>';

            if (m.remark) {
                this_html += '<td class="src_name">' + m.remark + '</td>';
            } else {
                this_html += '<td class="src_name">' + m.mid.toUpperCase() + '</td>';
            }
            this_html += '<td class="src_mac hide">' + m.mid.toUpperCase() + '</td>';

            if (m.group == '1') {
                this_html += '<td>' + filter_white + '</td>';
            } else if (m.group == '2') {
                this_html += '<td>' + filter_black + '</td>';
            } else {
                this_html += '<td>' + filter_null + '</td>';
            }
            this_html += '<td class="src_product hide">' + m.product + '</td>';
            this_html += '<td class="src_group hide">' + m.group + '</td>';

            if (m.status != 'online' || (m.group == '2' && filter_info.filter_name == 'black_list' )) {
                cluster_stauts = '0';
            } else if (m.group != '1' && filter_info.filter_name == 'white_list') {
                cluster_stauts = '1';
            }

            if (cluster_stauts == '0') {
                this_html += '<td >' + cluster_offline_stauts + '</td>';
            } else if (cluster_stauts == '1') {
                this_html += '<td >' + cluster_queued_stauts + '</td>';
            } else {
                this_html += '<td>' + cluster_online_stauts + '</td>';
            }

            this_html += '<td class="src_line hide">' + m.status + '</td>';
            this_html += '<td style="display:none"  class="rule_num">' + m.real_num + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_two" et="click tap:editConfig" class="table-link"><span  class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" et="click tap:editConfig"  class="md-trigger fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a et="click tap:del" class="table-link danger"><span  class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + global_delete + '" et="click tap:del"  class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a></td></tr>';
        });
        d("#tbody_info").html(this_html);

        if (createarr.length > 0) {
            this_table = d('#table').DataTable({
                "bDestroy": true,
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": true},
                    null,
                    null,
                    null,
                    null,
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
    }).on("click", ".row_checkbox", function (event) {
        !d(event.target).is(":checkbox") && d(":checkbox", this).trigger("click");
    });

    function laber_text(status) {
        if (status) {
            d("[for='allchecked']").text(disselectall_tab);
        } else {
            d("[for='allchecked']").text(selectall_tab);
        }
    }

    et.add_list = function () {
        if (lock_web)
            return;
        lock_web = true;
        var filter_config;

        if (filter_config = filter_validate()) {
            set_filter_Config(filter_config);
        } else {
            lock_web = false;
            return null
        }
        // ip_set(a);
    }

    et.del = function (evt) {
        if (lock_web) return;
        lock_web = true;
        var this_mac = d(evt).parents('tr').find('.src_mac').html().toLowerCase();
        var this_arr = [], this_obj = {}, a = {};
        this_obj.mac = this_mac;
        this_arr.push(this_obj);
        a.list = this_arr;
        delchild(a);
    }

    function delchild(obj) {
        f.setMConfig('cluster_delete', obj, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tipnum++, data.errCode);
            } else {
                h.SetOKTip(tipnum++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        })
    }

    et.editConfig = function (evt) {
        d('input').val('');
        ceat_up(evt);
    }

    /*编辑填充*/
    var ceat_up = function (obj) {
        var this_realnum, this_group, this_mid, this_remark;
        this_realnum = d(obj).parents('tr').find('.rule_num').text();
        this_group = d(obj).parents('tr').find('.src_group').text();
        this_mid = d(obj).parents('tr').find('.src_mac').text();
        this_remark = d(obj).parents('tr').find('.src_name').text();
        d("#real_num").val(this_realnum);
        d("#src_name").val(this_remark);
        d("#src_mac").val(this_mid);
        d("#src_group").val(this_group);
    }

    et.saveConfig = function (a) {
        if (lock_web)
            return;
        lock_web = true;
        var listconfig;

        if (!(listconfig = rc())) {
            lock_web = false;
            return null
        }
        d('.closewin').click();
        setRemarkConfig(listconfig);
    }

    function filter_validate() {
        var this_checked, filter_config = {}, filter_mac, filter_mac_array = [], filter_value, this_black_arr = [], this_white_arr = [], this_group, this_mac;

        this_checked = d('#tbody_info').find('.row_checkbox:checked');
        if (this_checked.length < 1) {
            return;
        }
        filter_value = d('.radiobox:checked').attr('data-value');

        if (filter_info.black_list) {
            this_black_arr = getMac(filter_info.black_list);
        }
        if (filter_info.white_list) {
            this_white_arr = getMac(filter_info.white_list);
        }

        this_checked.each(function (n, m) {
            filter_mac = d(m).parents('tr').find('.src_mac').text().toLowerCase();
            if (this_white_arr.length && d.inArray(filter_mac, this_white_arr) != -1) {
                this_white_arr.splice(d.inArray(filter_mac, this_white_arr), 1);
            }
            if (this_black_arr.length && d.inArray(filter_mac, this_black_arr) != -1) {
                this_black_arr.splice(d.inArray(filter_mac, this_black_arr), 1);
            }
            filter_mac_array.push(filter_mac);
        });

        if (filter_value == 2) {
            filter_name = 'black_list';
            this_black_arr = this_black_arr.concat(filter_mac_array);
        } else if (filter_value == 1) {
            filter_name = 'white_list';
            this_white_arr = this_white_arr.concat(filter_mac_array);
        } else {
            filter_name = '';
        }

        if ((filter_value == 2 && this_black_arr.length == 0 ) || (filter_value == 1 && this_white_arr.length == 0)) {
            filter_name = '';
        }

        filter_config.filter_name = filter_name;
        filter_config.white_list = this_white_arr.join(',').toLowerCase();
        filter_config.black_list = this_black_arr.join(',').toLowerCase();
        if (filter_config.white_list) filter_config.white_list += ',';
        if (filter_config.black_list) filter_config.black_list += ',';
        return filter_config;
    }

    var getMac = function (str) {
        var result;
        if (!str) {
            return;
        }
        result = str.match(/[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}/g);
        return result;
    }


    function rc() {
        var remark_config = {}, this_arr = {}, this_mac, this_realnum, this_remark, this_action;
        this_realnum = d('#real_num').val();
        this_remark = d('#src_name').val();
        this_mac = d('#src_mac').val().toLowerCase();
        if (typeof(this_realnum) == "undefined" || this_realnum == '') {
            this_action = 'add';
        } else {
            this_action = 'edit';
            this_arr.real_num = parseInt(this_realnum);
        }
        this_arr.action = this_action;
        this_arr.mac = this_mac;
        this_arr.remark = this_remark;
        remark_config.list = [];
        remark_config.list.push(this_arr);
        return remark_config;
    }

    d('.radiobox').on('click', function (evt) {
        var roster_title, rostertip, click_value;

        set_filter = d(this).attr('data-value');
        if (set_filter == '0' && filter_value != 0) {
            evt.preventDefault();
        }
        if (filter_value == 0) {
            evt.stopPropagation();
        }

        if (set_filter == 0) {
            roster_title = set_default_title;
            rostertip = set_default_tip;
        }

        d('#roster_title').html(roster_title);
        d('#roster_tip').html(rostertip);
    });

    d('input[name=filter_switch]').on('click change', function (evt) {
        d('.radiobox').attr('checked', false);
        d(this).prop('checked', true);
        if (d(this).attr('data-value') == 1) {
            d('#add_list_txt').html(white_add);
            d('#add_list').attr('disabled', false);
        } else if (d(this).attr('data-value') == 2) {
            d('#add_list_txt').html(black_add);
            d('#add_list').attr('disabled', false);
        } else {
            d('#add_list').attr('disabled', true);
            d('#add_list_txt').html(nodefault_add)
        }
    });

    et.saveStatus = function () {
        var status_filter = {};
        if (set_filter == '1') {
            status_filter.filter_name = 'white_list';
        } else if (set_filter == '2') {
            status_filter.filter_name = 'black_list';
        } else {
            status_filter.filter_name = '';
            status_filter.white_list = '';
            status_filter.black_list = '';
        }
        d('.closewin').click();
        set_filter_Config(status_filter);
    };

    /*设置*/
    function set_filter_Config(arg) {
        f.setMConfig('cluster_filter', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tipnum++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tipnum++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        })
    }

    function setRemarkConfig(arg) {
        f.setMConfig('cluster_remark', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tipnum++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tipnum++, set_success);
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
