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

    var lock_web = false, tip_num = 0, cpu_model, firmware_info;

    function init() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        device = data;
        refresh_init();
        notimeout();
    }

    function refresh_init() {
        f.getMConfig('firmware_info', function (data) {
            if (data && data.errCode == 0) {
                cpu_model = data.cpumodel.cpumodel;
                firmware_info = data.firmware;
                firmware_init();
            }
        });

        f.getMConfig('fota_status', function (data) {
            //data = {"errCode":0,"fota_status":{"fota_status":1,"fota_version":"v2.0.0"}};
            if (data && data.errCode == 0) {
                if (data.fota_status.fota_status == 1) {
                    d("#auto_upgrade_box").show();
                    d("#auto_version").html(data.fota_status.fota_version);
                } else {
                    d("#auto_upgrade_box").hide();
                }
            }
        })
    }

    function notimeout() {
        if (lock_web) return;
        f.getMConfig('system_usage', function () {
        });
        setTimeout(notimeout, 60000)
    }

    function firmware_init() {
        var deviceReg, deviceName, deviceVersion, name_version;
        deviceReg = new RegExp("(.+)-(.+)");
        deviceName = deviceReg.exec(firmware_info.version)[1];
        deviceVersion = deviceReg.exec(firmware_info.version)[2];

        if (deviceName.toUpperCase().indexOf("CF-") > -1) {
            if (cpu_model.indexOf("D525") > -1) {
                name_version = "CF-AC300-" + deviceVersion;
            } else if (cpu_model.indexOf("1037U") > -1) {
                name_version = "CF-AC400-" + deviceVersion;
            } else if (cpu_model.indexOf("i5") > -1) {
                name_version = "CF-AC500-" + deviceVersion;
            } else if (cpu_model.indexOf("i7") > -1) {
                name_version = "CF-AC600-" + deviceVersion;
            } else if (deviceName.toUpperCase().indexOf("CF-AC200") > -1) {
                name_version = "M200-" + deviceVersion;
            } 
            else {
                name_version = firmware_info.version;
            }
        } else {
            name_version = firmware_info.version;
        }
        d("#version").text(name_version.toUpperCase());
    }

    et.doResetConfig = function () {
        var ie = !-[1,];
        var afile = d("input");
        if (ie) {
            afile.replaceWith(afile.clone());
        } else {
            afile.val('');
        }
    };

    et.online_upgrade = function(){
        f.setMConfig('system_fota_upgrade', '', function (data) {
            //data = {"errCode":0,"fota_status":{"fota_status":1,"fota_version":"v2.0.0"}};
            if (data.errCode != 0) {
                h.ErrorTip(tip_num++, data.errCode);
            } else {
                g.setting(device.sysupgrade_time, gohref);
            }
        });
    };

    et.saveConfig = function () {

        if (d("#uploadfile").val() == '') {
            h.ErrorTip(tip_num++, upload_file_empty);
            return;
        }

        if (d("#uploadfile").val().match(/\.img$|\.bin$|\.IMG$|\.BIN$/i) == null) {
            h.ErrorTip(tip_num++, upload_file_format_error);
            return;
        }

        if (lock_web) return;

        g.shconfirm(upload_header, 'confirm', {
            onOk: function () {
                lock_web = true;
                d("#uploadfile").upload({
                    url: '/cgi-bin/mbox-config?method=SET&section=system_upgrade_keep',
                    onComplate: function (data) {
                        if (data && data.errCode == 0) {
                            g.setting(device.sysupgrade_time, gohref);
                            return false;
                        } else {
                            lock_web = false;
                            h.ErrorTip(tip_num++, upload_up_failed);
                            return false;
                        }
                    }
                });
                d("#uploadfile").upload("ajaxSubmit");
            }
        });
    };

    function gohref() {
        location.href = 'http://' + location.host;
    }

    b.init = init;
});