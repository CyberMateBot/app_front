# Инструкция для агента бэкенда (тема light/dark)

Используйте, если на фронте переключатель двигается, но `PATCH` падает или после перезагрузки тема не восстанавливается.

## Контракт API

| Метод | Путь | Тело / ответ |
|--------|------|----------------|
| `GET` | `/v1/users/telegram/{telegram_id}` | В JSON профиля: `data.theme` — `"light"` или `"dark"` |
| `PATCH` | `/v1/users/telegram/{telegram_id}/theme` | Request: `{"theme":"light"}` или `"dark"`. Ответ `200` |

- `telegram_id` — строка (`String(initDataUnsafe.user.id)`).
- Пользователь должен существовать (`POST /v1/register`), иначе `PATCH` → **404**.
- CORS: `CORS_ALLOWED_ORIGINS` должен включать URL фронта.

## Проверка

```bash
curl -s http://localhost:8090/v1/users/telegram/777000
curl -X PATCH http://localhost:8090/v1/users/telegram/777000/theme \
  -H "Content-Type: application/json" \
  -d '{"theme":"light"}'
```

## Не бэкенд

Если ползунок анимируется, а экран не меняется — CSS фронта (`data-theme`, `--cm-*` в `App.css`).
