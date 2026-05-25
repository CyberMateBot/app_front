# CyberMate frontend — handoff для агента

Отдельный репозиторий фронта (Vite + React). Бэкенд — Go (`tgapp-`), UI только здесь.

## API и CORS

- Базовый URL: `VITE_API_BASE_URL` (в dev: `http://localhost:8090` или пусто + Vite proxy `/v1` → `:8090`).
- На бэкенде: `CORS_ALLOWED_ORIGINS=<URL фронта>` (например `http://localhost:5173`).
- Не использовать `window.location.origin` как API URL.

Подробнее: [API.md](./API.md).

## Тема (light / dark)

| Шаг | Источник |
|-----|----------|
| 1 | `localStorage` ключ `cybermate-ui-theme` |
| 2 | `GET /v1/users/telegram/{telegram_id}` → `data.theme` |
| 3 | `Telegram.WebApp.colorScheme` |
| 4 | `light` |

- `telegram_id` = `String(Telegram.WebApp.initDataUnsafe.user.id)`
- Смена: `applyTheme` + `PATCH /v1/users/telegram/{id}/theme` с `{ "theme": "dark" }`; при ошибке API локальная тема **не** откатывается.
- DOM: `data-theme` на `<html>`, CSS `:root[data-theme='light']` в `App.css`.
- Telegram: `setHeaderColor` / `setBackgroundColor`; `themeChanged` — только если нет значения в `cybermate-ui-theme`.
- Регистрация обязательна: `POST /v1/register`, иначе PATCH theme → `404`.

Реализация: `src/lib/theme.js`, переключатель в профиле/настройках (`App.jsx`).

## Старт приложения

1. `initTelegramMiniAppAsync`
2. `POST /v1/register` (409 = OK)
3. `GET /v1/users/telegram/{id}` — профиль и тема
4. Остальные экраны по требованию

## Чеклист

- [ ] `.env`: `VITE_API_BASE_URL=http://localhost:8090`
- [ ] Бэкенд: `CORS_ALLOWED_ORIGINS=http://localhost:5173`
- [ ] `npm run dev`, Mini App в Telegram или `VITE_ENABLE_TELEGRAM_MOCK=true`
- [ ] Переключение темы → PATCH в Network; после перезагрузки тема из API/localStorage
