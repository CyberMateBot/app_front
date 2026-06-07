import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowLeft,
    Bell,
    Bot,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Copy,
    Clock3,
    CreditCard,
    Crown,
    FileText,
    History,
    House,
    Languages,
    Lock,
    Image as ImageIcon,
    LayoutGrid,
    Menu,
    MessageSquare,
    Mic,
    Moon,
    MoreHorizontal,
    Music2,
    Paperclip,
    Plus,
    Search,
    Settings,
    SlidersHorizontal,
    Send,
    Square,
    Trash2,
    Download,
    SunMedium,
    User,
    Users,
    Video,
    Wallet,
    Zap,
} from 'lucide-react';
import {
    getMyProfile,
    getMyPromptHistory,
    clearMyPromptHistory,
    getMyReferralLink,
    getMyReferrals,
    getMyWallet,
    normalizeProfileResponse,
    fetchTextModels,
    generateImage,
    generateText,
    generateVideo,
    patchUserTheme,
    registerTelegramUser,
    savePromptHistory,
    LEGACY_TEXT_MODEL_IDS,
    IMAGE_MODEL_IDS,
} from './api/telegramApi.js';
import {
    buildChatContextMessages,
    buildChatMessagesFromHistoryTopic,
    buildImageContextMessages,
    getChatTopicTitle,
    groupHistoryIntoTopics,
} from './lib/chatContext.js';
import { createChatSessionId } from './lib/chatSession.js';
import { openSupport, resolveSupportUrl } from './lib/openSupport.js';
import {
    applyTheme,
    bindSystemThemeChanged,
    bindTelegramThemeChanged,
    extractProfileTheme,
    getStoredTheme,
    getSystemTheme,
    normalizeTheme,
    resolveBootstrapTheme,
} from './lib/theme.js';
import AppNotice from './Components/AppNotice.jsx';
import ChatMessageBubble from './Components/ChatMessageBubble.jsx';
import {
    IMAGE_MODEL_DEFINITIONS,
    getImageModelDefinition,
} from './config/aiModels.js';
import {
    VIDEO_MODEL_DEFINITIONS,
    getVideoModelDefinition,
} from './config/videoModels.js';
import {
    buildCatalogTextTools,
    buildTextModelSelectorItems,
    DEFAULT_TEXT_MODELS,
    resolveEffectiveTextModels,
    findTextModel,
    getCatalogModelDescription,
    getModelLabel,
    getModelDisplayTier,
    getSelectorItemForModelId,
    getStoredTextModelId,
    getTextModelVisual,
    getTierLabelForModel,
    isKnownTextModelId,
    resolveTextModelId,
    setStoredTextModelId,
    shouldShowCatalogBadge,
    textModelSupportsImage,
} from './lib/textModels.js';
import './App.css';
import { formatUserFacingError } from './api/apiError.js';
import { APP_NAME, ENABLE_TELEGRAM_MOCK } from './config/env.js';
import { deriveSubscriptionView } from './lib/subscriptionView.js';
import {
    getTelegramWebApp,
    hydrateTelegramUser,
    initTelegramMiniAppAsync,
    showTelegramAlert,
} from './lib/telegramWebApp.js';

const navigationItems = [
    { key: 'home', labelKey: 'navHome', icon: House },
    { key: 'catalog', labelKey: 'navCatalog', icon: LayoutGrid },
    { key: 'history', labelKey: 'navHistory', icon: History },
    { key: 'profile', labelKey: 'navProfile', icon: User },
];

const catalogTabs = [
    { id: 'all', labelKey: 'catalogTabAll' },
    { id: 'chat', labelKey: 'catalogTabChat' },
    { id: 'photo', labelKey: 'catalogTabPhoto' },
    { id: 'code', labelKey: 'catalogTabCode' },
];

const homeCategoryChips = [
    { id: 'all', labelKey: 'chipAll', icon: LayoutGrid },
    { id: 'chats', labelKey: 'chipChats', icon: MessageSquare },
    { id: 'images', labelKey: 'chipImages', icon: ImageIcon },
    { id: 'video', labelKey: 'chipVideo', icon: Video },
    { id: 'music', labelKey: 'chipMusic', icon: Music2 },
    { id: 'voice', labelKey: 'chipVoice', icon: Mic },
];

const homeToolCards = [
    { id: 'chat', categories: ['chats'], titleKey: 'toolChatTitle', subKey: 'toolChatSub', icon: Bot, accent: 'c1', badge: 'new' },
    { id: 'images', categories: ['images'], titleKey: 'toolImagesTitle', subKey: 'toolImagesSub', icon: ImageIcon, accent: 'c2', badge: 'hot' },
    { id: 'video', categories: ['video'], titleKey: 'toolVideoTitle', subKey: 'toolVideoSub', icon: Video, accent: 'c3' },
    { id: 'music', categories: ['music'], titleKey: 'toolMusicTitle', subKey: 'toolMusicSub', icon: Music2, accent: 'c4' },
    { id: 'voice', categories: ['voice'], titleKey: 'toolVoiceTitle', subKey: 'toolVoiceSub', icon: Mic, accent: 'c5' },
    { id: 'text', categories: ['chats'], titleKey: 'toolTextTitle', subKey: 'toolTextSub', icon: FileText, accent: 'c6', page: 'ai-chat' },
];

const historyFilterTabs = [
    { id: 'all', labelKey: 'historyFilterAll' },
    { id: 'photo', labelKey: 'historyFilterPhoto' },
    { id: 'chat', labelKey: 'historyFilterChat' },
    { id: 'video', labelKey: 'historyFilterVideo' },
    { id: 'music', labelKey: 'historyFilterMusic' },
];

const subscriptionPlanDefs = [
    { id: 'free', nameKey: 'planFreeName', badgeKey: 'planFreeBadge', badgeClass: 'free', priceKey: 'planFreePrice', priceSubKey: 'planFreePriceSub' },
    { id: 'pro', nameKey: 'planProName', badgeKey: 'planProBadge', badgeClass: 'popular', priceKey: 'planProPrice', priceSubKey: 'planProPriceSub', popular: true },
    { id: 'ultra', nameKey: 'planUltraName', badgeKey: 'planUltraBadge', badgeClass: 'biz', priceKey: 'planUltraPrice', priceSubKey: 'planUltraPriceSub' },
];

