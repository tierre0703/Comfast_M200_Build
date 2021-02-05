<?php
error_reporting(0);
$table_id_start = 320;

$table_suffix = "dt_";
$CONFIG_PATH = "/etc/config/traffic_rule";

$method = !empty($_GET["method"]) ? $_GET["method"] : "";
$action = !empty($_GET["action"]) ? $_GET["action"] : "";

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
    $ip_host_first = ((~$ip_nmask_long) & $ip_address_long);
    $ip_first = ($ip_address_long ^ $ip_host_first) + 1;

    //caculate last usable address
    $ip_broadcast_invert = ~$ip_nmask_long;
    $ip_last = ($ip_address_long | $ip_broadcast_invert) - 1;


    /*
    //caculate first usable address
    //caculate broadcast address
    $ip_broadcast = $ip_address_long | $ip_broadcast_invert;

    foreach (range($ip_first, $ip_last) as $ip) {
            array_push($hosts, $ip);
    }
    */
    $cidr = mask2cidr($ip_nmask);
    $cidr_addr = long2ip($ip_net) . "/" . $cidr;

    $block_info = array("network" => "$ip_net",
            "ip_first" => $ip_first,
            "ip_last" => $ip_last,
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


function get_interfaces() {
		$table_id_start = 320;
        $wan_list = array();
        $str_wans = shell_exec("ubus list | grep network.interface.wan | cut -d . -f 3");
        $wans = explode("\n", $str_wans);
        $interfaces = array();
        foreach($wans as $k=>$wan)
        {
			$wan = str_clean($wan);
			if($wan == "") continue;
            $cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"route\"][1].nexthop'", $wan);
            $nexthop = shell_exec($cmd);
            $nexthop = str_clean($nexthop);
            if($nexthop == "") {
				$cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"route\"][0].nexthop'", $wan);
				$nexthop = shell_exec($cmd);
				$nexthop = str_clean($nexthop);
            }
            
            $table_id = ($wan == "wan") ? $table_id_start : (intval(substr($wan, 3)) + $table_id_start);
            $interfaces[] = array(
				'iface'=>$wan,
				'nexthop'=>$nexthop,
				'table_id'=>$table_id,
				'dt_table'=>("dt_" . $wan)
            );			
		}
		
		return $interfaces;
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

function policy_set_iface_route()
{
	$interfaces = get_interfaces();
	foreach($interfaces as $k=>$interface) {
		$cmd = sprintf("cat /etc/iproute2/rt_tables | grep -w %s", $interface['dt_table']);
		$rt_table = shell_exec($cmd);
		$rt_table = str_clean($rt_table);
		if($rt_table == "") {
			$cmd = sprintf("echo \"%d %s\" >> /etc/iproute2/rt_tables", $interface['table_id'], $interface['dt_table']);
			shell_exec($cmd);
		}
	}
	
	foreach ($interfaces as $k=>$interface) {
		//ip route
		$cmd = sprintf("ip route flush table %s", $interface['dt_table']);
		shell_exec($cmd);
		$cmd = sprintf("ip route replace default via %s dev br-%s table %s", $interface['nexthop'], $interface['iface'], $interface['dt_table']);
		shell_exec($cmd);
	}
}


function set_rules() {
	
	policy_set_iface_route();
	delete_rules();
	
	
	$rules = get_conf();
	
	foreach($rules as $k=>$rule) {
		$enable = intval($rule['enable']);
		if($enable == 0) continue;
		
		$ipaddr = $rule['ipaddr'];
		$iface = $rule['iface'];
		$ip_list = parse_ip_list($ipaddr);
		foreach($ip_list as $ip_index=>$ip){
			$cmd = sprintf("ip rule add from %s table dt_%s", $ip, $iface );
			shell_exec($cmd);
		}
	}
}


function delete_rules() {
	$wan_list = get_interfaces();
	
	foreach($wan_list as $k=>$wan_info)
	{
		$wan_interface= $wan_info['dt_table'];
		$cmd = sprintf("ip rule list | grep -w %s", $wan_interface);
		$str_iplist = shell_exec($cmd);
		$ip_list = explode("\n", $str_iplist);
		foreach($ip_list as $ip_index =>$ip) {
			$ip = str_clean($ip);
			 $val = substr($ip, strpos($ip, "from "));
			 if($val == "") continue;
			 $cmd = sprintf("ip rule delete %s", $val);
			 shell_exec($cmd);
		}
	}
}


function get_real_nums() {
	$retData = array();
	$total_num = 0;
	$real_nums = array();
	
	$str_real_nums = shell_exec("uci get traffic_rule.rule_list.list 2>/dev/null");
	$nums = explode(",", $str_real_nums);
	$index = 0;
	foreach($nums as $k=>$num){
		$num = str_clean($num);
		if($num == "") continue;
		
		if($index == 0) $total_num = intval($num);
		else $real_nums[] = intval($num);
		$index++;
	}
	return $real_nums;
}

function get_conf() {
	
	$retdata = array();
		
		$real_nums = get_real_nums();
		foreach($real_nums as $k=>$real_num) {
			$cmd = sprintf("uci get traffic_rule.rule_%d.desc 2>/dev/null", $real_num);
			$desc = shell_exec($cmd); $desc = str_clean($desc);
			
			$cmd = sprintf("uci get traffic_rule.rule_%d.ipaddr 2>/dev/null", $real_num);
			$ipaddr = shell_exec($cmd); $ipaddr = str_clean($ipaddr);

			$cmd = sprintf("uci get traffic_rule.rule_%d.enable 2>/dev/null", $real_num);
			$enable = shell_exec($cmd); $enable = str_clean($enable);

			$cmd = sprintf("uci get traffic_rule.rule_%d.iface 2>/dev/null", $real_num);
			$iface = shell_exec($cmd); $iface = str_clean($iface);

			$cmd = sprintf("uci get traffic_rule.rule_%d.enable 2>/dev/null", $real_num);
			$enable = shell_exec($cmd); $enable = str_clean($enable);
			
			$retdata[]= array(
				'real_num'=>$real_num, 
				'ipaddr'=>$ipaddr,
				'iface'=>$iface,
				'desc'=>$desc,
				'enable'=>$enable
			);
		}
	return $retdata;
}


