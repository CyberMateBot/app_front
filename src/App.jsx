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
    LogOut,
    Image as ImageIcon,
    LayoutGrid,
    Menu,
    MessageSquare,
    Mic,
    Moon,
    MoreHorizontal,
    Music2,
    Plus,
    Search,
    Settings,
    SlidersHorizontal,
    Send,
    Square,
    Sparkles,
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
    buildReferralLink,
    getMyProfile,
    getMyPromptHistory,
    getMyReferrals,
    getMyWallet,
    normalizeProfileResponse,
    generateImage,
    generateText,
    registerTelegramUser,
    savePromptHistory,
    TEXT_MODEL_IDS,
} from './api/telegramApi.js';
import {
    buildChatContextMessages,
    buildImageContextMessages,
    getChatTopicTitle,
    groupHistoryIntoTopics,
} from './lib/chatContext.js';
import AppNotice from './Components/AppNotice.jsx';
import ChatMessageBubble from './Components/ChatMessageBubble.jsx';
import {
    IMAGE_MODEL_DEFINITIONS,
    TEXT_MODEL_DEFINITIONS,
    catalogSectionsFromModels,
    getImageModelDefinition,
    getTextModelDefinition,
} from './config/aiModels.js';
import './App.css';
import { formatUserFacingError } from './api/apiError.js';
import { APP_NAME, BOT_USERNAME, ENABLE_TELEGRAM_MOCK } from './config/env.js';
import { deriveSubscriptionView } from './lib/subscriptionView.js';
import { initTelegramMiniAppAsync } from './lib/telegramWebApp.js';

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

const catalogSections = catalogSectionsFromModels;

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
        promoTitle: 'Sora — генерация видео',
        promoSub: 'Создай ролик из текста за 60 сек',
        promoButton: 'Попробовать',
        badgeNew: 'NEW',
        badgeHot: 'HOT',
        badgePro: 'PRO',
        badgeFree: 'FREE',
        toolChatTitle: 'AI Чат',
        toolChatSub: 'YandexGPT, DeepSeek, Gemini, OpenAI',
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
        modelNanoBananaSub: 'Gemini 2.5 Flash Image',
        modelAliceAIArtName: 'Alice AI ART',
        modelAliceAIArtSub: 'Yandex · генерация изображений',
        imageGenerateTitle: 'Генерация фото',
        imagePromptLabel: 'Описание',
        imagePromptPlaceholder: 'Опишите изображение, которое нужно создать...',
        imageGenerateButton: 'Сгенерировать',
        imageGenerating: 'Генерация...',
        imageResultTitle: 'Результат',
        imageGenerateEmpty: 'Изображение не получено. Попробуйте другой промт.',
        imageGeneratedNote: 'Изображение создано.',
        imageContentPolicy: 'Модель отклонила запрос. Попробуйте другую формулировку без запрещённых тем.',
        chatTitle: 'AI Чат',
        chatEmpty: 'Напишите сообщение — модель ответит здесь.',
        chatPlaceholder: 'Сообщение...',
        chatSend: 'Отправить',
        chatStop: 'Остановить',
        chatTyping: 'Модель печатает...',
        chatNewDialog: 'Новый диалог',
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
        profilePlanBadge: '{plan} подписка',
        profileStatRequests: 'Запросов',
        profileStatProjects: 'Проектов',
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
        profileMenuLogout: 'Выйти',
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
            '100 видео (Sora, Runway)',
            'API доступ',
            '+2000 CyberCoins/мес',
            'Приоритетная очередь',
        ],
        textGenerateTitle: 'Генерация текста',
        textModelLabel: 'Нейросеть',
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
        promoTitle: 'Sora — video generation',
        promoSub: 'Create a clip from text in 60 sec',
        promoButton: 'Try it',
        badgeNew: 'NEW',
        badgeHot: 'HOT',
        badgePro: 'PRO',
        badgeFree: 'FREE',
        toolChatTitle: 'AI Chat',
        toolChatSub: 'YandexGPT, DeepSeek, Gemini, OpenAI',
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
        modelNanoBananaSub: 'Gemini 2.5 Flash Image',
        modelAliceAIArtName: 'Alice AI ART',
        modelAliceAIArtSub: 'Yandex · генерация изображений',
        imageGenerateTitle: 'Image generation',
        imagePromptLabel: 'Description',
        imagePromptPlaceholder: 'Describe the image you want to create...',
        imageGenerateButton: 'Generate',
        imageGenerating: 'Generating...',
        imageResultTitle: 'Result',
        imageGenerateEmpty: 'No image returned. Try a different prompt.',
        imageGeneratedNote: 'Image created.',
        imageContentPolicy: 'The model rejected this prompt. Try a different wording.',
        chatTitle: 'AI Chat',
        chatEmpty: 'Send a message — the model will reply here.',
        chatPlaceholder: 'Message...',
        chatSend: 'Send',
        chatStop: 'Stop',
        chatTyping: 'Model is typing...',
        chatNewDialog: 'New chat',
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
        profilePlanBadge: '{plan} plan',
        profileStatRequests: 'Requests',
        profileStatProjects: 'Projects',
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
        profileMenuLogout: 'Log out',
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
            '100 videos (Sora, Runway)',
            'API access',
            '+2000 CyberCoins/mo',
            'Priority queue',
        ],
        textGenerateTitle: 'Text generation',
        textModelLabel: 'Model',
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
    const displayName = [profile?.name, profile?.surname].filter(Boolean).join(' ')
        || telegramUser?.first_name
        || 'Telegram User';

    const rawUsername = profile?.username || telegramUser?.username || '';
    const fallbackHandle = telegramUser?.id ? `@${telegramUser.id}` : '@2281448';
    const handle = rawUsername && rawUsername !== 'username_not_set' ? `@${rawUsername}` : fallbackHandle;
    const balance = String(profile?.balance ?? profile?.coins ?? profile?.points ?? 0);
    const tokens = String(profile?.tokens ?? profile?.tokenBalance ?? profile?.points ?? balance);

    return {
        displayName,
        username: rawUsername || 'username_not_set',
        handle,
        telegramId: profile?.telegramId || (telegramUser?.id ? String(telegramUser.id) : '—'),
        backendId: profile?.backendId || '—',
        language: profile?.language || telegramUser?.language_code || 'ru',
        avatarUrl: profile?.avatarUrl || telegramUser?.photo_url || '',
        balance,
        tokens,
    };
}

