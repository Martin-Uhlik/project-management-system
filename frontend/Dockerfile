# ------------------------
# Phase 1) build the static site
FROM node:26-alpine3.24 AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
# the API address the browser uses, baked into the build (docker-compose.yml passes it from .env)
ARG VITE_BACKEND
ENV VITE_BACKEND=${VITE_BACKEND}
RUN npm run build


# ------------------------
# Phase 2) serve it
FROM nginx:1.31-alpine AS runner
COPY --from=builder /app/build/ /usr/share/nginx/html
# a template: the nginx image fills in the settings below on start (see nginx.conf)
COPY ./nginx.conf /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://project-management-system-backend:4000
ENV MAX_UPLOAD_SIZE=200m
