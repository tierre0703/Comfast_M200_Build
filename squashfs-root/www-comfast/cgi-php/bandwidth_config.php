#!/usr/bin/php-cgi
<?php
error_reporting(0);
$CONFIG_PATH =  "/etc/config/bandwidth_config";
$method = !empty($_GET["method"]) ? $_GET["method"] : "";
$action = !empty($_GET["action"]) ? $_GET["action"] : "";

/**
 * $CONFIG_PATH
 * Bandwidth Management Configuration json
 * 
 * file name 
 * {
 * bm_info: 0|1
 * bm_data: [
 *  
 * ]
 * }
 */

 function str_clean($str)
 {
    $remove_character = array("\n", "\r\n", "\r");
    $str = str_replace($remove_character , '', trim($str));
     return $str;
 }

 function set_cron($config_data)
 {
     /* test
    $CONFIG_PATH =  "/www-comfast/cgi-php/bandwidth_config";
    $data = file_get_contents($CONFIG_PATH);
    $json_data = json_decode($data);
    $config_data = $json_data;
    var_dump($config_data);
    */
    $timediff = shell_exec("date +%z");
    $timediff = intval($timediff) / 100 * 60;

    
     $tmp_cron_file = "/www-comfast/cgi-php/tmp_cron";
     $bm_enabled = $config_data->bm_enabled;
     foreach($config_data->wan_data as $wan_index=>$wan_info)
     {
         $schedule_time = $wan_info->schedule_time + $timediff;
         $hours = $schedule_time / 60;
         $minutes = $schedule_time % 60;         

         /*
            crontab -l > mycron
            #echo new cron into cron file
            echo "00 09 * * 1-5 echo hello" >> mycron
            #install new cron file
            crontab mycron
            rm mycron
        */
        if($bm_enabled == 0 || $wan_info->isAutocheck == 0)
        {
            $ifname = $wan_info->ifname;
            $conf_wan_name = ($ifname == "wan") ? "wan0" : $ifname;
            //$cmd = sprintf("crontab - l | grep -v \"%s\"", "speedtestd start " . $conf_wan_name);
            //$cron_ret = shell_exec($cmd);
            //file_put_contents($tmp_cron_file, $cron_ret );
            
            $cmd = sprintf("crontab -l | grep -v \"%s\" > %s", "speedtestd start " . $conf_wan_name, $tmp_cron_file);
            shell_exec($cmd);

            $cmd = sprintf("crontab %s", $tmp_cron_file);
            //echo $cmd."<br/>";
            shell_exec($cmd);
            $cmd = sprintf("rm %s", $tmp_cron_file);
            //echo $cmd."<br/>";
            shell_exec($cmd);
            

        }
        else if($wan_info->isAutocheck == 1)
         {
            $ifname = $wan_info->ifname;
            $conf_wan_name = ($ifname == "wan") ? "wan0" : $ifname;
            $cmd = sprintf("crontab -l | grep -v \"%s\" > %s", "speedtestd start " . $conf_wan_name, $tmp_cron_file);
            shell_exec($cmd);
            $cron_str = file_get_contents($tmp_cron_file);
            
            $arr = explode("\n", $cron_str);
            $cron_str = "";
            foreach($arr as $k=>$line)
            {
				$line = str_clean($line);
                if($line == "") continue;
                if($line[0] == "#") continue;
                $cron_str = $cron_str . $line . "\n";
            }
            $add_info = sprintf("%d %d * * * /etc/speedtestd start %s \n",  $minutes, $hours, $conf_wan_name);
            $cron_str = "#\n" . $cron_str;
            $cron_str =  $cron_str . $add_info;
            $cron_str = $cron_str . "#\n";
            file_put_contents($tmp_cron_file, $cron_str);

            $cmd = sprintf("crontab %s", $tmp_cron_file);
            //echo $cmd."<br/>";
            shell_exec($cmd);
            $cmd = sprintf("rm %s", $tmp_cron_file);
            //echo $cmd."<br/>";
            shell_exec($cmd);


         }
    }
    shell_exec('/etc/init.d/cron restart');
}

 function delete_ip_rule($subnet)
 {
     $cmd = sprintf("ip rule show | grep %s | grep wan", $subnet);
     $ret = shell_exec($cmd);
     $ret_arr = explode("\n", $ret);
     foreach($ret_arr as $key => $val)
     {
         $val = str_clean($val);
         $val = substr($val, strpos($val, "from "));
         if($val == "") continue;
         $cmd = sprintf("ip rule delete %s", $val);
        
         shell_exec($cmd);
     }
 }


 
function func_set_config($data)
{
    $CONFIG_PATH =  "/etc/config/bandwidth_config";
    file_put_contents($CONFIG_PATH, $data);
    $json_data = json_decode($data);


    foreach($json_data->save_data as $key=>$value)
    {
        $id = $value->bm_id;
        $wan = $value->bm_wan;
        $ubus_wan = $wan == "wan0" ? "wan" : $wan;  
        $br_wan = $value->bm_br_wan;
        $lansubnet = $value->bm_lansubnet;
   
        //disable all setting
        //$cmd = sprintf("while ip rule delete from %s 2>/dev/null; do true; done", $lansubnet);
        //shell_exec($cmd);
        delete_ip_rule($lansubnet);

        if($json_data->bm_enabled == 1)
        {
            //func_set_routing($id, $wan, $ubus_wan, $br_wan, $lansubnet);
            $cmd =sprintf("ubus call network.interface.%s status | jsonfilter -e '@.route[*].nexthop' | grep -v '0.0.0.0'", $ubus_wan);

            //$cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"route\"][1].nexthop'", $ubus_wan);
            $nexthop = shell_exec($cmd);
            $nexthop = trim($nexthop);
            $nexthop = str_clean($nexthop);
            //if($nexthop == "") {
            //    $cmd =sprintf("ubus call network.interface.%s status | jsonfilter -e '@.route[*].nexthop' | grep -v '0.0.0.0'", $ubus_wan);

				//$cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"route\"][0].nexthop'", $ubus_wan);
			//	$nexthop = shell_exec($cmd);
			//	$nexthop = trim($nexthop);
			//	$nexthop = str_clean($nexthop);
				
			//}
            $cmd = sprintf("grep -q %s /etc/iproute2/rt_tables || echo %s %s >>/etc/iproute2/rt_tables", $wan, $id, $wan);
            shell_exec($cmd);
            $cmd = sprintf("ip rule add from %s table %s", $lansubnet, $wan);
            shell_exec($cmd);
            $cmd = sprintf("ip route replace default via %s dev br-%s table %s", $nexthop, $br_wan, $wan);
            shell_exec($cmd);
            shell_exec("ip route flush cache");


            // set allocation rate
        }
    }
}


