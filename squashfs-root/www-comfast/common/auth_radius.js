define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);
    require("upload")(d);

    var radius_info, lanlist;
    var lock_web = false, tip_num = 0;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('radius_config', function (data) {
            if (data && data.errCode == 0) {
                radius_info = data.radius;
                radius_init();
            }
        });

        f.getMConfig("lan_dhcp_config", function (data) {
            if (data && data.errCode == '0') {
                lanlist = data.lanlist;
                showiface();
            }
        }, false);
    }

    function radius_init() {
        disabled_import(radius_info.enable);
        d('#switch').val(radius_info.enable || 0);
        d('#radius_nas').val(radius_info.nas_iden);
        d("#radius_ip").val(radius_info.server || "");
        d("#radius_secret_key").val(radius_info.secret_key || "");
        d("#radius_auth_port").val(radius_info.auth_port || "");
        d("#radius_acct_port").val(radius_info.acct_port || "");
        d("#radius_hb_time").val(radius_info.hb_time || "");
        d("#iface_option").val(radius_info.extiface);
        d("#radius_auth_time").val(radius_info.timeout / 60 || "720");
        d("#radius_whitemac").val(radius_info.whitemac.replace(/,/g, ";"));
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

    et.enableConfig = function (evt) {
        disabled_import(d(evt).val())
    };

    function disabled_import(data) {
        if (data == '1') {
            d('#tab-base input').attr('disabled', false);
            d('#iface_option').attr('disabled', false);
            d('textarea').attr('disabled', false);
        } else {
            d('#tab-base input').attr('disabled', true);
            d('#iface_option').attr('disabled', true);
            d('textarea').attr('disabled', true);
        }
    }

    et.upload_file = function(){
        if (d('#upload_file').val() != '' && d('#upload_file').val() != undefined) {
            upload_file_fun();
        }
    };

    function upload_file_fun() {
        var url = '/cgi-bin/mbox-config?method=SET&section=system_upload_radius_template';
        var upload_file = d('#upload_file').val();

        if (lock_web) return;
        lock_web = true;

        if (upload_file.match(/\.gz$|\.GZ$/i) == null) {
            h.ErrorTip(tip_num++, targz_tip);
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

    et.reset_list = function () {
        d('input').val('');
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
        var arg = {};

        arg.enable = d("#switch").val();
        arg.nas_iden = d("#radius_nas").val();
        arg.server = d("#radius_ip").val();
        arg.secret_key = d("#radius_secret_key").val();
        arg.auth_port = d("#radius_auth_port").val();
        arg.acct_port = d("#radius_acct_port").val();
        arg.hb_time = d("#radius_hb_time").val();
        arg.extiface = d("#iface_option").val();
        arg.timeout = '' + parseInt(d("#radius_auth_time").val()) * 60;
        arg.whitemac = d("#radius_whitemac").val().replace(/;/g, ",");
        return arg;
    }

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
    }

    function set_config(arg) {
        f.setMConfig('radius_config', arg, function (data) {
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
        lock_web = false;
    }

    b.init = init;
});