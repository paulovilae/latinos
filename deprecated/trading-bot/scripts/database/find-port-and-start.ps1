# Test a range of ports
$startPort = 3000
$endPort = 3020
$availablePort = $null

Write-Host "Checking for available ports in range $startPort-$endPort..."

for ($port = $startPort; $port -le $endPort; $port++) {
    $listener = $null
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port)
        $listener.Start()
        $availablePort = $port
        Write-Host "Port $port is available"
        break
    } catch {
        Write-Host "Port $port is in use"
    } finally {
        if ($listener -ne $null) {
            $listener.Stop()
        }
    }
}

if ($availablePort -eq $null) {
    Write-Host "No available ports found in range $startPort-$endPort"
    exit 1
}

# Update .env file
$envPath = ".env"
$envExists = Test-Path $envPath

if ($envExists) {
    $envContent = Get-Content $envPath
    $updated = $false
    
    for ($i = 0; $i -lt $envContent.Length; $i++) {
        if ($envContent[$i] -match "^PORT=") {
            $envContent[$i] = "PORT=$availablePort"
            $updated = $true
            break
        }
    }
    
    if (-not $updated) {
        $envContent += "PORT=$availablePort"
    }
    
    Set-Content -Path $envPath -Value $envContent
} else {
    "PORT=$availablePort" | Out-File -FilePath $envPath -Encoding utf8
}

Write-Host "Updated .env file with PORT=$availablePort"

# Start the server
Write-Host "Starting server on port $availablePort..."
npm run dev