/**
 * Справочник HTTP-ручек, которые использует фронтенд.
 * При добавлении нового fetch — обновляйте этот файл и docs/API.md
 */
export const API_ENDPOINTS = {
    register: {
        method: 'POST',
        path: '/v1/register',
        when: 'Старт приложения (bootstrap)',
        body: '{ initDataRaw: base64, start_param?: string }',
    },
    profile: {
        method: 'GET',
        path: '/v1/users/telegram/:telegramId',
        when: 'Старт приложения',
    },
    referralLink: {
        method: 'GET',
        path: '/v1/users/telegram/:telegramId/referral-link',
        when: 'Страница реферальной программы',
    },
    wallet: {
        method: 'GET',
        path: '/v1/wallet/telegram/:telegramId',
        when: 'Профиль, Кошелёк',
    },
    referrals: {
        method: 'GET',
        path: '/v1/users/telegram/:telegramId/referrals',
        when: 'Профиль, Рефералы — список приглашённых',
    },
    promptHistoryList: {
        method: 'GET',
        path: '/v1/prompts/history/telegram/:telegramId',
        when: 'Профиль, История',
        headers: 'X-Telegram-Init-Data: <initData>',
    },
    promptHistorySave: {
        method: 'POST',
        path: '/v1/prompts/history',
        when: 'После ответа в AI-чате',
        body: '{ telegramId, initDataRaw: base64, prompt, category }',
    },
    generateText: {
        method: 'POST',
        path: '/v1/generate/text',
        when: 'Отправка сообщения в AI-чате',
        body: '{ telegramId, initDataRaw: base64, prompt, category: "text", model: "yandexgpt"|"deepseek-v4-flash"|"gemini-2.5-flash"|..., messages?: [{ role, content }] }',
    },
    generateImage: {
        method: 'POST',
        path: '/v1/generate/image',
        when: 'Генерация изображения (Nano Banana)',
        body: '{ telegramId, initDataRaw: base64, prompt, category: "image", model: "nano-banana"|..., sourceImageUrl?: string, imageBase64?: string, imageMimeType?: string, aspect_ratio?, resolution?, quality?, output_format?, messages?: [{ role, content }] }',
    },
    generateVideo: {
        method: 'POST',
        path: '/v1/generate/video',
        when: 'Генерация видео (WaveSpeed / Kling)',
        body: '{ telegramId, initDataRaw: base64, prompt, category: "video", model: "kling-v3-std"|"kling-v3-pro"|"seedance-*", aspect_ratio?, duration?: 3-15, negative_prompt?, sound?, camera_control?: { type, config? }, resolution?: "720p"|"1080p", sourceImageUrl?, sourceVideoUrl?, generate_audio?, camera_fixed?, messages?: [{ role, content }] }',
    },
    generateAudio: {
        method: 'POST',
        path: '/v1/generate/audio',
        when: 'Озвучка текста и клонирование голоса (Qwen3 TTS)',
        body: '{ telegramId, initDataRaw: base64, prompt, category: "audio", model: "qwen3-tts", language?, voice?, style_instruction?, reference_text?, audioBase64?, audioMimeType?, sourceAudioUrl?, speed?, emotion?, duration?, number_of_songs?, output_format?, tags?, sessionId? }',
    },
};

/** Ручки, которых пока нет на фронте, но они понадобятся для каталога */
export const API_ENDPOINTS_PLANNED = {
    modelsList: {
        method: 'GET',
        path: '/v1/models',
        when: 'Каталог — список доступных моделей с бэкенда',
    },
    generateMusic: {
        method: 'POST',
        path: '/v1/generate/music',
        when: 'Генерация музыки',
    },
    chatCompletions: {
        method: 'POST',
        path: '/v1/chat/completions',
        when: 'Полноценный диалог с историей сообщений (опционально)',
    },
    walletTopUp: {
        method: 'POST',
        path: '/v1/wallet/top-up',
        when: 'Кнопка «Пополнить» в профиле',
    },
    subscriptionPlans: {
        method: 'GET',
        path: '/v1/billing/catalog',
        when: 'Экран подписки — планы и пакеты монет',
    },
};
