#!/bin/sh
set -e

echo "[STARTUP] Clinic Management System starting..."

# Wait a moment for volumes to be mounted
sleep 2

# Ensure data directory exists
mkdir -p /app/data

# Check if database exists, if not initialize it
if [ ! -f "/app/data/clinic.db" ]; then
    echo "[STARTUP] Database not found. Initializing database..."
    
    export DATABASE_URL="file:/app/data/clinic.db"
    
    # Run database migrations
    echo "[STARTUP] Running database migrations..."
    npx prisma migrate deploy
    
    # Seed initial data
    echo "[STARTUP] Seeding initial data..."
    npm run init-db
    
    echo "[STARTUP] Database initialization complete!"
else
    echo "[STARTUP] Database exists. Checking for pending migrations..."
    export DATABASE_URL="file:/app/data/clinic.db"
    
    # Run any pending migrations
    npx prisma migrate deploy
    
    echo "[STARTUP] Database check complete!"
fi

# Set correct permissions for database
chown -R clinic:clinic /app/data 2>/dev/null || true

echo "[STARTUP] Starting Next.js application..."
exec "$@"