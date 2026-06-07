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
        path: '/v1/referrals/telegram/:telegramId',
        when: 'Профиль, Рефералы',
    },
    promptHistoryList: {
        method: 'GET',
        path: '/v1/prompts/history/telegram/:telegramId',
        when: 'Профиль, История',
    },
    promptHistorySave: {
        method: 'POST',
        path: '/v1/prompts/history',
        when: 'После ответа в AI-чате',
        body: '{ telegramId, prompt, category }',
    },
    generateText: {
        method: 'POST',
        path: '/v1/generate/text',
        when: 'Отправка сообщения в AI-чате',
        body: '{ telegramId, prompt, category: "text", model: "yandexgpt"|"deepseek"|"gemini-flash"|"openai", messages?: [{ role, content }] }',
    },
    generateImage: {
        method: 'POST',
        path: '/v1/generate/image',
        when: 'Генерация изображения (Nano Banana)',
        body: '{ telegramId, prompt, category: "image", model: "nano-banana"|"nano-banana-pro"|"nano-banana-2"|"gpt-image-2"|"gpt-image-1.5"|"flux-dev"|"alice-ai-art", sourceImageUrl?: string, aspect_ratio?: string, resolution?: string, quality?: string, output_format?: string, messages?: [{ role, content }] }',
    },
    generateVideo: {
        method: 'POST',
        path: '/v1/generate/video',
        when: 'Генерация видео (WaveSpeed / Kling)',
        body: '{ telegramId, prompt, category: "video", model: "kling-v3-std"|"kling-v3-pro", aspect_ratio?: "16:9"|"9:16"|"1:1", duration?: 5|10, messages?: [{ role, content }] }',
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
    generateVoice: {
        method: 'POST',
        path: '/v1/generate/voice',
        when: 'Озвучка / клон голоса',
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
        path: '/v1/subscriptions/plans',
        when: 'Карточки тарифов Free/Pro/Ultra',
    },
};
