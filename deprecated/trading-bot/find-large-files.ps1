# Script to find JavaScript/TypeScript files with more than 800 lines
Write-Host "Finding JavaScript/TypeScript files with more than 800 lines (excluding node_modules)..."

Get-ChildItem -Path . -Recurse -Include *.js,*.jsx,*.ts,*.tsx |
Where-Object {
    # Exclude node_modules directories
    $_.FullName -notmatch "node_modules" -and
    # Get line count for the file
    (Get-Content $_.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines -gt 800
} |
Select-Object FullName, @{Name="Lines"; Expression={(Get-Content $_.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines}} |
Sort-Object Lines -Descending |
Format-Table -AutoSize