# Test a range of ports
$startPort = 3000
$endPort = 5000
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

# Write port to a separate file for easy reference
$availablePort | Out-File -FilePath "selected-port.txt" -Encoding utf8

Write-Host "Selected port: $availablePort"
Write-Host "Updated .env file with PORT=$availablePort"
Write-Host "Port number saved to selected-port.txt"

# Return the port number for use in scripts
return $availablePort