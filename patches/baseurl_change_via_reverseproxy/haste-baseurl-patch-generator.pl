#!/usr/bin/perl
#
# (c) Tomasz Miklas
# https://github.com/tmiklas/
# License: MIT
#
# More info: http://www.ctrl-alt-del.cc/2014/11/haste-server-base-url-hackpatch.html
#

use strict;
use warnings;

if ($#ARGV < 0) {
  print "Usage:\n\t$0 <prefix>\n";
  exit;
}

# ensure given directory prefix has the right format:
# /directory - bad
# /directory/ - bad
# directory/ - good
my $prefix = $ARGV[0];
$prefix =~ s/^\///;
$prefix .= "/" if $prefix !~ /\/$/;

# create patch file
open (OUT, ">baseurl.patch");
while (<DATA>) {
  s/{{{prefix}}}/$prefix/g;
  print OUT $_;
}
close (OUT);

# what's next?
print <<_END__;
Patch file basepath.patch generated - your hastebin will reside in http://<servername>/$prefix
Please change the directory into haste-server and apply the patch:
    Install: 	patch -p0 < baseurl.patch
    Uninstall: 	patch -p0 -R < baseurl.patch
_END__

__DATA__
diff -rupN static-orig/application.js static/application.js
--- static-orig/application.js	2014-11-07 00:28:04.326519263 +0100
+++ static/application.js	2014-11-09 00:02:28.498067362 +0100
@@ -16,7 +16,7 @@ haste_document.prototype.htmlEscape = fu
 // Get this document from the server and lock it here
 haste_document.prototype.load = function(key, callback, lang) {
   var _this = this;
-  $.ajax('/documents/' + key, {
+  $.ajax('/{{{prefix}}}documents/' + key.split('/')[-1], {
     type: 'get',
     dataType: 'json',
     success: function(res) {
@@ -58,7 +58,7 @@ haste_document.prototype.save = function
   }
   this.data = data;
   var _this = this;
-  $.ajax('/documents', {
+  $.ajax('/{{{prefix}}}documents', {
     type: 'post',
     data: data,
     dataType: 'json',
@@ -148,7 +148,7 @@ haste.prototype.newDocument = function(h
   this.$box.hide();
   this.doc = new haste_document();
   if (!hideHistory) {
-    window.history.pushState(null, this.appName, '/');
+    window.history.pushState(null, this.appName, '/{{{prefix}}}');
   }
   this.setTitle();
   this.lightKey();
@@ -242,7 +242,7 @@ haste.prototype.lockDocument = function(
     else if (ret) {
       _this.$code.html(ret.value);
       _this.setTitle(ret.key);
-      var file = '/' + ret.key;
+      var file = '/{{{prefix}}}' + ret.key;
       if (ret.language) {
         file += '.' + _this.lookupExtensionByType(ret.language);
       }
@@ -301,7 +301,7 @@ haste.prototype.configureButtons = funct
       },
       shortcutDescription: 'control + shift + r',
       action: function() {
-        window.location.href = '/raw/' + _this.doc.key;
+        window.location.href = '/{{{prefix}}}raw/' + _this.doc.key;
       }
     },
     {
diff -rupN static-orig/index.html static/index.html
--- static-orig/index.html	2014-11-07 00:28:04.329519272 +0100
+++ static/index.html	2014-11-09 00:01:50.375948333 +0100
@@ -18,7 +18,7 @@
 			// Handle pops
 			var handlePop = function(evt) {
 				var path = evt.target.location.pathname;
-				if (path === '/') { app.newDocument(true); }
+				if (path === '/{{{prefix}}}') { app.newDocument(true); }
 				else { app.loadDocument(path.substring(1, path.length)); }
 			};
 			// Set up the pop state to handle loads, skipping the first load
