@echo off
REM Script de démarrage développement - API sur port 3003, frontends sur ports séparés
REM present: http://localhost:8080 (dev server)
REM superadmin: http://localhost:4000 (dev server)
REM API: http://localhost:3003/api

echo.
echo 🚀 Démarrage de la plateforme Prolink...
echo.
echo 📌 Configuration:
echo   - Present frontend:  http://localhost:8080 (dev)
echo   - Superadmin panel:  http://localhost:4000 (dev)
echo   - API Backend:       http://localhost:3003/api
echo   - WebSocket:         ws://localhost:3003
echo.

REM Vérifier les dépendances
if not exist "node_modules" (
    echo 📦 Installation des dépendances racine...
    call npm install
)

if not exist "present\node_modules" (
    echo 📦 Installation des dépendances present...
    cd present
    call npm install
    cd ..
)

if not exist "superadmin\node_modules" (
    echo 📦 Installation des dépendances superadmin...
    cd superadmin
    call npm install
    cd ..
)

REM Vérifier concurrently
npm list -g concurrently >nul 2>&1
if errorlevel 1 (
    echo 📦 Installation de concurrently ^(pour démarrage parallèle^)...
    call npm install -g concurrently
)

echo.
echo 🔄 Démarrage des services en mode développement...
echo Appuyez sur Ctrl+C pour arrêter tous les services
echo.

REM Démarrer tous les services en parallèle avec concurrently
call concurrently ^
    --names "API,Present,SuperAdmin" ^
    --prefix "[{name}]" ^
    --color "auto" ^
    "node server/index.js" ^
    "cd present && npm run dev" ^
    "cd superadmin && npm run dev"
