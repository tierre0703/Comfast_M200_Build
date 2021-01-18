define(function (require, exports) {

    var d = require("jquery"),
        e = require("util"),
        f = require("function"),
        m = require("external"),
        g = "mbox_container";

    var packsrc, devinfo = {};

    var userAgentInfo = navigator.userAgent;
    var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
    var IsPC = true;
    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > -1) {
            IsPC = false;
            break;
        }
    }

    exports.plugInit = function (arg, callback) {
        m.init();
        readylanguage(callback);
        k(arg);
    };

    function k(a) {
        if (!a) {
            a = {}
        }
        if (IsPC) {
            d('#' + g).on("click change", n(a));
        } else {
            d('#' + g).on("tap change", n(a));
        }
    }

    function n(a) {
        function b(a) {
            if (a) {
                return d(a).attr("id") === g
            }
            return false
        }

        return function (c) {
            var e = d(c.target),
                f,
                tagNameTest = e[0].tagName.toLowerCase();

            if (e && ((tagNameTest === "a"))) {
                f = e.attr("et");
                if (f && f.split(":")[0].indexOf(c.type) > -1) {
                    a[f.split(":")[1]](e)
                }
            } else {
                f = e.attr("et");
                if (!f) {
                    while (!f && !b(e)) {
                        e = e.parent();
                        f = e.attr("et")
                    }
                }
                if (f && f.split(":")[0].indexOf(c.type) > -1) {
                    a[f.split(":")[1]](e)
                }
            }
        }
    }

    function readylanguage(callback) {
        e.getSConfig('language', function (data) {
            if (data.errCode == '0') {
                devinfo.language = data.language.language;
                devinfo.changed = data.language.changed;
                devinfo.wifi = data.capability.wifi;
                devinfo.mwan = data.capability.mwan;
                devinfo.mlan = data.capability.mlan;
                devinfo.vlan = data.capability.vlan;
                devinfo.ac = data.capability.ac;
                devinfo.ac_mode = data.capability.ac_mode;
                devinfo.sysupgrade_time = data.capability.upg_t;
                devinfo.usb = data.capability.usb;
                devinfo.cluster = data.capability.cluster;
                devinfo.ip = data.capability.ip;
                devinfo.reboor_time = data.capability.r_t;
                devinfo.reset_time = data.capability.f_t;
                devinfo.multi_pppoe_num = data.capability.mu_p_n;
                devinfo.chinadns = 0;
            } else {
                devinfo.language = 'cn';
            }
            exportscript(devinfo.language, callback);
        });
    }

    function exportscript(l, callback) {
        devinfo.language = l;
        packsrc = '/js/language_' + l + '.js';
        d.getScript(packsrc, function () {
            replacetext();
            f.common(devinfo, callback);
        })
    }

    function replacetext() {
        d("[sh_lang]").each(function (index, obj) {
            var langID = d(obj).attr('sh_lang');
            var txt = eval('(' + langID + ')');
            var ntxt;
            if (d(obj).is('textarea') || d(obj).attr('type') == 'text' || d(obj).attr('type') == 'password') {
                d(obj).attr('placeholder', txt).addClass('placeholder');
                return;
            } else if (d(obj).html() != '' && typeof(d(obj).attr('insert')) != 'undefined') {
                ntxt = txt + d(obj).html();
                d(obj).empty().html(ntxt);
                return;
            } else {
                d(obj).html(txt);
            }
        });
        d("[sh_title]").each(function (index, obj) {
            var langID = d(obj).attr('sh_title');
            var txt = eval('(' + langID + ')');
            d(obj).attr('title', txt);
        });
    }
});