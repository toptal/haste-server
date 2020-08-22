#!/bin/bash

# We use this file to translate environmental variables to .env files used by the application

set -e
function create_document_string () {
    IFS=',' read -ra doc_array <<< "$DOCUMENTS"
    document_string="{"

    for i in "${doc_array[@]}"
    do
        IFS='=' read -ra document <<< "$i"
        document_string+="\"${document[0]}\": \"${document[1]}\","
    done

    # Remove trailing "," 
    [[ "$document_string" == *, ]] && document_string=${document_string::${#document_string}-1}
    document_string+="}"
    echo $document_string
}

document_string=$(create_document_string)

echo "
{

  \"host\": \"$HOST\",
  \"port\": ${PORT},

  \"keyLength\": $KEY_LENGTH,

  \"maxLength\": $MAX_LENGTH,

  \"staticMaxAge\": $STATIC_MAX_AGE,

  \"recompressStaticAssets\": $RECOMPRESS_STATIC_ASSETS,

  \"logging\": [
    {
      \"level\": \"$LOGGING_LEVEL\",
      \"type\": \"$LOGGING_TYPE\",
      \"colorize\": $LOGGING_COLORIZE
    }
  ],

  \"keyGenerator\": {
    \"type\": \"$KEYGENERATOR_TYPE\"
  },

  \"rateLimits\": {

    \"categories\": {
      \"normal\": {
        \"totalRequests\": $RATELIMITS_NORMAL_TOTAL_REQUESTS,
        \"every\": $RATELIMITS_NORMAL_EVERY_SECONDS
      },
      \"whitelist\": {
        \"totalRequests\": $RATELIMITS_WHITELIST_TOTAL_REQUESTS,
        \"every\": $RATELIMITS_WHITELIST_EVERY_SECONDS
      },
      \"blacklist\": {
        \"totalRequests\": $RATELIMITS_BLACKLIST_TOTAL_REQUESTS,
        \"every\": $RATELIMITS_BLACKLIST_EVERY_SECONDS
      }
    }
  },

  \"storage\": {
    \"type\": \"$STORAGE_TYPE\",
    \"host\": \"$STORAGE_HOST\",
    \"port\":  $STORAGE_PORT,
    \"expire\": $STORAGE_EXPIRE_SECONDS,
    \"db\": $STORAGE_DB
  },

  \"documents\": $document_string

}
" > config.js



exec "$@"