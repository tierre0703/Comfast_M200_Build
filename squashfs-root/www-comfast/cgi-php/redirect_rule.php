#!/usr/bin/php-cgi
<?php
$table_id_start = 330;

$table_suffix = "rt_pub";
$CONFIG_PATH = "/etc/config/pub_rule";

$method = !empty($_GET["method"]) ? $_GET["method"] : "";
$action = !empty($_GET["action"]) ? $_GET["action"] : "";


function get_vlan_iface()
{
    $cmd = "uci show vlan | grep ifname | cut -d . -f 2";
    $ret = shell_exec($cmd);
    $vlan_array = explode("\n", $ret);
    $vlans = array();
    foreach($vlan_array as $key=>$value)
    {
        $value = str_clean($value);
        if($value != "")
        {
            $vlan_data = array();
            //get ip
            $cmd = sprintf("uci get vlan.%s.ipaddr 2>/dev/null", $value);
            $ip = shell_exec($cmd);
            $ip = str_clean($ip);

            //get netmask
            $cmd = sprintf("uci get vlan.%s.netmask 2>/dev/null", $value);
            $netmask = shell_exec($cmd);
            $netmask =  str_clean($netmask);

            //get intervlan option
            $cmd = sprintf("uci get vlan.%s.intervlan 2>/dev/null", $value);
            $intervlan = shell_exec($cmd);
            $intervlan = str_clean($intervlan);
            $intervlan = $intervlan;
 
            $vlan_data["vlan_name"] = $value;
            $vlan_data["vlan_ip"] = $ip;
            $vlan_data["vlan_netmask"] = $netmask;
            $vlan_data["vlan_intervlan"] = $intervlan;
            $vlan_data["is_vlan"] = true;
            $vlans[] = $vlan_data;
        }
    }

    $cmd = sprintf("ubus list | grep network.interface.lan | cut -d . -f 3");
    $ret = shell_exec($cmd);
    $vlan_array = explode("\n", $ret);
    foreach($vlan_array as $key=>$value)
    {
        $value = str_clean($value);
        if($value != "")
        {
            $vlan_data = array();
            //get ip
            $cmd = sprintf("uci get network.%s.ipaddr 2>/dev/null", $value);
            $ip = shell_exec($cmd);
            $ip = str_clean($ip);

            //get netmask
            $cmd = sprintf("uci get network.%s.netmask 2>/dev/null", $value);
            $netmask = shell_exec($cmd);
            $netmask =  str_clean($netmask);

            //get intervlan option
            $cmd = sprintf("uci get network.%s.intervlan 2>/dev/null", $value);
            $intervlan = shell_exec($cmd);
            $intervlan = str_clean($intervlan);
            $intervlan = $intervlan;
 
            $vlan_data["vlan_name"] = $value;
            $vlan_data["vlan_ip"] = $ip;
            $vlan_data["vlan_netmask"] = $netmask;
            $vlan_data["vlan_intervlan"] = $intervlan;
            $vlan_data["is_vlan"] = false;
            $vlans[] = $vlan_data;
        }
    }
    

    return $vlans;
}

function str_clean($str)
{
	$remove_character = array("\n", "\r\n", "\r");
	$str = str_replace($remove_character , '', trim($str));
	return $str;
}

function ipv4Breakout ($ip_address, $ip_nmask) {
    $hosts = array();
    //convert ip addresses to long form
    $ip_address_long = ip2long($ip_address);
    $ip_nmask_long = ip2long($ip_nmask);

    //caculate network address
    $ip_net = $ip_address_long & $ip_nmask_long;
/*
    //caculate first usable address
    $ip_host_first = ((~$ip_nmask_long) & $ip_address_long);
    $ip_first = ($ip_address_long ^ $ip_host_first) + 1;

    //caculate last usable address
    $ip_broadcast_invert = ~$ip_nmask_long;
    $ip_last = ($ip_address_long | $ip_broadcast_invert) - 1;

    //caculate broadcast address
    $ip_broadcast = $ip_address_long | $ip_broadcast_invert;

    foreach (range($ip_first, $ip_last) as $ip) {
            array_push($hosts, $ip);
    }
    */
    $cidr = mask2cidr($ip_nmask);
    $cidr_addr = long2ip($ip_net) . "/" . $cidr;


    $block_info = array("network" => "$ip_net",
//            "first_host" => "$ip_first",
//            "last_host" => "$ip_last",
//            "broadcast" => "$ip_broadcast",
            "cidr" => "$cidr_addr" //,
//            $hosts
        );

    return $block_info;
}

