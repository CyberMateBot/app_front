const STORAGE_PREFIX = 'cybermate:media-session:';

function storageKey(kind) {
    return `${STORAGE_PREFIX}${kind}`;
}

export function loadMediaSession(kind) {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(storageKey(kind));
        if (!raw) {
            return null;
        }
        return JSON.parse(raw);
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

export function saveMediaSession(kind, payload) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        if (!payload) {
            window.localStorage.removeItem(storageKey(kind));
            return;
        }
        window.localStorage.setItem(storageKey(kind), JSON.stringify(sanitizeMediaSessionPayload(payload)));
    } catch {
        try {
            window.localStorage.removeItem(storageKey(kind));
        } catch {
            // Storage may be full or blocked.
        }
    }
}

export function clearMediaSession(kind) {
    saveMediaSession(kind, null);
}
