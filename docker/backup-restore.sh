#!/bin/bash

# =============================================================================
# Clinic Management System - Backup and Restore Utilities
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DATA_ROOT="/opt/clinic-data"
BACKUP_DIR="$DATA_ROOT/backups"
APP_DIR="/opt/clinic-app"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    echo "Usage: $0 [backup|restore|list|cleanup]"
    echo
    echo "Commands:"
    echo "  backup              Create a new backup"
    echo "  restore <filename>  Restore from backup file"
    echo "  list               List available backups"
    echo "  cleanup            Remove backups older than 30 days"
    echo
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 restore backup-2024-01-15-14-30-00.tar.gz"
    echo "  $0 list"
    echo "  $0 cleanup"
}

create_backup() {
    local timestamp=$(date +"%Y-%m-%d-%H-%M-%S")
    local backup_name="backup-$timestamp.tar.gz"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    print_status "Creating backup: $backup_name"
    
    # Ensure backup directory exists
    mkdir -p "$BACKUP_DIR"
    
    # Stop the application
    print_status "Stopping application..."
    cd "$APP_DIR"
    docker-compose down
    
    # Create backup
    print_status "Creating backup archive..."
    tar -czf "$backup_path" \
        -C "$DATA_ROOT" \
        database/ \
        config/ \
        uploads/ \
        --exclude='logs/*' \
        --exclude='backups/*'
    
    # Create metadata file
    cat > "$BACKUP_DIR/backup-$timestamp.info" << EOF
Backup Created: $(date)
Database Size: $(du -h "$DATA_ROOT/database/clinic.db" 2>/dev/null | cut -f1 || echo "N/A")
Config Files: $(find "$DATA_ROOT/config" -type f | wc -l)
Upload Files: $(find "$DATA_ROOT/uploads" -type f 2>/dev/null | wc -l || echo "0")
Archive Size: $(du -h "$backup_path" | cut -f1)
EOF
    
    # Restart application
    print_status "Restarting application..."
    docker-compose up -d
    
    print_success "Backup created: $backup_name"
    print_status "Archive size: $(du -h "$backup_path" | cut -f1)"
}

restore_backup() {
    local backup_file="$1"
    local backup_path="$BACKUP_DIR/$backup_file"
    
    if [[ -z "$backup_file" ]]; then
        print_error "Please specify a backup file to restore"
        echo "Available backups:"
        list_backups
        exit 1
    fi
    
    if [[ ! -f "$backup_path" ]]; then
        print_error "Backup file not found: $backup_path"
        exit 1
    fi
    
    print_status "Restoring from backup: $backup_file"
    
    # Stop the application
    print_status "Stopping application..."
    cd "$APP_DIR"
    docker-compose down
    
    # Create backup of current data
    local current_backup="pre-restore-$(date +"%Y-%m-%d-%H-%M-%S").tar.gz"
    print_status "Creating backup of current data: $current_backup"
    tar -czf "$BACKUP_DIR/$current_backup" \
        -C "$DATA_ROOT" \
        database/ \
        config/ \
        uploads/ \
        --exclude='logs/*' \
        --exclude='backups/*'
    
    # Restore from backup
    print_status "Restoring data..."
    rm -rf "$DATA_ROOT/database" "$DATA_ROOT/config" "$DATA_ROOT/uploads" 2>/dev/null || true
    tar -xzf "$backup_path" -C "$DATA_ROOT"
    
    # Fix permissions
    chown -R 1001:1001 "$DATA_ROOT"
    chmod -R 755 "$DATA_ROOT"
    chmod 600 "$DATA_ROOT/config/.env" 2>/dev/null || true
    
    # Restart application
    print_status "Restarting application..."
    docker-compose up -d
    
    print_success "Restore completed from: $backup_file"
    print_status "Previous data backed up as: $current_backup"
}

list_backups() {
    if [[ ! -d "$BACKUP_DIR" ]] || [[ -z "$(ls -A "$BACKUP_DIR"/*.tar.gz 2>/dev/null)" ]]; then
        print_status "No backups found in $BACKUP_DIR"
        return
    fi
    
    print_status "Available backups:"
    echo
    printf "%-30s %-15s %-20s\n" "Backup File" "Size" "Created"
    printf "%-30s %-15s %-20s\n" "----------" "----" "-------"
    
    for backup in "$BACKUP_DIR"/backup-*.tar.gz; do
        if [[ -f "$backup" ]]; then
            local filename=$(basename "$backup")
            local size=$(du -h "$backup" | cut -f1)
            local created=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
            printf "%-30s %-15s %-20s\n" "$filename" "$size" "$created"
        fi
    done
    echo
}

cleanup_backups() {
    print_status "Cleaning up backups older than 30 days..."
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        print_status "Backup directory does not exist"
        return
    fi
    
    local count=0
    while IFS= read -r -d '' backup; do
        rm -f "$backup"
        rm -f "${backup%.tar.gz}.info" 2>/dev/null || true
        count=$((count + 1))
        print_status "Removed: $(basename "$backup")"
    done < <(find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime +30 -print0 2>/dev/null)
    
    if [[ $count -eq 0 ]]; then
        print_status "No old backups found to clean up"
    else
        print_success "Cleaned up $count old backup(s)"
    fi
}

# Main script logic
case "${1:-}" in
    backup)
        create_backup
        ;;
    restore)
        restore_backup "$2"
        ;;
    list)
        list_backups
        ;;
    cleanup)
        cleanup_backups
        ;;
    *)
        show_usage
        exit 1
        ;;
esac