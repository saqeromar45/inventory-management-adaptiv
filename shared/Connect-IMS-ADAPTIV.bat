@echo off
:: Double-click this file on any PC (asks for Administrator once)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0Connect-IMS-ADAPTIV.ps1\"' -Wait"
echo.
pause
