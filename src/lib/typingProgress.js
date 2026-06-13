const progressByMessageId = new Map();

export function getTypingProgress(messageId) {
    if (!messageId) {
        return 0;
    }

    return progressByMessageId.get(messageId) ?? 0;
}

export function setTypingProgress(messageId, length) {
    if (!messageId) {
        return;
    }

    progressByMessageId.set(messageId, Math.max(0, Number(length) || 0));
}

export function clearTypingProgress(messageId) {
    if (!messageId) {
        return;
    }

    progressByMessageId.delete(messageId);
}
