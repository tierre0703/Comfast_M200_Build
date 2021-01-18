var portal_data, language;
var randomnum = Math.floor(Math.random() * 100000);
var browserLanguage = (navigator.language || navigator.browserLanguage).toLowerCase();
var url = location.href;

if (browserLanguage.indexOf('zh') > -1) {
    language = 'cn';
} else {
    language = 'en';
}

var text1 = {
    "cn": "登录",
    "en": "Login"
};

var user_error_tips = {
    "cn": "用户名错误",
    "en": "Username error"
};

var pass_error_tips = {
    "cn": "密码错误",
    "en": "Password error"
};

var user_pass_tips = {
    "cn": "该帐号正在使用中",
    "en": "The account is in use"
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
    document.title = portal_data.page_title;
    $("#portaltitle").text(portal_data.header_title);
    $("#link_btn").text(text1[language]);
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

$('#link_btn').on('click', function () {
    var password = $('#password').val();
    var str = 'passwd_info=' + GetParam(url, 'timeout') + ':' + password + '';
    var url_send = "http://" + GetParam(url, 'uamip') + ":" + GetParam(url, 'uamport') + "/login?" + str;
    //$('body').append('<iframe src="' + url_send + '"  id="msg_iframe"></iframe>');
    $.ajax({
        type: 'GET',
        url: url_send,
        dataType: 'jsonp',
        jsonpCallback: 'getdata',
        success: function (data) {
            if (data.msg == '0') {
                if (portal_data.ok_link == '') {
                    location.href = 'http://www.comfast.com.cn';
                } else {
                    location.href = portal_data.ok_link;
                }
            } else if (data.msg == '1') {
                alert(user_pass_tips[language])
            } else if (data.msg == '2') {
                alert(user_error_tips[language])
            } else if (data.msg == '3') {
                alert(pass_error_tips[language])
            }
        }
    });
});

getJson();
