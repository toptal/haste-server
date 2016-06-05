FROM    centos:centos6
RUN     yum install -y epel-release
RUN     yum install -y nodejs npm

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 7777
CMD [ "npm", "start" ]

