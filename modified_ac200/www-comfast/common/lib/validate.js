define(function (a, b) {
    var valide = {
        Trim: function (str) {
            var result;
            //过滤两端空格
            result = str.replace(/(^\s+)|(\s+$)/g, "");
            //过滤所有空格
            result = result.replace(/\s/g, "");
            return result;
        },
        special: function (str) {
            var pattern;
            pattern = /[\·\'\"\(\)\<\>\&\\\/\-]/im;
            if (pattern.test(str)) {
                return false;
            }
            return true;
        },
        domain_special: function (str) {
            var pattern;
            pattern = /[\·\`\~\!\@\#\$\%\^\*\_\+\=\{\}\[\]\:\;\,\?\'\"\(\)\<\>\&\\\/]/im;
            if (pattern.test(str)) {
                return false;
            }
            return true;
        },
        charnum:function (str) {
            var pattern;
            pattern = /^[A-Za-z0-9]+$/im;
            if (!pattern.test(str)) {
                return false;
            }
            return true;
        },
        isNum: function (str) {
            var num = str.match(/^(0|[1-9]\d*)$/g);
            if (num == '' || num == null) {
                return false;
            } else {
                return true;
            }
        },
        isRangNum: function (num, min, max) {//
            if (valide.isNum(num) && num >= min && num <= max) {
                return true;
            } else {
                return false;
            }
        },
        isFEE: function (str) {
            var regExp = /^(-)?\d+(\.\d+)?$/g;
            return regExp.test(str);
        },
        //Ip地址检测/网关   1.0.0.0 - 255.255.255.254
        isIpaddr: function (ip) {
            var regExp = new RegExp(/^(?:(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)|([1-9])))$/);
            var ip_array;
            if(regExp.test(ip)){
                ip_array = ip.split('.');
            }
            if (!regExp.test(ip) || IpToNumber(ip) < 16777216 || IpToNumber(ip) == 4294967295 || ip_array[3] == 0) {
                return false;
            } else {
                return true;
            }
        },
        //Ip地址检测/网关   1.0.0.0 - 255.255.255.254
        isIpaddr2: function (ip) {
            var regExp = new RegExp(/^(?:(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)|([1-9])))$/);
            var ip_array;
            if(regExp.test(ip)){
                ip_array = ip.split('.');
            }
            if (!regExp.test(ip)) {
                return false;
            } else {
                return true;
            }
        },
        isSIpaddr: function (ip) {
            var regExp = new RegExp(/^(?:(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)|([1-9])))$/);
            var ip_array;
            if(regExp.test(ip)){
                ip_array = ip.split('.');
            }
            if (!regExp.test(ip) || IpToNumber(ip) < 16777216 || IpToNumber(ip) == 4294967295 || ip_array[3] == 255) {
                return false;
            } else {
                return true;
            }
        },
        isIPSection: function (ipsection) {
            var sectionarr = ipsection.split('-');
            for (var i = 0; i < sectionarr.length; i++) {
                if (!valide.isIpaddr(sectionarr[i])) {
                    return false;
                }
            }
            return true;
        },

        isPortSection: function (port_section) {
            if (port_section.indexOf('-') > -1) {
                var sectionarr = port_section.split('-');
                for (var i = 0; i < sectionarr.length; i++) {
                    if (!valide.isRangNum(sectionarr[i], 1, 65535)) {
                        return false;
                    }
                }
            } else {
                if (valide.isRangNum(port_section, 1, 65535)) {
                    return true;
                } else {
                    return false;
                }
            }
            return true;
        },
        isSegment: function (str) {
            var ie = !-[1,];
            if (ie) {
                var ips = str.split('\r\n');
            } else {
                var ips = str.split('\n');
            }

            for (var i = 0; i < ips.length; i++) {
                var tmp_value = ips[i];
                if (tmp_value.indexOf('/') > -1) {
                    var ips_tmp = tmp_value.split('/');
                    if (!(valide.isIpaddr2(ips_tmp[0]) && valide.isNum(ips_tmp[1]) && ips_tmp[1] >= 0 && ips_tmp[1] <= 32))
                        return false;
                } else {
                    if (!valide.isIpaddr2(ips[i]))
                        return false;
                }
            }
            return true;
        },
        isIpPort: function (str) {
            var regExp = new RegExp("^([0-9\.]+):([0-9]+)$");
            if (regExp.test(str)) {
                if (Signalsky.str.isIpaddr(RegExp.$1))
                    return true;
            }
            return false;
        },
        isTime: function (str) {
            var regExp = new RegExp("^(([1-9]{1})|([0-1][0-9])|([1-2][0-3])):([0-5][0-9])$");
            if (regExp.test(str)) {
                return true;
            }
            return false;
        },
        isDomain: function (domain) {
            if (domain.length >= 68)
                return false;
            var regExp = new RegExp("^[0-9a-zA-Z]+([\.0-9a-zA-Z\-])*\.([a-zA-z])+$");
            if (regExp.test(domain))
                return true;
            return false;
        },
        isNTPaddrs: function (ipstr, max) {
            ipstr = valide.Trim(ipstr);
            var ips = ipstr.split(',');
            if (max && ips.length > max) {
                return false;
            }
            for (var i = 0; i < ips.length; i++) {
                if (!valide.isIpaddr(ips[i]) && !valide.isDomain(ips[i]))
                    return false;
                if (valide.isIpPort(ips[i])) {
                    var ipcmp = ips[i].split(":");
                    if (ipcmp[0] == "0.0.0.0") {
                        return false;
                    }
                }
            }
            return true;
        },
        isNetmask: function (mask) {//子网掩码
            var correct_range = {128: 1, 192: 1, 224: 1, 240: 1, 248: 1, 252: 1, 254: 1, 255: 1, 0: 1};
            var m = mask.split('.');
            if (m.length != 4)
                return false;

            for (var i = 0; i < 4; i++) {
                if (!(m[i] in correct_range) ||
                    (i < 3 && m[i] > 0 && m[i] < 255 && m[i + 1] != 0)) {
                    return false;
                }
            }

            return true;
        },
        isDomain: function (str) {
            var domain = str.split('.');
            if (domain.length <= 1) {
                return false;
            }
            var regExp = new RegExp(/^[\d\w\-\u4e00-\u9fa5]+$/);
            for (var i = 0; i < domain.length; i++) {
                if (!regExp.test(domain[i]))
                    return false;
            }
            if (!isNaN(Number(domain[domain.length - 1][0])))
                return false;
            return true;
        },
        isDomainPort: function (domain) {
            if (domain.length >= 68)
                return false;
            var regExp = new RegExp("^[0-9a-zA-Z]+([\.0-9a-zA-Z\-])*\.([a-zA-z])+:([0-9]+)$");
            if (regExp.test(domain))
                return true;
            return false;
        },
        isUrl: function (str) {
            var reg = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;
            return (reg.test(str));
        },
        isCUrl: function (str) {
            //var reg = /^((ht|f)tps?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/;
            var reg = /[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/;
            return (reg.test(str));
        },
        isMac: function (str) {
            var reg1 = /^[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}$/;
            //var reg2 = /^[A-Fa-f\d]{2}-[A-Fa-f\d]{2}-[A-Fa-f\d]{2}-[A-Fa-f\d]{2}-[A-Fa-f\d]{2}-[A-Fa-f\d]{2}$/;
            //return (reg1.test(str) | reg2.test(str));
            return reg1.test(str);
        },
        isServer: function (str) {
            var s1 = str.split(':');
            if (s1.length > 2) {
                return false;
            }
            if (s1.length == 2 && !valide.isRangNum(s1[1], 1, 65535)) {
                return false;
            }
            if (!valide.isIpaddr(s1[0]) && !valide.isDomain(s1[0])) {
                return false;
            }
            return true;
        },
        isSameNet: function (ip, mask, ip2, mask2) {
            if (!valide.isIpaddr(ip) || !valide.isNetmask(mask) || !valide.isIpaddr(ip) || !valide.isNetmask(mask2))
                return false;
            if (ip == "0.0.0.0" || ip2 == "0.0.0.0")
                return false;

            sip = [ip.split('.'), ip2.split('.')];
            smask = [mask.split('.'), mask2.split('.')];
            var i;
            for (i = 0; i < 4; i++) {
                if ((Number(sip[0][i]) & Number(smask[0][i])) != (Number(sip[1][i]) & Number(smask[1][i])))
                    break;
            }
            if (i == 4)
                return true;
            return false;
        },
        isChinese: function (mask) {//用户名密码
            var regExp = new RegExp(/[^\x00-\xff]/);
            return regExp.test(mask);
        },
        checkChar: function (Message) { //字节统计
            var ByteCount = 0;
            var StrLength = Message.length;
            for (var i = 0; i < StrLength; i++) {
                ByteCount = (Message.charCodeAt(i) < 128) ? ByteCount + 1 : ByteCount + 3;
            }
            return ByteCount;
        }
    };

    function IpToNumber(ip) {
        var num = 0;
        if (ip == "") {
            return num;
        }
        var aNum = ip.split(".");
        if (aNum.length != 4) {
            return num;
        }
        num += parseInt(aNum[0]) << 24;
        num += parseInt(aNum[1]) << 16;
        num += parseInt(aNum[2]) << 8;
        num += parseInt(aNum[3]) << 0;
        num = num >>> 0;
        return num;
    }

    function NumberToIp(number) {
        var ip = "";
        if (number <= 0) {
            return ip;
        }
        var ip3 = (number << 0 ) >>> 24;
        var ip2 = (number << 8 ) >>> 24;
        var ip1 = (number << 16) >>> 24;
        var ip0 = (number << 24) >>> 24
        ip += ip3 + "." + ip2 + "." + ip1 + "." + ip0;
        return ip;
    }

    b.isChinese = valide.isChinese;
    b.special = valide.special;
    b.domain_special = valide.domain_special
    b.charnum = valide.charnum;
    b.checkChar = valide.checkChar;
    b.isIpaddr = valide.isIpaddr;
    b.isSIpaddr = valide.isSIpaddr;
    b.isNetmask = valide.isNetmask;
    b.isSegment = valide.isSegment;
    b.isMac = valide.isMac;
    b.isNum = valide.isNum;
    b.isRangNum = valide.isRangNum;
    b.isFEE = valide.isFEE;
    b.isUrl = valide.isUrl;
    b.isCUrl = valide.isCUrl;
    b.isTime = valide.isTime;
    b.isPortSection = valide.isPortSection;
    b.isIPSection = valide.isIPSection;
});