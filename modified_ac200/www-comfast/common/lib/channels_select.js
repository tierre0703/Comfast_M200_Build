define(function (a, b) {
    var d = a("jquery");
    var channel_24g = [
        {type: '2', name: 'no_config', value: '255'},
        {type: '1', name: 'auto', value: '0'},
        {type: '1', name: '1', value: '1'},
        {type: '1', name: '2', value: '2'},
        {type: '1', name: '3', value: '3'},
        {type: '1', name: '4', value: '4'},
        {type: '1', name: '5', value: '5'},
        {type: '1', name: '6', value: '6'},
        {type: '1', name: '7', value: '7'},
        {type: '1', name: '8', value: '8'},
        {type: '1', name: '9', value: '9'},
        {type: '1', name: '10', value: '10'},
        {type: '1', name: '11', value: '11'},
        {type: '1', name: '12', value: '12'},
        {type: '1', name: '13', value: '13'}
    ];
    var channel_58g = [
        {type: '2', name: 'no_config', value: '255'},
        {type: '1', name: 'auto', value: '0'},
        {type: '1', name: '36', value: '36'},
        {type: '1', name: '40', value: '40'},
        {type: '1', name: '44', value: '44'},
        {type: '1', name: '48', value: '48'},
        {type: '1', name: '52', value: '52'},
        {type: '1', name: '56', value: '56'},
        {type: '1', name: '60', value: '60'},
        {type: '1', name: '64', value: '64'},
        {type: '1', name: '100', value: '100'},
        {type: '1', name: '104', value: '104'},
        {type: '1', name: '108', value: '108'},
        {type: '1', name: '112', value: '112'},
        {type: '1', name: '116', value: '116'},
        {type: '1', name: '120', value: '120'},
        {type: '1', name: '124', value: '124'},
        {type: '1', name: '128', value: '128'},
        {type: '1', name: '132', value: '132'},
        {type: '1', name: '136', value: '136'},
        {type: '1', name: '140', value: '140'},
        {type: '1', name: '149', value: '149'},
        {type: '1', name: '153', value: '153'},
        {type: '1', name: '157', value: '157'},
        {type: '1', name: '161', value: '161'},
        {type: '1', name: '165', value: '165'}
    ];
    var channel_58g_11a = [
        {type: '2', name: 'no_config', value: '255'},
        {type: '1', name: 'auto', value: '0'},
        {type: '1', name: '36', value: '36'},
        {type: '1', name: '40', value: '40'},
        {type: '1', name: '44', value: '44'},
        {type: '1', name: '48', value: '48'},
        {type: '1', name: '52', value: '52'},
        {type: '1', name: '56', value: '56'},
        {type: '1', name: '60', value: '60'},
        {type: '1', name: '64', value: '64'},
        {type: '1', name: '149', value: '149'},
        {type: '1', name: '153', value: '153'},
        {type: '1', name: '157', value: '157'},
        {type: '1', name: '161', value: '161'},
        {type: '1', name: '165', value: '165'}
    ];

    var Global_HT20 = "HT20";
    var Global_HT40 = "HT40";
    var Global_HT80 = "VHT80";
    var htmode_24g = [Global_HT20, Global_HT40];
    var htmode_58g = [Global_HT20, Global_HT40, Global_HT80];

    function append_channel(country, channel, freq, htmode, noht80, type) {
        var content_HTML = "";
        d("#channels_" + freq).empty();
        if (freq == "58g") {
            if (noht80 == 1) {
                if (country == "CN") {
                    d.each(channel_58g_11a, function (n, m) {
                        if (type == 1 && n == 0) {
                            return true;
                        }
                        content_HTML += channel_option(m, channel);
                    });
                } else if (country == "US") {
                    d.each(channel_58g_11a, function (n, m) {
                        if (type == 1 && n == 0) {
                            return true;
                        }
                        content_HTML += channel_option(m, channel);
                    });
                } else if (country == "GB") {
                    d.each(channel_58g_11a, function (n, m) {
                        if (type == 1 && n == 0) {
                            return true;
                        }
                        if (n < 10) {
                            content_HTML += channel_option(m, channel);
                        }
                    });
                }
            } else {
                if (country == "CN") {
                    d.each(channel_58g_11a, function (n, m) {
                        if (type == 1 && n == 0) {
                            return true;
                        }
                        content_HTML += channel_option(m, channel);
                    });
                } else if (country == "US") {
                    d.each(channel_58g, function (n, m) {
                        if (type == 1 && n == 0) {
                            return true;
                        }
                        content_HTML += channel_option(m, channel);
                    });
                } else if (country == "GB") {
                    d.each(channel_58g, function (n, m) {
                        if (type == 1 && n == 0) {
                            return true;
                        }
                        if (htmode == Global_HT20 && n < 21) {
                            content_HTML += channel_option(m, channel);
                        } else if (htmode != Global_HT20 && n < 18) {
                            content_HTML += channel_option(m, channel);
                        }
                    });
                }
            }

        } else if (freq == "24g") {
            if (country == "CN" || country == "GB") {
                d.each(channel_24g, function (n, m) {
                    if (type == 1 && n == 0) {
                        return true;
                    }
                    content_HTML += channel_option(m, channel);
                });
            } else if (country == "US") {
                d.each(channel_24g, function (n, m) {
                    if (type == 1 && n == 0) {
                        return true;
                    }
                    if (n < 13) {
                        content_HTML += channel_option(m, channel);
                    }
                });
            }
        }

        d("#channels_" + freq).html(content_HTML);
        if (freq == '58g' && htmode != Global_HT20) {
            d('#channel140').remove();
            d('#channel165').remove();
        }
    }

    function channel_option(obj, channel) {
        if (channel == obj.value && obj.type == 2) {
            return '<option value="' + obj.value + '" selected  id = "channel' + obj.value + '" sh_lang="' + obj.name + '">' + eval(obj.name) + "</option>";
        } else if (channel == obj.value && obj.type == 1) {
            return '<option value="' + obj.value + '" selected  id = "channel' + obj.value + '">' + obj.name + "</option>";
        } else if (channel != obj.value && obj.type == 2) {
            return '<option value="' + obj.value + '" id = "channel' + obj.value + '" sh_lang="' + obj.name + '">' + eval(obj.name) + "</option>";
        } else {
            return '<option value="' + obj.value + '" id = "channel' + obj.value + '">' + obj.name + "</option>";
        }
    }

    function append_htmode(mode, freq, noht80) {
        var content_HTML = "";
        var index;
        if (freq == "24g") {
            for (index = 0; index < htmode_24g.length; index++) {
                if (mode != htmode_24g[index]) {
                    content_HTML += '<option value="' + htmode_24g[index] + '">' + htmode_24g[index].split("HT")[1] + 'MHz</option>';
                } else {
                    content_HTML += '<option value="' + htmode_24g[index] + '" selected>' + htmode_24g[index].split("HT")[1] + 'MHz</option>';
                }
            }
        } else if (freq == "58g") {
            if (noht80 && htmode_58g.length > 2) {
                htmode_58g.splice(jQuery.inArray('b', htmode_58g), 1);
            }
            for (index = 0; index < htmode_58g.length; index++) {
                if (mode != htmode_58g[index]) {
                    content_HTML += '<option value="' + htmode_58g[index] + '">' + htmode_58g[index].split("HT")[1] + 'MHz</option>';
                } else {
                    content_HTML += '<option value="' + htmode_58g[index] + '" selected>' + htmode_58g[index].split("HT")[1] + 'MHz</option>';
                }
            }
        }
        d("#bandwidth_" + freq).html(content_HTML);
    }

    b.append_channel = append_channel;
    b.append_htmode = append_htmode;
});
