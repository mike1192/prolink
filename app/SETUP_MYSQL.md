# Configuration de MySQL pour ProjectLink

## Prérequis

1. **Installer MySQL Server**
   - Télécharger depuis : https://dev.mysql.com/downloads/mysql/
   - Suivre les instructions d'installation
   - Noter le mot de passe root

2. **Installer MySQL Workbench** (optionnel mais recommandé)
   - Interface graphique pour gérer MySQL
   - Télécharger depuis : https://dev.mysql.com/downloads/workbench/

## Configuration de la base de données

### Étape 1 : Créer la base de données

Ouvrez MySQL Workbench ou la ligne de commande MySQL et exécutez :

```bash
mysql -u root -p
```

Entrez votre mot de passe root, puis :

```sql
-- Le fichier server/db/schema.sql contient tout le nécessaire
source server/db/schema.sql
```

Ou exécutez manuellement :

```sql
CREATE DATABASE projectlink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE projectlink;

-- Puis copiez-coller le contenu de server/db/schema.sql
```

### Étape 2 : Configurer les identifiants

Modifiez le fichier `server/config/db.json` :

```json
{
  "host": "localhost",
  "user": "root",
  "password": "VOTRE_MOT_DE_PASSE_MYSQL",
  "database": "projectlink",
  "port": 3306,
  "waitForConnections": true,
  "connectionLimit": 10,
  "queueLimit": 0
}
```

Modifiez aussi `.env.server` :

```env
DB_PASSWORD=VOTRE_MOT_DE_PASSE_MYSQL
```

### Étape 3 : Démarrer le serveur API

```bash
# Dans un premier terminal - Serveur API
npm run dev:server

# Dans un second terminal - Frontend React
npm run dev
```

Le serveur API sera disponible sur : http://localhost:3000

## Structure du backend

```
server/
├── config/
│   └── db.json              # Configuration MySQL
├── db/
│   ├── pool.js              # Pool de connexions MySQL
│   └── schema.sql           # Schema de la base de données
├── middleware/
│   └── auth.js              # Middleware d'authentification JWT
├── routes/
│   ├── auth.js              # Routes d'authentification
│   └── projects.js          # Routes des projets
└── index.js                 # Point d'entrée du serveur
```

## API Endpoints

### Authentification

- `POST /api/auth/signup` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Vérifier le token

### Projets

- `GET /api/projects/feed` - Récupérer le feed
- `POST /api/projects` - Créer un projet
- `GET /api/projects/user/:userId` - Projets d'un utilisateur
- `POST /api/projects/:projectId/like` - Toggle like
- `GET /api/projects/:projectId/comments` - Commentaires
- `POST /api/projects/:projectId/comments` - Ajouter un commentaire

### Profil

- `GET /api/profile/:username` - Profil par username
- `GET /api/profile/id/:userId` - Profil par ID
- `PUT /api/profile` - Mettre à jour le profil

## Notes importantes

⚠️ **Ce backend est séparé du frontend React**

- Le frontend fonctionne sur un port (ex: 8080)
- Le backend API fonctionne sur un autre port (ex: 3000)
- Il faudra mettre à jour le frontend pour utiliser l'API au lieu de Supabase

## Prochaines étapes

1. Configurer MySQL et créer la base de données
2. Modifier `server/config/db.json` avec vos identifiants
3. Démarrer le serveur API : `npm run dev:server`
4. Migrer le frontend de Supabase vers l'API MySQL
