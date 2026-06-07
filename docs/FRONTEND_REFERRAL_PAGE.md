# Страница рефералов (фронтенд)

## Запросы при открытии страницы

Загружать параллельно:

| Метод | Путь | Назначение |
|-------|------|------------|
| `GET` | `/v1/users/telegram/{telegramId}/referral-link` | Ссылка для копирования |
| `GET` | `/v1/users/telegram/{telegramId}/referrals` | Список приглашённых |

```javascript
import { fetchReferralLink, fetchReferrals } from '../api/referrals.js';

const [link, stats] = await Promise.all([
  fetchReferralLink(telegramId),
  fetchReferrals(telegramId),
]);

setReferralLink(link?.referral_link ?? '');
setReferralData(stats);
```

## Типы ответов

### ReferralLinkResponse

```json
{ "referral_link": "https://t.me/CyberMate_bot?startapp=ref_123456789" }
```

### ReferralsResponse

```json
{
  "referrals": [
    {
      "id": "1",
      "telegram_id": "987654321",
      "username": "friend",
      "first_name": "Alex",
      "bonus": 300
    }
  ],
  "total_count": 1
}
```

- `404` на `/referrals` — профиль ещё не создан через `POST /v1/register`; показывать пустой список.
- Блок **«Мои рефералы»** строится из `referrals`, не из локального мока.

## Регистрация с рефералом

При `POST /v1/register` передавать:

```javascript
start_param: Telegram.WebApp.initDataUnsafe.start_param ?? ''
```

Пример значения: `ref_777000`.

## Мок (локальная разработка)

При `VITE_ENABLE_TELEGRAM_MOCK=true` (в dev включено по умолчанию):

- если API недоступен, пустой или `404` — показываются демо-данные из `src/api/referrals.mock.js`;
- ссылка: `https://t.me/{BOT}?startapp=ref_{telegramId}`;
- список: 3 приглашённых пользователя с бонусами `+300` / `+150`.

Если бэкенд отвечает с реальными данными — используются они.

## Готовые функции

| Функция | Файл |
|---------|------|
| `fetchReferralLink(telegramId)` | `src/api/referrals.js` |
| `fetchReferrals(telegramId)` | `src/api/referrals.js` |
| `ReferralItem`, `ReferralsResponse` | JSDoc в `src/api/referrals.js` |

## Проверка в Network

1. Открыть страницу «Реферальная программа».
2. `GET .../referral-link` → `200`, в теле `referral_link`.
3. `GET .../referrals` → `200` (или `404` до регистрации).

## Реализация во фронте

- Экран: `renderReferralScreen()` в `src/App.jsx`
- API-обёртки без telegram id: `getMyReferralLink()`, `getMyReferrals()` в `src/api/telegramApi.js`
