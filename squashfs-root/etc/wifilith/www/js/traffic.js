var portal_data, language, Timeouts;

var randomnum = Math.floor(Math.random() * 100000);
var browserLanguage = (navigator.language || navigator.browserLanguage).toLowerCase();

if (browserLanguage.indexOf('zh') > -1) {
    language = 'cn';
} else {
    language = 'en';
}

var url = location.href;

var text1 = {
    "cn": "阅读并同意",
    "en": "Read & Agree "
};

var text2 = {
    "cn": "无线上网协议",
    "en": "Conditions of Use"
};

var text3 = {
    "cn": "连接上网",
    "en": "Internet Access"
};

var agree_title = {
    "cn": "无线上网协议",
    "en": "Conditions of Use"
};

var agree_con = {
    "cn": "在使用本免费无线上网服务时，请保护好您的个人信息和资料，以免被他人非法获得或使用。请遵守当地国家相关法律法规规定，不访问非法、不良网站及发表、传输任何违法信息。您在网络上泄露个人信息资料，或者访问非法、不良网站及发表、传输任何违法信息而导致的相关损失与责任，均由您自行承担，本免费无线服务商对此不承担任何责任。本声明中的条款应符合当地国家的法律、法规，与法律、法规相抵触的部分无效，但不影响其他部分的效力。",
    "en": "When using the free wireless internet access, please protect your personal information and information, so as not to be illegally obtained or used by others.Please comply with the relevant laws and regulations of the local state, do not visit illegal, bad websites and publish, transmit any illegal information.You on the network leaked personal information or access illegal and bad websites and published, any illegal information transmission and lead to loss and responsibility, borne by you, the free wireless service providers this does not bear any responsibility.The terms in this declaration shall be in compliance with the laws and regulations of the local state, and are in conflict with the laws and regulations, but do not affect the validity of the other parts."
};

var agree_return = {
    "cn": "返回",
    "en": "Return"
};

function GetParam(url, id) {
    url = url + "";
    var regstr = "/(\\?|\\&)" + id + "=([^\\&]+)/";
    var reg = eval(regstr);
    var result = url.match(reg);
    if (result && result[2]) {
        return result[2];
    } else {
        return '';
    }
}

var connUrl = "http://" + GetParam(url, 'uamip') + ":" + GetParam(url, 'uamport') + "/connup?captive=60";

$.ajax({
    type: "get",
    url: connUrl,
    timeout: 500,
    dataType: "jsonp",
    jsonp: "callBack",
    success: function (data) {
    }
});

function getJson() {
    $.ajax({
        type: 'GET',
        url: 'img/portal_pic_config.json',
        dataType: 'json',
        cache: false,
        success: function (data) {
            setDefault(data);
        }
    });
}

function setDefault(data) {
    portal_data = data;
    Timeouts = portal_data.times;
    document.title = portal_data.page_title;
    $("#portaltitle").text(portal_data.header_title);
    $("#link").text(portal_data.btn_link);
    $("#protocol1").text(text1[language]);
    $("#protocol").text(text2[language]);
    $("#link_btn").text(text3[language]);
    slider_img(portal_data.sliderpic);
    static_pic(portal_data.staticpic);
    setTimeoutLink();

    $('#agree_title').text(agree_title[language]);
    $('#agree_con').text(agree_con[language]);
    $('#agree_return_text').text(agree_return[language]);
}

function slider_img(img_info) {
    var this_html = '';
    $.each(img_info, function (n, m) {
        this_html += '<li><img  data-url="' + (m.linkaddr) + '" src="' + m.src + '?' + randomnum + '" /></li>';
    });
    $('.slides').html(this_html);
    $(".flexslider").flexslider({
        slideshowSpeed: 4000, //展示时间间隔ms
        animationSpeed: 400, //滚动时间ms
        touch: true //是否支持触屏滑动
    });
}

function static_pic(img_info) {
    $("#static_url1").attr('data-url', img_info.static1.linkaddr);
    $("#static_url2").attr('data-url', img_info.static2.linkaddr);
    $("#static_url3").attr('data-url', img_info.static3.linkaddr);
    $("#static_url4").attr('data-url', img_info.static4.linkaddr);

    $("#static_pic1").attr("src", img_info.static1.src + '?' + randomnum);
    $("#static_pic2").attr("src", img_info.static2.src + '?' + randomnum);
    $("#static_pic3").attr("src", img_info.static3.src + '?' + randomnum);
    $("#static_pic4").attr("src", img_info.static4.src + '?' + randomnum);

    $("#static_text1").text(img_info.static1.pic_text);
    $("#static_text2").text(img_info.static2.pic_text);
    $("#static_text3").text(img_info.static3.pic_text);
    $("#static_text4").text(img_info.static4.pic_text);
}

function setTimeoutLink() {
    if (Timeouts == 0) {
        if ($('#agree').is(":checked") || $('#agree').attr('checked') == true) {
            $("#link_text").addClass('font-org');
        } else {
            $("#link_text").addClass('font-grea');
        }
        $("#link_text").show();
        $("#loading_text").hide();
    } else {
        if (language == 'cn') {
            $("#loading_text").text("请等待" + Timeouts + "秒");
        } else {
            $("#loading_text").text("Please Wait " + Timeouts + " Seccond");
        }
        Timeouts--;
        setTimeout(setTimeoutLink, 1000);
    }
}

$('#agree').change(function () {
    if ($(this).is(":checked")) {
        $("#link_text").removeClass('font-grea').addClass('font-org');
    } else {
        $("#link_text").removeClass('font-org').addClass('font-grea');
    }
});

$('#protocol').on('click', function () {
    $('#ad_box').hide();
    $('#agree_box').show();
});

$('#agree_return').on('click', function () {
    $('#ad_box').show();
    $('#agree_box').hide();
});

$('#link_btn').on('click', function () {
    if ($('#agree').is(":checked")) {
        viaauth(portal_data.ok_link);
    }
});

$('.slides').on('click', 'img', function () {
    if ($('#agree').is(":checked")) {
        viaauth($(this).attr('data-url'));
    }
});

$('.static_div a').on('click', function () {
    if ($('#agree').is(":checked")) {
        viaauth($(this).attr('data-url'));
    }
});

function viaauth(obj_url) {
	var login_str = 'extend=' + GetParam(url, 'nasid') + ':' + GetParam(url, 'mac') + ':' + GetParam(url, 'sessionid') + ':' + GetParam(url, 'timeout') + ':' + GetParam(url, 'ts') + ':' + GetParam(url, 'sign');
    var url_send = "http://" + GetParam(url, 'uamip') + ":" + GetParam(url, 'uamport') + "/login?" + login_str;
	
	$.ajax({
        type: 'GET',
        url: url_send,
        dataType: 'jsonp',
        jsonpCallback: 'getdata',
        success: function (data) {
            if (data.msg == '0') {
                 go_new_herf(obj_url)
            }
        }
    });
}
function go_new_herf(obj_url) {
    if (obj_url == '' || obj_url == undefined) {
        location.href = 'http://www.comfast.com.cn';
    } else {
        location.href = obj_url;
    }
}

getJson();