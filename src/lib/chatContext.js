export const MAX_CHAT_CONTEXT_TURNS = 20;

/**
 * Собирает messages для API из локального чата (только завершённые пары user/assistant).
 * Текущий ввод передаётся отдельно в prompt.
 */
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
                turns.push({ userText, botText });
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

const TOPIC_GAP_MS = 2 * 60 * 60 * 1000;

/**
 * Группирует записи истории в темы (сессии с одной моделью в пределах окна по времени).
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
        const createdAt = new Date(item.createdAt || 0).getTime();
        const last = topics[topics.length - 1];

        if (
            last
            && last.model === model
            && last.oldestAt - createdAt <= TOPIC_GAP_MS
        ) {
            last.messageCount += 1;
            last.oldestAt = createdAt;
            last.topicTitle = item.prompt || last.topicTitle;
            last.latestAt = Math.max(last.latestAt, createdAt);
            last.lastItem = item;
        } else {
            topics.push({
                id: `topic-${item.id}`,
                model,
                topicTitle: item.prompt || '',
                messageCount: 1,
                oldestAt: createdAt,
                latestAt: createdAt,
                lastItem: item,
            });
        }
    });

    return topics;
}
