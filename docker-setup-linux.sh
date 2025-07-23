#!/bin/bash

# =============================================================================
# Clinic Management System - Docker Setup Script for Linux
# One-click installation with Docker, no manual configuration needed
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="clinic-management"
REPO_URL="https://github.com/Enrique-Mertoe/dct.git"
DATA_ROOT="/opt/clinic-data"
APP_DIR="/opt/clinic-app"
DEFAULT_PORT=3000
DEFAULT_NGINX_PORT=80

print_header() {
    echo -e "${CYAN}====================================================${NC}"
    echo -e "${CYAN}    Clinic Management System - Docker Setup${NC}"
    echo -e "${CYAN}====================================================${NC}"
    echo
}

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

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        print_status "Detected OS: $OS $VER"
    else
        print_error "Cannot detect operating system"
        exit 1
    fi
}

install_docker() {
    print_status "Checking Docker installation..."
    
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_success "Docker is already installed"
        return 0
    fi
    
    print_status "Installing Docker..."
    
    # Update package lists
    apt-get update
    
    # Install prerequisites
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package lists again
    apt-get update
    
    # Install Docker
    apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group if not root
    if [[ -n "$SUDO_USER" ]]; then
        usermod -aG docker "$SUDO_USER"
        print_status "Added $SUDO_USER to docker group"
    fi
    
    print_success "Docker installed successfully"
}

install_git() {
    print_status "Checking Git installation..."
    
    if command -v git &> /dev/null; then
        print_success "Git is already installed"
        return 0
    fi
    
    print_status "Installing Git..."
    apt-get install -y git
    print_success "Git installed successfully"
}

create_directories() {
    print_status "Creating persistent data directories..."
    
    # Create directories
    mkdir -p "$DATA_ROOT"/{database,config,uploads,logs,backups}
    mkdir -p "$APP_DIR"
    
    # Set proper permissions
    chown -R 1001:1001 "$DATA_ROOT"
    chmod -R 755 "$DATA_ROOT"
    
    print_success "Data directories created"
}

clone_repository() {
    print_status "Setting up application..."
    
    if [[ -d "$APP_DIR/.git" ]]; then
        print_status "Updating existing repository..."
        cd "$APP_DIR"
        git pull origin main || {
            print_warning "Git pull failed. Cloning fresh..."
            cd /opt
            rm -rf "$APP_DIR"
            git clone "$REPO_URL" "$APP_DIR"
        }
    else
        print_status "Cloning repository..."
        rm -rf "$APP_DIR"
        git clone "$REPO_URL" "$APP_DIR"
    fi
    
    cd "$APP_DIR"
    print_success "Repository ready"
}

generate_secrets() {
    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    SESSION_SECRET=$(openssl rand -base64 32 | tr -d '\n')
}

