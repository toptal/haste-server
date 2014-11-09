This script generates patch that once applied will change the base URI 
of haste-server from / to whatever you specify (like /haste/). Afterwards
you can add the required configuration to your reverse proxy server and
all should work out of the box.

More information and explanation can be found at
http://www.ctrl-alt-del.cc/2014/11/haste-server-base-url-hackpatch.html


Usage:
        ./haste-baseurl-patch-generator.pl <prefix>
