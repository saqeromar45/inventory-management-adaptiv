Write-Host "=== IMS-ADAPTIV ===" -ForegroundColor Cyan

$sharedDir = Join-Path $PSScriptRoot "shared"
$configPath = Join-Path $sharedDir "IMS.ADAPTIV.config"

# Detect current LAN IP and write it to the shared config file
$lanIp = (
    Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -notlike "127.*" -and
        $_.IPAddress -notlike "169.254.*" -and
        $_.InterfaceAlias -notmatch "Loopback|vEthernet|WSL|Bluetooth"
    } |
    Sort-Object -Property PrefixLength |
    Select-Object -ExpandProperty IPAddress -First 1
)

if (-not $lanIp) {
    Write-Host "Could not detect LAN IP. Edit shared\IMS.ADAPTIV.config manually." -ForegroundColor Red
    $lanIp = "192.168.1.2"
}

@"
# IMS-ADAPTIV network config
# Auto-updated by start.ps1 — share the shared\ folder with other PCs
SERVER_IP=$lanIp
HOSTNAME=IMS.ADAPTIV
PORT=5173
"@ | Set-Content -Path $configPath -Encoding ascii

Write-Host "Server LAN IP: $lanIp" -ForegroundColor Yellow
Write-Host "Shared config: $configPath" -ForegroundColor Yellow

# Allow inbound traffic for other devices on the same Wi-Fi/LAN
try {
    $rules = @(
        @{ Name = "IMS-ADAPTIV Frontend 5173"; Port = 5173 },
        @{ Name = "IMS-ADAPTIV Backend 8000"; Port = 8000 }
    )
    foreach ($r in $rules) {
        if (-not (Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue)) {
            New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -Protocol TCP -LocalPort $r.Port -Action Allow -Profile Private,Domain -ErrorAction SilentlyContinue | Out-Null
        }
    }
} catch {
    Write-Host "Firewall rule skipped (run start.ps1 as Administrator if other devices are blocked)." -ForegroundColor DarkYellow
}

# Backend - listen on all interfaces
Write-Host "`nStarting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; if (-not (Test-Path venv)) { python -m venv venv }; .\venv\Scripts\Activate.ps1; pip install -r requirements.txt -q; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 3

# Frontend - listen on all interfaces
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm install; npm run dev -- --host 0.0.0.0 --port 5173"

Write-Host "`nThis PC:" -ForegroundColor Green
Write-Host "  http://IMS.ADAPTIV:5173" -ForegroundColor Green
Write-Host "  http://${lanIp}:5173" -ForegroundColor Green
Write-Host "`nOther PCs on same Wi-Fi:" -ForegroundColor Cyan
Write-Host "  1) Copy the folder: shared\" -ForegroundColor Cyan
Write-Host "  2) Run Connect-IMS-ADAPTIV.bat as Administrator once" -ForegroundColor Cyan
Write-Host "  3) Open http://IMS.ADAPTIV:5173" -ForegroundColor Cyan
Write-Host "`nLogin: admin / admin123" -ForegroundColor Green
