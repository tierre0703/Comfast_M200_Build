#!/usr/bin/php-cgi
<?php
error_reporting(0);
$CONFIG_PATH =  "/www-comfast/cgi-php/access_config";
$method = !empty($_GET["method"]) ? $_GET["method"] : "";
$action = !empty($_GET["action"]) ? $_GET["action"] : "";

function get_arp_table()
{
    $cmd = sprintf('arp -a | grep -e "0x2"');
    //$arp_data = shell_exec("arp -a");
    $arp_data = shell_exec("cat /proc/net/arp");
    //echo urlencode($arp_data);
    $arp_array = explode("\n", $arp_data);
    $mac_array = array();
    foreach($arp_array as $arp_idx => $arp_val)
    {
        $arp_tokens = preg_split('/\s+/', $arp_val);
        if(count($arp_tokens) < 5) continue;
        $mac_addr = $arp_tokens[3];
        if(preg_match('/^([a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2}$/', $mac_addr) != 1) continue;
        if($mac_addr == "00:00:00:00:00:00") continue;
        $arp_ip = $arp_tokens[0];
        $arp_ip = str_replace("(", "", $arp_ip);
        $arp_ip = str_replace(")", "", $arp_ip);
        $mac_array[$arp_ip] = $mac_addr; 
    }
    return $mac_array;
}

function find_mac_addr($target_ip)
{
    if($target_ip == "") return "";
    $cmd = sprintf("ping %s -c 1", $target_ip);
    shell_exec($cmd);
    //arp parsing
    $cmd = sprintf('arp -a | grep -e "0x2"');
    //$arp_data = shell_exec("arp -a");
        $arp_data = shell_exec("cat /proc/net/arp");

    //echo urlencode($arp_data);
    
    $arp_array = explode("\n", $arp_data);
    $mac_array = array();
    foreach($arp_array as $arp_idx => $arp_val)
    {
        $arp_tokens = preg_split('/\s+/', $arp_val);
        if(count($arp_tokens) < 5) continue;
        $mac_addr = $arp_tokens[3];
        if(preg_match('/^([a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2}$/', $mac_addr) != 1) continue;
        if($mac_addr == "00:00:00:00:00:00") continue;

        $arp_ip = $arp_tokens[0];
        $arp_ip = str_replace("(", "", $arp_ip);
        $arp_ip = str_replace(")", "", $arp_ip);
        if($arp_ip == $target_ip)
            return $mac_addr;
    }
    return "";
}


//rule for one device
function write_access_control_device($target_ip, $bAllow)
{
    //invalid ip
    if($target_ip == "") return false;
    $cmd = sprintf("ping %s -c 1", $target_ip);
    shell_exec($cmd);
    //arp parsing
    $cmd = sprintf('arp -a | grep -e "0x2"');
    //$arp_data = shell_exec("arp -a");
        $arp_data = shell_exec("cat /proc/net/arp");

    //echo urlencode($arp_data);
    
    $arp_array = explode("\n", $arp_data);
    $mac_array = array();
    foreach($arp_array as $arp_idx => $arp_val)
    {
        $arp_tokens = preg_split('/\s+/', $arp_val);
        if(count($arp_tokens) < 5) continue;
        $mac_addr = $arp_tokens[3];
        if(preg_match('/^([a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2}$/', $mac_addr) != 1) continue;
        if($mac_addr == "00:00:00:00:00:00") continue;

        $arp_ip = $arp_tokens[0];
        $arp_ip = str_replace("(", "", $arp_ip);
        $arp_ip = str_replace(")", "", $arp_ip);
        $mac_array[$arp_ip] = $mac_addr; 
    }

    $mac_addr = "";

    

    if(!empty($mac_array[$target_ip]))
    {
        $mac_addr = $mac_array[$target_ip];
    }
    else
    {
        //invalid mac addr
        return false;
    }

    if($bAllow == 0)
    {
        $cmd = sprintf("iptables -L -n | grep DROP | grep %s", strtoupper($mac_addr));
        $del_cmd = shell_exec($cmd);
        if($del_cmd == "")
        {
            //first time
            $cmd = sprintf("iptables -I FORWARD -m mac --mac-source %s -j DROP", strtoupper($mac_addr));
            shell_exec($cmd);
            //echo sprintf("ip block %s [%s]\n", $target_ip, $mac_addr);
        }
        else
        {
            //
           // echo sprintf("ip DROP rule already exists %s\n", $mac_addr);
        }

    }
    else if($bAllow == 1)
    {
        $cmd = sprintf("iptables -D FORWARD -m mac --mac-source %s -j DROP 2>&1", strtoupper($mac_addr));
        $del_cmd = shell_exec($cmd);
        
        //echo sprintf("ip allow %s [%s]\n", $target_ip, $mac_addr);
    }
    return true;
}


