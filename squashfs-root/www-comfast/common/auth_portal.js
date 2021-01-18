define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require("tips"),
        j = require("validate"),
        device,
        et = {};

    require('touch');
    require('bootstrap')(d);
    require('datatables')(d);
    require('tabletool')(d);
    require("upload")(d);

    var lanlist, vlanlists, wanlists, portal_info, config_info, wifilith_config, tmp_auth_type, randomnumber,
        upload_file, upload_images;

    var portal_account, portal_passwd, action, upload_type, file_format, version, sec_flag, device_type;
    var this_table, passwd_table, default_num = 10;

    var reg = /[^\\\/]*[\\\/]+/g;

    var lock_web = false, tip_num = 0;
    var ie = !-[1,];


    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('#content-wrapper');
        randomnumber = Math.floor(Math.random() * 100000);
        device_show();
        refresh_init();
    }

    function device_show() {
        if (!device.ac_mode) {
            d("#iface_dis").addClass('hide');
            d("#guest_dis").removeClass('hide');
            d("#lan_set_tips").addClass('hide');
            d('#local_tip').removeClass('hide');
        }

        d.ajax({
            type: 'GET',
            dataType: 'json',
            async: false,
            url: '/js/config.json',
            cache: false,
            success: function (data) {
                device_type = data.device_type;
            }
        })
    }

    function refresh_init() {
        upload_images = 0;

        f.getMConfig("firmware_info", function (data) {
            if (data && data.errCode == '0') {
                version = data.firmware.version;
                if (version.indexOf("650AC") > -1) {
                    d("#is650").removeClass("hidden");
                }
            }
        });

        f.getMConfig("multi_pppoe", function (data) {
            if (data && data.errCode == '0') {
                wanlists = data.wanlist;
            }
        }, false);

        f.getMConfig("lan_dhcp_config", function (data) {
            if (data && data.errCode == '0') {
                lanlist = data.lanlist;
                vlanlists = data.vlanlist || [];
                showiface();
            }
        }, false);

        f.getMConfig("wifilith_config", function (data) {
            if (data && data.errCode == '0') {
                wifilith_config = data.localauth;
            }
        }, false);

        f.getMConfig("wifilith_pic_desc", function (data) {
            if (data && data.errCode == '0') {
                portal_info = data;
                config_info = d.extend(true, {}, data);
                page_refresh();
            }
        });

        f.getMConfig('portal_account_config', function (data) {
            if (data.errCode == 0) {
                portal_account = data.list || [];
                table_account();
            }
        });

        f.getMConfig('portal_passwd_config', function (data) {
            if (data.errCode == 0) {
                portal_passwd = data.list || [];
                table_passwd();
            }
        });
    }

    function page_refresh() {
        var this_html = '';
        sec_flag = 0;
        if (wifilith_config.enable == "0" || wifilith_config.enable == "") {
            tmp_auth_type = "close";
        } else {
            tmp_auth_type = wifilith_config.type;
        }
        d('#auth_type').val(tmp_auth_type);
        d('#html_title').val(portal_info.page_title);
        d('#ad_title').val(portal_info.header_title);
        d('#ad_btn_time').val(portal_info.times || "15");
        d('#btn_link').val(portal_info.ok_link);

        if (portal_info.sliderpic && portal_info.sliderpic.length < 3) {
            d('#slider_img_upload').removeClass('hide');
        } else {
            d('#slider_img_upload').addClass('hide');
        }

        d.each(portal_info.sliderpic, function (n, m) {
            this_html += '<div class="row mrg-b-lg list" id="sidebar_div_' + (n + 1) + '">';
            this_html += '<span class="tip_name hide"></span>';
            this_html += '<div class="col-lg-4 col-md-4 col-xs-4 col-md-4"><img class="img-responsive" id="slider_img_' + (n + 1) + '" src="/www/' + m.src + '?' + randomnumber + '" ></div>';
            if (tmp_auth_type == "weixin" || tmp_auth_type == "account" || tmp_auth_type == "passwd") {
                this_html += '<div class="col-lg-6 col-md-6 col-xs-6 form_right hidden" >';
            } else {
                this_html += '<div class="col-lg-6 col-md-6 col-xs-6 form_right" >';
            }
            this_html += '<span><input type="text" class="form-control isNULL" id="slider_link_' + (n + 1) + '" value="' + m.linkaddr + '" maxlength = "256" ></span>';
            this_html += '<p sh_lang="ad_slider_link_tiptext">' + ad_slider_link_tiptext + '</p></div>';
            this_html += '<div class="col-lg-2 col-md-2  col-xs-2 input-form">';
            this_html += '<i class="fa fa-times col-lg-1 col-md-1 icon-error col-xs-1 icon_margin icon_pointer" data-value="' + (n + 1) + '" id="removeslider1" et="click tap:removeslider"></i></div>';
            this_html += '</div>';
        });
        d('#sidebar_config').html(this_html);
        d.each(portal_info.staticpic, function (n, m) {
            var num = g.getifacenum(n);
            d('#static_img_' + num).attr('src', '../www/' + m.src + '?' + randomnumber);
            d('#static_link_' + num).val(m.linkaddr);
            d('#static_title_' + num).val(m.pic_text);
        });

        var enable_type;

        if (wifilith_config.type == 'wx') {
            enable_type = wifilith_config.enable_weixin;
        } else {
            enable_type = wifilith_config.enable_local;
        }

        d("#auth_switch").val(enable_type);
        d("#shop_id").val(wifilith_config.shop_id);
        d("#appid").val(wifilith_config.appid);
        d("#iface_option").val(wifilith_config.extiface);
        d("#secretkey").val(wifilith_config.secretkey);
        d("#rate").val(parseInt(wifilith_config.rate) / (1000 * 1000) || "");
        d(".auth_time").val(wifilith_config.timeout / 60 || "720");
        d(".auth_whitemac").val(wifilith_config.whitemac.replace(/,/g, ";"));
        d("#ipaddr").val(wifilith_config.guest_ipaddr);
        d("#netmask").val(wifilith_config.guest_netmask || "255.255.255.0");
        d("#ssid").val(wifilith_config.guest_ssid);

        show_auth_box(tmp_auth_type);
    }

    function show_auth_box(data) {
        d('.only_type').addClass('hidden');
        if (data == "close") {
            d("#auth_all_box").addClass("hidden");
            return false;
        } else {
            d("#auth_all_box").removeClass("hidden");
        }
        if (sec_flag) {
            new_json();
        }
        switch (data) {
            case "weixin":
                weixin_init();
                break;
            case 'wxpay':
                wxpay_init();
                break;
            case "traffic":
                traffic_init();
                break;
            case "account":
                account_init();
                break;
            case "passwd":
                passwd_init();
                break;
            default:
                local_init();
        }
    }

    function local_init() {
        var randomlink = "../www/local.html?" + randomnumber;
        d('#iframe_swap').attr('src', randomlink);
        d("#ad_btn_time_block").removeClass("hidden");
        d("#btn_link_block").removeClass("hidden");
        d("#static_block").removeClass("hidden");

        d('#local_type').removeClass('hidden');
        d('#weixin_type').addClass('hidden');
        if (device.ac_mode == 1) {
            d('#iface_box').removeClass('hidden');
            d('#local_auth_box').removeClass('hidden');
        } else {
            d('#only_wan').removeClass('hidden');
            d('#local_auth_box').removeClass('hidden');
        }
    }

    function weixin_init() {
        var randomlink = "../www/weixin.html?" + randomnumber;
        d('#iframe_swap').attr('src', randomlink);
        d("#ad_btn_time_block").addClass("hidden");
        d("#btn_link_block").addClass("hidden");
        d("#static_block").addClass("hidden");

        d('#weixin_type').removeClass('hidden');
        if (device.ac_mode == 1) {
            d('#iface_box').removeClass('hidden');
            d('#local_auth_box').removeClass('hidden');
        } else {
            d('#only_wan').removeClass('hidden');
            d('#local_auth_box').removeClass('hidden');
        }
    }

    function wxpay_init() {
        var randomlink = "../www/wxpay.html?" + randomnumber;
        d('#iframe_swap').attr('src', randomlink);
        d("#ad_btn_time_block").addClass("hidden");
        d("#btn_link_block").addClass("hidden");
        d("#static_block").addClass("hidden");

        d('#weixin_type').addClass('hidden');
        d('#wxpay_type').removeClass('hidden');
        if (device.ac_mode == 1) {
            d('#iface_box').removeClass('hidden');
            d('#local_auth_box').removeClass('hidden');
        } else {
            d('#only_wan').removeClass('hidden');
            d('#local_auth_box').removeClass('hidden');
        }
    }

    function traffic_init() {
        var randomlink = "../www/traffic.html?" + randomnumber;
        d('#iframe_swap').attr('src', randomlink);
        d("#ad_btn_time_block").removeClass("hidden");
        d("#btn_link_block").removeClass("hidden");
        d("#static_block").removeClass("hidden");

        d('#traffic_type').removeClass('hidden');
        if (device.ac_mode == 1) {
            d('#iface_box').removeClass('hidden');
            d('#local_auth_box').removeClass('hidden');
        } else {
            d('#only_wan').removeClass('hidden');
            d('#local_auth_box').removeClass('hidden');
        }
    }

    function account_init() {
        var randomlink = "../www/account.html?" + randomnumber;
        d('#iframe_swap').attr('src', randomlink);
        d("#ad_btn_time_block").addClass("hidden");
        d("#btn_link_block").removeClass("hidden");
        d("#static_block").addClass("hidden");

        d('#account_type').removeClass('hidden');
        d("#account_box").removeClass('hidden');
        if (device.ac_mode == 1) {
            d('#iface_box').removeClass('hidden');
            d('#local_auth_box').removeClass('hidden');
        } else {
            d('#only_wan').removeClass('hidden');
            d('#local_auth_box').removeClass('hidden');
        }
    }

    function passwd_init() {
        var randomlink = "../www/passwd.html?" + randomnumber;
        d('#iframe_swap').attr('src', randomlink);
        d("#ad_btn_time_block").addClass("hidden");
        d("#btn_link_block").removeClass("hidden");
        d("#static_block").addClass("hidden");

        d('#passwd_type').removeClass('hidden');
        d("#passwd_box").removeClass('hidden');
        if (device.ac_mode == 1) {
            d('#iface_box').removeClass('hidden');
            d('#local_auth_box').removeClass('hidden');
        } else {
            d('#only_wan').removeClass('hidden');
            d('#local_auth_box').removeClass('hidden');
        }
    }

    function showiface() {
        var this_html = '';
        d.each(lanlist, function (n, m) {
            if (device.ac_mode == '1' && device.mlan == "1") {
                if (m.iface != 'lan') {
                    this_html += '<option value="' + m.iface + '">' + m.name.toUpperCase() + '</option>'
                }
            } else {
                this_html += '<option value="' + m.iface + '">' + m.name.toUpperCase() + '</option>'
            }
        });
        d('#iface_option').html(this_html);
    }

    et.change_auth_type = function (evt) {
        tmp_auth_type = evt.val();
        sec_flag = "1";
        show_auth_box(tmp_auth_type);
    };

    et.removeslider = function (evt) {
        var num = evt.attr('data-value');
        var arg = {};
        arg.portal_delete_picname = d("#slider_img_" + num).attr('src').replace(reg, '').split('?')[0];
        d("#sidebar_div_" + num).remove();
        d("#slider_img_upload").removeClass("hide");

        f.setMConfig('wifilith_delete_pic_file', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
            }
        });

        config_info.sliderpic.splice(num - 1, 1);
        delect_img_json(config_info);
    };

    function delect_img_json(arg) {
        f.setMConfig('wifilith_pic_desc', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                sec_flag = 1;
                new_json();
            }
        });
    }

    function new_json() {
        var this_html = "";
        f.getMConfig('wifilith_pic_desc', function (data) {
            portal_info = data;
            d.each(data.sliderpic, function (n, m) {
                this_html += '<div class="row mrg-b-lg list" id="sidebar_div_' + (n + 1) + '">';
                this_html += '<span class="tip_name hide"></span>';
                this_html += '<div class="col-lg-4 col-md-4 col-xs-4 col-md-4"><img class="img-responsive" id="slider_img_' + (n + 1) + '" src="/www/' + m.src + '?' + randomnumber + '" ></div>';
                if (tmp_auth_type == "weixin" || tmp_auth_type == "account" || tmp_auth_type == "passwd") {
                    this_html += '<div class="col-lg-6 col-md-6 col-xs-6 form_right hidden" >';
                } else {
                    this_html += '<div class="col-lg-6 col-md-6 col-xs-6 form_right" >';
                }

                this_html += '<span><input type="text" class="form-control isNULL" id="slider_link_' + (n + 1) + '" value="' + m.linkaddr + '" maxlength = "256" ></span>';
                this_html += '<p sh_lang="ad_slider_link_tiptext">' + ad_slider_link_tiptext + '</p></div>';
                this_html += '<div class="col-lg-2 col-md-2  col-xs-2 input-form">';
                this_html += '<i class="fa fa-times col-lg-1 col-md-1 icon-error col-xs-1 icon_margin icon_pointer" data-value="' + (n + 1) + '" id="removeslider1" et="click tap:removeslider"></i></div>';
                this_html += '</div>';
            });
            d('#sidebar_config').html(this_html);
        });
    }

    d('#slider_upload_input').change(function (e) {

        if (!d('#slider_upload_input').val().match(/\.png$|\.jpg$|\.jpeg$|\.PNG|\.JPG$|\.JPEG$/i) == null) {
            h.ErrorTip(tip_num++, ad_pic_limit_tiptext);
            setTimeout(reset_lock_web, 1000);
            return;
        }

        if (!ie && !funGetFiles(e)) {
            return false;
        }

        if (d('#slider_upload_input').val() != '' && d('#slider_upload_input').val() != undefined) {
            setTimeout(slider_upload_img, 1000)
        }
    });

    et.slider_upload = function () {
        slider_upload_img();
    };

    function slider_upload_img() {

        var arg = {};
        var upload_img = d('#slider_upload_input').val();

        if (lock_web) return;
        lock_web = true;

        d("#slider_upload_input").upload({
            url: '/cgi-bin/mbox-config?method=SET&section=system_wl_upload_pic_file',
            onComplate: function (data) {
                if (data && data.errCode != 0) {
                    h.ErrorTip(tip_num++, data.errCode);
                }
            }
        });
        d("#slider_upload_input").upload("ajaxSubmit");
        upload_file = 1;

        var FileExt = upload_img.replace(reg, '').split('?')[0];
        arg.src = 'img/' + FileExt;
        arg.linkaddr = '';
        config_info.sliderpic.push(arg);
        config_info.type = d('#auth_type').val();
        upload_images = 1;

        if ((wifilith_config.type != d("#auth_type").val() || wifilith_config.enable == "0") && device_type != "ac_mini") {
            wifilith_config.enable = "1";
            wifilith_config.type = d("#auth_type").val();
            set_config_auth_temp(wifilith_config);
        }

        set_config_picdesc(config_info);
    }

    et.upload_static_click = function (evt) {
        var num;
        num = evt.attr('data-value');
        d('#static_upload_input').attr('data-value', num);
    };

    d('#static_upload_input').change(function (e) {
        if (!ie && !funGetFiles(e)) {
            return false;
        }

        if (d('#static_upload_input').val() != '' && d('#static_upload_input').val() != undefined) {
            setTimeout(static_upload_img, 1000)
        }
    });

    et.static_upload = function () {
        static_upload_img()
    };

    function static_upload_img() {
        var arg = {};
        var num = d('#static_upload_input').attr('data-value');
        var upload_img = d('#static_upload_input').val();
        if (lock_web) return;
        lock_web = true;

        var Reg_type_name = new RegExp("/\.first$|\.png$|\.jpg$|\.jpeg$|\.PNG$|\.JPG$|\.JPEG$|\.end$/i");

        if (!Reg_type_name.test(upload_img)) {
            h.ErrorTip(tip_num++, ad_pic_limit_tiptext);
            //setTimeout(reset_lock_web, 1000);
            return;
        }

        arg.portal_delete_picname = config_info.staticpic['static' + num].src.replace(reg, '');

        f.setMConfig('wifilith_delete_pic_file', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
            }
        });

        d("#static_upload_input").upload({
            url: '/cgi-bin/mbox-config?method=SET&section=system_wl_upload_pic_file',
            onComplate: function (data) {
                if (data && data.errCode != 0) {
                    h.ErrorTip(tip_num++, data.errCode);
                    return false;
                }
            }
        });
        d("#static_upload_input").upload("ajaxSubmit");
        upload_file = 1;

        var FileExt = upload_img.replace(reg, '').split('?')[0];
        var this_obj = config_info.staticpic['static' + num];
        this_obj.src = 'img/' + FileExt;
        config_info.type = d('#auth_type').val();
        upload_images = 1;

        if ((wifilith_config.type != d("#auth_type").val() || wifilith_config.enable == "0") && device_type != "ac_mini") {
            wifilith_config.enable = "1";
            wifilith_config.type = d("#auth_type").val();
            set_config_auth_temp(wifilith_config);
        }
        set_config_picdesc(config_info);
    };

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
    };

    et.saveConfig = function () {

        if (!g.format_volide_ok()) {
            return;
        }

        if (device_type == "ac_mini" && d("#auth_type").val() != "close") {
            d("#modal_tips").modal("show");
        } else {
            share_config();
        }
    };

    et.save_ok = function () {
        d('#modal_tips').modal('hide');
        share_config();
    };

    function share_config() {
        var arg_data, picdesc_data;
        if (lock_web) return;
        lock_web = true;
        if ((picdesc_data = set_volide_picdesc()) && (arg_data = set_volide_auth())) {
            set_config_picdesc(picdesc_data);
            set_config_auth(arg_data)
        } else {
            lock_web = false;
        }
    }

    function funGetFiles(e) {
        var files = e.target.files || e.dataTransfer.files;
        return funDealtFiles(files);
    }

    function funDealtFiles(files) {
        var i, file;
        for (i = 0; i < files.length; i++) {
            file = files[i];
            if (file.size >= 550000) { //size
                var sizeerror = file.name + too_large + "500KB";
                h.ErrorTip(tip_num++, sizeerror);
                return false;
            } else { //type
                if (file.type.indexOf("image") != 0) {
                    var typeerror = file.name + not_image;
                    h.ErrorTip(tip_num++, typeerror);
                    return false;
                }
            }
        }
        return true;
    }

    function set_volide_picdesc() {
        var arg = {}, sliderpic = [], staticpic = {};

        arg.type = d('#auth_type').val();
        arg.page_title = d('#html_title').val();
        arg.header_title = d('#ad_title').val();
        arg.times = d('#ad_btn_time').val();
        arg.ok_link = d('#btn_link').val();

        d.each(portal_info.sliderpic, function (n, m) {
            sliderpic[n] = {};
            sliderpic[n].src = 'img/' + d('#slider_img_' + (n + 1)).attr('src').replace(reg, '').split('?')[0];
            sliderpic[n].linkaddr = d('#slider_link_' + (n + 1)).val();
        });

        d.each(portal_info.staticpic, function (n, m) {
            var num = g.getifacenum(n);
            staticpic['static' + num] = {};
            staticpic['static' + num].src = 'img/' + d('#static_img_' + num).attr('src').replace(reg, '').split('?')[0];
            staticpic['static' + num].linkaddr = d('#static_link_' + num).val();
            staticpic['static' + num].pic_text = d('#static_title_' + num).val();
        });

        arg.sliderpic = sliderpic;
        arg.staticpic = staticpic;
        return arg;
    }

    function set_volide_auth() {
        var arg = {};
        if (d("#auth_type").val() == "close") {
            arg.enable = "0";
            arg.type = wifilith_config.type;
        } else {
            arg.type = d("#auth_type").val();
            arg.enable = "1";
        }

        if (!device.ac_mode) {
            arg.guest_flag = "1";
        }
        if (arg.enable == '1') {
            if (device.ac_mode == '0') {
                arg.extiface = "guest";
                arg.guest_ipaddr = d("#ipaddr").val();
                arg.guest_netmask = d("#netmask").val();
                arg.guest_ssid = d("#ssid").val();

                for (var i = 0; i < lanlist.length; i++) {
                    var m = lanlist[i];
                    if (h.isEqualIP(arg.guest_ipaddr, arg.guest_netmask, m.ipaddr, m.netmask)) {
                        h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + m.name.toUpperCase() + local_subnet_conflict_tip2);
                        return false;
                    }
                }

                for (var i = 0; i < vlanlists.length; i++) {
                    var m = vlanlists[i];
                    if (h.isEqualIP(arg.guest_ipaddr, arg.guest_netmask, m.ipaddr, m.netmask)) {
                        h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + m.iface + local_subnet_conflict_tip2);
                        return false;
                    }
                }

                for (var i = 0; i < wanlists.length; i++) {
                    for (var l = 0; l < wanlists[i].length; l++) {
                        var m = wanlists[i][l];
                        if (h.isEqualIP(arg.guest_ipaddr, arg.guest_netmask, m.wan_ipaddr, m.wan_netmask)) {
                            h.ErrorTip(tip_num++, local_subnet_conflict_tip4 + m.name.toUpperCase() + local_subnet_conflict_tip2);
                            return false;
                        }
                    }
                }

            } else {
                if (d("#iface_option").val() == '' || d("#iface_option").val() == undefined) {
                    h.ErrorTip(tip_num++, local_tips);
                    return false;
                }
                arg.extiface = d("#iface_option").val();
            }
            if (arg.type == 'weixin') {
                arg.shop_id = d("#shop_id").val();
                arg.appid = d("#appid").val();
                arg.secretkey = d("#secretkey").val();
            } else if (arg.type == 'wxpay') {
                arg.wxpay_appid = d("#wxpay_appid").val();
                arg.wxpay_mch_id = d("#wxpay_mchid").val();
                arg.wxpay_key = d("#wxpay_key").val();
                arg.wxpay_body = d("#wxpay_body").val();
                arg.wxpay_total_fee = '' + parseInt(d("#wxpay_fee").val()) * 100;
                if (key_file != 1) {
                    h.ErrorTip(tip_num++, auth_wxpay_key + auth_no_exist);
                    return false;
                }
                if (cert_file != 1) {
                    h.ErrorTip(tip_num++, auth_wxpay_cert + auth_no_exist);
                    return false;
                }
            } else if (arg.type == 'traffic') {
                arg.rate = '' + parseInt(d("#rate").val()) * 1000 * 1000;
            }

            var timeout = parseInt(d("#" + arg.type + "_auth_time").val());
            timeout = timeout * 60;

            arg.timeout = timeout.toString();
            arg.whitemac = d("#" + arg.type + "_auth_whitemac").val().replace(/;/g, ",");
            arg.extauth = "portal";
            arg.shop_id = d("#shop_id").val();
            arg.appid = d("#appid").val();
            arg.secretkey = d("#secretkey").val();
        }
        return arg;
    }

    function set_config_auth_temp(arg) {
        f.setMConfig('wifilith_config', arg, function (data) {
        })
    }

    function set_config_auth(arg) {
        f.setMConfig('wifilith_config', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                g.setting(15, gohref);
            }
        })
    }

    function set_config_picdesc(arg) {
        f.setMConfig('wifilith_pic_desc', arg, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                if (upload_images) {
                    g.setting(6, gohref);
                } else {
                    refresh_init();
                }
            }
        });
    }

    function table_account() {
        var this_html = '';

        d('#hotel_table').dataTable().fnClearTable();
        d('#hotel_table').dataTable().fnDestroy();

        d.each(portal_account, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td class="num" style="display: none">' + m.num + '</td>';
            this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="username">' + m.user + '</td>';
            this_html += '<td class="password">' + m.passwd + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_one" class="table-link etid_btn" et="click tap:edit_hotel"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger del_btn" et="click tap:del_hotel"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + ac_group_del_btn + '" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '</tr>';
        });
        d("#hotel_tbody_info").html(this_html);

        if (portal_account.length > 0) {
            this_table = d('#hotel_table').DataTable({
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    null,
                    null,
                    null,
                    {"orderable": false}
                ],
                "drawCallback": function () {
                    account_laber_text(false);
                    d(":checkbox", d('#hotel_table_wrapper')).prop('checked', false);
                }
            });
            this_table.page.len(default_num).draw();
        }
    }

    d('#hotel_table').on("change", ":checkbox", function () {
        if (d(this).is("[name='checked-all']")) {
            d(":checkbox:enabled", d('#hotel_table')).prop("checked", d(this).prop("checked"));
            account_laber_text(d(this).prop("checked"));
        } else {
            var checkbox = d("tbody :checkbox:enabled", d('#hotel_table'));
            d(":checkbox[name='checked-all']", d('#hotel_table')).prop('checked', checkbox.length == checkbox.filter(':checked:enabled').length);
            account_laber_text(checkbox.length == checkbox.filter(':checked:enabled').length);
        }
    }).on("click", ".row-checkbox", function (event) {
        !d(event.target).is(":checkbox") && d(":checkbox", this).trigger("click");
    });

    function account_laber_text(status) {
        if (status) {
            d("[for='hotel_allchecked']").text(disselectall_tab);
        } else {
            d("[for='hotel_allchecked']").text(selectall_tab);
        }
    }

    function table_passwd() {
        var this_html = '';
        d('#code_table').dataTable().fnClearTable();
        d('#code_table').dataTable().fnDestroy();

        d.each(portal_passwd, function (n, m) {
            this_html += '<tr class="text-center">';
            this_html += '<td class="num" style="display: none">' + m.num + '</td>';
            this_html += '<td><input class="row-checkbox" type="checkbox" /></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="password">' + m.passwd + '</td>';
            this_html += '<td><a data-toggle="modal" data-target="#modal_two" class="table-link etid_btn" et="click tap:edit_code"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + edit + '" class="fa fa-pencil fa-stack-1x fa-inverse"></i></span></a><a class="table-link danger del_btn" et="click tap:del_code"><span class="fa-stack"><i class="fa fa-square fa-stack-2x"></i><i title="' + ac_group_del_btn + '" class="fa fa-trash-o fa-stack-1x fa-inverse"></i></span></a></td>';
            this_html += '</tr>';
        });
        d("#code_tbody_info").html(this_html);

        if (portal_passwd.length > 0) {
            passwd_table = d('#code_table').DataTable({
                "columns": [
                    {"orderable": false},
                    {"orderable": false},
                    null,
                    null,
                    {"orderable": false}
                ],
                "drawCallback": function () {
                    code_laber_text(false);
                    d(":checkbox", d('#code_table_wrapper')).prop('checked', false);
                }
            });
            passwd_table.page.len(default_num).draw();
        }
    }

    d('#code_table').on("change", ":checkbox", function () {
        if (d(this).is("[name='checked-all']")) {
            d(":checkbox:enabled", d('#code_table')).prop("checked", d(this).prop("checked"));
            code_laber_text(d(this).prop("checked"));
        } else {
            var checkbox = d("tbody :checkbox:enabled", d('#code_table'));
            d(":checkbox[name='checked-all']", d('#code_table')).prop('checked', checkbox.length == checkbox.filter(':checked:enabled').length);
            code_laber_text(checkbox.length == checkbox.filter(':checked:enabled').length);
        }
    }).on("click", ".row-checkbox", function (event) {
        !d(event.target).is(":checkbox") && d(":checkbox", this).trigger("click");
    });

    function code_laber_text(status) {
        if (status) {
            d("[for='code_allchecked']").text(disselectall_tab);
        } else {
            d("[for='code_allchecked']").text(selectall_tab);
        }
    }

    et.displayline = function (evt) {
        default_num = d(evt).val();

        if (portal_account.length != 0) {
            this_table.page.len(default_num).draw();
        }

        if (portal_passwd.length != 0) {
            passwd_table.page.len(default_num).draw();
        }
        d(evt).blur();
    };

    et.export_account = function () {
        export_account_config();
    };

    function export_account_config() {
        var iframe = d('<iframe style="position:absolute;top:-9999px" ></iframe>').attr('name', 'backdown_iframe');
        var form = d('<form method="post" style="display:none;" enctype="multipart/form-data" />').attr('name', 'backdown_form');
        form.attr("target", 'backdown_iframe').attr('action', '/cgi-bin/mbox-config?method=GET&section=system_account_download');

        iframe.appendTo("body");
        form.appendTo(iframe);
        form.submit();
    }

    et.export_code = function () {
        export_code_config();
    };

    function export_code_config() {
        var iframe = d('<iframe style="position:absolute;top:-9999px" ></iframe>').attr('name', 'backdown_iframe');
        var form = d('<form method="post" style="display:none;" enctype="multipart/form-data" />').attr('name', 'backdown_form');
        form.attr("target", 'backdown_iframe').attr('action', '/cgi-bin/mbox-config?method=GET&section=system_passwd_download');

        iframe.appendTo("body");
        form.appendTo(iframe);
        form.submit();
    }

    et.dels_hotel = function () {
        action = 'del';
        var a = {}, b = [], c = [], this_checked;
        this_checked = d('#hotel_tbody_info').find(':checked');

        if (this_checked.length < 1) {
            return;
        }

        b[0] = {};
        b[0].action = action;
        this_checked.each(function (n, m) {
            c.push(parseInt(d(m).parents('tr').find('.num').text()))
        });
        c.sort(function (a, b) {
            return a - b;
        });
        b[0].del_list = c.join(',') + ',';
        b.reverse();
        a.list = b;
        setHotelConfig(a);
    };

    et.dels_code = function () {
        action = 'del';
        var a = {}, b = [], c = [], this_checked;
        this_checked = d('#code_tbody_info').find(':checked');

        if (this_checked.length < 1) {
            return;
        }
        b[0] = {};
        b[0].action = action;
        this_checked.each(function (n, m) {
            c.push(parseInt(d(m).parents('tr').find('.num').text()))
        });
        c.sort(function (a, b) {
            return a - b;
        });
        b[0].del_list = c.join(',') + ',';
        a.list = b;
        setCodeConfig(a);
    };

    et.import_hotel = function () {
        if (d("#auth_type").val() == "account") {
            upload_type = 'system_upload_account';
        } else if (d("#auth_type").val() == "passwd") {
            upload_type = 'system_upload_account';
        }
        var afile = d("#upload_file");
        if (ie) {
            afile.replaceWith(afile.clone());
        } else {
            afile.val('');
        }
    };

    et.import_code = function () {
        upload_type = 'system_upload_passwd';
        var afile = d("#upload_file");
        if (ie) {
            afile.replaceWith(afile.clone());
        } else {
            afile.val('');
        }
    };

    et.add_hotel = function () {
        action = "add";
        d("#acc_username").val("");
        d("#acc_password").val("");
    };

    et.add_code = function () {
        action = "add";
        d("#code_password").val("");
    };

    et.edit_hotel = function (evt) {
        action = "edit";
        g.clearall();
        edit_hotelConfig(evt);
    };

    et.edit_code = function (evt) {
        action = "edit";
        g.clearall();
        edit_CodeConfig(evt);
    };

    et.del_hotel = function (evt) {
        action = "del";
        g.clearall();

        var a = {}, b = [];
        b[0] = {};
        b[0].action = action;
        if (action != 'add') {
            b[0].del_list = d(evt).parents('tr').find('.num').text() + ",";
        }
        a.list = b;
        setHotelConfig(a);
    };

    et.del_code = function (evt) {
        action = "del";
        g.clearall();

        var a = {}, b = [];
        b[0] = {};
        b[0].action = action;
        if (action != 'add') {
            b[0].del_list = d(evt).parents('tr').find('.num').text() + ",";
        }
        a.list = b;
        setCodeConfig(a);
    };

    function edit_hotelConfig(evt) {
        var num, acc_username, acc_password;
        num = d(evt).parents('tr').find('.num').text();
        acc_username = d(evt).parents('tr').find('.username').text();
        acc_password = d(evt).parents('tr').find('.password').text();

        d("#num").val(num);
        d("#acc_username").val(acc_username);
        d("#acc_password").val(acc_password);
    }

    et.save_acc = function () {
        var data;
        if (lock_web) return;
        lock_web = true;
        if (data = HotelVolide()) {
            d('.closewin').click();
            setHotelConfig(data)
        } else {
            lock_web = false;
        }
    };

    function HotelVolide() {
        var a = {}, b = [];
        b[0] = {};
        b[0].action = action;
        if (action != 'add') {
            b[0].num = parseInt(d('#num').val());
        }

        b[0].user = d('#acc_username').val();
        b[0].passwd = d('#acc_password').val();

        if (!j.charnum(b[0].user) || b[0].user == "" || b[0].user.indexOf(" ") > -1) {
            h.ErrorTip(tip_num++, auth_username + format_tips);
            return false;
        }

        if (!j.charnum(b[0].passwd) || b[0].passwd == "" || b[0].passwd.indexOf(" ") > -1) {
            h.ErrorTip(tip_num++, auth_password + format_tips);
            return false;
        }

        for (var i = 0; i < portal_account.length; i++) {
            var m = portal_account[i];
            if (b[0].num == m.num) {
                continue;
            }
            if (b[0].user == m.user) {
                h.ErrorTip(tip_num++, username_same);
                return false;
            }
        }
        a.list = b;
        return a;
    }

    function edit_CodeConfig(evt) {
        var num, acc_password;
        num = d(evt).parents('tr').find('.num').text();
        acc_password = d(evt).parents('tr').find('.password').text();

        d("#code_num").val(num);
        d("#code_password").val(acc_password);
    }

    et.save_code = function () {
        var data;
        if (lock_web) return;
        lock_web = true;
        if (data = CodeVolide()) {
            d('.closewin').click();
            setCodeConfig(data)
        } else {
            lock_web = false;
        }
    };

    function CodeVolide() {
        var a = {}, b = [];
        b[0] = {};
        b[0].action = action;
        if (action != 'add') {
            b[0].num = parseInt(d('#code_num').val());
        }
        b[0].passwd = d('#code_password').val();
        if (!j.charnum(b[0].passwd) || b[0].passwd == "" || b[0].passwd.indexOf(" ") > -1) {
            h.ErrorTip(tip_num++, auth_password + format_tips);
            return false;
        }

        for (var i = 0; i < portal_passwd.length; i++) {
            var m = portal_passwd[i];
            if (b[0].num == m.num) {
                continue;
            }
            if (b[0].passwd == m.passwd) {
                h.ErrorTip(tip_num++, password_same);
                return false;
            }
        }

        a.list = b;
        return a;
    }

    d('#upload_btn').on('click', function (e) {
        if (d('#upload_file').val() != '' && d('#upload_file').val() != undefined) {
            upload_file_fun();
        }
    });

    function upload_file_fun() {
        var url = '/cgi-bin/mbox-config?method=SET&section=' + upload_type;
        var upload_file = d('#upload_file').val();
        if (lock_web) return;
        lock_web = true;

        file_format = 1;

        if (upload_file.match(/\.txt$|\.TXT$/i) == null) {
            file_format = 0;
            h.ErrorTip(tip_num++, txt_tip);
            lock_web = false;
            return;
        }

        d('#upload_file').change();

        if (file_format == 0) {
            lock_web = false;
            return;
        }

        d("#upload_file").upload({
            url: url,
            onComplate: function (data) {
                if (data && data.errCode != 0) {
                    h.ErrorTip(tip_num++, data.errCode);
                    return false;
                } else {
                    h.SetOKTip(tip_num++, set_success);
                    setTimeout(gohref, 1000);
                }
            }
        });
        d("#upload_file").upload("ajaxSubmit");
    };

    d('#upload_file').on('change', function (e) {
        if (!ie && !funGetTextFiles(e)) {
            file_format = 0;
            return false;
        }
    });

    function funGetTextFiles(e) {
        var files = e.target.files || e.dataTransfer.files;
        return funDealtTextFiles(files);
    }

    function funDealtTextFiles(files) {
        var i, file;
        for (i = 0; i < files.length; i++) {
            file = files[i];
            if (file.size >= 550000) { //size
                var sizeerror = file.name + too_large + "500KB";
                h.ErrorTip(tip_num++, sizeerror);
                lock_web = false;
                return false;
            }
        }
        return true;
    }

    function setHotelConfig(data) {
        f.setMConfig('portal_account_config', data, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000);
            }
        })
    }

    function setCodeConfig(data) {
        f.setMConfig('portal_passwd_config', data, function (data) {
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
                lock_web = false;
            } else {
                h.SetOKTip(tip_num++, set_success);
                refresh_init();
                setTimeout(reset_lock_web, 3000);
            }
        })
    }

    function gohref() {
        location.href = location.href;
    }

    function reset_lock_web() {
        refresh_init();
        lock_web = false;
    }

    b.init = init;
});