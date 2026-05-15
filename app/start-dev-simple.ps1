Write-Host "🚀 Démarrage de la plateforme Prolink..." -ForegroundColor Green
Write-Host ""
Write-Host "📌 Configuration:" -ForegroundColor Yellow
Write-Host "  - Present frontend:  http://localhost:3003" -ForegroundColor Cyan
Write-Host "  - Superadmin panel:  http://localhost:3003/superadmin" -ForegroundColor Cyan
Write-Host "  - API Backend:       http://localhost:3003/api" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔄 Démarrage des services..." -ForegroundColor Green
Write-Host ""

# Démarrer avec concurrently
concurrently --names "API,Present,SuperAdmin" --prefix "[{name}]" --color "auto" "node server/index.js" "npm --prefix ./present run dev" "npm --prefix ./superadmin run dev"