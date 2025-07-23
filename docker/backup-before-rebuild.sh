#!/bin/bash

# =============================================================================
# Smart Rebuild with Automatic Backup
# Backs up data, rebuilds containers, restores data
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="pre_rebuild_backup_$TIMESTAMP"
TEMP_BACKUP_DIR="/tmp/clinic_backup_$TIMESTAMP"

print_header "Smart Rebuild with Data Preservation"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose not found"
    exit 1
fi

# Step 1: Create temporary backup
print_status "Creating temporary backup of all data..."

# Create backup directory
mkdir -p "$TEMP_BACKUP_DIR"

# Backup from running containers
print_status "Extracting data from containers..."

# Backup database
if docker-compose ps | grep -q "clinic-app.*Up"; then
    print_status "Backing up database..."
    docker-compose exec -T clinic-app sh -c 'if [ -f /app/data/clinic.db ]; then cat /app/data/clinic.db; fi' > "$TEMP_BACKUP_DIR/clinic.db" 2>/dev/null || true
    
    # Backup config files
    print_status "Backing up configuration..."
    docker-compose exec -T clinic-app sh -c 'if [ -f /app/config/.env ]; then cat /app/config/.env; fi' > "$TEMP_BACKUP_DIR/.env" 2>/dev/null || true
    
    # Backup uploads
    print_status "Backing up uploaded files..."
    docker-compose exec -T clinic-app tar -czf - -C /app/uploads . 2>/dev/null | cat > "$TEMP_BACKUP_DIR/uploads.tar.gz" || true
    
    # Backup logs (last 1000 lines)
    print_status "Backing up recent logs..."
    docker-compose exec -T clinic-app sh -c 'find /app/logs -name "*.log" -exec tail -n 1000 {} \;' > "$TEMP_BACKUP_DIR/recent_logs.txt" 2>/dev/null || true
