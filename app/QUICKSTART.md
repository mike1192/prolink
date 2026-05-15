# 🚀 Quick Start - Prolink Plateforme Unifiée

## Installation rapide (5 minutes)

### 1️⃣ Cloner et configurer

```bash
cd app
cp .env.example .env
# Éditer .env avec vos paramètres
```

### 2️⃣ Installer les dépendances

```bash
npm install
cd present && npm install && cd ..
cd superadmin && npm install && cd ..
```

### 3️⃣ Démarrer

#### Windows (Batch)

```bash
start-dev-all.bat
```

#### Windows (PowerShell)

```bash
.\start-dev-all.ps1
```

#### Linux/Mac

```bash
chmod +x start-dev-all.sh
./start-dev-all.sh
```

#### Ou manuellement (3 terminaux)

```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:frontend

# Terminal 3
npm run dev:superadmin
```

## 📍 URLs après démarrage

| Service               | URL                              | Port       |
| --------------------- | -------------------------------- | ---------- |
| **Present Frontend**  | http://localhost:3003            | 3003 (API) |
| **Superadmin Panel**  | http://localhost:3003/superadmin | 3003 (API) |
| **API Documentation** | http://localhost:3003/api/health | 3003       |
| **WebSocket**         | ws://localhost:3003              | 3003       |

## 🏗️ Mode Production

```bash
# Build + Start
start-prod.bat

# Ou manuellement
npm run start
```

Cela va :

1. ✅ Builder le frontend present
2. ✅ Builder le superadmin
3. ✅ Démarrer le serveur qui sert tout sur le port 3003

## 🛠️ Commandes utiles

```bash
# Développement
npm run dev:all          # Tous les services
npm run dev:server       # Backend seulement
npm run dev:frontend     # Present seulement
npm run dev:superadmin   # Superadmin seulement

# Build
npm run build:all        # Build les deux frontends
npm run build:frontend   # Build present
npm run build:superadmin # Build superadmin

# Production
npm run start             # Build + Start
```

## 📁 Structure après premier build

```
app/
├── server/
│   ├── public/
│   │   ├── present/          ← Build du frontend
│   │   │   ├── index.html
│   │   │   ├── assets/
│   │   │   └── ...
│   │   └── superadmin/       ← Build du panel admin
│   │       ├── index.html
│   │       ├── assets/
│   │       └── ...
│   └── index.js              ← Serveur Express
```

## 🔒 Configuration Requise

### 1. Base de données MySQL

```bash
# Créer la base
CREATE DATABASE prolink;

# Importer le schéma
mysql -u root -p prolink < app/server/db/schema.sql
```

### 2. Variables d'environnement (.env)

```env
# Minimum requis
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=prolink
JWT_SECRET=your-secret-key
```

### 3. Redis (optionnel)

```bash
# Démarrer Redis
redis-server
```

## 🆘 Dépannage

### Port 3003 en utilisation

```bash
# Vérifier quel processus utilise le port
netstat -ano | findstr :3003

# Tuer le processus
taskkill /PID <PID> /F
```

### Build échoue

```bash
# Nettoyer et reconstruire
rm -r server/public/present server/public/superadmin
npm run build:all
```

### Modules manquants

```bash
# Réinstaller
rm -r node_modules present/node_modules superadmin/node_modules package-lock.json
npm install
cd present && npm install && cd ..
cd superadmin && npm install && cd ..
```

## 📚 Documentation complète

Voir [ARCHITECTURE_CONSOLIDEE.md](./ARCHITECTURE_CONSOLIDEE.md)

---

**Besoin d'aide ?** 📧 Consultez les logs dans chaque terminal pour les erreurs détaillées.
