#!/usr/bin/php-cgi
<?php
error_reporting(0);



$CONFIG_PATH =  "/etc/config/dhcp_client";
$DHCP_CLIENT = "/www-comfast/cgi-php/dhcp_client";
$CLIENT_QOS_PATH = "/www-comfast/cgi-php/client_qos";

$COMMENT = "QtyCtl";

$method = !empty($_GET["method"]) ? $_GET["method"] : "";
$action = !empty($_GET["action"]) ? $_GET["action"] : "";

function str_clean($str)
 {
    $remove_character = array("\n", "\r\n", "\r");
    $str = str_replace($remove_character , '', trim($str));
     return $str;
 }
 function get_arp_bind_list()
 {
    $ret = shell_exec("curl -s \"http://127.0.0.1/cgi-bin/mbox-config?method=GET&section=arp_bind_list\" --header \"Content-Type: application/json\" --request POST --data '{}'");
    return $ret;
 }

 function get_arp_list()
 {
    $ret = shell_exec("curl -s \"http://127.0.0.1/cgi-bin/mbox-config?method=GET&section=arp_list\" --header \"Content-Type: application/json\" --request POST --data '{}'");
    return $ret;
 }

 function get_dhcp_list()
 {
     $ret = shell_exec("curl -s \"http://127.0.0.1/cgi-bin/mbox-config?method=GET&section=dhcp_list\" --header \"Content-Type: application/json\" --request POST --data '{}'");
     return $ret;
 }

 function get_dhcp_static_list()
 {
     $ret = shell_exec("curl -s \"http://127.0.0.1/cgi-bin/mbox-config?method=GET&section=dhcp_static_list\" --header \"Content-Type: application/json\" --request POST --data '{}'");
     return $ret;
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


 function get_lan_vlan_config()
 {
     $ret = shell_exec("curl -s \"http://127.0.0.1/cgi-bin/mbox-config?method=GET&section=lan_dhcp_config\" --header \"Content-Type: application/json\" --request POST --data '{}'");
     $config = json_decode($ret, true);
     $lan_data = !empty($config['lanlist']) ? $config['lanlist'] : [];
     $vlan_data = !empty($config['vlanlist']) ? $config['vlanlist']: [];
     $retData = [];

     foreach($lan_data as $key=>$value)
     {
         if($value['ipaddr'] == "" || $value['netmask'] == "") continue;
        $ip_info = ipv4Breakout($value['ipaddr'], $value['netmask']);


         $retData[] = array(
             'ipaddr'=>$value['ipaddr'],
             'netmask'=>$value['netmask'],
             'iface'=>$value['iface'],
             'cidr'=>$ip_info['cidr'],
             'ip_first'=>$ip_info['ip_first'],
             'ip_last'=>$ip_info['ip_last']
         );
     }

     foreach($vlan_data as $key=>$value)
     {
        $ip_info = ipv4Breakout($value['ipaddr'], $value['netmask']);


         $retData[] = array(
             'ipaddr'=>$value['ipaddr'],
             'netmask'=>$value['netmask'],
             'iface'=>$value['iface'],
             'cidr'=>$ip_info['cidr'],
             'ip_first'=>$ip_info['ip_first'],
             'ip_last'=>$ip_info['ip_last']
         );
     }

     return $retData;
 }


 function get_flow_data() {
    //flow data
    $str_flow_stats = shell_exec("cat /proc/flow_stats");
    $flow_stats = explode("\n", $str_flow_stats);
    $flow_info = array();
    foreach($flow_stats as $k=>$stat)
    {
        $stat = preg_replace('!\s+!', ' ', $stat);
        $ip = "";
        $mac ="";
        $db = 0;
        $ub = 0;
        sscanf($stat, "%s %s %d %d ", $ip, $mac, $db, $ub);
        $mac = str_clean($mac);
        $db = str_clean($db);
        $ub = str_clean($ub);
        if($mac == "00:00:00:00:00:00") continue;

        $flow_info[] = array('mac'=>$mac, 'db'=>$db, 'ub'=>$ub);
    }
     
    return $flow_info;
 }


 function set_qos_limit($mac, $status)
 {
    $COMMENT = "QtyCtl";
    $cmd = sprintf("iptables -L -n |grep %s | grep %s", $COMMENT, strtoupper($mac));
    $retStr = shell_exec($cmd);
    $retStr = str_clean($retStr);

    if($status == true)
    {
        if($retStr == "")
        {
            $cmd = sprintf("iptables -I FORWARD -m mac --mac-source %s -j DROP  -m comment --comment %s", strtoupper($mac), $COMMENT);
            shell_exec($cmd);
        }
        else{
            //already exists skip
        }
    }
    else
    {
        if($retStr != ""){
            $cmd = sprintf("iptables -D FORWARD -m mac --mac-source %s -j DROP  -m comment --comment %s", strtoupper($mac), $COMMENT);
            shell_exec($cmd);
        }
        else{
            // no need to remove
        }
    }
 }
 
 function func_get_client_list() {
 $DHCP_CLIENT = "/www-comfast/cgi-php/dhcp_client";
 /**
         * 1. poll dhcp
         * 2. poll arp
         */
        $str_clients = file_get_contents($DHCP_CLIENT);
        $clients = json_decode($str_clients, true);
        $time = time();

        $vlan_info = get_lan_vlan_config();
        //KEY: mac

         // poll dhcp static
         //{"dhcp":[{"ip":"30.30.30.100","mac":"00:50:c2:fd:29:a2","commentname":"MMS-29A2","real_num":1},{"ip":"40.40.40.150","mac":"00:15:26:0a:ec:58","commentname":"RTI_XP8","real_num":2}],"errCode":0,"errMsg":"OK","configDone":false}         //poll dhcp_static_list
         $str_static_list = get_dhcp_static_list();
         $static_list = json_decode($str_static_list, true);
         if(!empty($static_list['dhcp']))
         {
             foreach($static_list['dhcp'] as $key=>$value)
             {
                 $mac = strtolower($value['mac']);
                 $clients[$mac]['ip'] = $value['ip'];
                 $clients[$mac]['mac'] = $value['mac'];
                 $clients[$mac]['commentname'] = empty($value['commentname']) ? "*" : $value['commentname'];
                 $clients[$mac]['timestamp'] = $time;
                 $clients[$mac]['rest_time_string'] = empty($value['rest_time_string']) ? "" : $value['rest_time_string'];


                 $clients[$mac]['type']='static';
             }
         }

         //poll dhcp
         //{"dhcp":[{"ip":"40.40.40.100","mac":"90:dd:5d:ba:a2:3e","commentname":"Living-Room","rest_time":6942,"rest_time_string":"01:55:42"},{"ip":"172.16.0.120","mac":"c0:3f:d5:67:c0:54","commentname":"NetmapMonitor","rest_time":6216,"rest_time_string":"01:43:36"},{"ip":"40.40.40.102","mac":"00:e0:36:d2:7c:67","commentname":"*","rest_time":5489,"rest_time_string":"01:31:29"},{"ip":"172.16.0.50","mac":"bc:a5:11:26:3d:3c","commentname":"*","rest_time":4677,"rest_time_string":"01:17:57"}],"errCode":0,"errMsg":"OK","configDone":false}
         $str_dhcp_list = get_dhcp_list();
         $dhcp_list = json_decode($str_dhcp_list, true);
         if(!empty($dhcp_list['dhcp']))
         {
             foreach($dhcp_list['dhcp'] as $key=>$value)
             {
                 $mac = strtolower($value['mac']);
                 $clients[$mac]['ip'] = $value['ip'];
                 $clients[$mac]['mac'] = $value['mac'];
                 $clients[$mac]['commentname'] = empty($value['commentname']) ? "*" : $value['commentname'];
                 $clients[$mac]['rest_time'] = empty($value['rest_time']) ? "" : $value['rest_time'];
                 $clients[$mac]['rest_time_string'] = empty($value['rest_time_string']) ? "" : $value['rest_time_string'];
                 $clients[$mac]['expiretime'] = $time + $value['rest_time'];
                 $clients[$mac]['timestamp'] = $time;

                 $clients[$mac]['type'] = 'dhcp';
             }
         }

         //arp
         //{"arp_list":[{"ip":"40.40.40.102","mac":"00:e0:36:d2:7c:67","name":"vlan4","ifname":"vlan4","static":"0"},{"ip":"172.16.0.2","mac":"70:d3:79:05:32:40","name":"lan1","ifname":"lan","static":"0"},{"ip":"192.168.1.1","mac":"2c:56:dc:5c:11:0d","name":"lan4","ifname":"wan3","static":"0"},{"ip":"172.16.0.135","mac":"14:18:77:4b:23:87","name":"lan1","ifname":"lan","static":"0"},{"ip":"40.40.40.100","mac":"90:dd:5d:ba:a2:3e","name":"vlan4","ifname":"vlan4","static":"1"},{"ip":"192.168.100.1","mac":"b8:69:f4:b0:e2:48","name":"lan2","ifname":"wan1","static":"0"},{"ip":"30.30.30.100","mac":"00:50:c2:fd:29:a2","name":"vlan3","ifname":"vlan3","static":"0"},{"ip":"192.168.101.1","mac":"b8:69:f4:b0:e2:49","name":"lan3","ifname":"wan2","static":"0"},{"ip":"40.40.40.150","mac":"00:15:26:0a:ec:58","name":"vlan4","ifname":"vlan4","static":"0"},{"ip":"172.16.0.120","mac":"c0:3f:d5:67:c0:54","name":"lan1","ifname":"lan","static":"0"},{"ip":"172.16.0.50","mac":"bc:a5:11:26:3d:3c","name":"lan1","ifname":"lan","static":"0"}],"errCode":0,"errMsg":"OK","configDone":false}
         $str_arp_list = get_arp_list();
         $arp_list = json_decode($str_arp_list, true);
         if(!empty($arp_list['arp_list']))
         {
             foreach($arp_list['arp_list'] as $key=>$value)
             {
                 $mac = strtolower($value['mac']);
                 $ip = $value['ip'];
                 $ifname = $value['ifname'];

                 if($mac == "") continue;

                 //check ip is dhcped ip
                 $ip_num = ip2long($ip);
                 $valid_ip = false;
                 foreach($vlan_info as $vlan_idx=>$vlan)
                 {
                     if($ip_num > $vlan['ip_first'] && $ip_num < $vlan['ip_last'])
                     {
                         $valid_ip = true;
                         break;
                     }
                 }
                 if($valid_ip == false) continue;

                 if(strpos($ifname, "lan") != 0 && strpos($ifname, "vlan") != 0) continue;

                 $type = empty($clients[$mac]['type']) ? "" : $clients[$mac]['type'];
                 $client_ip = empty($clients[$mac]['ip']) ? "" : $clients[$mac]['ip'];

                

                 if($client_ip != $ip && $type == "dhcp")
                 {
                    $clients[$mac]['type'] = "manual";
                 }

                 if($clients[$mac]['expiretime'] < $time &&  $clients[$mac]['type'] == 'dhcp')
                {
                    echo $clients[$mac]['ip']  . "removed" . "\n";
                    unset($clients[$mac]);
                }


                 $clients[$mac]['ip'] = $ip;
                 $clients[$mac]['mac'] = $mac;
                 $clients[$mac]['type'] = empty($clients[$mac]['type']) ? "manual" : $clients[$mac]['type'];
                 $clients[$mac]['timestamp'] = $time;
                 $clients[$mac]['status'] = "online";
             }
         }


         //poll arp bind
         //{"arp_bind":[{"ip":"40.40.40.100","mac":"90:dd:5d:ba:a2:3e","ifname":"vlan4","remark":"test device","name":"","real_num":1}],"errCode":0,"errMsg":"OK","configDone":false}
         $str_arp_bind_list = get_arp_bind_list();
         $arp_bind_list = json_decode($str_arp_bind_list, true);
         if(!empty($arp_bind_list['arp_bind']))
         {
             foreach($arp_bind_list['arp_bind'] as $key=>$value)
             {
                 $mac = strtolower($value['mac']);
                 $clients[$mac]['remark'] = empty($value['remark']) ? "" : $value['remark'];
             }
         }
         

         //check online
         foreach($clients as $key=>$value)
         {
             $ip = $value['ip'];
             $mac = $value['mac'];
             
             if($ip == "") continue;
             if($mac == "") continue;


             /*
             $cmd = sprintf("fping %s", $ip);
             $ret = shell_exec($cmd);
             if(strpos($ret, "is alive") === false)
             {
                 $bInArp = false;
                foreach($arp_list['arp_list'] as $arp_key=>$arp)
                {
                    if(strtolower($arp['mac']) == strtolower($value['mac']))
                    {
                        $bInArp = true;
                        break;
                    }
                }
                if($bInArp == true)
                {
                    $clients[$key]['status'] = "conissue";    
                }
                else
                {
                    $clients[$key]['status'] = 'offline';

                }

             }
             else
                $clients[$key]['status'] = 'online';
                */
            $is_in_arp = false;
            foreach($arp_list['arp_list'] as $arp_key => $arp)
            {
                if(strtolower($arp['mac']) == strtolower($mac))
                {
                    $is_in_arp = true;
                    break;
                }
            }

            if($clients[$key]['type'] == "dhcp")
            {
                if($is_in_arp == false) 
                    $clients[$key]['status'] = 'offline';
            }
            else if($clients[$key]['type'] == "manual" || $clients[$key]['type'] == "static")
            {
                if($is_in_arp == false)
                    $clients[$key]['status'] = 'conissue';
            }



               

            if($clients[$key]['expiretime'] < $time &&  $clients[$key]['type'] == 'dhcp')
            {
                //echo $clients[$key]['ip'] . " removed" . "\n";
                unset($clients[$key]);
            }
         }
         file_put_contents($DHCP_CLIENT, json_encode($clients));
 }



if(!file_exists($CONFIG_PATH))
{
    $cmd = sprintf("touch %s", $CONFIG_PATH);
    shell_exec($cmd);
}

if(!file_exists($DHCP_CLIENT))
{
    file_put_contents($DHCP_CLIENT, "[]");
}

if(!file_exists($CLIENT_QOS_PATH))
{
    file_put_contents($CLIENT_QOS_PATH, "[]");
}


if($method=="GET")
{
    if($action == "quantity_qos_list")
    {
        $str_client_qos = file_get_contents($CLIENT_QOS_PATH);

        /**
         * {'mac': '11:22:33:44:55:66', 'download_limit': 1000, 'upload_limit': 1000 }
         */

        header("Content-Type: application/json");
        echo $str_client_qos;
    }
    else if($action == "dhcp_client")
    {
        
        func_get_client_list();
    }
    else if($action == "client_info")
    {
        header("Content-Type: application/json");
        $ret = file_get_contents($DHCP_CLIENT);
        $clients = json_decode($ret, true);
        //if(count($clients) == 0) 
        {
			func_get_client_list();
			$ret = file_get_contents($DHCP_CLIENT);
			$clients = json_decode($ret, true);
		}
        echo json_encode($clients);
    }
    else if($action == "client_info2")
    {
        $str_ids = shell_exec("uci show dhcp_client | grep .macaddr= | cut -d [ -f 2 | cut -d ] -f 1 ");

        $outputData = array();

        $ids = explode("\n", $str_ids);

        foreach($ids as $k=>$id)
        {
            $id = str_clean($id);

            if($id == "") continue;

            $macaddr = "";
            $alias = "";

            $cmd = sprintf("uci get dhcp_client.@rule[%s].macaddr", $id);
            $macaddr = shell_exec($cmd);
            $macaddr = str_clean($macaddr);

            $cmd = sprintf("uci get dhcp_client.@rule[%s].alias", $id);
            $alias = shell_exec($cmd);
            $alias = str_clean($alias);
            $outputData[] = array('mac'=>$macaddr, 'remark'=>$alias);
        }

        header("Content-Type: application/json");
        echo json_encode($outputData);
    }

    else if($action == "update_flow")
    {
        /**
         * 1. every per hour update client flow
         * 
         * 2. if flow over traffic limit: apply limit
         * 
         * 3. 1st of every month, reset traffic limit
         * 
         */


        $str_client_qos = file_get_contents($CLIENT_QOS_PATH);
        $client_qos = json_decode($str_client_qos, true);

        $flow_info = get_flow_data();

        echo json_encode($flow_info);

        $update_time = time();
        $month_begin  = mktime(0, 0, 0, date("m"), 1, date("Y"));

        foreach($client_qos as $key=>$client)
        {
            //###############################################################################
            //update
            $prev_ub = empty($client_qos[$key]['prev_ub']) ? 0 : $client_qos[$key]['prev_ub'];
            $prev_db = empty($client_qos[$key]['prev_db']) ? 0 : $client_qos[$key]['prev_db'];

            $total_ub = empty($client_qos[$key]['total_ub']) ? 0 : $client_qos[$key]['total_ub'];
            $total_db = empty($client_qos[$key]['total_db']) ? 0 : $client_qos[$key]['total_db'];

            $download_limit = (empty($client_qos[$key]['download_limit']) || "") ? 0 : intval($client_qos[$key]['download_limit']);
            $upload_limit = (empty($client_qos[$key]['upload_limit']) || "") ? 0 : intval($client_qos[$key]['upload_limit']);
            
            $reset_time = empty($client_qos[$key]['reset_time']) ? 0 : $client_qos[$key]['reset_time'];

            $reset_flag = empty($client_qos[$key]['limit_status'] ) ? false : $client_qos[$key]['limit_status'];

            $cur_db = 0;
            $cur_ub = 0;
            $mac = $client_qos[$key]['mac'];


            foreach($flow_info as $flow_key=>$flow)
            {
               
               if(strcmp(strtolower($flow['mac']), strtolower($mac)) == 0 )
                //if(strtolower($flow->mac) == strtolower($mac))
                {
    
                    $cur_db = $flow['db'];
                    $cur_ub = $flow['ub'];
                    break;
                }
            }

            $delta_ub = $cur_ub - $prev_ub;
            // traffic flow resetted
            if($delta_ub < 0){ $delta_ub = $cur_ub;}
            $delta_db = $cur_db - $prev_db;
            if($delta_db < 0){ $delta_db = $cur_db; }

            $total_ub = $total_ub + $delta_ub;
            $total_db = $total_db + $delta_db;

            $client_qos[$key]['total_ub'] = $total_ub;
            $client_qos[$key]['total_db'] = $total_db;


            $client_qos[$key]['prev_ub'] = $cur_ub;
            $client_qos[$key]['prev_db'] = $cur_db;            

            $client_qos[$key]['update_time'] = $update_time;

            //###########################################################################
            //check traffic
            $should_limit = false;
            if($upload_limit > 0)
            {
                if(($total_ub / 1000000) > $upload_limit) {
                    $should_limit = true;
                }
            }
            if($download_limit > 0)
            {
                if(($total_db / 1000000) > $download_limit){
                    $should_limit = true;
                }
            }

            if($should_limit == true)
            {
                $client_qos[$key]['limit_status'] = true;
            }
            else
            {
                $client_qos[$key]['limit_status'] = false;
            }
            //############################################################################
            //reset
            if($month_begin > $reset_time)
            {
                $client_qos[$key]['reset_time'] = $update_time;
                $client_qos[$key]['total_db'] = 0;
                $client_qos[$key]['total_ub'] = 0;
                $client_qos[$key]['limit_status'] = false;
            }

            //############################################################################
            //apply
            if($reset_flag != $client_qos[$key]['limit_status'] )
            {
                set_qos_limit($mac, $client_qos[$key]['limit_status']);
            }
        }
        echo json_encode($client_qos);

        file_put_contents($CLIENT_QOS_PATH, json_encode($client_qos));
    }

}
else if($method == "SET")
{
    if($action == "quantity_qos_list")
    {
        $json_text = file_get_contents('php://input', true);
        $data  = json_decode($json_text, true);
        $mac = $data['mac'];
        $download_limit = $data['download_limit'];
        $upload_limit = $data['upload_limit'];

        $str_client_qos = file_get_contents($CLIENT_QOS_PATH);
        $client_qos = json_decode($str_client_qos, true);

        $found = false;
        foreach($client_qos as $k=>$qos)
        {
            if($qos['mac'] == $mac)
            {
                $found = true;
                $client_qos[$k]['download_limit'] = $download_limit;
                $client_qos[$k]['upload_limit'] = $upload_limit;
                break;
            }
        }

        if($found == false)
        {
            $client_qos[] = array('mac'=>$mac, 'download_limit'=>$download_limit, 'upload_limit'=>$upload_limit);
        }

        file_put_contents($CLIENT_QOS_PATH, json_encode($client_qos));
        /**
         * {'mac': '11:22:33:44:55:66', 'download_limit': 1000, 'upload_limit': 1000 }
         */

        header("Content-Type: application/json");
        $response = array("errCode"=>0);
        echo json_encode($response);
    }
    else if($action == "client_info2")
    {
        $json_text = file_get_contents('php://input', true);
        $data  = json_decode($json_text);
        $data->mac = strtolower($data->mac);
        $cmd = sprintf("uci show dhcp_client | grep .macaddr='%s' | cut -d [ -f 2 | cut -d ] -f 1 ", $data->mac);
        $id = shell_exec($cmd);
        
        $id = str_clean($id);
        if($id == "")
        {
            shell_exec("uci add dhcp_client rule");
            $cmd = sprintf("uci set dhcp_client.@rule[-1].macaddr='%s'", $data->mac);
            shell_exec($cmd);
            $cmd = sprintf("uci set dhcp_client.@rule[-1].alias='%s'", $data->remark);
            shell_exec($cmd);
        }
        else
        {
            $cmd = sprintf("uci set dhcp_client.@rule[%s].alias='%s'", $id,  $data->remark);
            shell_exec($cmd);
        }

        shell_exec("uci commit dhcp_client");

        $response = array("errCode"=>0);

        header("Content-Type: application/json");
        echo json_encode($response);
    }
}
?>
