//本文件不需要修改
//转换地址栏参数，取页面内容
function lf_geturlstart(){
	try {
		var all_huaweivalue = new Object(); 
		all_huaweivalue = geturl_request();

		mac=all_huaweivalue['usrmac']//.replace(/-/g,":");
		user_ip=all_huaweivalue['usrip'];
		basip=all_huaweivalue['source-ip'];
		refer=all_huaweivalue['refer'];

		portal_url = document.location.href;
		portal_url = portal_url.substr(0,portal_url.lastIndexOf("?")+1);
		portal_url = portal_url.substr(0,portal_url.lastIndexOf("/")+1);

		document.forms['_userregistr'].usrmac.value=mac;
		document.forms['_userregistr'].usrip.value=user_ip;
		document.forms['_userregistr'].basip.value=basip;
		document.forms['_userregistr'].refer.value=refer;
		document.forms['_userregistr'].success.value=portal_url+"success.html";
		document.forms['_userregistr'].fail.value=portal_url+"fail.html";
		document.forms['_userregistr'].clear.value=portal_url+"clear.html";

		document.forms['_userregistr'].nasid.value=nasid;
		document.forms['_userregistr'].offline.value=offline;
	}catch (e) {
		return 0;
	}
}
lf_geturlstart();



















//变更表单提交地址
var submiturl="http://"+radiusip+"/lfradius/libs/portal/portalweb.php?router="+routetype+"&run=login";


document.write("<s"+"cript type='text/javascript' src='js/route/global_login.js?time="+Date.parse(new Date())+"'></scr"+"ipt>");