function func_get_config()
{

    $CONFIG_PATH =  "/etc/config/bandwidth_config";
    if(!file_exists($CONFIG_PATH) || filesize($CONFIG_PATH) == 0)
    {
        file_put_contents($CONFIG_PATH, '{"bm_enabled": 1, "bm_data": []}');
    }
    $data = file_get_contents($CONFIG_PATH);
    return $data;
}


function func_set_routing($id, $wan, $ubus_wan, $br_wan, $lansubnet)
{
    //uci show network | grep '.src=${lansubnet}' | cut -d [ -f 2 | cut -d ] -f 1

    //echo 'uci show network | grep \'.src=${lansubnet}\' | cut -d [ -f 2 | cut -d ] -f 1';
    //echo 'uci show network | grep \'.src=${lansubnet}\' | cut -d [ -f 2 | cut -d ] -f 1';
    $cmd = sprintf('uci show network | grep \'.src=%s\' | cut -d [ -f 2 | cut -d ] -f 1', $lansubnet);
    $rule_num = shell_exec($cmd);
    $rule_num = str_clean($rule_num);
    //$route_num = shell_exec('uci show network | grep \'.src="${lansubnet}"\' | cut -d. -f1-2');

    //echo $route_num;
    if($wan == "" || $br_wan == "" )
    {
        //get number
        if($rule_num == "")
        {

        }
        else
        {
        //delete rule
            $cmd = sprintf("uci delete network.@rule[%s].lookup 2>/dev/null", $rule_num);
            shell_exec($cmd);
            $cmd = sprintf("uci delete network.@rule[%s].src 2>/dev/null", $rule_num);
            shell_exec($cmd);
            $cmd = sprintf("uci delete network.@rule[%s] 2>/dev/null", $rule_num);
            shell_exec($cmd);
        }
    }
    else
    {

        //$cmd = sprintf("grep -q %s /etc/iproute2/rt_tables || echo %s %s >>/etc/iproute2/rt_tables", $wan, $id, $wan);
        //shell_exec($cmd);

        if($rule_num == "")
        {
            
            shell_exec('uci add network rule');
            $cmd = sprintf("uci set network.@rule[-1].lookup=%s", $wan);
            shell_exec($cmd);
            $cmd = sprintf("uci set network.@rule[-1].src=%s", $lansubnet);
            shell_exec($cmd);
            /*
            uci add network rule
            uci set network.@rule[-1].lookup='wan0' #'200'
            uci set network.@rule[-1].src='10.10.10.0/24'
            */
        }
        else
        {
            $cmd = sprintf("uci set network.@rule[%s].lookup=%s", $rule_num, $wan);
            shell_exec($cmd);
            $cmd  = sprintf("uci set network.@rule[%s].src=%s", $rule_num, $lansubnet);
            shell_exec($cmd);
            //shell_exec('uci set network.@rule[-1].dev="br-wan3"');
        }

        
        /*
        ip route replace default via 192.168.50.1 dev br-wan1 table wan1

        $cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"route\"][1].nexthop'", $ubus_wan);
        $nexthop = shell_exec($cmd);
        $nexthop = trim($nexthop);
        $nexthop = str_replace('\r\n', '', $nexthop);
        $nexthop = str_replace('\n', '', $nexthop);

        //$cmd = sprintf("ip route replace default via %s dev br-%s table %s", $nexthop, $br_wan, $wan);
        //shell_exec($cmd);
        //ip route replace default via 10.100.100.1 dev br-wan table wan0
        if($route_num == "")
        {

        }
        else
        {
           // shell_exec(uci add network route

        }
        uci set network.@route[-1].interface=br-wan
        uci set network.@route[-1].table=wan0 # '200'
        uci set network.@route[-1].gateway='10.100.100.1'
        */


    }


}

function func_set_routing_temp($id, $wan, $ubus_wan, $br_wan, $lansubnet)
{

    if($wan == "" || $br_wan == "")
    {
        //delete from ip rule
        //$cmd = sprintf("ip rule delete from %s", $lansubnet);
        $cmd = sprintf("while ip rule delete from %s 2>/dev/null; do true; done", $lansubnet);
        shell_exec($cmd);
    }
    else
    {
        $cmd = sprintf("while ip rule delete from %s 2>/dev/null; do true; done", $lansubnet);
        shell_exec($cmd);

        $cmd =sprintf("ubus call network.interface.%s status | jsonfilter -e '@.route[*].nexthop' | grep -v '0.0.0.0'", $ubus_wan);

        //$cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"route\"][1].nexthop'", $ubus_wan);
        $nexthop = shell_exec($cmd);
        $nexthop = str_clean($nexthop);
        
        //if($nexthop == "") {
		//	$cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"route\"][0].nexthop'", $ubus_wan);
		//	$nexthop = shell_exec($cmd);
		//	$nexthop = str_clean($nexthop);
			
		//}
        echo $nexthop;
        $cmd = sprintf("grep -q %s /etc/iproute2/rt_tables || echo %s %s >>/etc/iproute2/rt_tables", $wan, $id, $wan);
        shell_exec($cmd);
        $cmd = sprintf("ip rule add from %s table %s", $lansubnet, $br_wan, $wan);
        echo $cmd;
        shell_exec($cmd);
        $cmd = sprintf("ip route replace default via %s dev br-%s table %s", $nexthop, $br_wan, $wan);
        echo $cmd;
        shell_exec($cmd);
        shell_exec("ip route flush cache");
    }
}


/**
 * Execute a command and return it's output. Either wait until the command exits or the timeout has expired.
 *
 * @param string $cmd     Command to execute.
 * @param number $timeout Timeout in seconds.
 * @return string Output of the command.
 * @throws \Exception
 */
