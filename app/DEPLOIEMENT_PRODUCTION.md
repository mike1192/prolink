# 🚀 Guide de Déploiement - Prolink Plateforme Unifiée

## Architecture en Production

```
Port 3000
    │
    ├─ GET / → Sert present/index.html
    ├─ GET /superadmin → Sert superadmin/index.html
    ├─ GET /api/* → Routes API Express
    └─ WebSocket → Socket.io
```

## Prérequis

- ✅ Node.js 18+ (ou version utilisée en dev)
- ✅ MySQL 5.7+ (base de données)
- ✅ Redis 6+ (optionnel, pour le cache)
- ✅ Système : Linux/Windows Server 2019+

## 1. Préparation du serveur

### Installation Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier
node --version
npm --version
```

### Installation MySQL

```bash
# Ubuntu/Debian
sudo apt-get install mysql-server

# Vérifier
mysql --version
```

### Installation Redis (optionnel)

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# Vérifier
redis-cli --version
```

## 2. Préparation de l'application

### Cloner et configurer

```bash
git clone <your-repo> /var/www/prolink
cd /var/www/prolink/app

# Créer .env en production
cp .env.example .env
nano .env
```

### Fichier .env (Production)

```env
# Serveur
PORT=3000
NODE_ENV=production

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=prolink_user
DB_PASSWORD=secure_password_here
DB_NAME=prolink

# JWT
JWT_SECRET=generate_a_long_random_string_here

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# CORS
FRONTEND_URL=https://prolink.com
```

### Créer utilisateur MySQL

```bash
mysql -u root -p

CREATE USER 'prolink_user'@'localhost' IDENTIFIED BY 'secure_password_here';
CREATE DATABASE prolink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON prolink.* TO 'prolink_user'@'localhost';
FLUSH PRIVILEGES;

# Importer le schéma
source /var/www/prolink/app/server/db/schema.sql;
```

## 3. Build et installation

```bash
cd /var/www/prolink/app

# Installer les dépendances
npm install --production

# Builder les frontends
npm run build:all

# Vérifier les builds
ls -la server/public/present/
ls -la server/public/superadmin/
```

## 4. Configuration système

### Service SystemD (Linux)

Créer `/etc/systemd/system/prolink.service` :

```ini
[Unit]
Description=Prolink Application Server
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/prolink/app
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

# Variables d'environnement
Environment="NODE_ENV=production"
Environment="PORT=3000"

[Install]
WantedBy=multi-user.target
```

Activer le service :

```bash
sudo systemctl daemon-reload
sudo systemctl enable prolink
sudo systemctl start prolink

# Vérifier le statut
sudo systemctl status prolink
```

### Nginx (Reverse Proxy)

Créer `/etc/nginx/sites-available/prolink` :

```nginx
upstream prolink_backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name prolink.com www.prolink.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name prolink.com www.prolink.com;

    # Certificats SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/prolink.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/prolink.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 20M;

    # Frontend et API
    location / {
        proxy_pass http://prolink_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://prolink_backend;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Fichiers statiques (à mettre en cache)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Uploads
    location /uploads/ {
        alias /var/www/prolink/app/uploads/;
        expires 30d;
    }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/prolink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Certificat SSL (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d prolink.com -d www.prolink.com
```

## 5. Logs et monitoring

### Logs du service

```bash
# Voir les logs en temps réel
sudo journalctl -u prolink -f

# Logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Monitoring

- 📊 **PM2 Monitoring** : `pm2 monitor`
- 📊 **Sentry** : Configuré en production
- 🔔 **Alertes** : Via email/Slack

## 6. Mises à jour

### Mettre à jour l'application

```bash
cd /var/www/prolink/app

# Pull les dernières modifications
git pull origin main

# Réinstaller les dépendances
npm install --production

# Rebuild les frontends
npm run build:all

# Redémarrer le service
sudo systemctl restart prolink
```

### Zero-downtime deployment avec PM2

```bash
npm install -g pm2

# Démarrer avec PM2
pm2 start server/index.js --name "prolink"
pm2 save
pm2 startup

# Mises à jour sans downtime
pm2 reload prolink
```

## 7. Sauvegardes

### Backup Base de Données

```bash
#!/bin/bash
BACKUP_DIR="/backups/prolink"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MySQL
mysqldump -u prolink_user -p -h localhost prolink > $BACKUP_DIR/prolink_$DATE.sql

# Comprimer
gzip $BACKUP_DIR/prolink_$DATE.sql

# Nettoyer les vieux backups (>30 jours)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup terminé: $BACKUP_DIR/prolink_$DATE.sql.gz"
```

Ajouter au crontab :

```bash
crontab -e

# Backup tous les jours à 2h du matin
0 2 * * * /scripts/backup-prolink.sh >> /var/log/prolink-backup.log 2>&1
```

### Backup Uploads

```bash
# Sync vers cloud storage
rsync -av /var/www/prolink/app/uploads/ s3://prolink-backup/uploads/
```

## 8. Vérification post-déploiement

```bash
# Health check
curl https://prolink.com/api/health

# Vérifier les ports
sudo netstat -tlnp | grep 3000
sudo netstat -tlnp | grep 80
sudo netstat -tlnp | grep 443

# Vérifier la base de données
mysql -u prolink_user -p prolink -e "SELECT COUNT(*) FROM users;"

# Vérifier les fichiers uploads
du -sh /var/www/prolink/app/uploads/
```

## 9. Troubleshooting

### Port déjà utilisé

```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Permissions

```bash
sudo chown -R www-data:www-data /var/www/prolink/
sudo chmod -R 755 /var/www/prolink/
sudo chmod -R 755 /var/www/prolink/app/uploads/
```

### Erreur CORS

Vérifier que `FRONTEND_URL` dans `.env` correspond au domaine de production

## 10. Performance Tuning

### Compression Gzip

```nginx
# Dans nginx.conf
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml application/json application/javascript;
```

### Cache HTTP

```javascript
// Dans server/index.js
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=3600");
  next();
});
```

### Connection Pooling MySQL

```javascript
// Déjà configuré dans db/pool.js
// Vérifier que le pool est optimisé pour la charge
```

---

## Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données créée et initialisée
- [ ] Certificats SSL installés
- [ ] Nginx configuré et testé
- [ ] Service SystemD/PM2 démarré
- [ ] Backups configurés
- [ ] Monitoring activé
- [ ] Health checks en place
- [ ] Logs configurés
- [ ] DNS pointant vers le serveur
- [ ] HTTPS fonctionnant
- [ ] WebSocket fonctionnant
- [ ] Uploads fonctionnant

---

**Documentation mise à jour** : 9 mai 2026
