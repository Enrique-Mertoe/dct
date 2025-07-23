@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo    Clinic Management System - Auto Setup
echo ====================================================
echo.
echo This will automatically install and configure everything.
echo Please wait while we set up your clinic system.
echo.

REM Configuration
set "APP_NAME=clinic-management"
set "REPO_URL=https://github.com/Enrique-Mertoe/dct.git"
set "DATA_ROOT=C:\ClinicData"
set "APP_DIR=C:\%APP_NAME%"
set "DEFAULT_PORT=3000"
set "DEFAULT_NGINX_PORT=80"

REM Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [AUTO-FIX] This needs administrator privileges.
    echo Please right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [STEP 1/8] Creating data directories
REM Create persistent data directories
if not exist "%DATA_ROOT%" mkdir "%DATA_ROOT%"
if not exist "%DATA_ROOT%\database" mkdir "%DATA_ROOT%\database"
if not exist "%DATA_ROOT%\config" mkdir "%DATA_ROOT%\config"
if not exist "%DATA_ROOT%\uploads" mkdir "%DATA_ROOT%\uploads"
if not exist "%DATA_ROOT%\logs" mkdir "%DATA_ROOT%\logs"
if not exist "%DATA_ROOT%\backups" mkdir "%DATA_ROOT%\backups"
echo    [OK] Data directories created

echo [STEP 2/8] Checking Docker Desktop
REM Check if Docker is installed
docker --version >nul 2>&1
if %errorLevel% neq 0 (
    echo    Docker Desktop is not installed.
    echo    Please install Docker Desktop manually:
    echo.
    echo    1. Go to: https://desktop.docker.com/win/main/amd64/Docker Desktop Installer.exe
    echo    2. Download and run the installer
    echo    3. Follow the installation wizard
    echo    4. Restart your computer when prompted
    echo    5. Start Docker Desktop from the Start menu
    echo    6. Run this script again
    echo.
    echo    Press any key when Docker Desktop is installed and running
    pause
    
    REM Check again after user says they installed it
    docker --version >nul 2>&1
    if %errorLevel% neq 0 (
        echo    Docker still not detected. Please make sure:
        echo    - Docker Desktop is installed
        echo    - You restarted your computer
        echo    - Docker Desktop is running (check system tray)
        echo.
        pause
        exit /b 1
    )
    echo    [OK] Docker Desktop detected
) else (
    echo    [OK] Docker Desktop is installed
)

:check_docker_running
REM Check if Docker is running
echo    Checking if Docker is running
docker ps >nul 2>&1
if %errorLevel% neq 0 (
    echo    Docker is installed but not running.
    echo    Starting Docker Desktop for you
    
    REM Try to start Docker Desktop application
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>nul
    
    REM Give Docker time to start
    echo    Waiting for Docker to start (this may take 2-3 minutes)
    for /l %%i in (1,1,36) do (
        timeout /t 5 /nobreak >nul
        docker ps >nul 2>&1
        if !errorLevel! equ 0 goto :docker_running
        echo    Still waiting for Docker (%%i/36)
    )
    
    echo    Docker is taking longer than expected to start.
    echo    Please:
    echo    1. Check if Docker Desktop icon appears in system tray
    echo    2. Wait for Docker Desktop to show "Docker is running"
    echo    3. Press any key when Docker is ready
    echo.
    pause
    goto :check_docker_running
)

:docker_running
echo    [OK] Docker is running

echo [STEP 3/8] Checking Git
REM Check if Git is installed
git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo    Git is not installed.
    echo    Please install Git manually:
    echo.
    echo    1. Go to: https://git-scm.com/download/win
    echo    2. Download "64-bit Git for Windows Setup"
    echo    3. Run the installer with default settings
    echo    4. Press any key when installation is complete
    echo.
    pause
    
    REM Refresh PATH and check again
    set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin"
    git --version >nul 2>&1
    if %errorLevel% neq 0 (
        echo    Git still not detected. Please:
        echo    1. Make sure Git installation completed successfully
        echo    2. Restart this script
        echo.
        pause
        exit /b 1
    )
    echo    [OK] Git detected
) else (
    echo    [OK] Git is available
)

