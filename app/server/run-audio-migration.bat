@echo off
echo ========================================
echo Execution de la migration Audio Messages
echo ========================================
echo.

cd /d "%~dp0"
node run-migration.js db/migrations/add_voice_messages.sql

echo.
echo ========================================
echo Migration terminee !
echo ========================================
pause
