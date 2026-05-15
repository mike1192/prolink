# ✅ Checklist de Vérification Avant Démarrage

Utilisez cette checklist pour vérifier que tout est correctement configuré.

## 🔧 Configuration système

- [ ] Node.js 18+ installé

  ```bash
  node --version
  ```

- [ ] npm 8+ installé

  ```bash
  npm --version
  ```

- [ ] MySQL 5.7+ installé et en cours d'exécution

  ```bash
  mysql --version
  mysql -u root -p -e "SELECT 1;"
  ```

- [ ] Redis installé (optionnel, mais recommandé)
  ```bash
  redis-cli --version
  redis-cli ping
  ```

## 📁 Fichiers et répertoires

- [ ] Fichier `.env` créé (copié de `.env.example`)

  ```bash
  ls -la .env
  ```

- [ ] `server/public/present/` existe

  ```bash
  ls -la server/public/present/
  ```

- [ ] `server/public/superadmin/` existe

  ```bash
  ls -la server/public/superadmin/
  ```

- [ ] `server/uploads/` existe
  ```bash
  ls -la server/uploads/
  ```

## 📦 Dépendances

- [ ] Dépendances racine installées

  ```bash
  npm list | head -20
  ```

- [ ] Dépendances present installées

  ```bash
  cd present && npm list | head -20 && cd ..
  ```

- [ ] Dépendances superadmin installées

  ```bash
  cd superadmin && npm list | head -20 && cd ..
  ```

- [ ] `concurrently` installé localement
  ```bash
  npm list concurrently
  ```

## 🗄️ Base de données

- [ ] Base `prolink` créée

  ```bash
  mysql -u root -p -e "SHOW DATABASES LIKE 'prolink';"
  ```

- [ ] Schéma importé

  ```bash
  mysql -u root -p prolink -e "SHOW TABLES;" | wc -l
  ```

- [ ] Utilisateur MySQL créé avec permissions
  ```bash
  mysql -u root -p -e "SELECT User FROM mysql.user WHERE User='prolink_user';"
  ```

## 🔐 Fichier .env

- [ ] `DB_HOST` configuré (défaut: localhost)
- [ ] `DB_USER` configuré (défaut: root)
- [ ] `DB_PASSWORD` configuré
- [ ] `DB_NAME` configuré (défaut: prolink)
- [ ] `JWT_SECRET` configuré (clé longue et aléatoire)
- [ ] `PORT` configuré (défaut: 3003)
- [ ] `NODE_ENV` configuré (development ou production)

```bash
# Vérifier qu'aucune variable n'est vide
grep -E "^[A-Z_]+=" .env | grep -v "=$"
```

## 📝 Scripts npm

- [ ] `npm run dev:server` existe
- [ ] `npm run dev:frontend` existe
- [ ] `npm run dev:superadmin` existe
- [ ] `npm run dev:all` existe
- [ ] `npm run build:all` existe
- [ ] `npm run start` existe

```bash
npm run | grep "dev:\|build:\|start"
```

## 🛠️ Configuration Vite

- [ ] `present/vite.config.ts` configure le port 5173

  ```bash
  grep "port: 5173" present/vite.config.ts
  ```

- [ ] `superadmin/vite.config.ts` configure le port 5174

  ```bash
  grep "port: 5174" superadmin/vite.config.ts
  ```

- [ ] `present/vite.config.ts` configure le build output

  ```bash
  grep "public/present" present/vite.config.ts
  ```

- [ ] `superadmin/vite.config.ts` configure le build output
  ```bash
  grep "public/superadmin" superadmin/vite.config.ts
  ```

## 🔌 Serveur Express

- [ ] Routes statiques configurées dans `server/index.js`

  ```bash
  grep -c "express.static" server/index.js
  ```

- [ ] SPA fallback configuré

  ```bash
  grep -c "sendFile.*index.html" server/index.js
  ```

- [ ] CORS configuré
  ```bash
  grep -c "cors(" server/index.js
  ```

## 🚀 Scripts de démarrage

- [ ] `start-dev-all.bat` existe (Windows)

  ```bash
  ls -la start-dev-all.bat
  ```

- [ ] `start-dev-all.ps1` existe (PowerShell)

  ```bash
  ls -la start-dev-all.ps1
  ```

- [ ] `start-dev-all.sh` existe (Linux/Mac)

  ```bash
  ls -la start-dev-all.sh
  ```

- [ ] `start-prod.bat` existe (Production)
  ```bash
  ls -la start-prod.bat
  ```

## 📚 Documentation

- [ ] `LISEZMOI_D_ABORD.md` existe et est à jour
- [ ] `QUICKSTART.md` existe et est à jour
- [ ] `ARCHITECTURE_CONSOLIDEE.md` existe et est à jour
- [ ] `MODIFICATIONS_RESUMEES.md` existe et est à jour
- [ ] `DEPLOIEMENT_PRODUCTION.md` existe et est à jour

## 🧪 Tests de connectivité

- [ ] Port 3003 disponible

  ```bash
  netstat -ano | findstr :3003  # Windows
  lsof -i :3003                 # Linux/Mac
  ```

- [ ] Port 5173 disponible

  ```bash
  netstat -ano | findstr :5173  # Windows
  lsof -i :5173                 # Linux/Mac
  ```

- [ ] Port 5174 disponible

  ```bash
  netstat -ano | findstr :5174  # Windows
  lsof -i :5174                 # Linux/Mac
  ```

- [ ] MySQL accessible
  ```bash
  mysql -u <DB_USER> -p -h <DB_HOST> -e "SELECT 1;"
  ```

## 🏗️ Build test (Optionnel)

- [ ] Build frontend réussit

  ```bash
  npm run build:frontend
  ```

- [ ] Build superadmin réussit

  ```bash
  npm run build:superadmin
  ```

- [ ] Fichiers buildés existent
  ```bash
  ls -la server/public/present/index.html
  ls -la server/public/superadmin/index.html
  ```

---

## 📋 Résumé

**Éléments critiques** (doivent être ✅) :

1. ✅ Node.js et npm installés
2. ✅ MySQL en cours d'exécution
3. ✅ Base de données `prolink` créée
4. ✅ Fichier `.env` configuré
5. ✅ Dépendances npm installées
6. ✅ Ports 3003, 5173, 5174 disponibles

**Si tout est ✅**, vous pouvez démarrer :

### Windows

```bash
start-dev-all.bat
```

### Linux/Mac

```bash
./start-dev-all.sh
```

### Ou manuellement

```bash
npm run dev:all
```

---

**Avez-vous besoin d'aide ?** Consultez [LISEZMOI_D_ABORD.md](./LISEZMOI_D_ABORD.md)
