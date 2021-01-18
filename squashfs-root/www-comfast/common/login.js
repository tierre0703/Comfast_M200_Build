define(function (require, exports) {

    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        et = {}, device;

    var firstlogin_flag;

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        device = data;
        selectedlanguage(device.language);
    }

    function selectedlanguage(data) {
        if (data == 'fr') {
            d('#language_fr').addClass('active');
        } else {
            d('#language_en').addClass('active');
        }

        f.getSConfig('first_login', function (data) {
            if (data && data.errCode == 0) {
                firstlogin_flag = data.system.first_login;
            }
        })

        if (device.changed != "1") {
            first_set_language();
        }
    }

    function first_set_language() {
        var type = navigator.appName, lang;
        if (type == "Netscape") {
            lang = navigator.language
        }
        else {
            lang = navigator.userLanguage
        }
        if (lang.indexOf('fr') > -1) {
            d('#language_fr').click();
        } else {
            d('#language_en').click();
        }
    }

    document.onkeydown = function (e) {
        var ev = document.all ? window.event : e;
        if (ev.keyCode == 13) {
            et.login();
        }
    }

    et.login = function () {
        var arg = {};
        arg.username = d('#account').val();
        arg.password = d("#password").val();
        errtip_default();
        f.login(arg, function (data) {
            if (data.errCode != '0') {
                j_login(login_fail + "," + login_again);
                setTimeout(function () {
                    errtip_default()
                }, 3e3);
            } else {
                if (firstlogin_flag == "1") {
                    passwd_change();
                } else {
                    goindex();
                }
            }
        });
    };

    function j_login(arg) {
        d("#error_tips_login").html(arg)
    }

    function errtip_default() {
        d("#error_tips_login").html('')
    }

    function goguide() {
        window.location.href = "http://" + device.ip + "/guide/guide_router.html";
    }

    function goindex() {
        window.location.href = "/index.html";
    }

    function passwd_change() {
        var setting = {};
        setting.username = "admin";
        setting.password = "admin";
        setting.oldPassword = "admin";
        f.setSConfig('admin_config', setting, function () {
            if (device.wifi == "0") {
                goindex();
            } else {
                goguide();
            }
        })
    }
});