function mask2cidr($mask){
    $long = ip2long($mask);
    $base = ip2long('255.255.255.255');
    return 32-log(($long ^ $base)+1,2);
    /* xor-ing will give you the inverse mask,
        log base 2 of that +1 will return the number
        of bits that are off in the mask and subtracting
        from 32 gets you the cidr notation */
}

function parse_ip_list($ipAddr) {
	$retVal = array();
	$ip_list = explode(",", $ipAddr);
	foreach($ip_list as $k=>$ip) {
		if(strpos($ip, "-") >= -1) {
			//this is ip range
			$ips = explode("-", $ip);
			$start_ip = $ips[0];
			$end_ip = $ips[1];
			
			$start_numip = ip2long($start_ip);
			$end_numip = ip2long($end_ip);
			for($i = $start_numip; $i < $end_numip; $i++) {
				
				$retVal[] = long2ip($i);	
			}
		}
		else if(strpos($ip, "/") >= -1 ) {
			$retVal[] = $ip;
		}
		else
		{
			$retVal[] = $ip;
		}
	}
	
	return $retVal;
}


function delete_ip_rule($subnet)
{
    $cmd = sprintf("ip rule show | grep rt_pub");
    if($subnet != false)
        $cmd = sprintf("ip rule show | grep rt_pub | grep %s", $subnet);

    $ret = shell_exec($cmd);

    $ret_arr = explode("\n", $ret);
    foreach($ret_arr as $key => $val)
    {
        $val = str_replace("\n", "", $val);
        $val = str_clean($val);
        $val = substr($val, strpos($val, "from "));
        if($val == "") continue;
        $cmd = sprintf("ip rule delete %s", $val);
       shell_exec($cmd);
    }
}
function delete_ip_route($subnet)
{
    $cmd = sprintf("ip route show table all | grep rt_pub");
    if($subnet != false)
        $cmd = sprintf("ip route show table all | grep rt_pub | grep %s", $subnet);
        
    $ret = shell_exec($cmd);
    $ret_arr = explode("\n", $ret);
    foreach($ret_arr as $key=>$val)
    {
        $val = str_replace("\n", "", $val);
        if($val == "") continue;
        $cmd = sprintf("ip route delete %s", $val);
        shell_exec($cmd);
        shell_exec("ip route flush cache");
    }
}


function handle_rttable(){
		$table = shell_exec("cat /etc/iproute2/rt_tables");
		$tables = explode("\n", $table);
		$mod_table = array();
		foreach($tables as $k=>$v){
			$v = str_clean($v);
			if(strstr($v, "rt_pub")){
			}
			else {
				$mod_table[] = $v;
			}
		}
		
		$t_str = implode("\n",$mod_table);
		file_put_contents("/etc/iproute2/rt_tables", $t_str);
		
}


function apply_rule(){
	//pre rule
	//get vlan 
	$vlans = get_vlan_iface();
	
	//set
	$table_name = "rt_pub"; //"inter" . $vlan_info["vlan_name"];
    $table_id = 330;  //+ intval(substr($vlan_info["vlan_name"], 4));
    //$cmd = sprintf("grep -q %s /etc/iproute2/rt_tables || echo %d %s >>/etc/iproute2/rt_tables", $table_name, $table_id, $table_name);
    //shell_exec($cmd);
	
	delete_ip_rule(false);
	delete_ip_route(false);
	handle_rttable();
    
    //set ip route
    //"etc/config/pub_rule"
    $cmd = "uci show pub_rule | grep target_ip | cut -d [ -f 2 | cut -d ] -f 1";
    $rules_str = shell_exec($cmd);
    $rules_idx = explode("\n", $rules_str);
    $index = 0;
    foreach($rules_idx as $k=>$idx) {
		$idx = str_clean($idx);
		if ($idx == "") continue;

		$cmd = sprintf("uci get pub_rule.@rule[%s].enable", $idx); $enable = shell_exec($cmd); $enable = str_clean($enable);
		if($enable != "1") continue;
		
		$cmd = sprintf("uci get pub_rule.@rule[%s].target_ip", $idx); $target_ip = shell_exec($cmd); $target_ip = str_clean($target_ip);
		$cmd = sprintf("uci get pub_rule.@rule[%s].source_ip", $idx); $source_ip = shell_exec($cmd); $source_ip = str_clean($source_ip);
		
		$cmd = sprintf("uci get pub_rule.@rule[%s].iface", $idx); $iface = shell_exec($cmd); $iface = str_clean($iface);
		
		$rt_table_name = sprintf("rt_pub_%d", $index);
		$rt_table_id = $table_id + $index;
		$cmd = sprintf("grep -q %s /etc/iproute2/rt_tables || echo %d %s >>/etc/iproute2/rt_tables", $rt_table_name, $rt_table_id, $rt_table_name);
		shell_exec($cmd);
		
		//set ip rule
		$ip_list = parse_ip_list($source_ip);
		foreach($ip_list as $ip_idx => $ip_val) {
			$cmd = sprintf("ip rule add from %s lookup %s", $ip_val, $rt_table_name);
			shell_exec($cmd);
		}

		
		
		$cmd = sprintf("ip route replace %s dev br-%s table %s", $target_ip, $iface, $rt_table_name); shell_exec($cmd);
		
		$index++;
	}
    
    
    shell_exec("ip route flush cache");
	
}

