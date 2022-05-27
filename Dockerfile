FROM node:16-slim as base

ARG user
RUN mkdir /app && chown -R $user:$user /app
USER $user
WORKDIR /app

COPY --chown=$user:$user package.json yarn.lock /app/
RUN yarn install

COPY --chown=$user:$user . /app

ENV STORAGE_TYPE=memcached \
    STORAGE_HOST=127.0.0.1 \
    STORAGE_PORT=11211\
    STORAGE_EXPIRE_SECONDS=2592000\
    STORAGE_DB=2 \
    STORAGE_AWS_BUCKET= \
    STORAGE_AWS_REGION= \
    STORAGE_USENAME= \
    STORAGE_PASSWORD= \
    STORAGE_FILEPATH=

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
    RATELIMITS_NORMAL_EVERY_MILLISECONDS=60000 \
    RATELIMITS_WHITELIST_TOTAL_REQUESTS= \
    RATELIMITS_WHITELIST_EVERY_MILLISECONDS=  \
    # comma separated list for the whitelisted \
    RATELIMITS_WHITELIST=example1.whitelist,example2.whitelist \
    \
    RATELIMITS_BLACKLIST_TOTAL_REQUESTS= \
    RATELIMITS_BLACKLIST_EVERY_MILLISECONDS= \
    # comma separated list for the blacklisted \
    RATELIMITS_BLACKLIST=example1.blacklist,example2.blacklist
ENV DOCUMENTS=about=./about.md

EXPOSE ${PORT}
STOPSIGNAL SIGINT
ENTRYPOINT [ "bash", "docker-entrypoint.sh" ]

RUN yarn build
COPY static /app/dist/static

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s \
    --retries=3 CMD [ "sh", "-c", "echo -n 'curl localhost:7777... '; \
    (\
    curl -sf localhost:7777 > /dev/null\
    ) && echo OK || (\
    echo Fail && exit 2\
    )"]

CMD ["yarn", "start"]
