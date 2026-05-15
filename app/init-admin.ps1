Write-Host "Initialisation de la base de donnees admin..." -ForegroundColor Yellow

# Verifier si Node.js est installe
try {
    $nodeVersion = node --version
    Write-Host "Node.js detecte: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js n'est pas installe ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Aller dans le dossier server
Set-Location server

# Executer le script d'initialisation
try {
    Write-Host "Execution du script d'initialisation..." -ForegroundColor Blue
    node scripts/init-admin.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Initialisation terminee avec succes!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Credentials par defaut:" -ForegroundColor Cyan
        Write-Host "   Email: admin@superadmin.com" -ForegroundColor White
        Write-Host "   Mot de passe: admin123" -ForegroundColor White
        Write-Host ""
        Write-Host "Changez ces credentials en production!" -ForegroundColor Yellow
    } else {
        Write-Host "Erreur lors de l'initialisation" -ForegroundColor Red
    }
} catch {
    Write-Host "Erreur: $_" -ForegroundColor Red
}

# Retourner au dossier parent
Set-Location ..

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")