define(function (a, b) {
    var d = a("jquery");

    function E(callback) {
        return function (b) {
            if (b.errCode == -32002) {
                location.href = 'http://' + location.host;
                return
            }
            callback(b)
        }
    }

    function F(data) {
        if (String(data) == '' || String(data) == 'undefined' || String(data) == 'true') {
            return true;
        } else {
            return false;
        }
    }
    
    function getSConfig(section, callback, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(callback),
            type: "POST",
            async: F(async),
            cache: false,
            url: "/cgi-bin/system-status?method=GET&section=" + section
        })
    }

	function getRRDData(rrdName, callback)
	{
		d.ajax({
			type: "GET",
			cache: false,
			dataType: 'text',
			success: E(callback),
			fail: E(function(){}),
			url: rrdName
		});
    }
    
    function getSHConfig(section, callback, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(callback),
            type: "GET",
            async: F(async),
            cache: false,
            url: "/cgi-php/" + section
        });
    }

    function setSConfig(section, data, callback, async) {
        d.ajax({
            contentType: "appliation/json",
            data: data ? JSON.stringify(data) : "{}",
            dataType: "json",
            success: E(callback),
            type: "POST",
            async: F(async),
            cache: false,
            url: "/cgi-bin/system-status?method=SET&section=" + section
        });
    }


   

    function setSHConfig(section, data, callback, async) {
        d.ajax({
            contentType: "appliation/json",
            data: data ? JSON.stringify(data) : "{}",
            dataType: "json",
            success: E(callback),
            type: "POST",
            async: F(async),
            cache: false,
            url: "/cgi-php/" + section
        })

    }

    function getMConfig(section, callback, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(callback),
            type: "POST",
            async: F(async),
            cache: false,
            url: "/cgi-bin/mbox-config?method=GET&section=" + section
        })
    }

    function setMConfig(section, data, callback, async) {
        d.ajax({
            contentType: "appliation/json",
            data: data ? JSON.stringify(data) : "{}",
            dataType: "json",
            success: E(callback),
            type: "POST",
            async: F(async),
            cache: false,
            url: "/cgi-bin/mbox-config?method=SET&section=" + section
        })
    }

    function login(data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: a,
            type: "POST",
            async: F(async),
            cache: false,
            url: "/cgi-bin/login"
        })
    }

    function logout(a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: a,
            type: "POST",
            async: F(async),
            cache: false,
            url: "/cgi-bin/logout"
        })
    }

    function getBackupFile() {

        var iframe = d('<iframe style="position:absolute;top:-9999px" ></iframe>').attr('name', 'backdown_iframe');
        var form = d('<form method="post" style="display:none;" enctype="multipart/form-data" />').attr('name', 'backdown_form');
        form.attr("target", 'backdown_iframe').attr('action', '/cgi-bin/mbox-config?method=GET&section=system_config_backup');

        iframe.appendTo("body");
        form.appendTo(iframe);
        form.submit();
    }

    /*
     *
     *
     *
     *
     *
     *
     * */
    function getScanList(data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: a,
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=wifi_scan"
        })
    }

    function getprobeserver(a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=probe_server"
        })
    }

    function setprobeserver(data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=probe_server"
        })
    }

    b.getSConfig = getSConfig;
    b.setSConfig = setSConfig;
    b.getMConfig = getMConfig;
    b.setMConfig = setMConfig;
    b.setSHConfig = setSHConfig;
    b.getSHConfig = getSHConfig;
	b.getRRDData = getRRDData;
    b.login = login;
    b.logout = logout;
    b.getBackupFile = getBackupFile;
    b.scanwifi = getScanList;
    b.getprobeserver = getprobeserver;
    b.setprobeserver = setprobeserver;
});