configure_environment() {
    print_status "Configuring environment..."
    
    # Prompt for ports
    read -p "Enter application port (default: $DEFAULT_PORT): " app_port
    app_port=${app_port:-$DEFAULT_PORT}
    
    read -p "Enter web port (default: $DEFAULT_NGINX_PORT): " nginx_port
    nginx_port=${nginx_port:-$DEFAULT_NGINX_PORT}
    
    # Generate secrets
    generate_secrets
    
    # Create .env file in data directory
    cat > "$DATA_ROOT/config/.env" << EOF
# Clinic Management System Configuration
# Generated on $(date)

# Database
DATABASE_URL="file:/app/data/clinic.db"

# Authentication
JWT_SECRET="$JWT_SECRET"
SESSION_SECRET="$SESSION_SECRET"

# Server
PORT=3000
HOST="0.0.0.0"
EOF
    
    # Create Docker environment file
    cat > "$APP_DIR/.env" << EOF
# Docker Configuration
CLINIC_DATA_ROOT=$DATA_ROOT
APP_PORT=$app_port
NGINX_PORT=$nginx_port
EOF
    
    # Create Nginx configuration
    cat > "$DATA_ROOT/config/nginx.conf" << 'EOF'
upstream clinic_app {
    server clinic-app:3000;
}

server {
    listen 80;
    server_name _;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://clinic_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
EOF
    
    # Set proper permissions
    chown -R 1001:1001 "$DATA_ROOT/config"
    chmod 600 "$DATA_ROOT/config/.env"
    
    print_success "Environment configured"
}

build_and_start() {
    print_status "Building and starting the application..."
    
    cd "$APP_DIR"
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start
    docker-compose up -d --build
    
    print_status "Waiting for application to start..."
    sleep 30
    
    # Check if containers are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Application started successfully"
    else
        print_error "Failed to start application. Check logs with: docker-compose logs"
        exit 1
    fi
}

create_systemd_service() {
    print_status "Creating systemd service..."
    
    cat > /etc/systemd/system/clinic-management.service << EOF
[Unit]
Description=Clinic Management System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable clinic-management
    
    print_success "Systemd service created and enabled"
}

create_management_scripts() {
    print_status "Creating management scripts..."
    
    # Create start script
    cat > "$DATA_ROOT/start-clinic.sh" << EOF
#!/bin/bash
cd "$APP_DIR"
docker-compose up -d
echo "Clinic Management System is starting..."
echo "Access at: http://localhost:$nginx_port"
EOF
    
    # Create stop script
    cat > "$DATA_ROOT/stop-clinic.sh" << EOF
#!/bin/bash
cd "$APP_DIR"
docker-compose down
echo "Clinic Management System stopped"
EOF
    
    # Create update script
    cat > "$DATA_ROOT/update-clinic.sh" << EOF
#!/bin/bash
cd "$APP_DIR"
echo "Updating Clinic Management System..."
git pull origin main
docker-compose up -d --build
echo "Update complete!"
EOF
    
    # Make scripts executable
    chmod +x "$DATA_ROOT"/*.sh
    
    print_success "Management scripts created"
}

setup_firewall() {
    print_status "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        # Allow SSH
        ufw allow ssh
        
        # Allow HTTP ports
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow "$nginx_port/tcp"
        
        # Enable firewall if not already enabled
        if ! ufw status | grep -q "Status: active"; then
            echo "y" | ufw enable
        fi
        
        print_success "Firewall configured"
    else
        print_warning "UFW not available, skipping firewall configuration"
    fi
}

display_summary() {
    local ip_address=$(hostname -I | awk '{print $1}')
    
    echo
    echo -e "${CYAN}====================================================${NC}"
    echo -e "${CYAN}           INSTALLATION SUCCESSFUL!${NC}"
    echo -e "${CYAN}====================================================${NC}"
    echo
    print_success "Clinic Management System is now running!"
    echo
    echo -e "${YELLOW}Access your application at:${NC}"
    echo "  - Local:   http://localhost:$nginx_port"
    echo "  - Network: http://$ip_address:$nginx_port"
    echo "  - Direct:  http://localhost:$app_port"
    echo
    echo -e "${YELLOW}Default login credentials:${NC}"
    echo "  - Admin: admin@clinic.local / admin123"
    echo "  - Reception: reception@clinic.local / reception123"
    echo "  - Physio: physio1@clinic.local / physio1"
    echo
    echo -e "${YELLOW}Management:${NC}"
    echo "  - Start:  $DATA_ROOT/start-clinic.sh"
    echo "  - Stop:   $DATA_ROOT/stop-clinic.sh"
    echo "  - Update: $DATA_ROOT/update-clinic.sh"
    echo "  - Logs:   docker-compose logs -f"
    echo
    echo -e "${YELLOW}Data Location:${NC} $DATA_ROOT"
    echo -e "${YELLOW}App Location:${NC}  $APP_DIR"
    echo
    print_status "The application will automatically start on boot"
    print_status "All your data is safely stored in $DATA_ROOT"
    echo
}

# Main installation flow
main() {
    print_header
    
    check_root
    detect_os
    install_docker
    install_git
    create_directories
    clone_repository
    configure_environment
    build_and_start
    create_systemd_service
    create_management_scripts
    setup_firewall
    display_summary
}

# Run main function
main "$@"