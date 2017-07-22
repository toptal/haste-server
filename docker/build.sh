#! /bin/sh
#
# build.sh
# Copyright (C) 2017 Óscar García Amor <ogarcia@connectical.com>
#
# Distributed under terms of the GNU GPLv3 license.
#

# upgrade
apk -U --no-progress upgrade

# install deps
apk --no-progress add nodejs nodejs-npm

# fix horizontal scroll bar that appears in locked haste
cd /srv/haste
cp docker/application.css static/application.css

# config and install
cp docker/config.js .
npm install --production

# clean
apk --no-progress del nodejs-npm
rm -rf /root/.ash_history /root/.npm /srv/haste/package-lock.json \
  /srv/haste/package.json /srv/haste/Dockerfile /srv/haste/Procfile \
  /srv/haste/README.md /srv/haste/.git* /srv/haste/.eslint* \
  /srv/haste/docker
