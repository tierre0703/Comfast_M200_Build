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


function apply_rule(){
	//pre rule
	//get vlan 
	$vlans = get_vlan_iface();
	
	//set
	$table_name = "rt_pub"; //"inter" . $vlan_info["vlan_name"];
    $table_id = 330;  //+ intval(substr($vlan_info["vlan_name"], 4));
    $cmd = sprintf("grep -q %s /etc/iproute2/rt_tables || echo %d %s >>/etc/iproute2/rt_tables", $table_name, $table_id, $table_name);
    shell_exec($cmd);
	
	delete_ip_rule(false);
	delete_ip_route(false);
	
	
	/** enable all vlan deleted
    foreach($vlans as $vlan_index => $vlan_info)
    {
    
        $vlan_ip = $vlan_info["vlan_ip"];
        $vlan_netmask = $vlan_info["vlan_netmask"];
        $vlan_name = $vlan_info["vlan_name"];
        $table_name = "rt_pub";

        if($vlan_name == "" ||  $vlan_ip == "" || $vlan_netmask == "")
        {
            continue;
        }

        $ip_info =  ipv4Breakout($vlan_info["vlan_ip"], $vlan_info["vlan_netmask"]);
        $cidr = $ip_info["cidr"];
        
        //setup ip rule
        $cmd = sprintf("ip rule add from %s lookup %s", $cidr, $table_name);
        shell_exec($cmd);

    }
    */
    
    //set ip route
    //"etc/config/pub_rule"
    $cmd = "uci show pub_rule | grep target_ip | cut -d [ -f 2 | cut -d ] -f 1";
    $rules_str = shell_exec($cmd);
    $rules_idx = explode("\n", $rules_str);
    foreach($rules_idx as $k=>$idx) {
		$idx = str_clean($idx);
		if ($idx == "") continue;

		$cmd = sprintf("uci get pub_rule.@rule[%s].enable", $idx); $enable = shell_exec($cmd); $enable = str_clean($enable);
		if($enable != "1") continue;
		
		$cmd = sprintf("uci get pub_rule.@rule[%s].target_ip", $idx); $target_ip = shell_exec($cmd); $target_ip = str_clean($target_ip);
		$cmd = sprintf("uci get pub_rule.@rule[%s].iface", $idx); $iface = shell_exec($cmd); $iface = str_clean($iface);
		
		$cmd = sprintf("ip route replace %s dev br-%s table rt_pub", $target_ip, $iface); shell_exec($cmd);
		
		
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
		$cmd = sprintf("uci get pub_rule.@rule[%s].iface", $idx); $iface = shell_exec($cmd); $iface = str_clean($iface);
		$cmd = sprintf("uci get pub_rule.@rule[%s].comment", $idx); $comment = shell_exec($cmd); $comment = str_clean($comment);
		
		$retdata[]= array(
				'real_num'=>$idx, 
				'target_ip'=>$target_ip,
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
		
		$cmd = sprintf("uci get pub_rule.@rule[%s].enable", $idx); $enable = shell_exec($cmd); $enable = str_clean($enable);
		$cmd = sprintf("uci get pub_rule.@rule[%s].src_ip", $idx); $src_ip = shell_exec($cmd); $src_ip = str_clean($src_ip);
		$cmd = sprintf("uci get pub_rule.@rule[%s].comment", $idx); $comment = shell_exec($cmd); $comment = str_clean($comment);
		
		$retdata_src[]= array(
				'real_num'=>$idx, 
				'src_ip'=>$src_ip,
				'enable'=>$enable,
				'comment'=>$comment
			);		
		
	}
	
	$ret = array("target_rule"=>$retdata, "src_rule"=>$retdata_src)

	return $retdata;
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
		$action = $post_data["action"];
		$real_num = $post_data["real_num"];
		$src_ip = $post_data["src_ip"];
		$enable = $post_data["enable"];
		$comment = $post_data["comment"];
		
		if($action == "add") {		
			$cmd = "uci add pub_rule src_rule"; shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@src_rule[-1].src_ip='%s'", $src_ip); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@src_rule[-1].enable=%s", $enable); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@src_rule[-1].comment='%s'", $comment); shell_exec($cmd);
			
			$cmd = "uci commit pub_rule"; shell_exec($cmd);
		}
		else if($action == "del") {
			$cmd = sprintf("uci delete pub_rule.@src_rule[%s].src_ip", $real_num); shell_exec($cmd);
			$cmd = sprintf("uci delete pub_rule.@src_rule[%s].enable", $real_num); shell_exec($cmd);
			$cmd = sprintf("uci delete pub_rule.@src_rule[%s].comment", $real_num); shell_exec($cmd);
			$cmd = sprintf("uci delete pub_rule.@src_rule[%s]", $real_num); shell_exec($cmd);
			$cmd = "uci commit pub_rule"; shell_exec($cmd);
			
		}
		else if($action == "edit") {
			$cmd = sprintf("uci set pub_rule.@src_rule[%s].src_ip='%s'", $real_num, $src_ip); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@src_rule[%s].enable=%s", $real_num, $enable); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@src_rule[%s].comment='%s'", $real_num, $comment); shell_exec($cmd);
			$cmd = "uci commit pub_rule"; shell_exec($cmd);
		}
		
		apply_rule();
		header("Content-Type: application/json");
        echo json_encode(array("errCode"=>0));
		
	}
	else if($action == "save_conf") {
		$post_data = json_decode(file_get_contents('php://input', true), true);
		$action = $post_data["action"];
		$real_num = $post_data["real_num"];
		$target_ip = $post_data["target_ip"];
		$enable = $post_data["enable"];
		$iface = $post_data["iface"];
		$comment = $post_data["comment"];
		
		if($action == "add") {		
			$cmd = "uci add pub_rule rule"; shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[-1].target_ip='%s'", $target_ip); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[-1].iface='%s'", $iface); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[-1].enable=%s", $enable); shell_exec($cmd);
			$cmd = sprintf("uci set pub_rule.@rule[-1].comment='%s'", $comment); shell_exec($cmd);
			
			$cmd = "uci commit pub_rule"; shell_exec($cmd);
		}
		else if($action == "del") {
			$cmd = sprintf("uci delete pub_rule.@rule[%s].target_ip", $real_num); shell_exec($cmd);
			$cmd = sprintf("uci delete pub_rule.@rule[%s].iface", $real_num); shell_exec($cmd);
			$cmd = sprintf("uci delete pub_rule.@rule[%s].enable", $real_num); shell_exec($cmd);
			$cmd = sprintf("uci delete pub_rule.@rule[%s].comment", $real_num); shell_exec($cmd);
			$cmd = sprintf("uci delete pub_rule.@rule[%s]", $real_num); shell_exec($cmd);
			$cmd = "uci commit pub_rule"; shell_exec($cmd);
			
		}
		else if($action == "edit") {
			$cmd = sprintf("uci set pub_rule.@rule[%s].target_ip='%s'", $real_num, $target_ip); shell_exec($cmd);
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
