/**
 * @param {Response} res
 * @returns {Promise<Error & { code?: string }>}
 */
export async function errorFromResponse(res, fallbackMessage) {
    const raw = await res.text();
    let message = fallbackMessage;
    let code;

    try {
        const payload = JSON.parse(raw);
        if (payload?.message) {
            message = payload.message;
        }
        if (payload?.code) {
            code = payload.code;
        }
    } catch {
        if (raw) {
            message = raw;
        }
    }

    const err = new Error(message);
    if (code) {
        err.code = code;
    }
    return err;
}

/** Maps API error codes to short UI copy. */
export function formatUserFacingError(error, language = 'ru') {
    if (!error) {
        return '';
    }

    if (error.code === 'INSUFFICIENT_BALANCE') {
        return language === 'ru'
            ? 'Недостаточно Cybercoins на балансе.'
            : 'Insufficient Cybercoins balance.';
    }

    return error instanceof Error ? error.message : String(error);
}
