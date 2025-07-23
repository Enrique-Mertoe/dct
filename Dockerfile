# Use Node.js 18 Alpine for smaller size
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    sqlite \
    curl \
    dumb-init

# Create app user for security
RUN addgroup -g 1001 -S clinic && \
    adduser -S clinic -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for build)
RUN npm ci && \
    npm cache clean --force

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/config /app/uploads /app/logs /app/backups && \
    chown -R clinic:clinic /app/data /app/config /app/uploads /app/logs /app/backups

# Create a simple startup script inline
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "[STARTUP] Initializing database if needed..."' >> /app/start.sh && \
    echo 'mkdir -p /app/data' >> /app/start.sh && \
    echo 'export DATABASE_URL="file:/app/data/clinic.db"' >> /app/start.sh && \
    echo 'if [ ! -f "/app/data/clinic.db" ]; then' >> /app/start.sh && \
    echo '  echo "[STARTUP] Creating database..."' >> /app/start.sh && \
    echo '  npx prisma migrate deploy' >> /app/start.sh && \
    echo '  npm run seed' >> /app/start.sh && \
    echo '  echo "[STARTUP] Database ready!"' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'echo "[STARTUP] Starting application..."' >> /app/start.sh && \
    echo 'exec "$@"' >> /app/start.sh && \
    chmod +x /app/start.sh

# Copy healthcheck
COPY docker/healthcheck.js ./healthcheck.js

# Switch to non-root user
USER clinic

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start with initialization
CMD ["/app/start.sh", "npm", "start"]