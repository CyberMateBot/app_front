import {
    API_BASE_URL,
    API_BASE_URL_MISCONFIGURED,
    API_BASE_URL_MISSING_IN_PROD,
} from '../config/env.js';

/** Должен быть ≥ SERVER_WRITE_TIMEOUT на бэкенде; Railway может обрывать ~60–120 с. */
const API_FETCH_TIMEOUT_MS = 130_000;

export function resolveApiUrl(pathname) {
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

    if (API_BASE_URL_MISSING_IN_PROD) {
        throw new Error(
            'Не задан VITE_API_BASE_URL при сборке фронта. В Railway добавьте https://ваш-бэкенд.up.railway.app и сделайте Redeploy.',
        );
    }

    if (API_BASE_URL_MISCONFIGURED) {
        throw new Error(
            'Некорректный VITE_API_BASE_URL. Укажите полный URL с https://, например https://tgapp-production-469a.up.railway.app',
        );
    }

    if (!API_BASE_URL) {
        return normalizedPath;
    }

    try {
        return new URL(normalizedPath, `${API_BASE_URL}/`).toString();
    } catch {
        throw new Error(
            `Некорректный адрес API (${API_BASE_URL}). Проверьте VITE_API_BASE_URL в Railway.`,
        );
    }
}

function parseBodyForLog(body) {
    if (!body || typeof body !== 'string') {
        return undefined;
    }

    try {
        return JSON.parse(body);
    } catch {
        return body;
    }
}

function mergeAbortSignals(...signals) {
    const activeSignals = signals.filter(Boolean);

    if (activeSignals.length === 0) {
        return undefined;
    }

    if (activeSignals.length === 1) {
        return activeSignals[0];
    }

    if (typeof AbortSignal.any === 'function') {
        return AbortSignal.any(activeSignals);
    }

    const controller = new AbortController();

    const abortFrom = (signal) => {
        if (!controller.signal.aborted) {
            controller.abort(signal.reason);
        }
    };

    for (const signal of activeSignals) {
        if (signal.aborted) {
            abortFrom(signal);
            break;
        }

        signal.addEventListener('abort', () => abortFrom(signal), { once: true });
    }

    return controller.signal;
}

function formatFetchError(error, url, method, wasUserAborted = false) {
    const raw = error instanceof Error ? error.message : String(error);
    const lower = raw.toLowerCase();

    if (wasUserAborted) {
        return raw || 'Запрос отменён.';
    }

    if (error?.name === 'AbortError' || lower.includes('aborted')) {
        return `Превышено время ожидания ответа API (${method} ${url}). Попробуйте короче запрос или модель yandexgpt.`;
    }

    if (lower === 'load failed' || lower.includes('failed to fetch') || lower.includes('networkerror')) {
        return [
            'Не удалось связаться с API (Load failed).',
            `Проверьте VITE_API_BASE_URL (${API_BASE_URL || 'не задан'}) и CORS_ALLOWED_ORIGINS на бэкенде.`,
            'На Railway для бэкенда: CORS_ALLOWED_ORIGINS=* или URL вашего фронта.',
        ].join(' ');
    }

    return raw || 'Сетевая ошибка при запросе к API.';
}

/**
 * Обёртка над fetch: таймаут, понятные ошибки для Telegram WebView.
 */
export async function apiFetch(pathname, options = {}) {
    const url = resolveApiUrl(pathname);
    const method = options.method ?? 'GET';
    const { signal: externalSignal, ...fetchOptions } = options;

    if (import.meta.env.DEV) {
        console.info(`[API] → ${method} ${pathname}`, parseBodyForLog(fetchOptions.body) ?? '');
    }

    const timeoutController = new AbortController();
    const timeoutId = window.setTimeout(() => timeoutController.abort(), API_FETCH_TIMEOUT_MS);
    const signal = mergeAbortSignals(externalSignal, timeoutController.signal);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal,
        });

        if (import.meta.env.DEV) {
            console.info(`[API] ← ${method} ${pathname} ${response.status}`);
        }

        return response;
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error(`[API] ✗ ${method} ${url}`, error);
        }

        if (externalSignal?.aborted) {
            throw error;
        }

        throw new Error(formatFetchError(error, url, method, false));
    } finally {
        window.clearTimeout(timeoutId);
    }
}
