# 🚀 Clinic Management System - Docker Quick Start

One-click installation and deployment with Docker. No technical knowledge required!

## 📋 What This Does

- ✅ **Installs Docker** (if not present)
- ✅ **Downloads the application** from GitHub
- ✅ **Creates permanent data storage** (survives Docker uninstall/reinstall)
- ✅ **Configures everything automatically**
- ✅ **Starts the web application**
- ✅ **Sets up automatic startup** on boot

## 🖥️ Windows Installation

1. **Download** the setup script
2. **Right-click** `docker-setup-windows.bat` → **"Run as administrator"**
3. **Follow the prompts** (just press Enter for defaults)
4. **Access your clinic app** at the URL shown

```batch
# Download and run
curl -O https://raw.githubusercontent.com/Enrique-Mertoe/dct/main/docker-setup-windows.bat
# Right-click → Run as administrator
```

## 🐧 Linux Installation

1. **Download** and run the setup script
2. **Enter your preferences** (or press Enter for defaults)
3. **Access your clinic app** at the URL shown

```bash
# Download and run
curl -O https://raw.githubusercontent.com/Enrique-Mertoe/dct/main/docker-setup-linux.sh
sudo chmod +x docker-setup-linux.sh
sudo ./docker-setup-linux.sh
```

## 🏥 Default Access

After installation, access your clinic system:

- **Web Interface**: `http://localhost` (or the port you chose)
- **Network Access**: `http://YOUR-IP-ADDRESS` (shown after installation)

**Default Login Credentials:**
- **Admin**: `admin@clinic.local` / `admin123`
- **Reception**: `reception@clinic.local` / `reception123`
- **Physiotherapist**: `physio1@clinic.local` / `physio1`

## 📁 Data Storage Locations

### Windows
```
C:\ClinicData\
├── database\     (Patient records, appointments)
├── config\       (System settings)
├── uploads\      (Patient files, documents)
├── logs\         (System logs)
└── backups\      (Automated backups)
```

### Linux
```
/opt/clinic-data/
├── database/     (Patient records, appointments)
├── config/       (System settings)  
├── uploads/      (Patient files, documents)
├── logs/         (System logs)
└── backups/      (Automated backups)
```

## 🛠️ Management Commands

### Windows
```batch
# Start the system
C:\ClinicData\start-clinic.bat

# Stop the system  
C:\ClinicData\stop-clinic.bat

# View logs
cd C:\clinic-management
docker-compose logs -f
```

### Linux
```bash
# Start the system
/opt/clinic-data/start-clinic.sh

# Stop the system
/opt/clinic-data/stop-clinic.sh

# Update to latest version
/opt/clinic-data/update-clinic.sh

# View logs
cd /opt/clinic-app
docker-compose logs -f

# Backup data
docker/backup-restore.sh backup

# List backups
docker/backup-restore.sh list

# Restore backup
docker/backup-restore.sh restore backup-2024-01-15-14-30-00.tar.gz
```

## 🔄 Updating the System

### Automatic Updates (Linux)
```bash
/opt/clinic-data/update-clinic.sh
```

### Manual Updates (Both Platforms)
```bash
cd /path/to/clinic-app
git pull origin main
docker-compose up -d --build
```

## 🗄️ Backup and Recovery

### Create Backup
```bash
# Linux
docker/backup-restore.sh backup

# Windows - manual
# Copy entire C:\ClinicData folder to safe location
```

### Restore Backup
```bash
# Linux
docker/backup-restore.sh restore backup-filename.tar.gz

# Windows - manual
# Replace C:\ClinicData with your backup copy
# Restart: docker-compose up -d
```

## 🚨 Troubleshooting

### Application Won't Start
```bash
# Check if Docker is running
docker ps

# Check container logs
docker-compose logs clinic-app

# Restart everything
docker-compose down
docker-compose up -d
```

### Cannot Access Web Interface
1. **Check Windows Firewall** - Allow port 80 and 3000
2. **Check Linux Firewall** - `sudo ufw allow 80`
3. **Verify containers are running** - `docker-compose ps`

### Lost Admin Password
1. **Access database** in `database/clinic.db`
2. **Run SQL**: `UPDATE users SET password='$2b$10$hash' WHERE email='admin@clinic.local'`
3. **Or restore from backup**

### Complete Reset
```bash
# Stop and remove everything
docker-compose down
docker system prune -a

# Keep your data, reinstall application
# Windows: Re-run docker-setup-windows.bat
# Linux: Re-run docker-setup-linux.sh
```

## 🔐 Security Notes

- ✅ **All data stays on your local network**
- ✅ **No internet connection required after installation**
- ✅ **SQLite database with local file storage**
- ✅ **Role-based access controls**
- ✅ **Automatic daily backups**

## 📞 Support

1. **Check logs**: `docker-compose logs -f`
2. **Restart services**: `docker-compose restart`
3. **Check GitHub Issues**: [Repository Issues](https://github.com/Enrique-Mertoe/dct/issues)

## 🎯 Key Features

- 👥 **Multi-user roles**: Admin, Reception, Physiotherapist
- 📅 **Appointment scheduling** with time slot management
- 👤 **Patient record management**
- 🏥 **Treatment notes and progress tracking**
- 🔄 **Automatic backups**
- 🌐 **Network access from multiple computers**
- 💾 **Local data storage (HIPAA-friendly)**

**Perfect for small to medium clinics!** 🏥✨