FROM node:14

WORKDIR /app
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm ci && mv node_modules /

COPY . /app

ENTRYPOINT ["/app/entrypoint.sh"]
