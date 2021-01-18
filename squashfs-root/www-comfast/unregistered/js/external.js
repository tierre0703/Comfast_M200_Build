define(function (require, exports) {
    var d = require("jquery");
    exports.init = function () {
        d("body").append('<div style="position: fixed;bottom: 0px; right: 0px;width: 100%;height: 32px;line-height:32px;background: #ffffff;text-align: center;color: #ff0000;z-index: 999">您使用的未注册软件,可能系统不稳定,请到正规渠道购买。</div>');
    };
});