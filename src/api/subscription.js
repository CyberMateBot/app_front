import { resolveApiUrl } from './httpClient.js';
import { getTelegramInitDataHeaders } from '../lib/telegramInitData.js';

export async function fetchUserSubscription(telegramId) {
    const id = String(telegramId ?? '').trim();
    if (!id) {
        return null;
    }

    // The backend now verifies the caller actually owns telegramId via this
    // header (subscription state used to be readable for any telegram id).
    const response = await fetch(resolveApiUrl(`/v1/users/telegram/${encodeURIComponent(id)}/subscription`), {
        headers: getTelegramInitDataHeaders({ Accept: 'application/json' }),
    });
    if (!response.ok) {
        throw new Error(`subscription ${response.status}`);
    }
    return response.json();
}
