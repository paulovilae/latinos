# PowerShell script to run all tests with the new organization structure

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

Write-Host "Running all tests for AI Trading Bot Platform..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Run frontend tests
Write-Host "`nRunning frontend component tests..." -ForegroundColor Cyan
try {
    npm test
} catch {
    Write-Host "Error running frontend tests: $_" -ForegroundColor Red
}

# Run service tests
Write-Host "`nRunning service tests..." -ForegroundColor Cyan
try {
    npm run test:services
} catch {
    Write-Host "Error running service tests: $_" -ForegroundColor Red
}

# Run backend tests
Write-Host "`nRunning backend tests..." -ForegroundColor Cyan
try {
    Push-Location backend
    npm run test:all
    Pop-Location
} catch {
    Write-Host "Error running backend tests: $_" -ForegroundColor Red
    Pop-Location
}

# Run bot tests (if pytest is available)
Write-Host "`nRunning bot microservice tests..." -ForegroundColor Cyan
try {
    Push-Location bot_microservice
    python -m pytest
    Pop-Location
} catch {
    Write-Host "Error running bot tests: $_" -ForegroundColor Red
    Pop-Location
}

Write-Host "`nAll tests completed!" -ForegroundColor Green