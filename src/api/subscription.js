import { resolveApiUrl } from './httpClient.js';

export async function fetchUserSubscription(telegramId) {
    const id = String(telegramId ?? '').trim();
    if (!id) {
        return null;
    }

    const response = await fetch(resolveApiUrl(`/v1/users/telegram/${encodeURIComponent(id)}/subscription`));
    if (!response.ok) {
        throw new Error(`subscription ${response.status}`);
    }
    return response.json();
}
