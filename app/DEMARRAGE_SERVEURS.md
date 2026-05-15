# Guide de Démarrage des Serveurs - Plateforme Prolink

## Vue d'ensemble

La plateforme Prolink est composée de 3 services principaux qui fonctionnent ensemble :
- **API Backend** : Serveur Express.js (port 3003)
- **Present Frontend** : Interface utilisateur principale
- **SuperAdmin Panel** : Interface d'administration

## Scripts de Démarrage Disponibles

### 🚀 Mode Développement (Recommandé)

**Windows (CMD):**
```cmd
start-dev-all.bat
```

**Windows (PowerShell):**
```powershell
.\start-dev-all.ps1
```

**Linux/Mac:**
```bash
./start-dev-all.sh
```

**Via npm:**
```bash
npm run dev:all
```

### 📌 URLs d'accès en développement :
- **Present frontend:** http://localhost:3003
- **SuperAdmin panel:** http://localhost:3003/superadmin  
- **API Backend:** http://localhost:3003/api
- **WebSocket:** ws://localhost:3003

### 🏭 Mode Production

**Windows:**
```cmd
start-prod.bat
```

**Via npm:**
```bash
npm start
```

### 🔄 Redémarrage Rapide du Serveur

**Windows (CMD):**
```cmd
restart-server.bat
```

**Windows (PowerShell):**
```powershell
.\restart-server.ps1
```

## Fonctionnement des Scripts

### Scripts de Développement
1. **Vérification des dépendances** : Installation automatique si manquantes
2. **Installation de concurrently** : Pour le démarrage parallèle des services
3. **Démarrage simultané** des 3 services :
   - `node server/index.js` (API)
   - `cd present && npm run dev` (Frontend)
   - `cd superadmin && npm run dev` (Admin)

### Script de Production
1. **Installation des dépendances** en mode production
2. **Build des frontends** :
   - `npm run build` dans `/present`
   - `npm run build` dans `/superadmin`
3. **Démarrage du serveur** : `node server/index.js`

### Scripts de Redémarrage
1. **Arrêt forcé** de tous les processus Node.js
2. **Pause de 2 secondes**
3. **Redémarrage** du serveur principal

## Scripts NPM Disponibles

```json
{
  "dev": "vite dev",
  "dev:server": "node server/index.js",
  "dev:all": "concurrently --kill-others-on-fail \"npm run dev:server\" \"npm run dev:frontend\" \"npm run dev:superadmin\"",
  "dev:frontend": "npm --prefix ./present run dev",
  "dev:superadmin": "npm --prefix ./superadmin run dev",
  "build:all": "npm run build:frontend && npm run build:superadmin",
  "start": "npm run build:all && node server/index.js"
}
```

## Prérequis

- **Node.js** installé
- **npm** ou **bun** comme gestionnaire de paquets
- **concurrently** (installé automatiquement si manquant)
- Base de données configurée (voir SETUP_MYSQL.md)

## Dépannage

### Problème de port occupé
```bash
# Tuer tous les processus Node.js
taskkill /F /IM node.exe  # Windows
pkill node                # Linux/Mac
```

### Problème de dépendances
```bash
# Réinstaller toutes les dépendances
npm install
cd present && npm install
cd ../superadmin && npm install
```

### Problème de build
```bash
# Nettoyer et rebuilder
npm run build:all
```

## Architecture des Services

```
Port 3003
├── / → Present Frontend (React)
├── /superadmin → SuperAdmin Panel (React)
├── /api → Backend API (Express.js)
└── /ws → WebSocket Server
```

Tous les services sont accessibles via le même port (3003) grâce au reverse proxy configuré dans le serveur Express.