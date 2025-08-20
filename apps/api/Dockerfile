# ================================
# Multi-stage Dockerfile for API
# ================================

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Build the application
RUN npm run build

# ================================
# Stage 2: Production stage
# ================================
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

# Set user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
  const options = { host: 'localhost', port: 3001, path: '/api/health', timeout: 2000 }; \
  const req = http.request(options, (res) => { \
  console.log('STATUS: ' + res.statusCode); \
  process.exit(res.statusCode === 200 ? 0 : 1); \
  }); \
  req.on('error', () => process.exit(1)); \
  req.end();"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Add build metadata
ARG VERSION=unknown
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown

LABEL org.opencontainers.image.version="$VERSION" \
  org.opencontainers.image.created="$BUILD_DATE" \
  org.opencontainers.image.revision="$VCS_REF" \
  org.opencontainers.image.title="Personal Trainer API" \
  org.opencontainers.image.description="SAAS Personal Trainer API Server" \
  org.opencontainers.image.vendor="Personal Trainer" \
  org.opencontainers.image.source="https://github.com/ghutttyerrez/SAAS-Personal-Trainer"

# Start the application
CMD ["dumb-init", "node", "dist/index.js"]
