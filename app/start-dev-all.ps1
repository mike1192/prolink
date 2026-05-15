# Script de démarrage développement - API sur port 3003, frontends sur ports séparés
# present: http://localhost:8080 (dev server)
# superadmin: http://localhost:4000 (dev server)  
# API: http://localhost:3003/api

Write-Host "🚀 Démarrage de la plateforme Prolink..." -ForegroundColor Green
Write-Host ""
Write-Host "📌 Configuration:" -ForegroundColor Yellow
Write-Host "  - Present frontend:  http://localhost:8080 (dev)" -ForegroundColor Cyan
Write-Host "  - Superadmin panel:  http://localhost:4000 (dev)" -ForegroundColor Cyan
Write-Host "  - API Backend:       http://localhost:3003/api" -ForegroundColor Cyan
Write-Host "  - WebSocket:         ws://localhost:3003" -ForegroundColor Cyan
Write-Host ""

# Vérifier que les dépendances sont installées
if (!(Test-Path "./node_modules")) {
    Write-Host "📦 Installation des dépendances racine..." -ForegroundColor Yellow
    npm install
}

if (!(Test-Path "./present/node_modules")) {
    Write-Host "📦 Installation des dépendances present..." -ForegroundColor Yellow
    Set-Location present
    npm install
    Set-Location ..
}

if (!(Test-Path "./superadmin/node_modules")) {
    Write-Host "📦 Installation des dépendances superadmin..." -ForegroundColor Yellow
    Set-Location superadmin
    npm install
    Set-Location ..
}

# Installer concurrently si pas présent
try {
    $null = npm list -g concurrently 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "📦 Installation de concurrently (pour démarrage parallèle)..." -ForegroundColor Yellow
        npm install -g concurrently
    }
} catch {
    Write-Host "📦 Installation de concurrently (pour démarrage parallèle)..." -ForegroundColor Yellow
    npm install -g concurrently
}

Write-Host ""
Write-Host "🔄 Démarrage des services en mode développement..." -ForegroundColor Green
Write-Host "Appuyez sur Ctrl+C pour arrêter tous les services" -ForegroundColor Yellow
Write-Host ""

# Utiliser concurrently pour démarrer tous les services en parallèle
& concurrently --names "API,Present,SuperAdmin" --prefix "[{name}]" --color "auto" "node server/index.js" "npm --prefix ./present run dev" "npm --prefix ./superadmin run dev"