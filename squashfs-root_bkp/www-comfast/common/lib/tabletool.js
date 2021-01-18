define(function () {
    return function (jquery) {
        (function (window, document, undefined) {
            var factory = function ($, DataTable) {
                "use strict";
                /* Set the defaults for DataTables initialisation */
                $.extend(true, DataTable.defaults, {
                    dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
                    "<'row'<'table-respon'tr>>" +
                    "<'row clearfix'<'col-sm-0'i><'col-sm-12'p>>",
                    renderer: 'bootstrap'
                });


                /* Default class modification */
                $.extend(DataTable.ext.classes, {
                    sWrapper: "dataTables_wrapper form-inline dt-bootstrap",
                    sFilterInput: "form-control input-sm",
                    sLengthSelect: "form-control input-sm"
                });

                /* Bootstrap paging button renderer */
                DataTable.ext.renderer.pageButton.bootstrap = function (settings, host, idx, buttons, page, pages) {
                    var api = new DataTable.Api(settings);
                    var classes = settings.oClasses;
                    var lang = settings.oLanguage.oPaginate;
                    var btnDisplay, btnClass, counter = 0;

                    var attach = function (container, buttons) {
                        var i, ien, node, button;
                        var clickHandler = function (e) {
                            e.preventDefault();
                            if (!$(e.currentTarget).hasClass('disabled')) {
                                api.page(e.data.action).draw(false);
                            }
                        };

                        for (i = 0, ien = buttons.length; i < ien; i++) {
                            button = buttons[i];

                            if ($.isArray(button)) {
                                attach(container, button);
                            }
                            else {
                                btnDisplay = '';
                                btnClass = '';

                                switch (button) {
                                    case 'ellipsis':
                                        btnDisplay = '&hellip;';
                                        btnClass = 'disabled';
                                        break;

                                    case 'first':
                                        btnDisplay = lang.sFirst;
                                        btnClass = button + (page > 0 ?
                                                '' : ' disabled');
                                        break;

                                    case 'previous':
                                        btnDisplay = lang.sPrevious;
                                        btnClass = button + (page > 0 ?
                                                '' : ' disabled');
                                        break;

                                    case 'next':
                                        btnDisplay = lang.sNext;
                                        btnClass = button + (page < pages - 1 ?
                                                '' : ' disabled');
                                        break;

                                    case 'last':
                                        btnDisplay = lang.sLast;
                                        btnClass = button + (page < pages - 1 ?
                                                '' : ' disabled');
                                        break;

                                    default:
                                        btnDisplay = button + 1;
                                        btnClass = page === button ?
                                            'active' : '';
                                        break;
                                }

                                if (btnDisplay) {
                                    node = $('<li>', {
                                        'class': classes.sPageButton + ' ' + btnClass,
                                        'id': idx === 0 && typeof button === 'string' ?
                                        settings.sTableId + '_' + button :
                                            null
                                    })
                                        .append($('<a>', {
                                                'href': '#',
                                                'aria-controls': settings.sTableId,
                                                'data-dt-idx': counter,
                                                'tabindex': settings.iTabIndex
                                            })
                                                .html(btnDisplay)
                                        )
                                        .appendTo(container);

                                    settings.oApi._fnBindAction(
                                        node, {action: button}, clickHandler
                                    );

                                    counter++;
                                }
                            }
                        }
                    };

                    var activeEl;

                    try {
                        activeEl = $(document.activeElement).data('dt-idx');
                    }
                    catch (e) {
                    }

                    attach(
                        $(host).empty().html('<ul class="pagination"/>').children('ul'),
                        buttons
                    );

                    if (activeEl) {
                        $(host).find('[data-dt-idx=' + activeEl + ']').focus();
                    }
                };

                if (DataTable.TableTools) {
                    $.extend(true, DataTable.TableTools.classes, {
                        "container": "DTTT btn-group",
                        "buttons": {
                            "normal": "btn btn-default",
                            "disabled": "disabled"
                        },
                        "collection": {
                            "container": "DTTT_dropdown dropdown-menu",
                            "buttons": {
                                "normal": "",
                                "disabled": "disabled"
                            }
                        },
                        "print": {
                            "info": "DTTT_print_info"
                        },
                        "select": {
                            "row": "active"
                        }
                    });

                    $.extend(true, DataTable.TableTools.DEFAULTS.oTags, {
                        "collection": {
                            "container": "ul",
                            "button": "li",
                            "liner": "a"
                        }
                    });

                }

            }; // /factory

            jQuery.fn.dataTable.ext.type.order['traffic-pre'] = function (data) {
                var units = data.split(" ")[1].toUpperCase();
                var multiplier = 1;

                if (units == 'KB') {
                    multiplier = 1024;
                } else if (units == 'MB') {
                    multiplier = 1024 * 1024;
                } else if (units == 'GB') {
                    multiplier = 1024 * 1024 * 1024;
                } else if (units == 'TB') {
                    multiplier = 1024 * 1024 * 1024 * 1024;
                } else if (units == 'PB') {
                    multiplier = 1024 * 1024 * 1024 * 1024 * 1024;
                } else if (units == 'EB') {
                    multiplier = 1024 * 1024 * 1024 * 1024 * 1024 * 1024;
                } else if (units == 'ZB') {
                    multiplier = 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024;
                } else if (units == 'YB') {
                    multiplier = 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024;
                }
                return - parseFloat(data) * multiplier;
            };

            jQuery.fn.dataTable.ext.type.order['ip-pre'] = function (data) {
                var num = 0;
                if (data == "") {
                    return num;
                }
                var aNum = data.split(".");
                if (aNum.length != 4) {
                    return num;
                }
                num += parseInt(aNum[0]) << 24;
                num += parseInt(aNum[1]) << 16;
                num += parseInt(aNum[2]) << 8;
                num += parseInt(aNum[3]) << 0;
                num = num >>> 0;
                return num;
            };

            // Define as an AMD module if possible
            if (typeof define === 'function' && define.amd) {
                define(['jquery', 'datatables'], factory);
            }
            else if (typeof exports === 'object') {
                // Node/CommonJS
                factory(require('jquery'), require('datatables'));
            }
            else if (jQuery) {
                // Otherwise simply initialise as normal, stopping multiple evaluation
                factory(jQuery, jQuery.fn.dataTable);
            }

        })(window, document);
    }
})