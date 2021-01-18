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

    var wan_list, lan_list, vlan_list, arpbind_info, arp_info, this_ifname = {}, optflag, client_info;
    var this_table, lock_web = false, tip_num = 0, default_num = 0;

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
        arpbind_info = [];
        f.getSHConfig('bandwidth_config.php?method=GET&action=lan_list', function(data){
            lan_list = data || [];
        },false);
        f.getMConfig('vlan_config', function (data) {
            if (data && data.errCode == 0) {
                double_support = data.double_support;
                dev_vlan_type = data.vlan_itype;
                vlan_list = data.vlan || [];
            }
         }, false);

        f.getMConfig('multi_pppoe', function (data) {
            if (data && data.errCode == 0) {
                wan_list = data.wanlist || [];
                wanlistshow();
            }
        }, false);
        f.getSHConfig('client_config.php?method=GET&action=client_info2', function(data){
            client_info = data || [];
        },false);

        f.getMConfig('arp_bind_list', function (data) {
            if (data.errCode == 0) {
                arpbind_info = data.arp_bind || [];
            }
        }, false);

        f.getMConfig('arp_list', function (arplist) {
            if (arplist && arplist.errCode == 0) {
                arp_info = arplist.arp_list || [];
                refresh_arplist();
            }
        });
    }

    function wanlistshow() {
        var this_html = '';

        d.each(lan_list, function (n, m) {
            this_ifname[m.ifname] = m.hostname == "" ? m.ifname : m.hostname;
            if (!device.mwan && n == 0) {
                this_html += '<option value="' + m.ifname + '">' + this_ifname[m.ifname].toUpperCase() + '</option>';
                return false;
            } else {
                this_html += '<option value="' + m.ifname + '">' + this_ifname[m.ifname].toUpperCase() + '</option>';
            }
        });

        d.each(wan_list, function (x, one_line) {
            d.each(one_line, function (n, m) {
                this_ifname[m.iface] = m.name;
                //this_ifname[m.iface] = m.dhcp.hostname || m.name.toUpperCase();
                this_html += '<option value="' + m.iface + '">' + this_ifname[m.iface].toUpperCase() + '</option>';
            })
        });

        d.each(vlan_list, function (n, m) {
            this_ifname[m.iface] = m.desc.toUpperCase() || m.name.toUpperCase();
            this_html += '<option value="' + m.iface + '" >' + this_ifname[m.iface].toUpperCase() + '</option>';
        });

        d('#interface_select').html(this_html);
    }

    function refresh_arplist() {
        if (!arp_info.length && !arpbind_info.length) {
            d("#arp_table").html('');
            return;
        }
        d.each(arp_info, function (n, m) {
            if (m.static == '0') {
                arpbind_info.push(m);
            }
        });
        showtable();
    }

    function showtable() {
        d('#table').dataTable().fnClearTable();
        d('#table').dataTable().fnDestroy();

        var this_html = '';

        d.each(arpbind_info, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td class="arp_rnum hidden">' + m.real_num + '</td>';
            if (m.static != '0') {
                this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            } else {
                this_html += '<td><input disabled type="checkbox" /></td>';
            }
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="arp_ipaddr">' + m.ip + '</td>';
            this_html += '<td class="arp_mac">' + m.mac.toUpperCase() + '</td>';
            console.dir(this_ifname[m.ifname.toLowerCase()]);
            this_html += '<td>' + this_ifname[m.ifname.toLowerCase()].toUpperCase() + '</td>';
            this_html += '<td class="arp_name">' + (m.remark || "") + '</td>';

            var client_data = {};

            d.each(client_info, function(client_index, info){
                if(m.mac.toLowerCase() == info.mac.toLowerCase())
                {
                    client_data = info;
                    return false;
                }

            });

            var desc = (client_data.remark || "");

            d.each(wan_list, function (x, one_line) {
                d.each(one_line, function (n, m_line) {
                    if(m.ifname == m_line.iface){
                        
                        desc = m_line.dhcp.hostname;
                        return false;
                    }
                })
            });




            this_html += '<td class="tbl_Description"><span>' + desc + '</span></td>';


            if (m.static != '0') {
                this_html += '<td class="arp_bind" data-value="1" sh_lang="arp_binded">' + arp_binded + '</td>';
                this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:editConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger"><span class="fa-stack" et="click tap:unbind"><i class="fa fa-square fa-stack-2x"></i><i title="' + mwan_unbind + '" class="fa fa-unlink fa-stack-1x fa-inverse"></i></span></a>' +
                    '</td>';
            } else {
                this_html += '<td class="arp_bind" data-value="0" sh_lang="arp_unbind">' + arp_unbind + '</td>';
                this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link" et="click tap:addConfig"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link link"><span class="fa-stack" et="click tap:bind"><i class="fa fa-square fa-stack-2x"></i><i title="' + mwan_bind + '" class="fa fa-link fa-stack-1x fa-inverse"></i></span></a></td>';
            }
            this_html += '<td class="arp_network hidden">' + m.ifname + '</td>';
            this_html += '</tr>';
        })
        d("#tbody_info").html(this_html);
        d('.input_description').on('blur', function(e){
            d('.input_description').on('blur', function(e){
    
    
                var val = d(this).val();
               var macaddr = d(this).parents('tr').find('.arp_mac').html();
               var arg = {mac:macaddr, remark:val};
               f.setSHConfig('client_config.php?method=SET&action=client_info2', arg, function (data){
                f.getSHConfig('client_config.php?method=GET&action=client_info2', function(data){
                    client_info = data || [];
                },false);
               });
            });
        });
        
        d('.input_description').on("keyup", function(event) {
            if(event.which == 13) 
            {
               
                d(this).blur();
            }
          });
        if (arpbind_info.length > 0) {
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
                    {"orderable": false},
                    {"orderable": false}
                ],
                "drawCallback": function () {
                    laber_text(false);
                    d(":checkbox", d('#table_wrapper')).prop('checked', false);
                }
            });
            if(default_num > 0)
                this_table.page.len(default_num).draw();
            else 
                this_table.page.len(arpbind_info.length).draw();
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
        if (arpbind_info.length > 0) {
            if(default_num > 0)
                this_table.page.len(default_num).draw();
            else 
                this_table.page.len(arpbind_info.length).draw();
        }
        d(evt).blur();
    };

    et.add_list = function () {
        optflag = "add";
        //g.clearall();
        winit();
        d('#arpbind').val(arp_bind);
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
        var a = {}, b = [];

        if (optflag == 'add' && arpbind_info.length == 512) {
            h.ErrorTip(tip_num++, max_add_over);
            return false;
        }

        b[0] = {};
        b[0].ip = d("#ip").val();
        b[0].mac = d("#mac").val().toLowerCase();
        b[0].ifname = d("#interface_select").val();
        b[0].remark = d("#comment").val();

        if (b[0].ifname == '' || b[0].ifname == undefined) {
            h.ErrorTip(tip_num++, arp_select_network);
            return false;
        }

        if (optflag == "add") {
            a.add_list = b;
        } else if (optflag == "edit") {
            a = b[0];
            a.real_num = parseInt(d("#real_num").val());
        }

        for (var i = 0; i < arpbind_info.length; i++) {
            var m = arpbind_info[i];
            if (a.real_num == m.real_num) {
                continue;
            }
            if (b[0].ip == m.ip && b[0].ifname == m.ifname) {
                h.ErrorTip(tip_num++, ipfilter_same);
                return false;
            }

            if (b[0].ip == m.ip && b[0].mac == m.mac && b[0].ifname == m.ifname && m.static != "0") {
                h.ErrorTip(tip_num++, portfw_same);
                return false;
            }
        }

        a.operate = optflag;
        return a;
    }

    et.del_select = function () {
        var a = {}, this_checked;
        this_checked = d('#tbody_info').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        a.del_list = '';
        this_checked.each(function (n, m) {
            a.del_list += d(m).parents('tr').find('.arp_rnum').text() + ',';
        });
        a.operate = 'del';
        set_config(a);
    };

    et.bind = function (evt) {
        if (lock_web) return;
        lock_web = true;

        var arp_ipaddr, arp_mac, arp_network, arp_name, a = {}, b = [];
        arp_ipaddr = d(evt).parents('tr').find('.arp_ipaddr').text();
        arp_mac = d(evt).parents('tr').find('.arp_mac').text().toLowerCase();
        arp_network = d(evt).parents('tr').find('.arp_network').text();
        arp_name = d(evt).parents('tr').find('.arp_name').text();
        b[0] = {};
        b[0].ip = arp_ipaddr;
        b[0].mac = arp_mac;
        b[0].ifname = arp_network;
        b[0].remark = arp_name;
        a.add_list = b;
        a.operate = "add";
        set_config(a);
    };

    et.unbind = function (evt) {
        if (lock_web) return;
        lock_web = true;

        var a = {};
        a.del_list = d(evt).parents('tr').find('.arp_rnum').text() + ",";
        a.operate = "del";
        set_config(a);
    };

    function winit() {
        d('input[type="text"]').not('.input_description').val('').removeClass('borError');
        d('.modal').find('.icon_margin').remove();
        d('#arpbind').val(arp_bind);
    }

    et.addConfig = function (evt) {
        winit();
        optflag = "add";
        setform(evt);
    };

    et.editConfig = function (evt) {
        winit();
        optflag = "edit";
        setform(evt);
    }

    function setform(evt) {
        var arp_ipaddr, arp_mac, arp_network, arp_name, remark, real_num;

        arp_ipaddr = d(evt).parents('tr').find('.arp_ipaddr').text();
        arp_mac = d(evt).parents('tr').find('.arp_mac').text();
        arp_network = d(evt).parents('tr').find('.arp_network').text().toLowerCase();
        remark = d(evt).parents('tr').find('.arp_name').text();
        real_num = d(evt).parents('tr').find('.arp_rnum').text();

        d("#ip").val(arp_ipaddr);
        d("#mac").val(arp_mac);
        d("#interface_select").val(arp_network);
        d("#comment").val(remark);
        d("#real_num").val(real_num);
    }

    function set_config(arg) {
        f.setMConfig('arp_bind_list', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                setTimeout(refresh_init, 500);
                setTimeout(reset_lock_web, 3000);
            }
        });
    }

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});
