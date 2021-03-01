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

    var StaticList, DhcpList;
    var this_table, lock_web = false, tip_num = 0;
    var device_table = [];
    var double_support, dev_vlan_type, vlan_config;
    var section_action = "";
    var device_action = "";
    var section_real_num = 0;
    var lan_list;
    var access_config = {access_config: [
        {
            section_name: "Apple TV's access",
            devices: [
                {
                    desc: "",
                    ip: "",
                    mac_addr: "",
                    vlan_ifname: "",
                    vlan_descname: "",
                    status: 0, //ALLOW|BLOCK
                }
            ]
        }
    ]};

    

    function init() {
        
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
    }

    function refresh_init() {
        d('#all_section_checked').prop('checked', false).attr('data-value', '0');
        
        f.getSHConfig('bandwidth_config.php?method=GET&action=lan_list', function(data){
            lan_list = data || [];
        },false);

        f.getMConfig('vlan_config', function (data) {
            if (data && data.errCode == 0) {
                double_support = data.double_support;
                dev_vlan_type = data.vlan_itype;
                vlan_config = data.vlan || [];
            }
         }, false);

         f.getSHConfig('access_config.php?method=GET&action=load_data', function (data){
             if(data && data.errCode == 0)
             {
                access_config = data.access_config || [];

                //show table
                show_section_table();
                show_device_table();
             }

         }, false);

    }

    function show_device_table()
    {

        var this_html = '';
        d.each(access_config, function (n, m) {
            if(n % 2 == 0)
                this_html += '<div class="row clearfix">';

            this_html += `<div class="col-lg-6 clearfix">
            <div class="main-box clearfix">
            <div class="main-box-header">
                <h4 class="pull-left" >${m.section_name}</h4>
                <div class="pull-right filter-block">
                <button type="button" class="close mrg-l-md" et="click tab:delete_section_tab" data-value="${n}" aria-hidden="true">&times;</button>
                    <a class="btn btn-primary mrg-b-md beforebtn" et="click tap:add_device_list" data-value="${n}" data-toggle="modal" data-target="#modal_device" style="font-size:13px;">
                        <i class="fa fa-plus-circle fa-lg"></i>
                        <span sh_lang="global_add">Add Device</span>
                    </a>
                    <!--
                    <a class="btn btn-primary pull-right afterbtn"  data-value="${n}" et="click tap:del_device_select">
                        <i class="fa fa-trash-o fa-lg"></i>
                        <span sh_lang="firewall_delete_select">Delete Selected</span>
                    </a>
                    -->
                </div>
            </div>
            <div class="main-box-body" style="padding:10px; padding-bottom:10px">
                <div class="row list">
                    <div class=" col-lg-12 col-md-12 col-xs-12">
                        <div class="table-responsive">
                            <table class="table table-hover" id="table_device_${n}" data-value="${n}" style="font-size: 0.9em;">
                                <thead>
                                <tr>
                                    <th class="hidden"></th>
                                    <th class="hidden"></th>
                                    <th class="text-left">
                                        <input id="all_device_checked_${n}" class="hidden_over" name="checked-device-all" type="checkbox"/>
                                        <label class="label label-info select_laber" for="all_device_checked_${n}"
                                            sh_lang="selectall_tab">Select All</label>
                                    </th>
                                    <th class="text-left">
                                        <span sh_lang="device_description">Description</span>
                                    </th>
                                    <th class="text-left">
                                        <span sh_lang="device_ip">IP Adress</span>
                                    </th>
                                    <th class="text-left">
                                        <span sh_lang="device_macaddr">MAC Adress</span>
                                    </th>

                                    <th class="text-left">
                                        <span sh_lang="device_vlan_ifname">VLan</span>
                                    </th>
                                    <th class="text-center">
                                        <span sh_lang="device_status">Control</span>
                                    </th>
                                </tr>
                                </thead><tbody id="balance_tbody_${n}">`;
            //table body
            if(typeof m.devices != 'undefined')
            {
                d.each(m.devices, function(device_index, device_info){
                    var vlan_desc = "";
                    var cur_device_ip = device_info.ip;
                    var device_ip_num = IpSubnetCalculator.toDecimal(cur_device_ip);
                    var device_macaddr = "";
                    if(typeof device_info.mac_addr != 'undefined')
                        device_macaddr = device_info.mac_addr ;

                    d.each(vlan_config, function(vlan_index, vlan_data){

                        var calc_data = IpSubnetCalculator.calculateCIDRPrefix(vlan_data.ipaddr, vlan_data.netmask);
                        if(device_ip_num >= calc_data.ipLow && device_ip_num <= calc_data.ipHigh)
                        {
                            vlan_desc = vlan_data.desc == "" ? vlan_data.iface : vlan_data.desc;
                        }
                    });
                    
                    d.each(lan_list, function(lan_index, lan_info){
						if(lan_info.ipaddr == "" || lan_info.netmask == "") return;
						var calc_data = IpSubnetCalculator.calculateCIDRPrefix(lan_info.ipaddr, lan_info.netmask);
						if(device_ip_num >= calc_data.ipLow && device_ip_num <= calc_data.ipHigh)
						{
							//this ip is in this vlan_config
							vlan_desc = lan_info.hostname == "" ? lan_info.ifname.toUpperCase() : lan_info.hostname;
							//vlan_iface = lan_info.ifname.toUpperCase();
							return false;
						}
					});



                    this_html += `<tr class="text-center">
                                    <td class="device_real_num hidden" >${device_index}</td>
                                    <td class="device_status hidden">${device_info.status}</td>
                                    <td><input class="chk_device" type="checkbox"></td>
                                    <td class="device_description text-left">${device_info.desc}</td>
                                    <td class="device_ip text-left">${device_info.ip}</td>
                                    <td class="device_macaddr text-left">${device_macaddr}</td>
                                    <td class="vlan_desc text-left">${vlan_desc}</td>
                                    <td>
                                    
                                        <a  sh_title="edit" title="Allow" class="btn bm_btn btn-default beforebtn ${device_info.status == 1 ? "active" : ""}" et="click tap:AllowDeviceConfig" style="padding: 0px 12px;">
                                            <span class="fa-stack">Allow</span>
                                        </a>
                                        <a  sh_title="edit" title="Block" class="btn bm_btn btn-default afterbtn ${device_info.status == 0 ? "active" : ""}" et="click tap:BlockDeviceConfig" style="padding: 0px 12px;">
                                            <span class="fa-stack">Block</span>
                                        </a>
                                        <a data-toggle="modal" data-target="#modal_device" sh_title="edit" title="Edit" class="table-link etid_btn" et="click tap:editDevice">
                                        <span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a>
                                    <a  class="table-link">
                                        <span class="fa-stack" et="click tap:delDevice"><i class="fa fa-square fa-stack-2x red"></i><i title="Delete" sh_title="global_delete" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a> 

                                    </td>
                                </tr>`;
                });
            }
            this_html += `</tbody></table></div></div></div></div></div></div>`;
            if(n % 2 == 1)
                this_html += '</div>';

        });
        d('#section_panel').html(this_html);
        // device table handler

        d.each(access_config, function(n, m){

            if(typeof m.devices != 'undefined')
            {
                if (m.devices.length > 0) {
                    device_table[n] = d('#table_device_' + n).DataTable({
                        "bDestroy": true,
                        "paging": false,
                        "columns": [
                            {"orderable": false},
                            {"orderable": false},
                            {"orderable": false},
                            {"orderable": true},
                            {"orderable": true},
                            {"orderable": true},
                            {"orderable": true},
                            {"orderable": false}
                        ],
                        "drawCallback": function () {
                            device_laber_text(n, false);
                            d(":checkbox", d('#table_device_' + n)).prop('checked', false);
                        }
                    });
                    //device_table[n].page.len(m.devices.length).draw();
                }
    
                d('#table_device_' + n).on("change", ":checkbox", function () {
                    if (d(this).is("[name='checked-device-all']")) {
                        d(":checkbox:enabled", d('#table_device_' + n)).prop("checked", d(this).prop("checked"));
                        device_laber_text(n, d(this).prop("checked"));
                    } else {
                        var checkbox = d("tbody :checkbox:enabled", d('#table_device_' + n));
                        d(":checkbox[name='checked-device-all']", d('#table_device_' + n)).prop('checked', checkbox.length == checkbox.filter(':checked:enabled').length);
                        device_laber_text(n, checkbox.length == checkbox.filter(':checked:enabled').length);
                    }
                }).on("click", ".chk_device", function (event) {
                    !d(event.target).is(":checkbox") && d(":checkbox", this).trigger("click");
                });
            }


        });

    }


    function device_laber_text(section_num, status) {
        if (status) {
            d("[for='all_device_checked_" + section_num + "']").text(disselectall_tab);
        } else {
            d("[for='all_device_checked_" + section_num + "']").text(selectall_tab);
        }
    }

    function show_section_table() {
        return;
        var this_html = '';

        d('#table_section').dataTable().fnClearTable();
        d('#table_section').dataTable().fnDestroy();

        d.each(access_config, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td class="real_num hidden" >' + n + '</td>';
            this_html += '<td><input class="chk_section" type="checkbox"></td>';
            this_html += '<td class="src_section_name">'+ m.section_name + '</td>';
            this_html += `<td><a data-toggle="modal" data-target="#modal_section" sh_title="edit" title="Edit" class="table-link etid_btn" et="click tap:editSection">
                                <span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a>
                            <a  class="table-link">
                                <span class="fa-stack" et="click tap:delSection"><i class="fa fa-square fa-stack-2x red"></i><i title="Delete" sh_title="global_delete" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a> 
                          </td></tr>`;
        });
        d('#section_tbody').html(this_html);




        if (access_config.length > 0) {
            this_table = d('#table_section').DataTable({
                "bDestroy": true,
                "paging": false,
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    {"orderable": true},
                    {"orderable": false}
                ],
                "drawCallback": function () {
                    laber_text(false);
                    d(":checkbox", d('#table_wrapper')).prop('checked', false);
                }
            });
            //this_table.page.len(access_config.length).draw();
        }
    }

    d('#table_section').on("change", ":checkbox", function () {
        if (d(this).is("[name='checked-section-all']")) {
            d(":checkbox:enabled", d('#table_section')).prop("checked", d(this).prop("checked"));
            laber_text(d(this).prop("checked"));
        } else {
            var checkbox = d("tbody :checkbox:enabled", d('#table_section'));
            d(":checkbox[name='checked-section-all']", d('#table_section')).prop('checked', checkbox.length == checkbox.filter(':checked:enabled').length);
            laber_text(checkbox.length == checkbox.filter(':checked:enabled').length);
        }
    }).on("click", ".chk_section", function (event) {
        !d(event.target).is(":checkbox") && d(":checkbox", this).trigger("click");
    });

    function laber_text(status) {
        if (status) {
            d("[for='all_section_checked']").text(disselectall_tab);
        } else {
            d("[for='all_section_checked']").text(selectall_tab);
        }
    }


    et.refresh_list = function () {
        d('#section_tbody').html('');
        refresh_init();
    };

    et.add_section_list = function(){
        section_action = "add";
        g.clearall();
    }

    et.add_device_list = function(evt){
        section_real_num = evt.attr("data-value");
        device_action = "add";
        g.clearall();
    }

    et.del_section_select = function(){
        section_action = 'del';
        var a = {}, this_checked;
        a.real_num = '';
        this_checked = d('#section_tbody').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            a.real_num += d(m).parents('tr').find('.real_num').text() + ',';
        });
        a.operate = section_action;
        set_config(a);
    }


    et.del_device_select = function(evt){
        device_action = 'del';
        var a = {}, this_checked;
        section_real_num = evt.attr("data-value");
        a.device_real_num = '';
        this_checked = d('#device_tbody_' + section_real_num).find('input:checked');
        if(this_checked.length < 1)
            return;

        this_checked.each(function(n, m){
            a.device_real_num += d(m).parents('tr').find('.device_real_num').text() + ',';
        });
        
        a.operate = device_action;
        set_device_config(a);
    }



    //section action handler
    et.delSection = function (evt) {
        var a = {}, real_num;
        section_action = 'del';
        real_num = evt.parents('tr').find('.real_num').html();
        if (lock_web) {
            return;
        }
        a.real_num = real_num + ",";
        a.operate = section_action;
        set_config(a);
    };


    et.delete_section_tab = function(evt){
        var a = {}, real_num;
        section_action = 'del';
        real_num = evt.attr('data-value');
        if (lock_web) {
            return;
        }
        g.shconfirm(confirm_delete_section, 'confirm', {
            onOk: function () {
                a.real_num = real_num + ",";
                a.operate = section_action;
                set_config(a);
        
            }
        });
        
       
    }

    et.delDevice = function(evt){
        var a = {}, device_real_num;
        device_action = 'del';
        section_real_num = evt.parents('table').attr("data-value");
        device_real_num = evt.parents('tr').find('.device_real_num').html();
        if(lock_web) {
            return;
        }
        a.section_real_num = section_real_num;
        a.device_real_num = device_real_num + ",";
        a.operate = device_action;
        set_device_config(a);

    }

    et.editSection = function(evt){
        g.clearall();
        section_action = "edit";
        d('#section_real_num').val(d(evt).parents('tr').find('.real_num').html());
        d('#section_name').val(d(evt).parents('tr').find('.src_section_name').html());

    }

    et.editDevice = function(evt){
        g.clearall();
        device_action = "edit";
        section_real_num = evt.parents('table').attr("data-value");
        d('#device_real_num').val(d(evt).parents('tr').find('.device_real_num').html());
        d('#device_ip').val(d(evt).parents('tr').find('.device_ip').html());
        d('#device_description').val(d(evt).parents('tr').find('.device_description').html());
        d('#device_status').val(d(evt).parents('tr').find('.device_status').html());
    }

    et.BlockDeviceConfig = function(evt){
        device_action = "edit";
        var arg_data = {};
        arg_data.operate = "edit";
        arg_data.status = 0;
        arg_data.section_real_num = evt.parents('table').attr("data-value");
        arg_data.device_real_num  = evt.parents('tr').find('.device_real_num').html();
        arg_data.ip = (evt).parents('tr').find('.device_ip').html();
        arg_data.desc = d(evt).parents('tr').find('.device_description').html();
        arg_data.mac_addr = (evt).parents('tr').find('.device_madaddr').html();

        set_device_config(arg_data);
    }

    et.AllowDeviceConfig = function(evt){
        device_action = "edit";
        var arg_data = {};
        arg_data.operate = "edit";
        arg_data.status = 1;
        arg_data.section_real_num = evt.parents('table').attr("data-value");
        arg_data.device_real_num  = evt.parents('tr').find('.device_real_num').html();
        arg_data.ip = (evt).parents('tr').find('.device_ip').html();
        arg_data.desc = d(evt).parents('tr').find('.device_description').html();
        arg_data.mac_addr = (evt).parents('tr').find('.device_madaddr').html();

        set_device_config(arg_data);
    }

    et.saveConfig = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_section_volide()) {
            lock_web = false;
            d('#btn_section_closewin').click();
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    et.saveDeviceConfig = function(){
        if(!g.format_volide_ok()){
            return;
        }
        var arg_data;
        if(lock_web) return;
        lock_web = true;
        if(arg_data = set_device_volid()){
            lock_web = false;
            d('#btn_device_closewin').click();
            set_device_config(arg_data);
        }else {
            lock_web = false;
        }

    }

    function set_device_volid(){
        var error_flag = 0, arg = {};
        arg.operate = device_action;
       
        arg.section_real_num = section_real_num;

        arg.status = d('#device_status').val();
        arg.ip = d('#device_ip').val();
        arg.mac_addr = d('#device_macaddr').val();
        if(arg.ip == "")
        {
            h.ErrorTip(tip_num++, pls_input_device_ip);
            return false;
        }
        if(!IpSubnetCalculator.isIp(arg.ip))
        {
            h.ErrorTip(tip_num++, firewall_ipaddr_invalid);
            return false;
        }

        if(device_action == 'edit'){
            arg.device_real_num = parseInt(d('#device_real_num').val());

            d.each(access_config, function(n,m){
                if(typeof m.devices != 'undefined')
                {
                    d.each(m.devices, function(device_index, device_info){
                        if(device_info.ip == arg.ip && 
                            (arg.device_real_num != device_index ||
                            arg.section_real_num != n))
                        {
                            error_flag = 1;
                            return false;
                        }
                    });
                }
    
                if(error_flag == 1)
                return false;
            });

            
        }
        else if(device_action == "add")
        {
            d.each(access_config, function(n,m){
                if(typeof m.devices != 'undefined')
                {
                    d.each(m.devices, function(device_index, device_info){
                        if(device_info.ip == arg.ip)
                        {
                            error_flag = 1;
                            return false;
                        }
                    });
                }
    
                if(error_flag == 1)
                return false;
            });
        }





        if(error_flag == 1)
        {
            h.ErrorTip(tip_num++, duplicated_ip_exists);
            return false;
        }
        arg.desc = d('#device_description').val();
        if(arg.desc == ""){
            h.ErrorTip(tip_num++, pls_input_device_description);
            return false;
        }


        return arg;
    }


    function set_section_volide(){
        var error_flag = 0, arg = {}, iparray, set_ips;

        arg.section_name = d('#section_name').val();
        if(arg.section_name == "")
        {
            h.ErrorTip(tip_num++, section_description_required);
            return false;
        }



        arg.operate = section_action;
        if (section_action == 'edit') {
            arg.real_num = parseInt(d("#section_real_num").val());
            d.each(access_config, function(n, m){

                if(arg.section_name == m.section_name && n == arg.real_num)
                {
                    error_flag = 1; 
                    return false;
                }
            } );
        }
        else if(section_action == 'add')
        {
            d.each(access_config, function(n, m){

                if(arg.section_name == m.section_name)
                {
                    error_flag = 1; 
                    return false;
                }
            } );
        }

        if(error_flag == 1)
        {
            h.ErrorTip(tip_num++, duplicate_section_exists);
            return false;
        }

        return arg;
    }

    function run_waitMe(effect){
		$('#page-wrapper').waitMe({
			effect: effect,
			text: please_waiting,
			bg: 'rgba(255,255,255,0.7)',
			color:'#000'
		});
    }

    //loading finished
    function release_loading(bshowTip)
    {
        $('#page-wrapper').waitMe('hide');
        if(bshowTip)
            h.SetOKTip(tip_num++, set_success);
    }

   function set_device_config(arg){

        run_waitMe('ios');
        f.setSHConfig('access_config.php?method=SET&action=save_device_data', arg, function (data) {
            if (data.errCode != 0) {
                    h.ErrorTip(tip_num++, data.errCode);

                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                setTimeout(reset_lock_web, 3000)
            }
            refresh_init();
            release_loading(false);

        });
  }



    function set_config(arg) {
        f.setSHConfig('access_config.php?method=SET&action=save_data', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                setTimeout(reset_lock_web, 3000)

            }
            refresh_init();

            release_loading(false);
        });
    }

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});