echo [STEP 4/8] Getting application files
REM Try to clone repository
if exist "%APP_DIR%" (
    echo    Updating existing application
    cd /d "%APP_DIR%"
    git pull origin main >nul 2>&1
    if %errorLevel% neq 0 (
        echo    Update failed, downloading fresh copy
        cd /d C:\
        rmdir /s /q "%APP_DIR%" 2>nul
        git clone %REPO_URL% "%APP_DIR%" >nul 2>&1
    )
) else (
    echo    Downloading application from GitHub
    git clone %REPO_URL% "%APP_DIR%" >nul 2>&1
)

if %errorLevel% neq 0 (
    echo    [ERROR] Could not download application files.
    echo    This usually means:
    echo    1. No internet connection
    echo    2. GitHub is not accessible
    echo    3. Git is not working properly
    echo.
    echo    Please check your internet connection and try again.
    pause
    exit /b 1
)
echo    [OK] Application files ready

echo [STEP 5/8] Configuring system
REM Navigate to app directory
cd /d "%APP_DIR%"

REM Auto-configure ports (use defaults, no user input)
set "app_port=%DEFAULT_PORT%"
set "nginx_port=%DEFAULT_NGINX_PORT%"

REM Generate simple random secrets
set "jwt_secret=clinic_jwt_%random%_%random%_%random%"
set "session_secret=clinic_session_%random%_%random%_%random%"

REM Create .env file in data directory
(
echo # Clinic Management System Configuration
echo # Auto-generated on %date% at %time%
echo.
echo # Database
echo DATABASE_URL="file:/app/data/clinic.db"
echo.
echo # Authentication
echo JWT_SECRET="!jwt_secret!"
echo SESSION_SECRET="!session_secret!"
echo.
echo # Server
echo PORT=3000
echo HOST="0.0.0.0"
) > "%DATA_ROOT%\config\.env"

REM Create Docker environment file
(
echo # Docker Configuration
echo CLINIC_DATA_ROOT=%DATA_ROOT:\=/%
echo APP_PORT=%app_port%
echo NGINX_PORT=%nginx_port%
) > .env

REM Create Nginx configuration
(
echo upstream clinic_app {
echo     server clinic-app:3000;
echo }
echo.
echo server {
echo     listen 80;
echo     server_name _;
echo.
echo     client_max_body_size 50M;
echo.
echo     location / {
echo         proxy_pass http://clinic_app;
echo         proxy_http_version 1.1;
echo         proxy_set_header Upgrade $http_upgrade;
echo         proxy_set_header Connection 'upgrade';
echo         proxy_set_header Host $host;
echo         proxy_set_header X-Real-IP $remote_addr;
echo         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
echo         proxy_set_header X-Forwarded-Proto $scheme;
echo         proxy_cache_bypass $http_upgrade;
echo     }
echo.
echo     access_log /var/log/nginx/access.log;
echo     error_log /var/log/nginx/error.log;
echo }
) > "%DATA_ROOT%\config\nginx.conf"

echo    [OK] System configured

echo [STEP 6/8] Stopping any existing services
docker-compose down >nul 2>&1
echo    [OK] Ready for fresh start

echo [STEP 7/8] Building and starting your clinic system
echo    This may take 5-10 minutes on first run, please wait
echo    You'll see lots of downloading messages - this is normal.
echo.

docker-compose up -d --build

