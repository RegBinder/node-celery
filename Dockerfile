FROM node:6

WORKDIR /app

ADD package.json .
RUN npm install

ADD celery.js .
ADD protocol.js .
ADD tests tests

CMD ["npm", "test"]

