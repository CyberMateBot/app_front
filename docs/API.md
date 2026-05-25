# API CyberMate (фронтенд)

Базовый URL: `VITE_API_BASE_URL` (по умолчанию `http://localhost:8090`).

В режиме `npm run dev` с пустым `VITE_API_BASE_URL` запросы идут на `http://localhost:5173/v1/...` и проксируются Vite на `:8090`.

## Почему в DevTools пусто

1. Открыто **не в Telegram** и **нет mock** — до `fetch` код не доходит (нет `user` в initData).
2. **Бэкенд не запущен** — запросы есть, но красные (failed).
3. Фильтр Network: смотрите **Fetch/XHR**, не только Doc.

**Локально:** скопируйте `.env.example` → `.env.development` (уже есть) и перезапустите `npm run dev`. Mock Telegram включён по умолчанию в dev.

---

## Существующие ручки (используются сейчас)

### `POST /v1/register`
Регистрация при старте.

```json
{
  "initDataRaw": "<base64 initData>",
  "startParam": ""
}
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
Баланс и транзакции.

### `GET /v1/referrals/telegram/{telegramId}`
Реферальная программа.

### `GET /v1/prompts/history/telegram/{telegramId}`
История промтов.

### `POST /v1/prompts/history`
Сохранение промта после чата.

```json
{
  "telegramId": "777000",
  "prompt": "текст",
  "category": "yandexgpt"
}
```

### `POST /v1/generate/text`
Генерация текста / AI-чат.

```json
{
  "telegramId": "777000",
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
