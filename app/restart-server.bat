@echo off
echo ========================================
echo Redemarrage du serveur ProjectLink
echo ========================================
echo.

echo [1/2] Arret des processus Node.js existants...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/2] Demarrage du serveur...
echo.
echo ========================================
echo Serveur pret sur http://localhost:3003
echo ========================================
echo.

cd /d "%~dp0"
node server/index.js

pause