function get_conf() {
    $cmd = "uci show pub_rule | grep target_ip | cut -d [ -f 2 | cut -d ] -f 1";
    $rules_str = shell_exec($cmd);
    $rules_idx = explode("\n", $rules_str);
    $retdata = array();
    
    foreach($rules_idx as $k=>$idx) {
		$idx = str_clean($idx);
		if ($idx == "") continue;
		
		$cmd = sprintf("uci get pub_rule.@rule[%s].enable", $idx); $enable = shell_exec($cmd); $enable = str_clean($enable);
		$cmd = sprintf("uci get pub_rule.@rule[%s].target_ip", $idx); $target_ip = shell_exec($cmd); $target_ip = str_clean($target_ip);
		$cmd = sprintf("uci get pub_rule.@rule[%s].source_ip", $idx); $source_ip = shell_exec($cmd); $source_ip = str_clean($source_ip);
		$cmd = sprintf("uci get pub_rule.@rule[%s].iface", $idx); $iface = shell_exec($cmd); $iface = str_clean($iface);
		$cmd = sprintf("uci get pub_rule.@rule[%s].comment", $idx); $comment = shell_exec($cmd); $comment = str_clean($comment);
		
		$retdata[]= array(
				'real_num'=>$idx, 
				'target_ip'=>$target_ip,
				'src_ip'=>$source_ip,
				'iface'=>$iface,
				'enable'=>$enable,
				'comment'=>$comment
			);		
		
	}
	
	
	$cmd = "uci show pub_rule | grep src_ip | cut -d [ -f 2 | cut -d ] -f 1";
    $rules_str = shell_exec($cmd);
    $rules_idx = explode("\n", $rules_str);
    $retdata_src = array();
    
    foreach($rules_idx as $k=>$idx) {
		$idx = str_clean($idx);
		if ($idx == "") continue;
		
		$cmd = sprintf("uci get pub_rule.@src_rule[%s].enable", $idx); $enable = shell_exec($cmd); $enable = str_clean($enable);
		$cmd = sprintf("uci get pub_rule.@src_rule[%s].src_ip", $idx); $src_ip = shell_exec($cmd); $src_ip = str_clean($src_ip);
		$cmd = sprintf("uci get pub_rule.@src_rule[%s].comment", $idx); $comment = shell_exec($cmd); $comment = str_clean($comment);
		
		$retdata_src[]= array(
				'real_num'=>$idx, 
				'src_ip'=>$src_ip,
				'enable'=>$enable,
				'comment'=>$comment
			);		
		
	}
	
	$ret = array("target_rule"=>$retdata, "src_rule"=>$retdata_src);

	return $ret;
}


