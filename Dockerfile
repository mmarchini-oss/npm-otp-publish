FROM node:14

RUN mkdir -p /app
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN cd /app && npm ci && mv node_modules /

COPY . /app

ENTRYPOINT ["/app/entrypoint.sh"]
