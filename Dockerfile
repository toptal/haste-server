FROM node:alpine3.10
COPY . /srv
WORKDIR /srv
RUN npm install
CMD "npm" "start"
