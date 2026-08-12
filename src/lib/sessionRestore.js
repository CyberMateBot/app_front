import { createChatSessionId } from './chatSession.js';
import { getLastSessionImageUrl } from './imageModels.js';
import { getLastSessionSourceImageUrl, getLastSessionVideoUrl } from './videoModels.js';

export function sanitizeChatMessages(messages) {
    if (!Array.isArray(messages)) {
        return [];
    }

    return messages
        .filter((message) => !(message?.role === 'assistant' && message?.isPending))
        .map((message) => ({
            ...message,
            isTyping: false,
            isPending: false,
            typingProgress: undefined,
        }));
}

function pickImageUrl(memory, stored) {
    return String(memory?.generatedImageUrl || '').trim()
        || getLastSessionImageUrl(memory?.messages)
        || String(stored?.generatedImageUrl || '').trim()
        || getLastSessionImageUrl(stored?.messages)
        || '';
}

function pickImageUrls(memory, stored, imageUrl) {
    if (Array.isArray(memory?.generatedImageUrls) && memory.generatedImageUrls.length) {
        return memory.generatedImageUrls;
    }

    if (Array.isArray(stored?.generatedImageUrls) && stored.generatedImageUrls.length) {
        return stored.generatedImageUrls;
    }

    return imageUrl ? [imageUrl] : [];
}

export function resolveChatSessionState({ memory, stored }) {
    const memoryMessages = sanitizeChatMessages(memory?.messages);
    const storedMessages = sanitizeChatMessages(stored?.messages);

    if (memoryMessages.length > 0) {
        return {
            sessionId: memory?.sessionId || stored?.sessionId || createChatSessionId(),
            messages: memoryMessages,
            topicTitle: memory?.topicTitle || stored?.topicTitle || '',
            isGenerating: false,
        };
    }

    if (storedMessages.length > 0) {
        return {
            sessionId: stored?.sessionId || createChatSessionId(),
            messages: storedMessages,
            topicTitle: stored?.topicTitle || '',
            isGenerating: false,
        };
    }

    return null;
}

export function resolveImageSessionState({ memory, stored }) {
    const messages = memory?.messages?.length
        ? memory.messages
        : (stored?.messages ?? []);
    const generatedImageUrl = pickImageUrl(memory, stored);
    const generatedImageUrls = pickImageUrls(memory, stored, generatedImageUrl);
    const hasContent = messages.length > 0
        || Boolean(generatedImageUrl)
        || Boolean(memory?.isGenerating)
        || Boolean(stored?.isGenerating);

    if (!hasContent) {
        return null;
    }

    const isGenerating = generatedImageUrl
        ? false
        : Boolean(memory?.messages?.length ? memory.isGenerating : stored?.isGenerating);

    return {
        sessionId: memory?.sessionId || stored?.sessionId || createChatSessionId(),
        messages,
        generatedImageUrl,
        generatedImageUrls,
        isGenerating,
    };
}

export function resolveVideoSessionState({ memory, stored }) {
    const messages = memory?.messages?.length
        ? memory.messages
        : (stored?.messages ?? []);
    const generatedVideoUrl = String(memory?.generatedVideoUrl || '').trim()
        || getLastSessionVideoUrl(memory?.messages)
        || String(stored?.generatedVideoUrl || '').trim()
        || getLastSessionVideoUrl(stored?.messages)
        || '';
    const videoSourceImageUrl = String(memory?.videoSourceImageUrl || '').trim()
        || getLastSessionSourceImageUrl(memory?.messages)
        || String(stored?.videoSourceImageUrl || '').trim()
        || getLastSessionSourceImageUrl(stored?.messages)
        || '';
    const videoSourceVideoUrl = String(memory?.videoSourceVideoUrl || '').trim()
        || String(stored?.videoSourceVideoUrl || '').trim()
        || '';
    const videoPrompt = String(memory?.videoPrompt || '').trim()
        || String(stored?.videoPrompt || '').trim()
        || '';
    const hasContent = messages.length > 0
        || Boolean(generatedVideoUrl)
        || Boolean(videoPrompt)
        || Boolean(memory?.isGenerating)
        || Boolean(stored?.isGenerating);

    if (!hasContent) {
        return null;
    }

    const isGenerating = generatedVideoUrl
        ? false
        : Boolean(memory?.messages?.length ? memory.isGenerating : stored?.isGenerating);

    return {
        sessionId: memory?.sessionId || stored?.sessionId || createChatSessionId(),
        messages,
        generatedVideoUrl,
        videoSourceImageUrl,
        videoSourceVideoUrl,
        videoPrompt,
        isGenerating,
    };
}

export function resolveAudioSessionState({ memory, stored }) {
    const audioPrompt = String(memory?.audioPrompt || '').trim()
        || String(stored?.audioPrompt || '').trim()
        || '';
    const generatedAudioUrl = String(memory?.generatedAudioUrl || '').trim()
        || String(stored?.generatedAudioUrl || '').trim()
        || '';
    const hasContent = Boolean(audioPrompt)
        || Boolean(generatedAudioUrl)
        || Boolean(memory?.isGenerating)
        || Boolean(stored?.isGenerating);

    if (!hasContent) {
        return null;
    }

    const isGenerating = generatedAudioUrl
        ? false
        : Boolean(memory?.audioPrompt || memory?.generatedAudioUrl
            ? memory?.isGenerating
            : stored?.isGenerating);

    return {
        sessionId: memory?.sessionId || stored?.sessionId || createChatSessionId(),
        audioPrompt,
        generatedAudioUrl,
        isGenerating,
    };
}
