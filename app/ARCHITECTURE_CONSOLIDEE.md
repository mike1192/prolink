# 🚀 Architecture Consolidée - Prolink

## Vue d'ensemble

La plateforme Prolink fonctionne maintenant avec **un seul port (3003)** :

- **Frontend Present** : http://localhost:3003 (route racine)
- **Superadmin Panel** : http://localhost:3003/superadmin
- **API Backend** : http://localhost:3003/api
- **WebSocket** : ws://localhost:3003

## Structure

```
app/
├── server/              # Backend Express + Socket.io
│   ├── index.js         # Serveur principal
│   ├── public/
│   │   ├── present/     # Frontend buildé (route racine)
│   │   └── superadmin/  # Admin buildé (route /superadmin)
│   ├── routes/          # Endpoints API
│   ├── middleware/      # Auth, validation
│   └── db/              # Pool MySQL
├── present/             # Frontend React/Vite (port 5173 en dev)
├── superadmin/          # Admin React/Vite (port 5174 en dev)
├── start-dev-all.bat    # Lance tous les services en dev
├── start-prod.bat       # Build + Start en production
└── package.json         # Scripts racine
```

## Démarrage

### Mode Développement (3 terminaux)

**Option 1 : Automatisé (recommandé)**

```bash
# Windows
start-dev-all.bat

# PowerShell
.\start-dev-all.ps1
```

Cela démarre automatiquement :

- API Backend sur port 3003
- Present frontend sur port 5173
- Superadmin panel sur port 5174

**Option 2 : Manuel**

```bash
# Terminal 1 - Backend API
npm run dev:server

# Terminal 2 - Frontend Present
npm run dev:frontend

# Terminal 3 - Superadmin Panel
npm run dev:superadmin
```

### Mode Production

```bash
# Windows
start-prod.bat

# Linux/Mac
npm run start
```

Cela :

1. Build le frontend present → `server/public/present`
2. Build le superadmin → `server/public/superadmin`
3. Démarre le serveur Express qui sert tout sur le port 3003

## Port Mapping

| Service    | Dev  | Production             |
| ---------- | ---- | ---------------------- |
| API        | 3003 | 3003                   |
| Present    | 5173 | ❌ (servi par Express) |
| Superadmin | 5174 | ❌ (servi par Express) |

## Scripts npm

### Racine (`/app`)

```bash
npm run dev:server      # Lance le backend seulement
npm run dev:frontend    # Lance present seulement
npm run dev:superadmin  # Lance superadmin seulement
npm run dev:all         # Lance tous les 3 (parallèle avec concurrently)
npm run build:frontend  # Build present
npm run build:superadmin # Build superadmin
npm run build:all       # Build les deux frontends
npm run start           # Build + Start en production
```

### Dans les sous-dossiers

```bash
# present/ ou superadmin/
npm run dev             # Démarrage Vite dev (port 5173/5174)
npm run build           # Build optimisé
npm run preview         # Prévisualisation du build
```

## Configuration Vite

Les fichiers `vite.config.ts` ont été mis à jour :

### `/present/vite.config.ts`

- Dev server : port 5173
- Build output : `../server/public/present`

### `/superadmin/vite.config.ts`

- Dev server : port 5174
- Build output : `../server/public/superadmin`
- Base path : `/superadmin/`

## Router Configuration (Important pour les SPAs)

Le serveur Express configure les fallback routes :

```javascript
// Superadmin SPA fallback
app.get("/superadmin*", (req, res) => {
  res.sendFile(path.resolve("public/superadmin/index.html"));
});

// Present SPA fallback (route racine)
app.get("*", (req, res) => {
  res.sendFile(path.resolve("public/present/index.html"));
});
```

Cela garantit que les routes client-side fonctionnent correctement.

## Dépannage

### "Port 3003 already in use"

```bash
# Trouver le processus
netstat -ano | findstr :3003

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F
```

### Build vide dans `public/`

```bash
# Supprimer et recréer
rm -r server/public/present server/public/superadmin
npm run build:all
```

### Modules non trouvés

```bash
# Réinstaller les dépendances
rm -r node_modules present/node_modules superadmin/node_modules
npm install
cd present && npm install && cd ..
cd superadmin && npm install && cd ..
```

## Architecture API

Les routes API sont préfixées par `/api` :

- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/projects` - Liste des projets
- `POST /api/upload` - Upload d'image
- etc.

CORS est configuré pour accepter `localhost:*` en développement.

## Prochaines étapes

1. **Environnement de production** : Configurer les variables ENV
2. **Certificats SSL** : Activer HTTPS en production
3. **CDN** : Servir les assets statiques depuis un CDN
4. **Monitoring** : Intégrer Sentry pour le monitoring
5. **CI/CD** : Pipeline GitHub Actions pour auto-deploy

---

**Date de mise à jour** : 9 mai 2026
