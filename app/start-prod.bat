@echo off
REM Script de production - Build + Start tous les services sur le port 3000

echo.
echo 🚀 Démarrage de la plateforme Prolink EN PRODUCTION...
echo.

REM Vérifier les dépendances
if not exist "node_modules" (
    echo 📦 Installation des dépendances racine...
    call npm install --production
)

if not exist "present\node_modules" (
    echo 📦 Installation des dépendances present...
    cd present
    call npm install --production
    cd ..
)

if not exist "superadmin\node_modules" (
    echo 📦 Installation des dépendances superadmin...
    cd superadmin
    call npm install --production
    cd ..
)

echo.
echo 🔨 Build du frontend present...
cd present
call npm run build
cd ..

echo.
echo 🔨 Build du superadmin panel...
cd superadmin
call npm run build
cd ..

echo.
echo 📌 Configuration:
echo   - Present frontend:  http://localhost:3000
echo   - Superadmin panel:  http://localhost:3000/superadmin
echo   - API Backend:       http://localhost:3000/api
echo.

echo 🔄 Démarrage du serveur...
node server/index.js
