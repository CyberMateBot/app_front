export const MAX_CHAT_CONTEXT_TURNS = 12;

const MAX_CONTEXT_USER_CHARS = 8000;
const MAX_CONTEXT_ASSISTANT_CHARS = 5000;

function truncateContextContent(content, role) {
    const text = String(content ?? '').trim();
    const maxLen = role === 'assistant' ? MAX_CONTEXT_ASSISTANT_CHARS : MAX_CONTEXT_USER_CHARS;
    if (text.length <= maxLen) {
        return text;
    }
    const head = 400;
    const tail = maxLen - head - 20;
    return `${text.slice(0, head)}\n\n…\n\n${text.slice(-tail)}`;
}

/**
 * Собирает messages для API из локального чата (только завершённые пары user/assistant).
 * Текущий ввод передаётся отдельно в prompt.
 */
const IMAGE_ASSISTANT_FALLBACK = 'Изображение создано.';

const IMAGE_ASSISTANT_PLACEHOLDERS = [
    'изображение создано.',
    'изображение отредактировано.',
    'видео создано.',
    'видео отредактировано.',
    'видео продлено.',
    'image created.',
    'image created',
    'image edited.',
    'image edited',
    'video created.',
    'video created',
    'video edited.',
    'video edited',
    'video extended.',
    'video extended',
];

function isImageAssistantPlaceholder(text) {
    const normalized = String(text ?? '').trim().toLowerCase();
    return IMAGE_ASSISTANT_PLACEHOLDERS.includes(normalized);
}

/**
 * Контекст для image API: пары user/assistant (assistant хранит scenePrompt — описание сцены).
 */
export function buildImageContextMessages(imageMessages) {
    return buildChatContextMessages(
        imageMessages.map((message) => {
            if (message.role !== 'assistant') {
                return { ...message, isTyping: false };
            }

            const scene = String(message.scenePrompt ?? message.content ?? '').trim();
            const content = scene && !isImageAssistantPlaceholder(scene)
                ? scene
                : IMAGE_ASSISTANT_FALLBACK;

            return { ...message, content, isTyping: false };
        }),
    );
}

export function buildChatContextMessages(chatMessages) {
    const turns = [];
    let pendingUser = null;

    chatMessages.forEach((message) => {
        if (message.role === 'user') {
            pendingUser = message.content;
            return;
        }

        if (message.role === 'assistant' && pendingUser !== null && !message.isTyping) {
            const userText = pendingUser.trim();
            const botText = message.content?.trim() ?? '';

            if (userText && botText) {
                turns.push({
                    userText: truncateContextContent(userText, 'user'),
                    botText: truncateContextContent(botText, 'assistant'),
                });
            }
            pendingUser = null;
        }
    });

    return turns
        .slice(-MAX_CHAT_CONTEXT_TURNS)
        .flatMap((turn) => [
            { role: 'user', content: turn.userText },
            { role: 'assistant', content: turn.botText },
        ]);
}

export function getChatTopicTitle(firstMessage, maxLength = 120) {
    const normalized = firstMessage.trim().replace(/\s+/g, ' ');

    if (!normalized) {
        return '';
    }

    if (normalized.length <= maxLength) {
        return normalized;
    }

    return `${normalized.slice(0, maxLength - 1)}…`;
}

function resolveSessionKey(item) {
    const sessionId = String(item.sessionId || item.session_id || '').trim();
    if (sessionId) {
        return sessionId;
    }
    return `legacy-${item.id}`;
}

/**
 * Группирует записи истории в темы по sessionId (один «Новый диалог» = одна карточка).
 */
export function groupHistoryIntoTopics(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return [];
    }

    const sorted = [...items].sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
    });

    const topics = [];

    sorted.forEach((item) => {
        const model = item.model || item.category || 'text';
        const sessionKey = resolveSessionKey(item);
        const createdAt = new Date(item.createdAt || 0).getTime();
        const last = topics[topics.length - 1];

        if (last && last.sessionId === sessionKey) {
            last.messageCount += 1;
            last.oldestAt = createdAt;
            last.latestAt = Math.max(last.latestAt, createdAt);
            last.lastItem = item;
            last.items.push(item);
            if (item.prompt) {
                last.topicTitle = item.prompt;
            }
        } else {
            topics.push({
                id: `topic-${sessionKey}`,
                sessionId: sessionKey,
                model,
                category: item.category || '',
                topicTitle: item.prompt || '',
                messageCount: 1,
                oldestAt: createdAt,
                latestAt: createdAt,
                lastItem: item,
                items: [item],
            });
        }
    });

    return topics;
}

