# replace this with your application's default port
FROM node:8
RUN mkdir -p /usr/src/app
RUN curl -o- -L https://yarnpkg.com/install.sh | bash
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV
COPY package.json yarn.lock /usr/src/app/
RUN yarn install --production && yarn cache clean --force
COPY . /usr/src/app

CMD [ "yarn", "start" ]
EXPOSE 7777
EXPOSE 9229