function write_access_control()
{
    $CONFIG_PATH =  "/www-comfast/cgi-php/access_config";
    //read setting
    if(!file_exists($CONFIG_PATH))
    {
        exit(0);
    }


    //arp parsing
    $cmd = sprintf('arp -a | grep -e "0x2"');
    //$arp_data = shell_exec("arp -a");
    $arp_data = shell_exec("cat /proc/net/arp");

    //echo urlencode($arp_data);
    
    $arp_array = explode("\n", $arp_data);
    $mac_array = array();
    foreach($arp_array as $arp_idx => $arp_val)
    {
        $arp_tokens = preg_split('/\s+/', $arp_val);
        if(count($arp_tokens) < 5) continue;

        $mac_addr = $arp_tokens[3];

        if($mac_addr == "00:00:00:00:00:00") continue;
        $arp_ip = $arp_tokens[0];
        $arp_ip = str_replace("(", "", $arp_ip);
        $arp_ip = str_replace(")", "", $arp_ip);
        $mac_array[$arp_ip] = $mac_addr; 
    }

    //var_dump($mac_array);


    $access_config = file_get_contents($CONFIG_PATH);
    $config = json_decode($access_config);
    //apply rule
    foreach($config->access_config as $key=>$section)
    {
        //check if device exists
        if(!empty($section->devices))
        {
            foreach($section->devices as $device_index => $device_info)
            {
            
                // should be blocked
                if($device_info->status == 0)
                {
                    if($device_info->ip == "") continue;

                    if(empty($mac_array[$device_info->ip])) continue;

                    $mac_addr = $mac_array[$device_info->ip];
                    if($config->access_config[$key]->devices[$device_index]->mac_addr == "")
                     $config->access_config[$key]->devices[$device_index]->mac_addr == $mac_addr;

                    $cmd = sprintf("iptables -L -n | grep DROP | grep %s", strtoupper($mac_addr));
                    $del_cmd = shell_exec($cmd);
                    echo $del_cmd;

                    if($del_cmd == "")
                    {
                        //first time
                        $cmd = sprintf("iptables -I FORWARD -m mac --mac-source %s -j DROP", strtoupper($mac_addr));
                        shell_exec($cmd);
                        echo sprintf("ip block %s [%s]\n", $device_info->ip, $mac_addr);
                    }
                    else
                    {
                        //
                        echo sprintf("ip DROP rule already exists %s\n", $mac_addr);
                    }

                }
                else if($device_info->status == 1)
                {
                    
                    if($device_info->ip == "") continue;

                    if(empty($mac_array[$device_info->ip])) continue;

                    $mac_addr = $mac_array[$device_info->ip];
                    if($config->access_config[$key]->devices[$device_index]->mac_addr == "")
                        $config->access_config[$key]->devices[$device_index]->mac_addr == $mac_addr;
                    
                    $cmd = sprintf("iptables -D FORWARD -m mac --mac-source %s -j DROP 2>&1", strtoupper($mac_addr));
                    $del_cmd = shell_exec($cmd);
                    
                    echo sprintf("ip allow %s [%s]\n", $device_info->ip, $mac_addr);
                
                }
            }
        }
    }
}



