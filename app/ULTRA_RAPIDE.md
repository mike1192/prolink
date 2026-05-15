# ⚡ Ultra Quick Start (2 min)

## 🚀 Démarrer MAINTENANT

```bash
cd app
cp .env.example .env
# Éditer .env (au minimum DB_PASSWORD et JWT_SECRET)
npm install && cd present && npm install && cd .. && cd superadmin && npm install && cd ..
start-dev-all.bat  # Windows ou ./start-dev-all.sh (Linux/Mac)
```

## 📍 Ouvrir

- Frontend: **http://localhost:3000**
- Admin: **http://localhost:3000/superadmin**

## 🔨 Build (prod)

```bash
npm run build:all && npm run start
```

## ❌ Port 3000 déjà utilisé ?

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## ✅ Configuration OK ?

```bash
validate-config.bat  # Windows ou validate-config.sh (Linux/Mac)
```

---

**Besoin de plus de détails ?** → [LISEZMOI_D_ABORD.md](./LISEZMOI_D_ABORD.md)
