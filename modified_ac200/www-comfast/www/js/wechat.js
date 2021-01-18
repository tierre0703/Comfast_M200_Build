var portal_data, language, extend_str;
var randomnum = Math.floor(Math.random() * 100000);
var browserLanguage = (navigator.language || navigator.browserLanguage).toLowerCase();
var url = location.href;

if (browserLanguage.indexOf('zh') > -1) {
    language = 'cn';
} else {
    language = 'en';
}

var text1 = {
    "cn": "一键打开微信连Wi-Fi",
    "en": "A key to open WeChat even WiFi"
};
var link_ok = {
    "cn": "连接成功",
    "en": "Connected"
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
    if(GetParam(url, 'res') == 'success'){
        $("#link_btn").text(link_ok[language]);
    }else {
        $("#link_btn").text(text1[language]);
    }
    slider_img(portal_data.sliderpic);
    $('#mobile_box').removeClass('hidden');
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

extend_str = GetParam(url, 'nasid') + ':' + GetParam(url, 'mac') + ':' + GetParam(url, 'sessionid') + ':' + GetParam(url, 'timeout') + ':' + GetParam(url, 'ts') + ':' + GetParam(url, 'sign');

var loadIframe = null;
var noResponse = null;
var callUpTimestamp = 0;

function createIframe() {
    var iframe = document.createElement("iframe");
    iframe.style.cssText = "display:none;width:0px;height:0px;";
    document.body.appendChild(iframe);
    loadIframe = iframe;
}
//注册回调函数
function jsonpCallback(result) {
    if (result && result.success) {
        //alert('WeChat will call up : ' + result.success + '  data:' + result.data);
        var ua = navigator.userAgent;
        if (ua.indexOf("iPhone") != -1 || ua.indexOf("iPod") != -1 || ua.indexOf("iPad") != -1) { //iPhone
            document.location = result.data;
        } else {
            if ('false' == 'true') {
                alert('[强制]该浏览器不支持自动跳转微信请手动打开微信\n如果已跳转请忽略此提示');
                return;
            }
            createIframe();
            callUpTimestamp = new Date().getTime();
            loadIframe.src = result.data;
            noResponse = setTimeout(function () {
                errorJump();
            }, 3000);
        }
    } else if (result && !result.success) {
        alert(result.data);
    }
}
/*
$('.slides').on('click', 'img', function () {
    if (GetParam(url, 'res') == 'success'){
        if (portal_data.ok_link == '') {
            location.href = 'http://www.comfast.com.cn';
        } else {
            location.href = portal_data.ok_link;
        }
    }else {
        viaauth();
    }
});
*/
$('#link_btn').on('click', function () {
    if (GetParam(url, 'res') == '0'){
        if (portal_data.ok_link == '') {
            location.href = 'http://www.comfast.com.cn';
        } else {
            location.href = portal_data.ok_link;
        }
    }else {
        viaauth();
    }
});

function viaauth() {
    var authUrl = "http://" + GetParam(url, 'uamip') + ':' + GetParam(url, 'uamport') + "/logon";
    var send_url = "https://wifi.weixin.qq.com/operator/callWechat.xhtml?appId=" + GetParam(url, 'appid') + "&extend=" + extend_str + "&timestamp=" + GetParam(url, 'timebuf') + "&sign=" + GetParam(url, 'sign1') + "&shopId=" + GetParam(url, 'shop_id') + "&authUrl=" + encodeURIComponent(authUrl) + "&mac=" + GetParam(url, 'mac').replace(/-/ig, ':').toLowerCase() + "&ssid=" + GetParam(url, 'ssid') + "&bssid=" + "ff:ff:ff:ff:ff:ff";
    //通过dom操作创建script节点实现异步请求
    var script = document.createElement('script');
    script.setAttribute('src', send_url);
    document.getElementsByTagName('head')[0].appendChild(script);
}

getJson();

