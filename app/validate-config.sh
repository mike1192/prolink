#!/bin/bash
# Validation de la configuration consolidée

echo "🔍 Validation de la configuration Prolink..."
echo ""

VALID=true

# Vérifier les fichiers modifiés
echo "📋 Vérification des fichiers..."

FILES=(
    "present/vite.config.ts"
    "superadmin/vite.config.ts"
    "server/index.js"
    "package.json"
    "start-dev-all.bat"
    "start-prod.bat"
    "ARCHITECTURE_CONSOLIDEE.md"
    "QUICKSTART.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (MANQUANT)"
        VALID=false
    fi
done

echo ""
echo "📦 Vérification des dépendances..."

# Vérifier concurrently
if grep -q "concurrently" package.json; then
    echo "  ✅ concurrently dans package.json"
else
    echo "  ⚠️  concurrently à installer: npm install concurrently --save-dev"
fi

# Vérifier les scripts
echo ""
echo "📄 Vérification des scripts..."

SCRIPTS=(
    "dev:all"
    "dev:server"
    "dev:frontend"
    "dev:superadmin"
    "build:all"
    "build:frontend"
    "build:superadmin"
    "start"
)

for script in "${SCRIPTS[@]}"; do
    if grep -q "\"$script\":" package.json; then
        echo "  ✅ npm run $script"
    else
        echo "  ❌ npm run $script (MANQUANT)"
        VALID=false
    fi
done

echo ""
echo "🔧 Vérification de la configuration Vite..."

# Vérifier present vite.config
if grep -q "outDir: \"../server/public/present\"" present/vite.config.ts; then
    echo "  ✅ present build output configuré"
else
    echo "  ❌ present build output non configuré"
    VALID=false
fi

# Vérifier superadmin vite.config
if grep -q "outDir: \"../server/public/superadmin\"" superadmin/vite.config.ts; then
    echo "  ✅ superadmin build output configuré"
else
    echo "  ❌ superadmin build output non configuré"
    VALID=false
fi

echo ""
echo "🌐 Vérification du serveur Express..."

# Vérifier les routes statiques
if grep -q "express.static(\"public/superadmin\")" server/index.js; then
    echo "  ✅ Route statique superadmin"
else
    echo "  ❌ Route statique superadmin manquante"
    VALID=false
fi

if grep -q "express.static(\"public/present\")" server/index.js; then
    echo "  ✅ Route statique present"
else
    echo "  ❌ Route statique present manquante"
    VALID=false
fi

if grep -q "res.sendFile(path.resolve(\"public/present/index.html\"))" server/index.js; then
    echo "  ✅ SPA fallback present"
else
    echo "  ❌ SPA fallback present manquant"
    VALID=false
fi

echo ""
echo "📁 Vérification des répertoires..."

DIRS=(
    "server/public/present"
    "server/public/superadmin"
)

for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir"
    else
        echo "  ℹ️  $dir (à créer lors du build)"
    fi
done

echo ""
echo "=================================================="

if [ "$VALID" = true ]; then
    echo "✅ Configuration validée avec succès!"
    echo ""
    echo "🚀 Prochaines étapes:"
    echo "  1. npm install concurrently --save-dev"
    echo "  2. npm run build:all"
    echo "  3. npm run dev:all"
    echo ""
    echo "📍 Accéder à:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Superadmin: http://localhost:3000/superadmin"
    echo "  - API: http://localhost:3000/api"
else
    echo "❌ Erreurs de configuration détectées!"
    echo "Veuillez corriger les fichiers manquants ou mal configurés."
    exit 1
fi

echo "=================================================="
