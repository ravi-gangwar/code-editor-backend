FROM node:18-alpine

RUN apk add --no-cache openjdk17 python3

WORKDIR /app
CMD ["node", "/app/script.js"]
