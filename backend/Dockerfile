FROM node:26-alpine3.24 AS base

# ------------------------
# Phase 1) download dependencies
FROM base AS deps
WORKDIR /app
# (npm ci runs "prisma generate", which needs the Prisma schema and config)
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm ci


# ------------------------
# Phase 2) build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma database client (src/generated/prisma, not in git), then TypeScript -> dist
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev


# ------------------------
# Phase 3) execute the app
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# the migrations, applied to the database on every start (prisma migrate deploy only runs the ones not applied yet)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
# uploaded task files live here (bind-mounted from the host in docker-compose.yml)
RUN mkdir -p data && chown node:node data

USER node
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
