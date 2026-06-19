# API CyberMate (фронтенд)

Базовый URL: `VITE_API_BASE_URL` (по умолчанию `http://localhost:8090`).

В режиме `npm run dev` с пустым `VITE_API_BASE_URL` запросы идут на `http://localhost:5173/v1/...` и проксируются Vite на `:8090`.

## Почему в DevTools пусто

1. Открыто **не в Telegram** и **нет mock** — до `fetch` код не доходит (нет `user` в initData).
2. **Бэкенд не запущен** — запросы есть, но красные (failed).
3. Фильтр Network: смотрите **Fetch/XHR**, не только Doc.

**Локально:** скопируйте `.env.example` → `.env.development` (уже есть) и перезапустите `npm run dev`. Mock Telegram включён по умолчанию в dev.

## Проверка Telegram initData

Для защищённых ручек фронт передаёт подпись Telegram:

| Ручки | Как передаётся |
|-------|----------------|
| `POST /v1/generate/*`, `POST /v1/prompts/history` | В теле: `telegramId`, `initDataRaw` (base64 от `Telegram.WebApp.initData`) |
| `GET` / `DELETE /v1/prompts/history/telegram/{id}` | Заголовок `X-Telegram-Init-Data: <initData>` |

Без `TELEGRAM_BOT_TOKEN` на бэкенде (локальная разработка) проверка init data отключена.

---

## Существующие ручки (используются сейчас)

### `POST /v1/register`
Регистрация при старте.

```json
{
  "initDataRaw": "<base64 initData>",
  "start_param": "ref_777000"
}
```

`start_param` — из `Telegram.WebApp.initDataUnsafe.start_param` (например `ref_777000`).

### `GET /v1/users/telegram/{telegramId}/referral-link`
Реферальная ссылка для Mini App.

```json
{ "referral_link": "https://t.me/CyberMate_bot?startapp=ref_123..." }
```

- `409` — уже зарегистрирован (фронт считает это OK).

### `GET /v1/users/telegram/{telegramId}`
Профиль пользователя. В `data.theme`: `"light"` | `"dark"`.

### `PATCH /v1/users/telegram/{telegramId}/theme`
Сохранение темы UI (нужна предварительная регистрация `POST /v1/register`, иначе `404`).

```json
{ "theme": "dark" }
```

Фронт: `localStorage` ключ `cybermate-ui-theme`, при ошибке PATCH локальная тема не откатывается.

### `GET /v1/wallet/telegram/{telegramId}`
Баланс токенов (`wallets.balance_available`) и транзакции.

```json
{
  "wallet": {
    "balance": 1600,
    "balance_available": 1600,
    "tokens": 1600,
    "total_earned": 0
  },
  "transactions": []
}
```

`404` — профиль не найден.

### `GET /v1/users/telegram/{telegramId}/referrals`
Список приглашённых пользователей.

```json
{
  "referrals": [
    {
      "id": "1",
      "telegram_id": "987654321",
      "username": "friend",
      "first_name": "Alex",
      "photo_url": "https://...",
      "bonus": 300
    }
  ],
  "total_count": 1
}
```

`404` — профиль ещё не создан через `POST /v1/register` (показывать пустой список).

Подробнее: [FRONTEND_REFERRAL_PAGE.md](./FRONTEND_REFERRAL_PAGE.md).

### `GET /v1/referrals/telegram/{telegramId}` (legacy)
Устаревший путь; используйте `/v1/users/telegram/{telegramId}/referrals`.

### `GET /v1/prompts/history/telegram/{telegramId}`
История промтов.

Заголовок: `X-Telegram-Init-Data: <initData>`.

`DELETE` на том же пути — очистка истории (тот же заголовок).

### `POST /v1/prompts/history`
Сохранение промта после чата.

```json
{
  "telegramId": "777000",
  "initDataRaw": "<base64 initData>",
  "prompt": "текст",
  "category": "yandexgpt"
}
```

### `POST /v1/generate/text`
Генерация текста / AI-чат.

```json
{
  "telegramId": "777000",
  "initDataRaw": "<base64 initData>",
  "prompt": "Привет",
  "category": "text",
  "model": "yandexgpt"
}
```

**Модели:** `yandexgpt`, `deepseek`, `gemini-flash`, `openai`.

**Категория:** `text` (или `Текст` — бэкенд принимает оба варианта).

### `POST /v1/generate/image`
Генерация изображения.

**Модели:** `nano-banana` (Gemini Flash Image), `alice-ai-art` (Yandex Alice AI ART).

```json
{
  "telegramId": "777000",
  "prompt": "кот в киберпанк-городе",
  "category": "image",
  "model": "alice-ai-art"
}
```

**Ответ:**

```json
{
  "data": {
    "imageUrl": "https://...",
    "model": "nano-banana",
    "tokensUsed": 3
  }
}
```

### `POST /v1/generate/text` (ответ)

```json
{
  "data": {
    "text": "...",
    "tokensUsed": 42,
    "model": "yandexgpt"
  }
}
```

---

## Новые ручки (нужны для полного продукта)

| Метод | Путь | Зачем |
|--------|------|--------|
| `GET` | `/v1/models` | Каталог моделей с бэкенда (вместо хардкода) |
| `POST` | `/v1/chat/completions` | Диалог с контекстом (несколько сообщений) |
| `POST` | `/v1/generate/image` | Фото |
| `POST` | `/v1/generate/video` | Видео |
| `POST` | `/v1/generate/music` | Музыка |
| `POST` | `/v1/generate/voice` | Озвучка |
| `GET` | `/v1/subscriptions/plans` | Тарифы в профиле |
| `POST` | `/v1/wallet/top-up` | Пополнение CyberCoins |
| `DELETE` | `/v1/prompts/history/{id}` | Удаление из истории (кнопка корзины) |

---

## Когда уходят запросы (фронт)

| Событие | Ручки |
|---------|--------|
| Загрузка приложения | `POST /v1/register`, `GET .../users/telegram/...` |
| Открытие профиля | `GET` wallet, referrals, history (если ещё не грузили) |
| Открытие истории | `GET` history |
| Отправка в AI-чате | `POST /v1/generate/text`, затем `POST /v1/prompts/history` |
