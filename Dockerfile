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
# Create enhanced startup script with backup functionality
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "[STARTUP] Clinic Management System initializing..."' >> /app/start.sh && \
    echo 'mkdir -p /app/data /app/config /app/uploads /app/logs /app/backups' >> /app/start.sh && \
    echo '# Environment variables are set by Docker Compose' >> /app/start.sh && \
    echo '# DATABASE_URL and NODE_ENV are already available' >> /app/start.sh && \
    echo 'echo "[STARTUP] Environment: NODE_ENV=$NODE_ENV, DATABASE_URL=$DATABASE_URL"' >> /app/start.sh && \
    echo '# Check if database exists and has data' >> /app/start.sh && \
    echo 'if [ -f "/app/data/clinic.db" ] && [ -s "/app/data/clinic.db" ]; then' >> /app/start.sh && \
    echo '  echo "[STARTUP] Database found with data, checking migrations..."' >> /app/start.sh && \
    echo '  backup_date=$(date +"%Y%m%d")' >> /app/start.sh && \
    echo '  if [ ! -f "/app/backups/daily_backup_${backup_date}.db" ]; then' >> /app/start.sh && \
    echo '    cp /app/data/clinic.db "/app/backups/daily_backup_${backup_date}.db"' >> /app/start.sh && \
    echo '    echo "[STARTUP] Daily backup created: daily_backup_${backup_date}.db"' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo '  npx prisma migrate deploy' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '  echo "[STARTUP] No database found or empty database, initializing fresh..."' >> /app/start.sh && \
    echo '  echo "[STARTUP] Running: npm run init-db"' >> /app/start.sh && \
    echo '  npm run init-db' >> /app/start.sh && \
    echo '  if [ -f "/app/data/clinic.db" ]; then' >> /app/start.sh && \
    echo '    echo "[STARTUP] Database created successfully!"' >> /app/start.sh && \
    echo '    echo "[STARTUP] Database size: $(ls -lh /app/data/clinic.db | awk "{print \\$5}")"' >> /app/start.sh && \
    echo '  else' >> /app/start.sh && \
    echo '    echo "[STARTUP] ERROR: Database was not created!"' >> /app/start.sh && \
    echo '    exit 1' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo '# Cleanup old backups (keep last 7 days)' >> /app/start.sh && \
    echo 'find /app/backups -name "daily_backup_*.db" -mtime +7 -delete 2>/dev/null || true' >> /app/start.sh && \
    echo 'echo "[STARTUP] Database initialization complete. Starting Next.js application..."' >> /app/start.sh && \
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