# Neon setup for MotoOps

Project: `winter-rain-79491684` · branch: `production`

Run these in PowerShell from `auto-garage-services` (needs browser login once):

```powershell
npm i -g neon@latest
neon login
neon skills -y
neon mcp -y
neon link --project-id winter-rain-79491684 --branch production -y
neon config init
# neon.ts is already in the repo with the preview buckets config
neon deploy
```

Then copy the **connection string** from Neon Console → Connection details  
(use the pooled URL ending with `?sslmode=require`) and paste it into Render as `DATABASE_URL`.

If `neon` CLI cannot reach the API (SSL/network), skip CLI and use the console only:

1. [console.neon.tech](https://console.neon.tech) → project **winter-rain-79491684**
2. Branch **production** → **Connection string**
3. Paste into Render Environment → `DATABASE_URL`
