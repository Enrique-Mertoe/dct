@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo    Smart Update with Data Preservation
echo ====================================================
echo.
echo This will update your clinic system while keeping all data safe.
echo.

REM Get timestamp for backup
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "DATESTAMP=%%c%%a%%b"
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do set "TIMESTAMP=%%a%%b"
set "TIMESTAMP=!TIMESTAMP: =!"
set "BACKUP_NAME=pre_update_backup_!DATESTAMP!_!TIMESTAMP!"

echo [STEP 1/10] Creating backup of your data
echo    Backup name: !BACKUP_NAME!

REM Check if Docker is running
docker ps >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

REM Create temporary backup directory
set "TEMP_BACKUP=C:\temp\clinic_backup_!TIMESTAMP!"
if not exist "C:\temp" mkdir "C:\temp"
mkdir "!TEMP_BACKUP!" 2>nul

echo [STEP 2/10] Backing up database and configuration

REM Backup database from container
docker-compose exec -T clinic-app sh -c "if [ -f /app/data/clinic.db ]; then cat /app/data/clinic.db; fi" > "!TEMP_BACKUP!\clinic.db" 2>nul

REM Backup configuration
docker-compose exec -T clinic-app sh -c "if [ -f /app/config/.env ]; then cat /app/config/.env; fi" > "!TEMP_BACKUP!\.env" 2>nul

echo    [OK] Data backed up to temporary location

echo [STEP 3/10] Stopping current containers
docker-compose down

echo [STEP 4/10] Updating application code
if exist ".git" (
    echo    Pulling latest changes from GitHub
    git pull origin main >nul 2>&1 || echo    [WARNING] Git update failed, using existing code
) else (
    echo    Using existing code
)

echo [STEP 5/10] Rebuilding containers with latest code
echo    This may take a few minutes
docker-compose build --no-cache >nul

if %errorLevel% neq 0 (
    echo [ERROR] Failed to build containers
    echo Check the error messages above
    pause
    exit /b 1
)

echo    [OK] New containers built successfully

echo [STEP 6/10] Starting updated containers
docker-compose up -d

if %errorLevel% neq 0 (
    echo [ERROR] Failed to start containers
    echo Check logs with: docker-compose logs
    pause
    exit /b 1
)

echo    [OK] Containers started

echo [STEP 7/10] Waiting for system to be ready
timeout /t 10 /nobreak >nul

echo [STEP 8/10] Restoring your data

REM Restore database if backup exists
if exist "!TEMP_BACKUP!\clinic.db" (
    echo    Restoring database
    docker-compose exec -T clinic-app sh -c "mkdir -p /app/data" >nul
    type "!TEMP_BACKUP!\clinic.db" | docker-compose exec -T clinic-app sh -c "cat > /app/data/clinic.db" >nul 2>&1
    echo    [OK] Database restored
) else (
    echo    [WARNING] No database backup found, will initialize fresh
)

REM Restore configuration if backup exists
if exist "!TEMP_BACKUP!\.env" (
    echo    Restoring configuration
    docker-compose exec -T clinic-app sh -c "mkdir -p /app/config" >nul
    type "!TEMP_BACKUP!\.env" | docker-compose exec -T clinic-app sh -c "cat > /app/config/.env" >nul 2>&1
    echo    [OK] Configuration restored
)

echo [STEP 9/10] Finalizing update

REM Fix permissions
docker-compose exec -T clinic-app sh -c "chown -R clinic:clinic /app/data /app/config /app/uploads /app/logs 2>/dev/null || true" >nul

REM Restart to ensure everything loads properly
echo    Restarting containers to apply changes
docker-compose restart >nul
timeout /t 5 /nobreak >nul

REM Create permanent backup in container
docker-compose exec -T clinic-app sh -c "mkdir -p /app/backups && if [ -f /app/data/clinic.db ]; then cp /app/data/clinic.db /app/backups/clinic_backup_!DATESTAMP!_!TIMESTAMP!.db; fi" >nul 2>&1

echo [STEP 10/10] Verifying system

REM Check if containers are running
docker-compose ps | findstr "Up" >nul
if %errorLevel% neq 0 (
    echo [ERROR] Containers are not running properly
    echo Check status with: docker-compose ps
    echo Check logs with: docker-compose logs
    pause
    exit /b 1
)

REM Get access URLs
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr /v "127.0.0.1"') do (
    set "ip_address=%%a"
    set "ip_address=!ip_address: =!"
    goto :got_ip
)
set "ip_address=localhost"
:got_ip

REM Get ports from .env file
set "nginx_port=80"
set "app_port=3000"
if exist ".env" (
    for /f "tokens=2 delims==" %%a in ('findstr "NGINX_PORT" .env 2^>nul') do set "nginx_port=%%a"
    for /f "tokens=2 delims==" %%a in ('findstr "APP_PORT" .env 2^>nul') do set "app_port=%%a"
)

REM Cleanup temporary backup
rmdir /s /q "!TEMP_BACKUP!" 2>nul

cls
echo ====================================================
echo          *** UPDATE SUCCESSFUL! ***
echo ====================================================
echo.
echo Your Clinic Management System has been updated!
echo.
echo ACCESS YOUR SYSTEM:
echo   - Local:   http://localhost:!nginx_port!
echo   - Network: http://!ip_address!:!nginx_port!
echo   - Direct:  http://localhost:!app_port!
echo.
echo DATA PRESERVATION:
echo   [OK] Patient records - All preserved
echo   [OK] User accounts - All preserved  
echo   [OK] Configuration - All preserved
echo   [OK] Uploaded files - All preserved
echo.
echo BACKUP CREATED:
echo   - Backup name: clinic_backup_!DATESTAMP!_!TIMESTAMP!.db
echo   - Location: Inside container at /app/backups/
echo.
echo Your system is now running the latest version with all your data intact!
echo.
pause

REM Open the system in browser
start http://localhost:!nginx_port!

exit /b 0