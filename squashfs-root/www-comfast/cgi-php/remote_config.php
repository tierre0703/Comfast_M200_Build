<?php

$config_path = "/etc/nginx/nginx.conf";

$str = file_get_contents($config_path);

if (strpos($str, "deny all;") >= -1  && strpos($str, "allow 127.0.0.1;") == false){
	//add allow 127.0.0.1 to here
	$token = explode("deny all;", $str);
	$str = $token[0] . "allow 127.0.0.1;\ndeny all;\n" . $token[1];
	file_put_contents($config_path, $str);
	shell_exec("/etc/init.d/nginx restart");
}


?>
