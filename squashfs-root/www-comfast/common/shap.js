(function ($) {
    $.inits = {
        ap: function () {
            $.morton.goback();
            $.morton.step();
            $.morton.volide('.wizard_box');
        },
        bridge: function () {
            $.morton.goback();
            $.morton.step('bridge_wizard');
            $.morton.volide('.wizard_box');
            //$.morton.replace_html();
        },
        router: function () {
            $.morton.goback();
            $.morton.step('router_wizard');
            $.morton.chgInput('radio_tabs', 'radio_boxs');
            $.morton.volide('.wizard_box');
        },
    }
})(jQuery)
