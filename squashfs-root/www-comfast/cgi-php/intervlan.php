#!/usr/bin/php-cgi
<?php
// /etc/config/vlan
   //add field
   //vlan.vlan1.intervlan=0 | 1
error_reporting(0);

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


function delete_ip_rule($subnet)
{
    $cmd = sprintf("ip rule show | grep intervlan");
    if($subnet != false)
        $cmd = sprintf("ip rule show | grep intervlan | grep %s", $subnet);

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
    $cmd = sprintf("ip route show table all | grep intervlan");
    if($subnet != false)
        $cmd = sprintf("ip route show table all | grep intervlan | grep %s", $subnet);
        
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

function delete_firewall($subnet, $vlan_name)
{
    $cmd = sprintf("iptables -L -n | grep ACCEPT");
    $subnet_stuff = "";
    $intervlan_stuff = "| grep 'intervlan'";
    if($subnet != false)
    {
        $subnet_stuff = sprintf("| grep %s ", $subnet);

    }
    if($vlan_name != false)
    {
        $intervlan = "inter" . $vlan_name;
        $intervlan_stuff = sprintf( " | grep '%s' ", $intervlan);
    }
    $cmd = sprintf("iptables -L -n | grep ACCEPT %s %s", $intervlan_stuff, $subnet_stuff);

    $ret = shell_exec($cmd);
    //"ACCEPT     all  --  %s        %s  /* intervlan */"
    $ret_arr = explode("\n", $ret);
    foreach($ret_arr as $key=>$value)
    {
        $arr = preg_split('/\s+/', $value);
        if(count($arr) < 8) continue;
        if($arr[0] != "ACCEPT" || $arr[1] != "all") continue;

        $src = $arr[3];
        $dest = $arr[4];
        $comment = $arr[6];

        $cmd = sprintf("iptables -D FORWARD -s %s -d %s -j ACCEPT -m comment --comment '%s'",$src, $dest, $comment );
        shell_exec($cmd);
    }
}

function apply_intervlan1()
{

    $vlans = get_vlan_iface();

    // set table 10 ~ 15 is intervlan
    //$cmd = sprintf("grep -q intervlan /etc/iproute2/rt_tables || echo 10 intervlan >>/etc/iproute2/rt_tables");
    //shell_exec($cmd);


    foreach($vlans as $vlan_index => $vlan_info)
    {
        if($vlan_info["vlan_name"] == "") continue;
        $table_name = "inter" . $vlan_info["vlan_name"];
        $table_id = 310 + intval(substr($vlan_info["vlan_name"], 4));
        $cmd = sprintf("grep -q %s /etc/iproute2/rt_tables || echo %d %s >>/etc/iproute2/rt_tables", $table_name, $table_id, $table_name);
        shell_exec($cmd);

    }

    delete_ip_rule(false);
    delete_ip_route(false);
    delete_firewall(false, false);


    foreach($vlans as $vlan_index => $vlan_info)
    {
    
        $vlan_ip = $vlan_info["vlan_ip"];
        $vlan_netmask = $vlan_info["vlan_netmask"];
        $vlan_name = $vlan_info["vlan_name"];
        $table_name = "inter" . $vlan_info["vlan_name"];

        if($vlan_name == "" ||  $vlan_ip == "" || $vlan_netmask == "")
        {
            continue;
        }

        $ip_info =  ipv4Breakout($vlan_info["vlan_ip"], $vlan_info["vlan_netmask"]);
        $cidr = $ip_info["cidr"];
        $vlan_array = explode(",", $vlan_info["vlan_intervlan"]);

        if($vlan_info["vlan_intervlan"] == "") continue;

        //setup ip rule
        $cmd = sprintf("ip rule add from %s lookup %s", $cidr, $table_name);
        shell_exec($cmd);

        //setup ip route
        $cmd = sprintf("ip route replace %s dev br-%s table %s", $cidr, $vlan_name, $table_name);
        shell_exec($cmd);
        


        foreach($vlan_array as $key=>$vlan)
        {
            if($vlan == "") continue;
            $target_cidr = "";
            $target_vlan_ip = "";
            $target_vlan_netmask = "";
            $target_vlan_name = "";

            foreach($vlans as $target_index=>$target_vlan_info)
            {
                if($target_vlan_info["vlan_name"] == $vlan)
                {
                    $target_vlan_ip = $target_vlan_info["vlan_ip"];
                    $target_vlan_netmask = $target_vlan_info["vlan_netmask"];
                    $target_vlan_name = $target_vlan_info["vlan_name"];
                    break;
                }
            }

            //invalid target
            if($target_vlan_ip == "" || $target_vlan_netmask == "") continue;
            $target_ip_info = ipv4Breakout($target_vlan_info["vlan_ip"], $target_vlan_info["vlan_netmask"]);
            $target_cidr = $target_ip_info["cidr"];


            

            $cmd = sprintf("ip rule add from %s lookup %s", $target_cidr, $table_name);
            shell_exec($cmd);


            $cmd = sprintf("ip route replace %s dev br-%s table %s", $target_cidr, $target_vlan_name, $table_name);
            shell_exec($cmd);

            //setup firewall
            //source->target
            $cmd = sprintf("iptables -I FORWARD -s %s -d %s -j ACCEPT -m comment --comment %s", $cidr, $target_cidr, $table_name);
            shell_exec($cmd);
            //target->source
            $cmd = sprintf("iptables -I FORWARD -s %s -d %s -j ACCEPT -m comment --comment %s", $target_cidr, $cidr, $table_name);
            shell_exec($cmd);
            shell_exec("ip route flush cache");
        }

    }
    shell_exec("ip route flush cache");

}

function find_all_routes($vlans)
{
    $route_arr = array(array());

    $vlan_count = 0;
    $lan_count = 0;
    foreach($vlans as $vlan_key=>$vlan)
    {
        if($vlan['is_vlan'] == true)
            $vlan_count++;
        else 
            $lan_count++;
    }

    

    for($i = 0; $i < count($vlans); $i++)
    {
        for($j = 0; $j < count($vlans); $j++)
        {
            //$route_arr[$i][$j] = array("state"=>false, "src_cidr"=> "", "target_cidr"=>"");
            $route_arr[$i][$j]["state"] = false;
            $route_arr[$i][$j]["view_state"] = false;
            $route_arr[$i][$j]["src_cidr"] = "";
            $route_arr[$i][$j]["target_cidr"] = "";
        }
    }


    for($i = 0; $i < count($vlans); $i++)
    {
        $intervlan = $vlans[$i]["vlan_intervlan"];
        $vlan_name = $vlans[$i]["vlan_name"];

        $src_no = 0;

        if($vlans[$i]['is_vlan'] == true)
        {
            $src_no = substr($vlan_name, 4);
            if($src_no == "") continue;
                $src_no = intval($src_no) - 1;
    
            if($src_no < 0) continue; //invalid value
        }
        else
        {
            $src_no = substr($vlan_name, 3);

            $src_no = ($src_no == "") ? $vlan_count : ($vlan_count + intval($src_no));
        }



        $vlan_arr = explode(",", $intervlan);
        
        $ip_info =  ipv4Breakout($vlans[$i]["vlan_ip"], $vlans[$i]["vlan_netmask"]);
        $src_cidr = $ip_info["cidr"];


        foreach($vlan_arr as $key=>$target_vlan)
        {
            if($target_vlan == "") continue;
            $target_no = 0;

            if(strpos(strtolower($target_vlan), "lan") != 0 ) //vlan
            {
                $target = substr($target_vlan, 4);
                if($target == "") continue;
                $target_no = intval($target) - 1;
                if($target_no < 0) continue; //invalid value
            }
            else
            {
                $target = substr($target_vlan, 3);
                $target_no = (strtolower($target) == "") ? 0 : intval($target);
                $target_no += $vlan_count;

            }



            $target_ip_info = ipv4Breakout($vlans[$target_no]["vlan_ip"], $vlans[$target_no]["vlan_netmask"]);
            $target_cidr = $target_ip_info["cidr"];

            $v_1 = $src_no;
            $v_2 = $target_no;

            //this is for view
            if($v_1 == $v_2) continue;

            if($src_no > $target_no)
            {
                $v_2 = $src_no;
                $v_1 = $target_no;
            }
            
            if($route_arr[$v_1][$v_2]["state"] == false)
            {
                $route_arr[$v_1][$v_2]["state"] = true;
                $route_arr[$v_1][$v_2]["src_cidr"] = $src_cidr;
                $route_arr[$v_1][$v_2]["target_cidr"] = $target_cidr;
                $route_arr[$v_1][$v_2]["view_state"] = true;
                $route_arr[$v_2][$v_1]["view_state"] = true;
            }
        }
    }
    return $route_arr;
}

function apply_intervlan()
{
    $vlans = get_vlan_iface();
    

    // set table 10 ~ 15 is intervlan
    //$cmd = sprintf("grep -q intervlan /etc/iproute2/rt_tables || echo 10 intervlan >>/etc/iproute2/rt_tables");
    //shell_exec($cmd);

    $table_name = "intervlan"; //"inter" . $vlan_info["vlan_name"];
    $table_id = 310;  //+ intval(substr($vlan_info["vlan_name"], 4));
    $cmd = sprintf("grep -q %s /etc/iproute2/rt_tables || echo %d %s >>/etc/iproute2/rt_tables", $table_name, $table_id, $table_name);
    shell_exec($cmd);
    
    delete_ip_rule(false);
    delete_ip_route(false);
    delete_firewall(false, false);

    foreach($vlans as $vlan_index => $vlan_info)
    {
    
        $vlan_ip = $vlan_info["vlan_ip"];
        $vlan_netmask = $vlan_info["vlan_netmask"];
        $vlan_name = $vlan_info["vlan_name"];
        $table_name = "intervlan"; //"inter" . $vlan_info["vlan_name"];

        if($vlan_name == "" ||  $vlan_ip == "" || $vlan_netmask == "")
        {
            continue;
        }

        $ip_info =  ipv4Breakout($vlan_info["vlan_ip"], $vlan_info["vlan_netmask"]);
        $cidr = $ip_info["cidr"];
       


        //setup ip rule
        $cmd = sprintf("ip rule add from %s lookup %s", $cidr, $table_name);
        shell_exec($cmd);

        //setup ip route
        $cmd = sprintf("ip route replace %s dev br-%s table %s", $cidr, $vlan_name, $table_name);
        shell_exec($cmd);
        
        shell_exec("ip route flush cache");
    }



    $possible_arr = find_all_routes($vlans);



    foreach($possible_arr as $src_key=>$src_info)
    {
        foreach($src_info as $target_key=>$target_info)
        {
            if($target_info["state"] == false) continue;

            $src_cidr = $target_info["src_cidr"];
            $target_cidr = $target_info["target_cidr"];

            $cmd = sprintf("iptables -I FORWARD -s %s -d %s -j ACCEPT -m comment --comment %s", $src_cidr, $target_cidr, $table_name);
            shell_exec($cmd);
            //target->source
            $cmd = sprintf("iptables -I FORWARD -s %s -d %s -j ACCEPT -m comment --comment %s", $target_cidr, $src_cidr, $table_name);
            shell_exec($cmd);

        }
    }
}




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

if($method=="GET")
{
    if($action == "load_data")
    {
        $errCode = 0;
        $vlans = get_vlan_iface();

        $response = array("errCode"=>$errCode, "vlans"=>$vlans);
        header("Content-Type: application/json");
        echo json_encode($response);
    }

}
else if ($method == "SET")
{
    if($action=="save_data")
    {
        //save into uci
        $req_data = file_get_contents('php://input', true);
        $json_req  = json_decode($req_data);

        $errCode = 0;

        /*

        $possible_route = find_all_routes($json_req);

        foreach($possible_route as $src_key=>$src_info)
        {
            $intervlan = array();
            foreach($src_info as $target_key=>$target_info)
            {
                if($target_info->state == false) continue;
                $intervlan[] = "vlan".$target_key;
            }

            $vlan_intervlan = implode(",", $intervlan);
            $vlan_name = "vlan" . $src_key;
            $cmd = sprintf("uci set vlan.%s.intervlan=%s", $vlan_name, $vlan_intervlan);
            shell_exec($cmd);
        }
        shell_exec("uci commit vlan");
        */


        $vlans = get_vlan_iface();
        $possible_route = find_all_routes($vlans);

        $vlan_count = 0;
        $lan_count = 0;
        foreach($vlans as $vlan_key=>$vlan)
        {
            if($vlan['is_vlan'] == true)
                $vlan_count++;
            else 
                $lan_count++;
        }

        
        foreach($json_req as $key=>$value)
        {
            //"vlan_name"=>"vlan1"
            //"vlan_intervlan"=>0 | 1
            //uci set

            $vlan_name = $value->vlan_name;
            $is_vlan = false;
            $vlan_intervlan = $value->vlan_intervlan;
            foreach($vlans as $k=>$vlan)
            {
                if($vlan_name == $vlan['vlan_name'])
                {
                    $is_vlan = $vlan['is_vlan'];
                }
            }
            if($is_vlan)
            {
                $cmd = sprintf("uci set vlan.%s.intervlan=%s", $vlan_name, $vlan_intervlan);
                shell_exec($cmd);
                shell_exec("uci commit vlan");
            }
            else
            {
                $cmd = sprintf("uci set network.%s.intervlan=%s", $vlan_name, $vlan_intervlan);
                shell_exec($cmd);
                shell_exec("uci commit network");
            }

            //remove logic
            $src_idx = substr($vlan_name, 4);
            $src_idx = intval($src_idx) - 1;
            if($src_idx < 0) continue;
            $intervlan = explode(",", $vlan_intervlan);
            $my_arr = array();
            for($i = 0; $i< count($vlans); $i++ )
            {
                $my_arr[] = false;
            }
            for($i = 0; $i < count($intervlan); $i++)
            {
                $intervlan[$i] = str_clean($intervlan[$i]);
                if($intervlan[$i] == "") continue;
                if(strpos(strtolower($intervlan[$i]), "lan") != 0 ) //vlan
                {
                    $idx = substr($intervlan[$i], 4);
                    $idx = intval($idx) - 1;
    
                    if($idx < 0) continue;
                    $my_arr[$idx] = true;
                }
                else
                {
                    $idx = substr($intervlan[$i], 3);
                    $idx = (strtolower($idx) == "") ? 0 : intval($idx);
                    $idx += $vlan_count;
    
                    if($idx < 0) continue;
                    $my_arr[$idx] = true;
                }

            }

            for($i = 0; $i < count($my_arr); $i++)
            {
                $possible_route[$src_idx][$i]["view_state"] = $my_arr[$i];
                $possible_route[$i][$src_idx]["view_state"] = $my_arr[$i];
            }

        }


        foreach($possible_route as $src_key=>$src_info)
        {
            $intervlan = array();
            foreach($src_info as $target_key=>$target_info)
            {
                if($target_info["view_state"] == false) continue;
                if($target_key < $vlan_count)
                {
                    $intervlan[] = "vlan".($target_key + 1);
                }
                else
                {
                    $intervlan[] = "lan".( ($target_key - $vlan_count) == 0 ? "" : $target_key - $vlan_count );
                }
            }

            $vlan_intervlan = implode(",", $intervlan);

            if($src_key < $vlan_count)
            {
        
                $vlan_name = "vlan" . ($src_key + 1);
                $cmd = sprintf("uci set vlan.%s.intervlan=%s", $vlan_name, $vlan_intervlan);
                shell_exec($cmd);
            }
            else
            {
                $vlan_name = "lan".( ($src_key - $vlan_count) == 0 ? "" : $src_key - $vlan_count );
                $cmd = sprintf("uci set network.%s.intervlan=%s", $vlan_name, $vlan_intervlan);
                shell_exec($cmd);
            }


        }
        shell_exec("uci commit vlan");
        shell_exec("uci commit network");


        // apply setting
        
        apply_intervlan();

        //rewrite into uci

        //$vlans = get_vlan_iface();
        //$possible_route = find_all_routes($vlans);

        



        $response = array("errCode"=>$errCode);
        header("Content-Type: application/json");
        echo json_encode($response);
    }
    else if($action=="run")
    {
        apply_intervlan();

        $vlans = get_vlan_iface();

        $possible_route = find_all_routes($vlans);

        $vlan_count = 0;
        $lan_count = 0;
        foreach($vlans as $vlan_key=>$vlan)
        {
            if($vlan['is_vlan'] == true)
                $vlan_count++;
            else 
                $lan_count++;
        }


        foreach($possible_route as $src_key=>$src_info)
        {
            $intervlan = array();
            foreach($src_info as $target_key=>$target_info)
            {
                if($target_info["view_state"] == false) continue;
                if($target_key < $vlan_count)
                {
                    $intervlan[] = "vlan".($target_key + 1);
                }
                else
                {
                    $intervlan[] = "lan".( ($target_key - $vlan_count) == 0 ? "" : $target_key - $vlan_count );
                }
            }

            $vlan_intervlan = implode(",", $intervlan);
         

            if($src_key < $vlan_count)
            {
        
                $vlan_name = "vlan" . ($src_key + 1);
                $cmd = sprintf("uci set vlan.%s.intervlan=%s", $vlan_name, $vlan_intervlan);
                shell_exec($cmd);
            }
            else
            {
                $vlan_name = "lan".( ($src_key - $vlan_count) == 0 ? "" : $src_key - $vlan_count );
                $cmd = sprintf("uci set network.%s.intervlan=%s", $vlan_name, $vlan_intervlan);
                shell_exec($cmd);
            }
        }
        shell_exec("uci commit vlan");
        shell_exec("uci commit network");

        //echo "apply_intervlan called";
    }
}

?>
