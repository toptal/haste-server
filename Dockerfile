FROM node:14.8.0-stretch

RUN mkdir -p /usr/src/app && \
    chown node:node /usr/src/app

WORKDIR /usr/src/app

COPY . .

RUN mv config.json base.config.json && touch config.json && chown node:node config.json ./static/application.min.js && mkdir data && chown node:node data

RUN npm install 
# && \
#    npm install redis@0.8.1 && \
#    npm install pg@4.1.1 && \
#    npm install memcached@2.2.2 && \
#    npm install aws-sdk@2.738.0 && \
#    npm install rethinkdbdash@2.3.31

ENV HOST=0.0.0.0\
    PORT=7777

USER node:node

VOLUME /usr/src/app/data

EXPOSE ${PORT}
STOPSIGNAL SIGINT
ENTRYPOINT [ "bash", "docker-entrypoint.sh" ]

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s \
    --retries=3 CMD [ "curl" , "-f" "localhost:${PORT}", "||", "exit", "1"]
CMD ["npm", "start"]