if(!file_exists($CONFIG_PATH)) {
	$cmd = sprintf("touch %s", $CONFIG_PATH);
}

$str_rules = file_get_contents($CONFIG_PATH);
if(str_clean($str_rules) == "") {
	shell_exec("uci set traffic_rule.rule_list=map");
	shell_exec("uci set traffic_rule.rule_list.list='0,'");
	shell_exec("uci commit traffic_rule");
}


if($method == "GET") {
	if($action == "read_conf")
	{
		$retdata = get_conf();
		
		header("Content-Type: application/json");
		echo json_encode($retdata);
	}
}
else if($method == "SET")
{
	
	if($action == "set_rule") {
		set_rules();
		shell_exec("curl -s \"http://127.0.0.1/cgi-php/intervlan.php?method=SET&action=run\"");
	}
	else if($action == "delete_rule") {
		delete_rules();
	}
	else if($action == "save_conf") {
		$real_nums = get_real_nums();
		
		$post_data = json_decode(file_get_contents('php://input', true), true);
		$action = $post_data["action"];
		if($action == "add") {
			
			$real_num = 1;
			if(count($real_nums) == 0) {
				$real_num = 1;
				$real_nums[] = $real_num;
			}
			else
			{
				$real_num = intval($real_nums[count($real_nums) - 1]) + 1;
				$real_nums[] = $real_num;
			}
			
			$ipaddr = $post_data['ipaddr'];
			$iface = $post_data['iface'];
			$desc = $post_data['desc'];
			$enable = $post_data['enable'];
			
			$cmd = sprintf("uci set traffic_rule.rule_%s=rule", $real_num); shell_exec($cmd);
			
			$cmd = sprintf("uci set traffic_rule.rule_%s.desc='%s'", $real_num, $desc); shell_exec($cmd);
			$cmd = sprintf("uci set traffic_rule.rule_%s.ipaddr='%s'", $real_num, $ipaddr); shell_exec($cmd);
			$cmd = sprintf("uci set traffic_rule.rule_%s.iface='%s'", $real_num, $iface); shell_exec($cmd);
			$cmd = sprintf("uci set traffic_rule.rule_%s.enable='%s'", $real_num, $enable); shell_exec($cmd);
			
			$cmd = sprintf("uci set traffic_rule.rule_list.list='%d,%s,'", count($real_nums), implode(",", $real_nums));
			shell_exec($cmd);
			
			
		}
		else if($action == "edit") {
			$real_num = $post_data['real_num'];
			$ipaddr = $post_data['ipaddr'];
			$iface = $post_data['iface'];
			$desc = $post_data['desc'];
			$enable = $post_data['enable'];
			
			
			$cmd = sprintf("uci set traffic_rule.rule_%s.desc='%s'", $real_num, $desc); shell_exec($cmd);
			$cmd = sprintf("uci set traffic_rule.rule_%s.ipaddr='%s'", $real_num, $ipaddr); shell_exec($cmd);
			$cmd = sprintf("uci set traffic_rule.rule_%s.iface='%s'", $real_num, $iface); shell_exec($cmd);
			$cmd = sprintf("uci set traffic_rule.rule_%s.enable='%s'", $real_num, $enable); shell_exec($cmd);
			
		}
		else if($action == "del") {
			
			$del_list = $post_data["del_list"];
			$del_nums = explode(",", $del_list);
			
			foreach($del_nums as $k=>$num) {
				if($num == "") continue;
				$cmd = sprintf("uci delete traffic_rule.rule_%s.desc 2>/dev/null", $num); shell_exec($cmd);
				$cmd = sprintf("uci delete traffic_rule.rule_%s.ipaddr 2>/dev/null", $num); shell_exec($cmd);
				$cmd = sprintf("uci delete traffic_rule.rule_%s.enable 2>/dev/null", $num); shell_exec($cmd);
				$cmd = sprintf("uci delete traffic_rule.rule_%s.iface 2>/dev/null", $num); shell_exec($cmd);
				$cmd = sprintf("uci delete traffic_rule.rule_%s 2>/dev/null", $num); shell_exec($cmd);
			}
			
			//set num
			$deleted_nums = array();
			
			foreach($real_nums as $real_index=>$real_num)
			{
				if($real_num == "" ) continue;
				$bFound = false;
				foreach($del_nums as $del_index=>$del_num) {
					if($del_num == "") continue;
					if(intval($del_num) == intval($real_num)) {
						$bFound = true;
						break;
					}
				}
				
				if($bFound == false) 
					$deleted_nums[] = $real_num;
			}
			$cmd = sprintf("uci set traffic_rule.rule_list.list='%d,%s,'", count($deleted_nums), implode(",", $deleted_nums));
			shell_exec($cmd);
			
		}
		
		shell_exec("uci commit traffic_rule");
		
		set_rules();
		
		shell_exec("curl -s \"http://127.0.0.1/cgi-php/intervlan.php?method=SET&action=run\"");
        header("Content-Type: application/json");
        echo json_encode(array("errCode"=>0));
	}
}



?>
