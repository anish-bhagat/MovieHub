# ====================================================
# MovieHub Production Dockerfile
# Multi-stage build for minimal image size and security
# ====================================================

# Step 1: Build TypeScript
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy package manifests first for efficient layer caching
COPY package*.json tsconfig.json ./

# Install all dependencies including devDependencies for tsc
RUN npm ci

# Copy source code and static assets
COPY src/ ./src/
COPY public/ ./public/

# Compile TypeScript to dist/
RUN npm run build

# Step 2: Production Runner
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/moviehub.db

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built JavaScript from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/db/schema.sql ./src/db/schema.sql
COPY --from=builder /app/public ./public

# Create data directory for SQLite database storage
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 3000

# Server starts and auto-seeds database if freshly mounted
CMD ["node", "dist/server.js"]
