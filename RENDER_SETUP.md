# Render setup for MotoOps (API only)

Same pattern as Finance Flow: **Render = Nest API**, **Neon = Postgres**, **Vercel = Next.js UI**.

## Before you start

1. Code is on GitHub: `https://github.com/officialhariprasath/motoops`
2. Neon project linked (`winter-rain-79491684`) and you have a `DATABASE_URL`
3. Do **not** create a Render Postgres (saves quota)

---

## Step-by-step (dashboard)

### A. Create the web service

1. Open [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect GitHub → select repo **motoops**
4. Fill in:

| Field | Value |
|-------|--------|
| Name | `motoops-api` |
| Region | Singapore (or closest) |
| Branch | `main` |
| Root Directory | `server-nestjs` |
| Runtime | **Node** |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start:prod` |
| Instance type | **Free** |

5. Click **Advanced** → add environment variables (below)
6. Create Web Service → wait until **Live**

### B. Environment variables (Render → motoops-api → Environment)

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon connection string (`?sslmode=require`) |
| `DATABASE_SSL` | `true` |
| `TYPEORM_SYNC` | `true` *(first deploy only)* |
| `JWT_SECRET` | long random string |
| `JWT_ACCESS_SECRET` | long random string |
| `JWT_REFRESH_SECRET` | long random string |
| `JWT_EXPIRES_IN` | `3600s` |
| `ENABLE_CORS` | `http://localhost:3000` then add Vercel URL later |

Or use **New → Blueprint** and point at the repo — it reads `render.yaml` automatically. Still paste `DATABASE_URL` manually (`sync: false`).

### C. After first successful boot

1. Set `TYPEORM_SYNC` to `false` (or delete it)
2. **Manual Deploy** → clear build cache optional
3. Seed (from your PC):

```powershell
cd server-nestjs
$env:DATABASE_URL="YOUR_NEON_URL"
$env:DATABASE_SSL="true"
$env:NODE_ENV="production"
npm run seed
```

Login: `admin` / `123456`

### D. Copy your API URL

Example: `https://motoops-api.onrender.com`  
Use this as Vercel `BACKEND_SERVER_URL`.

---

## If Render says monthly limit

- You can still finish **Neon** + **GitHub** + **Vercel** now
- Create the Render web service when quota resets
- Keep only this one free service (no Render DB)

---

## Optional: Blueprint instead of manual

`render.yaml` at repo root already defines `motoops-api` with `rootDir: server-nestjs`.  
Dashboard → **New** → **Blueprint** → select **motoops** → apply.