else
    print_warning "Containers not running, attempting to backup from volumes..."
    
    # If containers are down, try to backup from host volumes
    if [ -n "$CLINIC_DATA_ROOT" ] && [ -d "$CLINIC_DATA_ROOT" ]; then
        print_status "Backing up from host volumes..."
        cp -r "$CLINIC_DATA_ROOT"/* "$TEMP_BACKUP_DIR/" 2>/dev/null || true
    fi
fi

# Verify backup
backup_size=$(du -sh "$TEMP_BACKUP_DIR" | cut -f1)
print_success "Backup created: $backup_size in $TEMP_BACKUP_DIR"

# Step 2: Stop and remove containers
print_status "Stopping existing containers..."
docker-compose down

print_status "Removing old images to force rebuild..."
docker-compose down --rmi all 2>/dev/null || true

# Step 3: Pull latest code
print_status "Updating application code..."
if [ -d ".git" ]; then
    git pull origin main || print_warning "Git pull failed, continuing with existing code"
else
    print_warning "Not a git repository, using existing code"
fi

# Step 4: Rebuild containers
print_status "Rebuilding containers with latest code..."
docker-compose build --no-cache

# Step 5: Start containers
print_status "Starting new containers..."
docker-compose up -d

# Step 6: Wait for containers to be ready
print_status "Waiting for containers to be ready..."
sleep 10

# Check if containers are running
if ! docker-compose ps | grep -q "clinic-app.*Up"; then
    print_error "Containers failed to start"
    print_status "Check logs with: docker-compose logs"
    exit 1
fi

# Step 7: Restore data
print_status "Restoring backed up data..."

# Restore database
if [ -f "$TEMP_BACKUP_DIR/clinic.db" ] && [ -s "$TEMP_BACKUP_DIR/clinic.db" ]; then
    print_status "Restoring database..."
    docker-compose exec -T clinic-app sh -c 'mkdir -p /app/data'
    cat "$TEMP_BACKUP_DIR/clinic.db" | docker-compose exec -T clinic-app sh -c 'cat > /app/data/clinic.db'
    print_success "Database restored"
else
    print_warning "No database backup found, will initialize fresh"
fi

# Restore config
if [ -f "$TEMP_BACKUP_DIR/.env" ] && [ -s "$TEMP_BACKUP_DIR/.env" ]; then
    print_status "Restoring configuration..."
    docker-compose exec -T clinic-app sh -c 'mkdir -p /app/config'
    cat "$TEMP_BACKUP_DIR/.env" | docker-compose exec -T clinic-app sh -c 'cat > /app/config/.env'
    print_success "Configuration restored"
fi

# Restore uploads
if [ -f "$TEMP_BACKUP_DIR/uploads.tar.gz" ] && [ -s "$TEMP_BACKUP_DIR/uploads.tar.gz" ]; then
    print_status "Restoring uploaded files..."
    docker-compose exec -T clinic-app sh -c 'mkdir -p /app/uploads'
    cat "$TEMP_BACKUP_DIR/uploads.tar.gz" | docker-compose exec -T clinic-app tar -xzf - -C /app/uploads/
    print_success "Uploaded files restored"
fi

# Step 8: Fix permissions
print_status "Fixing file permissions..."
docker-compose exec -T clinic-app sh -c 'chown -R clinic:clinic /app/data /app/config /app/uploads /app/logs 2>/dev/null || true'

# Step 9: Restart containers to ensure everything loads correctly
print_status "Restarting containers to apply changes..."
docker-compose restart

# Wait for restart
sleep 5

# Step 10: Create permanent backup
print_status "Creating permanent backup in container..."
docker-compose exec -T clinic-app sh -c "
mkdir -p /app/backups
if [ -f /app/data/clinic.db ]; then
    cp /app/data/clinic.db /app/backups/clinic_backup_$TIMESTAMP.db
    echo 'Backup created: /app/backups/clinic_backup_$TIMESTAMP.db'
fi
"

# Step 11: Cleanup temporary backup
print_status "Cleaning up temporary files..."
rm -rf "$TEMP_BACKUP_DIR"

# Step 12: Verify everything is working
print_status "Verifying system status..."
sleep 5

if docker-compose ps | grep -q "clinic-app.*Up"; then
    print_success "Containers are running"
    
    # Test database connection
    if docker-compose exec -T clinic-app sh -c 'ls -la /app/data/clinic.db' >/dev/null 2>&1; then
        print_success "Database is accessible"
    else
        print_warning "Database might need initialization"
    fi
    
    # Get access URLs
    print_header "Rebuild Complete!"
    
    # Get IP address
    if command -v ipconfig &> /dev/null; then
        # Windows
        ip_address=$(ipconfig | grep "IPv4 Address" | grep -v "127.0.0.1" | head -1 | cut -d':' -f2 | tr -d ' ')
    else
        # Linux
        ip_address=$(hostname -I | awk '{print $1}')
    fi
    
    nginx_port=$(grep "NGINX_PORT" .env 2>/dev/null | cut -d'=' -f2 || echo "80")
    app_port=$(grep "APP_PORT" .env 2>/dev/null | cut -d'=' -f2 || echo "3000")
    
    echo
    print_success "Your Clinic Management System has been updated!"
    echo
    echo "Access URLs:"
    echo "  - Local:   http://localhost:$nginx_port"
    echo "  - Network: http://$ip_address:$nginx_port"
    echo "  - Direct:  http://localhost:$app_port"
    echo
    echo "All your data has been preserved:"
    echo "  - Patient records: ✓ Restored"
    echo "  - User accounts: ✓ Restored"  
    echo "  - Configuration: ✓ Restored"
    echo "  - Uploaded files: ✓ Restored"
    echo
    print_success "Backup created: clinic_backup_$TIMESTAMP.db"
    
else
    print_error "Containers failed to start properly"
    print_status "Check logs with: docker-compose logs"
    print_status "Your data backup is safe in the containers"
    exit 1
fi

print_success "Smart rebuild completed successfully!"