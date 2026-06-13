import { clearTypingProgress, getTypingProgress, setTypingProgress } from './typingProgress.js';

const CHAR_DELAY_MS = 16;
const activeJobs = new Map();

let listener = null;

export function setBackgroundTypingListener(fn) {
    listener = fn;
}

function emit(messageId, progress, done) {
    listener?.(messageId, progress, done);
}

export function stopBackgroundTyping(messageId) {
    const job = activeJobs.get(messageId);

    if (job?.timerId) {
        window.clearInterval(job.timerId);
    }

    activeJobs.delete(messageId);
}

export function stopAllBackgroundTyping() {
    Array.from(activeJobs.keys()).forEach((messageId) => {
        stopBackgroundTyping(messageId);
    });
}

function ensureJob(messageId, text, startIndex) {
    const existing = activeJobs.get(messageId);

    if (existing?.text === text) {
        return;
    }

    stopBackgroundTyping(messageId);

    let index = Math.min(Math.max(0, startIndex), text.length);

    if (index >= text.length) {
        clearTypingProgress(messageId);
        emit(messageId, text.length, true);
        return;
    }

    setTypingProgress(messageId, index);
    emit(messageId, index, false);

    const timerId = window.setInterval(() => {
        index += 1;
        setTypingProgress(messageId, index);
        emit(messageId, index, false);

        if (index >= text.length) {
            stopBackgroundTyping(messageId);
            clearTypingProgress(messageId);
            emit(messageId, index, true);
        }
    }, CHAR_DELAY_MS);

    activeJobs.set(messageId, { timerId, text, index });
}

export function syncBackgroundTyping(messages) {
    if (!Array.isArray(messages)) {
        return;
    }

    const activeIds = new Set();

    messages.forEach((message) => {
        if (message?.role !== 'assistant' || !message.isTyping || message.isPending) {
            return;
        }

        const text = String(message.content ?? '');

        if (!text) {
            return;
        }

        activeIds.add(message.id);

        const prefersReducedMotion = typeof window !== 'undefined'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            stopBackgroundTyping(message.id);
            clearTypingProgress(message.id);
            emit(message.id, text.length, true);
            return;
        }

        const startIndex = Math.max(
            Number(message.typingProgress) || 0,
            getTypingProgress(message.id),
        );

        ensureJob(message.id, text, startIndex);
    });

    Array.from(activeJobs.keys()).forEach((messageId) => {
        if (!activeIds.has(messageId)) {
            stopBackgroundTyping(messageId);
        }
    });
}
