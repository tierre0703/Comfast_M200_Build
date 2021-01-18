var language;
var browserLanguage = (navigator.language || navigator.browserLanguage).toLowerCase();
var url = location.search;

if (browserLanguage.indexOf('zh') > -1) {
    language = 'cn';
} else {
    language = 'en';
}

var head_title = {
    "cn": "微信支付",
    "en": "Wechat pay"
};
var tips1 = {
    "cn": "1.长按二维码保存图片.",
    "en": "1.Long by two-dimensional code to save pictures."
};
var tips2 = {
    "cn": "2.打开微信扫一扫，从相册选择二维码图片.",
    "en": "2.Open the WeChat sweep, select the two-dimensional code image from the album."
};
var tips3 = {
    "cn": "3.完成支付，可以上网了.",
    "en": "3.Complete the payment, you can access the Internet."
};
var tips4 = {
    "cn": "二维码生成失败，请联系管理员",
    "en": "QR code failed to generate, please contact the administrator"
};

function GetParam(url, id) {
    url = url + "";
    var regstr = "/(\\?|\\&)" + id + "=([^\\&]+)/";
    var reg = eval(regstr);
    var result = url.match(reg);
    if (result && result[2]) {
        return result[2];
    }else {
        return ;
    }
}

var connUrl = "http://" + GetParam(url, 'uamip') + ":" + GetParam(url, 'uamport') + "/connup?captive=60";

$(document).ready(function () {
    $('#head_title').text(head_title[language]);
    $('#msg_tip1').text(tips1[language]);
    $('#msg_tip2').text(tips2[language]);
    $('#msg_tip3').text(tips3[language]);

    //设置二维码内容
    if(GetParam(url, 'code_url') != '' && GetParam(url, 'code_url') != undefined ){

        $.ajax({
            type: "get",
            url: connUrl,
            timeout: 500,
            dataType: "jsonp",
            jsonp: "callBack",
            success: function(data) {
            }
        });

        //设置属性
        var qrcode = new QRCode(document.getElementById("qrcode"), {
            width: 200,
            height: 200
        });
        qrcode.makeCode(GetParam(url, 'code_url'));

        $('#qrcode img').mouseover(function () {
            $('#wxPayExample').show();
        }).mouseleave(function () {
            $('#wxPayExample').hide();
        })
    }else {
        $('#qrcode').height(10);
        $(".msg").html(tips4[language]);
    }
});