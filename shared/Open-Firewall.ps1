# Run as Administrator on the SERVER PC once
$rules = @(
    @{ Name = "IMS-ADAPTIV Frontend 5173"; Port = 5173 },
    @{ Name = "IMS-ADAPTIV Backend 8000"; Port = 8000 }
)
foreach ($r in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -Protocol TCP -LocalPort $r.Port -Action Allow -Profile Any | Out-Null
        Write-Host "Added firewall rule: $($r.Name)" -ForegroundColor Green
    } else {
        Write-Host "Firewall rule already exists: $($r.Name)" -ForegroundColor Yellow
    }
}
Write-Host "`nOther devices on Wi-Fi can now reach this PC." -ForegroundColor Cyan
