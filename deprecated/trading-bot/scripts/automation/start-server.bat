@echo off
echo Finding available port...
powershell -ExecutionPolicy Bypass -File .\find-port.ps1
echo Port found and .env updated

echo Starting server...
start cmd /k "npm run dev"

echo Waiting for server to start...
timeout /t 5 /nobreak

echo Checking if server is running...
set /p PORT=<selected-port.txt
echo Server should be running on port %PORT%
echo Try accessing http://localhost:%PORT%/api/health in your browser

echo Server started. Press any key to exit...
pause > nul