function exec_timeout($cmd, $timeout) {
    // File descriptors passed to the process.
    $descriptors = array(
      0 => array('pipe', 'r'),  // stdin
      1 => array('pipe', 'w'),  // stdout
      2 => array('pipe', 'w')   // stderr
    );
  
    // Start the process.
    $process = proc_open('exec ' . $cmd, $descriptors, $pipes);
  
    if (!is_resource($process)) {
      throw new \Exception('Could not execute process');
    }
  
    // Set the stdout stream to non-blocking.
    stream_set_blocking($pipes[1], 0);
  
    // Set the stderr stream to non-blocking.
    stream_set_blocking($pipes[2], 0);
  
    // Turn the timeout into microseconds.
    $timeout = $timeout * 1000000;
  
    // Output buffer.
    $buffer = '';
  
    // While we have time to wait.
    while ($timeout > 0) {
      $start = microtime(true);
  
      // Wait until we have output or the timer expired.
      $read  = array($pipes[1]);
      $other = array();
      stream_select($read, $other, $other, 0, $timeout);
  
      // Get the status of the process.
      // Do this before we read from the stream,
      // this way we can't lose the last bit of output if the process dies between these functions.
      $status = proc_get_status($process);
  
      // Read the contents from the buffer.
      // This function will always return immediately as the stream is non-blocking.
      $buffer .= stream_get_contents($pipes[1]);
  
      if (!$status['running']) {
        // Break from this loop if the process exited before the timeout.
        break;
      }
  
      // Subtract the number of microseconds that we waited.
      $timeout -= (microtime(true) - $start) * 1000000;
    }
  
    // Check if there were any errors.
    $errors = stream_get_contents($pipes[2]);
  
    if (!empty($errors)) {
      throw new \Exception($errors);
    }
  
    // Kill the process in case the timeout expired and it's still running.
    // If the process already exited this won't do anything.
    proc_terminate($process, 9);
  
    // Close all streams.
    fclose($pipes[0]);
    fclose($pipes[1]);
    fclose($pipes[2]);
  
    proc_close($process);
  
    return $buffer;
  }


//post Data

