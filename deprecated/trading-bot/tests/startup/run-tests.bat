@echo off
echo Running AI Trading Bot Platform Startup System Tests...
echo =======================================================

echo.
echo 1. Running main startup system tests...
node test-startup-system.js
if %ERRORLEVEL% NEQ 0 (
    echo Main startup system tests failed with exit code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

echo.
echo 2. Running failure handling tests...
node test-startup-failures.js
if %ERRORLEVEL% NEQ 0 (
    echo Failure handling tests failed with exit code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

echo.
echo All tests completed successfully!
echo See test-logs directory and failure-handling-test-report.md for detailed results.