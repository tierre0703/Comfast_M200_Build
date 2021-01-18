
//请注意修改别改错了
/*
//路由类型，分别为 panabit ros wayos ikuai
//对应派网流控，MikroTik_RouterOS 维盟 爱快这四个路由
//routetype

//模板文件夹名
//pathname

//页面title标题名
//title

//联系电话，弹出提示，
//phone 只提示，提示完后下一步手机能直接拔打phone_call
//phone_call能被手机直接拔打，请只留一个完整电话。
//phone
//phone_call

//联系地址，弹出提示
//address

//radius的IP或域名，如果是域名不要加http://也不要用/结尾
//radiusip

//radius的域名，如果是域名不要加http://也不要用/结尾
//这个目前只有PA需要设置，其余不需要。
//domain

//successhref 上线成功后的跳转网站
//successhref

//自动提交的等待时间，单位：秒
//time_out

//保存账号信息的时间，单位：小时，默认长期保存
//save_time

//注册新用户的NASID号
//nasid

//上线时如果检测到已经在线则踢下线，1开启，0不开启
//offline

//是否显示注册按钮
//registr_button_show

//登录按钮文本提示
//login_button_text

//用户注册按钮文本提示
//registr_button_text

*/

				
var routetype="ros";
var pathname="ros";
var title="连网认证系统";
var phone="13800138000";
var phone_call="13800138000";
var address="这家伙很懒还没有填地址";
var radiusip="6.6.6.101";
var domain="";
var successhref="http://hao.360.cn";
var time_out=5;
var save_time=24000;
var nasid="1";
var offline="1";
var registr_button_show=1;
var login_button_text="用户登录";
var registr_button_text="没有账号？立即注册";
























//==============以下值不用改，方便系统内置脚本识别类型==================
//随着网页显示的大小加大或减小登陆框的显示
function lf_dwidth(){
	try {
		if(document.body.scrollWidth>800){
			document.body.style.width="800px";
			document.getElementById("footer").style.width="800px";
		}else{
			document.body.style.width="100%";
			document.getElementById("footer").style.width="100%";
		}
	}catch(e){return 0;}
}
lf_dwidth();
$(window).resize(function(){lf_dwidth()});


if(!window.navigator.cookieEnabled){
   alert("Cookie不可用，苹果手机请点击设置，往下拉到Safari，阻止Cooke选项，选择始终允许！");
}
if(domain=="" && radiusip==""){
	radiusip=window.location.host;
}
if(domain=="") domain=radiusip;
if(radiusip=="") radiusip=domain;
document.title = title;

document.write("<link rel='stylesheet' type='text/css' href='css/main.css?time="+Date.parse(new Date())+"'>");
if(window.location.pathname.substr(-12)=="/server.html") document.write("<s"+"cript type='text/javascript' src='http://"+radiusip+"/lfradius/libs/portal/webjs.php?run=serverlist&nasid="+nasid+"&time="+Date.parse(new Date())+"'></scr"+"ipt>");
document.write("<s"+"cript type='text/javascript' src='http://"+radiusip+"/lfradius/libs/portal/webjs.php?run=setting&time="+Date.parse(new Date())+"'></scr"+"ipt>");
document.write("<s"+"cript type='text/javascript' src='js/content.js?time="+Date.parse(new Date())+"'></scr"+"ipt>");
document.write("<s"+"cript type='text/javascript' src='js/global.js?time="+Date.parse(new Date())+"'></scr"+"ipt>");
document.write("<s"+"cript type='text/javascript' src='js/route/"+routetype+".js?time="+Date.parse(new Date())+"'></scr"+"ipt>");