# Build stage - SLIM: Use minimal Alpine image
FROM node:22.12-alpine3.21 AS builder

# CLEAN Layers: Install build deps, build, and cleanup in optimized layers
RUN apk add --no-cache python3 make g++

WORKDIR /app

# CACHED: Copy dependency files first for better layer caching
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
# shared is compiled by the root postinstall, so its sources are needed here
COPY shared/ ./shared/

RUN npm ci --ignore-scripts=false

# Copy source code (changes more frequently)
COPY client/ ./client/
COPY server/ ./server/
COPY tsconfig*.json ./

# Build, copy init.sql to dist, and prune in single layer for smaller image
RUN npm run build \
    && cp server/src/db/init.sql server/dist/db/init.sql \
    && npm prune --omit=dev \
    && mkdir -p server/node_modules \
    && npm cache clean --force \
    && rm -rf /root/.npm /tmp/* \
    && rm -rf client/src server/src shared/src

# Production stage - SLIM: Minimal runtime image
FROM node:22.12-alpine3.21 AS production

# Metadata labels for image management
LABEL org.opencontainers.image.title="Bar Boursier" \
      org.opencontainers.image.description="Stock market bar application" \
      org.opencontainers.image.vendor="Bar Boursier"

# DRI: Create non-root user, SLIM: Only install runtime dependencies + curl for healthcheck
RUN addgroup -g 1001 -S app \
    && adduser -u 1001 -S app -G app \
    && apk add --no-cache libstdc++ curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy only necessary production files
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
# Workspace-local deps that npm did not hoist to the root
COPY --from=builder --chown=app:app /app/server/node_modules ./server/node_modules
COPY --from=builder --chown=app:app /app/shared/package.json ./node_modules/shared/package.json
COPY --from=builder --chown=app:app /app/shared/dist ./node_modules/shared/dist
COPY --from=builder --chown=app:app /app/server/dist ./server/dist
COPY --from=builder --chown=app:app /app/client/dist ./client/dist

# Create data directory with proper ownership
RUN mkdir -p /app/data && chown -R app:app /app/data

# DRI: Run as non-root user
USER app

# CONFIG OUT: Configuration via environment variables
# Note: PORT is provided by Render at runtime, don't hardcode it
ENV NODE_ENV=production

# Render provides dynamic PORT, expose common default
EXPOSE 10000

# Note: HEALTHCHECK removed - Render uses its own health checking on the dynamic PORT
# For local Docker testing, use: docker run -e PORT=3001 -p 3001:3001 ...

# 1C1P: Single process per container
CMD ["node", "server/dist/index.js"]
