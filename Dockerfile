FROM node:14

COPY entrypoint.sh /
RUN cd / && npm install @mmarchini/npm-otp-publish

ENTRYPOINT ["/entrypoint.sh"]
