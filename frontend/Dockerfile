FROM node:19-alpine3.15 AS builder

WORKDIR /app
COPY package.json /app/
COPY package-lock.json /app/
RUN npm i
COPY ./src /app/src
COPY ./public /app/public
COPY ./.env /app/.env
RUN npm run build


FROM nginx:1.23.2-alpine AS runner

COPY --from=builder /app/build/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
