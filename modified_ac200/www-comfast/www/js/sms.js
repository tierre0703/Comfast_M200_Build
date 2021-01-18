var Timeouts = 0;

var portal_data, language;

var randomnum = Math.floor(Math.random() * 100000);

var browserLanguage = (navigator.language || navigator.browserLanguage).toLowerCase();

if (browserLanguage.indexOf('zh') > -1) {
    language = 'cn';
} else {
    language = 'en';
}

var url = location.href;

var text1 = {
    "cn": "登录",
    "en": "Login"
};

var tips = {
    "cn": "用户名或者密码错误",
    "en": "Username or Password error"
};

var sms_code_get = {
    "cn": "获取验证码",
    "en": "Seconds"
}

var sms_time_wait = {
    "cn": "秒后可重新获取",
    "en": "Seconds"
}

var sms_error = {
    "cn": "短信验证失败",
    "en": "SMS validation failure"
}

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

var mobile_mac = GetParam(url,"mac");
//var mobile_mac = "E5:E5:E5:E5:E5:E5";

$("#sms_btn").html(sms_code_get[language]);

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
    document.title = portal_data.page_title;
    $("#portaltitle").text(portal_data.header_title);
    $("#sms_login").text(text1[language]);
    slider_img(portal_data.sliderpic);
}

function slider_img(img_info) {
    var this_html = '';
    $.each(img_info, function (n, m) {
        this_html += '<li><img src="' + m.src + '?' + randomnum + '" /></li>';
    });
    $('.slides').html(this_html);
    $(".flexslider").flexslider({
        slideshowSpeed: 4000, //展示时间间隔ms
        animationSpeed: 400, //滚动时间ms
        touch: true //是否支持触屏滑动
    });
}

getJson();

$("#sms_btn").click(function () {
    if (Timeouts != 0) {
        return;
    }
	var str = "mobile=" + $("#phone").val();
    var url_send = "http://" + GetParam(url, 'uamip') + ":" + GetParam(url, 'uamport') + "/sms_send?" + str;
    $.ajax({
        type: 'GET',
        url: url_send,
        dataType: 'jsonp',
        jsonpCallback: 'getdata',
        success: function (data) {
               Timeouts = 60;
               waittime();
        }
    });
});

function waittime() {
    $("#sms_btn").html(Timeouts + " " + sms_time_wait[language]);
    if(Timeouts){
        Timeouts--;
        setTimeout(waittime, 1000);
    }else {
        $("#sms_btn").html(sms_code_get[language]);
    }
}

$("#sms_login").click(function () {
    var str = 'sms_info=' + GetParam(url, 'timeout') + ':'  +  $("#phone").val() + ':' + $("#code").val();
    var url_send = "http://" + GetParam(url, 'uamip') + ":" + GetParam(url, 'uamport') + "/login?" + str;
    $.ajax({
        type: 'GET',
        url: url_send,
        dataType: 'jsonp',
        jsonpCallback: 'getdata',
        success: function (data) {
            if (data.msg != '0') {
                alert(tips[language])
            } else {
                if (portal_data.ok_link == '') {
                    location.href = 'http://www.comfast.com.cn';
                } else {
                    location.href = portal_data.ok_link;
                }
            }
        }
    });
});

function viaauth() {
	var login_str = 'sms_info=' + GetParam(url, 'timeout') + ':'  +  $("#phone").val() + ':' + $("#code").val();
    var url_send = "http://" + GetParam(url, 'uamip') + ":" + GetParam(url, 'uamport') + "/login?" + login_str;
    $('body').append('<iframe src="' + url_send + '" style="display: none"></iframe>');
}
