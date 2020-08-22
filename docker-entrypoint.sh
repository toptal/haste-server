#!/bin/bash

# We use this file to translate environmental variables to .env files used by the application

set -e

node ./docker-entrypoint.js > ./config.js

exec "$@"