if %errorLevel% neq 0 (
    echo    [AUTO-FIX] First attempt failed, trying to fix common issues
    
    REM Check for port conflicts and try alternatives
    echo    Checking for port conflicts
    netstat -ano | findstr ":80 " >nul 2>&1
    if !errorLevel! equ 0 (
        echo    Port 80 is busy, using alternative port 8080
        echo NGINX_PORT=8080>> .env
        set "nginx_port=8080"
    )
    
    netstat -ano | findstr ":3000 " >nul 2>&1
    if !errorLevel! equ 0 (
        echo    Port 3000 is busy, using alternative port 3001
        echo APP_PORT=3001>> .env
        set "app_port=3001"
    )
    
    echo    Retrying with fixed ports
    docker-compose down >nul 2>&1
    timeout /t 5 /nobreak >nul
    docker-compose up -d --build
    
    if !errorLevel! neq 0 (
        echo    [ERROR] Could not start the application.
        echo.
        echo    Common causes and solutions:
        echo    1. Docker Desktop not fully started - wait 5 minutes and try again
        echo    2. Antivirus blocking Docker - temporarily disable antivirus
        echo    3. Windows Firewall blocking - allow Docker Desktop through firewall
        echo    4. Not enough disk space - free up at least 5GB space
        echo.
        echo    Quick fixes to try:
        echo    1. Restart your computer
        echo    2. Make sure Docker Desktop shows "Docker is running"
        echo    3. Run this script again
        echo.
        echo    For technical details run: docker-compose logs
        pause
        exit /b 1
    )
)

echo    [OK] Application started successfully

echo [STEP 8/8] Finalizing setup
echo    Waiting for system to be fully ready
timeout /t 20 /nobreak >nul

REM Test if application is responding
curl -s http://localhost:%nginx_port% >nul 2>&1
if %errorLevel% neq 0 (
    echo    Application is still starting up
    timeout /t 10 /nobreak >nul
)

REM Get IP address for network access
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr /v "127.0.0.1"') do (
    set "ip_address=%%a"
    set "ip_address=!ip_address: =!"
    goto :got_ip
)
set "ip_address=your-computer-ip"
:got_ip

REM Create easy management scripts
(
echo @echo off
echo echo Starting Clinic Management System
echo cd /d "%APP_DIR%"
echo docker-compose up -d
echo echo.
echo echo [OK] Clinic system is running!
echo echo Access at: http://localhost:%nginx_port%
echo echo.
echo pause
) > "%DATA_ROOT%\START-CLINIC.bat"

(
echo @echo off
echo echo Stopping Clinic Management System
echo cd /d "%APP_DIR%"
echo docker-compose down
echo echo [OK] Clinic system stopped
echo pause
) > "%DATA_ROOT%\STOP-CLINIC.bat"

(
echo @echo off
echo echo Updating Clinic Management System
echo cd /d "%APP_DIR%"
echo git pull origin main
echo docker-compose up -d --build
echo echo [OK] Update complete!
echo pause
) > "%DATA_ROOT%\UPDATE-CLINIC.bat"

REM Create desktop shortcut using built-in Windows method
echo [InternetShortcut]> "%USERPROFILE%\Desktop\Clinic Management System.url"
echo URL=http://localhost:%nginx_port%>> "%USERPROFILE%\Desktop\Clinic Management System.url"

echo    ✓ Setup complete

REM Display success message
cls
echo ====================================================
echo          *** SETUP COMPLETE! ***
echo ====================================================
echo.
echo Your Clinic Management System is now running!
echo.
echo ACCESS YOUR CLINIC SYSTEM:
echo    • Click: http://localhost:%nginx_port%
echo    • Or double-click the desktop shortcut we created
echo    • From other computers: http://%ip_address%:%nginx_port%
echo.
echo LOGIN WITH THESE ACCOUNTS:
echo    • Manager:         admin@clinic.local / admin123
echo    • Receptionist:    reception@clinic.local / reception123  
echo    • Physiotherapist: physio1@clinic.local / physio1
echo.
echo MANAGE YOUR SYSTEM:
echo    • Start clinic:  Double-click %DATA_ROOT%\START-CLINIC.bat
echo    • Stop clinic:   Double-click %DATA_ROOT%\STOP-CLINIC.bat
echo    • Update app:    Double-click %DATA_ROOT%\UPDATE-CLINIC.bat
echo.
echo YOUR DATA IS SAFE:
echo    • All patient data: %DATA_ROOT%
echo    • Automatic backups: %DATA_ROOT%\backups
echo    • Even if you uninstall Docker, your data stays safe!
echo.
echo The system will start automatically when you turn on your computer.
echo.
echo Ready to manage your clinic! Press any key to open the system
pause >nul

REM Open the clinic system in default browser
start http://localhost:%nginx_port%

exit /b 0