if($method == "GET")
{
    if($action == "lan_list")
    {
        $lan_list = array();
        $str_lans = shell_exec("ubus list | grep network.interface.lan | cut -d . -f 3");
        $lans = explode("\n", $str_lans);
        foreach($lans as $k=>$lan)
        {
            $lan = str_clean($lan);

            if($lan == "") continue;

            $cmd = sprintf("uci get network.%s.hostname 2>/dev/null", $lan);
            $hostname = shell_exec($cmd);
            $hostname = str_clean($hostname);

            $cmd = sprintf("uci get network.%s.ipaddr 2>/dev/null", $lan);
            $ipaddr = shell_exec($cmd);
            $ipaddr = str_clean($ipaddr);

            $cmd = sprintf("uci get network.%s.netmask 2>/dev/null", $lan);
            $netmask = shell_exec($cmd);
            $netmask = str_clean($netmask);

            $lan_list[] = array("ifname"=>$lan, "hostname"=>$hostname, "ipaddr"=>$ipaddr, "netmask"=>$netmask);
        }
        header("Content-type: application/json");
        echo json_encode($lan_list);
    }
    else if($action == "bm_config")
    {
        header("Content-type: application/json");
        if(!file_exists($CONFIG_PATH) || filesize($CONFIG_PATH) == 0)
        {
            $bm_info = array("bm_enabled"=>1, "save_data"=>[]);
            file_put_contents($CONFIG_PATH, json_encode($bm_info));
        }
        echo file_get_contents($CONFIG_PATH);
    }
    else if($action == "ip_route")
    {
        header("Content-Type: application/json");
        $ip_route_result = shell_exec("ip route | grep default via");
        if(is_null($ip_route_result))
            $ip_route_result = "";

        $json_data = array("ip_route_result"=> $ip_route_result);
        echo json_encode($json_data);
    }
    else if($action == "ip_rule")
    {
        header("Content-Type: application/json");
        $ip_rule_result = shell_exec("ip rule | grep wan");
        $json_data = array("ip_rule_result"=> $ip_rule_result);
        echo json_encode($json_data);
    }
    else if($action == "bandwidth_speed")
    {
        header("Content-Type: application/json");
        $speed_array[] = array();
        for($i = 0; $i < 100; $i++) //never exceed 100 wans
        {
            $cmd = sprintf("uci get speedtest.@rule[%d].wan_name 2>/dev/null", $i);
            $cmd_ret = shell_exec($cmd);
            $wan_name = str_clean($cmd_ret);
            if(strpos($cmd_ret, "Entry not found") != false || $wan_name == "")
            {
                break;
            }
            $cmd = sprintf("uci get speedtest.@rule[%d].rx_rate 2>/dev/null", $i);
            $rx_rate = shell_exec($cmd);
            $rx_rate = str_clean($rx_rate);
            $cmd = sprintf("uci get speedtest.@rule[%d].tx_rate 2>/dev/null", $i);
            $tx_rate = shell_exec($cmd);
            $tx_rate = str_clean($tx_rate);
            $cmd = sprintf("uci get speedtest.@rule[%d].test_time 2>/dev/null", $i);
            $test_time = shell_exec($cmd);
            $test_time = str_clean($test_time);
            $speed_array[] = array(
                "test_time"=>$test_time,
                "wan_name"=>$wan_name,
                "rx_rate"=>$rx_rate,
                "tx_rate"=>$tx_rate
            );
        }
        echo json_encode($speed_array);
    }
    else if($action == "bandwidth_speedtest")
    {
        $IPERF_HOST_NAME="bouygues.iperf.fr";
        $IPERF_HOST_IP = "89.84.1.222";
        $IPERF_PORT_FROM=9201;
        $IPERF_PORT_END=9222;
        $json_text = file_get_contents('php://input', true);
        $data  = json_decode($json_text);
        $wan_name = $data->wan_name;

        $rx_rate = 0;
        $tx_rate = 0;



        header("Content-Type: application/json");

        $cmd =sprintf("ubus call network.interface.%s status | jsonfilter -e '@.route[*].nexthop' | grep -v '0.0.0.0'", $wan_name);

        //$cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"route\"][1].nexthop'", $wan_name);
        $nexthop = shell_exec($cmd);
        $nexthop = str_clean($nexthop);
        
        //if($nexthop == "") {
	    //    $cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"route\"][0].nexthop'", $wan_name);
		//	$nexthop = shell_exec($cmd);
		//	$nexthop = str_clean($nexthop);
		//}

        $cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"ipv4-address\"][0].address'",$wan_name);
        $wan_ip = shell_exec($cmd);
        $wan_ip = str_clean($wan_ip);
        $cmd = sprintf("ping -q -c 1 -t 1 %s | grep PING | sed -e \"s/).*//\" | sed -e \"s/.*(//\"", $IPERF_HOST_NAME);
        $iperf_ip = shell_exec($cmd);
        $iperf_ip = str_clean( $iperf_ip);

		//$iperf_ip = $IPERF_HOST_IP;
        //set route

        
        //delete exist ip
        $cmd = sprintf("ip route | grep %s", $iperf_ip);
        $existing_routes = shell_exec($cmd);
        $routes = explode('\n', $existing_routes);
        foreach($routes as $route)
        {
            if($route != "")
            {
                $route = str_clean($route);
                $cmd = sprintf("ip route delete %s", $route);
                shell_exec($cmd);
            }
        }

        //set route
        $cmd = sprintf("ip route replace %s/32 via %s dev br-%s", $iperf_ip, $nexthop, $wan_name);
        shell_exec($cmd);

       
        if($iperf_ip != "" && $wan_ip != "")
        {
            for($iperf_port = $IPERF_PORT_FROM; $iperf_port <= $IPERF_PORT_END; $iperf_port++)
            {
                $cmd=sprintf("iperf3  -J -c %s -p %d -B %s -R",$iperf_ip, $iperf_port,  $wan_ip); 

                $iperf_result = exec_timeout($cmd, 30);


                //$iperf_result = shell_exec($cmd);
                $json_iperf = json_decode($iperf_result);

                if(!empty($json_iperf->error) && $json_iperf->error != "")
                {
                    //error found while iperf
                    continue;
                }

                //tx_rate=$(echo ${iperf_response} | jsonfilter -e '@["end"]["sum_sent"].bits_per_second')
                //rx_rate=$(echo ${iperf_response} | jsonfilter -e '@["end"]["sum_received"].bits_per_second')
                $tx_rate = !empty($json_iperf->end->sum_sent) ?number_format( $json_iperf->end->sum_sent->bits_per_second, 0, '', '') : 0;
                $rx_rate = !empty($json_iperf->end->sum_received) ? number_format($json_iperf->end->sum_received->bits_per_second,0, '', '') : 0;
                $tx_rate = intval($tx_rate / 1000000) * 1000;
                $rx_rate = intval($rx_rate / 1000000) * 1000;
                $test_time = time();

                
                $timediff = shell_exec("date +%z");
                $timediff = intval($timediff) / 100 * 60;
               // $test_time = $test_time - $timediff * 60;

                $conf_wan_name = $wan_name == "wan" ? "wan0" : $wan_name;

                $speedtest_conf = "/etc/config/speedtest";
                if(!file_exists($speedtest_conf))
                {
                    $cmd = sprintf("touch %s", $speedtest_conf);
                    shell_exec($cmd);
                }

                $cmd = sprintf("uci show speedtest | grep .wan_name=%s | cut -d [ -f 2 | cut -d ] -f 1", $conf_wan_name);
                $conf_index = shell_exec($cmd);
                $conf_index = str_clean($conf_index);
                if($conf_index == "")
                {
                    //new data
                    $cmd = sprintf("uci add speedtest rule");       shell_exec($cmd);
                    $cmd = sprintf("uci set speedtest.@rule[-1].wan_name=%s", $conf_wan_name); shell_exec($cmd);
                    $cmd = sprintf("uci set speedtest.@rule[-1].rx_rate=%d", $rx_rate); shell_exec($cmd);
                    $cmd = sprintf("uci set speedtest.@rule[-1].tx_rate=%d", $tx_rate); shell_exec($cmd);
                    $cmd = sprintf("uci set speedtest.@rule[-1].test_time=%s", $test_time); shell_exec($cmd);
                    shell_exec("uci commit speedtest");

                }
                else
                {
                    //existing data
                    $cmd = sprintf("uci set speedtest.@rule[%s].rx_rate=%d", $conf_index, $rx_rate); shell_exec($cmd);
                    $cmd = sprintf("uci set speedtest.@rule[%s].tx_rate=%d", $conf_index, $tx_rate); shell_exec($cmd);
                    $cmd = sprintf("uci set speedtest.@rule[%s].test_time=%s", $conf_index, $test_time); shell_exec($cmd);
                    shell_exec("uci commit speedtest");
                }

                $json_ret = array("test_time"=>$test_time, "tx_rate"=>$tx_rate, "rx_rate"=>$rx_rate);
                echo json_encode($json_ret);

                exit(0);

            }
        }
        $json_ret = array("test_time"=>time(),"tx_rate"=>$tx_rate, "rx_rate"=>$rx_rate);
        echo json_encode($json_ret);
        exit(0);
    
    }
    else if($action == "wan_speed")
    {
        header("Content-Type: application/json");

        $str_wan_list = shell_exec("ubus list | grep network.interface.wan | cut -d . -f 3");
        $wan_list = explode("\n", $str_wan_list);
        $json_data = array();


        if(count($wan_list) >  0)
        {
            //error no wan interface exists
            foreach($wan_list as $key=>$value)
            {
                if($value == "") continue;
                $wan_data = array();
                $wan_data['wan_ifname'] = $value;
                $wan_data['download_limit'] = 0;
                $wan_data['upload_limit'] = 0;
                $wan_data['rx_bytes'] = 0;
                $wan_data['tx_bytes'] = 0;
                $wan_data['last_time'] = 0;

                $conf_wan_name = $value == "wan" ? "wan0" : $value;
                $cmd = sprintf("uci show speedtest | grep .wan_name=%s | cut -d [ -f 2 | cut -d ] -f 1", $conf_wan_name);
                $conf_index = shell_exec($cmd);
                $conf_index = str_clean($conf_index);
                if($conf_index != "")
                {
                    $cmd = sprintf("uci get speedtest.@rule[%s].rx_rate 2>/dev/null", $conf_index);
                    $rx_rate = shell_exec($cmd);
                    $rx_rate = str_clean($rx_rate);
                    if($rx_rate == "")
                        $rx_rate = "0";
                    else
                        $rx_rate = $rx_rate;

                    $cmd = sprintf("uci get speedtest.@rule[%s].tx_rate 2>/dev/null", $conf_index);
                    $tx_rate = shell_exec($cmd);
                    $tx_rate = str_clean($tx_rate);
                    if($tx_rate == "")
                        $tx_rate = "0";
                    else
                        $tx_rate = $tx_rate;
                    $wan_data['download_limit'] = $rx_rate;
                    $wan_data['upload_limit'] = $tx_rate;
                }

                $cmd = sprintf("cat /sys/class/net/br-%s/statistics/rx_bytes", $value);
                $rx_bytes = shell_exec($cmd);
                $rx_bytes = str_clean($rx_bytes);
                if($rx_bytes == "")
                    $rx_bytes = "0";
                else
                    $rx_bytes = $rx_bytes;

                $wan_data['rx_bytes'] = $rx_bytes;

                $cmd = sprintf("cat /sys/class/net/br-%s/statistics/tx_bytes", $value);
                $tx_bytes = shell_exec($cmd);
                $tx_bytes = str_clean($tx_bytes);
                if($tx_bytes == "")
                    $tx_bytes = "0";
                else
                    $tx_bytes = $tx_bytes;

                $wan_data['tx_bytes'] = $tx_bytes;
                $wan_data['last_time'] = time();
    

                $json_data[] = $wan_data;
            }
        }

        echo json_encode($json_data);

    }

    else if($action == "wan_status")
    {
        header("Content-Type: application/json");

        $str_wan_list = shell_exec("ubus list | grep network.interface.wan | cut -d . -f 3");
        $wan_list = explode("\n", $str_wan_list);
        $json_data = array();


        if(count($wan_list) >  0)
        {
            //error no wan interface exists
            foreach($wan_list as $key=>$value)
            {
                $value = str_clean($value);
                if($value == "") continue;
                $wan_data = array();
                $wan_data['wan_ifname'] = $value;
                
                $cmd = sprintf("ubus call network.interface.%s status", $value);
                $str_wan_status = shell_exec($cmd);
                $wan_status = json_decode($str_wan_status);
                $wan_data['up'] = (!empty($wan_status->up)) ? $wan_status->up : false;

                //get pingcheck
                $cmd = sprintf("uci get pingcheck.%s.status 2>/dev/null", $value);
                $status = shell_exec($cmd);
                $status = str_clean($status);
                $wan_data['status'] = $status;

                $cmd = sprintf("uci get network.%s.ifname 2>/dev/null", $value);
                $ifname = shell_exec($cmd);
                $wan_data['ifname'] = str_clean($ifname);

                $json_data[] = $wan_data;
            }
        }

        $str_wan_list = shell_exec("ubus list | grep network.interface.lan | cut -d . -f 3");
        $wan_list = explode("\n", $str_wan_list);


        if(count($wan_list) >  0)
        {
            //error no wan interface exists
            foreach($wan_list as $key=>$value)
            {
                $value = str_clean($value);
                if($value == "") continue;
                $wan_data = array();
                $wan_data['wan_ifname'] = $value;
                
                $cmd = sprintf("ubus call network.interface.%s status", $value);
                $str_wan_status = shell_exec($cmd);
                $wan_status = json_decode($str_wan_status);
                $wan_data['up'] = (!empty($wan_status->up)) ? $wan_status->up : false;
                $cmd = sprintf("uci get network.%s.ifname 2>/dev/null", $value);
                $ifname = shell_exec($cmd);
                $wan_data['ifname'] = str_clean($ifname);
                
                $json_data[] = $wan_data;
            }
        }

        //link info

        $lan_speed = "";
        $wan_speed = "";

        $lan_duplex = "";
        $wan_duplex = "";

        $lan_status = "";
        $wan_status = "";



        $ret = shell_exec("swconfig dev switch0 show | grep link:");

        $link_tokens = explode("\n", $ret);

        $links = array();

        foreach($link_tokens as $k=>$v)
        {
            $v = str_clean($v);
            if($v == "") continue;
            //link: port:0 link:up speed:1000baseT full-duplex
            //link: port:1 link:down

            $port = "";
            $status = "";
            $speed = "";
            $optional = "";
            $duplex = "";
            $txflow = "";
            $rxflow = "";
            $auto = "";
            if(strstr($v, "speed:") != false)
            {
                sscanf($v, "link: port:%d link:%s speed:%d %[^[]]", $port, $status, $speed, $optional);
            }
            else
            {
                sscanf($v, "link: port:%d link:%s", $port, $status);
            }


            $port_name = "eth0." .($port+1);

            foreach($json_data as $key=>$value)
            {
                if($value['ifname'] == $port_name)
                {
                    $json_data[$key]['speed'] = $speed;
                    if($speed){
                    }else{
                        $json_data[$key]['up'] = false;
                    }
                }
            }
        }

        echo json_encode($json_data);
    }
}
else if($method == "SET")
{
    if($action == "speedtest_cron")
    {
        $IPERF_HOST_NAME="bouygues.iperf.fr";
        $IPERF_HOST_IP = "89.84.1.222";
        $IPERF_PORT_FROM=9201;
        $IPERF_PORT_END=9222;

        //iter wan_name
        $str_wan_list = shell_exec("ubus list | grep network.interface.wan | cut -d . -f 3");
        $t_wan_list = explode("\n", $str_wan_list);
        $wan_list = array(); 

        $target_wan_name = !empty($_GET["wan_name"]) ? $_GET["wan_name"] : "";
        $target_wan_name = $target_wan_name == "wan0" ? "wan" : $target_wan_name;

        $cmd =sprintf("ubus call network.interface.%s status | jsonfilter -e '@.route[*].nexthop' | grep -v '0.0.0.0'", $target_wan_name);

        //$cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"route\"][1].nexthop'", $target_wan_name);
        $nexthop = shell_exec($cmd);
        $nexthop = str_clean($nexthop);
        
        //if($nexthop == "") {
		//	$cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"route\"][0].nexthop'", $target_wan_name);
		//	$nexthop = shell_exec($cmd);
		//	$nexthop = str_clean($nexthop);
			
		//}


        if(count($t_wan_list) == 0)
        {
            //error no wan interface exists
            exit(0);
        }

        foreach($t_wan_list as $key=>$value)
        {
            if($value == "")
                continue;
            $wan_list[] = str_clean($value);
        }

        $speedtest_conf = "/etc/config/speedtest";
        if(!file_exists($speedtest_conf))
        {//speedtest file create
            $cmd = sprintf("touch %s", $speedtest_conf);
            shell_exec($cmd);
        }

        //get last tested wan name
        $target_wan = $target_wan_name == "" ? "" : $target_wan_name;

        if($target_wan == "")
        {
            $cur_wan = shell_exec("uci get speedtest.status.cur_wan 2>/dev/null");
            $cur_wan = str_clean($cur_wan);
            $cur_wan = $cur_wan == "wan0" ? "wan" : $cur_wan;
    
           
        
            if(strpos($cur_wan, "Entry not found") != false || $cur_wan == "")
            {
                shell_exec("uci set speedtest.status=status");
                shell_exec("uci commit speedtest");
                $target_wan = $wan_list[0];
            }
            else
            {
                foreach($wan_list as $key=>$value)
                {
                    if($value == $cur_wan)
                    {
                        $target_wan = $wan_list[($key + 1) % count($wan_list)];
                        break;
                    }
                }
    
                if($target_wan == "")
                {//exception wan list could not have the last wan name
                    $target_wan = $wan_list[0];
                }
            }
        }

        

        
        if($target_wan == "")
        {
            exit(0);
        }

        $target_wan = str_clean($target_wan);


        //ping test
        $cmd = sprintf("ubus call network.interface.%s status | jsonfilter -e '@[\"ipv4-address\"][0].address'",$target_wan);

        $wan_ip = shell_exec($cmd);
        $wan_ip = str_clean($wan_ip);
        echo urlencode($wan_ip) . "<br/>";

        $cmd = sprintf("ping -q -c 1 -t 1 %s | grep PING | sed -e \"s/).*//\" | sed -e \"s/.*(//\" 2>&1", $IPERF_HOST_NAME);

        $iperf_ip = shell_exec($cmd);
        $iperf_ip = str_clean($iperf_ip);
        //$iperf_ip = $IPERF_HOST_IP;
        echo urlencode($iperf_ip) . "<br/>";

        //delete exist ip
        $cmd = sprintf("ip route | grep %s", $iperf_ip);
        $existing_routes = shell_exec($cmd);
        $routes = explode('\n', $existing_routes);
        foreach($routes as $route)
        {
            if($route != "")
            {
                $route = str_clean($route);
                $cmd = sprintf("ip route delete %s", $route);
                shell_exec($cmd);

                echo urlencode($cmd) . "<br/>";
            }
        }

        //set route
        $cmd = sprintf("ip route replace %s/32 via %s dev br-%s", $iperf_ip, $nexthop, $target_wan);
        shell_exec($cmd);
        echo urlencode($cmd) . "<br/>";



        if($iperf_ip != "" && $wan_ip != "")
        {
            for($iperf_port = $IPERF_PORT_FROM; $iperf_port <= $IPERF_PORT_END; $iperf_port++)
            {
                $cmd=sprintf("iperf3 -J -B %s -c %s -p %d -R",  $wan_ip ,$iperf_ip, $iperf_port); 
                echo urlencode($cmd) . "<br/>";

                $iperf_result = exec_timeout($cmd, 30);

                //$iperf_result = shell_exec($cmd);

                echo $iperf_result . "<br/>";
                
                $json_iperf = json_decode($iperf_result);
                

                if(!empty($json_iperf->error) && $json_iperf->error != "")
                {
                    //error found while iperf
                    continue;
                }

                //tx_rate=$(echo ${iperf_response} | jsonfilter -e '@["end"]["sum_sent"].bits_per_second')
                //rx_rate=$(echo ${iperf_response} | jsonfilter -e '@["end"]["sum_received"].bits_per_second')
                $tx_rate = !empty($json_iperf->end->sum_sent) ?number_format( $json_iperf->end->sum_sent->bits_per_second, 0, '', '') : 0;
                $rx_rate = !empty($json_iperf->end->sum_received) ? number_format($json_iperf->end->sum_received->bits_per_second,0, '', '') : 0;
                $tx_rate = intval($tx_rate / 1000000) * 1000;
                $rx_rate = intval($rx_rate / 1000000) * 1000;

                $test_time = time();

                $timediff = shell_exec("date +%z");
                $timediff = intval($timediff) / 100 * 60;
                //$test_time = $test_time - $timediff * 60;


                echo "tx_rate " . $tx_rate . "<br/>";
                echo "rx_rate " . $rx_rate . "<br/>";
                echo "test_time " . $test_time . "<br/>";


                $conf_wan_name = $target_wan == "wan" ? "wan0" : $target_wan;



                //find existing conf
                $cmd = sprintf("uci show speedtest | grep .wan_name=%s | cut -d [ -f 2 | cut -d ] -f 1 2>&1", $conf_wan_name);
                
                $conf_index = shell_exec($cmd);
                $conf_index = str_clean($conf_index);
                if($conf_index == "")
                {
                    //new data
                    $cmd = sprintf("uci add speedtest rule");       shell_exec($cmd);
                    $cmd = sprintf("uci set speedtest.@rule[-1].wan_name=%s", $conf_wan_name); shell_exec($cmd);
                    $cmd = sprintf("uci set speedtest.@rule[-1].rx_rate=%d", $rx_rate); shell_exec($cmd);
                    $cmd = sprintf("uci set speedtest.@rule[-1].tx_rate=%d", $tx_rate); shell_exec($cmd);
                    $cmd = sprintf("uci set speedtest.@rule[-1].test_time=%s", $test_time); shell_exec($cmd);
                    shell_exec("uci commit speedtest");

                }
                else
                {
                    //existing data
                    $cmd = sprintf("uci set speedtest.@rule[%s].rx_rate=%d", $conf_index, $rx_rate); shell_exec($cmd);
                    $cmd = sprintf("uci set speedtest.@rule[%s].tx_rate=%d", $conf_index, $tx_rate); shell_exec($cmd);
                    $cmd = sprintf("uci set speedtest.@rule[%s].test_time=%s", $conf_index, $test_time); shell_exec($cmd);
                    shell_exec("uci commit speedtest");
                }

                // write current target_name to status
                $cmd = sprintf("uci set speedtest.status.cur_wan=%s", $conf_wan_name); 
                

                shell_exec($cmd);
                shell_exec("uci commit speedtest");


                $json_ret = array("test_time"=>$test_time, "tx_rate"=>$tx_rate, "rx_rate"=>$rx_rate);
                echo json_encode($json_ret);
                //======================================================================================
                // update speed allocation
                if(!file_exists($CONFIG_PATH))
                {
                    exit(0);
                }
                $config_data = file_get_contents($CONFIG_PATH);
                $json_config = json_decode($config_data);
                $wan_name = $target_wan;

                foreach($json_config->wan_data as $key=>$value)
                {
                    if($value->ifname == $wan_name && $value->isAutocheck == 1)
                    {
                        //set all the vlans speed limit which are using this wan
                        foreach($json_config->save_data as $vlan_key => $vlan_info)
                        {

                            if($vlan_info->bm_br_wan == $wan_name)
                            {
                                $ip_limit_ip = !empty($vlan_info->ip_limit_ip) ? $vlan_info->ip_limit_ip : "";
                                $allocation_rate = !empty($vlan_info->allocation_rate) ? $vlan_info->allocation_rate : "";
                                $allocation_rate = intval($allocation_rate);
                                if($allocation_rate == 0)
                                    $allocation_rate = 1;

                                


                                if($ip_limit_ip == "") continue;
                                $cmd = sprintf("uci show common | grep '.ip=%s' | cut -d _ -f 2 | cut -d . -f 1", $ip_limit_ip);
                                
                                $limit_id = shell_exec($cmd);
                                $limit_id = str_clean($limit_id);
                                $arg_data = array();
                                $uprate = intval($allocation_rate * $tx_rate / 100 / 1000) * 1000;
                                $downrate = intval($allocation_rate * $rx_rate / 100 / 1000) * 1000;

                                $qos_url = "http://127.0.0.1/cgi-bin/mbox-config?method=SET&section=qos_ip_limit";
                                if($limit_id == "")
                                {
                                    //add
                                    $arg_data["operate"] = "add";
                                    $arg_data["enable"] = "1";
                                    $arg_data["ip"] = $ip_limit_ip;
                                    $arg_data["uprate"] = $uprate;
                                    $arg_data["downrate"] = $downrate;
                                    $arg_data["comment"] = "";
                                    $arg_data["share"] = "0";

                                    $cmd = sprintf("curl -s  \"%s\" --header \"Content-Type: application/json\" --request POST --data '%s'", $qos_url, json_encode($arg_data));
                                    $cmd_ret = shell_exec($cmd);
                                }
                                else
                                {
                                    //edit

                                    $cmd = sprintf("uci get common.limit_%s.comment 2>/dev/null", $limit_id);

                                    $comment = shell_exec($cmd);
                                    $comment = str_clean($comment);

                                    $arg_data["operate"] = "edit";
                                    $arg_data["real_num"] = intval($limit_id);
                                    $arg_data["enable"] = "1";
                                    $arg_data["ip"] = $ip_limit_ip;
                                    $arg_data["downrate"] =strval($downrate);
                                    $arg_data["uprate"] = strval($uprate);
                                    $arg_data["comment"] = $comment;//vlan_info.descname + "limit " + parseInt(download_limit * allocation_rate/ 100 / 1000) + "Mbps";
                                    $arg_data["share"] = "0";
                                    $cmd = sprintf("curl -s \"%s\"  --header \"Content-Type: application/json\" --request POST --data '%s'", $qos_url, json_encode($arg_data));
                                    $cmd_ret = shell_exec($cmd);
                                }

                            }
                        }

                        break;
                    }
                }
                exit(0);
            }
        }
    }
    else if($action == "speedtest")
    {
        $wan_name =  !empty($_GET["wan_name"]) ? $_GET["wan_name"] : "";
        $rx_rate = !empty($_GET["rx_rate"]) ? $_GET["rx_rate"] : "";
        $tx_rate = !empty($_GET["tx_rate"]) ? $_GET["tx_rate"] : "";
        echo "here";
        if($wan_name != "" && $rx_rate != "" && $tx_rate != "")
        {
            //
            if($wan_name == "wan0") $wan_name = "wan";
            $rx_rate = intval($rx_rate);
            $tx_rate = intval($tx_rate);


            if(!file_exists($CONFIG_PATH) || filesize($CONFIG_PATH) == 0)
            {
                $bm_info = array("bm_enabled"=>1, "save_data"=>[]);
                file_put_contents($CONFIG_PATH, json_encode($bm_info));
            }
            $config_data = file_get_contents($CONFIG_PATH);
            $json_config = json_decode($config_data);
            
            foreach($json_config->wan_data as $key=>$value)
            {
                if($value->ifname == $wan_name && $value->isAutocheck == 1)
                {
                    //set all the vlans speed limit which are using this wan
                    foreach($json_config->save_data as $vlan_key => $vlan_info)
                    {

                        if($vlan_info->bm_br_wan == $wan_name)
                        {
                            $ip_limit_ip = !empty($vlan_info->ip_limit_ip) ? $vlan_info->ip_limit_ip : "";
                            $allocation_rate = !empty($vlan_info->allocation_rate) ? $vlan_info->allocation_rate : "";
                            $allocation_rate = intval($allocation_rate);
                            if($allocation_rate == 0)
                                $allocation_rate = 1;

                                echo $ip_limit_ip;


                            if($ip_limit_ip == "") continue;
                            $cmd = sprintf("uci show common | grep '.ip=%s' | cut -d _ -f 2 | cut -d . -f 1", $ip_limit_ip);
                            $limit_id = shell_exec($cmd);
                            $limit_id = str_clean($limit_id);
                            $arg_data = array();
                            $uprate = intval($allocation_rate * $tx_rate / 100 );
                            $downrate = intval($allocation_rate * $rx_rate / 100);
                            if($limit_id == "")
                            {
                                //add
                                $arg_data["operate"] = "add";
                                $arg_data["enable"] = "1";
                                $arg_data["ip"] = $ip_limit_ip;
                                $arg_data["uprate"] = $uprate;
                                $arg_data["downrate"] = $downrate;
                                $arg_data["comment"] = "";
                                $arg_data["share"] = "0";

                                $cmd = sprintf("curl -s \"http://127.0.0.1/cgi-bin/mbox-config?method=SET&section=qos_ip_limit\" --header \"Content-Type: application/json\" --request POST --data '%s'", json_encode($arg_data));
                                echo $cmd;
                                $cmd_ret = shell_exec($cmd);
                                echo $cmd_ret;
                            }
                            else
                            {
                                //edit

                                $cmd = sprintf("uci get common.limit_%s.comment 2>/dev/null", $limit_id);
                                $comment = shell_exec($cmd);
                                $comment = str_clean($comment);

                                $arg_data["operate"] = "edit";
                                $arg_data["real_num"] = intval($limit_id);
                                $arg_data["enable"] = "1";
                                $arg_data["ip"] = $ip_limit_ip;
                                $arg_data["downrate"] =strval($downrate);
                                $arg_data["uprate"] = strval($uprate);
                                $arg_data["comment"] = $comment;//vlan_info.descname + "limit " + parseInt(download_limit * allocation_rate/ 100 / 1000) + "Mbps";
                                $arg_data["share"] = "0";
                                $cmd = sprintf("curl -s \"http://127.0.0.1/cgi-bin/mbox-config?method=SET&section=qos_ip_limit\" --header \"Content-Type: application/json\" --request POST --data '%s'", json_encode($arg_data));
                                echo $cmd;

                                $cmd_ret = shell_exec($cmd);
                                echo $cmd_ret;
                            }

                        }
                    }

                    break;
                }
            }
        }
    }

    else if($action == "bm_config")
    {
        $json_text = file_get_contents('php://input', true);
        $data = json_decode($json_text);
        file_put_contents($CONFIG_PATH, $json_text);
        header("Content-type: application/json");
        echo $json_text;
    }
    else if($action == "bm_set_data")
    {
        $CONFIG_PATH =  "/etc/config/bandwidth_config";

        $post_data = json_decode(file_get_contents('php://input', true));
        if($post_data->operate == "del_vlan")
        {
            $vlans = explode(',',$post_data->vlans);
            $config_data = file_get_contents($CONFIG_PATH);
            $json_config = json_decode($config_data);
            if($json_config != "" && !empty($json_config->save_data))
            {
                $qos_id_list = array();
                foreach($json_config->save_data as $key=>$save_data)
                {
                    foreach($vlans as $vlan_key=> $vlan_name)
                    {
    
                        if($save_data->ifname == $vlan_name)
                        {
                            //delete qos ip limit
                            $ip_limit_ip = !empty($save_data->ip_limit_ip) ? $save_data->ip_limit_ip : "";
                            if($ip_limit_ip == "") continue;
                            $cmd = sprintf("uci show common | grep '.ip=%s' | cut -d _ -f 2 | cut -d . -f 1", $ip_limit_ip);
                            $limit_id = shell_exec($cmd);
                            $limit_id = str_clean($limit_id);
                            if($limit_id != "")
                            {
                                $limit_id = intval($limit_id);

                                //cgi-bin/mbox-config?method=SET&section=qos_ip_limit
                                $qos_id_list[] = $limit_id;

                            }

                            unset($json_config->save_data[$key]);
                            break;
                        }
                    }
                }
                if(count($qos_id_list) > 0)
                {
                    $qos_data = array("operate"=>"del", "list"=>implode(",", $qos_id_list));
                    $url = "http://127.0.0.1/cgi-bin/mbox-config?method=SET&section=qos_ip_limit";
                    echo json_encode($qos_data);
                    file_post_contents($url, $qos_data);
                }

                $json_config->save_data = array_values($json_config->save_data);

                file_put_contents($CONFIG_PATH, json_encode($json_config));
            } 
        }

    }
    else if($action == "bm_save_data")
    {
        $post_data = json_decode(file_get_contents('php://input', true));
        $data = $post_data->save_data;

        /*
        //header("Content-type: text/plain");
        header("Content-type: application/json");


        foreach($data as $key=>$value)
        {
            $id = $value->bm_id;
            $wan = $value->bm_wan;
            $ubus_wan = $wan == "wan0" ? "wan" : $wan;  
            $br_wan = $value->bm_br_wan;
            $lansubnet = $value->bm_lansubnet;
            
            func_set_routing($id, $wan, $ubus_wan, $br_wan, $lansubnet);

        }
        shell_exec("uci commit");
        */
        //func_set_config(json_encode($post_data));
        $CONFIG_PATH =  "/etc/config/bandwidth_config";
        file_put_contents($CONFIG_PATH, json_encode($post_data));
        shell_exec("(sleep 5; /etc/init.d/firewall restartall) > /dev/null &");
        set_cron($post_data);
        //shell_exec("/etc/init.d/network restartall > /dev/null &");
        //shell_exec("/etc/init.d/network restart");

        $response = array("errCode"=>0);

        echo json_encode($response);
    }
    else if($action == "lan_list")
    {
        $post_data = json_decode(file_get_contents('php://input', true));
        foreach($post_data as $k=>$lan)
        {
            $ifname = empty($lan->ifname) ? "" : $lan->ifname;
            $hostname = empty($lan->hostname) ? "" : $lan->hostname;
            if($ifname == "") continue;

            $cmd = sprintf("uci set network.%s.hostname='%s'", $ifname, $hostname);
            shell_exec($cmd);
            shell_exec("uci commit network");
        }

        $response = array("errCode"=>0);
        echo json_encode($response);
    }
}



function file_post_contents($url, $data)
{
    $postdata = json_encode($data);

    $opts = array('http' =>
        array(
            'method'  => 'POST',
            'header'  => 'Content-type: application/json',
            'content' => $postdata
        )
    );

    $context = stream_context_create($opts);

    $response = file_get_contents($url, false, $context);
    echo $response;
    return $response;
}
?>
