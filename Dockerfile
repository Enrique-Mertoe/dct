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

# Copy startup script and healthcheck
COPY --chown=clinic:clinic docker/start-clinic.sh ./
COPY --chown=clinic:clinic docker/healthcheck.js ./
RUN chmod +x start-clinic.sh

# Switch to non-root user
USER clinic

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start with initialization script
CMD ["./start-clinic.sh", "npm", "start"]