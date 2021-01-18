define(function (require, b) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('tips'),
        et = {}, device;

    require('touch');
    require('bootstrap')(d);

    var pptp_info, mwan_list, lock_web = false, tip_num = 0;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        f.getMConfig('mwan_capability_config', function (data) {
            mwan_list = data.wanlist || [];
            showmwanlist();
        }, false);

        f.getMConfig('pptpd_config', function (data) {
            if (data && data.errCode == 0) {
                pptp_info = data.pptpd;
                pptp_init();
            }
        })
    }

    function showmwanlist() {
        var this_html = '<option value="">' + pptpd_server_line_select + '</option>';
        d.each(mwan_list, function (n, m) {
            if (!device.mwan) {
                this_html += '<option value="' + m.iface + '">' + m.iface.toUpperCase() + '</option>';
                return false;
            }
            this_html += '<option value="' + m.iface + '">' + g.ifacetoname(m.iface) + '</option>';
        });
        d("#line").html(this_html);
    }

    function pptp_init() {
        var remoteip = pptp_info.remoteip;
        var remoteiparray;
        var remoteip_prefix, remoteipstop;
        remoteiparray = remoteip.split("-");
        remoteip_prefix = remoteiparray[0].substring(0, remoteiparray[0].lastIndexOf('.'));
        remoteipstop = remoteip_prefix + '.' + remoteiparray[1];

        d('#switch').val(pptp_info.enabled);
        d('#localip').val(pptp_info.localip || '');
        d('#startip').val(remoteiparray[0] || '');
        d('#endip').val(remoteipstop || '');
        d('#dns_main').val(pptp_info.msdns1 || '');
        d('#dns_backup').val(pptp_info.msdns2 || '');
        d('#mtu').val(pptp_info.mtu || '');
        d('#mru').val(pptp_info.mru || '');
        d("#line").val(pptp_info.line || '');
        disabled_all(pptp_info.enabled);
    }

    et.enableConfig = function (evt) {
        disabled_all(d(evt).val());
    };

    function disabled_all(data) {
        if (data == 1) {
            d('.main-box-body input').attr('disabled', false);
            d('#line').attr('disabled', false);
        } else {
            d('.main-box-body input').attr('disabled', true);
            d('#line').attr('disabled', true);
        }
    }

    et.doResetConfig = function () {
        g.clearall();
        refresh_init();
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
        var remoteipstart, remoteipstop, remoteipnum, remoteip, remoteipstart_prefix, remoteipstop_prefix;
        arg.enabled = d("#switch").val();
        if (device.mwan == "0") {
            // do nothing
        } else {
            arg.metric = "100";
        }
        if (arg.enabled == 1) {
            remoteipstart = d("#startip").val();
            remoteipstop = d("#endip").val();

            if (h.ip2int(remoteipstart) > h.ip2int(remoteipstop)) {
                var tmpip = remoteipstart;
                remoteipstart = remoteipstop;
                remoteipstop = tmpip;
            }

            remoteipstart_prefix = remoteipstart.substring(0, remoteipstart.lastIndexOf('.'));
            remoteipstop_prefix = remoteipstop.substring(0, remoteipstop.lastIndexOf('.'));
            if (remoteipstart_prefix != remoteipstop_prefix) {
                h.ErrorTip(tip_num++, pptpd_server_remoteip_not_network);
                return null
            }

            remoteipnum = remoteipstop.substring(remoteipstop.lastIndexOf('.'));
            remoteip = remoteipstart + '-' + remoteipnum.substring(1);

            arg.localip = d("#localip").val();
            arg.remoteip = remoteip;
            arg.msdns1 = d("#dns_main").val();
            arg.msdns2 = d("#dns_backup").val();
            arg.mtu = d("#mtu").val();
            arg.mru = d("#mru").val();
            arg.line = d("#line").val();
        }

        if (arg.msdns1 == '' && arg.msdns2 == '') {
            h.ErrorTip(tip_num++, vpn_dns_null);
            return null
        }

        return arg;
    }

    function set_config(arg) {
        f.setMConfig('pptpd_config', arg, function (data) {
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

    function reset_lock_web() {
        lock_web = false;
    }

    b.init = init;
});