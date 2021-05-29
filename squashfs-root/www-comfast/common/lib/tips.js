define(function (require, b, c) {
    var d = require("jquery"),
        g = require("validate");

    var volide = function (require) {
        var requires = d(require).find('.require');
        var format_error_num = 0;
        requires.keyup(function () {
            var ByteCount, this_obj = d(this);
            var $parent = this_obj.parents('.list');
            $parent.find(".icon_margin").remove();
            this_obj.removeClass('borError');

            //isNULL
            if (this_obj.hasClass('isNULL') && this.value == '') {
                $parent.append('<i class="fa fa-check-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-success"></i>');
                this_obj.removeClass('borError');
                return;
            }

            //isUNNULL
            if (this_obj.hasClass('isUNNULL') && this.value == '') {
                $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                this_obj.addClass('borError');
                return;
            }

            //isIP
            if (this_obj.hasClass('isIP') && (!g.isIpaddr(this.value) || this.value == '')) {
                $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                this_obj.addClass('borError');
                return;
            }

            //isSIP
            if (this_obj.hasClass('isSIP') && (!g.isSIpaddr(this.value) || this.value == '')) {
                $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                this_obj.addClass('borError');
                return;
            }

            //isMAC
            if (this_obj.hasClass('isMAC') && (!g.isMac(this.value) || this.value == '')) {
                $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                this_obj.addClass('borError');
                return;
            }

            //isMACS
            if (this_obj.hasClass('isMACS')) {
                var macs = this.value.split(';');
                for (var i = 0; i < macs.length; i++) {
                    if (!g.isMac(macs[i])) {
                        $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                        this_obj.addClass('borError');
                        return;
                    }
                }
            }

            //isURLS
            if (this_obj.hasClass('isURLS')) {
                var urls = this.value.split(';');
                for (var i = 0; i < urls.length; i++) {
                    if (!g.isUrl(urls[i])) {
                        $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                        this_obj.addClass('borError');
                        return;
                    }
                }
            }

            //isURLS
            if (this_obj.hasClass('isCUrl')) {
                if (!g.isCUrl(this.value)) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isALL
            if (this_obj.hasClass('isALL')) {
                ByteCount = g.checkChar(d.trim(this.value));
                if (ByteCount > 32 || ByteCount < 1) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isIsp
            if (this_obj.hasClass('isIsp')) {
                ByteCount = g.checkChar(d.trim(this.value));
                if (ByteCount > 32 || ByteCount < 1 || !g.domain_special(this.value)) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isEnglish
            if (this_obj.hasClass('isEnglish')) {
                ByteCount = g.checkChar(d.trim(this.value));
                if (g.isChinese(this.value) || ByteCount > 32 || ByteCount < 1) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isDomain
            if (this_obj.hasClass('isDomain')) {
                ByteCount = g.checkChar(d.trim(this.value));
                if (g.isChinese(this.value) || ByteCount > 63 || ByteCount < 1 || !g.domain_special(this.value)) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isIPS
            if (this_obj.hasClass('isIPS')) {
                if (!g.isSegment(this.value)) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isIPSection
            if (this_obj.hasClass('isIPSection')) {
                if (!g.isIPSection(this.value)) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isPortSection
            if (this_obj.hasClass('isPortSection')) {
                if (!g.isPortSection(this.value)) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isSSID
            if (this_obj.hasClass('isSSID')) {
                ByteCount = g.checkChar(d.trim(this.value));
                if (ByteCount > 32 || ByteCount < 1) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isSSIDPwd
            if (this_obj.hasClass('isSSIDPwd')) {
                ByteCount = g.checkChar(d.trim(this.value));

                if (!g.special(this.value) || this.value.indexOf(' ') > -1) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }

                if (this.value != '' && g.isChinese(this.value)) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }

                if (g.isChinese(this.value) || ByteCount > 32 || ByteCount < 8) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //is64Byte
            if (this_obj.hasClass('is64Byte')) {
                ByteCount = g.checkChar(d.trim(this.value));
                if (ByteCount > 63) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isTime
            if (this_obj.hasClass('isTime')) {
                if (!g.isTime(this.value)) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isNUM
            if (this_obj.hasClass('isNUM')) {
                var startnum = parseInt(this_obj.attr('name').split("_@")[1].split("_")[0]) || 0;
                var endnum = parseInt(this_obj.attr("name").split("_@")[1].split("_")[1]) || 99999999;
                if (!g.isNum(this.value) || !g.isRangNum(this.value, startnum, endnum)) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isDNUM
            if (this_obj.hasClass('isDNUM')) {
                var startnum = parseInt(this_obj.attr('name').split("_@")[1].split("_")[0]) || 0;
                var endnum = parseInt(this_obj.attr("name").split("_@")[1].split("_")[1]) || 99999999;
                if(g.isNum(this.value) && this.value == 0) {

                }else if (!g.isNum(this.value) || !g.isRangNum(this.value, startnum, endnum)) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            //isCharNum
            if (this_obj.hasClass('isCharNum')) {
                ByteCount = g.checkChar(d.trim(this.value));
                if (!g.charnum(this.value) || ByteCount == 0 || ByteCount > 32) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }

            if (this_obj.hasClass('isFEE')) {
                if (this.value == '0' || !g.isFEE(this.value)) {
                    $parent.append('<i class="fa fa-times-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-error"></i>');
                    this_obj.addClass('borError');
                    return;
                }
            }
            $parent.append('<i class="fa fa-check-circle col-lg-1 col-md-1 col-xs-1 icon_margin icon-success"></i>');
        }).blur(function () {
            d(this).triggerHandler("keyup");
            var this_obj = d(this);
            if (this_obj.hasClass('borError')) {
                show_format_error(d(this), format_error_num);
                format_error_num++;
                return;
            }
        });
    }

    function isMAC(arg) {
        if (arg == '' || !g.isMac(arg)) {
            return false;
        }
        return true;
    }

    function show_format_error(obj, num) {
        var format_id = 'format_' + num;
        var format_name = obj.parent('.form_right').find('.tip_name').html();
        if (obj.val() == '') {
            ErrorTip(format_id, null_tips, format_name);
            return;
        }
        ErrorTip(format_id, format_tips, format_name);
    }

    function ErrorTip(num, tiptext, setname) {
        globleTip('error', num, tiptext, setname);
    }

    function SetOKTip(num, tiptext) {
        globleTip('success', num, tiptext);
    }

    function WarnTip(num, tiptext) {
        globleTip('warn', num, tiptext);
    }

    function WarnTipLong(num, tiptext, lapse)
    {
        globleTipLong('warn', num, tiptext, false, lapse);

    }

    function globleTipLong(type, num, tiptext, setname, lapse ) {
        var tipbox_id = 'tipbox_' + num, this_html = '', setname = setname || '', tip_box;
        tip_box = d('<div id="' + tipbox_id + '"></div>').addClass('set_tips');
        switch (type) {
            case 'success':
                this_html += '<div class="alert alert-success fade in">';
                this_html += '<i class="fa fa-check-circle fa-fw fa-lg"></i>';
                break;
            case 'error':
                this_html += '<div class="alert alert-danger fade in">';
                this_html += '<i class="fa fa-times-circle fa-fw fa-lg"></i>';
                break;
            case 'warn':
                this_html += '<div class="alert alert-warning fade in">';
                this_html += '<i class="fa fa-exclamation-circle fa-fw fa-lg"></i>';
                break;
            default:
                break;
        }
        this_html += '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>';
        this_html += '<strong>' + setname + '</strong> ' + " " + tiptext;
        this_html += '</div>';
        tip_box.appendTo('body').append(this_html);
        tip_box.css({
            "margin-left": '-' + parseFloat(tip_box.width() / 2) + 'px',
            "margin-top": '-' + parseFloat(tip_box.height() / 2) + 'px'
        });
        setTimeout(function () {
            d('#' + tipbox_id).remove();
        }, lapse);
    }

    function globleTip(type, num, tiptext, setname) {
        var tipbox_id = 'tipbox_' + num, this_html = '', setname = setname || '', tip_box;
        tip_box = d('<div id="' + tipbox_id + '"></div>').addClass('set_tips');
        switch (type) {
            case 'success':
                this_html += '<div class="alert alert-success fade in">';
                this_html += '<i class="fa fa-check-circle fa-fw fa-lg"></i>';
                break;
            case 'error':
                this_html += '<div class="alert alert-danger fade in">';
                this_html += '<i class="fa fa-times-circle fa-fw fa-lg"></i>';
                break;
            case 'warn':
                this_html += '<div class="alert alert-warning fade in">';
                this_html += '<i class="fa fa-exclamation-circle fa-fw fa-lg"></i>';
                break;
            default:
                break;
        }
        this_html += '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>';
        this_html += '<strong>' + setname + '</strong> ' + " " + tiptext;
        this_html += '</div>';
        tip_box.appendTo('body').append(this_html);
        tip_box.css({
            "margin-left": '-' + parseFloat(tip_box.width() / 2) + 'px',
            "margin-top": '-' + parseFloat(tip_box.height() / 2) + 'px'
        });
        setTimeout(function () {
            d('#' + tipbox_id).remove();
        }, 1000);
    }

    function isEqualIP(addr1, mask1, addr2, mask2) {
        if (!addr1 || !addr2 || !mask1 || !mask2) {
            return false;
        }
        var star_ip1 = [], star_ip2 = [], end_ip1 = [], end_ip2 = [];
        addr1 = addr1.split(".");
        addr2 = addr2.split(".");
        mask1 = mask1.split(".");
        mask2 = mask2.split(".");
        for (var i = 0; i < 4; i++) {
            star_ip1[i] = addr1[i] & mask1[i];
            star_ip2[i] = addr2[i] & mask2[i];
            end_ip1[i] = addr1[i] | (~mask1[i] & 0xff);
            end_ip2[i] = addr2[i] | (~mask2[i] & 0xff);
        }
        star_ip1 = ip2int(star_ip1.join('.'));
        star_ip2 = ip2int(star_ip2.join('.'));
        end_ip1 = ip2int(end_ip1.join('.'));
        end_ip2 = ip2int(end_ip2.join('.'));
        if ((star_ip1 >= star_ip2 && end_ip1 <= end_ip2) || (star_ip2 >= star_ip1 && end_ip2 <= end_ip1)) {
            return true;
        } else {
            return false;
        }
    }

    function isIncludeIP(ip, gateway, mask) {
        if (!ip || !gateway || !mask) {
            return false;
        }
        var star_ip = [], end_ip = [];

        gateway = gateway.split(".");
        mask = mask.split(".");

        for (var i = 0; i < 4; i++) {
            star_ip[i] = gateway[i] & mask[i];
            end_ip[i] = gateway[i] | (~mask[i] & 0xff);
        }

        star_ip = ip2int(star_ip.join('.'));
        end_ip = ip2int(end_ip.join('.'));
        ip = ip2int(ip);

        if ((ip >= star_ip && ip <= end_ip)) {
            return true;
        } else {
            return false;
        }
    }
    
    function int2ip (ipInt) {
		return ( (ipInt>>>24) +'.' + (ipInt>>16 & 255) +'.' + (ipInt>>8 & 255) +'.' + (ipInt & 255) );
	}

    function ip2int(IP) {
        return parseInt(IP.replace(/\d+\.?/ig, function (a) {
            a = parseInt(a);
            return (a > 15 ? "" : "0") + a.toString(16);
        }), 16);
    }

    function ipnum(ipstr, max) {
        var ips = ipstr.split('\n');
        if (max && ips.length > max) {
            return false;
        }
        return true;
    }

    //isSSID
    function error_ssid(ssid) {
        var ByteCount = g.checkChar(d.trim(ssid));
        if (ByteCount > 32 || ByteCount < 1) {
            return true;
        }
        return false;
    }

    function error_ssidpsk(ssidpsk) {
        var this_tispnum = 0;
        var ByteCount = g.checkChar(d.trim(ssidpsk));

        if (!g.special(ssidpsk) || ssidpsk.indexOf(' ') > -1) {
            return true;
        }

        if (ssidpsk != '' && g.isChinese(ssidpsk)) {
            return true;
        }

        if (g.isChinese(ssidpsk) || ByteCount > 32 || ByteCount < 8) {
            return true;
        }
        return false;
    }

    b.volide = volide;
    b.ErrorTip = ErrorTip;
    b.SetOKTip = SetOKTip;
    b.WarnTip = WarnTip;
    b.ipnum = ipnum;
    b.isEqualIP = isEqualIP;
    b.isIncludeIP = isIncludeIP;
    b.ip2int = ip2int;
    b.int2ip = int2ip;
    b.isMAC = isMAC;
    b.error_ssid = error_ssid;
    b.error_ssidpsk = error_ssidpsk;
    b.WarnTipLong = WarnTipLong;
});
