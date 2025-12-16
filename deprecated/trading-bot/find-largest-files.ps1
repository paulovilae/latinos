# Script to find the 10 largest JavaScript/TypeScript files
Write-Host "Finding the 10 largest JavaScript/TypeScript files (excluding node_modules)..."

Get-ChildItem -Path . -Recurse -Include *.js,*.jsx,*.ts,*.tsx | 
Where-Object { 
    # Exclude node_modules directories
    $_.FullName -notmatch "node_modules"
} | 
Select-Object FullName, @{Name="Lines"; Expression={(Get-Content $_.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines}} |
Sort-Object Lines -Descending |
Select-Object -First 10 |
Format-Table -AutoSize