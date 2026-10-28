# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./
COPY tsconfig.json ./

# Install all dependencies once, with retries for flaky networks.
RUN npm ci --no-audit --no-fund \
    --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY src ./src
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Keep Prisma startup offline-friendly (no update/telemetry checks).
ENV CHECKPOINT_DISABLE=1

# Install Python 3 for embedded Python execution
RUN apk add --no-cache python3

# Reuse the builder's installed dependencies — this already contains the generated
# Prisma client and the Prisma CLI, so the runtime needs no second network install.
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/prisma7.config.ts ./prisma7.config.ts
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node package*.json ./

# Non-root user for security
USER node

EXPOSE 3000

# Apply pending migrations, then serve
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/index.js"]
