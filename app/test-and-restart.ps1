# Script pour redémarrer le serveur et tester l'API

Write-Host "🔄 Redémarrage du serveur..." -ForegroundColor Yellow

# Arrêter les processus Node.js existants sur le port 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($processes) {
    foreach ($pid in $processes) {
        try {
            Stop-Process -Id $pid -Force
            Write-Host "✅ Processus $pid arrêté" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Impossible d'arrêter le processus $pid" -ForegroundColor Yellow
        }
    }
}

# Attendre un peu
Start-Sleep -Seconds 2

# Démarrer le serveur en arrière-plan
Write-Host "🚀 Démarrage du serveur..." -ForegroundColor Cyan
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node server/index.js
}

# Attendre que le serveur démarre
Write-Host "⏳ Attente du démarrage du serveur..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Tester l'API
Write-Host "🧪 Test de l'API branding..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/branding/config" -Method GET
    Write-Host "✅ API branding fonctionne !" -ForegroundColor Green
    Write-Host "Données reçues:" -ForegroundColor White
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erreur API: $($_.Exception.Message)" -ForegroundColor Red
    
    # Vérifier si le serveur répond
    try {
        $healthCheck = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
        Write-Host "✅ Serveur actif (health check OK)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Serveur non accessible" -ForegroundColor Red
    }
}

Write-Host "`n📋 Instructions:" -ForegroundColor Cyan
Write-Host "1. Vérifiez les logs du serveur avec: Receive-Job $($serverJob.Id)" -ForegroundColor White
Write-Host "2. Arrêtez le serveur avec: Stop-Job $($serverJob.Id)" -ForegroundColor White
Write-Host "3. Testez dans le navigateur: http://localhost:4000/superadmin" -ForegroundColor White

# Garder le job actif
Write-Host "`n🔌 Serveur en cours d'exécution (Job ID: $($serverJob.Id))" -ForegroundColor Green