<?php

error_reporting(0);

function str_clean($str)
 {
    $remove_character = array("\n", "\r\n", "\r");
    $str = str_replace($remove_character , '', trim($str));
     return $str;
 }


function rearrange_qos(){
	$QOS_CONFIG = "/etc/config/common";
	
	$list_str = shell_exec("uci get common.limitlist.list 2>/dev/null");
	$list = explode(",", $list_str);
	
	$total_num = 0;
	
	$index =  0;
	
	$real_nums = array();
	
	$qos_conf = array();
	
	foreach($list as $key=>$val) {
		$val = str_clean($val);
		if($val == "") continue;
		
		if($index == 0) $total_num = intval($val);
		else $real_nums[] = intval($val);
		
		$index = $index + 1;
	}

	
	//scan 
	
	foreach($real_nums as $key=>$num) {
			
		//option enable '1'
		//option ip '192.168.107.1-192.168.107.254'
		//option share '0'
		//option downrate '10000'
		//option uprate '10000'
		
		$cmd = sprintf("uci get common.limit_%d.enable 2>/dev/null", $num); 
		$enable = shell_exec($cmd); $enable = str_clean($enable);

		$cmd = sprintf("uci get common.limit_%d.ip 2>/dev/null", $num); 
		$ip = shell_exec($cmd); $ip = str_clean($ip);
		
		$single_ip = true;
		if(strpos($ip, "-") >= -1) $single_ip = false;

		$cmd = sprintf("uci get common.limit_%d.share 2>/dev/null", $num); 
		$share = shell_exec($cmd); $share = str_clean($share);

		$cmd = sprintf("uci get common.limit_%d.downrate 2>/dev/null", $num); 
		$downrate = shell_exec($cmd); $downrate = str_clean($downrate);

		$cmd = sprintf("uci get common.limit_%d.uprate 2>/dev/null", $num); 
		$uprate = shell_exec($cmd); $uprate = str_clean($uprate);
		
		$cmd = sprintf("uci get common.limit_%d.comment 2>/dev/null", $num);
		$comment = shell_exec($cmd); $comment = str_clean($comment);
		
		$qos_conf[] = array('real_num'=>$num, 'enable'=>$enable, 'ip'=>$ip, 'share'=>$share, 'downrate'=>$downrate, 'uprate'=>$uprate, 'comment'=>$comment, 'single_ip'=>$single_ip);
	}
	
	
	// arrange
	//single_ip
	$real_index = 0;
	foreach($qos_conf as $key=>$conf) {
		if($conf['single_ip'] == false) continue;
		
		$qos_conf[$key]['real_num'] = $real_nums[$real_index];
		$real_index++;
	}
	
	foreach($qos_conf as $key=>$conf) {
		if($conf['single_ip'] == true) continue;
		$qos_conf[$key]['real_num'] = $real_nums[$real_index];
		$real_index++;
	}
	

	
	//SET
	foreach($qos_conf as $key=>$conf) {
		$num = $conf['real_num'];
		$cmd = sprintf("uci set common.limit_%d=rule", $num); shell_exec($cmd);
		$cmd = sprintf("uci set common.limit_%d.ip='%s'", $num, $conf['ip']); shell_exec($cmd);
		$cmd = sprintf("uci set common.limit_%d.enable='%s'", $num, $conf['enable']); shell_exec($cmd);
		$cmd = sprintf("uci set common.limit_%d.share='%s'", $num, $conf['share']); shell_exec($cmd);
		$cmd = sprintf("uci set common.limit_%d.downrate='%s'", $num, $conf['downrate']); shell_exec($cmd);
		$cmd = sprintf("uci set common.limit_%d.uprate='%s'", $num, $conf['uprate']); shell_exec($cmd);
		$cmd = sprintf("uci set common.limit_%d.comment='%s'", $num, $conf['comment']); shell_exec($cmd);
	}
	
	shell_exec("uci commit common");
	
	//shell_exec("/etc/init.d/customqos restart > /dev/null 2>&1 &");
	
}
$method = !empty($_GET["method"]) ? $_GET["method"] : "";
$action = !empty($_GET["action"]) ? $_GET["action"] : "";

