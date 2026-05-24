# Railway (frontend)

## Service settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `tgapp_front` (if repo root is `tgfront`) |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `serve dist -s -l tcp://0.0.0.0:$PORT` |

Or leave empty — `railway.toml` in this folder sets the same commands.

## Environment

```env
VITE_API_URL=https://tgapp-production-469a.up.railway.app
```

Redeploy after changing `VITE_*` (baked in at build time).

## Important

- Do **not** override Start Command to `vite --host 0.0.0.0` in the Railway UI (that is dev mode).
- Logs should show: `Accepting connections at http://0.0.0.0:XXXX` (XXXX = Railway `PORT`).
- Do not use `vite --host` or `vite preview` as Start Command on Railway.

## BotFather Main App URL

```
https://tgappfront-production.up.railway.app
```
