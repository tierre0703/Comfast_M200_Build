define(function (require, exports) {
    var d = require("jquery"),
        f = require("util");



    require('cookie')(d);

    var nowLang, device_info, menu_json, menu_array;
    var this_url = location.pathname;
    var bm_enabled = false;
    /* common init */
    exports.common = function (device, callback) {
        nowLang = device.language;
        device_info = device;
        document.title = GLOBLE_TITLE;
        click_href();

        f.getSHConfig('bandwidth_config.php?method=GET&action=bm_config', function(data){
            bm_enabled = data.bm_enabled || 0;
            //device_info.mwan = bm_enabled == 0 ? 1 : 0;
        }, false);
        if (device.wifi == "1") {
            d("#mode_set").removeClass("hidden");
            if (d.cookie("mode") == "1") {
                d(".mode_set_text").html(global_simple);
            } else {
                d(".mode_set_text").html(global_senior);
            }
        } else {
            d(".mode_set").remove();
        }
        ajax_menu();

        if (callback) {
            callback(device);
        }
        //timer show
        show_timer();
        setInterval(show_timer, 60000);
    }
    
    
    function checkTime(i) {
        return (i < 10) ? "0" + i : i;
    }
    
    function show_timer() {
        var servername;
        var time = "";
        
		f.getMConfig('ntp_timezone', function (data) {
            if (data && !data.errCode) {
                ntptime_info = data.ntp;
				var y = ntptime_info.timestr.substring(0, 4);
				var m = ntptime_info.timestr.substring(5, 7);
				var day = ntptime_info.timestr.substring(8, 10);
				var hour = ntptime_info.timestr.substring(14, 16);
				var mm = ntptime_info.timestr.substring(17, 19);

				var date_str = "Date: "  + m + "/"+ day + "/" + y;
				var time_str = "Time: " + hour + ":" + mm;

				var this_html='<div class="pull-left" style="padding-top: 12px;"><span style="font-weight:bold;font-size:10px">' + date_str + '<br/>' + time_str + '</span></div><ul class="nav navbar-nav pull-right"><li class="hidden-xs" id="login_out"><a href="#"><i class="fa fa-power-off"></i></a></li></ul></div>';
				
				
				d("#header-nav").html(this_html);
				
				d('#login_out').on('click', function () {
					f.logout(function (data) {
						if (data.errCode == 0) {
							location.replace(window.location.protocol + '//' + window.location.host);
							return;
						}
					})
				});
                
            }
        });        
        
    }
    
    /*
    function show_timer() {
		
		
		var cur_date = new Date();
		var day = checkTime(cur_date.getDate());
		var m = checkTime(cur_date.getMonth() + 1);
		var y = cur_date.getFullYear();
		var h = cur_date.getHours();
		var hour = checkTime(h % 12 ? h % 12 : 12);
        var mm = checkTime(cur_date.getMinutes());
        var ampm = cur_date.getHours() >= 12 ? 'pm' : 'am';
		var date_str = "Date: "  + m + "/"+ day + "/" + y;
		var time_str = "Time: " + hour + ":" + mm + " " + ampm.toUpperCase();
		var this_html='<div class="pull-left" style="padding-top: 12px;"><span style="font-weight:bold;font-size:10px">' + date_str + '<br/>' + time_str + '</span></div><ul class="nav navbar-nav pull-right"><li class="hidden-xs" id="login_out"><a href="#"><i class="fa fa-power-off"></i></a></li></ul></div>';
		
		
		d("#header-nav").html(this_html);
		
		d('#login_out').on('click', function () {
			f.logout(function (data) {
				if (data.errCode == 0) {
					location.replace(window.location.protocol + '//' + window.location.host);
					return;
				}
			})
		});

			
	}
	**/

    function click_href() {
        d.ajax({
            type: 'GET',
            dataType: 'json',
            url: '/js/config.json',
            cache: false,
            success: function (data) {
                if (data.href != '') {
                    d('#logo').attr("href", data.href).css("cursor", "pointer");
                }
            }
        })
    }

    d(".mode_set").on("click", function () {
        if (d.cookie("mode") == "0" || d.cookie("mode") == undefined) {
            d.cookie("mode", "1", {path: '/'});
        } else {
            d.cookie("mode", "0", {path: '/'});
        }
        window.location.href = "http://" + location.hostname + "/index.html";
    });

    function ajax_menu() {
        d.ajax({
            type: 'GET',
            dataType: 'json',
            async: false,
            url: '/js/create_menu.json',
            cache: false,
            success: function (data) {
                menu_json = data;
                d('#sidebar-nav').html(create_sub_menu(menu_json, 0));
                d('#nav-submenu').html(create_sub_menu(menu_json, 1));

                d('.mainmenuTab').hover(
                function(){
                    var isHovered = d(this).is(":hover");
                    if(isHovered)
                        d(this).find(".dropdown-content-tab").addClass('show');
                    else
                        d(this).find(".dropdown-content-tab").removeClass('show');
                  });
            }
        })
    }


    //submenu's menu
    function create_sub_sub_menu(data, leven)
    {
         var menu_html, sh_lang, sh_lang_child, this_mode = "0";
        var noborder, hasactive, spancaret, sub_sub_menu, menu_urls = "";
        
        if (d.cookie("mode") == "1") {
            this_mode = "1";
        }

        var menu_html = '<ul class="submenu-list main-box">';

        d.each(data, function(n, m)
        {
            if (this_mode == "0" && m.mode && m.mode != this_mode) {
                return;
            }
            if ((m.vlan && device_info.vlan != m.vlan) || (m.ac && device_info.ac != m.ac) || (m.mwan && device_info.mwan != m.mwan) || (m.lan && device_info.lan != m.lan)) {
                return;
            }
            
            if(m.urls.indexOf("qos_mwan") >= 0 && bm_enabled == 1) return;
            if(n == m.childs.length - 1)
            {
                noborder = " noborder";
            }
            else
            {
                noborder = "";
            }

            sh_lang = eval(m.name);
            if (this_url.indexOf(m.urls) > -1) {
                //cur page
                menu_html += '<li class="active ' + noborder + '"><a href="' + m.urls + '"><span sh_lang = ' + m.name + '>' + sh_lang + '</span></a></li>';
            }
            else
            {
                menu_html += '<li class="' + noborder + '"><a href="' + m.urls + '"><span sh_lang = ' + m.name + '>' + sh_lang + '</span></a></li>';
            }

        });

        menu_html += "</ul>";
        return menu_html;
    }


    function create_dropdown(data)
    {
        var text_html = '<div class="dropdown-content-tab">';
        d.each(data, function(n, m){
            if(m.mwan && device_info.mwan != m.mwan)
            return;
            
            if(m.urls.indexOf("qos_mwan") >= 0 && bm_enabled == 1) return;

            sh_lang = eval(m.name);
            if(this_url.indexOf(m.urls) > -1)
            {
                text_html += '<a href="' + m.urls + '"><span class="active" sh_lang="' + m.name + '">' +  sh_lang+ '</span></a>';            

            }
            else
            {
                text_html += '<a href="' + m.urls + '"><span sh_lang="' + m.name + '">' +  sh_lang+ '</span></a>';            
            }
        });
        text_html += '</div>';

        return text_html;

    }

   
    //tierre new split main menu | sub menu
   function create_sub_menu(data, leven) {
        
        var menu_html, sh_lang, sh_lang_child, this_mode = "0";
        var noborder, hasactive, spancaret, sub_sub_menu, menu_urls = "";
        if (leven == 0) {
            menu_html = '<ul class="nav nav-pills nav-stacked" >';
        } else {
            menu_html = '<ul class="submenu">';
        }

        if (d.cookie("mode") == "1") {
            this_mode = "1";
        }

        d.each(data, function (n, m) {
            if (this_mode == "0" && m.mode && m.mode != this_mode) {
                return;
            }
            if ((m.vlan && device_info.vlan != m.vlan) || (m.ac && device_info.ac != m.ac) || (m.mwan && device_info.mwan != m.mwan) || (m.lan && device_info.lan != m.lan)) {
                return;
            }

            sh_lang = eval(m.name);
            if (m.childs.length > 0) {
               
                if (leven == 0) {
                    menu_urls = m.childs[0].urls;
                    if (this_url.indexOf(m.urls) > -1 || this_url.indexOf(m.urltag) > -1) {
                        menu_html += '<li class="active mainmenuTab">';
                        menu_html += '<a href="' + menu_urls + '" class="dropdown-toggle"><i class="fa svg-icon ' + m.icon + '"></i>' +
                        '<span sh_lang = ' + m.name + '>' + sh_lang + '</span><i class="fa fa-chevron-circle-right drop-icon"></i></a>';
                        menu_html += create_dropdown(m.childs);
                    } else {
                        menu_html += '<li class="mainmenuTab">';
                        menu_html += '<a href="' + menu_urls + '" class="dropdown-toggle"><i class="fa svg-icon ' + m.icon + '"></i>' +
                           '<span sh_lang = ' + m.name + '>' + sh_lang + '</span><i class="fa fa-chevron-circle-right drop-icon"></i></a>';
                        menu_html += create_dropdown(m.childs);
                    }

                    menu_html += '</li>';
                }
                else {
                    if (this_url.indexOf(m.urls) > -1) {

                        d.each(m.childs, function(n_child, m_child)
                        {
                            if(m_child.urls.indexOf("qos_mwan") >= 0 && bm_enabled == 1) return;

                            sh_lang_child = eval(m_child.name);
                            if(n_child == m.childs.length - 1)
                            {
                                noborder = " noborder";
                            }
                            else
                            {
                                noborder = "";
                            }
                            if(m_child.childs.length > 0)
                            {
                                haschild = " haschild";
                                spancaret = '<a href="' + m_child.childs[0].urls + '" sh_lang = "' + m_child.name + '">' + sh_lang_child + '</a>' + '<span class="caret"></span>' + create_sub_sub_menu(m_child.childs, 2);
                            }
                            else
                            {
                                haschild = "";
                                spancaret ='<a href="' + m_child.urls + '" sh_lang = "' + m_child.name + '">' + sh_lang_child + '</a>';
                                sub_sub_menu = "";
                            }
                            //if cur itor is current url
                            if (this_url.indexOf(m_child.urls) > -1) {
                                menu_html += '<li class=" submenu-item '+ haschild +''+ noborder +' active">' + spancaret + '</li>';
                            } else {
                                menu_html += '<li class="submenu-item '+ haschild +''+ noborder +'">' + spancaret + '</li>';
                            }

                        });
                    }
                }

                /*if (this_url.indexOf(m.urls) > -1) {
                    menu_html += '<li class="active open">';
                } else {
                    menu_html += '<li>';
                }
                if (leven == 0) {
                    menu_html += '<a class="dropdown-toggle"><i class="fa ' + m.icon + '"></i>' +
                        '<span sh_lang = ' + m.name + '>' + sh_lang + '</span>';
                    menu_html += '<i class="fa fa-chevron-circle-right drop-icon"></i></a>';
                    //menu_html += create_menu(m.childs, 1);
                    menu_html += '</li>';
                } else {
                    menu_html += '<a class="dropdown-toggle"><i class="fa fa-chevron-circle-right drop-icon"></i>' +
                        '<span sh_lang = ' + m.name + '>' + sh_lang + '</span></a>';
                    //menu_html += create_menu(m.childs, 1);
                    menu_html += '</li>';
                }*/
            } else 
            {
                if (leven == 0) {
                    if (this_url.indexOf(m.urls) > -1 || this_url.indexOf(m.urltag) > -1) {
                        menu_html += '<li class="active mainmenuTab">';
                    menu_html += '<a href="' + m.urls + '" class="dropdown-toggle"><i class="fa svg-icon ' + m.icon + '"></i>' +
                        '<span sh_lang = ' + m.name + '>' + sh_lang + '</span><i class="fa fa-chevron-circle-right drop-icon"></i></a>';
                        menu_html += create_dropdown(m.childs);
                    } else {
                        menu_html += '<li class="mainmenuTab">';
                        menu_html += '<a href="' + m.urls + '" class="dropdown-toggle"><i class="fa svg-icon ' + m.icon + '"></i>' +
                        '<span sh_lang = ' + m.name + '>' + sh_lang + '</span><i class="fa fa-chevron-circle-right drop-icon"></i></a>';
                        menu_html += create_dropdown(m.childs);
                    }
                    menu_html += '</li>';
                } /*else {
                    if (this_url.indexOf(m.urls) > -1) {
                        menu_html += '<li><a href="' + m.urls + '" sh_lang = "' + m.name + '" class="active">' + sh_lang + '</a></li>';
                    } else {
                        menu_html += '<li><a href="' + m.urls + '" sh_lang = "' + m.name + '">' + sh_lang + '</a></li>';
                    }
                }*/
            }
        });
        menu_html += '</ul>';
        return menu_html;
    }
    // tierre marked out orginial
    function create_menu(data, leven) {
        var menu_html, sh_lang, this_mode = "0";
        if (leven == 0) {
            menu_html = '<ul class="nav nav-pills nav-stacked" >';
        } else {
            menu_html = '<ul class="submenu">';
        }

        if (d.cookie("mode") == "1") {
            this_mode = "1";
        }

        d.each(data, function (n, m) {
            if (this_mode == "0" && m.mode && m.mode != this_mode) {
                return;
            }
            if ((m.vlan && device_info.vlan != m.vlan) || (m.ac && device_info.ac != m.ac) || (m.mwan && device_info.mwan != m.mwan) || (m.lan && device_info.lan != m.lan)) {
                return;
            }
            sh_lang = eval(m.name);
            if (m.childs.length > 0) {
                if (this_url.indexOf(m.urls) > -1) {
                    menu_html += '<li class="active open">';
                } else {
                    menu_html += '<li>';
                }
                if (leven == 0) {
                    menu_html += '<a class="dropdown-toggle"><i class="fa ' + m.icon + '"></i>' +
                        '<span sh_lang = ' + m.name + '>' + sh_lang + '</span>';
                    menu_html += '<i class="fa fa-chevron-circle-right drop-icon"></i></a>';
                    menu_html += create_menu(m.childs, 1);
                    menu_html += '</li>';
                } else {
                    menu_html += '<a class="dropdown-toggle"><i class="fa fa-chevron-circle-right drop-icon"></i>' +
                        '<span sh_lang = ' + m.name + '>' + sh_lang + '</span></a>';
                    menu_html += create_menu(m.childs, 1);
                    menu_html += '</li>';
                }
            } else {
                if (leven == 0) {
                    if (this_url.indexOf(m.urls) > -1 || this_url.indexOf(m.urltag) > -1) {
                        menu_html += '<li class="active">';
                    } else {
                        menu_html += '<li>';
                    }
                    menu_html += '<a href="' + m.urls + '"><i class="fa ' + m.icon + '"></i>' +
                        '<span sh_lang = ' + m.name + '>' + sh_lang + '</span></a>';
                    menu_html += '</li>';
                } else {
                    if (this_url.indexOf(m.urls) > -1) {
                        menu_html += '<li><a href="' + m.urls + '" sh_lang = "' + m.name + '" class="active">' + sh_lang + '</a></li>';
                    } else {
                        menu_html += '<li><a href="' + m.urls + '" sh_lang = "' + m.name + '">' + sh_lang + '</a></li>';
                    }
                }
            }
        });
        menu_html += '</ul>';
        return menu_html;
    }
    


    d('#nav-submenu').on('mouseenter mouseleave', '.submenu-item', function (e) {
        e.preventDefault();
        var $item = d(this);
        $item.toggleClass('open');
    });




    d('#config-tool-cog').on('click', function () {
        d('#config-tool').toggleClass('closed');
    });

    d('.language_check').on('click', function () {
        var setLang;
        setLang = d(this).attr('data-value');
        set_language(setLang);
    });

    d('#login_out').on('click', function () {
        f.logout(function (data) {
            if (data.errCode == 0) {
                location.replace(window.location.protocol + '//' + window.location.host);
                return;
            }
        })
    });

    /*

    d('#sidebar-nav').on('click', '.dropdown-toggle', function (e) {
        e.preventDefault();
        var $item = d(this).parent();
        if (!$item.hasClass('open')) {
            $item.parent().find('.open .submenu').slideUp('fast');
            $item.parent().find('.open').toggleClass('open');
        }
        $item.toggleClass('open');
        if ($item.hasClass('open')) {
            $item.children('.submenu').slideDown('fast');
        } else {
            $item.children('.submenu').slideUp('fast');
        }
    });
    */

    d('#make-small-nav').on('click', function () {
        d('#page-wrapper').toggleClass('nav-small');
    });

    d('#search_value').keyup(function () {
        var search_value = d(this).val().replace(/(^\s+)|(\s+$)/g, "");
        menu_array = [];
        if (search_value != '') {
            var clone_menu = d.extend(true, '{}', menu_json);
            seach_menu(clone_menu, search_value);
            d('#sidebar-nav').addClass('nav-seach').html(create_seach_menu(menu_array));
        } else {
            if (device_info.wifi == "1") {
                d('#sidebar-nav').removeClass('nav-seach').html(path_router_menu(menu_json, 0));
            } else {
                d('#sidebar-nav').removeClass('nav-seach').html(path_ac_menu(menu_json, 0));
            }
        }
    });

    function seach_menu(menu, arg) {
        var sh_lang;
        d.each(menu, function (n, m) {
            sh_lang = eval(m.name);
            if (sh_lang.toLowerCase().indexOf(arg.toLowerCase()) > -1) {
                menu_array.push(m);
            } else if (m.childs != '') {
                seach_menu(m.childs, arg);
            }
        });
    }

    function create_seach_menu(arg) {
        var menu_html;
        var sh_lang;
        menu_html = '<ul class="nav nav-pills nav-stacked" >';
        d.each(arg, function (n, m) {
            sh_lang = eval(m.name);
            if (m.childs.length > 0) {
                if (this_url.indexOf(m.urls) > -1) {
                    menu_html += '<li class="active open">';
                } else {
                    menu_html += '<li>';
                }
                menu_html += '<a class="dropdown-toggle">' +
                    '<span sh_lang = ' + m.name + '>' + sh_lang + '</span>';
                menu_html += '<i class="fa fa-chevron-circle-right drop-icon"></i></a>';
                menu_html += seach_child_menu(m.childs);
                menu_html += '</li>';
            } else {
                menu_html += '<li>';
                menu_html += '<a href="' + m.urls + '">' +
                    '<span sh_lang = ' + m.name + '>' + sh_lang + '</span></a>';
                menu_html += '</li>';
            }
        });
        menu_html += '</ul>';
        return menu_html;
    }

    function seach_child_menu(arg) {
        var sh_lang, menu_html;
        menu_html = '<ul class="submenu">';
        d.each(arg, function (n, m) {
            if ((m.usb && device_info.usb != m.usb) || (m.cluster && device_info.cluster != m.cluster) || (m.vlan && device_info.vlan != m.vlan) || (m.ac && device_info.ac != m.ac) || (m.mwan && device_info.mwan != m.mwan) || (m.lan && device_info.lan != m.lan) || (m.wifi && device_info.wifi != m.wifi)) {
                return;
            }
            sh_lang = eval(m.name);
            if (m.childs.length > 0) {
                menu_html += '<li>';
                menu_html += '<a class="dropdown-toggle"><i class="fa fa-chevron-circle-right drop-icon"></i>' +
                    '<span sh_lang = ' + m.name + '>' + sh_lang + '</span></a>';
                menu_html += seach_child_menu(m.childs);
                menu_html += '</li>';
            } else {
                if (this_url.indexOf(m.urls) > -1) {
                    menu_html += '<li><a href="' + m.urls + '" sh_lang = "' + m.name + '" class="active">' + sh_lang + '</a></li>';
                } else {
                    menu_html += '<li><a href="' + m.urls + '" sh_lang = "' + m.name + '">' + sh_lang + '</a></li>';
                }
            }
        });
        menu_html += '</ul>';
        return menu_html;
    }

    exports.setvalue = function (obj, data) {
        if (data != '' && data != undefined) {
            d(obj).val(data).siblings('.tip').addClass('hide');
        } else {
            data = '';
            d(obj).val(data)
        }
    };

    exports.chgTabnet = function (tabnav, tabbox) {
        d('body').on('click', '.' + tabnav + ' .hasclick', function (event) {
            event.stopPropagation();
            var oThis = d(this);
            var oIndex = oThis.index();
            var tabCon = d('.' + tabbox + '');
            oThis.addClass('active').siblings().removeClass('active');
            tabCon.children().eq(oIndex).addClass('show').siblings().removeClass('show');
        })
    }

    exports.chgTabs = function (tabnav, tabbox) {
        d('body').on('click', '.' + tabnav + ' li', function (event) {
            event.stopPropagation();
            var oThis = d(this);
            var oIndex = oThis.index();
            var tabCon = d('.' + tabbox).children();
            oThis.addClass('active').siblings().removeClass('active');
            oThis.find('input[type="radio"]').prop('checked', true).end().siblings().find('input[type="radio"]').prop('checked', false);
            tabCon.eq(oIndex).addClass('show').siblings().removeClass('show');
        })
    };

    function set_language(arg) {
        if (arg == nowLang) {
            return;
        }
        d('.language_check').removeClass('active');
        nowLang = arg;
        var this_data = {"language": arg};
        f.setSConfig('language', this_data, function (data) {
            if (data.errCode == '0') {
                location.replace(location.href);
                //d('#search_value').val('');
                //e.exportscript(arg);
            }
        });
    }

    exports.setting = function (times, callback) {
        times = times || 1;
        var $setbox = (!d('.loading').length) ? d('<div>').addClass('loading') : d('.loading');
        var seting_tip = setting_tips_start + '<span class="seting_time">' + times + '</span>' + setting_tips_end;
        var $backdrop = d('<div>').addClass('loading-backdrop');
        var $loadcont = d('<div>').addClass('loadcont');
        var $progress = d('<img>').attr('src', '/images/loading.gif');
        var $progressbox = d('<div>').addClass('progressbox').append($progress);
        var $txtbox = d('<div>').addClass('txtbox').html(seting_tip);

        $setbox.append($backdrop, $loadcont.append($progressbox, $txtbox)).appendTo('body');

        d('.loadcont').css({
            left: (d(window).width() - d('.loadcont').innerWidth()) / 2,
            top: (d(window).height() - d('.loadcont').innerHeight()) / 2
        });

        showremaintime(times, callback);
    };

    function showremaintime(times, callback) {
        if (times) {
            setTimeout(function () {
                times--;
                d('.seting_time').html(times);
                showremaintime(times, callback);
            }, 1000);
        } else {
            callback();
        }
    }

    exports.format_volide_ok = function (obj) {
        if (!obj || obj == undefined) {
            obj = 'body'
        }
        var requires = d(obj).find('.require');
        for (var i = 0; i < requires.length; i++) {
            var _this = requires[i];
            if (d(_this).is(":visible") && d(_this).attr('disabled') != 'disabled') {
                d(_this).trigger('blur');
                if (d(_this).hasClass('borError')) {
                    return false;
                }
            }
        }
        return true;
    }

    exports.format_wifi_ok = function () {
        var requires = d('#content-wrapper').find('.require');

        for (var i = 0; i < requires.length; i++) {
            var _this = requires[i];
            if (d(_this).attr('disabled') != 'disabled') {
                d(_this).trigger('blur');
                if (d(_this).hasClass('borError')) {
                    return false;
                }
            }
        }

        requires = d('#content-wrapper').find('.only-require');
        for (var i = 0; i < requires.length; i++) {
            var _this = requires[i];
            if (d(_this).attr('disabled') != 'disabled') {
                d(_this).trigger('blur');
                if (d(_this).hasClass('borError')) {
                    return false;
                }
            }
        }
        return true;
    };

    exports.format_wifi_jump_ok = function () {
        var requires = d('#modal_edit').find('.require');

        for (var i = 0; i < requires.length; i++) {
            var _this = requires[i];
            if (d(_this).attr('disabled') != 'disabled') {
                d(_this).trigger('blur');
                if (d(_this).hasClass('borError')) {
                    return false;
                }
            }
        }
        return true;
    };

    function get_config(a, b) {
        d.ajax({
            type: 'GET',
            dataType: 'json',
            async: false,
            url: '/js/guide.json',
            success: a,
            error: b
        })
    }

    exports.step = function (model, opt) {
        var not_radio, remove_div;
        if (!model) {
            return;
        }
        var $html = [], $arrs;
        get_config(function (data) {
            $arrs = data[model];
            if (opt) {
                not_radio = 'w' + opt;
                remove_div = 'w' + opt;
                $arrs.splice(d.inArray(not_radio, $arrs), 1);
                d('.' + remove_div).remove();
            }
            $html += '<ul>';
            d.each($arrs, function (n, m) {
                if (n == 0) {
                    $html += '<li class="active"><span>' + (n + 1) + '</span></li>'
                } else {
                    $html += '<li><span>' + (n + 1) + '</span></li>'
                }
            });
            d('.shstep').html($html);
        })
    }

    exports.swich = function (evt, swich_status, openvalue) {
        if (openvalue == undefined) {
            openvalue = 1;
        }
        if (!swich_status) {
            swich_status = 0;
        }

        if (swich_status == openvalue) {
            d(evt).attr('data-value', swich_status);
            d(evt).addClass("switchopen").removeClass("switchclose");
        } else {
            d(evt).attr('data-value', swich_status);
            d(evt).addClass("switchclose").removeClass("switchopen");
        }
    }

    exports.clearall = function () {
        d('input[type="text"]').val('').removeClass('borError').attr('disabled', false);
        d('.modal-content input[type=checkbox]').attr('checked', false);
        d('.modal-content select').attr('disabled', false);
        d('textarea').val('');
        d('.modal-content select').each(function (n, m) {
            d(m).children().eq(0).prop("selected", 'selected');
        });
        d('body').find('.icon_margin').remove();
    }

    exports.comput_ip = function (ip, netmask) {
        var ip_array = ip.split('.');
        var netmask_array = netmask.split('.');
        var data = {}, temp_first = [], temp_last = [];
        data.maskbit = 0;

        d.each(netmask_array, function (n, m) {
            data.maskbit += count_bits_from_left(parseInt(m, 10));
        });
        if (data.maskbit == '31') {
            data.firstip = comput_first_iparr(ip_array, netmask_array);
            data.lastip = comput_last_iparr(ip_array, netmask_array);
            data.ipsum = 2;
        } else if (data.maskbit == '32') {
            data.firstip = ip;
            data.lastip = ip;
            data.ipsum = 1;
        } else {
            temp_first = comput_first_iparr(ip_array, netmask_array);
            temp_last = comput_last_iparr(ip_array, netmask_array);
            data.firstip = temp_first[0] + '.' + temp_first[1] + '.' + temp_first[2] + '.' + (parseInt(temp_first[3]) + 1);
            data.lastip = temp_last[0] + '.' + temp_last[1] + '.' + temp_last[2] + '.' + (parseInt(temp_last[3]) - 1);
            data.ipsum = Math.pow(2, 32 - data.maskbit) - 2;
        }
        return data;
    }

    function count_bits_from_left(num) {
        if (num == 255) {
            return (8);
        }
        var i = 0;
        var bitpat = 0xff00;
        while (i < 8) {
            if (num == (bitpat & 0xff)) {
                return (i);
            }
            bitpat = bitpat >> 1;
            i++;
        }
        return (Number.NaN);
    }

    function comput_first_iparr(ip, netmask) {
        var data = [];
        for (var i = 0; i < 4; i++) {
            data[i] = ip[i] & netmask[i];
        }
        return data;
    }

    function comput_last_iparr(ip, netmask) {
        var data = [];
        for (var i = 0; i < 4; i++) {
            data[i] = ip[i] | (~netmask[i] & 0xff);
        }
        return data;
    }

    exports.formatsecond = function (second) {
        var time;
        var days = Math.floor(second / (24 * 3600));
        var hours = Math.floor((second - days * 24 * 3600) / 3600);
        var minutes = Math.floor((second - days * 24 * 3600 - hours * 3600) / 60);
        var seconds = Math.round(second - days * 24 * 3600 - hours * 3600 - minutes * 60);

        time = days + 'd' + hours + 'h' + minutes + 'm' + seconds + 's';
        if (days) {
            time = days + 'd' + (hours ? hours + 'h' : '');
        } else {
            time = (hours ? hours + 'h' : '') + (minutes ? minutes + 'm' : '') + (seconds ? seconds + 's' : '');
        }
        return time;
    }

    exports.bytesTosize = function (bytes, length_size) {
        if (!length_size) {
            length_size = 0
        }
        bytes = parseInt(bytes) || 0;
        if (bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));

        return (bytes / Math.pow(k, i)).toFixed(length_size) + ' ' + sizes[i];
    }

    //tierre 20201028 Megabit
    exports.bytesTosizePerSec = function (bytes, length_size) {
        if (!length_size) {
            length_size = 0
        }
        bytes = parseInt(bytes) || 0;
        if (bytes === 0) return '0 Mb/s';
        //var k = 1024 ;
        //var sizes = ['b/s', 'Kb/s', 'Mb/s', 'Gb/s', 'Tb/s', 'Pb/s', 'Eb/s', 'Zb/s', 'Yb/s'];
        //var i = Math.floor(Math.log(bytes) / Math.log(k));

        //return (bytes / Math.pow(k, i)).toFixed(length_size) + ' ' + sizes[i];
		var k = 1000 * 1000 / 8;
		return (bytes / k).toFixed(length_size) + ' Mb/s';
    }


	 exports.bytesToMb = function (bytes, length_size) {
        if (!length_size) {
            length_size = 0
        }
        bytes = parseInt(bytes) || 0;
        if (bytes === 0) return 0;
        //var k = 1024 ;
        //var sizes = ['b/s', 'Kb/s', 'Mb/s', 'Gb/s', 'Tb/s', 'Pb/s', 'Eb/s', 'Zb/s', 'Yb/s'];
        //var i = Math.floor(Math.log(bytes) / Math.log(k));

        //return (bytes / Math.pow(k, i)).toFixed(length_size) + ' ' + sizes[i];
		var k = 1024 * 1024 / 8;
		return (bytes / k);
    }



    exports.ifacetoname = function (arg) {
        if (!arg) {
            return false;
        }
        var ifacename, number, ifacetype;
        ifacetype = arg.replace(/[^A-Za-z]+/g, "");
        number = arg.replace(/[^0-9]+/g, "") || '0';
        number++;
        ifacename = ifacetype + number;
        return ifacename.toUpperCase();
    };

    exports.nametoiface = function (arg) {
        var ifacename, number, ifacetype;
        ifacetype = arg.replace(/[^A-Za-z]+/g, '');
        number = arg.replace(/[^0-9]+/g, '') || '';
        number--;
        if (number <= '0') {
            number = '';
        }
        ifacename = ifacetype + number;
        return ifacename.toLowerCase();
    };

    exports.getifacenum = function (arg) {
        var ifacenum;
        ifacenum = arg.replace(/[^0-9]+/g, "") || '0';
        return ifacenum;
    };

    exports.radiobox = function (evt) {
        var checkname = d(evt).attr('name');
        d('[name=' + checkname + ']').attr('checked', false);
        d(evt).prop('checked', true);
    };

    exports.formatTime = function () {
        var ts = arguments[0] || 0;
        var t, y, m, d, h, i, s;
        t = ts ? new Date(ts * 1000) : new Date();
        y = t.getFullYear();
        m = t.getMonth() + 1;
        d = t.getDate();
        h = t.getHours();
        i = t.getMinutes();
        s = t.getSeconds();
        return y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d) + ' ' + (h < 10 ? '0' + h : h) + ':' + (i < 10 ? '0' + i : i) + ':' + (s < 10 ? '0' + s : s);
    }

    exports.uptime_str = function (uptime) {
        var uptime_str = "0s";
        var temp = 0, temp_res = 0;
        if (uptime < 60) {
            uptime_str = uptime + "s";
        } else if (uptime < 3600) {
            temp = parseInt(uptime / 60);
            temp_res = parseInt(uptime % 60);
            uptime_str = temp.toString() + "m" + temp_res.toString() + "s";
        } else if (uptime < 24 * 3600) {
            temp = parseInt(uptime / 3600);
            temp_res = parseInt(parseInt(uptime % 3600) / 60);
            if (temp_res == '0') {
                uptime_str = temp.toString() + "h";
            } else {
                uptime_str = temp.toString() + "h" + temp_res.toString() + "m";
            }
        } else {
            temp = parseInt(uptime / (24 * 3600));
            temp_res = parseInt(parseInt(uptime % (24 * 3600)) / 3600);
            if (temp_res == '0') {
                uptime_str = temp.toString() + "d";
            } else {
                uptime_str = temp.toString() + "d" + temp_res.toString() + "h";
            }
        }
        return uptime_str;
    };

    exports.omittext = function (text, num) {
        var str;
        if (text.length > num) {
            str = text.substring(0, num) + "...";
        } else {
            str = text;
        }
        return str;
    };

    exports.shconfirm = function (popHtml, type, options) {
        var this_obj = {};
        this_obj.btnEnum = {
            ok: parseInt("0001", 2), 
            cancel: parseInt("0010", 2),
            okcancel: parseInt("0011", 2)
        };

        this_obj.eventEnum = {
            ok: 1,
            cancel: 2,
            close: 3
        };

        this_obj.typeEnum = {
            success: "success",
            error: "error",
            confirm: "confirm",
            warning: "warning",
            custom: "custom"
        };

        var btnType = this_obj.btnEnum;
        var eventType = this_obj.eventEnum;

        var popType = {
            success: {
                title: global_information,
                icon: '<i class="iconcorrect fa fa-times-circle"></i>',
                btn: btnType.ok
            },
            error: {
                title: global_warning,
                icon: '<i class="iconerror fa fa-times-circle"></i>',
                btn: btnType.ok
            },
            confirm: {
                title: global_warning,
                icon: '<i class="iconwarning fa fa-info-circle"></i>',
                btn: btnType.okcancel
            },
            warning: {
                title: global_warning,
                icon: '<i class="iconwarning fa fa-info-circle"></i>',
                btn: btnType.ok
            },
            custom: {
                icon: '',
                btn: btnType.okcancel
            }
        };

        var itype = type ? type instanceof Object ? type : popType[type] || {} : {};
        var config = d.extend(true, {
            title: "&nbsp",
            btn: btnType.ok,
            onOk: d.noop,
            onCancel: d.noop,
            onClose: d.noop
        }, itype, options);

        var $txt = d("<span>").html(popHtml);
        var $tt = d("<span>").addClass("tt").text(config.title);
        var $icon = config.icon;

        var btn = config.btn;

        var popId = creatPopId();

        var $box = d("<div>").addClass("mo_Confirm");
        var $layer = d("<div>").addClass("xc_layer");
        var $popBox = d("<div>").addClass("popBox");
        var $ttBox = d("<div>").addClass("ttBox");
        var $contBox = d("<div>").addClass("contBox");
        var $icobox = d("<div>").addClass("icobox").append($icon);
        var $txtBox = d("<div>").addClass("txtBox").append($txt);
        var $btnArea = d("<div>").addClass("btnArea");


        var $ok = d("<a>").addClass("sgBtn").addClass("ok").text(global_sure);
        var $cancel = d("<a>").addClass("sgBtn").addClass("cancel").text(global_cancel);
        var $clsBtn = d("<i>").addClass("iconclose fa fa-times");
        var btns = {
            ok: $ok,
            cancel: $cancel
        };

        init();

        function init() {
            creatDom();
            bind();
        }

        function creatDom() {
            $popBox.append(
                $ttBox.append(
                    $clsBtn
                ).append(
                    $tt
                )
            ).append(
                $contBox.append($icobox).append($txtBox)
            ).append(
                $btnArea.append(creatBtnGroup(btn))
            );
            $box.attr("id", popId).append($layer).append($popBox);
            d("body").append($box);
        }

        function bind() {
            $ok.click(doOk);

            d(window).bind("keydown", function (e) {
                if (e.keyCode == 13) {
                    if (d("#" + popId).length == 1) {
                        doOk();
                    }
                }
            });

            $cancel.click(doCancel);
            $clsBtn.click(doClose);
        }

        function doOk() {
            d("#" + popId).animate({opacity: '0'}, 500, function () {
                config.onOk();
                d(this).remove()
            });
            config.onClose(eventType.ok);
        }

        function doCancel() {
            d("#" + popId).animate({opacity: '0'}, 500, function () {
                config.onCancel();
                d("#" + popId).remove();
            });

            config.onClose(eventType.cancel);
        }

        function doClose() {
            d("#" + popId).animate({opacity: '0'}, 500, function () {
                config.onClose(eventType.close);
                d(this).remove();
            });
            d(window).unbind("keydown");
        }

        function creatBtnGroup(tp) {
            if (btn == 3) {
                var $bgp = d("<div>").addClass("btnGroup");
                d.each(btns, function (i, n) {
                    if (btnType[i] == (tp & btnType[i])) {
                        $bgp.append(n);
                    }
                });
            } else {
                var $bgp = $ok;
            }
            return $bgp;
        }

        function creatPopId() {
            var i = "pop_" + (new Date()).getTime() + parseInt(Math.random() * 100000);
            if (d("#" + i).length > 0) {
                return creatPopId();
            } else {
                return i;
            }
        }
    };

});
