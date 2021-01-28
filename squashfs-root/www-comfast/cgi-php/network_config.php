<?php

$method = !empty($_GET["method"]) ? $_GET["method"] : "";
$action = !empty($_GET["action"]) ? $_GET["action"] : "";


function str_clean($str)
{
    $remove_character = array("\n", "\r\n", "\r");
    $str = str_replace($remove_character , '', trim($str));
     return $str;
}




function get_interfaces() {
        $wan_list = array();
        $str_wans = shell_exec("ubus list | grep network.interface.wan | cut -d . -f 3");
        $wans = explode("\n", $str_wans);
        $interfaces = array();
        foreach($wans as $k=>$wan)
        {
			$wan = str_clean($wan);
			if($wan == "") continue;
			
			$cmd = sprintf("uci get network.%s.wanhostname", $wan);
			$hostname = shell_exec($cmd);
			$hostname = str_clean($hostname);
            $interfaces[] = array(
				'iface'=>$wan,
				'hostname'=>$hostname
            );			
		}
		
		return $interfaces;
} 
 
if($method == "GET") {
	
	if($action == "wan_info") {
		
		header("Content-Type: application/json");
		$retdata = get_interfaces();
		echo json_encode($retdata);
	}
	else if($action == "system_info")
	{
		header("Content-Type: application/json");
		
		$hostname = shell_exec("uci get system.@system[0].hostname");
		$hostname = str_clean($hostname);
		$retdata = array('hostname'=>$hostname);
		echo json_encode($retdata);
		
	}

}
else if($method == "SET") {
	if($action == "system_info") {
		$post_data = json_decode(file_get_contents('php://input', true), true);
		$hostname = $post_data['hostname'];
		
		$cmd = sprintf("uci set system.@system[0].hostname='%s'", $hostname); shell_exec($cmd);
		shell_exec("/etc/init.d/system restart > /dev/null &");

		$retdata = array('errCode'=>0);
		header("Content-Type: application/json");
		echo json_encode($retdata);
	}
	else if($action == "wan_info"){
		
		
		$post_data = json_decode(file_get_contents('php://input', true), true);
		$iface = $post_data['iface'];
		$hostname = $post_data['hostname'];
		
		$cmd = sprintf("uci set network.%s.wanhostname='%s'", $iface, $hostname);
		echo $cmd;
		shell_exec($cmd);
		shell_exec("uci commit network");

		$retdata = array('errCode'=>0);
		header("Content-Type: application/json");
		echo json_encode($retdata);
		
	} else if($action="clear_log")
	{
		shell_exec("/etc/init.d/log restart > /dev/null &");
	}

}


?>
