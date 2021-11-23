FROM node:current-slim as build
WORKDIR /readycheck
RUN adduser --gecos '' --disabled-password --no-create-home readychecker
COPY . .
COPY package.json .
COPY package-lock.json .
RUN npm ci

RUN ./node_modules/.bin/tsc
RUN cp ./dist/index.js .

USER readychecker
CMD node index.js