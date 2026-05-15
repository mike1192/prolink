@echo off
REM Validation de la configuration consolidée

echo.
echo 🔍 Validation de la configuration Prolink...
echo.

setlocal enabledelayedexpansion

set VALID=true

echo 📋 Vérification des fichiers...

for %%F in (
    "present\vite.config.ts"
    "superadmin\vite.config.ts"
    "server\index.js"
    "package.json"
    "start-dev-all.bat"
    "start-prod.bat"
    "ARCHITECTURE_CONSOLIDEE.md"
    "QUICKSTART.md"
) do (
    if exist %%F (
        echo   ✅ %%F
    ) else (
        echo   ❌ %%F ^(MANQUANT^)
        set VALID=false
    )
)

echo.
echo 📦 Vérification des dépendances...

findstr /M "concurrently" package.json >nul 2>&1
if errorlevel 0 (
    echo   ✅ concurrently dans package.json
) else (
    echo   ⚠️  concurrently à installer: npm install concurrently --save-dev
)

echo.
echo 📄 Vérification des scripts...

for %%S in (
    "dev:all"
    "dev:server"
    "dev:frontend"
    "dev:superadmin"
    "build:all"
    "build:frontend"
    "build:superadmin"
    "start"
) do (
    findstr /M "\"%%S\":" package.json >nul 2>&1
    if errorlevel 0 (
        echo   ✅ npm run %%S
    ) else (
        echo   ❌ npm run %%S ^(MANQUANT^)
        set VALID=false
    )
)

echo.
echo 🔧 Vérification de la configuration Vite...

findstr /M "outDir: \"../server/public/present\"" present\vite.config.ts >nul 2>&1
if errorlevel 0 (
    echo   ✅ present build output configuré
) else (
    echo   ❌ present build output non configuré
    set VALID=false
)

findstr /M "outDir: \"../server/public/superadmin\"" superadmin\vite.config.ts >nul 2>&1
if errorlevel 0 (
    echo   ✅ superadmin build output configuré
) else (
    echo   ❌ superadmin build output non configuré
    set VALID=false
)

echo.
echo 🌐 Vérification du serveur Express...

findstr /M "express.static(\"public/superadmin\")" server\index.js >nul 2>&1
if errorlevel 0 (
    echo   ✅ Route statique superadmin
) else (
    echo   ❌ Route statique superadmin manquante
    set VALID=false
)

findstr /M "express.static(\"public/present\")" server\index.js >nul 2>&1
if errorlevel 0 (
    echo   ✅ Route statique present
) else (
    echo   ❌ Route statique present manquante
    set VALID=false
)

echo.
echo 📁 Vérification des répertoires...

if exist "server\public\present" (
    echo   ✅ server\public\present
) else (
    echo   ℹ️  server\public\present ^(à créer lors du build^)
)

if exist "server\public\superadmin" (
    echo   ✅ server\public\superadmin
) else (
    echo   ℹ️  server\public\superadmin ^(à créer lors du build^)
)

echo.
echo ==================================================

if "%VALID%"=="true" (
    echo ✅ Configuration validée avec succès!
    echo.
    echo 🚀 Prochaines étapes:
    echo   1. npm install concurrently --save-dev
    echo   2. npm run build:all
    echo   3. npm run dev:all
    echo.
    echo 📍 Accéder à:
    echo   - Frontend: http://localhost:3000
    echo   - Superadmin: http://localhost:3000/superadmin
    echo   - API: http://localhost:3000/api
) else (
    echo ❌ Erreurs de configuration détectées!
    echo Veuillez corriger les fichiers manquants ou mal configurés.
    exit /b 1
)

echo ==================================================
pause
