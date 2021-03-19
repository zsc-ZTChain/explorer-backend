# Version1
FROM node:lts
COPY . /usr/app/explorer-backend
WORKDIR /usr/app/explorer-backend

RUN npm install --registry=https://registry.npm.taobao.org
EXPOSE 3000
CMD npm run pro
