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

    var udisk_list, scan_usb;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        h.volide('body');
        refresh_init();
    }

    function refresh_init() {
        scan_usb = 0;
        udisklist();

    }

    function udisklist() {
        f.getMConfig('udisk_list', function (data) {
            if (data.errCode == 0) {
                udisk_list = data.udisk_list || [];
                if (udisk_list.length) {
                    udiskstatus();
                } else {
                    if (scan_usb > 5) {
                        d("#scaning").remove();
                        d("#unfind").removeClass('hidden');
                    }
                    scan_usb++;
                    setTimeout(udisklist, 1000);
                }
            }
        });
    }

    function udiskstatus() {
        var this_html = '';
        d('#scan_udisk').addClass('hide');
        d('#has_udisk').removeClass('hide');
        d.each(udisk_list, function (n, m) {
            this_html += '<a class="col-lg-1 col-sm-2 col-xs-3 text-center" href="/index.php" target="_blank" et="click tap:select_udisk" mount_path="/upload/' + m.device_path.split('/')[2] + '"><img src="/images/udisk.png" class="img-responsive" /><p>' + (m.label_name || usb_device) + '</p></a>';
        });
        d('#udisk_list').html(this_html);
    }

    et.select_udisk = function (evt) {
        evt.attr('mount_path');
        login_udisk(evt.attr('mount_path'))
    };

    function login_udisk(mount_path) {
        d.ajax({
            type: "post",
            dataType: "html",
            data: "wf_uname=admin&wf_upawd=admin&&wf_mdir=" + mount_path,
            url: "/login.php?act=login_check",
            error: function (XmlHttpRequest, textStatus, errorThrown) {
                alert(XmlHttpRequest.responseText);
            },
            success: function (data) {
            }
        });

    }

    b.init = init;
});