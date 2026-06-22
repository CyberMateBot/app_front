const INSUFFICIENT_TOKEN_CODES = new Set([
    'INSUFFICIENT_TOKENS',
    'INSUFFICIENT_BALANCE',
    'INSUFFICIENT_FUNDS',
    'NOT_ENOUGH_TOKENS',
    'LOW_TOKEN_BALANCE',
]);

function extractErrorPayload(raw) {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function readNestedError(payload) {
    if (!payload || typeof payload !== 'object') {
        return { message: '', code: '' };
    }

    const nested = payload.error;
    let message = '';
    let code = '';

    if (typeof nested === 'string') {
        message = nested;
    } else if (nested && typeof nested === 'object') {
        message = nested.message ?? nested.error ?? '';
        code = nested.code ?? '';
    }

    if (!message && payload.message) {
        message = payload.message;
    }

    if (!code && payload.code) {
        code = payload.code;
    }

    if (!message && payload.data && typeof payload.data === 'object') {
        message = payload.data.message ?? payload.data.error ?? '';
        code = code || payload.data.code || '';
    }

    return {
        message: String(message || '').trim(),
        code: String(code || '').trim(),
    };
}

/**
 * @param {Response} res
 * @returns {Promise<Error & { code?: string, status?: number }>}
 */
export async function errorFromResponse(res, fallbackMessage) {
    const raw = await res.text();
    const payload = extractErrorPayload(raw);
    const nested = readNestedError(payload);
    let message = nested.message || fallbackMessage;
    let code = nested.code;

    if (!payload && raw) {
        message = raw;
    }

    const err = new Error(message);
    err.status = res.status;

    if (code) {
        err.code = code;
    }

    return err;
}

/** @param {Error & { code?: string, status?: number }} error */
export function isInsufficientTokensError(error) {
    if (!error) {
        return false;
    }

    if (error.code && INSUFFICIENT_TOKEN_CODES.has(error.code)) {
        return true;
    }

    if (error.status === 402) {
        return true;
    }

    const message = String(error.message || '').toLowerCase();

    if (!message) {
        return false;
    }

    if (message.includes('insufficient tokens')) {
        return true;
    }

    if (
        message.includes('insufficient')
        || message.includes('not enough')
        || message.includes('недостаточно')
    ) {
        return /token|balance|coin|токен|баланс/.test(message);
    }

    if (message.includes('failed generation') || message.includes('failed to generate')) {
        return error.status === 402 || error.status === 403 || error.status === 400;
    }

    return false;
}

/** @param {Error & { code?: string, status?: number }} error */
export function isModelLockedError(error) {
    if (!error) {
        return false;
    }

    if (error.code === 'MODEL_LOCKED') {
        return true;
    }

    const message = String(error.message || '').toLowerCase();
    return error.status === 403 && (
        message.includes('subscription plan')
        || message.includes('requires the')
        || message.includes('подписк')
    );
}

/** Maps API error codes to short UI copy. */
export function formatUserFacingError(error, language = 'ru') {
    if (!error) {
        return '';
    }

    if (isModelLockedError(error)) {
        return language === 'ru'
            ? 'Эта модель недоступна на вашем тарифе. Обновите подписку.'
            : 'This model is not available on your plan. Upgrade your subscription.';
    }

    if (isInsufficientTokensError(error)) {
        return language === 'ru'
            ? 'Недостаточно токенов.'
            : 'Insufficient tokens.';
    }

    return error instanceof Error ? error.message : String(error);
}
