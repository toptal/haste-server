FROM alpine:3.6

COPY . /srv/haste

RUN /srv/haste/docker/build.sh

EXPOSE 7777

VOLUME [ "/srv/haste/data" ]

WORKDIR /srv/haste

ENTRYPOINT [ "/usr/bin/node", "server.js" ]
