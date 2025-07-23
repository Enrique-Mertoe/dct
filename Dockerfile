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

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/config /app/uploads /app/logs /app/backups && \
    chown -R clinic:clinic /app

# Switch to non-root user
USER clinic

# Expose port
EXPOSE 3000

# Add healthcheck endpoint to Next.js app
COPY --chown=clinic:clinic docker/healthcheck.js ./

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]