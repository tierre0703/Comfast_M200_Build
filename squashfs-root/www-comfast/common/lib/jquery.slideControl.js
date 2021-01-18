define(function(){
    return function(jquery){
        (function ($) {
            $.fn.slideControl = function (options) {
                // defaults
                var defaults = {
                    speed: 500,
                    upperBound: 10000
                };
                defaults.nows = options;
                defaults.length = (defaults.upperBound/defaults.speed);
                defaults.fill = (options/defaults.upperBound)*100;
                defaults.percent = 100/defaults.length;

                return this.each(function () {
                    var o = defaults;
                    var position = 0;
                    var obj = this;
                    var $parent_html ='';
                    $(this).addClass('slideControlInput');
                    var parent = $(this).parent();
                    $parent_html += "<i class=\"slideControlContainer\"><span class=\"nowspeed\" style='left: " + o.fill + "%;top: -18px;'>"+ (o.nows/1000) +"Km</span>";
                    $parent_html += '<i class="slideControlFill" style="width:' + o.fill + '%"></i>';
                    $parent_html +='<span class="slideHandle" style="left: ' + o.fill + '%"><i class="slideControlHandle"></i></span>';
                    $parent_html +='<div class="slidelabel">';
                    for (var i = 0;i <= defaults.length;i++){
                        $parent_html += '<label style="left:' + (o.percent*i) +'\%\"></label>';
                    }
                    $parent_html +='</div><input type="text" id="distance" value="' + o.nows + '" class="hide"></i>';
                    parent.html($parent_html + $(obj).wrap("<span></span>").html());
                    var containe = parent.find('.slideControlContainer');
                    var fill = containe.find('.slideControlFill');
                    var handle = containe.find('.slideHandle');
                    var notfill = containe.find('.notfill');
                    var slidelabel = containe.find('.slidelabel')
                    var nowspeed = containe.find('.nowspeed');
                    var distance = $('#distance');
                    var containerWidth = containe.outerWidth() + 1;
                    var handleWidth = $(handle).outerWidth();
                    var offset = $(containe).offset();
                    var animate = function (value) {
                        $(fill).animate({width: value + "%"}, o.speed);
                        $(handle).animate({left: value + '%'}, o.speed)
                    }

                    $(window).resize(function () {
                        offset = $(containe).offset();
                    })
                    if (getInternetExplorerVersion() < 9 && getInternetExplorerVersion() > -1) {
                        handle.addClass('ieShadow');
                    }
                    $(containe).click(function (e) {
                        e.preventDefault();
                        var offset = $(containe).offset();
                        var containerWidth = containe.outerWidth() + 1;
                        position = checkBoundaries((((e.pageX - offset.left + handleWidth / 2) / containerWidth) * 100).toFixed(2));
                        var nows = Math.round(position/o.percent);
                        var km = nows* o.speed/o.upperBound;
                        position = km *100;
                        var n = ($(fill).width() / containerWidth) * 100;
                        $(nowspeed).css({left: position + '%'}).html((km* o.upperBound)/1000+'Km');
                        distance.val(km* o.upperBound);
                        animate(position);
                    });

                    $(handle).mousedown(function (e) {
                        e.preventDefault();
                        $(document).on('mousemove', function (e) {
                            e.preventDefault();
                            var offset = $(containe).offset();
                            var containerWidth = containe.outerWidth() + 1;
                            position = checkBoundaries((((e.pageX - offset.left + handleWidth / 2) / containerWidth) * 100).toFixed(2));
                            var nows = Math.round(position/o.percent);
                            var km = nows* o.speed/o.upperBound;
                            position = km *100;
                            $(handle).css({left: position + '%'});
                            $(nowspeed).css({left: position + '%'})
                            $(fill).width(position + "%");
                            distance.val(km* o.upperBound);
                            $(nowspeed).html((km* o.upperBound)/1000+'Km');
                        });
                        $(document).mouseup(function () {
                            e.preventDefault();
                            $(this).off('mousemove');
                        })
                    });

                });
                function checkBoundaries(value) {
                    if (value > 100)
                        return 100;
                    else if (value < 0) {
                        return 0;
                    } else {
                        return value;
                    }
                }
                function getInternetExplorerVersion() {
                    var rv = -1;
                    if (navigator.appName == 'Microsoft Internet Explorer') {
                        var ua = navigator.userAgent;
                        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
                        if (re.exec(ua) != null)
                            rv = parseFloat(RegExp.$1);
                    }
                    return rv;
                }
                return this;
            }
        })(jQuery);
    }
})