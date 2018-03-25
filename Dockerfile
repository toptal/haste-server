FROM node:carbon

LABEL org.label-schema.schema-version = "1.0.0"
LABEL org.label-schema.name = "haste-server"
LABEL org.label-schema.description = "Open-Source PasteBin Written in Node.js"
LABEL org.label-schema.vcs-url = "https://github.com/seejohnrun/haste-server"

WORKDIR /usr/src/app

# Capture dependencies in their own layer
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 80

VOLUME ["/data"]

CMD ["npm", "start"]