if($method == "GET")
{
    if($action == "load_data")
    {

        header("Content-type: application/json");

        if(!file_exists($CONFIG_PATH))
        {
            $data = array("access_config"=>[]);
            file_put_contents($CONFIG_PATH, json_encode($data));
        }
        $access_config = json_decode(file_get_contents($CONFIG_PATH));

        $mac_array = get_arp_table();

        

        foreach($access_config->access_config as $key=>$value)
        {
            if(empty($value->devices)) continue;

            foreach($value->devices as $device_key=>$device_info)
            {
                if(empty($device_info->ip) || $device_info->ip == "")
                    continue;

                if(empty($device_info->mac_addr) || $device_info->mac_addr == "")
                {
                    if(!empty($mac_array[$device_info->ip]))
                    {
                        //$access_config->access_config[$key]->devices[$device_key]->mac_addr = find_mac_addr($device_info->ip);
                        $access_config->access_config[$key]->devices[$device_key]->mac_addr = $mac_array[$device_info->ip];
                    }
                }
            }
        }

        file_put_contents($CONFIG_PATH, json_encode($access_config));

        $data = array("errCode"=>0, "access_config"=>$access_config->access_config);
        echo json_encode($data);
        
    }
}
else if($method == "SET")
{
    if($action == "apply_access_control")
    {
        write_access_control();
    }

    else if($action == "save_device_data")
    {
        $json_text = file_get_contents('php://input', true);
        $req_data = json_decode($json_text);
        $errCode = 0;


        $access_config_data = file_get_contents($CONFIG_PATH);
        $access_config = json_decode($access_config_data);
        $section_real_num = intval($req_data->section_real_num);

        if($req_data->operate == "add")
        {
            $desc = $req_data->desc;
            $status = $req_data->status;
            $ip = $req_data->ip;

            $access_config->access_config[$section_real_num]->devices[] = array(
                "ip"=>$ip,
                "desc"=>$desc,
                "status"=>$status,
                "mac_addr"=>find_mac_addr($ip)
            );

            if(write_access_control_device($ip, ($status==1) ? true:false) == false)
                $errCode = "Target IP not found";

        }
        else if($req_data->operate == "del")
        {
            $real_nums = explode(",", $req_data->device_real_num);
            foreach($real_nums as $key=>$real_num)
            {
                if($real_num == "") continue;
                $device_num = intval($real_num);
                $status = $access_config->access_config[$section_real_num]->devices[$device_num]->status;
                $ip = $access_config->access_config[$section_real_num]->devices[$device_num]->ip;

                // allow all deleting devices
                write_access_control_device($req_data->ip, true);
                
                unset($access_config->access_config[$section_real_num]->devices[$device_num]);
            }
            $access_config->access_config[$section_real_num]->devices = array_values($access_config->access_config[$section_real_num]->devices);
        }
        else if($req_data->operate == "edit")
        {
            $device_real_num = intval($req_data->device_real_num);
            $access_config->access_config[$section_real_num]->devices[$device_real_num]->ip = $req_data->ip;
            $access_config->access_config[$section_real_num]->devices[$device_real_num]->desc = $req_data->desc;
            $access_config->access_config[$section_real_num]->devices[$device_real_num]->status = $req_data->status;
            if(empty($access_config->access_config[$section_real_num]->devices[$device_real_num]->mac_addr) ||
                $access_config->access_config[$section_real_num]->devices[$device_real_num]->mac_addr == "")
                $access_config->access_config[$section_real_num]->devices[$device_real_num]->status = find_mac_addr($req_data->ip);

            if(!write_access_control_device($req_data->ip, ($req_data->status==1) ? true:false))
            {
                $errCode = "Target IP not found";
            }

        }
        file_put_contents($CONFIG_PATH, json_encode($access_config));

        header("Content-type: application/json");
        $data = array("errCode"=>$errCode);
        echo json_encode($data);

    }
    else if($action == "save_data")
    {
        $json_text = file_get_contents('php://input', true);
        $req_data = json_decode($json_text);
        $errCode = 0;


        $access_config_data = file_get_contents($CONFIG_PATH);
        $access_config = json_decode($access_config_data);

        if($req_data->operate == "add")
        {
            $section_name = $req_data->section_name;
            $access_config->access_config[] =  array("section_name"=>$section_name);
        }
        else if($req_data->operate == "edit")
        {
            $real_num = intval($req_data->real_num);
            $section_name = $req_data->section_name;
            $access_config->access_config[$real_num]->section_name = $section_name; 
            
        }
        else if($req_data->operate == "del")
        {
            $real_nums = explode(",", $req_data->real_num);

            foreach($real_nums as $key=>$real_num)
            {
                if($real_num == "") continue;
                unset($access_config->access_config[$real_num]);
            }
            $access_config->access_config = array_values($access_config->access_config);
        }

        file_put_contents($CONFIG_PATH, json_encode($access_config));



        header("Content-type: application/json");
        $data = array("errCode"=>$errCode);
        echo json_encode($data);
    }
}
