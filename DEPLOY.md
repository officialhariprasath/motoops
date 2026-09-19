# Go live — MotoOps (same stack as Finance Flow)

Finance Flow live pattern:

| Piece | Where |
|-------|--------|
| API | **Render** free web service |
| Database | **Neon** Postgres (`DATABASE_URL` pasted into Render) |
| Frontend | **Vercel** |

Render free tier has monthly limits — keep **only the Nest API** on Render (one service). Do **not** create a Render Postgres. Neon holds the data (same as Finance Flow’s current `render.yaml`).

---

## What this repo includes

| File | Purpose |
|------|---------|
| `render.yaml` | Blueprint for `motoops-api` (NestJS) |
| `DEPLOY.md` | These steps |
| `server-nestjs/` | API (Render) |
| `client-nextjs/` | App UI (Vercel) |

---

## 1. Push to GitHub

Repo: `https://github.com/hariprasathjaikrishnan-stack/motoops.git`

```powershell
cd auto-garage-services
git push -u origin main
```

---

## 2. Neon — database (do this first)

1. Open [console.neon.tech](https://console.neon.tech) → create project **motoops** (or reuse an existing free project).
2. Copy the connection string (**pooled** URI is fine), e.g.  
   `postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`
3. Keep it for the Render env step below.

> If Render monthly quota is exhausted, you can still create/use Neon now and attach `DATABASE_URL` when Render allows a new deploy or next billing cycle.

---

## 3. Render — API only

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect GitHub repo **motoops** → branch **main**
3. Render reads `render.yaml` and creates **motoops-api**
4. Open **motoops-api** → **Environment** and set:

   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | Neon connection string from step 2 |
   | `TYPEORM_SYNC` | `true` for **first** deploy (creates tables) |
   | `ENABLE_CORS` | `http://localhost:3000` for now; update after Vercel |

5. Wait until status is **Live**. Copy API URL, e.g. `https://motoops-api.onrender.com`
6. Open that URL in a browser — health/root should respond.

**After first successful boot**, set `TYPEORM_SYNC=false` (or delete it) so schema is not auto-altered on every restart, then **Manual Deploy**.

### Seed demo data (optional)

From your PC (with Neon URL):

```powershell
cd server-nestjs
$env:DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
$env:NODE_ENV="production"
$env:DATABASE_SSL="true"
npm run seed
```

Login: `admin` / `123456`

---

## 4. Vercel — frontend (Next.js)

1. [vercel.com/new](https://vercel.com/new) → import **motoops**
2. **Root Directory:** `client-nextjs`
3. **Framework:** Next.js
4. Environment variables:

   | Name | Value |
   |------|--------|
   | `BACKEND_SERVER_URL` | `https://motoops-api.onrender.com` (your Render URL, no trailing slash) |
   | `NEXT_PUBLIC_APP_URL` | `https://YOUR-APP.vercel.app` (set after first deploy, then redeploy) |
   | `JWT_ACCESS_SECRET` | same value as Render `JWT_ACCESS_SECRET` (copy from Render) |
   | `JWT_REFRESH_SECRET` | same value as Render `JWT_REFRESH_SECRET` |

5. Deploy → copy the Vercel URL.

---

## 5. CORS — allow Vercel

1. Render → **motoops-api** → **Environment**
2. Set `ENABLE_CORS` to (comma-separated, no spaces):

   ```
   http://localhost:3000,https://YOUR-APP.vercel.app
   ```

3. Save → redeploy API.

---

## 6. Share with team

- **App:** `https://YOUR-APP.vercel.app`
- **API:** `https://motoops-api.onrender.com`
- **Admin:** `admin` / `123456` (change after go-live)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS in browser | Exact Vercel URL must be in `ENABLE_CORS` |
| API slow first hit | Render free cold start (~30–60s) |
| DB connection failed | Neon URI + `DATABASE_SSL=true`; use `?sslmode=require` |
| Empty tables | First deploy needs `TYPEORM_SYNC=true`, then run `npm run seed` |
| Render “monthly limit” | Keep only this one web service; DB stays on Neon; wait for quota reset |
| Frontend can’t reach API | `BACKEND_SERVER_URL` must be the public Render URL |

---

## Cost / quota notes

- **Render free:** limited hours/builds per month — API only (matches Finance Flow).
- **Neon free:** Postgres for `DATABASE_URL`.
- **Vercel free:** Next.js UI.

Do **not** add Render Postgres for MotoOps; that would burn more Render quota.
