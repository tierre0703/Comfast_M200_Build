#!/usr/bin/php-cgi
<?php
//#REDIRECT_STATUS=200 REQUEST_METHOD=GET SCRIPT_FILENAME=/www-comfast/cgi-php/speedtest.php SCRIPT_NAME=/cgi-php/speedtest.php PATH_INFO=/ SERVER_NAME=127.0.0.1 SERVER_PROTOCOL=HTTP/1.1 REQUEST_URI=/cgi-php/ HTTP_HOST=127.0.0.1 /usr/bin/php-cgi 
//iperf3 -c 89.84.1.222 -p 5209  -B 10.100.100.131 -f M  -J -P 10 
$server_list = array(
    /*"bouygues.iperf.fr" */
    "89.84.1.222" => array(
        "port_from"=>9200,
        "port_to"=>9222
    ),
    "ping.online.net" => array(
        "port_from"=>5200,
        "port_to"=>5209
    ),
    //ping6.online.net
    //ping-90ms.online.net
    //ping-6-90ms.online.net
    "speedtest.serverius.net" => array(
        "port_from"=>5002,
        "port_to"=>5002
    ),
    "iperf.he.net" =>array(
        "port_from"=>5201,
        "port_to"=>5201
    )
    'iperf.eenet.ee'=>array(
        "port_from"=>5201,
        "port_to"=>5201
    ),
    'iperf.volia.net'=>array(
        "port_from"=>5201,
        "port_to"=>5201
    ),
    "iperf.scottlinux.com"=>array(
        "port_from"=>5201,
        "port_to"=>5201
    )
);
?>
