Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Redemarrage du serveur ProjectLink" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Arret des processus Node.js existants..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[2/2] Demarrage du serveur..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Serveur pret sur http://localhost:3003" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Set-Location $PSScriptRoot
& node server/index.js
