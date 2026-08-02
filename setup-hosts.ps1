# Updates THIS server PC hosts entry for IMS.ADAPTIV
# Prefer shared\Connect-IMS-ADAPTIV.ps1 for other devices
$ErrorActionPreference = "Stop"
$configPath = Join-Path $PSScriptRoot "shared\IMS.ADAPTIV.config"

$serverIp = "127.0.0.1"
$hostname = "IMS.ADAPTIV"

if (Test-Path $configPath) {
    Get-Content $configPath | ForEach-Object {
        if ($_ -match '^\s*SERVER_IP\s*=\s*(.+)$') { $serverIp = $Matches[1].Trim() }
        if ($_ -match '^\s*HOSTNAME\s*=\s*(.+)$') { $hostname = $Matches[1].Trim() }
    }
}

# On the server itself, 127.0.0.1 is fine; keep LAN IP too via shared script for clients
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$entryLocal = "127.0.0.1`t$hostname"
$lines = Get-Content $hostsPath
$filtered = $lines | Where-Object { $_ -notmatch "(?i)\b$([regex]::Escape($hostname))\b" }
$filtered + $entryLocal | Set-Content -Path $hostsPath -Encoding ascii

Write-Host "This PC: $hostname -> 127.0.0.1" -ForegroundColor Green
Write-Host "Other PCs: run shared\Connect-IMS-ADAPTIV.bat (uses SERVER_IP=$serverIp)" -ForegroundColor Cyan
Write-Host "Open: http://${hostname}:5173" -ForegroundColor Cyan