/**
 * Восстанавливает переписку из темы истории (промты пользователя и ответы модели).
 */
export function isLikelyMediaUrl(text) {
    const value = String(text ?? '').trim().toLowerCase();
    return value.startsWith('http://') || value.startsWith('https://');
}

function historyTopicItems(topic) {
    const items = Array.isArray(topic?.items) ? topic.items : [];
    if (items.length === 0 && topic?.lastItem) {
        items.push(topic.lastItem);
    }
    return [...items].sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
    );
}

/**
 * Восстанавливает диалог image-сессии: URL ответа → imageUrl на assistant-сообщении.
 */
export function buildImageMessagesFromHistoryTopic(topic) {
    const messages = [];

    historyTopicItems(topic).forEach((item) => {
        const prompt = String(item.prompt || '').trim();
        const response = String(item.response || '').trim();

        if (prompt) {
            messages.push({
                id: `history-user-${item.id}`,
                role: 'user',
                content: prompt,
                isTyping: false,
            });
        }

        if (isLikelyMediaUrl(response)) {
            messages.push({
                id: `history-assistant-${item.id}`,
                role: 'assistant',
                content: IMAGE_ASSISTANT_FALLBACK,
                scenePrompt: prompt,
                imageUrl: response,
                isTyping: false,
            });
        } else if (response) {
            messages.push({
                id: `history-assistant-${item.id}`,
                role: 'assistant',
                content: response,
                scenePrompt: prompt,
                isTyping: false,
            });
        }
    });

    return messages;
}

/**
 * Восстанавливает диалог video-сессии: URL ответа → videoUrl на assistant-сообщении.
 */
export function buildVideoMessagesFromHistoryTopic(topic) {
    const messages = [];

    historyTopicItems(topic).forEach((item) => {
        const prompt = String(item.prompt || '').trim();
        const response = String(item.response || '').trim();

        if (prompt) {
            messages.push({
                id: `history-user-${item.id}`,
                role: 'user',
                content: prompt,
                isTyping: false,
            });
        }

        if (isLikelyMediaUrl(response)) {
            messages.push({
                id: `history-assistant-${item.id}`,
                role: 'assistant',
                content: IMAGE_ASSISTANT_FALLBACK,
                scenePrompt: prompt,
                videoUrl: response,
                isTyping: false,
            });
        } else if (response) {
            messages.push({
                id: `history-assistant-${item.id}`,
                role: 'assistant',
                content: response,
                scenePrompt: prompt,
                isTyping: false,
            });
        }
    });

    return messages;
}

export function getHistoryTopicMediaPreview(topic, { imageModelIds = [], videoModelIds = [] } = {}) {
    const items = historyTopicItems(topic);

    for (let i = items.length - 1; i >= 0; i -= 1) {
        const item = items[i];
        const response = String(item.response || '').trim();
        if (!isLikelyMediaUrl(response)) {
            continue;
        }

        const modelId = String(item.model || item.category || topic?.model || '').toLowerCase();
        if (imageModelIds.includes(modelId)) {
            return { kind: 'image', url: response };
        }
        if (videoModelIds.includes(modelId)) {
            return { kind: 'video', url: response };
        }
    }

    return null;
}

export function buildChatMessagesFromHistoryTopic(topic) {
    const items = Array.isArray(topic?.items) ? topic.items : [];
    if (items.length === 0 && topic?.lastItem) {
        items.push(topic.lastItem);
    }

    const messages = [];

    [...items]
        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
        .forEach((item) => {
            const prompt = String(item.prompt || '').trim();
            const response = String(item.response || '').trim();

            if (prompt) {
                messages.push({
                    id: `history-user-${item.id}`,
                    role: 'user',
                    content: prompt,
                    isTyping: false,
                });
            }

            if (response) {
                messages.push({
                    id: `history-assistant-${item.id}`,
                    role: 'assistant',
                    content: response,
                    isTyping: false,
                });
            }
        });

    return messages;
}