function getInitialTheme() {
    if (typeof window === 'undefined') {
        return 'dark';
    }

    return window.localStorage.getItem('cybermate-theme') === 'light' ? 'light' : 'dark';
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

function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [profile, setProfile] = useState(null);
    const [telegramUser, setTelegramUser] = useState(null);
    const [startParam, setStartParam] = useState('');
    const [appNotice, setAppNotice] = useState(null);
    const [chatError, setChatError] = useState('');
    const [imageError, setImageError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [walletData, setWalletData] = useState(null);
    const [referralData, setReferralData] = useState(null);
    const [promptHistoryData, setPromptHistoryData] = useState(null);
    const [pageLoading, setPageLoading] = useState({ wallet: false, referrals: false, history: false });
    const [promptDraft, setPromptDraft] = useState('');
    const [promptCategory, setPromptCategory] = useState('general');
    const [isSavingPrompt, setIsSavingPrompt] = useState(false);
    const [theme, setTheme] = useState(getInitialTheme);
    const [language, setLanguage] = useState(getInitialLanguage);
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const [textPrompt, setTextPrompt] = useState('');
    const [textModel, setTextModel] = useState('yandexgpt');
    const [imageModel, setImageModel] = useState('nano-banana');
    const [imagePrompt, setImagePrompt] = useState('');
    const [imageSessionMessages, setImageSessionMessages] = useState([]);
    const [generatedImageUrl, setGeneratedImageUrl] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const [chatTopicTitle, setChatTopicTitle] = useState('');
    const [chatReturnPage, setChatReturnPage] = useState('catalog');
    const [imageReturnPage, setImageReturnPage] = useState('catalog');
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const textGenerationAbortRef = useRef(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [homeCategoryChip, setHomeCategoryChip] = useState('all');
    const [catalogTab, setCatalogTab] = useState('all');
    const [catalogSearch, setCatalogSearch] = useState('');
    const [historyFilter, setHistoryFilter] = useState('all');

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
                const tg = await initTelegramMiniAppAsync({ timeoutMs: 6000 });
                currentTelegramUser = tg?.initDataUnsafe?.user ?? null;
                const currentStartParam = tg?.initDataUnsafe?.start_param ?? '';

                if (!isMounted) {
                    return;
                }

                setTelegramUser(currentTelegramUser);
                setStartParam(currentStartParam);

                if (!tg) {
                    showAppNotice(
                        ENABLE_TELEGRAM_MOCK
                            ? 'Не удалось инициализировать Telegram mock.'
                            : 'Telegram WebApp SDK не найден. Откройте Mini App внутри Telegram (не во внешнем браузере) или включите VITE_ENABLE_TELEGRAM_MOCK=true.',
                    );
                    return;
                }

                if (!currentTelegramUser?.id) {
                    const platform = tg.platform ?? 'unknown';
                    showAppNotice(
                        platform === 'tdesktop'
                            ? 'Не удалось прочитать пользователя Telegram Desktop. Закройте и снова откройте Mini App из бота или обновите Telegram Desktop.'
                            : 'Не удалось прочитать данные пользователя Telegram. Откройте Mini App из бота.',
                    );
                    return;
                }

                await registerTelegramUser();
                const backendProfile = await getMyProfile();

                if (!isMounted) {
                    return;
                }

                setProfile(normalizeProfileResponse(backendProfile, currentTelegramUser));
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
        if (typeof document !== 'undefined') {
            document.documentElement.dataset.theme = theme;
            document.documentElement.style.colorScheme = theme;
        }

        if (typeof window !== 'undefined') {
            window.localStorage.setItem('cybermate-theme', theme);
        }
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
        if (!telegramUser?.id) {
            return;
        }

        let isCancelled = false;

        const loadPageData = async () => {
            const needWallet = (currentPage === 'wallet' || currentPage === 'profile') && walletData === null;
            const needReferrals = (currentPage === 'referrals' || currentPage === 'profile') && referralData === null;
            const needHistory = promptHistoryData === null
                && (currentPage === 'history' || currentPage === 'profile');

            if (needWallet) {
                setPageLoading((prev) => ({ ...prev, wallet: true }));
            }
            if (needReferrals) {
                setPageLoading((prev) => ({ ...prev, referrals: true }));
            }
            if (needHistory) {
                setPageLoading((prev) => ({ ...prev, history: true }));
            }

            try {
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
                            }),
                    );
                }

                await Promise.allSettled(tasks);
            } finally {
                if (!isCancelled) {
                    setPageLoading((prev) => ({
                        ...prev,
                        wallet: currentPage === 'wallet' || currentPage === 'profile' ? false : prev.wallet,
                        referrals: currentPage === 'referrals' || currentPage === 'profile' ? false : prev.referrals,
                        history: currentPage === 'history' || currentPage === 'profile' ? false : prev.history,
                    }));
                }
            }
        };

        loadPageData();

        return () => {
            isCancelled = true;
        };
    }, [currentPage, telegramUser?.id, walletData, referralData, promptHistoryData]);

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
    const referralLink = useMemo(() => buildReferralLink(telegramUser, startParam), [telegramUser, startParam]);
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
        : currentPage === 'ai-chat' || currentPage === 'ai-image'
            ? 'catalog'
            : ['home', 'catalog', 'history', 'profile'].includes(currentPage)
                ? currentPage
                : 'home';

    const showBottomNav = !['ai-chat', 'ai-image', 'settings', 'wallet', 'referrals'].includes(currentPage);

    const toolMatchesCatalogTab = (tool, tab) => tab === 'all' || tool.tab === tab || tool.categories?.includes(tab);

    const catalogSearchQuery = catalogSearch.trim().toLowerCase();

    const filteredCatalogSections = catalogSections
        .map((section) => ({
            ...section,
            tools: section.tools.filter((tool) => {
                const matchesTab = toolMatchesCatalogTab(tool, catalogTab);
                const matchesSearch = !catalogSearchQuery
                    || text[tool.nameKey].toLowerCase().includes(catalogSearchQuery)
                    || text[tool.subKey].toLowerCase().includes(catalogSearchQuery);
                return matchesTab && matchesSearch;
            }),
        }))
        .filter((section) => section.tools.length > 0);

    const getCatalogBadgeLabel = (badge) => {
        if (badge === 'hot') return text.badgeHot;
        if (badge === 'new') return text.badgeNew;
        if (badge === 'pro') return text.badgePro;
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
                return TEXT_MODEL_IDS.includes(modelId)
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
    }, [historyItems, historyFilter]);

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

    const getHistoryVisual = (category) => {
        const value = String(category || '').toLowerCase();
        const allModels = [...TEXT_MODEL_DEFINITIONS, ...IMAGE_MODEL_DEFINITIONS];
        const modelFromCategory = allModels.find((model) => (
            value === model.id || value.includes(model.id)
        ));

        if (modelFromCategory) {
            return {
                accent: modelFromCategory.accent,
                icon: modelFromCategory.icon,
                toolName: text[modelFromCategory.nameKey],
                emoji: null,
            };
        }

        if (value.includes('text') || value.includes('chat')) {
            const fallback = getTextModelDefinition('yandexgpt');
            return {
                accent: fallback.accent,
                icon: fallback.icon,
                toolName: text[fallback.nameKey],
                emoji: null,
            };
        }

        return { accent: 'violet', icon: Bot, toolName: text.chatTitle, emoji: null };
    };

    const openAiChat = (modelId, returnPage = currentPage) => {
        if (modelId) {
            setTextModel(modelId);
        }
        setChatMessages([]);
        setChatTopicTitle('');
        setTextPrompt('');
        setChatReturnPage(returnPage);
        setChatError('');
        setCurrentPage('ai-chat');
    };

    const handleTextModelChange = (modelId) => {
        handleStopChatGeneration();
        setTextModel(modelId);
        setChatMessages([]);
        setChatTopicTitle('');
        setTextPrompt('');
        setChatError('');
    };

    const handleImageModelChange = (modelId) => {
        setImageModel(modelId);
        setImagePrompt('');
        setGeneratedImageUrl('');
        setImageError('');
    };

    const openAiImage = (modelId, returnPage = currentPage) => {
        if (modelId) {
            setImageModel(modelId);
        }
        setImageSessionMessages([]);
        setImagePrompt('');
        setGeneratedImageUrl('');
        setImageReturnPage(returnPage);
        setImageError('');
        setCurrentPage('ai-image');
    };

    const handleCatalogToolClick = (tool) => {
        if (tool.locked) {
            return;
        }

        if (tool.page === 'ai-image') {
            openAiImage(tool.id, 'catalog');
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

    const handleNewChatDialog = () => {
        handleStopChatGeneration();
        setChatMessages([]);
        setChatTopicTitle('');
        setTextPrompt('');
        setChatError('');
    };

    const handleReferralLinkCopy = async () => {
        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
            return;
        }

        try {
            await navigator.clipboard.writeText(referralLink);
            showAppNotice(text.referralCopied, 'success');
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
    }, []);

    const handleSendChatMessage = async () => {
        if (isGeneratingText) {
            return;
        }

        const trimmedPrompt = textPrompt.trim();

        if (!trimmedPrompt) {
            setChatError(text.textPromptEmpty);
            return;
        }

        const contextMessages = buildChatContextMessages(chatMessages);

        if (!chatTopicTitle) {
            setChatTopicTitle(getChatTopicTitle(trimmedPrompt));
        }

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmedPrompt,
        };

        setChatMessages((prev) => [...prev, userMessage]);
        setTextPrompt('');

        const abortController = new AbortController();
        textGenerationAbortRef.current = abortController;

        try {
            setIsGeneratingText(true);
            setChatError('');
            const response = await generateText({
                prompt: trimmedPrompt,
                model: textModel,
                messages: contextMessages,
                signal: abortController.signal,
            });
            const resultText = response?.text?.trim() ?? '';

            if (!resultText) {
                setChatError(text.textGenerateEmpty);
                return;
            }

            const assistantMessageId = `assistant-${Date.now()}`;

            setChatMessages((prev) => [
                ...prev,
                {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: resultText,
                    isTyping: true,
                },
            ]);
        } catch (error) {
            if (error?.name === 'AbortError' || abortController.signal.aborted) {
                return;
            }

            setChatError(formatUserFacingError(error, language) || 'Не удалось получить ответ.');
        } finally {
            if (textGenerationAbortRef.current === abortController) {
                textGenerationAbortRef.current = null;
            }

            setIsGeneratingText(false);
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

    const handleChatMessageTyped = useCallback((messageId) => {
        setChatMessages((prev) => prev.map((message) => (
            message.id === messageId
                ? { ...message, isTyping: false }
                : message
        )));
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

        if (card.page === 'ai-chat' || card.id === 'chat') {
            openAiChat(textModel, 'home');
        }
    };

    const renderHomeScreen = () => (
        <section className="home-screen home-screen--concept" aria-label="Главная">
            <header className="home-concept__header">
                <div className="home-concept__logo-area">
                    <div className="home-concept__logo-icon">CM</div>
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

            <article className="home-concept__promo">
                <span className="home-concept__promo-glow" aria-hidden="true" />
                <Sparkles className="home-concept__promo-icon" size={28} aria-hidden="true" />
                <div className="home-concept__promo-text">
                    <h3>{text.promoTitle}</h3>
                    <p>{text.promoSub}</p>
                </div>
                <button type="button" className="home-concept__promo-btn">{text.promoButton}</button>
            </article>

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
                            const badgeLabel = getCatalogBadgeLabel(tool.badge);

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
                                        <span className={`catalog-concept__badge catalog-concept__badge--${tool.badge}`}>
                                            {badgeLabel}
                                        </span>
                                    ) : null}
                                    <span className={`catalog-concept__icon catalog-concept__icon--${tool.accent}`}>
                                        <Icon size={17} aria-hidden="true" />
                                    </span>
                                    <span className="catalog-concept__name">{text[tool.nameKey]}</span>
                                    <span className="catalog-concept__sub">{text[tool.subKey]}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </section>
    );

    const renderAiChatScreen = () => {
        const activeModel = getTextModelDefinition(textModel);
        const ActiveIcon = activeModel.icon;

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
                        onClick={handleNewChatDialog}
                        disabled={isGeneratingText}
                    >
                        {text.chatNewDialog}
                    </button>
                </header>

                <div className="ai-chat__models" role="tablist" aria-label={text.textModelLabel}>
                    {TEXT_MODEL_DEFINITIONS.map((model) => {
                        const ModelIcon = model.icon;
                        const isActive = textModel === model.id;

                        return (
                            <button
                                key={model.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                className={`ai-chat__model-chip ${isActive ? 'ai-chat__model-chip--active' : ''}`}
                                onClick={() => handleTextModelChange(model.id)}
                                disabled={isGeneratingText}
                            >
                                <ModelIcon size={14} aria-hidden="true" />
                                {text[model.nameKey]}
                            </button>
                        );
                    })}
                </div>

                <div className="ai-chat__messages" aria-live="polite">
                    {chatMessages.length === 0 && !isGeneratingText ? (
                        <p className="ai-chat__empty">{text.chatEmpty}</p>
                    ) : null}
                    {chatMessages.map((message) => (
                        <ChatMessageBubble
                            key={message.id}
                            message={message}
                            onTypingComplete={handleChatMessageTyped}
                        />
                    ))}
                    {isGeneratingText ? (
                        <div className="ai-chat__bubble ai-chat__bubble--assistant ai-chat__bubble--typing">
                            <span>{text.chatTyping}</span>
                        </div>
                    ) : null}
                </div>

                {chatError ? (
                    <p className="ai-chat__inline-error" role="alert">{chatError}</p>
                ) : null}

                <footer className="ai-chat__composer">
                    <textarea
                        className="ai-chat__input"
                        value={textPrompt}
                        onChange={(event) => setTextPrompt(event.target.value)}
                        onKeyDown={handleChatComposerKeyDown}
                        placeholder={text.chatPlaceholder}
                        rows={2}
                        disabled={isGeneratingText}
                    />
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
                                className={`ai-chat__model-chip ${isActive ? 'ai-chat__model-chip--active' : ''}`}
                                onClick={() => handleImageModelChange(model.id)}
                                disabled={isGeneratingImage}
                            >
                                <ModelIcon size={14} aria-hidden="true" />
                                <span>{text[model.nameKey]}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="ai-image__body">
                    <label className="ai-image__label" htmlFor="ai-image-prompt">{text.imagePromptLabel}</label>
                    <textarea
                        id="ai-image-prompt"
                        className="ai-image__prompt"
                        value={imagePrompt}
                        onChange={(event) => setImagePrompt(event.target.value)}
                        placeholder={text.imagePromptPlaceholder}
                        rows={4}
                        disabled={isGeneratingImage}
                    />

                    {imageError ? (
                        <p className="ai-image__inline-error" role="alert">{imageError}</p>
                    ) : null}

                    <button
                        type="button"
                        className="ai-image__submit"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage}
                    >
                        {isGeneratingImage ? text.imageGenerating : text.imageGenerateButton}
                    </button>

                    {generatedImageUrl ? (
                        <section className="ai-image__result" aria-label={text.imageResultTitle}>
                            <p className="ai-image__result-label">{text.imageResultTitle}</p>
                            <img
                                className="ai-image__preview"
                                src={generatedImageUrl}
                                alt={imagePrompt || text.imageGenerateTitle}
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
        const profileMemberId = userData.telegramId && userData.telegramId !== '—'
            ? `#CM-${String(userData.telegramId).slice(-4)}`
            : '#CM-0000';
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

        const toggleTheme = () => {
            setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
        };

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
                    <p className="profile-concept__user-id">{userData.handle} · {profileMemberId}</p>
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
                        <div className="profile-concept__stat-val">{formatNumber(12)}</div>
                        <div className="profile-concept__stat-label">{text.profileStatProjects}</div>
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
                                {formatTemplate(text.profileMenuSubscriptionSub, { plan: subscriptionPlanName, date: subscriptionUntil })}
                            </span>
                        </span>
                        <ChevronRight className="profile-concept__menu-arrow" size={16} aria-hidden="true" />
                    </button>
                    <button type="button" className="profile-concept__menu-item" onClick={() => setCurrentPage('history')}>
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
                    <button type="button" className="profile-concept__menu-item profile-concept__menu-item--logout">
                        <span className="profile-concept__menu-ico profile-concept__menu-ico--danger"><LogOut size={16} /></span>
                        <span className="profile-concept__menu-text">
                            <span className="profile-concept__menu-title profile-concept__menu-title--danger">{text.profileMenuLogout}</span>
                        </span>
                    </button>
                </div>

                <div className="profile-concept__plans">
                    <h3 className="profile-concept__plans-title">{text.profilePlansTitle}</h3>
                    <p className="profile-concept__plans-sub">{text.profilePlansSub}</p>
                    {renderSubscriptionPlanCards(subscriptionPlanId)}
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
                    <p className="referral-concept__link-url">{referralLink}</p>
                    <button type="button" className="referral-concept__copy-btn" onClick={handleReferralLinkCopy}>
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
            <header className="history-concept__header">
                <h1 className="history-concept__title">{text.historyTitle}</h1>
                <div className="history-concept__actions">
                    <button type="button" className="history-concept__action" aria-label="Download">
                        <Download size={17} aria-hidden="true" />
                    </button>
                    <button type="button" className="history-concept__action" aria-label="Delete">
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
                            const modelDef = getTextModelDefinition(
                                TEXT_MODEL_IDS.includes(topic.model) ? topic.model : 'yandexgpt',
                            );
                            const toolName = TEXT_MODEL_IDS.includes(topic.model)
                                ? text[modelDef.nameKey]
                                : visual.toolName;

                            return (
                                <article key={topic.id} className="history-concept__item">
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
                                    <div className="history-concept__result" aria-hidden="true">
                                        {visual.emoji ? (
                                            <span>{visual.emoji}</span>
                                        ) : (
                                            <MessageSquare size={14} />
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            ))}
        </section>
    );

    const renderSettingsScreen = () => {
        const handleSupportClick = () => {
            if (typeof window !== 'undefined') {
                window.open(`https://t.me/${BOT_USERNAME}`, '_blank', 'noopener,noreferrer');
            }
        };

        const toggleTheme = () => {
            setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
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
        </div>
    );
}

export default App;