if ($method == "GET" ) {
	if($action == "get_rule") {
		$retdata = get_conf();
		
		header("Content-Type: application/json");
		echo json_encode($retdata);
	}

}
else if($method == "SET") {
	if($action == "apply_rule") {
		apply_rule();
	}
	else if($action == "save_conf_src") {
		$post_data = json_decode(file_get_contents('php://input', true), true);
		$action = isset($post_data["action"]) ? $post_data["action"] : "";
		$real_num = isset($post_data["real_num"]) ? $post_data["real_num"]: "";
		$src_ip = isset($post_data["src_ip"]) ? $post_data["src_ip"] : "";
		$enable = isset($post_data["enable"]) ?$post_data["enable"] : "";
		$comment = isset($post_data["comment"]) ? $post_data["comment"]: "";
		
		if($action == "add") {		
			$cmd = "uci add pub_rule src_rule"; shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@src_rule[-1].src_ip='%s'", $src_ip); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@src_rule[-1].enable=%s", $enable); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@src_rule[-1].comment='%s'", $comment); shell_exec($cmd);
			
			$cmd = "uci commit pub_rule"; shell_exec($cmd);
		}
		else if($action == "del") {
			$del_list_str = isset($post_data["del_list"]) ? $post_data["del_list"] : "";
			$del_list = explode(",", $del_list_str);
			foreach($del_list as $i=>$del_id)
			{
				$real_num= $del_id;
				$real_num = str_clean($real_num);
				if($real_num == "") continue;
				$cmd = sprintf("uci delete pub_rule.@src_rule[%s].src_ip", $real_num); shell_exec($cmd);
				$cmd = sprintf("uci delete pub_rule.@src_rule[%s].enable", $real_num); shell_exec($cmd);
				$cmd = sprintf("uci delete pub_rule.@src_rule[%s].comment", $real_num); shell_exec($cmd);
				$cmd = sprintf("uci delete pub_rule.@src_rule[%s]", $real_num); shell_exec($cmd);
				
			}
			$cmd = "uci commit pub_rule"; shell_exec($cmd);
		}
		else if($action == "edit") {
			$cmd = sprintf("uci set pub_rule.@src_rule[%s].src_ip='%s'", $real_num, $src_ip); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@src_rule[%s].enable=%s", $real_num, $enable); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@src_rule[%s].comment='%s'", $real_num, $comment); shell_exec($cmd);
			$cmd = "uci commit pub_rule"; shell_exec($cmd);
		}
		shell_exec("/etc/route_rewrited");
		//apply_rule();
		header("Content-Type: application/json");
        echo json_encode(array("errCode"=>0));
		
	}
	else if($action == "save_conf") {
		$post_data = json_decode(file_get_contents('php://input', true), true);
		$action = isset($post_data["action"]) ? $post_data["action"] : "";
		$real_num = isset($post_data["real_num"]) ? $post_data["real_num"]: "";
		$target_ip = isset($post_data["target_ip"]) ? $post_data["target_ip"] : "";
		$source_ip = isset($post_data["source_ip"]) ? $post_data["source_ip"] : "";
		$enable = isset($post_data["enable"]) ?$post_data["enable"] : "";
		$comment = isset($post_data["comment"]) ? $post_data["comment"]: "";
		$iface = isset($post_data["iface"]) ? $post_data["iface"] : "";
		
		if($action == "add") {		
			$cmd = "uci add pub_rule rule"; shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[-1].target_ip='%s'", $target_ip); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[-1].source_ip='%s'", $source_ip); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[-1].iface='%s'", $iface); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[-1].enable=%s", $enable); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[-1].comment='%s'", $comment); shell_exec($cmd);
			
			$cmd = "uci commit pub_rule"; shell_exec($cmd);
		}
		else if($action == "del") {
			$del_list_str = isset($post_data["del_list"]) ? $post_data["del_list"] : "";
			$del_list = explode(",", $del_list_str);
			foreach($del_list as $i=>$del_id)
			{
				$real_num= $del_id;
				$real_num = str_clean($real_num);
				if($real_num == "") continue;
				$cmd = sprintf("uci delete pub_rule.@rule[%s].target_ip", $real_num); shell_exec($cmd);
				$cmd = sprintf("uci delete pub_rule.@rule[%s].source_ip", $real_num); shell_exec($cmd);
				$cmd = sprintf("uci delete pub_rule.@rule[%s].iface", $real_num); shell_exec($cmd);
				$cmd = sprintf("uci delete pub_rule.@rule[%s].enable", $real_num); shell_exec($cmd);
				$cmd = sprintf("uci delete pub_rule.@rule[%s].comment", $real_num); shell_exec($cmd);
				$cmd = sprintf("uci delete pub_rule.@rule[%s]", $real_num); shell_exec($cmd);
				
			}
			$cmd = "uci commit pub_rule"; shell_exec($cmd);
			
		}
		else if($action == "edit") {
			$cmd = sprintf("uci set pub_rule.@rule[%s].target_ip='%s'", $real_num, $target_ip); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[%s].source_ip='%s'", $real_num, $source_ip); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[%s].iface='%s'", $real_num, $iface); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[%s].enable=%s", $real_num, $enable); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[%s].comment='%s'", $real_num, $comment); shell_exec($cmd);
			$cmd = "uci commit pub_rule"; shell_exec($cmd);
		}
		
		apply_rule();
		header("Content-Type: application/json");
        echo json_encode(array("errCode"=>0));
	}
}

?>
