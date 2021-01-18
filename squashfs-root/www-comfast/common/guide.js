define(function (a, b) {

    var d = a("jquery"),
        e = a("mbox"),
        f = a("util"),
        g = a("function"),
        nowLang,
        et = {};

    a('dropdown')(d);
    a('collapse')(d);
    a('transition')(d);

    function init() {
        e.plugInit(et,start_model);
    }

    function start_model(data) {
        nowLang = data;
    }

    b.init = init;
});