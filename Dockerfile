FROM node:latest

RUN mkdir -p /usr/src/app && \
    chown node:node /usr/src/app

USER node:node 

WORKDIR /usr/src/app

COPY --chown=node:node . . 

RUN npm install && \
    npm install redis && \
    npm install pg && \
    npm install memcached

ENV STORAGE_TYPE=memcached \
    STORAGE_HOST=127.0.0.1 \
    STORAGE_PORT=11211\
    STORAGE_EXPIRE_SECONDS=2592000\
    STORAGE_DB=2 \
    STORAGE_CONNECTION_URL= \
    STORAGE_BUCKET= \
    STORAGE_REGION= 

ENV LOGGING_LEVEL=verbose \
    LOGGING_TYPE=Console \
    LOGGING_COLORIZE=true

ENV HOST=0.0.0.0\
    PORT=7777\
    KEY_LENGTH=10\
    MAX_LENGTH=400000\
    STATIC_MAX_AGE=86400\
    RECOMPRESS_STATIC_ASSETS=true

ENV KEYGENERATOR_TYPE=phonetic \
    KEYGENERATOR_KEYSPACE=

ENV RATELIMITS_NORMAL_TOTAL_REQUESTS=500\
    RATELIMITS_NORMAL_EVERY_SECONDS=60000 \
    RATELIMITS_WHITELIST_TOTAL_REQUESTS=500\
    RATELIMITS_WHITELIST_EVERY_SECONDS=60000 \
    # comma separated list for the whitelisted \
    RATELIMITS_WHITELIST=   \
    \   
    RATELIMITS_BLACKLIST_TOTAL_REQUESTS=60000 \
    RATELIMITS_BLACKLIST_EVERY_SECONDS=500 \
    # comma separated list for the blacklisted \
    RATELIMITS_BLACKLIST=example.com,example.org 
ENV DOCUMENTS=about=./about.md

EXPOSE 7777

ENTRYPOINT [ "bash", "docker-entrypoint.sh" ]

CMD ["npm", "start"]
