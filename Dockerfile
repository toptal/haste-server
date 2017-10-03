FROM node:slim

# To add your own config file, mount it into the container at runtime
#   with `docker run -v <config_file>:/src/config.js jasongwartz/haste-server`

EXPOSE 7777
COPY . /src
WORKDIR /src
RUN npm install

CMD ["npm", "start"]


