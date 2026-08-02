# Run as Administrator on ANY PC that should open http://IMS.ADAPTIV:5173
$ErrorActionPreference = "Stop"
$configPath = Join-Path $PSScriptRoot "IMS.ADAPTIV.config"

if (-not (Test-Path $configPath)) {
    Write-Host "Missing config: $configPath" -ForegroundColor Red
    exit 1
}

$serverIp = $null
$hostname = "IMS.ADAPTIV"
$port = "5173"

Get-Content $configPath | ForEach-Object {
    if ($_ -match '^\s*SERVER_IP\s*=\s*(.+)$') { $serverIp = $Matches[1].Trim() }
    if ($_ -match '^\s*HOSTNAME\s*=\s*(.+)$') { $hostname = $Matches[1].Trim() }
    if ($_ -match '^\s*PORT\s*=\s*(.+)$') { $port = $Matches[1].Trim() }
}

if (-not $serverIp) {
    Write-Host "SERVER_IP not found in config." -ForegroundColor Red
    exit 1
}

$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$entry = "$serverIp`t$hostname"
$lines = Get-Content $hostsPath
$filtered = $lines | Where-Object { $_ -notmatch "(?i)\b$([regex]::Escape($hostname))\b" }
$filtered + $entry | Set-Content -Path $hostsPath -Encoding ascii

Write-Host "Linked $hostname -> $serverIp" -ForegroundColor Green
Write-Host "Open: http://${hostname}:${port}" -ForegroundColor Cyan
Write-Host "Login page: http://${hostname}:${port}/login" -ForegroundColor Cyan
