#!/bin/bash

# Script de démarrage développement - Tous les services sur le port 3000
# present: http://localhost:3000
# superadmin: http://localhost:3000/superadmin
# API: http://localhost:3000/api

echo ""
echo "🚀 Démarrage de la plateforme Prolink..."
echo ""
echo "📌 Configuration:"
echo "  - Present frontend:  http://localhost:3000"
echo "  - Superadmin panel:  http://localhost:3000/superadmin"
echo "  - API Backend:       http://localhost:3000/api"
echo "  - WebSocket:         ws://localhost:3000"
echo ""

# Vérifier que les dépendances sont installées
if [ ! -d "./node_modules" ]; then
    echo "📦 Installation des dépendances racine..."
    npm install
fi

if [ ! -d "./present/node_modules" ]; then
    echo "📦 Installation des dépendances present..."
    cd present
    npm install
    cd ..
fi

if [ ! -d "./superadmin/node_modules" ]; then
    echo "📦 Installation des dépendances superadmin..."
    cd superadmin
    npm install
    cd ..
fi

echo ""
echo "🔄 Démarrage des services en mode développement..."
echo "Appuyez sur Ctrl+C pour arrêter tous les services"
echo ""

# Utiliser concurrently pour démarrer tous les services en parallèle
concurrently \
    --names "API,Present,SuperAdmin" \
    --prefix "[{name}]" \
    --color "auto" \
    "node server/index.js" \
    "cd present && npm run dev" \
    "cd superadmin && npm run dev"
