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

    var wanpolicy, l2tplist, pptplist, wanlist, portrulelist, isplist, policy_enabled = 0, isp_comment, isp_type, isptype_select, optflag;

    var isp_table, port_table, lock_web = false, tip_num = 0, default_num_isp = 10, default_num_port = 10;

    function init() {
        d('.select_ispline').val(default_num_isp);
        d('.select_portline').val(default_num_port);
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        isp_comment = [mwan_isp_other, mwan_isp_telecom, mwan_isp_unicom, mwan_isp_mobile, mwan_isp_educate];
        isp_type = ['other', 'isp_telecom', 'isp_unicom', 'isp_mobile', 'isp_educate'];
        device = data;
        h.volide('body');
        refresh_init();
        setheight();
    }


    function refresh_init() {
        refresh_MwanConfig();
        refresh_IspDefineConfig();
        refresh_MwanportruleConfig();
    }

    function refresh_MwanConfig() {
        f.getMConfig('mwan_config', function (data) {
            if (data.errCode == 0) {
                wanpolicy = data.wanpolicy;
                wanlist = data.wanlist || [];
                pptplist = data.pptplist || [];
                l2tplist = data.l2tplist || [];
                d('#choose_line').html(wan_option());
            }
        }, false);
    }

    function refresh_IspDefineConfig() {
        f.getMConfig('mwan_isp_define_config', function (data) {
            if (data.errCode == 0) {
                isplist = data.isplist || [];
                createisparray();
                policy_dis();
                Mwan_init();
                showispinfo();
                show_isp_table();
            }
        }, false)
    }

    function refresh_MwanportruleConfig() {
        f.getMConfig('mwanportrule_config', function (data) {
            if (data && data.errCode == 0) {
                portrulelist = data.portrulelist || [];
                show_port_table();
            }
        }, false)
    }

    function Mwan_init() {

        var this_html = '';
        d.each(wanlist, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td class="iface_name">' + m.name.toUpperCase() + '</td >';
            this_html += '<td class="iface hide">' + m.iface + '</td >';
            if (m.balance == '1' && policy_enabled != 1) {
                this_html += '<td><input class="chk_all" checked = "checked" type="checkbox"></td >';
            } else {
                this_html += '<td><input class="chk_all" type="checkbox"></td >';
            }
            this_html += '<td>';
            this_html += '<select class="weight">';
            this_html += weight_option(m.weight);
            this_html += '</select>';
            this_html += '</td></tr>';
        });
        d('#balance_tbody').html(this_html);
    }
    
    et.change_proto = function (evt) {
        if(evt.val() == "all"){
            //d("#src_ip").attr("disabled",true);
            //d("#dest_ip").attr("disabled",true);
            d("#src_port").attr("disabled",true);
            d("#dest_port").attr("disabled",true);
        }else {
            d("#src_port").attr("disabled",false);
            d("#dest_port").attr("disabled",false);
        }
    };

    function getifacenum(arg) {
        var ifacenum = arg.replace(/[^0-9]+/g, "") || '0';
        return ifacenum;
    }

    function policy_dis() {
        if (wanpolicy.enable == 1 && wanpolicy.enable_policy == 1) {
            policy_enabled = 1;
            d('#policy_box').removeClass('hide');
        } else {
            policy_enabled = 0;
        }
        d('#policyenable').val(policy_enabled);
        show_policy(policy_enabled);
    }

    function weight_option(arg) {
        var this_html = '';
        for (var i = 1; i <= 10; i++) {
            if (arg == i) {
                this_html += '<option value = "' + i + '" selected>' + i + '</option >';
            } else {
                this_html += '<option value = "' + i + '" >' + i + '</option >';
            }
        }
        return this_html;
    }

    function isp_option(arg) {
        var this_html = '';
        d.each(isptype_select, function (n, m) {
            if (arg == m.type) {
                this_html += '<option value="' + m.type + '" selected>' + m.comment + '</option>'
            } else {
                this_html += '<option value="' + m.type + '">' + m.comment + '</option>'
            }
        });
        return this_html;
    }

    function wan_option(arg) {
        var this_html = '', arg = arg || '';
        if (arg) {
            arg = arg.split(' ');
        }
        d.each(wanlist, function (n, m) {
            var hascheck = 0;
            d.each(arg, function (x, y) {
                if (y == m.name) {
                    hascheck = 1;
                    this_html += '<div class="col-lg-4 col-xs-6"><input type="checkbox" checked="checked" data-value="' + m.iface + '" id="' + m.name + '"><label for="' + m.name + '">' + m.name.toUpperCase() + '</label></div>';
                    return false;
                }
            });
            if (hascheck) {
                return true;
            }
            this_html += '<div class="col-lg-4 col-xs-6"><input type="checkbox" data-value="' + m.iface + '" id="' + m.name + '"><label for="' + m.name + '">' + m.name.toUpperCase() + '</label></div>';
        });
        return this_html;
    }

    function createisparray() {
        isptype_select = [];
        d.each(isp_type, function (n, m) {
            isptype_select[n] = {};
            isptype_select[n].type = m;
            isptype_select[n].comment = isp_comment[n];
        });
        if (isplist) {
            isptype_select = isptype_select.concat(isplist)
        }
    }

    function showispinfo() {
        var this_html = '', num = 0;

        d.each(wanlist, function (n, m) {
            num++;
            this_html += ispbuild(num, m);
        });

        d.each(pptplist, function (n, m) {
            num++;
            this_html += ispbuild(num, m, 1);
        });

        d.each(l2tplist, function (n, m) {
            num++;
            this_html += ispbuild(num, m, 1);
        });

        d('#policy_tbody').html(this_html);
    }

    function ispbuild(num, m, disabled_checkbox) {

        var policy_line_enable = m.policy_line_enable || '1';
        var this_html = '<tr class="text-center">';
        this_html += '<td>' + num + '</td>';
        if(disabled_checkbox){
            this_html += '<td class="policy_line">' + m.iface.toUpperCase() + '</td>';
        }else {
            this_html += '<td class="policy_line">' + m.name.toUpperCase() + '</td>';
        }
        this_html += '<td class="policy_iface hide">' + m.iface + '</td>';
        this_html += '<td class="policy_ip">' + m.wan_ipaddr + '</td>';
        this_html += '<td><select class="dropDown" name="isptype">';
        this_html += isp_option(m.isptype);
        this_html += '</select></td><td><select class="dropDown" name="policy_line_enable">';
        if (policy_line_enable == "0") {
            this_html += '<option value="0" selected>' + policylinedisable + '</option>';
            this_html += '<option value="1">' + policylineenable + '</option>';
        } else {
            this_html += '<option value="0">' + policylinedisable + '</option>';
            this_html += '<option value="1" selected>' + policylineenable + '</option>';
        }
        this_html += '</select></td>';
        if (disabled_checkbox) {
            this_html += '<td><input class="gateway" type="checkbox" disabled></td></tr>';
            return this_html;
        }
        if (m.defaultroute == "1") {
            this_html += '<td><input class="gateway" et="click tap:radiobox" type="checkbox" checked = "checked"></td></tr>';
        } else {
            this_html += '<td><input class="gateway" et="click tap:radiobox" type="checkbox"></td></tr>';
        }
        return this_html;
    }

    et.policychange = function (evt) {
        var show_policy_value = evt.val();
        show_policy(show_policy_value);
    }

    function show_policy(data) {
        if (parseInt(data)) {
            d('#policy_box').removeClass('hide');
            setheight();
        } else {
            d('#policy_box').addClass('hide');
            setheight();
        }
    }

    et.radiobox = function (evt) {
        d('#policy_tbody').find('.gateway').attr('checked', false);
        evt.prop('checked', 'checked');
    };

    et.saveConfig_balance = function () {
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = balance_config()) {
            set_balance(arg_data)
        } else {
            lock_web = false;
        }
    };

    function balance_config() {
        var arg = {}, b = [], balance, weight, iface;

        if (policy_enabled == 1) {
            h.ErrorTip(tip_num++, mwan_policy_balanced_conflict);
            return false;
        }

        d('#balance_tbody tr').each(function (n, m) {
            b[n] = {};
            if (d(m).find('.chk_all').is(':checked')) {
                balance = '1';
            } else {
                balance = '0';
            }
            weight = d(m).find('.weight').val();
            iface = d(m).find('.iface').html();
            b[n].balance = balance;
            b[n].iface = iface;
            b[n].weight = weight;
        });
        arg.mwan_list = b;
        return arg;
    }

    et.doResetConfig_balance = function () {
        refresh_init();
    };

    et.saveConfig_policy = function () {
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = policy_config()) {
            set_policy(arg_data)
        } else {
            lock_web = false;
        }
    };

    function policy_config() {
        var arg = {}, b = [], def_gateway = '0', policy_line, enablewannum = 0, isptype, isparray = [];

        var policy_enabled_val = d("#policyenable").val();
        if (policy_enabled_val == 1){
            var policy_table = d('#policy_tbody tr');
            for (var i = 0; i < policy_table.length; i++) {
                var m = policy_table[i];
                b[i] = {};
                var policy_line_enable, policy_isptype, defaultroute = '0';
                if (d(m).find('.gateway').is(":checked")) {
                    defaultroute = '1';
                    def_gateway++;
                }

                policy_line_enable = d(m).find("[name='policy_line_enable']").val();
                policy_isptype = d(m).find("[name='isptype']").val();

                if (policy_line_enable == '1') {
                    policy_line = d(m).find('.policy_line').html();
                    enablewannum++;
                    if (policy_isptype != 'other') {
                        isparray.push(policy_isptype)
                    }
                }

                if (defaultroute == "1" && (policy_isptype == "other" || policy_line_enable == "0")) {
                    h.ErrorTip(tip_num++, mwan_policy_default_term);
                    return false;
                }

                b[i].policy_line_enable = policy_line_enable;
                b[i].iface = d(m).find('.policy_iface').html();
                b[i].isptype = policy_isptype;
                b[i].defaultroute = defaultroute;
            }
        }else {
            d.each(wanlist,function (n, m) {
                b[n] = {};
                b[n].defaultroute = m.defaultroute;
                b[n].iface = m.iface;
                b[n].isptype = m.isptype;
                b[n].policy_line_enable = m.policy_line_enable;
            })
        }

        if (isparray.length > 1) {
            if (def_gateway != 1 && policy_enabled_val == '1') {
                h.ErrorTip(tip_num++, mwan_policy_defaultroute_unchoosed);
                return false;
            }
            arg.enable_policy = "0";
            d.unique(isparray);
            if (isparray.length >= 2) {
                arg.enable_policy = "1";
            } else {
                arg.enable_policy = "0";
            }
        } else {
            arg.enable_policy = "0";
        }

        arg.mwan_isp_config = b;
        arg.enable = arg.enable_policy;
        return arg;
    }

    et.doResetConfig_policy = function () {
        refresh_IspDefineConfig();
    };

    function show_isp_table() {
        d('#isp_table').dataTable().fnClearTable();
        d('#isp_table').dataTable().fnDestroy();

        var this_html = '';
        d('#select_isp_laber').text(selectall_tab);
        d('#allisp_checked').prop('checked', false).attr('data-value', '0');

        d("#ispdefine_tbody").empty();
        d.each(isplist, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden">' + m.real_num + '</td>';
            this_html += '<td><input class="row_isp_checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="isp_comment">' + m.comment + '</td>';
            this_html += '<td class="isp_type">' + m.type + '</td>';
            this_html += '</tr>';
        });
        d("#ispdefine_tbody").html(this_html);

        if (isplist.length > 0) {
            isp_table = d('#isp_table').DataTable({
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    null,
                    null,
                    null
                ],
                "drawCallback": function (settings) {
                    laber_isp_text(false);
                    d(":checkbox", d('#isp_table_wrapper')).prop('checked', false);
                }
            });
            isp_table.page.len(default_num_isp).draw();
        }
    }

    d('#isp_table').on("change", ":checkbox", function () {
        if (d(this).is("[name='checked-all']")) {
            d(":checkbox:enabled", d('#isp_table')).prop("checked", d(this).prop("checked"));
            laber_isp_text(d(this).prop("checked"));
        } else {
            var checkbox = d("tbody :checkbox:enabled", d('#isp_table'));
            d(":checkbox[name='checked-all']", d('#isp_table')).prop('checked', checkbox.length == checkbox.filter(':checked:enabled').length);
            laber_isp_text(checkbox.length == checkbox.filter(':checked:enabled').length);
        }
    }).on("click", ".row-checkbox", function (event) {
        !d(event.target).is(":checkbox") && d(":checkbox", this).trigger("click");
    });

    function laber_isp_text(status) {
        if (status) {
            d("[for='allisp_checked']").text(disselectall_tab);
        } else {
            d("[for='allisp_checked']").text(selectall_tab);
        }
    }

    function show_port_table() {
        d('#port_table').dataTable().fnClearTable();
        d('#port_table').dataTable().fnDestroy();

        var this_html = '';
        d('#select_port_laber').text(selectall_tab);
        d('#allport_checked').prop('checked', false).attr('data-value', '0');

        d.each(portrulelist, function (n, m) {
            var use_policy_array;
            use_policy_array = m.use_policy.split("_");
            if (use_policy_array.length < 1) {
                use_policy_array[0] = 'WAN1';
            } else {
                d.each(use_policy_array, function (n, m) {
                    use_policy_array[n] = 'WAN' + (parseInt(m) + 1);
                })
            }
            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden">' + m.real_num + '</td>';
            this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="port_proto">' + m.proto.toUpperCase() + '</td>';
            this_html += '<td class="port_policy">' + use_policy_array.join(' ') + '</td>';
            this_html += '<td class="port_srcip">' + m.src_ip + '</td>';
            this_html += '<td class="port_destip">' + m.dest_ip + '</td>';
            this_html += '<td class="port_srcport">' + m.src_port + '</td>';
            this_html += '<td class="port_destport">' + m.dest_port + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_port" class="table-link"><span class="fa-stack" et="click tap:editlist"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '</tr>';
        });
        d("#port_tbody").html(this_html);

        if (portrulelist.length > 0) {
            port_table = d('#port_table').DataTable({
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
                    {"orderable": false}
                ],
                "drawCallback": function (settings) {
                    laber_port_text(false);
                    d(":checkbox", d('#port_table_wrapper')).prop('checked', false);
                }
            });
            port_table.page.len(default_num_port).draw();
        }
    }

    d('#port_table').on("change", ":checkbox", function () {
        if (d(this).is("[name='checked-all']")) {
            d(":checkbox:enabled", d('#port_table')).prop("checked", d(this).prop("checked"));
            laber_port_text(d(this).prop("checked"));
        } else {
            var checkbox = d("tbody :checkbox:enabled", d('#port_table'));
            d(":checkbox[name='checked-all']", d('#port_table')).prop('checked', checkbox.length == checkbox.filter(':checked:enabled').length);
            laber_port_text(checkbox.length == checkbox.filter(':checked:enabled').length);
        }
    }).on("click", ".row-checkbox", function (event) {
        !d(event.target).is(":checkbox") && d(":checkbox", this).trigger("click");
    });

    function laber_port_text(status) {
        if (status) {
            d("[for='allport_checked']").text(disselectall_tab);
        } else {
            d("[for='allport_checked']").text(selectall_tab);
        }
    }

    et.displayispline = function (evt) {
        default_num_isp = d(evt).val();
        if (isplist.length != 0) {
            isp_table.page.len(default_num_isp).draw();
        }
        d(evt).blur();
    };

    et.displayportline = function (evt) {
        default_num_port = d(evt).val();
        if (portrulelist.length != 0) {
            port_table.page.len(default_num_port).draw();
        }
        d(evt).blur();
    };

    et.add_list = function () {
        optflag = "add";
        g.clearall()
    };

    et.editlist = function (evt) {
        optflag = "edit";
        editprot(evt);
    }

    function editprot(evt) {
        var port_proto, port_policy, port_srcip, port_destip, port_srcport, port_destport, real_num;
        port_proto = evt.parents('tr').find('.port_proto').text().toLowerCase();
        port_policy = evt.parents('tr').find('.port_policy').text();
        port_srcip = evt.parents('tr').find('.port_srcip').text();
        port_destip = evt.parents('tr').find('.port_destip').text();
        port_srcport = evt.parents('tr').find('.port_srcport').text();
        port_destport = evt.parents('tr').find('.port_destport').text();
        real_num = evt.parents('tr').find('.real_num').text();
        d('#proto').val(port_proto);
        d('#choose_line').html(wan_option(port_policy));
        d('#src_ip').val(port_srcip);
        d('#dest_ip').val(port_destip);
        if(port_proto == "all"){
            d('#src_port').val(port_srcport).attr("disabled",true);
            d('#dest_port').val(port_destport).attr("disabled",true);
        }else {
            d('#src_port').val(port_srcport).attr("disabled",false);
            d('#dest_port').val(port_destport).attr("disabled",false);
        }

        d('#real_num').val(real_num);
    }

    et.saveConfig_isp = function (evt) {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = isp_config()) {
            d('.closewin').click();
            set_isp(arg_data)
        } else {
            lock_web = false;
        }
    };

    function isp_config() {
        var a = {}, ispcomment, isptype, ispdestip, dob_flag = 0;

        if (optflag == 'add' && isptype_select.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        ispcomment = d("#ispcomment").val();
        isptype = d("#isptype").val();
        ispdestip = d("#isp_dest_ip").val();

        if (!h.ipnum(ispdestip, 600)) {
            h.ErrorTip(tip_num++, mwan_isp_define_large_than_10000);
            return false;
        }

        d.each(isptype_select, function (n, m) {
            if (m.comment == ispcomment) {
                dob_flag = 1;
                h.ErrorTip(tip_num++, same_isp);
                return false;
            }
        });

        if (dob_flag == '1') {
            return false;
        }

        a.operate = optflag;
        a.comment = ispcomment;
        a.type = isptype;
        a.dest_ip = ispdestip + '\n';
        return a;
    }

    et.saveConfig_port = function (evt) {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = port_config()) {
            d('.closewin').click();
            set_port(arg_data)
        } else {
            lock_web = false;
        }
    };

    function port_config() {
        var a = {};
        var srcip, destip, srcport, destport, checked_array = [], use_member_array = [];

        if (optflag == 'add' && portrulelist.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        if (optflag == 'edit') {
            a.real_num = parseInt(d("#real_num").val());
        }

        srcip = d('#src_ip').val();
        destip = d('#dest_ip').val();
        srcport = d("#src_port").val();
        destport = d("#dest_port").val();

        d('#choose_line input[type=checkbox]').each(function (n, m) {
            if (d(m).is(':checked')) {
                var member = {};
                checked_array.push(getifacenum(d(m).attr('data-value')));
                member.member_name = d(m).attr('data-value') + '_member';
                use_member_array.push(member)
            }
        });

        if (checked_array.length < 1) {
            h.ErrorTip(tip_num++, mwan_port_usepolicy_null_error);
            return false;
        }
        a.proto = d("#proto").val();
        a.src_ip = srcip;
        a.dest_ip = destip;
        if (a.proto == "all"){
            a.src_port = "";
            a.dest_port = "";
        }else {
            a.src_port = srcport;
            a.dest_port = destport;
        }
        a.proto = d("#proto").val();
        a.use_policy = checked_array.join('_');
        a.use_policy_member = use_member_array;
        a.operate = optflag;

        for (var i = 0; i < portrulelist.length; i++) {
            var m = portrulelist[i];
            if (a.real_num == m.real_num) {
                continue;
            }
            if (a.dest_ip == m.dest_ip && a.dest_port == m.dest_port && a.proto == m.proto && a.src_ip == m.src_ip && a.src_port == m.src_port) {
                h.ErrorTip(tip_num++, portfw_same);
                return false;
            }
        }

        return a;
    }

    et.delisp_select = function () {
        var a = {}, this_checked;
        this_checked = d('#ispdefine_tbody').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        a.list = '';
        this_checked.each(function (n, m) {
            a.list += d(m).parents('tr').find('.real_num').text() + ',';
        });
        a.operate = "del";
        set_isp(a);
    };

    et.delport_select = function () {
        var a = {}, this_checked;
        this_checked = d('#port_tbody').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        a.list = '';
        this_checked.each(function (n, m) {
            a.list += d(m).parents('tr').find('.real_num').text() + ',';
        });
        a.operate = "del";
        set_port(a);
    };

    function setheight() {
        if (d('#page-wrapper').height() > d('#content-wrapper').height()) {
            d('#content-wrapper').css('min-height', d('#page-wrapper').height() + 36)
        }
    }

    function set_balance(arg) {
        f.setMConfig('mwan_balance_config', arg, function (data) {
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

    function set_policy(arg) {
        f.setMConfig('mwan_policy_isptype_config', arg, function (data) {
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

    function set_isp(arg) {
        f.setMConfig('mwan_isp_define_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                setheight();
                refresh_init();
                setTimeout(reset_lock_web, 3000)
            }
        });
    }

    function set_port(arg) {
        f.setMConfig('mwanportrule_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                setheight();
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
