# Exposes IMS-ADAPTIV worldwide via Cloudflare Tunnel (stable)
Write-Host "=== IMS-ADAPTIV Public Access ===" -ForegroundColor Cyan

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$root = $PSScriptRoot

# Ensure cloudflared exists
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Cloudflare Tunnel..." -ForegroundColor Yellow
    winget install Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements --disable-interactivity
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Ensure local servers are up
$front = netstat -ano | findstr "LISTENING" | findstr ":5173"
$back = netstat -ano | findstr "LISTENING" | findstr ":8000"
if (-not $front -or -not $back) {
    Write-Host "Starting local servers..." -ForegroundColor Yellow
    & "$root\start.ps1"
    Start-Sleep -Seconds 10
}

# Stop broken/old tunnels
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -eq "cloudflared.exe" -or ($_.CommandLine -match "localtunnel|loca\.lt") } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Write-Host "`nOpening stable public tunnel..." -ForegroundColor Green
Write-Host "Copy the https://....trycloudflare.com link that appears below." -ForegroundColor Yellow
Write-Host "Keep this window open while people use the system.`n" -ForegroundColor Yellow

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "cloudflared"
$psi.Arguments = "tunnel --url http://127.0.0.1:5173"
$psi.RedirectStandardError = $true
$psi.RedirectStandardOutput = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $false
$p = New-Object System.Diagnostics.Process
$p.StartInfo = $psi
[void]$p.Start()

$url = $null
$deadline = (Get-Date).AddMinutes(2)
while ((Get-Date) -lt $deadline -and -not $url) {
    Start-Sleep -Milliseconds 500
    $err = $p.StandardError.ReadLine()
    if ($err) {
        Write-Host $err
        $m = [regex]::Match($err, "https://[a-z0-9-]+\.trycloudflare\.com")
        if ($m.Success) { $url = $m.Value }
    }
    if ($p.HasExited) { break }
}

if ($url) {
    @"
IMS-ADAPTIV Public URL (working)
================================

$url

Login:
$url/login

User: admin
Pass: admin123

Notes:
- Keep the PC on and this tunnel window open.
- Re-open later with: start-public.ps1
"@ | Set-Content (Join-Path $root "shared\PUBLIC-URL.txt") -Encoding utf8

    @"
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=$url/login" />
  <title>IMS-ADAPTIV</title>
  <style>
    body { font-family: Tajawal, sans-serif; background:#221f1f; color:#fff; display:flex; min-height:100vh; align-items:center; justify-content:center; }
    a { color:#fdbc1a; font-size:1.25rem; }
  </style>
</head>
<body>
  <div>
    <h1>IMS-ADAPTIV</h1>
    <p>جاري فتح النظام...</p>
    <p><a href="$url/login">$url/login</a></p>
  </div>
</body>
</html>
"@ | Set-Content (Join-Path $root "shared\IMS-ADAPTIV.html") -Encoding utf8

    Write-Host "`nPublic URL:" -ForegroundColor Green
    Write-Host $url -ForegroundColor Cyan
    Write-Host "`nSaved to shared\PUBLIC-URL.txt and shared\IMS-ADAPTIV.html" -ForegroundColor Green
}

$p.WaitForExit()
