<?php
error_reporting(0);
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
			
			$cmd = sprintf("uci get network.%s.wanhostname 2>/dev/null", $wan);
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
		
		$hostname = shell_exec("uci get system.@system[0].hostname 2>/dev/null");
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
		
	} else if($action=="clear_log")
	{
		shell_exec("/etc/init.d/log restart > /dev/null &");
	}
	else if($action == "enable_iface") {
		$post_data = json_decode(file_get_contents('php://input', true), true);
		$iface = $post_data['iface'];
		$enable = $post_data['enable'];
		if($iface != "")
		{
			//save
			$cmd = sprintf("uci set network.%s.benabled=%s", $iface, $enable);
			shell_exec($cmd);
			shell_exec("uci commit network");
			
			//get status
			
			$cmd = sprintf("ubus call network.interface.%s status", $iface);
			$data = shell_exec($cmd);
			$ubus_data = json_decode($data, true);
			
			if(array_key_exists("up", $ubus_data))
			{
				$up_status = $ubus_data['up'];
				
				echo $up_status;
				
				
				if($up_status == true && $enable == 0)
				{
					$cmd = sprintf("ubus call network.interface.%s down", $iface);
					shell_exec($cmd);
				}
				else if($up_status == false && $enable == 1) {
					$cmd = sprintf("ubus call network.interface.%s up", $iface);
					
					shell_exec($cmd);
				
				}
				shell_exec("sleep 5;");
			}
			
			/*
			$str_enable = "up";
			if($enable == 0) {
				$str_enable = "down";
			}
			
			$cmd = sprintf("ubus call network.interface.%s %s > /dev/null &", $iface, $str_enable);
			shell_exec($cmd);
			*/
			
		}
		
		
			
			
			
		$retdata = array('errCode'=>0);
		header("Content-Type: application/json");
		echo json_encode($retdata);
	}
	else if($action == "enable_ifaces") {
		$cmd = sprintf("uci show network | grep =interface | cut -d . -f 2 | cut -d = -f 1");
		$interfaces = shell_exec($cmd);
		$ifaces = explode("\n", $interfaces);
		foreach($ifaces as $k=>$v) {
			$v = str_clean($v);
			if(strpos($v, "lan") >= -1 || strpos($v, "wan") >= -1) {
				$cmd = sprintf("uci get network.%s.benabled", $v);
				$benabled = shell_exec($cmd);
				$benabled = str_clean($benabled);
				if($benabled == "") continue;
				$benabled = intval($benabled);
				
				$cmd = sprintf("ubus call network.interface.%s status", $v);
				$data = shell_exec($cmd);
				$ubus_data = json_decode($data, true);
			
				if(array_key_exists("up", $ubus_data))
				{
					$up_status = $ubus_data['up'];
					if($up_status == true && $benabled == 0)
					{
						$cmd = sprintf("ubus call network.interface.%s down", $v);
						echo $cmd;
						shell_exec($cmd);
					}
					else if($up_status == false && $benabled == 1) {
						$cmd = sprintf("ubus call network.interface.%s up", $v);
						echo $cmd;
						shell_exec($cmd);
					}
				}
			}
		}
		
		echo "enabling interfaces done";
	}

}


?>
