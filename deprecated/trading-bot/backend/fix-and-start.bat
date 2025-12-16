@echo off
echo ===================================
echo Installing required dependencies...
echo ===================================
call npm install node-cache ioredis winston axios

echo ===================================
echo Finding available port...
echo ===================================
powershell -ExecutionPolicy Bypass -File .\find-port.ps1
echo Port found and .env updated

echo ===================================
echo Starting server...
echo ===================================
echo "Note: The server will start in a new window"
start cmd /k "npm run dev"

echo ===================================
echo Waiting for server to start...
echo ===================================
timeout /t 5 /nobreak

echo ===================================
echo Checking server status
echo ===================================
set /p PORT=<selected-port.txt
echo Server should be running on port %PORT%
echo Try accessing http://localhost:%PORT%/api/health in your browser

echo ===================================
echo Server setup completed
echo ===================================
echo If you see any errors, check the console output in the new window
echo Press any key to exit...
pause > nul