function formatTemplate(template, values) {
    return Object.entries(values).reduce(
        (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
        template,
    );
}

function formatNumber(value) {
    const numeric = Number(value);

    if (Number.isNaN(numeric)) {
        return String(value);
    }

    return new Intl.NumberFormat('ru-RU').format(numeric);
}

const translations = {
    ru: {
        updates: 'Обновления',
        releaseBadge: 'Релиз 0.1',
        homeDescription: 'CyberMate — все нейросети в одном месте, под твоим контролем.',
        promptHistory: 'История Промтов',
        homeGreeting: 'Привет, {name} 👋',
        homeGreetingSub: 'Что будем создавать сегодня?',
        homeSearchPlaceholder: 'Поиск инструментов...',
        homeCategoriesLabel: 'Категории',
        homeToolsLabel: 'Инструменты',
        chipAll: 'Все',
        chipChats: 'Чаты',
        chipImages: 'Изображения',
        chipVideo: 'Видео',
        chipMusic: 'Музыка',
        chipVoice: 'Голос',
        promoTitle: 'Генерация видео',
        promoSub: 'Создай ролик из текста за 60 сек',
        promoButton: 'Попробовать',
        badgeNew: 'NEW',
        badgeHot: 'HOT',
        badgePro: 'PRO',
        badgeFree: 'FREE',
        toolChatTitle: 'AI Чат',
        toolChatSub: 'YandexGPT, DeepSeek, GPT OSS, Qwen',
        toolImagesTitle: 'Генерация фото',
        toolImagesSub: 'Nano Banana, Alice AI ART',
        toolVideoTitle: 'Видео',
        toolVideoSub: 'Runway, Kling AI',
        toolMusicTitle: 'Музыка',
        toolMusicSub: 'Suno, Udio',
        toolVoiceTitle: 'Озвучка',
        toolVoiceSub: 'ElevenLabs, TTS',
        toolTextTitle: 'Текст & Код',
        toolTextSub: 'Рерайт, суммари',
        navHome: 'Главная',
        navCatalog: 'Каталог',
        navHistory: 'История',
        navProfile: 'Профиль',
        catalogTitle: 'Каталог',
        catalogSearchPlaceholder: 'Найти инструмент...',
        catalogTabAll: 'Все',
        catalogTabChat: 'Чат',
        catalogTabPhoto: 'Фото',
        catalogTabCode: 'Код',
        catalogSectionChat: 'Чат и текст',
        catalogSectionPhoto: 'Генерация изображений',
        catalogEmptyCategory: 'В этой категории пока нет моделей.',
        modelYandexName: 'YandexGPT',
        modelYandexSub: 'Текст и диалог на русском',
        modelGeminiName: 'Gemini Flash',
        modelGeminiSub: 'Быстрые ответы Google AI',
        modelOpenAiName: 'OpenAI',
        modelOpenAiSub: 'Универсальный чат и код',
        modelDeepSeekName: 'DeepSeek',
        modelDeepSeekSub: 'Мощная модель для текста и кода',
        modelNanoBananaName: 'Nano Banana',
        modelNanoBananaSub: 'Быстрые иллюстрации и картинки по тексту',
        modelFluxDevName: 'FLUX Dev',
        modelFluxDevSub: 'Качественные изображения через WaveSpeed',
        modelAliceAIArtName: 'Alice AI ART',
        modelAliceAIArtSub: 'Художественные изображения и иллюстрации от Yandex ART',
        modelKlingStdName: 'Kling 3.0 Standard',
        modelKlingStdSub: 'Быстрая генерация видео по тексту',
        modelKlingProName: 'Kling 3.0 Pro',
        modelKlingProSub: 'Высокое качество видео через WaveSpeed',
        imageGenerateTitle: 'Генерация фото',
        imagePromptLabel: 'Описание',
        imagePromptPlaceholder: 'Опишите изображение, которое нужно создать...',
        imageGenerateButton: 'Сгенерировать',
        imageGenerating: 'Генерация...',
        imageResultTitle: 'Результат',
        imageGenerateEmpty: 'Изображение не получено. Попробуйте другой промт.',
        imageGeneratedNote: 'Изображение создано.',
        imageContentPolicy: 'Модель отклонила запрос. Попробуйте другую формулировку без запрещённых тем.',
        videoGenerateTitle: 'Генерация видео',
        videoPromptLabel: 'Описание',
        videoPromptPlaceholder: 'Опишите сцену, которую нужно создать...',
        videoGenerateButton: 'Сгенерировать',
        videoGenerating: 'Генерация видео...',
        videoResultTitle: 'Результат',
        videoGenerateEmpty: 'Видео не получено. Попробуйте другой промт.',
        videoGeneratedNote: 'Видео создано.',
        catalogSectionVideo: 'Генерация видео',
        chatTitle: 'AI Чат',
        chatEmpty: 'Напишите сообщение — модель ответит здесь.',
        chatPlaceholder: 'Сообщение...',
        chatSend: 'Отправить',
        chatStop: 'Остановить',
        chatAttachPhoto: 'Прикрепить фото',
        chatRemovePhoto: 'Убрать фото',
        chatImageNeedsWavespeedKey: 'Для фото нужен WAVESPEED_API_KEY на сервере.',
        chatNewDialog: 'Новый диалог',
        chatGenerating: 'Generating',
        historyDeleteConfirm: 'Удалить всю историю промтов? Это действие нельзя отменить.',
        historyDeleteConfirmAction: 'Удалить',
        historyDeleteCancel: 'Отмена',
        historyCleared: 'История очищена.',
        historyTitle: 'История',
        historyToday: 'Сегодня',
        historyYesterday: 'Вчера',
        historyFilterAll: 'Все',
        historyFilterPhoto: 'Фото',
        historyFilterChat: 'Чат',
        historyFilterVideo: 'Видео',
        historyFilterMusic: 'Музыка',
        historyEmpty: 'История промтов пока пуста.',
        historyTopicMessages: '{count} сообщ.',
        promptPlaceholder: 'Введите промт, который хотите сохранить',
        promptCategoryPlaceholder: 'Категория (например, marketing)',
        savePromptButton: 'Сохранить промт',
        promptSaved: 'Промт сохранён в историю.',
        promptEmpty: 'Введите текст промта перед сохранением.',
        settingsTitle: 'Настройки',
        settingsLanguageSection: 'Язык',
        settingsAppearanceSection: 'Оформление',
        settingsLanguageRu: 'Русский',
        settingsLanguageEn: 'English',
        settingsSupportSub: 'Написать в Telegram',
        balanceTitle: 'Баланс',
        subscriptionTitle: 'Подписка',
        referralProgramTitle: 'Реферальная программа',
        referralIntro: 'Приглашайте друзей в CyberMate и получайте CyberCoins за каждого активного пользователя.',
        referralStatFriends: 'Друзей',
        referralStatEarned: 'Заработано',
        referralHowTitle: 'Как это работает',
        referralHowStep1: 'Поделитесь ссылкой',
        referralHowStep2: 'Друг регистрируется',
        referralHowStep3: 'Вы получаете бонус',
        referralLinkTitle: 'Ваша ссылка',
        referralCopyButton: 'Копировать',
        referralCopied: 'Ссылка скопирована',
        referralEmpty: 'Пока нет активных рефералов.',
        activeReferralsTitle: 'Активные рефералы',
        walletPageTitle: 'Подписка',
        walletCurrentPlan: 'Текущий план',
        walletBalanceTotal: 'Баланс',
        walletBalanceAvailable: 'Доступно',
        walletBalanceEarned: 'Всего заработано',
        walletTransactionsTitle: 'Транзакции',
        walletTransactionsEmpty: 'Транзакций пока нет.',
        planSelectButton: 'Выбрать план',
        planCurrentButton: 'Текущий план',
        languageLabel: 'Language:',
        themeLabel: 'Theme:',
        supportLabel: 'Support',
        languageNames: {
            ru: 'Russian',
            en: 'English',
        },
        themeNames: {
            dark: 'Dark',
            light: 'Light',
        },
        walletTitle: 'Управление подпиской',
        walletDescription: 'Раздел кошелька подготовлен в новом стиле и готов для следующего шага интеграции.',
        referralsTitle: 'Партнёрская программа',
        referralsDescription: 'Приглашайте друзей и отслеживайте бонусы в одном аккуратном разделе.',
        statusLabel: 'Статус',
        versionLabel: 'Версия',
        syncing: 'Синхронизация...',
        ready: 'Готово к подключению',
        releaseVersion: 'Релиз 0.1',
        startParam: 'Start param',
        loading: 'Загрузка...',
        waiting: 'Ожидание данных',
        profileStatus: 'status:',
        profileSince: 'since:',
        profileLeft: 'left:',
        back: 'Назад',
        profileTitle: 'Профиль',
        profileAppUserId: 'ID',
        profilePlanBadge: '{plan} подписка',
        profileStatRequests: 'Запросов',
        profileStatProjects: 'Проектов',
        profileStatReferrals: 'Рефералов',
        profileStatCoins: 'CyberCoins',
        profileBalanceLabel: 'Баланс CyberCoins',
        profileTopUp: 'Пополнить',
        profileUsageLabel: 'Использовано в этом месяце',
        profileAccountSection: 'Аккаунт',
        profileSettingsSection: 'Настройки',
        profileMenuSubscription: 'Моя подписка',
        profileMenuSubscriptionSub: '{plan} · до {date}',
        profileSubscriptionNoExpiry: 'без срока',
        profilePlanBadgeFree: 'Бесплатный план',
        profileMenuHistory: 'История запросов',
        profileMenuHistorySub: '{count} генераций',
        profileMenuReferrals: 'Рефералы',
        profileMenuReferralsSub: '{count} друга · +{bonus} монет',
        profileReferralBonusTag: '+бонус',
        profileMenuLanguage: 'Язык',
        profileMenuDarkTheme: 'Тёмная тема',
        profilePlansTitle: 'Планы подписки',
        profilePlansSub: '3 уровня · внутренняя валюта CyberCoins',
        planFreeName: 'Free',
        planFreeBadge: 'Бесплатно',
        planFreePrice: '0 ₽',
        planFreePriceSub: 'навсегда',
        planProName: 'Pro',
        planProBadge: 'Популярный',
        planProPrice: '299 ₽',
        planProPriceSub: '/ месяц',
        planUltraName: 'Ultra',
        planUltraBadge: 'Для бизнеса',
        planUltraPrice: '799 ₽',
        planUltraPriceSub: '/ месяц',
        planFreeFeatures: [
            '50 запросов / месяц',
            'AI Чат (GPT-3.5)',
            '5 фото генераций',
        ],
        planFreeLocked: [
            'Видео, музыка — нет',
            'Приоритет — нет',
        ],
        planProFeatures: [
            '1000 запросов / месяц',
            'GPT-4o, Claude, Gemini',
            '100 фото (HD)',
            '20 видео генераций',
            'Музыка + озвучка',
            '+500 CyberCoins/мес',
        ],
        planUltraFeatures: [
            'Безлимит запросов',
            'Все модели + GPT-o1',
            '500 фото (4K)',
            '100 видео (Runway, Kling)',
            'API доступ',
            '+2000 CyberCoins/мес',
            'Приоритетная очередь',
        ],
        textGenerateTitle: 'Генерация текста',
        textModelLabel: 'Нейросеть',
        tierLite: 'Lite',
        tierPro: 'Pro',
        textPromptLabel: 'Промт',
        textPromptPlaceholder: 'Опишите, какой текст нужно сгенерировать...',
        textGenerateButton: 'Сгенерировать',
        textGenerating: 'Генерация...',
        textResultTitle: 'Результат',
        textPromptEmpty: 'Введите промт перед генерацией.',
        textGenerateEmpty: 'Модель не вернула текст. Попробуйте изменить промт.',
    },
    en: {
        updates: 'Updates',
        releaseBadge: 'Release 0.1',
        homeDescription: 'CyberMate — all AI tools in one place, under your control.',
        promptHistory: 'Prompt History',
        homeGreeting: 'Hi, {name} 👋',
        homeGreetingSub: 'What shall we create today?',
        homeSearchPlaceholder: 'Search tools...',
        homeCategoriesLabel: 'Categories',
        homeToolsLabel: 'Tools',
        chipAll: 'All',
        chipChats: 'Chats',
        chipImages: 'Images',
        chipVideo: 'Video',
        chipMusic: 'Music',
        chipVoice: 'Voice',
        promoTitle: 'Video generation',
        promoSub: 'Create a clip from text in 60 sec',
        promoButton: 'Try it',
        badgeNew: 'NEW',
        badgeHot: 'HOT',
        badgePro: 'PRO',
        badgeFree: 'FREE',
        toolChatTitle: 'AI Chat',
        toolChatSub: 'YandexGPT, DeepSeek, GPT OSS, Qwen',
        toolImagesTitle: 'Image generation',
        toolImagesSub: 'Nano Banana, Alice AI ART',
        toolVideoTitle: 'Video',
        toolVideoSub: 'Runway, Kling AI',
        toolMusicTitle: 'Music',
        toolMusicSub: 'Suno, Udio',
        toolVoiceTitle: 'Voiceover',
        toolVoiceSub: 'ElevenLabs, TTS',
        toolTextTitle: 'Text & Code',
        toolTextSub: 'Rewrite, summary',
        navHome: 'Home',
        navCatalog: 'Catalog',
        navHistory: 'History',
        navProfile: 'Profile',
        catalogTitle: 'Catalog',
        catalogSearchPlaceholder: 'Find a tool...',
        catalogTabAll: 'All',
        catalogTabChat: 'Chat',
        catalogTabPhoto: 'Photo',
        catalogTabCode: 'Code',
        catalogSectionChat: 'Chat & text',
        catalogSectionPhoto: 'Image generation',
        catalogEmptyCategory: 'No models in this category yet.',
        modelYandexName: 'YandexGPT',
        modelYandexSub: 'Russian text and dialogue',
        modelGeminiName: 'Gemini Flash',
        modelGeminiSub: 'Fast responses from Google AI',
        modelOpenAiName: 'OpenAI',
        modelOpenAiSub: 'General chat and code',
        modelDeepSeekName: 'DeepSeek',
        modelDeepSeekSub: 'Strong model for text and code',
        modelNanoBananaName: 'Nano Banana',
        modelNanoBananaSub: 'Quick illustrations and images from a text prompt',
        modelFluxDevName: 'FLUX Dev',
        modelFluxDevSub: 'High-quality images via WaveSpeed',
        modelAliceAIArtName: 'Alice AI ART',
        modelAliceAIArtSub: 'Artistic images and illustrations via Yandex ART',
        modelKlingStdName: 'Kling 3.0 Standard',
        modelKlingStdSub: 'Fast text-to-video generation',
        modelKlingProName: 'Kling 3.0 Pro',
        modelKlingProSub: 'High-quality video via WaveSpeed',
        imageGenerateTitle: 'Image generation',
        imagePromptLabel: 'Description',
        imagePromptPlaceholder: 'Describe the image you want to create...',
        imageGenerateButton: 'Generate',
        imageGenerating: 'Generating...',
        imageResultTitle: 'Result',
        imageGenerateEmpty: 'No image returned. Try a different prompt.',
        imageGeneratedNote: 'Image created.',
        imageContentPolicy: 'The model rejected this prompt. Try a different wording.',
        videoGenerateTitle: 'Video generation',
        videoPromptLabel: 'Description',
        videoPromptPlaceholder: 'Describe the scene you want to create...',
        videoGenerateButton: 'Generate',
        videoGenerating: 'Generating video...',
        videoResultTitle: 'Result',
        videoGenerateEmpty: 'No video returned. Try a different prompt.',
        videoGeneratedNote: 'Video created.',
        catalogSectionVideo: 'Video generation',
        chatTitle: 'AI Chat',
        chatEmpty: 'Send a message — the model will reply here.',
        chatPlaceholder: 'Message...',
        chatSend: 'Send',
        chatStop: 'Stop',
        chatAttachPhoto: 'Attach photo',
        chatRemovePhoto: 'Remove photo',
        chatImageNeedsWavespeedKey: 'Image uploads require WAVESPEED_API_KEY on the server.',
        chatNewDialog: 'New chat',
        chatGenerating: 'Generating',
        historyDeleteConfirm: 'Delete all prompt history? This cannot be undone.',
        historyDeleteConfirmAction: 'Delete',
        historyDeleteCancel: 'Cancel',
        historyCleared: 'History cleared.',
        historyTitle: 'History',
        historyToday: 'Today',
        historyYesterday: 'Yesterday',
        historyFilterAll: 'All',
        historyFilterPhoto: 'Photo',
        historyFilterChat: 'Chat',
        historyFilterVideo: 'Video',
        historyFilterMusic: 'Music',
        historyEmpty: 'Prompt history is empty.',
        historyTopicMessages: '{count} messages',
        promptPlaceholder: 'Enter a prompt to save',
        promptCategoryPlaceholder: 'Category (for example, marketing)',
        savePromptButton: 'Save prompt',
        promptSaved: 'Prompt saved to history.',
        promptEmpty: 'Enter a prompt before saving.',
        settingsTitle: 'Settings',
        settingsLanguageSection: 'Language',
        settingsAppearanceSection: 'Appearance',
        settingsLanguageRu: 'Русский',
        settingsLanguageEn: 'English',
        settingsSupportSub: 'Message on Telegram',
        balanceTitle: 'Balance',
        subscriptionTitle: 'Subscription',
        referralProgramTitle: 'Referral program',
        referralIntro: 'Invite friends to CyberMate and earn CyberCoins for every active user.',
        referralStatFriends: 'Friends',
        referralStatEarned: 'Earned',
        referralHowTitle: 'How it works',
        referralHowStep1: 'Share your link',
        referralHowStep2: 'Friend signs up',
        referralHowStep3: 'You get a bonus',
        referralLinkTitle: 'Your link',
        referralCopyButton: 'Copy',
        referralCopied: 'Link copied',
        referralEmpty: 'No active referrals yet.',
        activeReferralsTitle: 'Active referrals',
        walletPageTitle: 'Subscription',
        walletCurrentPlan: 'Current plan',
        walletBalanceTotal: 'Balance',
        walletBalanceAvailable: 'Available',
        walletBalanceEarned: 'Total earned',
        walletTransactionsTitle: 'Transactions',
        walletTransactionsEmpty: 'No transactions yet.',
        planSelectButton: 'Choose plan',
        planCurrentButton: 'Current plan',
        languageLabel: 'Language:',
        themeLabel: 'Theme:',
        supportLabel: 'Support',
        languageNames: {
            ru: 'Russian',
            en: 'English',
        },
        themeNames: {
            dark: 'Dark',
            light: 'Light',
        },
        walletTitle: 'Subscription management',
        walletDescription: 'The wallet section is styled and ready for the next integration step.',
        referralsTitle: 'Referral program',
        referralsDescription: 'Invite friends and track bonuses in one clean section.',
        statusLabel: 'Status',
        versionLabel: 'Version',
        syncing: 'Syncing...',
        ready: 'Ready to connect',
        releaseVersion: 'Release 0.1',
        startParam: 'Start param',
        loading: 'Loading...',
        waiting: 'Waiting for data',
        profileStatus: 'status:',
        profileSince: 'since:',
        profileLeft: 'left:',
        back: 'Back',
        profileTitle: 'Profile',
        profileAppUserId: 'ID',
        profilePlanBadge: '{plan} plan',
        profileStatRequests: 'Requests',
        profileStatProjects: 'Projects',
        profileStatReferrals: 'Referrals',
        profileStatCoins: 'CyberCoins',
        profileBalanceLabel: 'CyberCoins balance',
        profileTopUp: 'Top up',
        profileUsageLabel: 'Used this month',
        profileAccountSection: 'Account',
        profileSettingsSection: 'Settings',
        profileMenuSubscription: 'My subscription',
        profileMenuSubscriptionSub: '{plan} · until {date}',
        profileSubscriptionNoExpiry: 'no expiry',
        profilePlanBadgeFree: 'Free plan',
        profileMenuHistory: 'Request history',
        profileMenuHistorySub: '{count} generations',
        profileMenuReferrals: 'Referrals',
        profileMenuReferralsSub: '{count} friends · +{bonus} coins',
        profileReferralBonusTag: '+bonus',
        profileMenuLanguage: 'Language',
        profileMenuDarkTheme: 'Dark theme',
        profilePlansTitle: 'Subscription plans',
        profilePlansSub: '3 tiers · CyberCoins internal currency',
        planFreeName: 'Free',
        planFreeBadge: 'Free',
        planFreePrice: '0 ₽',
        planFreePriceSub: 'forever',
        planProName: 'Pro',
        planProBadge: 'Popular',
        planProPrice: '299 ₽',
        planProPriceSub: '/ month',
        planUltraName: 'Ultra',
        planUltraBadge: 'For business',
        planUltraPrice: '799 ₽',
        planUltraPriceSub: '/ month',
        planFreeFeatures: [
            '50 requests / month',
            'AI Chat (GPT-3.5)',
            '5 image generations',
        ],
        planFreeLocked: [
            'Video, music — unavailable',
            'Priority — unavailable',
        ],
        planProFeatures: [
            '1000 requests / month',
            'GPT-4o, Claude, Gemini',
            '100 images (HD)',
            '20 video generations',
            'Music + voiceover',
            '+500 CyberCoins/mo',
        ],
        planUltraFeatures: [
            'Unlimited requests',
            'All models + GPT-o1',
            '500 images (4K)',
            '100 videos (Runway, Kling)',
            'API access',
            '+2000 CyberCoins/mo',
            'Priority queue',
        ],
        textGenerateTitle: 'Text generation',
        textModelLabel: 'Model',
        tierLite: 'Lite',
        tierPro: 'Pro',
        textPromptLabel: 'Prompt',
        textPromptPlaceholder: 'Describe the text you want to generate...',
        textGenerateButton: 'Generate',
        textGenerating: 'Generating...',
        textResultTitle: 'Result',
        textPromptEmpty: 'Enter a prompt before generating.',
        textGenerateEmpty: 'The model returned no text. Try changing the prompt.',
    },
};

function buildProfileView(profile, telegramUser) {
    const tgFirst = (telegramUser?.first_name || '').trim();
    const tgLast = (telegramUser?.last_name || '').trim();
    const tgNick = [tgFirst, tgLast].filter(Boolean).join(' ').trim();

    const rawUsername = (profile?.username || telegramUser?.username || '')
        .trim()
        .replace(/^@/, '');
    const profileName = (profile?.name || '').trim();

    let displayName = tgNick || profileName || 'Telegram User';
    if (rawUsername && displayName.toLowerCase() === rawUsername.toLowerCase()) {
        displayName = tgFirst || profileName || displayName;
    }

    const handle = rawUsername && rawUsername !== 'username_not_set' ? `@${rawUsername}` : '';
    const appUserId = profile?.backendId || (profile?.id != null ? String(profile.id) : '');
    const balance = String(profile?.balance ?? profile?.coins ?? profile?.points ?? 0);
    const tokens = String(profile?.tokens ?? profile?.tokenBalance ?? profile?.points ?? balance);

    return {
        displayName,
        username: rawUsername || '',
        handle,
        appUserId: appUserId || '—',
        telegramId: profile?.telegramId || (telegramUser?.id ? String(telegramUser.id) : '—'),
        backendId: profile?.backendId || (profile?.id != null ? String(profile.id) : '—'),
        language: profile?.language || telegramUser?.language_code || 'ru',
        avatarUrl: profile?.avatarUrl || telegramUser?.photo_url || '',
        balance,
        tokens,
    };
}

function getInitialTheme() {
    if (typeof document !== 'undefined') {
        const fromDom = normalizeTheme(document.documentElement.dataset.theme);

        if (fromDom) {
            return fromDom;
        }
    }

    return getStoredTheme() ?? getSystemTheme() ?? 'light';
}

function getInitialLanguage() {
    if (typeof window === 'undefined') {
        return 'ru';
    }

    const storedLanguage = window.localStorage.getItem('cybermate-language');

    if (storedLanguage === 'ru' || storedLanguage === 'en') {
        return storedLanguage;
    }

    return window.navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function getInitialTextModelId() {
    return getStoredTextModelId() ?? 'yandexgpt';
}

function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [profile, setProfile] = useState(null);
    const [telegramUser, setTelegramUser] = useState(null);
    const [startParam, setStartParam] = useState('');
    const [appNotice, setAppNotice] = useState(null);
    const [chatError, setChatError] = useState('');
    const [imageError, setImageError] = useState('');
    const [videoError, setVideoError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [walletData, setWalletData] = useState(null);
    const [referralData, setReferralData] = useState(null);
    const [referralLink, setReferralLink] = useState('');
    const [referralLinkLoading, setReferralLinkLoading] = useState(false);
    const [promptHistoryData, setPromptHistoryData] = useState(null);
    const [pageLoading, setPageLoading] = useState({ wallet: false, referrals: false, history: false });
    const pageDataLoadedRef = useRef({ wallet: false, referrals: false, history: false });
    const pageDataInFlightRef = useRef({ wallet: false, referrals: false, history: false });
    const [promptDraft, setPromptDraft] = useState('');
    const [promptCategory, setPromptCategory] = useState('general');
    const [isSavingPrompt, setIsSavingPrompt] = useState(false);
    const [theme, setTheme] = useState(getInitialTheme);
    const [language, setLanguage] = useState(getInitialLanguage);
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const [textPrompt, setTextPrompt] = useState('');
    const [textModel, setTextModel] = useState(getInitialTextModelId);
    const [textModels, setTextModels] = useState(DEFAULT_TEXT_MODELS);
    const [imageModel, setImageModel] = useState('nano-banana');
    const [imagePrompt, setImagePrompt] = useState('');
    const [imageSessionMessages, setImageSessionMessages] = useState([]);
    const [imageSessionId, setImageSessionId] = useState(() => createChatSessionId());
    const [generatedImageUrl, setGeneratedImageUrl] = useState('');
    const [videoModel, setVideoModel] = useState('kling-v3-std');
    const [videoPrompt, setVideoPrompt] = useState('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState('');
    const [videoSessionId, setVideoSessionId] = useState(() => createChatSessionId());
    const [chatMessages, setChatMessages] = useState([]);
    const [chatTopicTitle, setChatTopicTitle] = useState('');
    const [chatSessionId, setChatSessionId] = useState(() => createChatSessionId());
    const [chatReturnPage, setChatReturnPage] = useState('catalog');
    const [imageReturnPage, setImageReturnPage] = useState('catalog');
    const [videoReturnPage, setVideoReturnPage] = useState('catalog');
    const [historyReturnPage, setHistoryReturnPage] = useState('home');
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [chatAttachment, setChatAttachment] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const textGenerationAbortRef = useRef(null);
    const chatPhotoInputRef = useRef(null);
    const pendingAssistantIdRef = useRef(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [homeCategoryChip, setHomeCategoryChip] = useState('all');
    const [catalogTab, setCatalogTab] = useState('all');
    const [catalogSearch, setCatalogSearch] = useState('');
    const [historyFilter, setHistoryFilter] = useState('all');

    const effectiveTextModels = useMemo(
        () => resolveEffectiveTextModels(textModels),
        [textModels],
    );

    const clearAppNotice = useCallback(() => {
        setAppNotice(null);
    }, []);

    const showAppNotice = useCallback((message, variant = 'error') => {
        if (!message) {
            setAppNotice(null);
            return;
        }

        setAppNotice({ message, variant });
    }, []);

    useEffect(() => {
        if (appNotice?.variant !== 'success') {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setAppNotice(null);
        }, 3200);

        return () => window.clearTimeout(timer);
    }, [appNotice]);

    useEffect(() => {
        let isMounted = true;

        const bootstrapTelegramFlow = async () => {
            let currentTelegramUser = null;

            setIsLoading(true);
            setAppNotice(null);

            try {
                const tg = await initTelegramMiniAppAsync({ timeoutMs: 12000 });
                currentTelegramUser = tg?.initDataUnsafe?.user ?? null;
                const currentStartParam = tg?.initDataUnsafe?.start_param ?? '';

                if (!isMounted) {
                    return;
                }

                setTelegramUser(currentTelegramUser);
                setStartParam(currentStartParam);

                if (tg?.platform === 'mock' && !ENABLE_TELEGRAM_MOCK) {
                    showAppNotice('Запущен режим mock без Telegram. Откройте Mini App из бота.');
                    return;
                }

                if (!tg || (!tg.initData && !currentTelegramUser?.id)) {
                    showAppNotice(
                        ENABLE_TELEGRAM_MOCK
                            ? 'Не удалось инициализировать Telegram mock.'
                            : 'Telegram WebApp SDK не найден. Откройте Mini App из Telegram (Desktop или телефон), не во внешнем браузере.',
                    );
                    return;
                }

                if (!currentTelegramUser?.id && !tg.initData) {
                    const platform = tg.platform ?? 'unknown';
                    showAppNotice(
                        platform === 'tdesktop' || platform === 'macos' || platform === 'web'
                            ? 'Не удалось прочитать пользователя. Закройте Mini App и откройте снова из бота в Telegram Desktop.'
                            : 'Не удалось прочитать данные пользователя. Откройте Mini App из бота.',
                    );
                    return;
                }

                await registerTelegramUser();

                const tgFresh = getTelegramWebApp();

                if (tgFresh) {
                    hydrateTelegramUser(tgFresh);
                    currentTelegramUser = tgFresh.initDataUnsafe?.user ?? currentTelegramUser;

                    if (isMounted) {
                        setTelegramUser(currentTelegramUser);
                    }
                }

                const backendProfile = await getMyProfile();

                if (!isMounted) {
                    return;
                }

                setProfile(normalizeProfileResponse(backendProfile, currentTelegramUser));

                const { theme: bootstrapTheme, persist } = resolveBootstrapTheme({
                    apiTheme: extractProfileTheme(backendProfile),
                    tg: tgFresh ?? tg,
                });
                const appliedTheme = applyTheme(bootstrapTheme, tgFresh ?? tg, { persist });

                setTheme(appliedTheme);

                try {
                    const models = await fetchTextModels();

                    if (isMounted && models.length) {
                        setTextModels(models);
                        setTextModel((current) => resolveTextModelId(current, models));
                    }
                } catch (modelError) {
                    if (import.meta.env.DEV) {
                        console.warn('[CyberMate] Failed to load text models:', modelError);
                    }
                }
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                setProfile((prevProfile) => prevProfile ?? normalizeProfileResponse(null, currentTelegramUser));
                showAppNotice(error instanceof Error ? error.message : 'Не удалось связаться с backend.');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        bootstrapTelegramFlow();

        return () => {
            isMounted = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once on mount
    }, []);

    useEffect(() => {
        const tg = getTelegramWebApp();

        return bindSystemThemeChanged((nextTheme) => {
            setTheme(applyTheme(nextTheme, tg, { persist: false }));
        }, tg);
    }, []);

    useEffect(() => {
        if (!telegramUser?.id) {
            return undefined;
        }

        const tg = getTelegramWebApp();

        return bindTelegramThemeChanged(tg, (nextTheme) => {
            setTheme(applyTheme(nextTheme, tg, { persist: false }));
        });
    }, [telegramUser?.id]);

    const toggleTheme = useCallback(() => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        const appliedTheme = applyTheme(nextTheme, getTelegramWebApp());

        setTheme(appliedTheme);

        patchUserTheme(appliedTheme).catch((error) => {
            if (import.meta.env.DEV) {
                console.warn('[CyberMate] Theme saved locally; API sync failed:', error);
            }
        });
    }, [theme]);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = language;
        }

        if (typeof window !== 'undefined') {
            window.localStorage.setItem('cybermate-language', language);
        }
    }, [language]);

    useEffect(() => {
        if (currentPage !== 'ai-chat' || textModels.length) {
            return undefined;
        }

        let isMounted = true;

        const loadModels = async () => {
            try {
                const models = await fetchTextModels();

                if (isMounted && models.length) {
                    setTextModels(models);
                    setTextModel((current) => resolveTextModelId(current, models));
                }
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.warn('[CyberMate] Failed to load text models:', error);
                }
            }
        };

        loadModels();

        return () => {
            isMounted = false;
        };
    }, [currentPage, textModels.length]);

    useEffect(() => {
        const model = findTextModel(effectiveTextModels, textModel);

        if (!textModelSupportsImage(model)) {
            setChatAttachment(null);
        }
    }, [textModel, effectiveTextModels]);

    useEffect(() => {
        if (
            typeof window === 'undefined'
            || window.localStorage.getItem('cybermate-language')
            || !telegramUser?.language_code
        ) {
            return;
        }

        setLanguage(telegramUser.language_code.toLowerCase().startsWith('ru') ? 'ru' : 'en');
    }, [telegramUser]);

    useEffect(() => {
        if (currentPage !== 'settings') {
            setIsLanguageMenuOpen(false);
        }
    }, [currentPage]);

    useEffect(() => {
        pageDataLoadedRef.current = { wallet: false, referrals: false, history: false };
        pageDataInFlightRef.current = { wallet: false, referrals: false, history: false };
        setWalletData(null);
        setReferralData(null);
        setReferralLink('');
        setPromptHistoryData(null);
    }, [telegramUser?.id]);

    useEffect(() => {
        if (!telegramUser?.id) {
            return undefined;
        }

        let isCancelled = false;
        let needWallet = false;
        let needReferrals = false;
        let needHistory = false;

        const loadPageData = async () => {
            needWallet = (currentPage === 'wallet' || currentPage === 'profile')
                && !pageDataLoadedRef.current.wallet
                && !pageDataInFlightRef.current.wallet;
            needReferrals = (currentPage === 'referrals' || currentPage === 'profile')
                && !pageDataLoadedRef.current.referrals
                && !pageDataInFlightRef.current.referrals;
            needHistory = (currentPage === 'history' || currentPage === 'profile')
                && !pageDataLoadedRef.current.history
                && !pageDataInFlightRef.current.history;

            if (!needWallet && !needReferrals && !needHistory) {
                return;
            }

            if (needWallet) {
                pageDataInFlightRef.current.wallet = true;
                setPageLoading((prev) => ({ ...prev, wallet: true }));
            }
            if (needReferrals) {
                pageDataInFlightRef.current.referrals = true;
                setPageLoading((prev) => ({ ...prev, referrals: true }));
            }
            if (needHistory) {
                pageDataInFlightRef.current.history = true;
                setPageLoading((prev) => ({ ...prev, history: true }));
            }

            const tasks = [];

            if (needWallet) {
                tasks.push(
                    getMyWallet()
                        .then((data) => {
                            if (!isCancelled) {
                                setWalletData(data ?? { wallet: null, transactions: [] });
                            }
                        })
                        .catch((error) => {
                            if (!isCancelled) {
                                setWalletData({ wallet: null, transactions: [] });
                                showAppNotice(error instanceof Error ? error.message : 'Не удалось загрузить кошелёк.');
                            }
                        })
                        .finally(() => {
                            pageDataInFlightRef.current.wallet = false;
                            pageDataLoadedRef.current.wallet = true;
                            if (!isCancelled) {
                                setPageLoading((prev) => ({ ...prev, wallet: false }));
                            }
                        }),
                );
            }

            if (needReferrals) {
                tasks.push(
                    getMyReferrals()
                        .then((data) => {
                            if (!isCancelled) {
                                setReferralData(data ?? { items: [] });
                            }
                        })
                        .catch((error) => {
                            if (!isCancelled) {
                                setReferralData({ items: [] });
                                showAppNotice(error instanceof Error ? error.message : 'Не удалось загрузить рефералов.');
                            }
                        })
                        .finally(() => {
                            pageDataInFlightRef.current.referrals = false;
                            pageDataLoadedRef.current.referrals = true;
                            if (!isCancelled) {
                                setPageLoading((prev) => ({ ...prev, referrals: false }));
                            }
                        }),
                );
            }

            if (needHistory) {
                tasks.push(
                    getMyPromptHistory()
                        .then((data) => {
                            if (!isCancelled) {
                                setPromptHistoryData(data ?? { items: [] });
                            }
                        })
                        .catch((error) => {
                            if (!isCancelled) {
                                setPromptHistoryData({ items: [] });
                                showAppNotice(error instanceof Error ? error.message : 'Не удалось загрузить историю.');
                            }
                        })
                        .finally(() => {
                            pageDataInFlightRef.current.history = false;
                            pageDataLoadedRef.current.history = true;
                            if (!isCancelled) {
                                setPageLoading((prev) => ({ ...prev, history: false }));
                            }
                        }),
                );
            }

            await Promise.allSettled(tasks);
        };

        loadPageData();

        return () => {
            isCancelled = true;

            if (needWallet && !pageDataLoadedRef.current.wallet) {
                pageDataInFlightRef.current.wallet = false;
            }
            if (needReferrals && !pageDataLoadedRef.current.referrals) {
                pageDataInFlightRef.current.referrals = false;
            }
            if (needHistory && !pageDataLoadedRef.current.history) {
                pageDataInFlightRef.current.history = false;
            }
        };
    }, [currentPage, telegramUser?.id]);

    useEffect(() => {
        if (!telegramUser?.id || currentPage !== 'referrals') {
            return undefined;
        }

        let isCancelled = false;
        setReferralLinkLoading(true);

        getMyReferralLink()
            .then(({ referral_link: link }) => {
                if (!isCancelled) {
                    setReferralLink(link);
                }
            })
            .catch((error) => {
                if (!isCancelled) {
                    setReferralLink('');
                    showAppNotice(
                        error instanceof Error ? error.message : 'Не удалось загрузить реферальную ссылку.',
                    );
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setReferralLinkLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [currentPage, telegramUser?.id]);

    const text = translations[language] ?? translations.ru;
    const userData = useMemo(() => {
        const base = buildProfileView({
            ...profile,
            balance: walletData?.wallet?.balance ?? profile?.balance,
            tokenBalance: walletData?.wallet?.balanceAvailable ?? profile?.tokenBalance,
        }, telegramUser);
        const subscription = deriveSubscriptionView(profile, text);

        return {
            ...base,
            subscriptionPlanId: subscription.planId,
            subscriptionPlanName: subscription.planName,
            subscriptionUntil: subscription.untilLabel,
            subscriptionIsPaid: subscription.isPaid,
        };
    }, [profile, telegramUser, walletData, language]);
    const referralItems = useMemo(() => {
        const sourceItems = Array.isArray(referralData?.items) ? referralData.items : [];

        return sourceItems.map((item, index) => ({
            id: item.id ?? `referral-${index}`,
            name: item.name || item.username || item.fullName || `${language === 'ru' ? 'Друг' : 'Friend'} ${index + 1}`,
            reward: `+${item.earnings ?? item.reward ?? 0}`,
        }));
    }, [referralData, language]);
    const historyItems = Array.isArray(promptHistoryData?.items) ? promptHistoryData.items : [];
    const walletTransactions = Array.isArray(walletData?.transactions) ? walletData.transactions : [];
    const activeNavKey = currentPage === 'settings' || currentPage === 'wallet' || currentPage === 'referrals'
        ? 'profile'
        : currentPage === 'ai-chat' || currentPage === 'ai-image' || currentPage === 'ai-video'
            ? 'catalog'
            : ['home', 'catalog', 'history', 'profile'].includes(currentPage)
                ? currentPage
                : 'home';

    const showBottomNav = !['ai-chat', 'ai-image', 'ai-video', 'settings', 'wallet', 'referrals'].includes(currentPage);

    const textModelSelectorItems = useMemo(
        () => buildTextModelSelectorItems(effectiveTextModels),
        [effectiveTextModels],
    );

    const catalogSections = useMemo(() => [
        {
            id: 'text-models',
            labelKey: 'catalogSectionChat',
            tools: buildCatalogTextTools(effectiveTextModels),
        },
        {
            id: 'image-models',
            labelKey: 'catalogSectionPhoto',
            tools: IMAGE_MODEL_DEFINITIONS,
        },
        {
            id: 'video-models',
            labelKey: 'catalogSectionVideo',
            tools: VIDEO_MODEL_DEFINITIONS,
        },
    ], [effectiveTextModels]);

    const toolMatchesCatalogTab = (tool, tab) => tab === 'all' || tool.tab === tab || tool.categories?.includes(tab);

    const catalogSearchQuery = catalogSearch.trim().toLowerCase();

    const isSoraCatalogTool = (tool) => {
        const id = String(tool?.id ?? '').toLowerCase();
        const name = String(tool?.label ?? text[tool?.nameKey] ?? '').toLowerCase();
        const sub = String(tool?.sub ?? text[tool?.subKey] ?? '').toLowerCase();

        return id.includes('sora') || name.includes('sora') || sub.includes('sora');
    };

    const getCatalogToolLabel = (tool) => tool.label ?? text[tool.nameKey] ?? tool.id;
    const getCatalogToolSub = (tool) => {
        if (tool.page === 'ai-chat') {
            return getCatalogModelDescription(tool, language);
        }

        return tool.sub ?? text[tool.subKey] ?? '';
    };

    const filteredCatalogSections = catalogSections
        .map((section) => ({
            ...section,
            tools: section.tools.filter((tool) => {
                if (isSoraCatalogTool(tool)) {
                    return false;
                }

                const matchesTab = toolMatchesCatalogTab(tool, catalogTab);
                const toolLabel = getCatalogToolLabel(tool).toLowerCase();
                const toolSub = getCatalogToolSub(tool).toLowerCase();
                const matchesSearch = !catalogSearchQuery
                    || toolLabel.includes(catalogSearchQuery)
                    || toolSub.includes(catalogSearchQuery);
                return matchesTab && matchesSearch;
            }),
        }))
        .filter((section) => section.tools.length > 0);

    const getCatalogBadgeLabel = (badge) => {
        if (badge === 'lite') return text.tierLite;
        if (badge === 'pro') return text.tierPro;
        if (badge === 'hot') return text.badgeHot;
        if (badge === 'new') return text.badgeNew;
        if (badge === 'free') return text.badgeFree;
        return '';
    };

    const filteredHistoryItems = useMemo(() => {
        if (historyFilter === 'all') {
            return historyItems;
        }

        return historyItems.filter((item) => {
            const category = String(item.category || '').toLowerCase();

            if (historyFilter === 'chat') {
                const modelId = String(item.model || '').toLowerCase();
                return isKnownTextModelId(modelId, effectiveTextModels)
                    || LEGACY_TEXT_MODEL_IDS.includes(modelId)
                    || category.includes('chat')
                    || category.includes('text')
                    || category === 'текст'
                    || category === 'gpt';
            }
            if (historyFilter === 'photo') {
                return category.includes('photo') || category.includes('image');
            }
            if (historyFilter === 'video') {
                return category.includes('video');
            }
            if (historyFilter === 'music') {
                return category.includes('music') || category.includes('audio');
            }

            return category.includes(historyFilter);
        });
    }, [historyItems, historyFilter, effectiveTextModels]);

    const historyTopics = useMemo(
        () => groupHistoryIntoTopics(filteredHistoryItems),
        [filteredHistoryItems],
    );

    const historyTopicGroups = useMemo(() => {
        const todayTopics = [];
        const yesterdayTopics = [];
        const otherTopics = [];
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        historyTopics.forEach((topic) => {
            const createdAt = new Date(topic.latestAt);

            if (Number.isNaN(createdAt.getTime())) {
                todayTopics.push(topic);
                return;
            }

            if (createdAt >= startOfToday) {
                todayTopics.push(topic);
            } else if (createdAt >= startOfYesterday) {
                yesterdayTopics.push(topic);
            } else {
                otherTopics.push(topic);
            }
        });

        const groups = [];

        if (todayTopics.length > 0) {
            groups.push({ id: 'today', label: text.historyToday, topics: todayTopics });
        }
        if (yesterdayTopics.length > 0) {
            groups.push({ id: 'yesterday', label: text.historyYesterday, topics: yesterdayTopics });
        }
        if (otherTopics.length > 0) {
            groups.push({
                id: 'older',
                label: language === 'ru' ? 'Ранее' : 'Earlier',
                topics: otherTopics,
            });
        }

        return groups;
    }, [historyTopics, text.historyToday, text.historyYesterday, language]);

    const formatHistoryTime = (createdAt) => {
        if (!createdAt) {
            return '';
        }

        const date = new Date(createdAt);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleTimeString(language === 'ru' ? 'ru-RU' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getHistoryVisual = (modelId) => {
        const value = String(modelId || '').toLowerCase();
        const apiModel = findTextModel(effectiveTextModels, resolveTextModelId(value, effectiveTextModels));

        if (apiModel) {
            const visual = getTextModelVisual(apiModel);

            return {
                ...visual,
                toolName: apiModel.label,
                emoji: null,
            };
        }

        const imageModel = IMAGE_MODEL_DEFINITIONS.find((model) => (
            value === model.id || value.includes(model.id)
        ));

        if (imageModel) {
            return {
                accent: imageModel.accent,
                icon: imageModel.icon,
                toolName: text[imageModel.nameKey],
                emoji: null,
            };
        }

        if (value.includes('text') || value.includes('chat')) {
            const fallback = findTextModel(effectiveTextModels, 'yandexgpt') ?? effectiveTextModels[0];

            if (fallback) {
                const visual = getTextModelVisual(fallback);

                return {
                    ...visual,
                    toolName: fallback.label,
                    emoji: null,
                };
            }
        }

        return { accent: 'violet', icon: Bot, toolName: text.chatTitle, emoji: null };
    };

    const startNewChatSession = useCallback(() => {
        setChatSessionId(createChatSessionId());
    }, []);

    const openAiChat = (modelId, returnPage = currentPage, options = {}) => {
        handleStopChatGeneration();
        if (modelId) {
            const resolvedModelId = resolveTextModelId(modelId, effectiveTextModels);

            setTextModel(resolvedModelId);
            setStoredTextModelId(resolvedModelId);
        }
        if (options.sessionId) {
            setChatSessionId(options.sessionId);
        } else if (!options.messages?.length) {
            startNewChatSession();
        }
        setChatMessages(options.messages ?? []);
        setChatTopicTitle(options.topicTitle ?? '');
        setTextPrompt('');
        setChatAttachment(null);
        setChatReturnPage(returnPage);
        setChatError('');
        setCurrentPage('ai-chat');
    };

    const resolveHistoryTopicModel = (topic) => {
        const model = String(topic?.model || '').toLowerCase();

        if (isKnownTextModelId(model, effectiveTextModels)) {
            return resolveTextModelId(model, effectiveTextModels);
        }

        if (IMAGE_MODEL_IDS.includes(model)) {
            return model;
        }

        const category = String(topic?.category || model).toLowerCase();

        if (category.includes('image') || category.includes('photo')) {
            return IMAGE_MODEL_IDS[0];
        }

        return resolveTextModelId(textModel, effectiveTextModels);
    };

    const openHistoryTopic = (topic) => {
        const modelId = resolveHistoryTopicModel(topic);
        const isImageTopic = IMAGE_MODEL_IDS.includes(modelId);

        if (isImageTopic) {
            const imageSessionFromHistory = topic.sessionId
                || topic.items?.[0]?.sessionId
                || topic.items?.[0]?.session_id
                || null;

            const restored = buildChatMessagesFromHistoryTopic(topic).map((message, index, list) => {
                if (message.role !== 'assistant') {
                    return message;
                }

                const prevUser = list.slice(0, index).reverse().find((item) => item.role === 'user');
                return {
                    ...message,
                    scenePrompt: prevUser?.content || message.content,
                };
            });

            openAiImage(modelId, 'history', {
                messages: restored,
                sessionId: imageSessionFromHistory,
            });
            return;
        }

        const messages = buildChatMessagesFromHistoryTopic(topic);
        const title = getChatTopicTitle(
            messages[messages.length - 1]?.content || topic.topicTitle || '',
        );

        const sessionId = topic.sessionId
            || topic.items?.[0]?.sessionId
            || topic.items?.[0]?.session_id
            || topic.lastItem?.sessionId
            || topic.lastItem?.session_id
            || null;

        openAiChat(modelId, 'history', { messages, topicTitle: title, sessionId });
    };

    const handleTextModelChange = (modelId) => {
        handleStopChatGeneration();
        const resolvedModelId = resolveTextModelId(modelId, effectiveTextModels);
        const nextModel = findTextModel(effectiveTextModels, resolvedModelId);

        setTextModel(resolvedModelId);
        setStoredTextModelId(resolvedModelId);
        startNewChatSession();
        setChatMessages([]);
        setChatTopicTitle('');
        setTextPrompt('');
        if (!textModelSupportsImage(nextModel)) {
            setChatAttachment(null);
        }
        setChatError('');
    };

    const handleTextModelGroupSelect = (item) => {
        if (item.type === 'single') {
            handleTextModelChange(item.model.id);
            return;
        }

        const activeVariant = item.variants.find((variant) => variant.id === textModel);
        const defaultVariant = item.variants.find((variant) => variant.id === item.defaultModelId)
            ?? item.variants[0];

        handleTextModelChange(activeVariant?.id ?? defaultVariant.id);
    };

    const handleImageModelChange = (modelId) => {
        setImageModel(modelId);
        startNewImageSession();
        setImageSessionMessages([]);
        setImagePrompt('');
        setGeneratedImageUrl('');
        setImageError('');
    };

    const handleNewImageDialog = () => {
        startNewImageSession();
        setImageSessionMessages([]);
        setImagePrompt('');
        setGeneratedImageUrl('');
        setImageError('');
    };

    const startNewImageSession = useCallback(() => {
        setImageSessionId(createChatSessionId());
    }, []);

    const openAiImage = (modelId, returnPage = currentPage, options = {}) => {
        if (modelId) {
            setImageModel(modelId);
        }
        if (options.sessionId) {
            setImageSessionId(options.sessionId);
        } else if (!options.messages?.length) {
            startNewImageSession();
        }
        setImageSessionMessages(options.messages ?? []);
        setImagePrompt('');
        setGeneratedImageUrl('');
        setImageReturnPage(returnPage);
        setImageError('');
        setCurrentPage('ai-image');
    };

    const startNewVideoSession = useCallback(() => {
        setVideoSessionId(createChatSessionId());
    }, []);

    const handleVideoModelChange = (modelId) => {
        setVideoModel(modelId);
        startNewVideoSession();
        setVideoPrompt('');
        setGeneratedVideoUrl('');
        setVideoError('');
    };

    const handleNewVideoDialog = () => {
        startNewVideoSession();
        setVideoPrompt('');
        setGeneratedVideoUrl('');
        setVideoError('');
    };

    const openAiVideo = (modelId, returnPage = currentPage) => {
        if (modelId) {
            setVideoModel(modelId);
        }
        startNewVideoSession();
        setVideoPrompt('');
        setGeneratedVideoUrl('');
        setVideoReturnPage(returnPage);
        setVideoError('');
        setCurrentPage('ai-video');
    };

    const handleCatalogToolClick = (tool) => {
        if (tool.locked) {
            return;
        }

        if (tool.page === 'ai-image') {
            openAiImage(tool.id, 'catalog');
            return;
        }

        if (tool.page === 'ai-video') {
            openAiVideo(tool.id, 'catalog');
            return;
        }

        if (tool.page === 'ai-chat') {
            openAiChat(tool.id, 'catalog');
        }
    };

    const handleGenerateImage = async () => {
        const trimmedPrompt = imagePrompt.trim();

        if (!trimmedPrompt) {
            setImageError(text.textPromptEmpty);
            return;
        }

        const contextMessages = buildImageContextMessages(imageSessionMessages);

        try {
            setIsGeneratingImage(true);
            setImageError('');
            setGeneratedImageUrl('');
            const response = await generateImage({
                prompt: trimmedPrompt,
                model: imageModel,
                messages: contextMessages,
                sessionId: imageSessionId,
            });
            const imageUrl = response?.imageUrl?.trim() ?? '';

            if (!imageUrl) {
                setImageError(text.imageGenerateEmpty);
                return;
            }

            setImageSessionMessages((prev) => [
                ...prev,
                { id: `img-user-${Date.now()}`, role: 'user', content: trimmedPrompt },
                {
                    id: `img-assistant-${Date.now()}`,
                    role: 'assistant',
                    content: text.imageGeneratedNote,
                    scenePrompt: trimmedPrompt,
                },
            ]);
            setImagePrompt('');
            setGeneratedImageUrl(imageUrl);

            try {
                const historyResponse = await savePromptHistory({
                    prompt: trimmedPrompt,
                    category: imageModel,
                });
                const savedItem = historyResponse?.item;

                if (savedItem) {
                    setPromptHistoryData((prev) => ({
                        items: [savedItem, ...(Array.isArray(prev?.items) ? prev.items : [])],
                    }));
                }
            } catch {
                // History save is optional.
            }
        } catch (error) {
            setGeneratedImageUrl('');
            const message = error instanceof Error ? error.message : '';
            setImageError(
                error?.code === 'CONTENT_POLICY' ? text.imageContentPolicy : (message || 'Не удалось сгенерировать изображение.'),
            );
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleGenerateVideo = async () => {
        const trimmedPrompt = videoPrompt.trim();

        if (!trimmedPrompt) {
            setVideoError(text.textPromptEmpty);
            return;
        }

        try {
            setIsGeneratingVideo(true);
            setVideoError('');
            setGeneratedVideoUrl('');
            const response = await generateVideo({
                prompt: trimmedPrompt,
                model: videoModel,
                sessionId: videoSessionId,
            });
            const videoUrl = response?.videoUrl?.trim() ?? '';

            if (!videoUrl) {
                setVideoError(text.videoGenerateEmpty);
                return;
            }

            setVideoPrompt('');
            setGeneratedVideoUrl(videoUrl);

            try {
                const historyResponse = await savePromptHistory({
                    prompt: trimmedPrompt,
                    category: videoModel,
                });
                const savedItem = historyResponse?.item;

                if (savedItem) {
                    setPromptHistoryData((prev) => ({
                        items: [savedItem, ...(Array.isArray(prev?.items) ? prev.items : [])],
                    }));
                }
            } catch {
                // History save is optional.
            }
        } catch (error) {
            setGeneratedVideoUrl('');
            const message = error instanceof Error ? error.message : '';
            setVideoError(message || 'Не удалось сгенерировать видео.');
        } finally {
            setIsGeneratingVideo(false);
        }
    };

    const handleNewChatDialog = () => {
        handleStopChatGeneration();
        startNewChatSession();
        setChatMessages([]);
        setChatTopicTitle('');
        setTextPrompt('');
        setChatAttachment(null);
        setChatError('');
    };

    const handleReferralLinkCopy = async () => {
        if (!referralLink || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
            return;
        }

        try {
            await navigator.clipboard.writeText(referralLink);

            if (!showTelegramAlert(text.referralCopied)) {
                showAppNotice(text.referralCopied, 'success');
            }
        } catch {
            // noop
        }
    };

    const renderConceptPageHeader = (title, onBack) => (
        <header className="concept-page__header">
            <button type="button" className="concept-page__back" onClick={onBack}>
                <ChevronLeft size={16} aria-hidden="true" />
                {text.back}
            </button>
            <h1 className="concept-page__title">{title}</h1>
            <span className="concept-page__spacer" aria-hidden="true" />
        </header>
    );

    const renderSubscriptionPlanCards = (currentPlanId = 'pro') => (
        subscriptionPlanDefs.map((plan) => {
            const features = plan.id === 'free'
                ? text.planFreeFeatures
                : plan.id === 'pro'
                    ? text.planProFeatures
                    : text.planUltraFeatures;
            const locked = plan.id === 'free' ? text.planFreeLocked : [];
            const isCurrent = plan.id === currentPlanId;

            return (
                <article
                    key={plan.id}
                    className={`profile-concept__plan-card ${plan.popular ? 'profile-concept__plan-card--popular' : ''} ${isCurrent ? 'profile-concept__plan-card--current' : ''}`}
                >
                    {plan.popular ? <span className="profile-concept__plan-glow" aria-hidden="true" /> : null}
                    <div className="profile-concept__plan-top">
                        <div>
                            <div className="profile-concept__plan-name">{text[plan.nameKey]}</div>
                            <span className={`profile-concept__plan-badge profile-concept__plan-badge--${plan.badgeClass}`}>
                                {text[plan.badgeKey]}
                            </span>
                        </div>
                        <div className="profile-concept__plan-price">
                            <span>{text[plan.priceKey]}</span>
                            <small>{text[plan.priceSubKey]}</small>
                        </div>
                    </div>
                    <div className="profile-concept__plan-features">
                        {features.map((feature) => (
                            <div key={feature} className="profile-concept__feat">
                                <Check size={13} aria-hidden="true" />
                                {feature}
                            </div>
                        ))}
                        {locked.map((feature) => (
                            <div key={feature} className="profile-concept__feat profile-concept__feat--muted">
                                <Lock size={13} aria-hidden="true" />
                                {feature}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        className={`subscription-concept__plan-btn ${isCurrent ? 'subscription-concept__plan-btn--current' : ''}`}
                        disabled={isCurrent}
                    >
                        {isCurrent ? text.planCurrentButton : text.planSelectButton}
                    </button>
                </article>
            );
        })
    );

    const handleStopChatGeneration = useCallback(() => {
        textGenerationAbortRef.current?.abort();
        textGenerationAbortRef.current = null;
        setIsGeneratingText(false);
        const pendingId = pendingAssistantIdRef.current;
        if (pendingId) {
            setChatMessages((prev) => prev.filter((message) => message.id !== pendingId));
            pendingAssistantIdRef.current = null;
        }
    }, []);

    const handleChatTypingComplete = useCallback((messageId) => {
        setChatMessages((prev) => prev.map((message) => (
            message.id === messageId
                ? { ...message, isTyping: false }
                : message
        )));
    }, []);

    const handleChatPhotoSelect = (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }
        if (!file.type.startsWith('image/')) {
            setChatError('Можно прикрепить только изображение.');
            return;
        }
        if (file.size > 4 * 1024 * 1024) {
            setChatError('Изображение слишком большое (макс. 4 МБ).');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = typeof reader.result === 'string' ? reader.result : '';
            if (!dataUrl) {
                return;
            }
            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            setChatAttachment({
                previewUrl: dataUrl,
                base64,
                mimeType: file.type,
            });
            setChatError('');
        };
        reader.readAsDataURL(file);
    };

    const handleClearHistoryRequest = () => {
        setConfirmDialog({
            message: text.historyDeleteConfirm,
            confirmLabel: text.historyDeleteConfirmAction,
            cancelLabel: text.historyDeleteCancel,
            onConfirm: async () => {
                try {
                    await clearMyPromptHistory();
                    setPromptHistoryData({ items: [] });
                    pageDataLoadedRef.current.history = true;
                    showAppNotice(text.historyCleared, 'success');
                } catch (error) {
                    showAppNotice(error instanceof Error ? error.message : 'Не удалось очистить историю.');
                }
            },
        });
    };

    const handleSendChatMessage = async () => {
        if (isGeneratingText) {
            return;
        }

        const trimmedPrompt = textPrompt.trim();
        const attachment = chatAttachment;

        if (!trimmedPrompt && !attachment) {
            setChatError(text.textPromptEmpty);
            return;
        }

        const contextMessages = buildChatContextMessages(chatMessages);

        if (!chatTopicTitle) {
            setChatTopicTitle(getChatTopicTitle(trimmedPrompt || text.chatAttachPhoto));
        }

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmedPrompt,
            imagePreview: attachment?.previewUrl ?? null,
        };

        const assistantPendingId = `assistant-pending-${Date.now()}`;
        pendingAssistantIdRef.current = assistantPendingId;

        setChatMessages((prev) => [
            ...prev,
            userMessage,
            {
                id: assistantPendingId,
                role: 'assistant',
                content: '',
                isTyping: true,
                isPending: true,
            },
        ]);
        setTextPrompt('');
        setChatAttachment(null);

        const abortController = new AbortController();
        textGenerationAbortRef.current = abortController;

        try {
            setIsGeneratingText(true);
            setChatError('');
            const response = await generateText({
                prompt: trimmedPrompt,
                model: textModel,
                messages: contextMessages,
                sessionId: chatSessionId,
                imageBase64: attachment?.base64,
                imageMimeType: attachment?.mimeType,
                signal: abortController.signal,
            });
            const resultText = response?.text?.trim() ?? '';

            if (!resultText) {
                setChatMessages((prev) => prev.filter((message) => message.id !== assistantPendingId));
                pendingAssistantIdRef.current = null;
                setChatError(text.textGenerateEmpty);
                return;
            }

            setChatMessages((prev) => prev.map((message) => (
                message.id === assistantPendingId
                    ? {
                        ...message,
                        content: resultText,
                        isPending: false,
                        isTyping: true,
                    }
                    : message
            )));
            pendingAssistantIdRef.current = null;
        } catch (error) {
            if (error?.name === 'AbortError' || abortController.signal.aborted) {
                return;
            }

            setChatMessages((prev) => prev.filter((message) => message.id !== assistantPendingId));
            pendingAssistantIdRef.current = null;
            setChatError(formatUserFacingError(error, language) || 'Не удалось получить ответ.');
        } finally {
            if (textGenerationAbortRef.current === abortController) {
                textGenerationAbortRef.current = null;
            }

            setIsGeneratingText(false);
        }
    };

    const handleImageComposerKeyDown = (event) => {
        if (isGeneratingImage) {
            return;
        }

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleGenerateImage();
        }
    };

    const handleChatComposerKeyDown = (event) => {
        if (isGeneratingText) {
            return;
        }

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendChatMessage();
        }
    };

    useEffect(() => () => {
        textGenerationAbortRef.current?.abort();
    }, []);

    const handleSavePrompt = async () => {
        const trimmedPrompt = promptDraft.trim();
        const trimmedCategory = promptCategory.trim() || 'general';

        if (!trimmedPrompt) {
            showAppNotice(text.promptEmpty);
            return;
        }

        try {
            setIsSavingPrompt(true);
            const response = await savePromptHistory({ prompt: trimmedPrompt, category: trimmedCategory });
            const savedItem = response?.item;

            if (savedItem) {
                setPromptHistoryData((prev) => ({
                    items: [savedItem, ...(Array.isArray(prev?.items) ? prev.items : [])],
                }));
            }

            setPromptDraft('');
            showAppNotice(text.promptSaved, 'success');
        } catch (error) {
            showAppNotice(error instanceof Error ? error.message : 'Не удалось сохранить промт.');
        } finally {
            setIsSavingPrompt(false);
        }
    };

    const homeGreetingName = userData.displayName.split(' ')[0] || userData.displayName;
    const homeGreetingText = text.homeGreeting.replace('{name}', homeGreetingName);

    const visibleToolCards = homeToolCards.filter((card) => (
        homeCategoryChip === 'all' || card.categories.includes(homeCategoryChip)
    ));

    const handleToolCardClick = (card) => {
        if (card.id === 'images') {
            openAiImage('nano-banana', 'home');
            return;
        }

        if (card.id === 'video') {
            openAiVideo('kling-v3-std', 'home');
            return;
        }

        if (card.page === 'ai-chat' || card.id === 'chat') {
            openAiChat(textModel, 'home');
        }
    };

    const renderHomeScreen = () => (
        <section className="home-screen home-screen--concept" aria-label="Главная">
            <header className="home-concept__header">
                <div className="home-concept__logo-area">
                    <img
                        className="home-concept__logo-image"
                        src="/logo_white.png"
                        alt=""
                    />
                    <span className="home-concept__logo-name">{APP_NAME}</span>
                </div>
                <div className="home-concept__header-actions">
                    <button type="button" className="home-concept__icon-btn" aria-label="Уведомления">
                        <Bell size={18} />
                    </button>
                    <button
                        type="button"
                        className="home-concept__icon-btn"
                        aria-label={text.settingsTitle}
                        onClick={() => setCurrentPage('settings')}
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            <div className="home-concept__greeting">
                <h2>{homeGreetingText}</h2>
                <p>{text.homeGreetingSub}</p>
            </div>

            <div className="home-concept__search" role="search">
                <Search size={16} aria-hidden="true" />
                <span>{text.homeSearchPlaceholder}</span>
            </div>

            <p className="home-concept__section-label">{text.homeCategoriesLabel}</p>
            <div className="home-concept__chips" role="tablist" aria-label={text.homeCategoriesLabel}>
                {homeCategoryChips.map(({ id, labelKey, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={homeCategoryChip === id}
                        className={`home-concept__chip ${homeCategoryChip === id ? 'home-concept__chip--active' : ''}`}
                        onClick={() => setHomeCategoryChip(id)}
                    >
                        <Icon size={14} aria-hidden="true" />
                        {text[labelKey]}
                    </button>
                ))}
            </div>

            <p className="home-concept__section-label">{text.homeToolsLabel}</p>
            <div className="home-concept__grid">
                {visibleToolCards.map((card) => {
                    const Icon = card.icon;
                    const badgeLabel = card.badge === 'new'
                        ? text.badgeNew
                        : card.badge === 'hot'
                            ? text.badgeHot
                            : null;

                    return (
                        <button
                            key={card.id}
                            type="button"
                            className={`home-concept__card home-concept__card--${card.accent}`}
                            onClick={() => handleToolCardClick(card)}
                        >
                            {badgeLabel ? (
                                <span className={`home-concept__badge home-concept__badge--${card.badge}`}>
                                    {badgeLabel}
                                </span>
                            ) : null}
                            <span className="home-concept__card-icon" aria-hidden="true">
                                <Icon size={20} />
                            </span>
                            <span className="home-concept__card-title">{text[card.titleKey]}</span>
                            <span className="home-concept__card-sub">{text[card.subKey]}</span>
                        </button>
                    );
                })}
            </div>
        </section>
    );

    const renderCatalogScreen = () => (
        <section className="catalog-screen catalog-screen--concept">
            <header className="catalog-concept__header">
                <h1 className="catalog-concept__title">{text.catalogTitle}</h1>
                <button type="button" className="catalog-concept__filter" aria-label={text.catalogTitle}>
                    <SlidersHorizontal size={17} aria-hidden="true" />
                </button>
            </header>

            <label className="catalog-concept__search">
                <Search size={14} aria-hidden="true" />
                <input
                    type="search"
                    value={catalogSearch}
                    onChange={(event) => setCatalogSearch(event.target.value)}
                    placeholder={text.catalogSearchPlaceholder}
                />
            </label>

            <div className="catalog-concept__tabs" role="tablist" aria-label={text.catalogTitle}>
                {catalogTabs.map(({ id, labelKey }) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={catalogTab === id}
                        className={`catalog-concept__tab ${catalogTab === id ? 'catalog-concept__tab--active' : ''}`}
                        onClick={() => setCatalogTab(id)}
                    >
                        {text[labelKey]}
                    </button>
                ))}
            </div>

            {filteredCatalogSections.length === 0 ? (
                <p className="catalog-concept__empty">
                    {catalogSearchQuery
                        ? (language === 'ru' ? 'Ничего не найдено.' : 'Nothing found.')
                        : text.catalogEmptyCategory}
                </p>
            ) : null}

            {filteredCatalogSections.map((section) => (
                <div key={section.id} className="catalog-concept__section">
                    <p className="catalog-concept__section-label">{text[section.labelKey]}</p>
                    <div className="catalog-concept__grid">
                        {section.tools.map((tool) => {
                            const Icon = tool.icon;
                            const badgeTier = tool.displayTier ?? tool.badge;
                            const badgeLabel = shouldShowCatalogBadge(tool)
                                ? getCatalogBadgeLabel(badgeTier)
                                : '';

                            return (
                                <button
                                    key={tool.id}
                                    type="button"
                                    className={`catalog-concept__card ${tool.locked ? 'catalog-concept__card--locked' : ''}`}
                                    onClick={() => handleCatalogToolClick(tool)}
                                    disabled={tool.locked}
                                >
                                    {tool.locked ? (
                                        <Lock className="catalog-concept__lock" size={12} aria-hidden="true" />
                                    ) : badgeLabel ? (
                                        <span className={`catalog-concept__badge catalog-concept__badge--${badgeTier}`}>
                                            {badgeLabel}
                                        </span>
                                    ) : null}
                                    <span className={`catalog-concept__icon catalog-concept__icon--${tool.accent}`}>
                                        <Icon size={17} aria-hidden="true" />
                                    </span>
                                    <span className="catalog-concept__name">{getCatalogToolLabel(tool)}</span>
                                    <span className="catalog-concept__sub">{getCatalogToolSub(tool)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </section>
    );

    const renderAiChatScreen = () => {
        const activeModel = findTextModel(effectiveTextModels, textModel);
        const activeVisual = getTextModelVisual(activeModel);
        const ActiveIcon = activeVisual.icon;
        const activeSelectorItem = getSelectorItemForModelId(textModelSelectorItems, textModel);
        const headerTitle = activeModel?.label
            ?? getModelLabel(effectiveTextModels, textModel, textModelSelectorItems);
        const headerSubtitle = activeModel?.description
            ?? (activeSelectorItem?.type === 'tiered' && activeModel
                ? getTierLabelForModel(activeModel, text)
                : text.chatTitle);
        const supportsChatImage = textModelSupportsImage(activeModel);

        return (
            <section className="ai-chat-screen ai-chat-screen--concept" aria-label={text.chatTitle}>
                <header className="ai-chat__header">
                    <button
                        type="button"
                        className="ai-chat__back"
                        aria-label={text.back}
                        onClick={() => setCurrentPage(chatReturnPage)}
                    >
                        <ArrowLeft size={20} aria-hidden="true" />
                    </button>
                    <div className="ai-chat__header-main">
                        <span className={`ai-chat__model-icon ai-chat__model-icon--${activeVisual.accent}`}>
                            <ActiveIcon size={16} aria-hidden="true" />
                        </span>
                        <div>
                            <h1 className="ai-chat__title">{headerTitle}</h1>
                            <p className="ai-chat__subtitle">{headerSubtitle}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="ai-chat__new"
                        onClick={handleNewChatDialog}
                        disabled={isGeneratingText}
                    >
                        {text.chatNewDialog}
                    </button>
                </header>

                <div className="ai-chat__models" role="tablist" aria-label={text.textModelLabel}>
                    {textModelSelectorItems.map((item) => {
                        const isActive = item.type === 'single'
                            ? textModel === item.model.id
                            : item.variants.some((variant) => variant.id === textModel);
                        const chipModel = item.type === 'single' ? item.model : item.variants[0];
                        const chipVisual = getTextModelVisual(chipModel);
                        const ModelIcon = chipVisual.icon;
                        const chipLabel = item.type === 'single' ? item.model.label : item.label;
                        const chipKey = item.type === 'single' ? item.model.id : item.id;

                        return (
                            <button
                                key={chipKey}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                className={`ai-chat__model-chip ai-chat__model-chip--${chipVisual.accent} ${isActive ? 'ai-chat__model-chip--active' : ''}`}
                                onClick={() => handleTextModelGroupSelect(item)}
                                disabled={isGeneratingText}
                            >
                                <ModelIcon size={14} aria-hidden="true" />
                                <span>{chipLabel}</span>
                                {item.type === 'single' && getTierLabelForModel(item.model, text) ? (
                                    <span className={`ai-chat__model-tier ai-chat__model-tier--${getModelDisplayTier(item.model)}`}>
                                        {getTierLabelForModel(item.model, text)}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>

                {activeSelectorItem?.type === 'tiered' ? (
                    <div className="ai-chat__tiers" role="tablist" aria-label={text.textModelLabel}>
                        {activeSelectorItem.variants.map((variant) => {
                            const isTierActive = textModel === variant.id;
                            const tierVisual = getTextModelVisual(variant);

                            return (
                                <button
                                    key={variant.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={isTierActive}
                                    className={`ai-chat__tier-chip ai-chat__tier-chip--${tierVisual.accent} ${isTierActive ? 'ai-chat__tier-chip--active' : ''}`}
                                    onClick={() => handleTextModelChange(variant.id)}
                                    disabled={isGeneratingText}
                                >
                                    <span className={`ai-chat__model-tier ai-chat__model-tier--${getModelDisplayTier(variant)}`}>
                                        {getTierLabelForModel(variant, text)}
                                    </span>
                                    <span>{variant.label}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : null}

                <div className="ai-chat__messages" aria-live="polite">
                    {chatMessages.length === 0 && !isGeneratingText ? (
                        <p className="ai-chat__empty">{text.chatEmpty}</p>
                    ) : null}
                    {chatMessages.map((message) => (
                        <ChatMessageBubble
                            key={message.id}
                            message={message}
                            onTypingComplete={handleChatTypingComplete}
                            generatingLabel={text.chatGenerating}
                        />
                    ))}
                </div>

                {chatError ? (
                    <p className="ai-chat__inline-error" role="alert">{chatError}</p>
                ) : null}

                <footer className={`ai-chat__composer ${supportsChatImage ? '' : 'ai-chat__composer--no-attach'}`}>
                    {supportsChatImage ? (
                        <input
                            ref={chatPhotoInputRef}
                            type="file"
                            accept="image/*"
                            className="ai-chat__file-input"
                            aria-hidden="true"
                            tabIndex={-1}
                            onChange={handleChatPhotoSelect}
                        />
                    ) : null}
                    {supportsChatImage ? (
                        <button
                            type="button"
                            className="ai-chat__attach"
                            aria-label={text.chatAttachPhoto}
                            disabled={isGeneratingText}
                            onClick={() => chatPhotoInputRef.current?.click()}
                        >
                            <Paperclip size={18} aria-hidden="true" />
                        </button>
                    ) : null}
                    <div className="ai-chat__composer-field">
                        {supportsChatImage && chatAttachment ? (
                            <div className="ai-chat__attachment-preview">
                                <img src={chatAttachment.previewUrl} alt="" />
                                <button
                                    type="button"
                                    className="ai-chat__attachment-remove"
                                    aria-label={text.chatRemovePhoto}
                                    onClick={() => setChatAttachment(null)}
                                >
                                    ×
                                </button>
                            </div>
                        ) : null}
                        <textarea
                            className="ai-chat__input"
                            value={textPrompt}
                            onChange={(event) => setTextPrompt(event.target.value)}
                            onKeyDown={handleChatComposerKeyDown}
                            placeholder={text.chatPlaceholder}
                            rows={2}
                            disabled={isGeneratingText}
                        />
                    </div>
                    <button
                        type="button"
                        className={`ai-chat__send ${isGeneratingText ? 'ai-chat__send--stop' : ''}`}
                        aria-label={isGeneratingText ? text.chatStop : text.chatSend}
                        onClick={isGeneratingText ? handleStopChatGeneration : handleSendChatMessage}
                    >
                        {isGeneratingText ? (
                            <Square size={16} aria-hidden="true" fill="currentColor" />
                        ) : (
                            <Send size={18} aria-hidden="true" />
                        )}
                    </button>
                </footer>
            </section>
        );
    };

    const renderAiImageScreen = () => {
        const activeModel = getImageModelDefinition(imageModel);
        const ActiveIcon = activeModel.icon;

        return (
            <section className="ai-image-screen ai-image-screen--concept" aria-label={text.imageGenerateTitle}>
                <header className="ai-chat__header">
                    <button
                        type="button"
                        className="ai-chat__back"
                        aria-label={text.back}
                        onClick={() => setCurrentPage(imageReturnPage)}
                    >
                        <ArrowLeft size={20} aria-hidden="true" />
                    </button>
                    <div className="ai-chat__header-main">
                        <span className={`ai-chat__model-icon ai-chat__model-icon--${activeModel.accent}`}>
                            <ActiveIcon size={16} aria-hidden="true" />
                        </span>
                        <div>
                            <h1 className="ai-chat__title">{text[activeModel.nameKey]}</h1>
                            <p className="ai-chat__subtitle">{text[activeModel.subKey]}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="ai-chat__new"
                        onClick={handleNewImageDialog}
                        disabled={isGeneratingImage}
                    >
                        {text.chatNewDialog}
                    </button>
                </header>

                <div className="ai-chat__models" role="tablist" aria-label={text.imageGenerateTitle}>
                    {IMAGE_MODEL_DEFINITIONS.map((model) => {
                        const ModelIcon = model.icon;
                        const isActive = imageModel === model.id;

                        return (
                            <button
                                key={model.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                className={`ai-chat__model-chip ai-chat__model-chip--${model.accent} ${isActive ? 'ai-chat__model-chip--active' : ''}`}
                                onClick={() => handleImageModelChange(model.id)}
                                disabled={isGeneratingImage}
                            >
                                <ModelIcon size={14} aria-hidden="true" />
                                <span>{text[model.nameKey]}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="ai-image__content">
                    {isGeneratingImage ? (
                        <p className="ai-chat__empty">{text.imageGenerating}</p>
                    ) : generatedImageUrl ? (
                        <section className="ai-image__result" aria-label={text.imageResultTitle}>
                            <p className="ai-image__result-label">{text.imageResultTitle}</p>
                            <img
                                className="ai-image__preview"
                                src={generatedImageUrl}
                                alt={imagePrompt || text.imageGenerateTitle}
                            />
                        </section>
                    ) : (
                        <p className="ai-chat__empty">{text.imagePromptPlaceholder}</p>
                    )}
                </div>

                {imageError ? (
                    <p className="ai-chat__inline-error" role="alert">{imageError}</p>
                ) : null}

                <footer className="ai-chat__composer ai-chat__composer--no-attach">
                    <div className="ai-chat__composer-field">
                        <textarea
                            id="ai-image-prompt"
                            className="ai-chat__input"
                            value={imagePrompt}
                            onChange={(event) => setImagePrompt(event.target.value)}
                            onKeyDown={handleImageComposerKeyDown}
                            placeholder={text.imagePromptPlaceholder}
                            rows={2}
                            disabled={isGeneratingImage}
                        />
                    </div>
                    <button
                        type="button"
                        className="ai-chat__send"
                        aria-label={text.chatSend}
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage}
                    >
                        <Send size={18} aria-hidden="true" />
                    </button>
                </footer>
            </section>
        );
    };

    const renderAiVideoScreen = () => {
        const activeModel = getVideoModelDefinition(videoModel);
        const ActiveIcon = activeModel.icon;

        return (
            <section className="ai-image-screen ai-image-screen--concept" aria-label={text.videoGenerateTitle}>
                <header className="ai-chat__header">
                    <button
                        type="button"
                        className="ai-chat__back"
                        aria-label={text.back}
                        onClick={() => setCurrentPage(videoReturnPage)}
                    >
                        <ArrowLeft size={20} aria-hidden="true" />
                    </button>
                    <div className="ai-chat__header-main">
                        <span className={`ai-chat__model-icon ai-chat__model-icon--${activeModel.accent}`}>
                            <ActiveIcon size={16} aria-hidden="true" />
                        </span>
                        <div>
                            <h1 className="ai-chat__title">{text[activeModel.nameKey]}</h1>
                            <p className="ai-chat__subtitle">{text[activeModel.subKey]}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="ai-chat__new"
                        onClick={handleNewVideoDialog}
                        disabled={isGeneratingVideo}
                    >
                        {text.chatNewDialog}
                    </button>
                </header>

                <div className="ai-chat__models" role="tablist" aria-label={text.videoGenerateTitle}>
                    {VIDEO_MODEL_DEFINITIONS.map((model) => {
                        const ModelIcon = model.icon;
                        const isActive = videoModel === model.id;

                        return (
                            <button
                                key={model.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                className={`ai-chat__model-chip ai-chat__model-chip--${model.accent} ${isActive ? 'ai-chat__model-chip--active' : ''}`}
                                onClick={() => handleVideoModelChange(model.id)}
                                disabled={isGeneratingVideo}
                            >
                                <ModelIcon size={14} aria-hidden="true" />
                                <span>{text[model.nameKey]}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="ai-image__body">
                    <label className="ai-image__label" htmlFor="ai-video-prompt">{text.videoPromptLabel}</label>
                    <textarea
                        id="ai-video-prompt"
                        className="ai-image__prompt"
                        value={videoPrompt}
                        onChange={(event) => setVideoPrompt(event.target.value)}
                        placeholder={text.videoPromptPlaceholder}
                        rows={4}
                        disabled={isGeneratingVideo}
                    />

                    {videoError ? (
                        <p className="ai-image__inline-error" role="alert">{videoError}</p>
                    ) : null}

                    <button
                        type="button"
                        className="ai-image__submit"
                        onClick={handleGenerateVideo}
                        disabled={isGeneratingVideo}
                    >
                        {isGeneratingVideo ? text.videoGenerating : text.videoGenerateButton}
                    </button>

                    {generatedVideoUrl ? (
                        <section className="ai-image__result" aria-label={text.videoResultTitle}>
                            <p className="ai-image__result-label">{text.videoResultTitle}</p>
                            <video
                                className="ai-image__preview"
                                src={generatedVideoUrl}
                                controls
                                playsInline
                            />
                        </section>
                    ) : null}
                </div>
            </section>
        );
    };

    const renderProfileScreen = () => {
        const profileInitials = userData.displayName
            .split(' ')
            .filter(Boolean)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'CM';
        const cyberCoins = Number(walletData?.wallet?.balance ?? userData.balance ?? userData.tokens) || 0;
        const usageLimitRaw = walletData?.wallet?.monthlyLimit;
        const usageUsedRaw = walletData?.wallet?.usedThisMonth;
        const hasUsageQuota = usageLimitRaw != null && Number(usageLimitRaw) > 0;
        const usageLimit = hasUsageQuota ? Number(usageLimitRaw) : 0;
        const usageUsed = hasUsageQuota ? Number(usageUsedRaw ?? 0) : 0;
        const usagePercent = hasUsageQuota
            ? Math.min(100, Math.round((usageUsed / usageLimit) * 100))
            : 0;
        const requestsCount = historyItems.length;
        const referralsCount = referralItems.length;
        const referralBonus = referralItems.reduce((sum, item) => {
            const reward = Number(String(item.reward).replace('+', ''));
            return sum + (Number.isNaN(reward) ? 0 : reward);
        }, 0);
        const subscriptionPlanName = userData.subscriptionPlanName;
        const subscriptionPlanId = userData.subscriptionPlanId;
        const subscriptionUntil = userData.subscriptionUntil;

        return (
            <section className="profile-screen profile-screen--concept" aria-label={text.profileTitle}>
                <header className="profile-concept__header">
                    <button type="button" className="profile-concept__back" onClick={() => setCurrentPage('home')}>
                        <ChevronLeft size={16} aria-hidden="true" />
                        {text.back}
                    </button>
                    <h2 className="profile-concept__header-title">{text.profileTitle}</h2>
                    <button
                        type="button"
                        className="profile-concept__more"
                        aria-label={text.settingsTitle}
                        onClick={() => setCurrentPage('settings')}
                    >
                        <MoreHorizontal size={18} aria-hidden="true" />
                    </button>
                </header>

                <div className="profile-concept__avatar-section">
                    <div className="profile-concept__avatar">
                        {userData.avatarUrl ? (
                            <img src={userData.avatarUrl} alt={userData.displayName} />
                        ) : (
                            <span>{profileInitials}</span>
                        )}
                        {userData.subscriptionIsPaid ? (
                            <span className="profile-concept__avatar-crown" aria-hidden="true">👑</span>
                        ) : null}
                    </div>
                    <h3 className="profile-concept__user-name">{userData.displayName}</h3>
                    {userData.handle ? (
                        <p className="profile-concept__user-handle">{userData.handle}</p>
                    ) : null}
                    <p className="profile-concept__user-id">{text.profileAppUserId}: {userData.appUserId}</p>
                    <div className={`profile-concept__plan-badge ${subscriptionPlanId === 'free' ? 'profile-concept__plan-badge--free' : ''}`}>
                        <Zap size={12} aria-hidden="true" />
                        {subscriptionPlanId === 'free'
                            ? text.profilePlanBadgeFree
                            : formatTemplate(text.profilePlanBadge, { plan: subscriptionPlanName })}
                    </div>
                </div>

                <div className="profile-concept__stats">
                    <div className="profile-concept__stat">
                        <div className="profile-concept__stat-val">{formatNumber(requestsCount)}</div>
                        <div className="profile-concept__stat-label">{text.profileStatRequests}</div>
                    </div>
                    <div className="profile-concept__stat">
                        <div className="profile-concept__stat-val">{formatNumber(referralsCount)}</div>
                        <div className="profile-concept__stat-label">{text.profileStatReferrals}</div>
                    </div>
                    <div className="profile-concept__stat">
                        <div className="profile-concept__stat-val">{formatNumber(cyberCoins)}</div>
                        <div className="profile-concept__stat-label">{text.profileStatCoins}</div>
                    </div>
                </div>

                <article className="profile-concept__balance-card">
                    <div className="profile-concept__balance-top">
                        <div>
                            <div className="profile-concept__balance-label">{text.profileBalanceLabel}</div>
                            <div className="profile-concept__balance-amount">
                                <span className="profile-concept__coin-icon">C</span>
                                <span className="profile-concept__balance-num">{formatNumber(cyberCoins)}</span>
                            </div>
                        </div>
                        <button type="button" className="profile-concept__topup-btn" onClick={() => setCurrentPage('wallet')}>
                            <Plus size={12} aria-hidden="true" />
                            {text.profileTopUp}
                        </button>
                    </div>
                    {hasUsageQuota ? (
                        <div className="profile-concept__usage">
                            <div className="profile-concept__usage-row">
                                <span>{text.profileUsageLabel}</span>
                                <span>{formatNumber(usageUsed)} / {formatNumber(usageLimit)}</span>
                            </div>
                            <div className="profile-concept__bar-track">
                                <div className="profile-concept__bar-fill" style={{ width: `${usagePercent}%` }} />
                            </div>
                        </div>
                    ) : null}
                </article>

                <p className="profile-concept__section-lbl">{text.profileAccountSection}</p>
                <div className="profile-concept__menu-list">
                    <button type="button" className="profile-concept__menu-item" onClick={() => setCurrentPage('wallet')}>
                        <span className="profile-concept__menu-ico profile-concept__menu-ico--violet"><Crown size={16} /></span>
                        <span className="profile-concept__menu-text">
                            <span className="profile-concept__menu-title">{text.profileMenuSubscription}</span>
                            <span className="profile-concept__menu-sub">
                                {subscriptionPlanId === 'free'
                                    ? subscriptionPlanName
                                    : formatTemplate(text.profileMenuSubscriptionSub, { plan: subscriptionPlanName, date: subscriptionUntil })}
                            </span>
                        </span>
                        <ChevronRight className="profile-concept__menu-arrow" size={16} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="profile-concept__menu-item"
                        onClick={() => {
                            setHistoryReturnPage('profile');
                            setCurrentPage('history');
                        }}
                    >
                        <span className="profile-concept__menu-ico profile-concept__menu-ico--pink"><History size={16} /></span>
                        <span className="profile-concept__menu-text">
                            <span className="profile-concept__menu-title">{text.profileMenuHistory}</span>
                            <span className="profile-concept__menu-sub">
                                {formatTemplate(text.profileMenuHistorySub, { count: requestsCount })}
                            </span>
                        </span>
                        <ChevronRight className="profile-concept__menu-arrow" size={16} aria-hidden="true" />
                    </button>
                    <button type="button" className="profile-concept__menu-item" onClick={() => setCurrentPage('referrals')}>
                        <span className="profile-concept__menu-ico profile-concept__menu-ico--green"><Users size={16} /></span>
                        <span className="profile-concept__menu-text">
                            <span className="profile-concept__menu-title">{text.profileMenuReferrals}</span>
                            <span className="profile-concept__menu-sub">
                                {formatTemplate(text.profileMenuReferralsSub, { count: referralsCount, bonus: referralBonus || 300 })}
                            </span>
                        </span>
                        <span className="profile-concept__menu-tag">{text.profileReferralBonusTag}</span>
                        <ChevronRight className="profile-concept__menu-arrow" size={16} aria-hidden="true" />
                    </button>
                </div>

                <p className="profile-concept__section-lbl">{text.profileSettingsSection}</p>
                <div className="profile-concept__menu-list profile-concept__menu-list--settings">
                    <button type="button" className="profile-concept__menu-item" onClick={() => setCurrentPage('settings')}>
                        <span className="profile-concept__menu-ico profile-concept__menu-ico--muted"><Languages size={16} /></span>
                        <span className="profile-concept__menu-text">
                            <span className="profile-concept__menu-title">{text.profileMenuLanguage}</span>
                            <span className="profile-concept__menu-sub">{text.languageNames[language]}</span>
                        </span>
                        <ChevronRight className="profile-concept__menu-arrow" size={16} aria-hidden="true" />
                    </button>
                    <button type="button" className="profile-concept__menu-item" onClick={toggleTheme}>
                        <span className="profile-concept__menu-ico profile-concept__menu-ico--muted"><Moon size={16} /></span>
                        <span className="profile-concept__menu-text">
                            <span className="profile-concept__menu-title">{text.profileMenuDarkTheme}</span>
                        </span>
                        <span className={`profile-concept__toggle ${theme === 'dark' ? 'profile-concept__toggle--on' : ''}`} aria-hidden="true">
                            <span className="profile-concept__toggle-knob" />
                        </span>
                    </button>
                </div>

            </section>
        );
    };

    const renderReferralScreen = () => {
        const referralsCount = referralItems.length;
        const referralBonus = referralItems.reduce((sum, item) => {
            const reward = Number(String(item.reward).replace('+', ''));
            return sum + (Number.isNaN(reward) ? 0 : reward);
        }, 0);

        return (
            <section className="referral-screen referral-screen--concept">
                {renderConceptPageHeader(text.referralProgramTitle, () => setCurrentPage('profile'))}

                <article className="referral-concept__hero">
                    <div className="referral-concept__hero-icon">
                        <Users size={22} aria-hidden="true" />
                    </div>
                    <p className="referral-concept__hero-text">{text.referralIntro}</p>
                    <div className="referral-concept__stats">
                        <div className="referral-concept__stat">
                            <span className="referral-concept__stat-val">{formatNumber(referralsCount)}</span>
                            <span className="referral-concept__stat-label">{text.referralStatFriends}</span>
                        </div>
                        <div className="referral-concept__stat">
                            <span className="referral-concept__stat-val referral-concept__stat-val--gold">
                                +{formatNumber(referralBonus || 0)}
                            </span>
                            <span className="referral-concept__stat-label">{text.referralStatEarned}</span>
                        </div>
                    </div>
                </article>

                <p className="profile-concept__section-lbl">{text.referralHowTitle}</p>
                <div className="referral-concept__steps">
                    <div className="referral-concept__step">
                        <span className="referral-concept__step-num">1</span>
                        <span>{text.referralHowStep1}</span>
                    </div>
                    <div className="referral-concept__step">
                        <span className="referral-concept__step-num">2</span>
                        <span>{text.referralHowStep2}</span>
                    </div>
                    <div className="referral-concept__step">
                        <span className="referral-concept__step-num">3</span>
                        <span>{text.referralHowStep3}</span>
                    </div>
                </div>

                <p className="profile-concept__section-lbl">{text.referralLinkTitle}</p>
                <div className="referral-concept__link-card">
                    <p className="referral-concept__link-url">
                        {referralLinkLoading ? text.loading : (referralLink || '—')}
                    </p>
                    <button
                        type="button"
                        className="referral-concept__copy-btn"
                        onClick={handleReferralLinkCopy}
                        disabled={referralLinkLoading || !referralLink}
                    >
                        <Copy size={14} aria-hidden="true" />
                        {text.referralCopyButton}
                    </button>
                </div>

                <p className="profile-concept__section-lbl">{text.activeReferralsTitle}</p>
                <div className="profile-concept__menu-list">
                    {pageLoading.referrals ? (
                        <p className="referral-concept__empty">{text.loading}</p>
                    ) : null}
                    {!pageLoading.referrals && referralItems.length === 0 ? (
                        <p className="referral-concept__empty">{text.referralEmpty}</p>
                    ) : null}
                    {referralItems.map((item) => {
                        const initial = item.name?.trim()?.[0]?.toUpperCase() || '?';

                        return (
                            <div key={item.id} className="referral-concept__friend">
                                <span className="referral-concept__friend-avatar">{initial}</span>
                                <span className="referral-concept__friend-name">{item.name}</span>
                                <span className="referral-concept__friend-reward">{item.reward}</span>
                            </div>
                        );
                    })}
                </div>
            </section>
        );
    };

    const renderWalletScreen = () => {
        const cyberCoins = Number(walletData?.wallet?.balance ?? userData.balance ?? 0) || 0;
        const balanceAvailable = Number(walletData?.wallet?.balanceAvailable ?? cyberCoins) || 0;
        const totalEarned = Number(walletData?.wallet?.totalEarned ?? 0) || 0;
        const currentPlanId = userData.subscriptionPlanId;

        return (
            <section className="wallet-screen wallet-screen--concept">
                {renderConceptPageHeader(text.walletPageTitle, () => setCurrentPage('profile'))}

                <p className="profile-concept__section-lbl">{text.walletCurrentPlan}</p>
                <div className="subscription-concept__current">
                    <Crown size={16} aria-hidden="true" />
                    <span>{userData.subscriptionPlanName}</span>
                </div>

                <article className="profile-concept__balance-card subscription-concept__balance">
                    <div className="subscription-concept__balance-grid">
                        <div className="subscription-concept__balance-item">
                            <span className="subscription-concept__balance-label">{text.walletBalanceTotal}</span>
                            <span className="subscription-concept__balance-value">
                                <span className="profile-concept__coin-icon">C</span>
                                {formatNumber(cyberCoins)}
                            </span>
                        </div>
                        <div className="subscription-concept__balance-item">
                            <span className="subscription-concept__balance-label">{text.walletBalanceAvailable}</span>
                            <span className="subscription-concept__balance-value">{formatNumber(balanceAvailable)}</span>
                        </div>
                        <div className="subscription-concept__balance-item">
                            <span className="subscription-concept__balance-label">{text.walletBalanceEarned}</span>
                            <span className="subscription-concept__balance-value subscription-concept__balance-value--gold">
                                {formatNumber(totalEarned)}
                            </span>
                        </div>
                    </div>
                </article>

                <div className="profile-concept__plans subscription-concept__plans">
                    <h3 className="profile-concept__plans-title">{text.profilePlansTitle}</h3>
                    <p className="profile-concept__plans-sub">{text.profilePlansSub}</p>
                    {renderSubscriptionPlanCards(currentPlanId)}
                </div>

                <p className="profile-concept__section-lbl">{text.walletTransactionsTitle}</p>
                <div className="profile-concept__menu-list">
                    {pageLoading.wallet ? (
                        <p className="referral-concept__empty">{text.loading}</p>
                    ) : null}
                    {!pageLoading.wallet && walletTransactions.length === 0 ? (
                        <p className="referral-concept__empty">{text.walletTransactionsEmpty}</p>
                    ) : null}
                    {walletTransactions.map((item) => (
                        <div key={item.id} className="subscription-concept__tx">
                            <span className="subscription-concept__tx-name">{item.description || item.type}</span>
                            <span className={`subscription-concept__tx-amount ${item.amount < 0 ? 'subscription-concept__tx-amount--minus' : ''}`}>
                                {`${item.amount > 0 ? '+' : ''}${item.amount}`}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        );
    };

    const renderHistoryScreen = () => (
        <section className="history-screen history-screen--concept">
            <header className="concept-page__header">
                <button
                    type="button"
                    className="concept-page__back"
                    onClick={() => setCurrentPage(historyReturnPage)}
                >
                    <ChevronLeft size={16} aria-hidden="true" />
                    {text.back}
                </button>
                <h1 className="concept-page__title">{text.historyTitle}</h1>
                <div className="history-concept__actions">
                    <button type="button" className="history-concept__action" aria-label="Download">
                        <Download size={17} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="history-concept__action"
                        aria-label="Delete"
                        onClick={handleClearHistoryRequest}
                    >
                        <Trash2 size={17} aria-hidden="true" />
                    </button>
                </div>
            </header>

            <div className="history-concept__filters" role="tablist" aria-label={text.historyTitle}>
                {historyFilterTabs.map(({ id, labelKey }) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={historyFilter === id}
                        className={`history-concept__filter ${historyFilter === id ? 'history-concept__filter--active' : ''}`}
                        onClick={() => setHistoryFilter(id)}
                    >
                        {text[labelKey]}
                    </button>
                ))}
            </div>

            {pageLoading.history ? (
                <p className="history-concept__empty">{text.loading}</p>
            ) : null}

            {!pageLoading.history && historyTopicGroups.length === 0 ? (
                <p className="history-concept__empty">{text.historyEmpty}</p>
            ) : null}

            {historyTopicGroups.map((group) => (
                <div key={group.id} className="history-concept__group">
                    <p className="history-concept__group-label">{group.label}</p>
                    <div className="history-concept__list">
                        {group.topics.map((topic) => {
                            const visual = getHistoryVisual(topic.model);
                            const ThumbIcon = visual.icon;
                            const toolName = getModelLabel(
                                effectiveTextModels,
                                resolveTextModelId(topic.model, effectiveTextModels),
                                textModelSelectorItems,
                            ) || visual.toolName;

                            return (
                                <article
                                    key={topic.id}
                                    className="history-concept__item history-concept__item--clickable"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openHistoryTopic(topic)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            openHistoryTopic(topic);
                                        }
                                    }}
                                >
                                    <div className={`history-concept__thumb history-concept__thumb--${visual.accent}`}>
                                        <ThumbIcon size={18} aria-hidden="true" />
                                    </div>
                                    <div className="history-concept__info">
                                        <div className="history-concept__top">
                                            <span className={`history-concept__tool history-concept__tool--${visual.accent}`}>
                                                {toolName}
                                            </span>
                                            <span className="history-concept__time">
                                                {formatHistoryTime(topic.lastItem?.createdAt)}
                                            </span>
                                        </div>
                                        <p className="history-concept__prompt">{topic.topicTitle}</p>
                                        <div className="history-concept__meta">
                                            <span className={`history-concept__tag history-concept__tag--${visual.accent}`}>
                                                {formatTemplate(text.historyTopicMessages, { count: topic.messageCount })}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="history-concept__result"
                                        aria-label={text.chatTitle}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            openHistoryTopic(topic);
                                        }}
                                    >
                                        {visual.emoji ? (
                                            <span>{visual.emoji}</span>
                                        ) : (
                                            <MessageSquare size={14} aria-hidden="true" />
                                        )}
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                </div>
            ))}
        </section>
    );

    const renderSettingsScreen = () => {
        const handleSupportClick = async () => {
            const url = await resolveSupportUrl();
            openSupport(url);
        };

        const languageOptions = [
            { id: 'ru', label: text.settingsLanguageRu, flag: '🇷🇺' },
            { id: 'en', label: text.settingsLanguageEn, flag: '🇬🇧' },
        ];

        return (
            <section className="settings-screen settings-screen--concept">
                {renderConceptPageHeader(text.settingsTitle, () => setCurrentPage('profile'))}

                <p className="profile-concept__section-lbl">{text.settingsLanguageSection}</p>
                <div className="settings-concept__lang-grid">
                    {languageOptions.map((option) => {
                        const isActive = language === option.id;

                        return (
                            <button
                                key={option.id}
                                type="button"
                                className={`settings-concept__lang-card ${isActive ? 'settings-concept__lang-card--active' : ''}`}
                                aria-pressed={isActive}
                                onClick={() => setLanguage(option.id)}
                            >
                                <span className="settings-concept__lang-flag" aria-hidden="true">{option.flag}</span>
                                <span className="settings-concept__lang-label">{option.label}</span>
                                {isActive ? <Check className="settings-concept__lang-check" size={16} aria-hidden="true" /> : null}
                            </button>
                        );
                    })}
                </div>

                <p className="profile-concept__section-lbl">{text.settingsAppearanceSection}</p>
                <div className="profile-concept__menu-list">
                    <button type="button" className="profile-concept__menu-item" onClick={toggleTheme}>
                        <span className="profile-concept__menu-ico profile-concept__menu-ico--muted">
                            {theme === 'dark' ? <Moon size={16} /> : <SunMedium size={16} />}
                        </span>
                        <span className="profile-concept__menu-text">
                            <span className="profile-concept__menu-title">{text.themeLabel.replace(':', '')}</span>
                            <span className="profile-concept__menu-sub">{text.themeNames[theme]}</span>
                        </span>
                        <span className={`profile-concept__toggle ${theme === 'dark' ? 'profile-concept__toggle--on' : ''}`} aria-hidden="true">
                            <span className="profile-concept__toggle-knob" />
                        </span>
                    </button>
                    <button type="button" className="profile-concept__menu-item" onClick={handleSupportClick}>
                        <span className="profile-concept__menu-ico profile-concept__menu-ico--green">
                            <MessageSquare size={16} />
                        </span>
                        <span className="profile-concept__menu-text">
                            <span className="profile-concept__menu-title">{text.supportLabel}</span>
                            <span className="profile-concept__menu-sub">{text.settingsSupportSub}</span>
                        </span>
                        <ChevronRight className="profile-concept__menu-arrow" size={16} aria-hidden="true" />
                    </button>
                </div>
            </section>
        );
    };

    const renderInfoScreen = () => {
        const screenConfig = {
            wallet: {
                eyebrow: 'Wallet',
                title: text.walletTitle,
                description: text.walletDescription,
                meta: [
                    { label: text.statusLabel, value: isLoading ? text.syncing : text.ready },
                    { label: text.versionLabel, value: text.releaseVersion },
                ],
            },
            referrals: {
                eyebrow: 'Referral',
                title: text.referralsTitle,
                description: text.referralsDescription,
                meta: [
                    { label: text.startParam, value: startParam || '—' },
                    { label: text.statusLabel, value: isLoading ? text.loading : text.waiting },
                ],
            },
        };

        const currentScreen = screenConfig[currentPage];

        return (
            <section className="info-screen">
                <div className="info-card-shell">
                    <span className="info-eyebrow">{currentScreen.eyebrow}</span>
                    <h2 className="info-title">{currentScreen.title}</h2>
                    <p className="info-description">{currentScreen.description}</p>

                    <div className="info-list">
                        {currentScreen.meta.map((item) => (
                            <div key={item.label} className="info-list__row">
                                <span>{item.label}</span>
                                <strong>{item.value}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    };

    return (
        <div className="app-shell" data-page={currentPage}>
            <main className="app-main">
                {currentPage === 'home'
                    ? renderHomeScreen()
                    : currentPage === 'catalog'
                        ? renderCatalogScreen()
                        : currentPage === 'profile'
                            ? renderProfileScreen()
                            : currentPage === 'settings'
                                ? renderSettingsScreen()
                                : currentPage === 'referrals'
                                    ? renderReferralScreen()
                                    : currentPage === 'wallet'
                                        ? renderWalletScreen()
                                        : currentPage === 'history'
                                            ? renderHistoryScreen()
                                            : currentPage === 'ai-chat'
                                                ? renderAiChatScreen()
                                                : currentPage === 'ai-image'
                                                    ? renderAiImageScreen()
                                                    : currentPage === 'ai-video'
                                                        ? renderAiVideoScreen()
                                                        : renderInfoScreen()}
            </main>

            {showBottomNav ? (
                <nav className="bottom-nav bottom-nav--concept" aria-label={language === 'ru' ? 'Основная навигация' : 'Main navigation'}>
                    <div className="bottom-nav__inner">
                        {navigationItems.map(({ key, labelKey, icon: Icon }) => {
                            const isActive = activeNavKey === key;
                            const label = text[labelKey];

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={`nav-button ${isActive ? 'nav-button--active' : ''}`}
                                    aria-label={label}
                                    aria-current={isActive ? 'page' : undefined}
                                    onClick={() => {
                                        if (key === 'history') {
                                            setHistoryReturnPage('home');
                                        }
                                        setCurrentPage(key);
                                        setIsLanguageMenuOpen(false);
                                    }}
                                >
                                    <Icon size={19} aria-hidden="true" />
                                    <span className="nav-button__label">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>
            ) : null}

            <AppNotice notice={appNotice} onDismiss={clearAppNotice} />

            {confirmDialog ? (
                <div className="app-confirm" role="dialog" aria-modal="true">
                    <div className="app-confirm__backdrop" onClick={() => setConfirmDialog(null)} />
                    <div className="app-confirm__panel">
                        <p className="app-confirm__message">{confirmDialog.message}</p>
                        <div className="app-confirm__actions">
                            <button
                                type="button"
                                className="app-confirm__btn app-confirm__btn--ghost"
                                onClick={() => setConfirmDialog(null)}
                            >
                                {confirmDialog.cancelLabel}
                            </button>
                            <button
                                type="button"
                                className="app-confirm__btn app-confirm__btn--danger"
                                onClick={async () => {
                                    const action = confirmDialog.onConfirm;
                                    setConfirmDialog(null);
                                    await action?.();
                                }}
                            >
                                {confirmDialog.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default App;
