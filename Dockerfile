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
RUN #npx prisma generate



# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/config /app/uploads /app/logs /app/backups && \
    chown -R clinic:clinic /app/data /app/config /app/uploads /app/logs /app/backups
# Build Next.js application
RUN cp /app/config/.env .env
RUN npm run init-db
RUN npm run build
# Create enhanced startup script with backup functionality
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "[STARTUP] Clinic Management System initializing..."' >> /app/start.sh && \
    echo 'mkdir -p /app/data /app/config /app/uploads /app/logs /app/backups' >> /app/start.sh && \
    echo 'export DATABASE_URL="file:/app/data/clinic.db"' >> /app/start.sh && \
    echo '# Create daily backup if database exists' >> /app/start.sh && \
    echo 'if [ -f "/app/data/clinic.db" ]; then' >> /app/start.sh && \
    echo '  backup_date=$(date +"%Y%m%d")' >> /app/start.sh && \
    echo '  if [ ! -f "/app/backups/daily_backup_${backup_date}.db" ]; then' >> /app/start.sh && \
    echo '    cp /app/data/clinic.db "/app/backups/daily_backup_${backup_date}.db"' >> /app/start.sh && \
    echo '    echo "[STARTUP] Daily backup created: daily_backup_${backup_date}.db"' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo '  echo "[STARTUP] Database found, checking migrations..."' >> /app/start.sh && \
    echo '  npx prisma migrate deploy' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '  echo "[STARTUP] No database found, initializing fresh database..."' >> /app/start.sh && \
    echo '  npm run init-db' >> /app/start.sh && \
    echo '  echo "[STARTUP] Fresh database initialized!"' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo '# Cleanup old backups (keep last 7 days)' >> /app/start.sh && \
    echo 'find /app/backups -name "daily_backup_*.db" -mtime +7 -delete 2>/dev/null || true' >> /app/start.sh && \
    echo 'echo "[STARTUP] Starting Next.js application..."' >> /app/start.sh && \
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