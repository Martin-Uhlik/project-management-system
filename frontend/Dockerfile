# ------------------------
# Phase 1) build the static site
FROM node:26-alpine3.24 AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
# VITE_BACKEND (the API address) is read from .env and baked into the build
RUN npm run build


# ------------------------
# Phase 2) serve it
FROM nginx:1.31-alpine AS runner
COPY --from=builder /app/build/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
