# Comfast_ac200
MT7621 MIPS 1004kc

This is the real support url for the pakage

https://archive.openwrt.org/chaos_calmer/15.05.1/ramips/mt7621/packages/packages/




# uhttpd port 82
/etc/php.ini src directory to /www-comfast
/etc/uhttpd src directory to /www-comfast

pakages
php7-cgi php7-mod-sockets php7-mod-json 

#enable php
uci add_list uhttpd.main.interpreter=".php=/usr/bin/php-cgi"
uci add_list uhttpd.main.no_dirlists="1" 

#tune luci uhttpd
uci set uhttpd.main.no_dirlists=1
uci set uhttpd.main.redirect_https=0
uci commit uhttpd 

/etc/init.d/uhttpd restart

after it it starting to exec .php