if($action == "arrange") {
	rearrange_qos();
}
else if($action == "set") {
	//parse post data
	$post_data = json_decode(file_get_contents('php://input', true), true);
	$operate = $post_data['operate'];
	if(empty($post_data['ip']) || $post_data['ip'] == "") {
		header("Content-Type: application/json");
		$response = array("errCode"=>0);
		echo json_encode($response);
		exit();
	}
	if($operate == 'add') {
		$real_num = 0;
		
		$list_str = shell_exec("uci get common.limitlist.list 2>/dev/null");
		$list = explode(",", $list_str);
	
		$total_num = 0;
		$real_nums = array();
		$index = 0;
		
		foreach($list as $key=>$val) {
			$val = str_clean($val);
			if($val == "") continue;
			
			if($index == 0) $total_num = intval($val);
			else $real_nums[] = intval($val);
			$index = $index + 1;
		}
		
		if(count($real_nums) == 0)
		{
			$real_num = 1;
			$real_nums[] = $real_num;
			$total_num = 1;
		}
		else
		{
			$real_num = $real_nums[count($real_nums) - 1] + 1;
			$real_nums[] = $real_num;
			$total_num = count($real_nums);
		}
		
		
		$cmd = sprintf("uci set common.limit_%d=rule", $real_num); shell_exec($cmd);
		//if(!empty($post_data['comment'])) {
				$cmd = sprintf("uci set common.limit_%s.comment='%s'", $real_num, $post_data['comment']); shell_exec($cmd);
		//}
		//if(!empty($post_data['uprate'])) {
				$cmd = sprintf("uci set common.limit_%s.uprate='%s'", $real_num, $post_data['uprate']); shell_exec($cmd);
		//}
		//if(!empty($post_data['downrate'])) {
				$cmd = sprintf("uci set common.limit_%s.downrate='%s'", $real_num, $post_data['downrate']); shell_exec($cmd);
		//}
		//if(!empty($post_data["share"])) {
				$cmd = sprintf("uci set common.limit_%s.share='%s'", $real_num, $post_data["share"]); shell_exec($cmd);
		//}

		//if(!empty($post_data['enable'])) {
				$cmd = sprintf("uci set common.limit_%s.enable='%s'", $real_num, $post_data['enable']); shell_exec($cmd);
		//}
		//if(!empty($post_data['ip'])) {
				$cmd = sprintf("uci set common.limit_%s.ip='%s'", $real_num, $post_data['ip']); shell_exec($cmd);
		//}
		
		//update list
		$limit_list = sprintf("%d,%s,", $total_num, implode(",", $real_nums));
		$cmd = sprintf("uci set common.limitlist.list='%s'", $limit_list);
		shell_exec($cmd);
		
	}
	else if($operate == 'edit') {
		$real_num = $post_data['real_num'];
		//if(!empty($post_data['comment'])) {
				$cmd = sprintf("uci set common.limit_%s.comment='%s'", $real_num, $post_data['comment']); shell_exec($cmd);
		//}
		//if(!empty($post_data['uprate'])) {
				$cmd = sprintf("uci set common.limit_%s.uprate='%s'", $real_num, $post_data['uprate']); shell_exec($cmd);
		//}
		//if(!empty($post_data['downrate'])) {
				$cmd = sprintf("uci set common.limit_%s.downrate='%s'", $real_num, $post_data['downrate']); shell_exec($cmd);
		//}
		//if(!empty($post_data["share"])) {
				$cmd = sprintf("uci set common.limit_%s.share='%s'", $real_num, $post_data["share"]); shell_exec($cmd);
		//}
		//if(!empty($post_data['enable'])) {
				$cmd = sprintf("uci set common.limit_%s.enable='%s'", $real_num, $post_data['enable']); shell_exec($cmd);
		//}
		//if(!empty($post_data['ip'])) {
				$cmd = sprintf("uci set common.limit_%s.ip='%s'", $real_num, $post_data['ip']); shell_exec($cmd);
		//}
	}
	else if ($operate == 'del') {
		
		$real_num = $post_data['list'];
		$nums = explode(",", $real_num);
		
		
		
		foreach($nums as $k=>$num) {
			if($num == "") continue;
			$cmd = sprintf("uci delete common.limit_%s.comment 2>/dev/null", $num); shell_exec($cmd);
			$cmd = sprintf("uci delete common.limit_%s.uprate 2>/dev/null", $num); shell_exec($cmd);
			$cmd = sprintf("uci delete common.limit_%s.downrate 2>/dev/null", $num); shell_exec($cmd);
			$cmd = sprintf("uci delete common.limit_%s.uprate 2>/dev/null", $num); shell_exec($cmd);
			$cmd = sprintf("uci delete common.limit_%s.share 2>/dev/null", $num); shell_exec($cmd);
			$cmd = sprintf("uci delete common.limit_%s.enable 2>/dev/null", $num); shell_exec($cmd);
			$cmd = sprintf("uci delete common.limit_%s.ip 2>/dev/null", $num); shell_exec($cmd);
			$cmd = sprintf("uci delete common.limit_%s 2>/dev/null", $num); shell_exec($cmd);
		}
		
		$total_num = 0;
		$real_nums = array();
		$index = 0;
		$list_str = shell_exec("uci get common.limitlist.list 2>/dev/null");
		$list = explode(",", $list_str);
		
		foreach($list as $key=>$val) {
			$val = str_clean($val);
			if($val == "") continue;
			
			if($index == 0) $total_num = intval($val);
			else{
				$bFound = false;
				foreach($nums as $k=>$num){
					if($num == $val)
					{
						$bFound = true;
						break;
					}
				}
				if($bFound == true) continue;
				$real_nums[] = intval($val);
			} 
			$index = $index + 1;
		}
		
		
		//update list
		$total_num = count($real_nums);
		$limit_list = sprintf("%d,%s,", $total_num, implode(",", $real_nums));
		$cmd = sprintf("uci set common.limitlist.list='%s'", $limit_list);
		shell_exec($cmd);

	}
	
	shell_exec('uci commit common');
	
	header("Content-Type: application/json");
	$response = array("errCode"=>0);
    echo json_encode($response);
	
}
else if ($action == "restart")
{
	shell_exec("/etc/init.d/customqos restart > /dev/null &");
	
	header("Content-Type: application/json");
	
	$response = array("errCode"=>0);
    echo json_encode($response);
}


?>
