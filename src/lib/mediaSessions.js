const STORAGE_PREFIX = 'cybermate:media-session:';
const LAST_USED_KEY = 'cybermate:media-session:last-used';

/**
 * Track the most recently touched AI screen so the home "continue" button
 * can resume the last active tool (chat / image / video / audio) regardless
 * of whether it produced a finished, history-persisted result.
 *
 * Stored as `{ kind, modelId, savedAt }`. `kind` is one of the media kinds
 * (chat|image|video|audio). Only touched by `saveMediaSession` — never
 * cleared explicitly, so a stale record just becomes older; readers can
 * decide whether to honor it based on `savedAt`.
 */
function recordLastUsedSession(kind, payload) {
    if (typeof window === 'undefined' || !kind || !payload) {
        return;
    }

    try {
        const modelId = payload?.modelId
            ?? payload?.model
            ?? payload?.textModel
            ?? payload?.imageModel
            ?? payload?.videoModel
            ?? payload?.audioModel
            ?? '';

        window.localStorage.setItem(
            LAST_USED_KEY,
            JSON.stringify({
                kind: String(kind),
                modelId: String(modelId || ''),
                savedAt: Date.now(),
            }),
        );
    } catch {
        // localStorage may be full or blocked — non-fatal, we just lose
        // the "continue where you left off" hint for this session.
    }
}

export function loadLastUsedSession() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(LAST_USED_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        return {
            kind: String(parsed.kind || ''),
            modelId: String(parsed.modelId || ''),
            savedAt: Number(parsed.savedAt) || 0,
        };
    } catch {
        return null;
    }
}

function storageKey(kind, scope) {
    const base = String(kind || '').trim();

    if (!base) {
        return STORAGE_PREFIX;
    }

    const normalizedScope = String(scope || '').trim();

    if (!normalizedScope) {
        return `${STORAGE_PREFIX}${base}`;
    }

    return `${STORAGE_PREFIX}${base}:${normalizedScope}`;
}

export function loadMediaSession(kind, scope) {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const scopedRaw = scope ? window.localStorage.getItem(storageKey(kind, scope)) : null;

        if (scopedRaw) {
            return JSON.parse(scopedRaw);
        }

        if (!scope) {
            const raw = window.localStorage.getItem(storageKey(kind));
            return raw ? JSON.parse(raw) : null;
        }

        return null;
    } catch {
        return null;
    }
}

const MAX_STORED_MESSAGES = 40;
const MAX_STORED_FIELD_CHARS = 12_000;

function trimStoredValue(value) {
    if (typeof value !== 'string') {
        return value;
    }

    if (value.length <= MAX_STORED_FIELD_CHARS) {
        return value;
    }

    return `${value.slice(0, MAX_STORED_FIELD_CHARS)}…`;
}

function sanitizeMediaSessionPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    const next = { ...payload };

    if (Array.isArray(next.messages)) {
        next.messages = next.messages.slice(-MAX_STORED_MESSAGES).map((message) => {
            if (!message || typeof message !== 'object') {
                return message;
            }

            return {
                ...message,
                content: trimStoredValue(message.content),
                scenePrompt: trimStoredValue(message.scenePrompt),
                imageUrl: trimStoredValue(message.imageUrl ?? message.image_url),
                videoUrl: trimStoredValue(message.videoUrl ?? message.video_url),
                typingProgress: typeof message.typingProgress === 'number'
                    ? message.typingProgress
                    : undefined,
                isTyping: Boolean(message.isTyping),
            };
        });
    }

    if (typeof next.generatedImageUrl === 'string') {
        next.generatedImageUrl = trimStoredValue(next.generatedImageUrl);
    }

    if (Array.isArray(next.generatedImageUrls)) {
        next.generatedImageUrls = next.generatedImageUrls
            .slice(-8)
            .map((url) => trimStoredValue(url));
    }

    if (typeof next.generatedVideoUrl === 'string') {
        next.generatedVideoUrl = trimStoredValue(next.generatedVideoUrl);
    }

    if (typeof next.generatedAudioUrl === 'string') {
        next.generatedAudioUrl = trimStoredValue(next.generatedAudioUrl);
    }

    if (typeof next.audioPrompt === 'string') {
        next.audioPrompt = trimStoredValue(next.audioPrompt);
    }

    if (typeof next.videoPrompt === 'string') {
        next.videoPrompt = trimStoredValue(next.videoPrompt);
    }

    return next;
}

export function saveMediaSession(kind, payload, scope) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        if (!payload) {
            window.localStorage.removeItem(storageKey(kind, scope));
            return;
        }
        window.localStorage.setItem(storageKey(kind, scope), JSON.stringify(sanitizeMediaSessionPayload(payload)));
        // Update the "last used" pointer so home / resume flows can jump
        // straight back into the tool the user was most recently in.
        recordLastUsedSession(kind, payload);
    } catch {
        try {
            window.localStorage.removeItem(storageKey(kind, scope));
        } catch {
            // Storage may be full or blocked.
        }
    }
}

export function clearMediaSession(kind, scope) {
    saveMediaSession(kind, null, scope);
}
