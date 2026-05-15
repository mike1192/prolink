# 🎯 PREMIÈRE UTILISATION - Lisez-moi d'abord !

Bienvenue sur Prolink ! Cette architecture unifiée signifie que **tout fonctionne sur un seul port (3003)**.

## ⚡ Démarrage ultra-rapide (5 min)

### 1️⃣ Cloner

```bash
cd prolink/app
```

### 2️⃣ Configurer l'environnement

```bash
# Copier le template
cp .env.example .env

# Éditer avec vos paramètres
nano .env  # ou utiliser votre éditeur favori
```

**Minimum à configurer** :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=prolink
JWT_SECRET=generer_une_clé_aléatoire_longue
```

### 3️⃣ Installer les dépendances

```bash
npm install
cd present && npm install && cd ..
cd superadmin && npm install && cd ..
```

### 4️⃣ Démarrer (choisir une option)

#### Option A : Automatisé (recommandé)

```bash
# Windows
start-dev-all.bat

# Linux/Mac
./start-dev-all.sh
```

#### Option B : Manuellement (3 terminaux)

```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:frontend

# Terminal 3
npm run dev:superadmin
```

## 📍 Accéder à l'application

- **Frontend** : http://localhost:3003
- **Admin Panel** : http://localhost:3003/superadmin
- **API** : http://localhost:3003/api/health

## 🔧 Structure

```
Tout s'exécute sur le port 3003 :
├─ / → Frontend (present)
├─ /superadmin → Admin (superadmin)
├─ /api → Backend API
└─ WebSocket pour le temps réel
```

## 📚 Documentation

| Document                                                   | Purpose                         |
| ---------------------------------------------------------- | ------------------------------- |
| [QUICKSTART.md](./QUICKSTART.md)                           | 5 minutes pour démarrer         |
| [ARCHITECTURE_CONSOLIDEE.md](./ARCHITECTURE_CONSOLIDEE.md) | Guide complet de l'architecture |
| [MODIFICATIONS_RESUMEES.md](./MODIFICATIONS_RESUMEES.md)   | Changements effectués           |
| [DEPLOIEMENT_PRODUCTION.md](./DEPLOIEMENT_PRODUCTION.md)   | Guide de déploiement            |

## ⚠️ Prérequis

- ✅ Node.js 18+
- ✅ MySQL 5.7+
- ✅ npm ou yarn

## 🆘 Problèmes courants

### "Port 3003 already in use"

```bash
# Trouver et terminer le processus
netstat -ano | findstr :3003
taskkill /PID <PID> /F
```

### "Cannot find module"

```bash
# Réinstaller les dépendances
rm -r node_modules present/node_modules superadmin/node_modules
npm install
cd present && npm install && cd ..
cd superadmin && npm install && cd ..
```

### MySQL connection error

Vérifier que :

- MySQL est en cours d'exécution
- Les credentials dans `.env` sont corrects
- La base de données existe

```bash
# Créer la base si nécessaire
mysql -u root -p -e "CREATE DATABASE prolink;"
```

## 🚀 Mode Production

Une fois prêt pour la production :

```bash
npm run start
```

Cela va :

1. Builder les 2 frontends
2. Optimiser les assets
3. Démarrer le serveur sur le port 3003

## 💡 Commandes utiles

```bash
# Tout en un
npm run dev:all              # Dev tous les services
npm run build:all            # Build pour la production
npm run start                # Prod (build + start)

# Individuellement
npm run dev:server           # Backend seulement
npm run dev:frontend         # Frontend seulement
npm run dev:superadmin       # Admin seulement
npm run build:frontend       # Build frontend
npm run build:superadmin     # Build admin

# Maintenance
npm run lint                 # Vérifier le code
npm run format               # Formater le code
```

## 📝 Notes importantes

- 🔄 En développement, les services utilisent les ports 5173 et 5174 (proxiés via Vite dev server)
- 📦 En production, tout est servi par Express sur le port 3003
- 🔐 Les modifications dans `.env` ne sont pas suivies par git (bon pour la sécurité)
- 📁 Les dossiers `server/public/*` contiennent les builds - à régénérer après chaque changement frontend

## 🤝 Support

Pour plus d'aide :

- Consultez les logs dans chaque terminal
- Vérifiez [ARCHITECTURE_CONSOLIDEE.md](./ARCHITECTURE_CONSOLIDEE.md)
- Cherchez dans [DEPLOIEMENT_PRODUCTION.md](./DEPLOIEMENT_PRODUCTION.md)

---

**C'est bon !** 🎉 Vous pouvez maintenant démarrer l'application.

**Prochaine étape** : Exécutez `start-dev-all.bat` (Windows) ou `./start-dev-all.sh` (Linux/Mac)
