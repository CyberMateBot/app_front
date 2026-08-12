# Railway (frontend)

## Service settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `tgapp_front` (if repo root is `tgfront`) |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `node scripts/server.mjs` |

Or leave empty — `railway.toml` in this folder sets the same commands.

## Environment

```env
VITE_API_BASE_URL=https://tgapp-production-469a.up.railway.app
```

(не `VITE_API_URL` — в коде используется именно `VITE_API_BASE_URL`)

**Обязательно `https://` в начале.** Если указать только `tgapp-production-469a.up.railway.app`, в Telegram (Safari) будет ошибка *«the string did not match the expected pattern»*.

Redeploy after changing `VITE_*` (baked in at build time — переменная должна быть на сервисе **фронта** до `npm run build`).

## Networking (важно)

В **Settings → Networking**:
- **Public domain** должен быть сгенерирован для этого сервиса
- **Target port** — **не задавайте 5173**. Должно быть **Auto** или совпадать с `$PORT` (часто `8080`).  
  Если указан `5173`, снаружи будет *Application failed to respond*, а healthcheck внутри — `200`.

## Important

- Do **not** override Start Command to `vite --host 0.0.0.0` in the Railway UI (that is dev mode).
- Logs should show: `CyberMate frontend listening on http://0.0.0.0:XXXX`.
- Do not use `vite --host` or `vite preview` as Start Command on Railway.

## BotFather Main App URL

```
https://appfront-production.up.railway.app
```

**Не** указывайте бэкенд (`tgapp-production-469a...`) — иначе Railway: *Application failed to respond*.

## Проверка

1. Откройте в **обычном браузере на телефоне** (не Telegram):  
   https://appfront-production.up.railway.app  
   Должен открыться интерфейс CyberMate.
2. **Настройки → Версия** — должен отображаться `build id` вида `abc123def456-lm2n3o4`. После деплоя значение **обязано измениться**.
3. Проверка API сборки: `curl -s "https://appfront-production.up.railway.app/build-meta.json"` — `buildId` совпадает с версией в приложении.
4. Если в браузере OK, а в Telegram старая версия — полностью **закройте** Mini App (крестик), подождите 5 сек, откройте снова. URL в адресной строке WebView должен содержать `?cm_b=...`.
5. Если в браузере тоже Railway error — смотрите Target port и полные Deploy Logs.
