import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowLeft,
    Bot,
    Box,
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
    Play,
} from 'lucide-react';
import { FaInstagram, FaTelegram } from 'react-icons/fa6';
import {
    deletePromptHistoryTopic,
    getMyProfile,
    getMyPromptHistory,
    getMyReferrals,
    fetchReferralLink,
    fetchReferrals,
    getMyWallet,
    normalizeProfileResponse,
    fetchTextModels,
    generateImage,
    generateText,
    generateVideo,
    generateAudio,
    generate3D,
    patchUserTheme,
    registerTelegramUser,
    savePromptHistory,
    LEGACY_TEXT_MODEL_IDS,
    IMAGE_MODEL_IDS,
    VIDEO_MODEL_IDS,
    AUDIO_MODEL_IDS,
    THREE_D_MODEL_IDS,
} from './api/telegramApi.js';
import { resolveReferralAvatarUrl } from './api/referrals.js';
import ReferralFriendAvatar from './Components/ReferralFriendAvatar.jsx';
import {
    buildChatContextMessages,
    buildChatMessagesFromHistoryTopic,
    buildImageContextMessages,
    buildImageMessagesFromHistoryTopic,
    buildVideoMessagesFromHistoryTopic,
    getChatTopicTitle,
    getHistoryTopicMediaPreview,
    groupHistoryIntoTopics,
} from './lib/chatContext.js';
import {
    getLastSessionImageUrl,
    imageModelSupportsEdit,
    imageModelSupportsSourceUpload,
} from './lib/imageModels.js';
import {
    getLastSessionSourceImageUrl,
    getLastSessionVideoUrl,
    klingModelIdForResolution,
    klingResolutionForModel,
    videoModelRequiresImage,
    videoModelRequiresVideo,
} from './lib/videoModels.js';
import { compressImageFile } from './lib/compressImage.js';
import { createChatSessionId } from './lib/chatSession.js';
import { downloadMediaUrl, guessMediaFilename } from './lib/downloadMedia.js';
import { clearMediaSession, loadMediaSession, saveMediaSession } from './lib/mediaSessions.js';
import {
    resolveAudioSessionState,
    resolveChatSessionState,
    resolveImageSessionState,
    resolveVideoSessionState,
} from './lib/sessionRestore.js';
import { getModelSessionScope } from './lib/sessionScope.js';
import {
    setBackgroundTypingListener,
    stopAllBackgroundTyping,
    syncBackgroundTyping,
} from './lib/backgroundTyping.js';
import { getHistoryTopicLabel, resolveHistoryTopicModel as resolveHistoryTopicModelId } from './lib/historyLabels.js';
import {
    fetchHomeWidgets,
    formatRelativeTime,
    getHomeNewsSlides,
    HOME_SOCIAL_LINKS,
    openExternalLink,
} from './lib/homeWidgets.js';
import { getAiGroupTitle, getAiVariantOptions } from './lib/aiVariantOptions.js';
import {
    applyReadState,
    buildAppNotifications,
    loadReadNotificationIds,
    markNotificationsRead,
} from './lib/appNotifications.js';
import { buildPlanModelSections } from './lib/planModelsCatalog.js';
import { fetchUserSubscription } from './api/subscription.js';
import {
    annotateCatalogTool as annotateCatalogToolGating,
    planUnlocksModel,
    pickFirstUnlockedModelId,
} from './lib/planGating.js';
import { PLAN_FEATURE_COPY } from './lib/planFeatureCopy.js';
import { openSupport, resolveSupportUrl } from './lib/openSupport.js';
import { getActiveBuildId } from './lib/appUpdate.js';
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
import AppNotifications from './Components/AppNotifications.jsx';
import PlanDetailModal from './Components/PlanDetailModal.jsx';
import SubscriptionTimeBadge from './Components/SubscriptionTimeBadge.jsx';
import TelegramDesktopExpand from './Components/TelegramDesktopExpand.jsx';
import AppPageHeader from './Components/AppPageHeader.jsx';
import CoinBalanceWidget from './Components/CoinBalanceWidget.jsx';
import CoinIcon from './Components/CoinIcon.jsx';
import HomeNewsWidget from './Components/HomeNewsWidget.jsx';
import AiVariantSelect from './Components/AiVariantSelect.jsx';
import ChatMessageBubble from './Components/ChatMessageBubble.jsx';
import MediaMessageBubble from './Components/MediaMessageBubble.jsx';
import MediaModelOptionsBar from './Components/MediaModelOptionsBar.jsx';
import {
    IMAGE_MODEL_DEFINITIONS,
} from './config/aiModels.js';
import {
    getImageModelCapabilities,
    getImageModelDefaults,
    getVideoModelCapabilities,
    getVideoModelDefaults,
    getAudioModelCapabilities,
    getAudioModelDefaults,
    audioModelSupportsClone,
    audioModelIsMusic,
    getThreeDModelCapabilities,
    getThreeDModelDefaults,
    videoModelIsKling,
} from './config/mediaModelOptions.js';
import {
    VIDEO_MODEL_DEFINITIONS,
} from './config/videoModels.js';
import {
    AUDIO_MODEL_DEFINITIONS,
} from './config/audioModels.js';
import {
    THREE_D_MODEL_DEFINITIONS,
} from './config/threeDModels.js';
import {
    threeDModelRequiresImage,
    threeDModelRequiresMultiImage,
    threeDModelRequiresPrompt,
} from './lib/threeDModels.js';
import {
    buildCatalogTextTools,
    buildTextModelSelectorItems,
    DEFAULT_TEXT_MODELS,
    resolveEffectiveTextModels,
    findTextModel,
    getCatalogModelDescription,
    getModelLabel,
    getSelectorItemForModelId,
    getStoredTextModelId,
    getTextModelVisual,
    isKnownTextModelId,
    resolveTextModelId,
    setStoredTextModelId,
    shouldShowCatalogBadge,
    textModelSupportsImage,
} from './lib/textModels.js';
import { catalogTabs, toolMatchesCatalogTab } from './lib/catalogFilters.js';
import {
    buildCatalogAudioTools,
    buildCatalogImageTools,
    buildCatalogVideoTools,
    buildCatalogThreeDTools,
    buildAudioModelSelectorItems,
    buildImageModelSelectorItems,
    buildVideoModelSelectorItems,
    buildThreeDModelSelectorItems,
    getAudioSelectorChipLabel,
    getImageSelectorChipLabel,
    getMediaSelectorItemForModelId,
    getThreeDSelectorChipLabel,
    getVideoSelectorChipLabel,
} from './lib/mediaModels.js';
import './App.css';
import './experimental-design.css';
import './compact-ui.css';
import './modern-polish.css';
import { formatUserFacingError } from './api/apiError.js';
import { resolveGenerationTokenBalance } from './lib/walletBalance.js';
import { APP_NAME, ENABLE_TELEGRAM_MOCK } from './config/env.js';
import { deriveSubscriptionView } from './lib/subscriptionView.js';
import {
    fetchBillingCatalog,
    formatPackPrice,
    formatPlanPrice,
    getFallbackBillingCatalog,
} from './lib/billing.js';
import {
    formatCatalogPriceLabel,
    getCatalogToolPriceRange,
} from './lib/modelPrices.js';
import {
    getTelegramWebApp,
    hydrateTelegramUser,
    initTelegramMiniAppAsync,
    resolveTelegramLayoutMode,
    showTelegramAlert,
    subscribeTelegramLayout,
} from './lib/telegramWebApp.js';

const navigationItems = [
    { key: 'home', labelKey: 'navHome', icon: House },
    { key: 'subscription', labelKey: 'navSubscription', icon: Crown },
    { key: 'catalog', labelKey: 'navCatalog', icon: LayoutGrid },
    { key: 'history', labelKey: 'navHistory', icon: History },
    { key: 'profile', labelKey: 'navProfile', icon: User },
];

const historyFilterTabs = [
    { id: 'all', labelKey: 'historyFilterAll' },
    { id: 'photo', labelKey: 'historyFilterPhoto' },
    { id: 'chat', labelKey: 'historyFilterChat' },
    { id: 'video', labelKey: 'historyFilterVideo' },
    { id: 'music', labelKey: 'historyFilterMusic' },
];

const subscriptionPlanDefs = [
    { id: 'free',  nameKey: 'planFreeName',  badgeKey: 'planFreeBadge',  badgeClass: 'free',    priceKey: 'planFreePrice',  priceSubKey: 'planFreePriceSub' },
    { id: 'basic', nameKey: 'planBasicName', badgeKey: 'planBasicBadge', badgeClass: 'basic',   priceKey: 'planBasicPrice', priceSubKey: 'planBasicPriceSub' },
    { id: 'pro',   nameKey: 'planProName',   badgeKey: 'planProBadge',   badgeClass: 'popular', priceKey: 'planProPrice',   priceSubKey: 'planProPriceSub',   popular: true },
    { id: 'max',   nameKey: 'planMaxName',   badgeKey: 'planMaxBadge',   badgeClass: 'max',     priceKey: 'planMaxPrice',   priceSubKey: 'planMaxPriceSub' },
    { id: 'ultra', nameKey: 'planUltraName', badgeKey: 'planUltraBadge', badgeClass: 'biz',     priceKey: 'planUltraPrice', priceSubKey: 'planUltraPriceSub' },
];

const subscriptionPlanEnglishNameKeys = {
    free: 'planFreeName',
    basic: 'planBasicName',
    pro: 'planProName',
    max: 'planMaxName',
    ultra: 'planUltraName',
};

function getSubscriptionPlanEnglishName(planId, fallback = '') {
    const nameKey = subscriptionPlanEnglishNameKeys[planId];

    if (!nameKey) {
        return fallback || planId;
    }

    return translations.en[nameKey] ?? (fallback || planId);
}

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

function removeHistoryTopicsFromPromptData(prev, topics) {
    if (!Array.isArray(topics) || topics.length === 0) {
        return prev;
    }

    const idsToRemove = new Set();
    const sessionIds = new Set();
    const legacyIds = new Set();

    topics.forEach((topic) => {
        const sessionId = String(topic?.sessionId || '').trim();

        if (sessionId) {
            sessionIds.add(sessionId);

            if (sessionId.startsWith('legacy-')) {
                const legacyId = Number(sessionId.replace('legacy-', ''));

                if (Number.isFinite(legacyId) && legacyId > 0) {
                    legacyIds.add(legacyId);
                }
            }
        }

        if (Array.isArray(topic?.items)) {
            topic.items.forEach((item) => {
                const itemId = Number(item.id);

                if (Number.isFinite(itemId) && itemId > 0) {
                    idsToRemove.add(itemId);
                }
            });
        }
    });

    const items = Array.isArray(prev?.items) ? prev.items : [];
    const nextItems = items.filter((item) => {
        const itemId = Number(item.id);

        if (idsToRemove.has(itemId)) {
            return false;
        }

        const itemSessionId = String(item.sessionId || item.session_id || '').trim();

        if (itemSessionId && sessionIds.has(itemSessionId)) {
            return false;
        }

        if (legacyIds.has(itemId)) {
            return false;
        }

        return true;
    });

    return { ...(prev ?? {}), items: nextItems };
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
        homeBrandName: 'CyberMate',
        homeSocialLabel: 'Мы в соцсетях',
        homeSocialTiktok: 'TikTok',
        homeSocialInstagram: 'Instagram',
        homeSocialTelegram: 'Telegram',
        homeContinueWith: 'Продолжить с {model}',
        homeContinueStart: 'Начать с {model}',
        homeContinueSub: 'Последний диалог · {time}',
        homeContinueEmptySub: 'Быстрый старт с выбранной моделью',
        homeNews1Tag: 'Новинка',
        homeNews1Title: 'Добавили Seedance — видео от ByteDance',
        homeNews1Desc: 'Image-to-video и расширение клипов уже в каталоге',
        homeNews2Tag: 'Акция',
        homeNews2Title: 'Скидка 20% на пакет 1000 монет',
        homeNews2Desc: 'Только до конца недели',
        homeNews3Tag: 'Обновление',
        homeNews3Title: 'Чаты теперь отвечают на 40% быстрее',
        homeNews3Desc: 'Ускорили GPT и Claude',
        chipAll: 'Все',
        chipChats: 'Чаты',
        chipImages: 'Изображения',
        chipVideo: 'Видео',
        chipMusic: 'Музыка',
        chipVoice: 'Голос',
        chip3d: '3D',
        promoTitle: 'Генерация видео',
        promoSub: 'Создай ролик из текста за 60 сек',
        promoButton: 'Попробовать',
        badgeNew: 'NEW',
        badgeHot: 'HOT',
        badgePro: 'PRO',
        badgeFree: 'FREE',
        toolChatTitle: 'AI Чат',
        toolChatSub: 'YandexGPT, ChatGPT, Claude, Gemini, DeepSeek',
        toolImagesTitle: 'Генерация фото',
        toolImagesSub: 'Nano Banana, GPT Image, Alice AI ART',
        toolVideoTitle: 'Видео',
        toolVideoSub: 'Kling, Seedance',
        toolMusicTitle: 'Музыка',
        toolMusicSub: 'Mureka V9, ACE-Step',
        toolVoiceTitle: 'Озвучка',
        toolVoiceSub: 'Qwen3, OmniVoice, ElevenLabs',
        tool3dTitle: '3D-модели',
        tool3dSub: 'Tripo3D, Hunyuan3D, Meshy, Rodin',
        modelQwen3TtsName: 'Qwen3 TTS',
        modelQwen3TtsSub: 'Озвучка и клонирование голоса',
        modelOmniVoiceName: 'OmniVoice',
        modelOmniVoiceSub: 'TTS на 600+ языках',
        modelElevenLabsV3Name: 'ElevenLabs V3',
        modelElevenLabsV3Sub: 'Естественная озвучка',
        modelMiniMaxSpeechName: 'MiniMax Speech 2.6',
        modelMiniMaxSpeechSub: 'Эмоциональная озвучка',
        modelMurekaV9Name: 'Mureka V9',
        modelMurekaV9Sub: 'Генерация песен',
        modelAceStepName: 'ACE-Step 1.5',
        modelAceStepSub: 'Музыка до 4 минут',
        modelTripo3dGroupName: 'Tripo3D',
        modelTripo3dGroupSub: 'Text и image-to-3D',
        modelTripoV25I2dName: 'Tripo3D V2.5 Image',
        modelTripoV25I2dSub: '3D из одного фото',
        modelTripoV25MultiviewName: 'Tripo3D V2.5 Multiview',
        modelTripoV25MultiviewSub: '3D из 2–4 ракурсов',
        modelTripoH31T2dName: 'Tripo3D H3.1 Text',
        modelTripoH31T2dSub: '3D по описанию',
        modelTripoH31I2dName: 'Tripo3D H3.1 Image',
        modelTripoH31I2dSub: 'Детальная 3D из фото',
        modelHunyuan3dGroupName: 'Hunyuan3D',
        modelHunyuan3dGroupSub: 'Tencent text-to-3D',
        modelHunyuan3dV3Name: 'Hunyuan3D V3',
        modelHunyuan3dV3Sub: 'PBR-текстуры и геометрия',
        modelHunyuan3dRapidName: 'Hunyuan3D V3.1 Rapid',
        modelHunyuan3dRapidSub: 'Быстрая генерация',
        modelMeshyGroupName: 'Meshy 6',
        modelMeshyGroupSub: 'Лучшая геометрия и текстуры',
        modelMeshy6Name: 'Meshy 6',
        modelMeshy6Sub: 'Text-to-3D премиум качества',
        modelRodinGroupName: 'Hyper3D Rodin',
        modelRodinGroupSub: 'Rodin V2 и V2.5',
        modelRodinV2Name: 'Rodin V2',
        modelRodinV2Sub: 'Image-to-3D, 10B параметров',
        modelRodinV25Name: 'Rodin V2.5',
        modelRodinV25Sub: 'Расширенные настройки mesh',
        threeDGenerateTitle: 'Генерация 3D',
        threeDPromptLabel: 'Описание модели',
        threeDPromptPlaceholder: 'Опишите объект для 3D-генерации...',
        threeDNegativePromptPlaceholder: 'Что исключить (опционально)',
        threeDGenerateButton: 'Сгенерировать 3D',
        threeDGenerating: 'Генерация 3D-модели...',
        threeDResultTitle: 'Результат',
        threeDGenerateEmpty: '3D-модель не получена. Попробуйте другой промпт.',
        threeDSourceImageRequired: 'Прикрепите исходное изображение.',
        threeDMultiImageRequired: 'Прикрепите минимум 2 изображения (разные ракурсы).',
        threeDAttachImage: 'Прикрепить фото',
        threeDAttachImages: 'Прикрепить ракурсы',
        catalogSection3d: '3D-генерация',
        mediaOptionTextureQuality: 'Качество текстур',
        mediaOptionGeometryQuality: 'Качество геометрии',
        mediaOptionArtStyle: 'Стиль',
        mediaOptionTopology: 'Топология',
        mediaOptionTier: 'Уровень',
        mediaOptionMaterial: 'Материал',
        mediaOptionGeometryFileFormat: 'Формат файла',
        mediaOptionTextureMode: 'Режим текстур',
        mediaOptionMode: 'Режим',
        voiceGenerateTitle: 'Озвучка текста',
        musicGenerateTitle: 'Генерация музыки',
        voicePromptLabel: 'Текст для озвучки',
        musicLyricsLabel: 'Текст песни',
        musicTagsLabel: 'Стиль (tags)',
        voicePromptPlaceholder: 'Введите текст, который нужно озвучить...',
        musicLyricsPlaceholder: 'Введите текст песни (куплеты, припев)...',
        musicLyricsOptionalPlaceholder: 'Текст песни (опционально, пусто = инструментал)...',
        musicStylePlaceholder: 'Например: upbeat pop, electronic, 120bpm',
        musicTagsPlaceholder: 'Например: lo-fi, chill, ambient, piano',
        omnivoiceDescriptionPlaceholder: 'female, young adult, russian accent',
        voiceClonePlaceholder: 'Текст для клонированного голоса...',
        voiceCloneHint: 'Прикрепите образец голоса (3–15 сек) — включится клонирование',
        voiceAttachAudio: 'Прикрепить голос',
        voiceRemoveAudio: 'Убрать образец',
        voiceGenerateButton: 'Озвучить',
        voiceGenerating: 'Генерация аудио...',
        voiceResultTitle: 'Результат',
        voiceGenerateEmpty: 'Аудио не получено. Попробуйте другой текст.',
        mediaOptionLanguage: 'Язык',
        mediaOptionVoice: 'Голос',
        mediaOptionStyleInstruction: 'Стиль речи',
        mediaOptionMusicStyle: 'Стиль песни',
        mediaOptionMusicTags: 'Стиль (tags)',
        mediaOptionSpeed: 'Скорость',
        mediaOptionEmotion: 'Эмоция',
        mediaOptionNumberOfSongs: 'Кол-во песен',
        musicGenerateButton: 'Сгенерировать',
        musicGenerating: 'Генерация музыки...',
        mediaOptionReferenceText: 'Текст из образца',
        mediaStyleInstructionPlaceholder: 'Например: спокойно и профессионально',
        mediaReferenceTextPlaceholder: 'Что говорится в прикреплённом аудио',
        catalogSectionVoice: 'Озвучка',
        toolTextTitle: 'Текст & Код',
        toolTextSub: 'Рерайт, суммари',
        navHome: 'Главная',
        navSubscription: 'Подписки',
        navCatalog: 'Каталог',
        navHistory: 'История',
        navProfile: 'Профиль',
        catalogTitle: 'Каталог',
        catalogSearchPlaceholder: 'Найти инструмент...',
        catalogTabAll: 'Все',
        catalogTabChat: 'Чаты',
        catalogTabPhoto: 'Изображения',
        catalogTabVideo: 'Видео',
        catalogTabMusic: 'Музыка',
        catalogTabVoice: 'Голос',
        catalogTab3d: '3D',
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
        modelNanoBananaSub: 'Генерация и редактирование изображений',
        modelNanoBananaProName: 'Nano Banana Pro',
        modelNanoBananaProSub: '4K, multi-image и редактирование',
        modelNanoBanana2Name: 'Nano Banana 2',
        modelNanoBanana2Sub: 'Новейшая модель с 4K и edit',
        modelGptImage2Name: 'GPT Image 2.0',
        modelGptImage2Sub: 'OpenAI: генерация и редактирование',
        modelGptImage15Name: 'GPT Image 1.5',
        modelGptImage15Sub: 'OpenAI: быстрая генерация и edit',
        modelGptImageGroupName: 'GPT Image',
        modelGptImageGroupSub: 'OpenAI: генерация и редактирование',
        modelFluxDevName: 'FLUX Dev',
        modelFluxDevSub: 'Качественные изображения через WaveSpeed',
        modelAliceAIArtName: 'Alice AI ART',
        modelAliceAIArtSub: 'Художественные изображения и иллюстрации от Yandex ART',
        modelSeedreamGroupName: 'Seedream',
        modelSeedreamGroupSub: 'ByteDance: генерация, edit и sequential',
        modelSeedream45Name: 'Seedream 4.5',
        modelSeedream45Sub: 'Text-to-image, edit и multi-image',
        modelSeedream50LiteName: 'Seedream 5.0 Lite',
        modelSeedream50LiteSub: 'До 4K: генерация, edit и sequential',
        modelQwenImageGroupName: 'Qwen Image',
        modelQwenImageGroupSub: 'Qwen: постеры и иллюстрации',
        modelQwenImageName: 'Qwen Image',
        modelQwenImageSub: 'Базовая 20B text-to-image',
        modelQwenImage2512Name: 'Qwen Image 2512',
        modelQwenImage2512Sub: 'Актуальная версия с negative prompt',
        modelQwenImage20Name: 'Qwen Image 2.0',
        modelQwenImage20Sub: 'Кастомный размер и пресеты',
        modelQwenImage20ProName: 'Qwen Image 2.0 Pro',
        modelQwenImage20ProSub: 'Редактирование изображений',
        modelZImageGroupName: 'Z-Image',
        modelZImageGroupSub: 'Z-Image text-to-image и img2img',
        modelZImageBaseName: 'Z-Image Base',
        modelZImageBaseSub: 'Base с negative prompt и ref',
        modelZImageTurboName: 'Z-Image Turbo',
        modelZImageTurboSub: 'Быстрая генерация',
        modelGrokGroupName: 'Grok',
        modelGrokGroupSub: 'xAI Grok Imagine edit',
        modelGrokImagineEditName: 'Grok Imagine Edit',
        modelGrokImagineEditSub: 'Редактирование изображений высокого качества',
        modelKlingGroupName: 'Kling',
        modelKlingGroupSub: 'Генерация видео по тексту',
        modelKlingStdName: 'Kling 3.0 Standard',
        modelKlingStdSub: 'Быстрая генерация видео по тексту',
        modelKlingProName: 'Kling 3.0 Pro',
        modelKlingProSub: 'Высокое качество видео через WaveSpeed',
        modelKling4kName: 'Kling 3.0 4K',
        modelKling4kSub: 'Видео в разрешении 4K',
        modelSeedanceGroupName: 'Seedance',
        modelSeedanceGroupSub: 'ByteDance: I2V, T2V, edit и extend',
        modelSeedanceV1ProI2vName: 'Seedance 1.0 I2V',
        modelSeedanceV1ProI2vSub: 'Image-to-video 720p',
        modelSeedanceV15I2vFastName: 'Seedance 1.5 I2V Fast',
        modelSeedanceV15I2vFastSub: 'Быстрый I2V с аудио',
        modelSeedanceV15T2vFastName: 'Seedance 1.5 T2V Fast',
        modelSeedanceV15T2vFastSub: 'Быстрый text-to-video с аудио',
        modelSeedanceV15I2vSpicyName: 'Seedance 1.5 I2V Spicy',
        modelSeedanceV15I2vSpicySub: 'Выразительный I2V с динамикой',
        modelSeedanceV2EditName: 'Seedance 2.0 Edit',
        modelSeedanceV2EditSub: '480p — стандарт, 720p/1080p — Turbo автоматически',
        modelSeedanceV2ExtendName: 'Seedance 2.0 Extend',
        modelSeedanceV2ExtendSub: 'Продление видео новым сегментом',
        modelWanGroupName: 'WAN',
        modelWanGroupSub: 'Alibaba WAN 2.5–2.7',
        modelWan25T2vName: 'WAN 2.5 T2V',
        modelWan25T2vSub: 'Text-to-video 480P–1080P',
        modelWan26I2vName: 'WAN 2.6 I2V',
        modelWan26I2vSub: 'Image-to-video',
        modelWan27T2vName: 'WAN 2.7 T2V',
        modelWan27T2vSub: 'Text-to-video до 1080P',
        modelWan27FlfName: 'WAN 2.7 First/Last',
        modelWan27FlfSub: 'Переход между кадрами',
        modelWan27GridName: 'WAN 2.7 Grid',
        modelWan27GridSub: 'Анимация 3×3 сетки',
        modelWan27EditName: 'WAN 2.7 Edit',
        modelWan27EditSub: 'Редактирование видео',
        modelWan22SpicyI2vName: 'WAN 2.2 Spicy I2V',
        modelWan22SpicyI2vSub: 'Spicy image-to-video',
        modelHappyHorseGroupName: 'Happy Horse',
        modelHappyHorseGroupSub: 'Alibaba Happy Horse 1.0',
        modelHappyHorseT2vName: 'Happy Horse T2V',
        modelHappyHorseT2vSub: 'Text-to-video',
        modelHappyHorseI2vName: 'Happy Horse I2V',
        modelHappyHorseI2vSub: 'Image-to-video',
        modelHappyHorseRef2vName: 'Happy Horse Ref2V',
        modelHappyHorseRef2vSub: 'Reference-to-video',
        modelHappyHorseVideoEditName: 'Happy Horse Edit',
        modelHappyHorseVideoEditSub: 'Редактирование видео',
        modelHappyHorseVideoExtendName: 'Happy Horse Extend',
        modelHappyHorseVideoExtendSub: 'Продление видео',
        modelSoraGroupName: 'Sora',
        modelSoraGroupSub: 'OpenAI Sora 2',
        modelSora2T2vName: 'Sora 2 T2V',
        modelSora2T2vSub: 'Text-to-video',
        modelSora2I2vName: 'Sora 2 I2V',
        modelSora2I2vSub: 'Image-to-video',
        modelSora2T2vProName: 'Sora 2 Pro',
        modelSora2T2vProSub: 'Text-to-video Pro',
        modelVeoGroupName: 'Veo',
        modelVeoGroupSub: 'Google Veo 3.1',
        modelVeo31ExtendName: 'Veo 3.1 Extend',
        modelVeo31ExtendSub: 'Продление видео',
        modelViduGroupName: 'Vidu',
        modelViduGroupSub: 'Vidu Q3',
        modelViduQ3I2vSpicyName: 'Vidu Q3 Spicy I2V',
        modelViduQ3I2vSpicySub: 'I2V с аудио и BGM',
        modelHailuoGroupName: 'Hailuo',
        modelHailuoGroupSub: 'MiniMax Hailuo 2.3',
        modelHailuo23T2vName: 'Hailuo 2.3 T2V',
        modelHailuo23T2vSub: 'Text-to-video standard',
        modelHailuo23I2vFastName: 'Hailuo 2.3 Fast',
        modelHailuo23I2vFastSub: 'Быстрый image-to-video',
        modelHailuo23I2vProName: 'Hailuo 2.3 Pro I2V',
        modelHailuo23I2vProSub: 'Pro image-to-video 1080p',
        imageGenerateTitle: 'Генерация фото',
        imagePromptLabel: 'Описание',
        imagePromptPlaceholder: 'Опишите изображение, которое нужно создать...',
        imageEditPlaceholder: 'Опишите, что изменить на последнем изображении...',
        imageEditHint: 'Следующий промт отредактирует последнее изображение',
        imageAttachmentHint: 'Прикреплённое фото будет использовано для редактирования',
        imageAttachPhoto: 'Прикрепить фото',
        imageRemovePhoto: 'Убрать фото',
        imageEditedNote: 'Изображение отредактировано.',
        imageGenerateButton: 'Сгенерировать',
        imageGenerating: 'Генерация...',
        imageResultTitle: 'Результат',
        mediaDownloadButton: 'Скачать',
        mediaDownloading: 'Скачивание...',
        mediaDownloadFailed: 'Не удалось скачать файл.',
        mediaDownloadTelegramHint: 'Подтвердите сохранение в окне Telegram.',
        mediaDownloadGalleryHint: 'Выберите «Сохранить в Фото» или «Сохранить видео».',
        imageGenerateEmpty: 'Изображение не получено. Попробуйте другой промт.',
        imageGeneratedNote: 'Изображение создано.',
        imageContentPolicy: 'Модель отклонила запрос. Попробуйте другую формулировку без запрещённых тем.',
        mediaOptionsGroup: 'Параметры генерации',
        mediaModelVariantLabel: 'Модель',
        mediaModelGroupLabel: 'Нейросеть',
        mediaOptionAspectRatio: 'Формат',
        mediaOptionResolution: 'Разрешение',
        mediaOptionQuality: 'Качество',
        mediaOptionDuration: 'Длительность',
        mediaOptionOutputFormat: 'Формат файла',
        mediaToggleOn: 'Вкл',
        mediaToggleOff: 'Выкл',
        mediaQualityLow: 'Низкое',
        mediaQualityMedium: 'Среднее',
        mediaQualityHigh: 'Высокое',
        mediaOptionGenerateAudio: 'Генерировать аудио',
        mediaOptionCameraFixed: 'Фиксировать камеру',
        mediaOptionTurboMode: 'Быстрое редактирование (Turbo)',
        mediaOptionNegativePrompt: 'Негативный промпт',
        mediaNegativePromptPlaceholder: 'Чего избегать: размытие, искажения...',
        mediaOptionQualityTier: 'Качество',
        mediaQualityTierStd: 'Стандартное',
        mediaQualityTierPro: 'Профессиональное',
        mediaOptionSound: 'Генерировать звук',
        mediaOptionCameraMovement: 'Движение камеры',
        mediaCameraMovementAuto: 'Авто',
        mediaCameraMovementSimple: 'Простое',
        mediaCameraMovementDownBack: 'Вниз-назад',
        mediaCameraMovementForwardUp: 'Вперёд-вверх',
        mediaCameraMovementRightTurn: 'Поворот вправо',
        mediaCameraMovementLeftTurn: 'Поворот влево',
        mediaOptionCameraAxes: 'Управление камерой',
        mediaCameraAxesHint: 'Для «Простого» режима — только одна ось может быть ненулевой',
        mediaCameraAxisHorizontal: 'Горизонталь',
        mediaCameraAxisVertical: 'Вертикаль',
        mediaCameraAxisPan: 'Панорамирование',
        mediaCameraAxisTilt: 'Наклон',
        mediaCameraAxisRoll: 'Вращение',
        mediaCameraAxisZoom: 'Зум',
        videoEditTurboHint: '720p и 1080p автоматически используют Turbo. 480p — только стандартная модель.',
        videoGenerateTitle: 'Генерация видео',
        videoPromptLabel: 'Описание',
        videoPromptPlaceholder: 'Опишите сцену, которую нужно создать...',
        videoEditPlaceholder: 'Опишите, что изменить в последнем видео...',
        videoExtendPlaceholder: 'Опишите, как продолжить последнее видео...',
        videoEditHint: 'Следующий промт отредактирует последнее видео',
        videoExtendHint: 'Следующий промт продлит последнее видео',
        videoSourceImageLabel: 'URL исходного изображения',
        videoSourceImagePlaceholder: 'https://example.com/photo.jpg',
        videoSourceVideoLabel: 'URL исходного видео',
        videoSourceVideoPlaceholder: 'https://example.com/video.mp4',
        videoSourceImageRequired: 'Укажите URL исходного изображения для этой модели.',
        videoSourceVideoRequired: 'Укажите URL исходного видео или сгенерируйте первое видео в сессии.',
        videoEditedNote: 'Видео отредактировано.',
        videoExtendedNote: 'Видео продлено.',
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
        historyTopicDeleteConfirm: 'Удалить этот диалог из истории?',
        historyTopicDeleted: 'Диалог удалён.',
        historyTopicDeleteFailed: 'Не удалось удалить диалог.',
        historySelectModeHint: 'Выберите диалоги для удаления',
        historyDeleteSelected: 'Удалить ({count})',
        historyDeleteSelectedConfirm: 'Удалить выбранные диалоги ({count})?',
        historyTopicsDeleted: 'Выбранные диалоги удалены.',
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
        subscriptionPageTitle: 'Подписки',
        subscriptionPageSub: '5 уровней · 1 CyberCoin = {rate} ₽',
        subscriptionCurrentPlan: 'Ваш план',
        planDetailButton: 'Подробное описание плана',
        subscriptionCoinsPerMonth: 'монет / мес',
        subscriptionTimeLeft: 'Осталось',
        subscriptionRenewHint: 'Продлить подписку',
        modelLockedNotice: 'Модель «{model}» доступна с плана «{plan}»',
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
        activeReferralsTitle: 'Мои рефералы',
        walletPageTitle: 'Пополнить',
        walletCurrentPlan: 'Текущий план',
        walletBalanceTotal: 'Баланс',
        walletBalanceAvailable: 'Доступно',
        walletBalanceEarned: 'Всего заработано',
        walletTransactionsTitle: 'Транзакции',
        walletTransactionsEmpty: 'Транзакций пока нет.',
        walletCoinPacksTitle: 'Купить монеты',
        walletCoinPacksSub: 'Разовая покупка CyberCoins',
        walletCoinPackBuy: 'Купить',
        walletCoinPackSoon: 'Оплата будет доступна в следующем обновлении.',
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
        profileStatCoins: 'Токены',
        profileBalanceLabel: 'Баланс токенов',
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
        profilePlansSub: '5 уровней · 1 CyberCoin = {rate} ₽',
        planFreeName: 'Старт',
        planFreeBadge: 'Бесплатно',
        planFreePrice: '0 ₽',
        planFreePriceSub: 'навсегда',
        planBasicName: 'Базовый',
        planBasicBadge: 'Доступный',
        planBasicPrice: '149 ₽',
        planBasicPriceSub: '/ месяц',
        planProName: 'Про',
        planProBadge: 'Популярный',
        planProPrice: '349 ₽',
        planProPriceSub: '/ месяц',
        planMaxName: 'Максимум',
        planMaxBadge: 'Выгодный',
        planMaxPrice: '799 ₽',
        planMaxPriceSub: '/ месяц',
        planUltraName: 'Бизнес',
        planUltraBadge: 'Для бизнеса',
        planUltraPrice: '1999 ₽',
        planUltraPriceSub: '/ месяц',
        planFreeFeatures: PLAN_FEATURE_COPY.ru.free,
        planFreeLocked: PLAN_FEATURE_COPY.ru.freeLocked,
        planBasicFeatures: PLAN_FEATURE_COPY.ru.basic,
        planProFeatures: PLAN_FEATURE_COPY.ru.pro,
        planMaxFeatures: PLAN_FEATURE_COPY.ru.max,
        planUltraFeatures: PLAN_FEATURE_COPY.ru.ultra,
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
        homeBrandName: 'CyberMate',
        homeSocialLabel: 'Follow us',
        homeSocialTiktok: 'TikTok',
        homeSocialInstagram: 'Instagram',
        homeSocialTelegram: 'Telegram',
        homeContinueWith: 'Continue with {model}',
        homeContinueStart: 'Start with {model}',
        homeContinueSub: 'Last chat · {time}',
        homeContinueEmptySub: 'Quick start with your selected model',
        homeNews1Tag: 'New',
        homeNews1Title: 'Seedance video from ByteDance is here',
        homeNews1Desc: 'Image-to-video and clip extension are in the catalog',
        homeNews2Tag: 'Promo',
        homeNews2Title: '20% off the 1000-coin pack',
        homeNews2Desc: 'Only until the end of the week',
        homeNews3Tag: 'Update',
        homeNews3Title: 'Chats respond 40% faster',
        homeNews3Desc: 'GPT and Claude are now faster',
        chipAll: 'All',
        chipChats: 'Chats',
        chipImages: 'Images',
        chipVideo: 'Video',
        chipMusic: 'Music',
        chipVoice: 'Voice',
        chip3d: '3D',
        promoTitle: 'Video generation',
        promoSub: 'Create a clip from text in 60 sec',
        promoButton: 'Try it',
        badgeNew: 'NEW',
        badgeHot: 'HOT',
        badgePro: 'PRO',
        badgeFree: 'FREE',
        toolChatTitle: 'AI Chat',
        toolChatSub: 'YandexGPT, ChatGPT, Claude, Gemini, DeepSeek',
        toolImagesTitle: 'Image generation',
        toolImagesSub: 'Nano Banana, GPT Image, Alice AI ART',
        toolVideoTitle: 'Video',
        toolVideoSub: 'Kling, Seedance',
        toolMusicTitle: 'Music',
        toolMusicSub: 'Mureka V9, ACE-Step',
        toolVoiceTitle: 'Voiceover',
        toolVoiceSub: 'Qwen3, OmniVoice, ElevenLabs',
        tool3dTitle: '3D models',
        tool3dSub: 'Tripo3D, Hunyuan3D, Meshy, Rodin',
        modelQwen3TtsName: 'Qwen3 TTS',
        modelQwen3TtsSub: 'Text-to-speech and voice cloning',
        modelOmniVoiceName: 'OmniVoice',
        modelOmniVoiceSub: 'TTS in 600+ languages',
        modelElevenLabsV3Name: 'ElevenLabs V3',
        modelElevenLabsV3Sub: 'Natural voice synthesis',
        modelMiniMaxSpeechName: 'MiniMax Speech 2.6',
        modelMiniMaxSpeechSub: 'Emotional speech synthesis',
        modelMurekaV9Name: 'Mureka V9',
        modelMurekaV9Sub: 'Song generation from lyrics',
        modelAceStepName: 'ACE-Step 1.5',
        modelAceStepSub: 'Music up to 4 minutes',
        modelTripo3dGroupName: 'Tripo3D',
        modelTripo3dGroupSub: 'Text and image-to-3D',
        modelTripoV25I2dName: 'Tripo3D V2.5 Image',
        modelTripoV25I2dSub: '3D from a single photo',
        modelTripoV25MultiviewName: 'Tripo3D V2.5 Multiview',
        modelTripoV25MultiviewSub: '3D from 2–4 views',
        modelTripoH31T2dName: 'Tripo3D H3.1 Text',
        modelTripoH31T2dSub: '3D from description',
        modelTripoH31I2dName: 'Tripo3D H3.1 Image',
        modelTripoH31I2dSub: 'Detailed 3D from photo',
        modelHunyuan3dGroupName: 'Hunyuan3D',
        modelHunyuan3dGroupSub: 'Tencent text-to-3D',
        modelHunyuan3dV3Name: 'Hunyuan3D V3',
        modelHunyuan3dV3Sub: 'PBR textures and geometry',
        modelHunyuan3dRapidName: 'Hunyuan3D V3.1 Rapid',
        modelHunyuan3dRapidSub: 'Fast generation',
        modelMeshyGroupName: 'Meshy 6',
        modelMeshyGroupSub: 'Best geometry and textures',
        modelMeshy6Name: 'Meshy 6',
        modelMeshy6Sub: 'Premium text-to-3D',
        modelRodinGroupName: 'Hyper3D Rodin',
        modelRodinGroupSub: 'Rodin V2 and V2.5',
        modelRodinV2Name: 'Rodin V2',
        modelRodinV2Sub: 'Image-to-3D, 10B params',
        modelRodinV25Name: 'Rodin V2.5',
        modelRodinV25Sub: 'Advanced mesh settings',
        threeDGenerateTitle: '3D generation',
        threeDPromptLabel: 'Model description',
        threeDPromptPlaceholder: 'Describe the object to generate in 3D...',
        threeDNegativePromptPlaceholder: 'What to exclude (optional)',
        threeDGenerateButton: 'Generate 3D',
        threeDGenerating: 'Generating 3D model...',
        threeDResultTitle: 'Result',
        threeDGenerateEmpty: 'No 3D model returned. Try a different prompt.',
        threeDSourceImageRequired: 'Attach a source image.',
        threeDMultiImageRequired: 'Attach at least 2 images (different views).',
        threeDAttachImage: 'Attach photo',
        threeDAttachImages: 'Attach views',
        catalogSection3d: '3D generation',
        mediaOptionTextureQuality: 'Texture quality',
        mediaOptionGeometryQuality: 'Geometry quality',
        mediaOptionArtStyle: 'Art style',
        mediaOptionTopology: 'Topology',
        mediaOptionTier: 'Tier',
        mediaOptionMaterial: 'Material',
        mediaOptionGeometryFileFormat: 'File format',
        mediaOptionTextureMode: 'Texture mode',
        mediaOptionMode: 'Mode',
        voiceGenerateTitle: 'Text-to-speech',
        musicGenerateTitle: 'Music generation',
        voicePromptLabel: 'Text to speak',
        musicLyricsLabel: 'Song lyrics',
        musicTagsLabel: 'Style (tags)',
        voicePromptPlaceholder: 'Enter the text you want to hear...',
        musicLyricsPlaceholder: 'Enter song lyrics (verses, chorus)...',
        musicLyricsOptionalPlaceholder: 'Song lyrics (optional, empty = instrumental)...',
        musicStylePlaceholder: 'e.g. upbeat pop, electronic, 120bpm',
        musicTagsPlaceholder: 'e.g. lo-fi, chill, ambient, piano',
        omnivoiceDescriptionPlaceholder: 'female, young adult, russian accent',
        voiceClonePlaceholder: 'Text for the cloned voice...',
        voiceCloneHint: 'Attach a voice sample (3–15 sec) to enable cloning',
        voiceAttachAudio: 'Attach voice sample',
        voiceRemoveAudio: 'Remove sample',
        voiceGenerateButton: 'Generate speech',
        voiceGenerating: 'Generating audio...',
        voiceResultTitle: 'Result',
        voiceGenerateEmpty: 'No audio returned. Try different text.',
        mediaOptionLanguage: 'Language',
        mediaOptionVoice: 'Voice',
        mediaOptionStyleInstruction: 'Speaking style',
        mediaOptionMusicStyle: 'Song style',
        mediaOptionMusicTags: 'Style (tags)',
        mediaOptionSpeed: 'Speed',
        mediaOptionEmotion: 'Emotion',
        mediaOptionNumberOfSongs: 'Number of songs',
        musicGenerateButton: 'Generate',
        musicGenerating: 'Generating music...',
        mediaOptionReferenceText: 'Sample transcript',
        mediaStyleInstructionPlaceholder: 'e.g. calm and professional',
        mediaReferenceTextPlaceholder: 'What is said in the attached audio',
        catalogSectionVoice: 'Voiceover',
        toolTextTitle: 'Text & Code',
        toolTextSub: 'Rewrite, summary',
        navHome: 'Home',
        navSubscription: 'Plans',
        navCatalog: 'Catalog',
        navHistory: 'History',
        navProfile: 'Profile',
        catalogTitle: 'Catalog',
        catalogSearchPlaceholder: 'Find a tool...',
        catalogTabAll: 'All',
        catalogTabChat: 'Chats',
        catalogTabPhoto: 'Images',
        catalogTabVideo: 'Video',
        catalogTabMusic: 'Music',
        catalogTabVoice: 'Voice',
        catalogTab3d: '3D',
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
        modelNanoBananaSub: 'Image generation and editing',
        modelNanoBananaProName: 'Nano Banana Pro',
        modelNanoBananaProSub: '4K, multi-image, and editing',
        modelNanoBanana2Name: 'Nano Banana 2',
        modelNanoBanana2Sub: 'Latest model with 4K and edit',
        modelGptImage2Name: 'GPT Image 2.0',
        modelGptImage2Sub: 'OpenAI image generation and editing',
        modelGptImage15Name: 'GPT Image 1.5',
        modelGptImage15Sub: 'OpenAI fast generation and edit',
        modelGptImageGroupName: 'GPT Image',
        modelGptImageGroupSub: 'OpenAI image generation and editing',
        modelFluxDevName: 'FLUX Dev',
        modelFluxDevSub: 'High-quality images via WaveSpeed',
        modelAliceAIArtName: 'Alice AI ART',
        modelAliceAIArtSub: 'Artistic images and illustrations via Yandex ART',
        modelSeedreamGroupName: 'Seedream',
        modelSeedreamGroupSub: 'ByteDance: generate, edit, and sequential',
        modelSeedream45Name: 'Seedream 4.5',
        modelSeedream45Sub: 'Text-to-image, edit, and multi-image',
        modelSeedream50LiteName: 'Seedream 5.0 Lite',
        modelSeedream50LiteSub: 'Up to 4K with edit and sequential',
        modelQwenImageGroupName: 'Qwen Image',
        modelQwenImageGroupSub: 'Qwen posters and illustrations',
        modelQwenImageName: 'Qwen Image',
        modelQwenImageSub: 'Base 20B text-to-image',
        modelQwenImage2512Name: 'Qwen Image 2512',
        modelQwenImage2512Sub: 'Latest version with negative prompt',
        modelQwenImage20Name: 'Qwen Image 2.0',
        modelQwenImage20Sub: 'Custom size and aspect presets',
        modelQwenImage20ProName: 'Qwen Image 2.0 Pro',
        modelQwenImage20ProSub: 'Image editing',
        modelZImageGroupName: 'Z-Image',
        modelZImageGroupSub: 'Z-Image text-to-image and img2img',
        modelZImageBaseName: 'Z-Image Base',
        modelZImageBaseSub: 'Base with negative prompt and ref',
        modelZImageTurboName: 'Z-Image Turbo',
        modelZImageTurboSub: 'Fast generation',
        modelGrokGroupName: 'Grok',
        modelGrokGroupSub: 'xAI Grok Imagine edit',
        modelGrokImagineEditName: 'Grok Imagine Edit',
        modelGrokImagineEditSub: 'High-quality image editing',
        modelKlingGroupName: 'Kling',
        modelKlingGroupSub: 'Text-to-video generation',
        modelKlingStdName: 'Kling 3.0 Standard',
        modelKlingStdSub: 'Fast text-to-video generation',
        modelKlingProName: 'Kling 3.0 Pro',
        modelKlingProSub: 'High-quality video via WaveSpeed',
        modelKling4kName: 'Kling 3.0 4K',
        modelKling4kSub: '4K video generation',
        modelSeedanceGroupName: 'Seedance',
        modelSeedanceGroupSub: 'ByteDance: I2V, T2V, edit, and extend',
        modelSeedanceV1ProI2vName: 'Seedance 1.0 I2V',
        modelSeedanceV1ProI2vSub: 'Image-to-video 720p',
        modelSeedanceV15I2vFastName: 'Seedance 1.5 I2V Fast',
        modelSeedanceV15I2vFastSub: 'Fast I2V with audio',
        modelSeedanceV15T2vFastName: 'Seedance 1.5 T2V Fast',
        modelSeedanceV15T2vFastSub: 'Fast text-to-video with audio',
        modelSeedanceV15I2vSpicyName: 'Seedance 1.5 I2V Spicy',
        modelSeedanceV15I2vSpicySub: 'Expressive I2V with motion',
        modelSeedanceV2EditName: 'Seedance 2.0 Edit',
        modelSeedanceV2EditSub: '480p standard, 720p/1080p Turbo auto',
        modelSeedanceV2ExtendName: 'Seedance 2.0 Extend',
        modelSeedanceV2ExtendSub: 'Extend video with a new segment',
        modelWanGroupName: 'WAN',
        modelWanGroupSub: 'Alibaba WAN 2.5–2.7',
        modelWan25T2vName: 'WAN 2.5 T2V',
        modelWan25T2vSub: 'Text-to-video 480P–1080P',
        modelWan26I2vName: 'WAN 2.6 I2V',
        modelWan26I2vSub: 'Image-to-video',
        modelWan27T2vName: 'WAN 2.7 T2V',
        modelWan27T2vSub: 'Text-to-video up to 1080P',
        modelWan27FlfName: 'WAN 2.7 First/Last',
        modelWan27FlfSub: 'First/last frame transition',
        modelWan27GridName: 'WAN 2.7 Grid',
        modelWan27GridSub: '3×3 grid animation',
        modelWan27EditName: 'WAN 2.7 Edit',
        modelWan27EditSub: 'Video editing',
        modelWan22SpicyI2vName: 'WAN 2.2 Spicy I2V',
        modelWan22SpicyI2vSub: 'Spicy image-to-video',
        modelHappyHorseGroupName: 'Happy Horse',
        modelHappyHorseGroupSub: 'Alibaba Happy Horse 1.0',
        modelHappyHorseT2vName: 'Happy Horse T2V',
        modelHappyHorseT2vSub: 'Text-to-video',
        modelHappyHorseI2vName: 'Happy Horse I2V',
        modelHappyHorseI2vSub: 'Image-to-video',
        modelHappyHorseRef2vName: 'Happy Horse Ref2V',
        modelHappyHorseRef2vSub: 'Reference-to-video',
        modelHappyHorseVideoEditName: 'Happy Horse Edit',
        modelHappyHorseVideoEditSub: 'Video editing',
        modelHappyHorseVideoExtendName: 'Happy Horse Extend',
        modelHappyHorseVideoExtendSub: 'Video extend',
        modelSoraGroupName: 'Sora',
        modelSoraGroupSub: 'OpenAI Sora 2',
        modelSora2T2vName: 'Sora 2 T2V',
        modelSora2T2vSub: 'Text-to-video',
        modelSora2I2vName: 'Sora 2 I2V',
        modelSora2I2vSub: 'Image-to-video',
        modelSora2T2vProName: 'Sora 2 Pro',
        modelSora2T2vProSub: 'Text-to-video Pro',
        modelVeoGroupName: 'Veo',
        modelVeoGroupSub: 'Google Veo 3.1',
        modelVeo31ExtendName: 'Veo 3.1 Extend',
        modelVeo31ExtendSub: 'Video extend',
        modelViduGroupName: 'Vidu',
        modelViduGroupSub: 'Vidu Q3',
        modelViduQ3I2vSpicyName: 'Vidu Q3 Spicy I2V',
        modelViduQ3I2vSpicySub: 'I2V with audio and BGM',
        modelHailuoGroupName: 'Hailuo',
        modelHailuoGroupSub: 'MiniMax Hailuo 2.3',
        modelHailuo23T2vName: 'Hailuo 2.3 T2V',
        modelHailuo23T2vSub: 'Text-to-video standard',
        modelHailuo23I2vFastName: 'Hailuo 2.3 Fast',
        modelHailuo23I2vFastSub: 'Fast image-to-video',
        modelHailuo23I2vProName: 'Hailuo 2.3 Pro I2V',
        modelHailuo23I2vProSub: 'Pro image-to-video 1080p',
        imageGenerateTitle: 'Image generation',
        imagePromptLabel: 'Description',
        imagePromptPlaceholder: 'Describe the image you want to create...',
        imageEditPlaceholder: 'Describe what to change in the last image...',
        imageEditHint: 'The next prompt will edit the last image',
        imageAttachmentHint: 'The attached photo will be used for editing',
        imageAttachPhoto: 'Attach photo',
        imageRemovePhoto: 'Remove photo',
        imageEditedNote: 'Image edited.',
        imageGenerateButton: 'Generate',
        imageGenerating: 'Generating...',
        imageResultTitle: 'Result',
        mediaDownloadButton: 'Download',
        mediaDownloading: 'Downloading...',
        mediaDownloadFailed: 'Failed to download file.',
        mediaDownloadTelegramHint: 'Confirm save in the Telegram popup.',
        mediaDownloadGalleryHint: 'Choose "Save to Photos" or "Save Video".',
        imageGenerateEmpty: 'No image returned. Try a different prompt.',
        imageGeneratedNote: 'Image created.',
        imageContentPolicy: 'The model rejected this prompt. Try a different wording.',
        mediaOptionsGroup: 'Generation settings',
        mediaModelVariantLabel: 'Model',
        mediaModelGroupLabel: 'Provider',
        mediaOptionAspectRatio: 'Aspect ratio',
        mediaOptionResolution: 'Resolution',
        mediaOptionQuality: 'Quality',
        mediaOptionDuration: 'Duration',
        mediaOptionOutputFormat: 'Output format',
        mediaToggleOn: 'On',
        mediaToggleOff: 'Off',
        mediaQualityLow: 'Low',
        mediaQualityMedium: 'Medium',
        mediaQualityHigh: 'High',
        mediaOptionGenerateAudio: 'Generate audio',
        mediaOptionCameraFixed: 'Fixed camera',
        mediaOptionTurboMode: 'Fast editing (Turbo)',
        mediaOptionNegativePrompt: 'Negative prompt',
        mediaNegativePromptPlaceholder: 'What to avoid: blur, distortion...',
        mediaOptionQualityTier: 'Quality',
        mediaQualityTierStd: 'Standard',
        mediaQualityTierPro: 'Professional',
        mediaOptionSound: 'Generate sound',
        mediaOptionCameraMovement: 'Camera movement',
        mediaCameraMovementAuto: 'Auto',
        mediaCameraMovementSimple: 'Simple',
        mediaCameraMovementDownBack: 'Down-back',
        mediaCameraMovementForwardUp: 'Forward-up',
        mediaCameraMovementRightTurn: 'Turn right',
        mediaCameraMovementLeftTurn: 'Turn left',
        mediaOptionCameraAxes: 'Camera control',
        mediaCameraAxesHint: 'In Simple mode only one axis may be non-zero',
        mediaCameraAxisHorizontal: 'Horizontal',
        mediaCameraAxisVertical: 'Vertical',
        mediaCameraAxisPan: 'Pan',
        mediaCameraAxisTilt: 'Tilt',
        mediaCameraAxisRoll: 'Roll',
        mediaCameraAxisZoom: 'Zoom',
        videoEditTurboHint: '720p and 1080p use Turbo automatically. 480p uses the standard model only.',
        videoGenerateTitle: 'Video generation',
        videoPromptLabel: 'Description',
        videoPromptPlaceholder: 'Describe the scene you want to create...',
        videoEditPlaceholder: 'Describe what to change in the last video...',
        videoExtendPlaceholder: 'Describe how to continue the last video...',
        videoEditHint: 'The next prompt will edit the last video',
        videoExtendHint: 'The next prompt will extend the last video',
        videoSourceImageLabel: 'Source image URL',
        videoSourceImagePlaceholder: 'https://example.com/photo.jpg',
        videoSourceVideoLabel: 'Source video URL',
        videoSourceVideoPlaceholder: 'https://example.com/video.mp4',
        videoSourceImageRequired: 'A source image URL is required for this model.',
        videoSourceVideoRequired: 'Provide a source video URL or generate the first video in this session.',
        videoEditedNote: 'Video edited.',
        videoExtendedNote: 'Video extended.',
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
        historyTopicDeleteConfirm: 'Delete this conversation from history?',
        historyTopicDeleted: 'Conversation deleted.',
        historyTopicDeleteFailed: 'Failed to delete conversation.',
        historySelectModeHint: 'Select conversations to delete',
        historyDeleteSelected: 'Delete ({count})',
        historyDeleteSelectedConfirm: 'Delete selected conversations ({count})?',
        historyTopicsDeleted: 'Selected conversations deleted.',
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
        subscriptionPageTitle: 'Plans',
        subscriptionPageSub: '5 tiers · 1 CyberCoin = {rate} ₽',
        subscriptionCurrentPlan: 'Your plan',
        planDetailButton: 'Plan details',
        subscriptionCoinsPerMonth: 'coins / mo',
        subscriptionTimeLeft: 'Time left',
        subscriptionRenewHint: 'Renew subscription',
        modelLockedNotice: 'Model "{model}" requires the "{plan}" plan',
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
        walletPageTitle: 'Top up',
        walletCurrentPlan: 'Current plan',
        walletBalanceTotal: 'Balance',
        walletBalanceAvailable: 'Available',
        walletBalanceEarned: 'Total earned',
        walletTransactionsTitle: 'Transactions',
        walletTransactionsEmpty: 'No transactions yet.',
        walletCoinPacksTitle: 'Buy coins',
        walletCoinPacksSub: 'One-time CyberCoins purchase',
        walletCoinPackBuy: 'Buy',
        walletCoinPackSoon: 'Payments will be available in the next update.',
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
        profileStatCoins: 'Tokens',
        profileBalanceLabel: 'Token balance',
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
        profilePlansSub: '5 tiers · 1 CyberCoin = {rate} ₽',
        planFreeName: 'Start',
        planFreeBadge: 'Free',
        planFreePrice: '0 ₽',
        planFreePriceSub: 'forever',
        planBasicName: 'Basic',
        planBasicBadge: 'Affordable',
        planBasicPrice: '149 ₽',
        planBasicPriceSub: '/ month',
        planProName: 'Pro',
        planProBadge: 'Popular',
        planProPrice: '349 ₽',
        planProPriceSub: '/ month',
        planMaxName: 'Max',
        planMaxBadge: 'Best value',
        planMaxPrice: '799 ₽',
        planMaxPriceSub: '/ month',
        planUltraName: 'Business',
        planUltraBadge: 'For business',
        planUltraPrice: '1999 ₽',
        planUltraPriceSub: '/ month',
        planFreeFeatures: PLAN_FEATURE_COPY.en.free,
        planFreeLocked: PLAN_FEATURE_COPY.en.freeLocked,
        planBasicFeatures: PLAN_FEATURE_COPY.en.basic,
        planProFeatures: PLAN_FEATURE_COPY.en.pro,
        planMaxFeatures: PLAN_FEATURE_COPY.en.max,
        planUltraFeatures: PLAN_FEATURE_COPY.en.ultra,
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
    const tokens = String(
        profile?.tokens
        ?? profile?.token_balance
        ?? profile?.tokenBalance
        ?? profile?.points
        ?? balance,
    );

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
    const [homeWidgetSlides, setHomeWidgetSlides] = useState(null);
    const [billingCatalog, setBillingCatalog] = useState(() => getFallbackBillingCatalog());
    const [telegramUser, setTelegramUser] = useState(null);
    const [startParam, setStartParam] = useState('');
    const [appNotice, setAppNotice] = useState(null);
    const [chatError, setChatError] = useState('');
    const [imageError, setImageError] = useState('');
    const [videoError, setVideoError] = useState('');
    const [audioError, setAudioError] = useState('');
    const [threeDError, setThreeDError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [tgLayoutMode, setTgLayoutMode] = useState(() => resolveTelegramLayoutMode(getTelegramWebApp()));
    const [walletData, setWalletData] = useState(null);
    const [subscriptionState, setSubscriptionState] = useState(null);
    const [readNotificationIds, setReadNotificationIds] = useState(() => loadReadNotificationIds());
    const [planDetailPlanId, setPlanDetailPlanId] = useState(null);
    const [referralData, setReferralData] = useState(null);
    const [referralLink, setReferralLink] = useState('');
    const [referralLinkLoading, setReferralLinkLoading] = useState(false);
    const [promptHistoryData, setPromptHistoryData] = useState(null);
    const [pageLoading, setPageLoading] = useState({ wallet: false, referrals: false, history: false });
    const pageDataLoadedRef = useRef({ wallet: false, referrals: false, history: false });
    const pageDataInFlightRef = useRef({ wallet: false, referrals: false, history: false });
    const [theme, setTheme] = useState(getInitialTheme);
    const [language, setLanguage] = useState(getInitialLanguage);
    const text = translations[language] ?? translations.ru;
    const [, setIsLanguageMenuOpen] = useState(false);
    const [textPrompt, setTextPrompt] = useState('');
    const [textModel, setTextModel] = useState(getInitialTextModelId);
    const [textModels, setTextModels] = useState(DEFAULT_TEXT_MODELS);
    const initialImageDefaults = getImageModelDefaults('flux-dev');
    const initialVideoDefaults = getVideoModelDefaults('kling-v3-std');
    const initialAudioDefaults = getAudioModelDefaults('qwen3-tts');
    const initialThreeDDefaults = getThreeDModelDefaults('hunyuan3d-v3.1-rapid');
    const [imageModel, setImageModel] = useState('flux-dev');
    const [imagePrompt, setImagePrompt] = useState('');
    const [imageAttachment, setImageAttachment] = useState(null);
    const [imageSessionMessages, setImageSessionMessages] = useState([]);
    const [imageSessionId, setImageSessionId] = useState(() => createChatSessionId());
    const [imageAspectRatio, setImageAspectRatio] = useState(initialImageDefaults.aspectRatio ?? '1:1');
    const [imageResolution, setImageResolution] = useState(initialImageDefaults.resolution ?? '');
    const [imageQuality, setImageQuality] = useState(initialImageDefaults.quality ?? '');
    const [imageOutputFormat, setImageOutputFormat] = useState(initialImageDefaults.outputFormat ?? '');
    const [generatedImageUrl, setGeneratedImageUrl] = useState('');
    const [generatedImageUrls, setGeneratedImageUrls] = useState([]);
    const [videoModel, setVideoModel] = useState('kling-v3-std');
    const [videoPrompt, setVideoPrompt] = useState('');
    const [videoSessionMessages, setVideoSessionMessages] = useState([]);
    const [videoAspectRatio, setVideoAspectRatio] = useState(initialVideoDefaults.aspectRatio ?? '16:9');
    const [videoDuration, setVideoDuration] = useState(initialVideoDefaults.duration ?? 5);
    const [videoResolution, setVideoResolution] = useState(initialVideoDefaults.resolution ?? '');
    const [videoGenerateAudio, setVideoGenerateAudio] = useState(initialVideoDefaults.generateAudio ?? false);
    const [videoCameraFixed, setVideoCameraFixed] = useState(initialVideoDefaults.cameraFixed ?? false);
    const [videoTurboMode, setVideoTurboMode] = useState(Boolean(initialVideoDefaults.turboMode));
    const [videoNegativePrompt, setVideoNegativePrompt] = useState(initialVideoDefaults.negativePrompt ?? '');
    const [videoCameraMovement, setVideoCameraMovement] = useState(initialVideoDefaults.cameraMovement ?? 'auto');
    const [videoCameraHorizontal, setVideoCameraHorizontal] = useState(0);
    const [videoCameraVertical, setVideoCameraVertical] = useState(0);
    const [videoCameraPan, setVideoCameraPan] = useState(0);
    const [videoCameraTilt, setVideoCameraTilt] = useState(0);
    const [videoCameraRoll, setVideoCameraRoll] = useState(0);
    const [videoCameraZoom, setVideoCameraZoom] = useState(0);
    const [videoSound, setVideoSound] = useState(Boolean(initialVideoDefaults.sound));
    const [videoSourceImageUrl, setVideoSourceImageUrl] = useState('');
    const [videoSourceVideoUrl, setVideoSourceVideoUrl] = useState('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState('');
    const [videoSessionId, setVideoSessionId] = useState(() => createChatSessionId());
    const [audioModel, setAudioModel] = useState('qwen3-tts');
    const [audioPrompt, setAudioPrompt] = useState('');
    const [audioLanguage, setAudioLanguage] = useState(initialAudioDefaults.language ?? 'auto');
    const [audioVoice, setAudioVoice] = useState(initialAudioDefaults.voice ?? 'Dylan');
    const [audioStyleInstruction, setAudioStyleInstruction] = useState(initialAudioDefaults.styleInstruction ?? '');
    const [audioReferenceText, setAudioReferenceText] = useState(initialAudioDefaults.referenceText ?? '');
    const [audioSpeed, setAudioSpeed] = useState(initialAudioDefaults.speed ?? '1.0');
    const [audioEmotion, setAudioEmotion] = useState(initialAudioDefaults.emotion ?? 'happy');
    const [audioDuration, setAudioDuration] = useState(initialAudioDefaults.duration ?? 60);
    const [audioNumberOfSongs, setAudioNumberOfSongs] = useState(initialAudioDefaults.numberOfSongs ?? '1');
    const [audioOutputFormat, setAudioOutputFormat] = useState(initialAudioDefaults.outputFormat ?? 'mp3');
    const [audioAttachment, setAudioAttachment] = useState(null);
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState('');
    const [audioSessionId, setAudioSessionId] = useState(() => createChatSessionId());
    const [threeDModel, setThreeDModel] = useState('hunyuan3d-v3.1-rapid');
    const [threeDPrompt, setThreeDPrompt] = useState('');
    const [threeDNegativePrompt, setThreeDNegativePrompt] = useState(initialThreeDDefaults.negativePrompt ?? '');
    const [threeDTextureQuality, setThreeDTextureQuality] = useState(initialThreeDDefaults.textureQuality ?? 'detailed');
    const [threeDOutputFormat, setThreeDOutputFormat] = useState(initialThreeDDefaults.outputFormat ?? 'glb');
    const [threeDGeometryQuality, setThreeDGeometryQuality] = useState(initialThreeDDefaults.geometryQuality ?? 'detailed');
    const [threeDMode, setThreeDMode] = useState(initialThreeDDefaults.mode ?? 'full');
    const [threeDArtStyle, setThreeDArtStyle] = useState(initialThreeDDefaults.artStyle ?? 'realistic');
    const [threeDTopology, setThreeDTopology] = useState(initialThreeDDefaults.topology ?? 'quad');
    const [threeDTier, setThreeDTier] = useState(initialThreeDDefaults.tier ?? 'Gen-2.5-Medium');
    const [threeDMaterial, setThreeDMaterial] = useState(initialThreeDDefaults.material ?? 'PBR');
    const [threeDGeometryFileFormat, setThreeDGeometryFileFormat] = useState(initialThreeDDefaults.geometryFileFormat ?? 'glb');
    const [threeDTextureMode, setThreeDTextureMode] = useState(initialThreeDDefaults.textureMode ?? 'medium');
    const [threeDAttachment, setThreeDAttachment] = useState(null);
    const [threeDAttachments, setThreeDAttachments] = useState([]);
    const [generatedThreeDUrl, setGeneratedThreeDUrl] = useState('');
    const [threeDSessionId, setThreeDSessionId] = useState(() => createChatSessionId());
    const [chatMessages, setChatMessages] = useState([]);
    const [chatTopicTitle, setChatTopicTitle] = useState('');
    const [chatSessionId, setChatSessionId] = useState(() => createChatSessionId());
    const [chatReturnPage, setChatReturnPage] = useState('catalog');
    const [imageReturnPage, setImageReturnPage] = useState('catalog');
    const [videoReturnPage, setVideoReturnPage] = useState('catalog');
    const [audioReturnPage, setAudioReturnPage] = useState('catalog');
    const [threeDReturnPage, setThreeDReturnPage] = useState('catalog');
    const [historyReturnPage, setHistoryReturnPage] = useState('home');
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [chatAttachment, setChatAttachment] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const textGenerationAbortRef = useRef(null);
    const chatPhotoInputRef = useRef(null);
    const imagePhotoInputRef = useRef(null);
    const audioFileInputRef = useRef(null);
    const threeDFileInputRef = useRef(null);
    const pendingAssistantIdRef = useRef(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [isGeneratingThreeD, setIsGeneratingThreeD] = useState(false);
    const [mediaDownloadBusy, setMediaDownloadBusy] = useState(null);
    const [catalogTab, setCatalogTab] = useState('all');
    const [catalogSearch, setCatalogSearch] = useState('');
    const [historyFilter, setHistoryFilter] = useState('all');
    const [historySelectMode, setHistorySelectMode] = useState(false);
    const [selectedHistoryTopicIds, setSelectedHistoryTopicIds] = useState([]);
    const subscriptionPlansScrollRef = useRef(null);

    const effectiveTextModels = useMemo(
        () => resolveEffectiveTextModels(textModels),
        [textModels],
    );

    const textModelSelectorItems = useMemo(
        () => buildTextModelSelectorItems(effectiveTextModels),
        [effectiveTextModels],
    );

    const imageModelSelectorItems = useMemo(
        () => buildImageModelSelectorItems(IMAGE_MODEL_DEFINITIONS),
        [],
    );

    const videoModelSelectorItems = useMemo(
        () => buildVideoModelSelectorItems(VIDEO_MODEL_DEFINITIONS),
        [],
    );

    const audioModelSelectorItems = useMemo(
        () => buildAudioModelSelectorItems(AUDIO_MODEL_DEFINITIONS),
        [],
    );

    const threeDModelSelectorItems = useMemo(
        () => buildThreeDModelSelectorItems(THREE_D_MODEL_DEFINITIONS),
        [],
    );

    const chatSessionScope = useMemo(
        () => getModelSessionScope(textModel, textModelSelectorItems),
        [textModel, textModelSelectorItems],
    );

    const imageSessionScope = useMemo(
        () => getModelSessionScope(imageModel, imageModelSelectorItems),
        [imageModel, imageModelSelectorItems],
    );

    const videoSessionScope = useMemo(
        () => getModelSessionScope(videoModel, videoModelSelectorItems),
        [videoModel, videoModelSelectorItems],
    );

    const audioSessionScope = useMemo(
        () => getModelSessionScope(audioModel, audioModelSelectorItems),
        [audioModel, audioModelSelectorItems],
    );

    const clearAppNotice = useCallback(() => {
        setAppNotice(null);
    }, []);

    const resolveHistoryTopicModel = useCallback(
        (topic) => resolveHistoryTopicModelId(topic, effectiveTextModels),
        [effectiveTextModels],
    );

    const pushPromptHistoryItem = useCallback((item) => {
        if (!item) {
            return;
        }

        setPromptHistoryData((prev) => ({
            items: [item, ...(Array.isArray(prev?.items) ? prev.items : [])],
        }));
    }, []);

    const archiveMediaMessagesToHistory = useCallback(async ({
        messages,
        model,
        sessionId,
        getResponse,
        extraItems = [],
    }) => {
        const savedItems = [];

        if (Array.isArray(messages)) {
            for (let index = 0; index < messages.length; index += 1) {
                const entry = messages[index];
                if (entry?.role !== 'user') {
                    continue;
                }

                const assistant = messages[index + 1];
                const prompt = String(entry?.content ?? entry?.prompt ?? '').trim();
                const response = String(getResponse?.(assistant) ?? entry?.response ?? '').trim();

                if (!prompt || !response) {
                    continue;
                }

                try {
                    const historyResponse = await savePromptHistory({
                        prompt,
                        category: model,
                        model,
                        response,
                        sessionId,
                    });
                    if (historyResponse?.item) {
                        savedItems.push(historyResponse.item);
                    }
                } catch {
                    // History save is optional.
                }
            }
        }

        for (const entry of extraItems) {
            const prompt = String(entry?.prompt ?? entry?.content ?? '').trim();
            const response = String(entry?.response ?? getResponse?.(entry) ?? '').trim();

            if (!prompt || !response) {
                continue;
            }

            try {
                const historyResponse = await savePromptHistory({
                    prompt,
                    category: model,
                    model,
                    response,
                    sessionId,
                });
                if (historyResponse?.item) {
                    savedItems.push(historyResponse.item);
                }
            } catch {
                // History save is optional.
            }
        }

        if (savedItems.length) {
            setPromptHistoryData((prev) => ({
                items: [...savedItems.reverse(), ...(Array.isArray(prev?.items) ? prev.items : [])],
            }));
        }
    }, []);

    useEffect(() => {
        saveMediaSession('image', {
            model: imageModel,
            sessionId: imageSessionId,
            messages: imageSessionMessages,
            generatedImageUrl,
            generatedImageUrls,
            isGenerating: isGeneratingImage,
        }, imageSessionScope);
    }, [imageModel, imageSessionId, imageSessionMessages, generatedImageUrl, generatedImageUrls, isGeneratingImage, imageSessionScope]);

    useEffect(() => {
        saveMediaSession('video', {
            model: videoModel,
            sessionId: videoSessionId,
            messages: videoSessionMessages,
            generatedVideoUrl,
            videoPrompt,
            videoSourceImageUrl,
            videoSourceVideoUrl,
            isGenerating: isGeneratingVideo,
        }, videoSessionScope);
    }, [
        videoModel,
        videoSessionId,
        videoSessionMessages,
        generatedVideoUrl,
        videoPrompt,
        videoSourceImageUrl,
        videoSourceVideoUrl,
        isGeneratingVideo,
        videoSessionScope,
    ]);

    useEffect(() => {
        saveMediaSession('audio', {
            model: audioModel,
            sessionId: audioSessionId,
            audioPrompt,
            generatedAudioUrl,
            isGenerating: isGeneratingAudio,
        }, audioSessionScope);
    }, [audioModel, audioSessionId, audioPrompt, generatedAudioUrl, isGeneratingAudio, audioSessionScope]);

    useEffect(() => {
        saveMediaSession('chat', {
            model: textModel,
            sessionId: chatSessionId,
            messages: chatMessages,
            topicTitle: chatTopicTitle,
            isGenerating: isGeneratingText,
        }, chatSessionScope);
    }, [textModel, chatSessionId, chatMessages, chatTopicTitle, isGeneratingText, chatSessionScope]);

    useEffect(() => {
        setBackgroundTypingListener((messageId, progress, done) => {
            setChatMessages((prev) => prev.map((message) => {
                if (message.id !== messageId) {
                    return message;
                }

                if (done) {
                    return { ...message, isTyping: false, typingProgress: undefined };
                }

                return { ...message, typingProgress: progress };
            }));
        });

        return () => {
            setBackgroundTypingListener(null);
        };
    }, []);

    useEffect(() => {
        syncBackgroundTyping(chatMessages);
    }, [chatMessages]);

    useEffect(() => {
        if (currentPage !== 'ai-image' || generatedImageUrl || isGeneratingImage) {
            return;
        }

        const fromMessages = getLastSessionImageUrl(imageSessionMessages);
        if (fromMessages) {
            setGeneratedImageUrl(fromMessages);
            setGeneratedImageUrls((prev) => (prev.length ? prev : [fromMessages]));
            return;
        }

        const stored = loadMediaSession('image', imageSessionScope);
        if (!stored) {
            return;
        }

        const restored = resolveImageSessionState({
            memory: {
                sessionId: imageSessionId,
                messages: imageSessionMessages,
                generatedImageUrl: '',
                generatedImageUrls: [],
                isGenerating: isGeneratingImage,
            },
            stored,
        });

        if (restored?.generatedImageUrl) {
            setGeneratedImageUrl(restored.generatedImageUrl);
            setGeneratedImageUrls(restored.generatedImageUrls);
            if (!restored.isGenerating) {
                setIsGeneratingImage(false);
            }
        }
    }, [
        currentPage,
        generatedImageUrl,
        imageSessionMessages,
        imageSessionScope,
        imageSessionId,
        isGeneratingImage,
    ]);

    useEffect(() => {
        if (currentPage !== 'ai-video' || generatedVideoUrl || isGeneratingVideo) {
            return;
        }

        const fromMessages = getLastSessionVideoUrl(videoSessionMessages);
        if (fromMessages) {
            setGeneratedVideoUrl(fromMessages);
            setIsGeneratingVideo(false);
            return;
        }

        const stored = loadMediaSession('video', videoSessionScope);
        if (!stored) {
            return;
        }

        const restored = resolveVideoSessionState({
            memory: {
                sessionId: videoSessionId,
                messages: videoSessionMessages,
                generatedVideoUrl: '',
                videoPrompt,
                videoSourceImageUrl,
                videoSourceVideoUrl,
                isGenerating: isGeneratingVideo,
            },
            stored,
        });

        if (restored?.generatedVideoUrl) {
            setGeneratedVideoUrl(restored.generatedVideoUrl);
            if (!restored.isGenerating) {
                setIsGeneratingVideo(false);
            }
        }
    }, [
        currentPage,
        generatedVideoUrl,
        videoSessionMessages,
        videoSessionScope,
        videoSessionId,
        videoPrompt,
        videoSourceImageUrl,
        videoSourceVideoUrl,
        isGeneratingVideo,
    ]);

    const showAppNotice = useCallback((message, variant = 'error') => {
        if (!message) {
            setAppNotice(null);
            return;
        }

        setAppNotice({ message, variant });
    }, []);

    const handleMediaDownload = useCallback(async (kind, url, fallbackName) => {
        const trimmed = String(url || '').trim();
        if (!trimmed) {
            return;
        }

        setMediaDownloadBusy(kind);
        try {
            const result = await downloadMediaUrl(
                trimmed,
                guessMediaFilename(trimmed, fallbackName),
                { kind },
            );

            if (result?.method === 'gallery') {
                showAppNotice(text.mediaDownloadGalleryHint, 'success');
            } else if (result?.method === 'telegram') {
                showAppNotice(text.mediaDownloadTelegramHint, 'success');
            }
        } catch (error) {
            showAppNotice(error instanceof Error ? error.message : text.mediaDownloadFailed, 'error');
        } finally {
            setMediaDownloadBusy(null);
        }
    }, [showAppNotice, text.mediaDownloadFailed, text.mediaDownloadTelegramHint, text.mediaDownloadGalleryHint]);

    useEffect(() => {
        if (appNotice?.variant !== 'success') {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setAppNotice(null);
        }, 3200);

        return () => window.clearTimeout(timer);
    }, [appNotice]);

    useEffect(() => subscribeTelegramLayout(setTgLayoutMode), []);

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

                try {
                    const subscriptionPayload = await fetchUserSubscription(currentTelegramUser?.id);
                    if (isMounted && subscriptionPayload) {
                        setSubscriptionState(subscriptionPayload);
                    }
                } catch (subscriptionError) {
                    if (import.meta.env.DEV) {
                        console.warn('[CyberMate] Failed to load subscription on bootstrap:', subscriptionError);
                    }
                }

                try {
                    const walletPayload = await getMyWallet();

                    if (isMounted) {
                        setWalletData(walletPayload ?? { wallet: null, transactions: [] });
                    }
                } catch (walletError) {
                    if (import.meta.env.DEV) {
                        console.warn('[CyberMate] Failed to load wallet on bootstrap:', walletError);
                    }
                }

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
        if (textModels.length >= 20) {
            return undefined;
        }

        if (currentPage !== 'ai-chat' && currentPage !== 'catalog' && currentPage !== 'home') {
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

        const loadBillingCatalog = () => {
            fetchBillingCatalog()
                .then((catalog) => {
                    if (!isCancelled && catalog) {
                        setBillingCatalog(catalog);
                    }
                })
                .catch(() => {
                    // Keep fallback catalog on failure.
                });
        };

        loadBillingCatalog();

        return () => {
            isCancelled = true;
        };
    }, [telegramUser?.id]);

    useEffect(() => {
        if (!telegramUser?.id || currentPage !== 'subscription') {
            return undefined;
        }

        let isCancelled = false;

        fetchBillingCatalog()
            .then((catalog) => {
                if (!isCancelled && catalog) {
                    setBillingCatalog(catalog);
                }
            })
            .catch(() => {});

        return () => {
            isCancelled = true;
        };
    }, [currentPage, telegramUser?.id]);

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
                && !pageDataInFlightRef.current.wallet;
            needReferrals = currentPage === 'profile'
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
                    Promise.allSettled([
                        getMyWallet(),
                        getMyProfile(),
                        fetchBillingCatalog(),
                    ])
                        .then(([walletResult, profileResult, billingResult]) => {
                            if (isCancelled) {
                                return;
                            }

                            if (walletResult.status === 'fulfilled') {
                                setWalletData(walletResult.value ?? { wallet: null, transactions: [] });
                            } else {
                                setWalletData({ wallet: null, transactions: [] });
                                const error = walletResult.reason;
                                showAppNotice(error instanceof Error ? error.message : 'Не удалось загрузить кошелёк.');
                            }

                            if (profileResult.status === 'fulfilled' && profileResult.value) {
                                setProfile(normalizeProfileResponse(profileResult.value, telegramUser));
                            }

                            if (billingResult.status === 'fulfilled' && billingResult.value) {
                                setBillingCatalog(billingResult.value);
                            }
                        })
                        .finally(() => {
                            pageDataInFlightRef.current.wallet = false;
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
                                setReferralData(data ?? { referrals: [], total_count: 0 });
                            }
                        })
                        .catch((error) => {
                            if (!isCancelled) {
                                setReferralData({ referrals: [], total_count: 0 });
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

            if (needWallet) {
                pageDataInFlightRef.current.wallet = false;
            }
            if (needReferrals && !pageDataLoadedRef.current.referrals) {
                pageDataInFlightRef.current.referrals = false;
            }
            if (needHistory && !pageDataLoadedRef.current.history) {
                pageDataInFlightRef.current.history = false;
            }
        };
    }, [currentPage, telegramUser, showAppNotice]);

    useEffect(() => {
        if (!telegramUser?.id || currentPage !== 'referrals') {
            return undefined;
        }

        let isCancelled = false;
        setReferralLinkLoading(true);
        setPageLoading((prev) => ({ ...prev, referrals: true }));

        Promise.all([
            fetchReferralLink(telegramUser.id),
            fetchReferrals(telegramUser.id),
        ])
            .then(([linkResult, stats]) => {
                if (isCancelled) {
                    return;
                }

                setReferralLink(linkResult?.referral_link ?? '');
                setReferralData(stats ?? { referrals: [], total_count: 0 });
                pageDataLoadedRef.current.referrals = true;
            })
            .catch((error) => {
                if (isCancelled) {
                    return;
                }

                    setReferralLink('');
                setReferralData({ referrals: [], total_count: 0 });
                    showAppNotice(
                    error instanceof Error ? error.message : 'Не удалось загрузить реферальную программу.',
                    );
            })
            .finally(() => {
                if (!isCancelled) {
                    setReferralLinkLoading(false);
                    setPageLoading((prev) => ({ ...prev, referrals: false }));
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [currentPage, telegramUser?.id, showAppNotice]);

    const userData = useMemo(() => {
        const base = buildProfileView({
            ...profile,
            balance: walletData?.wallet?.balance ?? profile?.balance,
            tokens: walletData?.wallet?.tokens ?? profile?.tokens,
            tokenBalance: walletData?.wallet?.tokens
                ?? walletData?.wallet?.balanceAvailable
                ?? profile?.tokenBalance
                ?? profile?.tokens,
        }, telegramUser);
        const subscription = deriveSubscriptionView(subscriptionState ?? profile, text, language);

        return {
            ...base,
            subscriptionPlanId: subscription.planId,
            subscriptionPlanName: subscription.planName,
            subscriptionUntil: subscription.untilLabel,
            subscriptionTimeLeft: subscription.timeLeftLabel,
            subscriptionExpiryDate: subscription.expiryDateLabel,
            subscriptionIsPaid: subscription.isPaid,
            subscriptionExpiringSoon: subscription.expiringSoon,
            subscriptionExpired: subscription.expired,
            subscriptionDaysLeft: subscription.daysLeft,
        };
    }, [profile, subscriptionState, telegramUser, walletData, text, language]);

    const handleMarkNotificationsRead = useCallback((ids = []) => {
        if (!ids.length) {
            return;
        }
        setReadNotificationIds(markNotificationsRead(ids));
    }, []);

    const planModelCatalogs = useMemo(() => ({
        textModels: effectiveTextModels,
        imageDefinitions: IMAGE_MODEL_DEFINITIONS,
        videoDefinitions: VIDEO_MODEL_DEFINITIONS,
        audioDefinitions: AUDIO_MODEL_DEFINITIONS,
        threeDDefinitions: THREE_D_MODEL_DEFINITIONS,
    }), [effectiveTextModels]);

    const planModelSectionsByPlan = useMemo(() => {
        const resolveLabel = (tool, modelId) => {
            if (tool?.tiered && Array.isArray(tool.variants)) {
                const variant = tool.variants.find((entry) => entry.id === modelId);
                if (variant?.label) {
                    return variant.label;
                }
            }
            return tool?.label ?? text[tool?.nameKey] ?? modelId;
        };

        return Object.fromEntries(
            subscriptionPlanDefs.map((plan) => [
                plan.id,
                buildPlanModelSections(plan.id, planModelCatalogs, resolveLabel),
            ]),
        );
    }, [planModelCatalogs, text]);

    const handleLockedModelSelect = useCallback((option) => {
        const requiredPlan = text[option?.requiredPlanLabelKey] ?? option?.requiredPlan ?? '';
        showAppNotice(formatTemplate(text.modelLockedNotice, {
            model: option?.label ?? option?.id ?? '',
            plan: requiredPlan,
        }));
        setCurrentPage('subscription');
    }, [text, showAppNotice]);

    const annotateCatalogTool = useCallback((tool, category, planId) => (
        annotateCatalogToolGating(tool, planId, category)
    ), []);

    const homeGreetingText = useMemo(() => {
        const firstName = userData.displayName.split(/\s+/)[0] || userData.displayName;
        return formatTemplate(text.homeGreeting, { name: firstName });
    }, [userData.displayName, text.homeGreeting]);

    const refreshWalletBalance = useCallback(async () => {
        if (!telegramUser?.id) {
            return;
        }

        try {
            const [walletResult, profileResult] = await Promise.allSettled([
                getMyWallet(),
                getMyProfile(),
            ]);

            if (walletResult.status === 'fulfilled') {
                setWalletData(walletResult.value ?? { wallet: null, transactions: [] });
            }

            if (profileResult.status === 'fulfilled' && profileResult.value) {
                setProfile(normalizeProfileResponse(profileResult.value, telegramUser));
            }
        } catch {
            // Keep the previous balance visible if refresh fails.
        }
    }, [telegramUser]);
    const referralItems = useMemo(() => {
        const sourceItems = Array.isArray(referralData?.referrals)
            ? referralData.referrals
            : Array.isArray(referralData?.items)
                ? referralData.items
                : [];

        return sourceItems.map((item, index) => {
            const fullName = [item.first_name, item.last_name].filter(Boolean).join(' ').trim();

            return {
                id: item.id ?? item.telegram_id ?? `referral-${index}`,
                name: item.name
                    || fullName
                    || (item.username ? `@${String(item.username).replace(/^@/, '')}` : '')
                    || item.fullName
                    || `${language === 'ru' ? 'Друг' : 'Friend'} ${index + 1}`,
                reward: `+${item.bonus ?? item.earnings ?? item.reward ?? 0}`,
                avatarUrl: resolveReferralAvatarUrl(item),
            };
        });
    }, [referralData, language]);

    const referralsCount = useMemo(() => {
        const total = Number(referralData?.total_count);

        if (Number.isFinite(total) && total >= 0) {
            return total;
        }

        return referralItems.length;
    }, [referralData, referralItems.length]);

    const referralBonusTotal = useMemo(() => referralItems.reduce((sum, item) => {
        const reward = Number(String(item.reward).replace('+', ''));
        return sum + (Number.isNaN(reward) ? 0 : reward);
    }, 0), [referralItems]);
    const historyItems = useMemo(
        () => (Array.isArray(promptHistoryData?.items) ? promptHistoryData.items : []),
        [promptHistoryData],
    );
    const walletTransactions = Array.isArray(walletData?.transactions) ? walletData.transactions : [];
    const appNotifications = useMemo(() => {
        const items = buildAppNotifications({
            subscription: subscriptionState,
            walletTransactions,
            text,
            language,
        });
        return applyReadState(items, readNotificationIds);
    }, [subscriptionState, walletTransactions, text, language, readNotificationIds]);
    const tokenBalance = resolveGenerationTokenBalance(walletData, profile);

    const openCoinTopUp = useCallback(() => {
        setCurrentPage('wallet');
    }, []);
    const activeNavKey = currentPage === 'settings' || currentPage === 'wallet' || currentPage === 'referrals'
        ? 'profile'
        : currentPage === 'ai-chat' || currentPage === 'ai-image' || currentPage === 'ai-video'
            || currentPage === 'ai-voice' || currentPage === 'ai-3d'
            ? 'catalog'
            : ['home', 'subscription', 'catalog', 'history', 'profile'].includes(currentPage)
                ? currentPage
                : 'home';

    const showBottomNav = !['ai-chat', 'ai-image', 'ai-video', 'ai-voice', 'ai-3d', 'settings', 'wallet', 'referrals'].includes(currentPage);

    const navInnerRef = useRef(null);
    const navButtonRefs = useRef([]);
    const [navIndicatorStyle, setNavIndicatorStyle] = useState({
        width: 0,
        transform: 'translateX(0px)',
        opacity: 0,
    });

    const activeNavIndex = navigationItems.findIndex((item) => item.key === activeNavKey);

    useLayoutEffect(() => {
        if (!showBottomNav) {
            return undefined;
        }

        const updateNavIndicator = () => {
            const inner = navInnerRef.current;
            const button = navButtonRefs.current[activeNavIndex];

            if (!inner || !button || activeNavIndex < 0) {
                return;
            }

            const innerRect = inner.getBoundingClientRect();
            const buttonRect = button.getBoundingClientRect();

            setNavIndicatorStyle({
                width: buttonRect.width,
                transform: `translateX(${buttonRect.left - innerRect.left}px)`,
                opacity: buttonRect.width > 0 ? 1 : 0,
            });
        };

        updateNavIndicator();

        const inner = navInnerRef.current;
        const resizeObserver = typeof ResizeObserver !== 'undefined' && inner
            ? new ResizeObserver(updateNavIndicator)
            : null;

        resizeObserver?.observe(inner);
        window.addEventListener('resize', updateNavIndicator);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener('resize', updateNavIndicator);
        };
    }, [activeNavIndex, showBottomNav]);

    useEffect(() => {
        if (currentPage !== 'subscription' || !telegramUser?.id) {
            return;
        }

        fetchUserSubscription(telegramUser.id)
            .then((payload) => {
                if (payload) {
                    setSubscriptionState(payload);
                }
            })
            .catch(() => {
                // Keep previous subscription state visible.
            });
    }, [currentPage, telegramUser?.id]);

    const catalogSections = useMemo(() => {
        const planId = userData.subscriptionPlanId;
        return [
        {
            id: 'text-models',
            labelKey: 'catalogSectionChat',
            tools: buildCatalogTextTools(effectiveTextModels).map((tool) => annotateCatalogTool(tool, 'text', planId)),
        },
        {
            id: 'image-models',
            labelKey: 'catalogSectionPhoto',
            tools: buildCatalogImageTools(IMAGE_MODEL_DEFINITIONS).map((tool) => annotateCatalogTool(tool, 'image', planId)),
        },
        {
            id: 'video-models',
            labelKey: 'catalogSectionVideo',
            tools: buildCatalogVideoTools(VIDEO_MODEL_DEFINITIONS).map((tool) => annotateCatalogTool(tool, 'video', planId)),
        },
        {
            id: 'audio-models',
            labelKey: 'catalogSectionVoice',
            tools: buildCatalogAudioTools(AUDIO_MODEL_DEFINITIONS).map((tool) => annotateCatalogTool(tool, 'audio', planId)),
        },
        {
            id: '3d-models',
            labelKey: 'catalogSection3d',
            tools: buildCatalogThreeDTools(THREE_D_MODEL_DEFINITIONS).map((tool) => annotateCatalogTool(tool, '3d', planId)),
        },
    ];
    }, [effectiveTextModels, userData.subscriptionPlanId, annotateCatalogTool]);

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

        if (tool.tiered && tool.subKey) {
            return text[tool.subKey] ?? '';
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
            const modelId = String(item.model || item.category || '').toLowerCase();

            if (historyFilter === 'chat') {
                return isKnownTextModelId(modelId, effectiveTextModels)
                    || LEGACY_TEXT_MODEL_IDS.includes(modelId)
                    || category.includes('chat')
                    || category.includes('text')
                    || category === 'текст'
                    || category === 'gpt';
            }
            if (historyFilter === 'photo') {
                return IMAGE_MODEL_IDS.includes(modelId)
                    || category.includes('photo')
                    || category.includes('image');
            }
            if (historyFilter === 'video') {
                return VIDEO_MODEL_IDS.includes(modelId)
                    || category.includes('video');
            }
            if (historyFilter === 'music') {
                return AUDIO_MODEL_IDS.includes(modelId)
                    || category.includes('music')
                    || category.includes('audio')
                    || category.includes('voice');
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

    useEffect(() => {
        if (currentPage !== 'history') {
            setHistorySelectMode(false);
            setSelectedHistoryTopicIds([]);
        }
    }, [currentPage]);

    useEffect(() => {
        const scrollEl = subscriptionPlansScrollRef.current;
        if (!scrollEl || currentPage !== 'subscription') {
            return undefined;
        }

        const onWheel = (event) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
                return;
            }

            event.preventDefault();
            scrollEl.scrollBy({ left: event.deltaY, behavior: 'smooth' });
        };

        scrollEl.addEventListener('wheel', onWheel, { passive: false });
        return () => scrollEl.removeEventListener('wheel', onWheel);
    }, [currentPage]);

    const scrollSubscriptionPlan = useCallback((direction) => {
        const el = subscriptionPlansScrollRef.current;
        if (!el) {
            return;
        }

        const cards = Array.from(el.querySelectorAll('.subscription-plan-card'));
        if (cards.length === 0) {
            return;
        }

        const viewportCenter = el.scrollLeft + el.clientWidth / 2;
        let activeIndex = 0;
        let minDistance = Infinity;

        cards.forEach((card, index) => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(cardCenter - viewportCenter);
            if (distance < minDistance) {
                minDistance = distance;
                activeIndex = index;
            }
        });

        const nextIndex = Math.min(cards.length - 1, Math.max(0, activeIndex + direction));
        const target = cards[nextIndex];
        const targetLeft = target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2;

        el.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }, []);

    const exitHistorySelectMode = useCallback(() => {
        setHistorySelectMode(false);
        setSelectedHistoryTopicIds([]);
    }, []);

    const toggleHistoryTopicSelected = useCallback((topicId) => {
        setSelectedHistoryTopicIds((prev) => (
            prev.includes(topicId)
                ? prev.filter((id) => id !== topicId)
                : [...prev, topicId]
        ));
    }, []);

    const selectedHistoryTopics = useMemo(() => {
        const selected = new Set(selectedHistoryTopicIds);

        return historyTopicGroups.flatMap((group) => group.topics.filter((topic) => selected.has(topic.id)));
    }, [historyTopicGroups, selectedHistoryTopicIds]);

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
            const imageSelectorItem = getMediaSelectorItemForModelId(imageModelSelectorItems, imageModel.id);
            const toolName = imageSelectorItem?.type === 'tiered'
                ? getImageSelectorChipLabel(imageSelectorItem, text)
                : text[imageModel.nameKey];

            return {
                accent: imageModel.accent,
                icon: imageModel.icon,
                toolName,
                emoji: null,
            };
        }

        const videoModel = VIDEO_MODEL_DEFINITIONS.find((model) => (
            value === model.id || value.includes(model.id)
        ));

        if (videoModel) {
            const videoSelectorItem = getMediaSelectorItemForModelId(videoModelSelectorItems, videoModel.id);
            const toolName = videoSelectorItem?.type === 'tiered'
                ? getVideoSelectorChipLabel(videoSelectorItem, text)
                : text[videoModel.nameKey];

            return {
                accent: videoModel.accent,
                icon: videoModel.icon,
                toolName,
                emoji: null,
            };
        }

        const audioModelDef = AUDIO_MODEL_DEFINITIONS.find((model) => (
            value === model.id || value.includes(model.id)
        ));

        if (audioModelDef) {
            const audioSelectorItem = getMediaSelectorItemForModelId(audioModelSelectorItems, audioModelDef.id);
            const toolName = audioSelectorItem?.type === 'tiered'
                ? getAudioSelectorChipLabel(audioSelectorItem, text)
                : text[audioModelDef.nameKey];

            return {
                accent: audioModelDef.accent,
                icon: audioModelDef.icon,
                toolName,
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
        const fromHistory = Boolean(options.messages?.length);
        const targetModelId = modelId
            ? resolveTextModelId(modelId, effectiveTextModels)
            : resolveTextModelId(textModel, effectiveTextModels);
        const scope = getModelSessionScope(targetModelId, textModelSelectorItems);
        const stored = !fromHistory ? loadMediaSession('chat', scope) : null;
        const memoryActive = !fromHistory && scope === chatSessionScope;

        setTextModel(targetModelId);
        setStoredTextModelId(targetModelId);

        if (fromHistory) {
        if (options.sessionId) {
            setChatSessionId(options.sessionId);
        }
        setChatMessages(options.messages ?? []);
        setChatTopicTitle(options.topicTitle ?? '');
            setIsGeneratingText(false);
        } else {
            const restored = resolveChatSessionState({
                memory: memoryActive
                    ? {
                        sessionId: chatSessionId,
                        messages: chatMessages,
                        topicTitle: chatTopicTitle,
                        isGenerating: isGeneratingText,
                    }
                    : null,
                stored,
            });

            if (restored) {
                setChatSessionId(restored.sessionId || createChatSessionId());
                setChatMessages(restored.messages);
                setChatTopicTitle(restored.topicTitle);
                setIsGeneratingText(false);
            } else {
                startNewChatSession();
                setChatMessages([]);
                setChatTopicTitle('');
                setIsGeneratingText(false);
            }
        }

        setTextPrompt('');
        setChatAttachment(null);
        setChatReturnPage(returnPage);
        setChatError('');
        setCurrentPage('ai-chat');
    };

    const openHistoryTopic = (topic) => {
        const modelId = resolveHistoryTopicModel(topic);
        const isImageTopic = IMAGE_MODEL_IDS.includes(modelId);
        const isVideoTopic = VIDEO_MODEL_IDS.includes(modelId);
        const isAudioTopic = AUDIO_MODEL_IDS.includes(modelId);
        const mediaSessionFromHistory = topic.sessionId
                || topic.items?.[0]?.sessionId
                || topic.items?.[0]?.session_id
                || null;

        if (isImageTopic) {
            openAiImage(modelId, 'history', {
                messages: buildImageMessagesFromHistoryTopic(topic),
                sessionId: mediaSessionFromHistory,
            });
            return;
        }

        if (isVideoTopic) {
            openAiVideo(modelId, 'history', {
                messages: buildVideoMessagesFromHistoryTopic(topic),
                sessionId: mediaSessionFromHistory,
            });
            return;
        }

        if (isAudioTopic) {
            const items = Array.isArray(topic?.items) ? topic.items : [];
            const lastItem = items[items.length - 1] ?? topic?.lastItem;
            const restoredPrompt = String(lastItem?.prompt || topic?.topicTitle || '').trim();
            const restoredAudioUrl = String(lastItem?.response || '').trim();

            openAiVoice(modelId, 'history', {
                sessionId: mediaSessionFromHistory,
                prompt: restoredPrompt,
                audioUrl: restoredAudioUrl,
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

    useEffect(() => {
        const planId = userData.subscriptionPlanId;

        if (!planUnlocksModel(planId, textModel, 'text')) {
            const nextId = pickFirstUnlockedModelId(
                effectiveTextModels.map((model) => model.id),
                planId,
                'text',
            );
            if (nextId && nextId !== textModel) {
                setTextModel(nextId);
            }
        }

        if (!planUnlocksModel(planId, imageModel, 'image')) {
            const nextId = pickFirstUnlockedModelId(IMAGE_MODEL_DEFINITIONS.map((m) => m.id), planId, 'image');
            if (nextId && nextId !== imageModel) {
                setImageModel(nextId);
            }
        }

        if (!planUnlocksModel(planId, videoModel, 'video')) {
            const nextId = pickFirstUnlockedModelId(VIDEO_MODEL_DEFINITIONS.map((m) => m.id), planId, 'video');
            if (nextId && nextId !== videoModel) {
                setVideoModel(nextId);
            }
        }

        if (!planUnlocksModel(planId, audioModel, 'audio')) {
            const nextId = pickFirstUnlockedModelId(AUDIO_MODEL_DEFINITIONS.map((m) => m.id), planId, 'audio');
            if (nextId && nextId !== audioModel) {
                setAudioModel(nextId);
            }
        }

        if (!planUnlocksModel(planId, threeDModel, '3d')) {
            const nextId = pickFirstUnlockedModelId(THREE_D_MODEL_DEFINITIONS.map((m) => m.id), planId, '3d');
            if (nextId && nextId !== threeDModel) {
                setThreeDModel(nextId);
            }
        }
    }, [
        userData.subscriptionPlanId,
        effectiveTextModels,
        textModel,
        imageModel,
        videoModel,
        audioModel,
        threeDModel,
    ]);

    const handleTextModelChange = (modelId) => {
        const resolvedModelId = resolveTextModelId(modelId, effectiveTextModels);
        const targetGroupItem = getSelectorItemForModelId(textModelSelectorItems, resolvedModelId);
        const allowedModelIds = new Set(
            getAiVariantOptions(targetGroupItem, text, 'text', userData.subscriptionPlanId)
                .filter((option) => !option.locked)
                .map((option) => option.id),
        );

        if (!allowedModelIds.has(resolvedModelId)) {
            return;
        }

        if (resolvedModelId === textModel) {
            return;
        }

        saveMediaSession('chat', {
            model: textModel,
            sessionId: chatSessionId,
            messages: chatMessages,
            topicTitle: chatTopicTitle,
            isGenerating: isGeneratingText,
        }, chatSessionScope);

        handleStopChatGeneration();

        const nextScope = getModelSessionScope(resolvedModelId, textModelSelectorItems);
        const stored = loadMediaSession('chat', nextScope);
        const nextModel = findTextModel(effectiveTextModels, resolvedModelId);

        setTextModel(resolvedModelId);
        setStoredTextModelId(resolvedModelId);

        if (stored) {
            setChatSessionId(stored.sessionId || createChatSessionId());
            setChatMessages(stored.messages ?? []);
            setChatTopicTitle(stored.topicTitle ?? '');
        } else {
        startNewChatSession();
        setChatMessages([]);
        setChatTopicTitle('');
        }

        setTextPrompt('');
        if (!textModelSupportsImage(nextModel)) {
            setChatAttachment(null);
        }
        setChatError('');
    };

    const handleImageModelChange = (modelId) => {
        if (modelId === imageModel) {
            return;
        }

        saveMediaSession('image', {
            model: imageModel,
            sessionId: imageSessionId,
            messages: imageSessionMessages,
            generatedImageUrl,
            generatedImageUrls,
            isGenerating: isGeneratingImage,
        }, imageSessionScope);

        const nextScope = getModelSessionScope(modelId, imageModelSelectorItems);
        const stored = loadMediaSession('image', nextScope);

        setImageModel(modelId);
        applyImageModelOptions(modelId);

        if (stored) {
            setImageSessionId(stored.sessionId || createChatSessionId());
            setImageSessionMessages(stored.messages ?? []);
            setGeneratedImageUrl(stored.generatedImageUrl ?? '');
            setGeneratedImageUrls(Array.isArray(stored.generatedImageUrls) ? stored.generatedImageUrls : []);
        } else {
        startNewImageSession();
        setImageSessionMessages([]);
        setGeneratedImageUrl('');
            setGeneratedImageUrls([]);
        }

        setImagePrompt('');
        setImageAttachment(null);
        setImageError('');
    };

    const handleNewImageDialog = async () => {
        await archiveMediaMessagesToHistory({
            messages: imageSessionMessages,
            model: imageModel,
            sessionId: imageSessionId,
            getResponse: (message) => message?.imageUrl ?? message?.image_url ?? '',
        });
        clearMediaSession('image', imageSessionScope);
        startNewImageSession();
        setImageSessionMessages([]);
        setImagePrompt('');
        setImageAttachment(null);
        setGeneratedImageUrl('');
        setGeneratedImageUrls([]);
        setImageError('');
    };

    const handleImagePhotoSelect = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }
        if (!file.type.startsWith('image/')) {
            setImageError('Можно прикрепить только изображение.');
            return;
        }
        if (file.size > 12 * 1024 * 1024) {
            setImageError('Изображение слишком большое (макс. 12 МБ).');
            return;
        }

        try {
            const compressed = await compressImageFile(file);
            setImageAttachment(compressed);
            setImageError('');
        } catch {
            setImageError('Не удалось обработать изображение.');
        }
    };

    const startNewImageSession = useCallback(() => {
        setImageSessionId(createChatSessionId());
    }, []);

    const applyImageModelOptions = useCallback((modelId) => {
        const defaults = getImageModelDefaults(modelId);
        setImageAspectRatio(defaults.aspectRatio ?? '');
        setImageResolution(defaults.resolution ?? '');
        setImageQuality(defaults.quality ?? '');
        setImageOutputFormat(defaults.outputFormat ?? '');
    }, []);

    const applyVideoModelOptions = useCallback((modelId) => {
        const defaults = getVideoModelDefaults(modelId);
        setVideoAspectRatio(defaults.aspectRatio ?? '16:9');
        setVideoDuration(defaults.duration ?? 5);
        setVideoGenerateAudio(Boolean(defaults.generateAudio));
        setVideoCameraFixed(Boolean(defaults.cameraFixed));
        setVideoTurboMode(Boolean(defaults.turboMode));
        setVideoNegativePrompt(defaults.negativePrompt ?? '');
        if (videoModelIsKling(modelId)) {
            setVideoResolution(klingResolutionForModel(modelId) || defaults.resolution || '720p');
        } else {
            setVideoResolution(defaults.resolution ?? '');
        }
        setVideoCameraMovement(defaults.cameraMovement ?? 'auto');
        setVideoCameraHorizontal(0);
        setVideoCameraVertical(0);
        setVideoCameraPan(0);
        setVideoCameraTilt(0);
        setVideoCameraRoll(0);
        setVideoCameraZoom(0);
        setVideoSound(Boolean(defaults.sound));
    }, []);

    const applyAudioModelOptions = useCallback((modelId) => {
        const defaults = getAudioModelDefaults(modelId);
        setAudioLanguage(defaults.language ?? 'auto');
        setAudioVoice(defaults.voice ?? 'Dylan');
        setAudioStyleInstruction(defaults.styleInstruction ?? '');
        setAudioReferenceText(defaults.referenceText ?? '');
        setAudioSpeed(defaults.speed ?? '1.0');
        setAudioEmotion(defaults.emotion ?? 'happy');
        setAudioDuration(defaults.duration ?? 60);
        setAudioNumberOfSongs(defaults.numberOfSongs ?? '1');
        setAudioOutputFormat(defaults.outputFormat ?? 'mp3');
    }, []);

    const handleImageOptionChange = (key, value) => {
        switch (key) {
            case 'aspectRatio':
                setImageAspectRatio(value);
                break;
            case 'resolution':
                setImageResolution(value);
                break;
            case 'quality':
                setImageQuality(value);
                break;
            case 'outputFormat':
                setImageOutputFormat(value);
                break;
            default:
                break;
        }
    };

    const resetVideoCameraAxes = useCallback(() => {
        setVideoCameraHorizontal(0);
        setVideoCameraVertical(0);
        setVideoCameraPan(0);
        setVideoCameraTilt(0);
        setVideoCameraRoll(0);
        setVideoCameraZoom(0);
    }, []);

    const handleVideoCameraAxisChange = (axis, value) => {
        const next = Number(value);
        const clamped = Math.max(-10, Math.min(10, next));
        resetVideoCameraAxes();
        switch (axis) {
            case 'cameraHorizontal':
                setVideoCameraHorizontal(clamped);
                break;
            case 'cameraVertical':
                setVideoCameraVertical(clamped);
                break;
            case 'cameraPan':
                setVideoCameraPan(clamped);
                break;
            case 'cameraTilt':
                setVideoCameraTilt(clamped);
                break;
            case 'cameraRoll':
                setVideoCameraRoll(clamped);
                break;
            case 'cameraZoom':
                setVideoCameraZoom(clamped);
                break;
            default:
                break;
        }
    };

    const handleVideoOptionChange = (key, value) => {
        switch (key) {
            case 'aspectRatio':
                setVideoAspectRatio(value);
                break;
            case 'duration':
                setVideoDuration(value);
                break;
            case 'resolution': {
                setVideoResolution(value);
                if (videoModelIsKling(videoModel)) {
                    const nextModelId = klingModelIdForResolution(value);
                    if (nextModelId !== videoModel) {
                        setVideoModel(nextModelId);
                    }
                } else if (value === '480p') {
                    setVideoTurboMode(false);
                }
                break;
            }
            case 'negativePrompt':
                setVideoNegativePrompt(value);
                break;
            case 'cameraMovement':
                setVideoCameraMovement(value);
                if (value !== 'simple') {
                    resetVideoCameraAxes();
                }
                break;
            case 'cameraHorizontal':
            case 'cameraVertical':
            case 'cameraPan':
            case 'cameraTilt':
            case 'cameraRoll':
            case 'cameraZoom':
                handleVideoCameraAxisChange(key, value);
                break;
            case 'sound':
                setVideoSound(Boolean(value));
                break;
            case 'generateAudio':
                setVideoGenerateAudio(Boolean(value));
                break;
            case 'cameraFixed':
                setVideoCameraFixed(Boolean(value));
                break;
            case 'turboMode': {
                const enabled = Boolean(value);
                setVideoTurboMode(enabled);
                if (enabled && videoResolution === '480p') {
                    setVideoResolution('720p');
                }
                break;
            }
            default:
                break;
        }
    };

    const handleAudioOptionChange = (key, value) => {
        switch (key) {
            case 'language':
                setAudioLanguage(value);
                break;
            case 'voice':
                setAudioVoice(value);
                break;
            case 'styleInstruction':
                setAudioStyleInstruction(value);
                break;
            case 'referenceText':
                setAudioReferenceText(value);
                break;
            case 'speed':
                setAudioSpeed(value);
                break;
            case 'emotion':
                setAudioEmotion(value);
                break;
            case 'duration':
                setAudioDuration(value);
                break;
            case 'numberOfSongs':
                setAudioNumberOfSongs(value);
                break;
            case 'outputFormat':
                setAudioOutputFormat(value);
                break;
            default:
                break;
        }
    };

    const applyThreeDModelOptions = useCallback((modelId) => {
        const defaults = getThreeDModelDefaults(modelId);
        setThreeDNegativePrompt(defaults.negativePrompt ?? '');
        setThreeDTextureQuality(defaults.textureQuality ?? 'detailed');
        setThreeDOutputFormat(defaults.outputFormat ?? 'glb');
        setThreeDGeometryQuality(defaults.geometryQuality ?? 'detailed');
        setThreeDMode(defaults.mode ?? 'full');
        setThreeDArtStyle(defaults.artStyle ?? 'realistic');
        setThreeDTopology(defaults.topology ?? 'quad');
        setThreeDTier(defaults.tier ?? 'Gen-2.5-Medium');
        setThreeDMaterial(defaults.material ?? 'PBR');
        setThreeDGeometryFileFormat(defaults.geometryFileFormat ?? 'glb');
        setThreeDTextureMode(defaults.textureMode ?? 'medium');
    }, []);

    const handleThreeDOptionChange = (key, value) => {
        switch (key) {
            case 'negativePrompt':
                setThreeDNegativePrompt(value);
                break;
            case 'textureQuality':
                setThreeDTextureQuality(value);
                break;
            case 'outputFormat':
                setThreeDOutputFormat(value);
                break;
            case 'geometryQuality':
                setThreeDGeometryQuality(value);
                break;
            case 'mode':
                setThreeDMode(value);
                break;
            case 'artStyle':
                setThreeDArtStyle(value);
                break;
            case 'topology':
                setThreeDTopology(value);
                break;
            case 'tier':
                setThreeDTier(value);
                break;
            case 'material':
                setThreeDMaterial(value);
                break;
            case 'geometryFileFormat':
                setThreeDGeometryFileFormat(value);
                break;
            case 'textureMode':
                setThreeDTextureMode(value);
                break;
            default:
                break;
        }
    };

    const openAiImage = (modelId, returnPage = currentPage, options = {}) => {
        const fromHistory = returnPage === 'history' || Boolean(options.messages?.length);
        const targetModelId = modelId || imageModel;
        const scope = getModelSessionScope(targetModelId, imageModelSelectorItems);
        const stored = !fromHistory ? loadMediaSession('image', scope) : null;
        const memoryActive = !fromHistory && scope === imageSessionScope;

        setImageModel(targetModelId);
        applyImageModelOptions(targetModelId);

        if (fromHistory) {
        if (options.sessionId) {
            setImageSessionId(options.sessionId);
            }

            const restoredMessages = options.messages ?? [];
            const restoredImageUrl = getLastSessionImageUrl(restoredMessages) ?? '';

            setImageSessionMessages(restoredMessages);
            setGeneratedImageUrl(restoredImageUrl);
            setGeneratedImageUrls(restoredImageUrl ? [restoredImageUrl] : []);
            setIsGeneratingImage(false);
        } else {
            const restored = resolveImageSessionState({
                memory: memoryActive
                    ? {
                        sessionId: imageSessionId,
                        messages: imageSessionMessages,
                        generatedImageUrl,
                        generatedImageUrls,
                        isGenerating: isGeneratingImage,
                    }
                    : null,
                stored,
            });

            if (restored) {
                setImageSessionId(restored.sessionId || createChatSessionId());
                setImageSessionMessages(restored.messages);
                setGeneratedImageUrl(restored.generatedImageUrl);
                setGeneratedImageUrls(restored.generatedImageUrls);
                setIsGeneratingImage(restored.isGenerating);
            } else {
            startNewImageSession();
                setImageSessionMessages([]);
                setGeneratedImageUrl('');
                setGeneratedImageUrls([]);
                setIsGeneratingImage(false);
        }
        }

        setImagePrompt('');
        setImageAttachment(null);
        setImageReturnPage(returnPage);
        setImageError('');
        setCurrentPage('ai-image');
    };

    const startNewVideoSession = useCallback(() => {
        setVideoSessionId(createChatSessionId());
    }, []);

    const handleVideoModelChange = (modelId) => {
        if (modelId === videoModel) {
            return;
        }

        saveMediaSession('video', {
            model: videoModel,
            sessionId: videoSessionId,
            messages: videoSessionMessages,
            generatedVideoUrl,
            videoPrompt,
            videoSourceImageUrl,
            videoSourceVideoUrl,
            isGenerating: isGeneratingVideo,
        }, videoSessionScope);

        const nextScope = getModelSessionScope(modelId, videoModelSelectorItems);
        const stored = loadMediaSession('video', nextScope);

        setVideoModel(modelId);
        applyVideoModelOptions(modelId);

        if (stored) {
            setVideoSessionId(stored.sessionId || createChatSessionId());
            setVideoSessionMessages(stored.messages ?? []);
            setVideoSourceImageUrl(stored.videoSourceImageUrl ?? getLastSessionSourceImageUrl(stored.messages) ?? '');
            setVideoSourceVideoUrl(stored.videoSourceVideoUrl ?? '');
            setVideoPrompt(stored.videoPrompt ?? '');
            setGeneratedVideoUrl(stored.generatedVideoUrl ?? getLastSessionVideoUrl(stored.messages) ?? '');
        } else {
            startNewVideoSession();
            setVideoSessionMessages([]);
            setVideoSourceImageUrl('');
            setVideoSourceVideoUrl('');
            setVideoPrompt('');
            setGeneratedVideoUrl('');
        }

        setVideoError('');
    };

    const handleNewVideoDialog = async () => {
        await archiveMediaMessagesToHistory({
            messages: videoSessionMessages,
            model: videoModel,
            sessionId: videoSessionId,
            getResponse: (message) => message?.videoUrl ?? message?.video_url ?? '',
            extraItems: (
                videoPrompt.trim() && generatedVideoUrl.trim()
                && !videoSessionMessages.some((message) => message?.videoUrl === generatedVideoUrl)
            )
                ? [{ prompt: videoPrompt.trim(), response: generatedVideoUrl.trim() }]
                : [],
        });
        clearMediaSession('video', videoSessionScope);
        startNewVideoSession();
        setVideoSessionMessages([]);
        setVideoSourceImageUrl('');
        setVideoSourceVideoUrl('');
        setVideoPrompt('');
        setGeneratedVideoUrl('');
        setVideoError('');
    };

    const startNewAudioSession = useCallback(() => {
        setAudioSessionId(createChatSessionId());
    }, []);

    const handleAudioModelChange = (modelId) => {
        if (modelId === audioModel) {
            return;
        }

        saveMediaSession('audio', {
            model: audioModel,
            sessionId: audioSessionId,
            audioPrompt,
            generatedAudioUrl,
            isGenerating: isGeneratingAudio,
        }, audioSessionScope);

        const nextScope = getModelSessionScope(modelId, audioModelSelectorItems);
        const stored = loadMediaSession('audio', nextScope);

        setAudioModel(modelId);
        applyAudioModelOptions(modelId);

        if (stored) {
            setAudioSessionId(stored.sessionId || createChatSessionId());
            setAudioPrompt(stored.audioPrompt ?? '');
            setGeneratedAudioUrl(stored.generatedAudioUrl ?? '');
        } else {
            startNewAudioSession();
            setAudioPrompt('');
            setGeneratedAudioUrl('');
        }

        setAudioAttachment(null);
        setAudioError('');
    };

    const handleNewAudioDialog = async () => {
        await archiveMediaMessagesToHistory({
            messages: [],
            model: audioModel,
            sessionId: audioSessionId,
            extraItems: audioPrompt.trim() && generatedAudioUrl.trim()
                ? [{ prompt: audioPrompt.trim(), response: generatedAudioUrl.trim() }]
                : [],
        });
        clearMediaSession('audio', audioSessionScope);
        startNewAudioSession();
        setAudioPrompt('');
        setAudioAttachment(null);
        setGeneratedAudioUrl('');
        setAudioError('');
    };

    const handleAudioAttachmentSelect = (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }
        if (!file.type.startsWith('audio/')) {
            setAudioError(language === 'ru' ? 'Можно прикрепить только аудиофайл.' : 'Only audio files are supported.');
            return;
        }
        if (file.size > 12 * 1024 * 1024) {
            setAudioError(language === 'ru' ? 'Аудио слишком большое (макс. 12 МБ).' : 'Audio file is too large (max 12 MB).');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = typeof reader.result === 'string' ? reader.result : '';
            if (!dataUrl) {
                return;
            }
            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            setAudioAttachment({
                previewUrl: dataUrl,
                base64,
                mimeType: file.type,
                name: file.name,
            });
            setAudioError('');
        };
        reader.onerror = () => {
            setAudioError(language === 'ru' ? 'Не удалось прочитать аудиофайл.' : 'Failed to read audio file.');
        };
        reader.readAsDataURL(file);
    };

    const openAiVoice = (modelId, returnPage = currentPage, options = {}) => {
        const fromHistory = Boolean(options.prompt || options.audioUrl);
        const targetModelId = modelId || audioModel;
        const scope = getModelSessionScope(targetModelId, audioModelSelectorItems);
        const stored = !fromHistory ? loadMediaSession('audio', scope) : null;
        const memoryActive = !fromHistory && scope === audioSessionScope;

        setAudioModel(targetModelId);
        applyAudioModelOptions(targetModelId);

        if (fromHistory) {
            if (options.sessionId) {
                setAudioSessionId(options.sessionId);
            }
            setAudioPrompt(options.prompt ?? '');
            setGeneratedAudioUrl(options.audioUrl ?? '');
            setIsGeneratingAudio(false);
        } else {
            const restored = resolveAudioSessionState({
                memory: memoryActive
                    ? {
                        sessionId: audioSessionId,
                        audioPrompt,
                        generatedAudioUrl,
                        isGenerating: isGeneratingAudio,
                    }
                    : null,
                stored,
            });

            if (restored) {
                setAudioSessionId(restored.sessionId || createChatSessionId());
                setAudioPrompt(restored.audioPrompt);
                setGeneratedAudioUrl(restored.generatedAudioUrl);
                setIsGeneratingAudio(restored.isGenerating);
            } else {
                startNewAudioSession();
                setAudioPrompt('');
                setGeneratedAudioUrl('');
                setIsGeneratingAudio(false);
            }
        }

        setAudioAttachment(null);
        setAudioReturnPage(returnPage);
        setAudioError('');
        setCurrentPage('ai-voice');
    };

    const openAiVideo = (modelId, returnPage = currentPage, options = {}) => {
        const fromHistory = returnPage === 'history' || Boolean(options.messages?.length);
        const targetModelId = modelId || videoModel;
        const scope = getModelSessionScope(targetModelId, videoModelSelectorItems);
        const stored = !fromHistory ? loadMediaSession('video', scope) : null;
        const memoryActive = !fromHistory && scope === videoSessionScope;

        setVideoModel(targetModelId);
        applyVideoModelOptions(targetModelId);

        if (fromHistory) {
            if (options.sessionId) {
                setVideoSessionId(options.sessionId);
            }

            const restoredMessages = options.messages ?? [];
            const restoredVideoUrl = getLastSessionVideoUrl(restoredMessages) ?? '';
            const restoredSourceImageUrl = getLastSessionSourceImageUrl(restoredMessages) ?? '';

            setVideoSessionMessages(restoredMessages);
            setVideoSourceImageUrl(restoredSourceImageUrl);
            setVideoSourceVideoUrl('');
            setVideoPrompt('');
            setGeneratedVideoUrl(restoredVideoUrl);
            setIsGeneratingVideo(false);
        } else {
            const restored = resolveVideoSessionState({
                memory: memoryActive
                    ? {
                        sessionId: videoSessionId,
                        messages: videoSessionMessages,
                        generatedVideoUrl,
                        videoPrompt,
                        videoSourceImageUrl,
                        videoSourceVideoUrl,
                        isGenerating: isGeneratingVideo,
                    }
                    : null,
                stored,
            });

            if (restored) {
                setVideoSessionId(restored.sessionId || createChatSessionId());
                setVideoSessionMessages(restored.messages);
                setVideoSourceImageUrl(restored.videoSourceImageUrl);
                setVideoSourceVideoUrl(restored.videoSourceVideoUrl);
                setVideoPrompt(restored.videoPrompt);
                setGeneratedVideoUrl(restored.generatedVideoUrl);
                setIsGeneratingVideo(restored.isGenerating);
            } else {
                startNewVideoSession();
                setVideoSessionMessages([]);
                setVideoSourceImageUrl('');
                setVideoSourceVideoUrl('');
                setVideoPrompt('');
                setGeneratedVideoUrl('');
                setIsGeneratingVideo(false);
            }
        }

        setVideoReturnPage(returnPage);
        setVideoError('');
        setCurrentPage('ai-video');
    };

    const handleCatalogToolClick = (tool) => {
        if (tool.locked) {
            showAppNotice(formatTemplate(text.modelLockedNotice, {
                model: getCatalogToolLabel(tool),
                plan: text[tool.requiredPlanLabelKey] ?? tool.requiredPlan ?? '',
            }));
            setCurrentPage('subscription');
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

        if (tool.page === 'ai-voice') {
            openAiVoice(tool.id, 'catalog');
            return;
        }

        if (tool.page === 'ai-3d') {
            openAi3D(tool.id, 'catalog');
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
        const attachedImage = imageAttachment;
        const canEdit = imageModelSupportsEdit(imageModel);
        const sessionImageUrl = canEdit
            ? (getLastSessionImageUrl(imageSessionMessages) ?? generatedImageUrl?.trim() ?? '')
            : '';
        const sourceImageUrl = attachedImage ? '' : sessionImageUrl;
        const isEdit = Boolean(attachedImage || sourceImageUrl);

        try {
            setIsGeneratingImage(true);
            setImageError('');
            setGeneratedImageUrl('');
            setGeneratedImageUrls([]);
            const response = await generateImage({
                prompt: trimmedPrompt,
                model: imageModel,
                messages: contextMessages,
                sessionId: imageSessionId,
                sourceImageUrl: sourceImageUrl || undefined,
                imageBase64: attachedImage?.base64,
                imageMimeType: attachedImage?.mimeType,
                aspectRatio: imageAspectRatio || undefined,
                resolution: imageResolution || undefined,
                quality: imageQuality || undefined,
                outputFormat: imageOutputFormat || undefined,
            });
            const imageUrl = response?.imageUrl?.trim() ?? '';
            const imageUrls = Array.isArray(response?.imageUrls) && response.imageUrls.length
                ? response.imageUrls
                : (imageUrl ? [imageUrl] : []);

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
                    content: isEdit ? text.imageEditedNote : text.imageGeneratedNote,
                    scenePrompt: trimmedPrompt,
                    imageUrl,
                },
            ]);
            setImagePrompt('');
            setImageAttachment(null);
            setGeneratedImageUrl(imageUrl);
            setGeneratedImageUrls(imageUrls);
            if (response?.item) {
                pushPromptHistoryItem(response.item);
            }
            void refreshWalletBalance();
        } catch (error) {
            setGeneratedImageUrl('');
            const message = formatUserFacingError(error, language);
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

        const requiresImage = videoModelRequiresImage(videoModel);
        const requiresVideo = videoModelRequiresVideo(videoModel);
        const isExtend = videoModel === 'seedance-v2-video-extend';
        const resolvedSourceImageUrl = requiresImage
            ? (
                videoSourceImageUrl.trim()
                || getLastSessionSourceImageUrl(videoSessionMessages)
                || ''
            )
            : '';
        const resolvedSourceVideoUrl = requiresVideo
            ? (
                getLastSessionVideoUrl(videoSessionMessages)
                || generatedVideoUrl?.trim()
                || videoSourceVideoUrl.trim()
                || ''
            )
            : '';

        if (requiresImage && !resolvedSourceImageUrl) {
            setVideoError(text.videoSourceImageRequired);
            return;
        }

        if (requiresVideo && !resolvedSourceVideoUrl) {
            setVideoError(text.videoSourceVideoRequired);
            return;
        }

        const contextMessages = buildImageContextMessages(videoSessionMessages);
        const hasVideoContext = Boolean(resolvedSourceVideoUrl && requiresVideo);

        try {
            setIsGeneratingVideo(true);
            setVideoError('');
            setGeneratedVideoUrl('');
            const videoCapabilities = getVideoModelCapabilities(videoModel);
            const cameraControl = videoCapabilities.options?.cameraMovement
                && videoCameraMovement
                && videoCameraMovement !== 'auto'
                ? {
                    type: videoCameraMovement,
                    config: videoCameraMovement === 'simple'
                        ? {
                            horizontal: videoCameraHorizontal,
                            vertical: videoCameraVertical,
                            pan: videoCameraPan,
                            tilt: videoCameraTilt,
                            roll: videoCameraRoll,
                            zoom: videoCameraZoom,
                        }
                        : undefined,
                }
                : undefined;

            const response = await generateVideo({
                    prompt: trimmedPrompt,
                model: videoModel,
                messages: contextMessages,
                sessionId: videoSessionId,
                aspectRatio: videoAspectRatio || undefined,
                duration: videoDuration,
                resolution: videoResolution || undefined,
                negativePrompt: videoCapabilities.options?.negativePrompt
                    ? (videoNegativePrompt.trim() || undefined)
                    : undefined,
                sourceImageUrl: resolvedSourceImageUrl || undefined,
                sourceVideoUrl: resolvedSourceVideoUrl || undefined,
                sound: videoCapabilities.options?.sound ? videoSound : undefined,
                cameraControl,
                generateAudio: videoCapabilities.options?.generateAudio
                    ? videoGenerateAudio
                    : undefined,
                cameraFixed: videoCapabilities.options?.cameraFixed
                    ? videoCameraFixed
                    : undefined,
                turboMode: (
                    videoCapabilities.options?.turboMode
                    && videoTurboMode
                ) ? true : undefined,
            });
            const videoUrl = response?.videoUrl?.trim() ?? '';

            if (!videoUrl) {
                setVideoError(text.videoGenerateEmpty);
                return;
            }

            const assistantNote = hasVideoContext
                ? (isExtend ? text.videoExtendedNote : text.videoEditedNote)
                : text.videoGeneratedNote;

            setVideoSessionMessages((prev) => [
                ...prev,
                {
                    id: `vid-user-${Date.now()}`,
                    role: 'user',
                    content: trimmedPrompt,
                    ...(resolvedSourceImageUrl ? { sourceImageUrl: resolvedSourceImageUrl } : {}),
                },
                {
                    id: `vid-assistant-${Date.now()}`,
                    role: 'assistant',
                    content: assistantNote,
                    scenePrompt: trimmedPrompt,
                    videoUrl,
                },
            ]);
            if (resolvedSourceImageUrl) {
                setVideoSourceImageUrl(resolvedSourceImageUrl);
            }
            setVideoPrompt('');
            setGeneratedVideoUrl(videoUrl);
            if (response?.item) {
                pushPromptHistoryItem(response.item);
            }
            void refreshWalletBalance();
        } catch (error) {
            setGeneratedVideoUrl('');
            const message = formatUserFacingError(error, language);
            setVideoError(message || 'Не удалось сгенерировать видео.');
        } finally {
            setIsGeneratingVideo(false);
        }
    };

    const handleGenerateAudio = async () => {
        const trimmedPrompt = audioPrompt.trim();
        const isAceStep = audioModel === 'ace-step-1.5';

        if (!trimmedPrompt && !isAceStep) {
            setAudioError(text.textPromptEmpty);
            return;
        }

        if (isAceStep && !audioStyleInstruction.trim()) {
            setAudioError(language === 'ru' ? 'Укажите стиль (tags) для генерации.' : 'Style tags are required.');
            return;
        }

        const isCloneMode = Boolean(audioAttachment) && audioModelSupportsClone(audioModel);

        try {
            setIsGeneratingAudio(true);
            setAudioError('');
            setGeneratedAudioUrl('');

            const response = await generateAudio({
                prompt: trimmedPrompt,
                model: audioModel,
                sessionId: audioSessionId,
                language: audioLanguage || undefined,
                voice: isCloneMode ? undefined : (audioVoice || undefined),
                styleInstruction: isCloneMode ? undefined : (audioStyleInstruction || undefined),
                referenceText: isCloneMode ? (audioReferenceText || undefined) : undefined,
                audioBase64: isCloneMode ? audioAttachment?.base64 : undefined,
                audioMimeType: isCloneMode ? audioAttachment?.mimeType : undefined,
                speed: audioSpeed || undefined,
                emotion: audioEmotion || undefined,
                duration: audioDuration || undefined,
                numberOfSongs: audioNumberOfSongs || undefined,
                outputFormat: audioOutputFormat || undefined,
            });
            const audioUrl = response?.audioUrl?.trim() ?? '';

            if (!audioUrl) {
                setAudioError(text.voiceGenerateEmpty);
                return;
            }

            setGeneratedAudioUrl(audioUrl);
            void refreshWalletBalance();
        } catch (error) {
            setGeneratedAudioUrl('');
            const message = formatUserFacingError(error, language);
            setAudioError(message || (language === 'ru' ? 'Не удалось сгенерировать аудио.' : 'Failed to generate audio.'));
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const startNewThreeDSession = useCallback(() => {
        setThreeDSessionId(createChatSessionId());
    }, []);

    const handleThreeDModelChange = (modelId) => {
        if (modelId === threeDModel) {
            return;
        }

        setThreeDModel(modelId);
        applyThreeDModelOptions(modelId);
        setThreeDAttachment(null);
        setThreeDAttachments([]);
        setThreeDError('');
    };

    const handleThreeDAttachmentSelect = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }
        if (!file.type.startsWith('image/')) {
            setThreeDError(language === 'ru' ? 'Можно прикрепить только изображение.' : 'Only images are supported.');
            return;
        }
        if (file.size > 12 * 1024 * 1024) {
            setThreeDError(language === 'ru' ? 'Изображение слишком большое (макс. 12 МБ).' : 'Image is too large (max 12 MB).');
            return;
        }

        try {
            const compressed = await compressImageFile(file);
            setThreeDAttachment(compressed);
            setThreeDError('');
            } catch {
            setThreeDError(language === 'ru' ? 'Не удалось обработать изображение.' : 'Failed to process image.');
        }
    };

    const handleThreeDMultiAttachmentSelect = async (event) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (!files.length) {
            return;
        }

        try {
            const compressedList = [];
            for (const file of files.slice(0, 4)) {
                if (!file.type.startsWith('image/')) {
                    continue;
                }
                compressedList.push(await compressImageFile(file));
            }
            if (!compressedList.length) {
                setThreeDError(language === 'ru' ? 'Можно прикрепить только изображения.' : 'Only images are supported.');
                return;
            }
            setThreeDAttachments(compressedList);
            setThreeDError('');
        } catch {
            setThreeDError(language === 'ru' ? 'Не удалось обработать изображения.' : 'Failed to process images.');
        }
    };

    const openAi3D = (modelId, returnPage = currentPage) => {
        const targetModelId = modelId || threeDModel;
        setThreeDModel(targetModelId);
        applyThreeDModelOptions(targetModelId);
        setThreeDPrompt('');
        setThreeDAttachment(null);
        setThreeDAttachments([]);
        setGeneratedThreeDUrl('');
        setIsGeneratingThreeD(false);
        startNewThreeDSession();
        setThreeDReturnPage(returnPage);
        setThreeDError('');
        setCurrentPage('ai-3d');
    };

    const handleGenerateThreeD = async () => {
        const trimmedPrompt = threeDPrompt.trim();
        const requiresImage = threeDModelRequiresImage(threeDModel);
        const requiresMultiImage = threeDModelRequiresMultiImage(threeDModel);
        const requiresPrompt = threeDModelRequiresPrompt(threeDModel);

        if (requiresPrompt && !trimmedPrompt) {
            setThreeDError(text.textPromptEmpty);
            return;
        }

        if (requiresMultiImage && threeDAttachments.length < 2) {
            setThreeDError(text.threeDMultiImageRequired);
            return;
        }

        if (requiresImage && !threeDModelRequiresMultiImage(threeDModel) && !threeDAttachment) {
            setThreeDError(text.threeDSourceImageRequired);
            return;
        }

        try {
            setIsGeneratingThreeD(true);
            setThreeDError('');
            setGeneratedThreeDUrl('');

            const response = await generate3D({
                prompt: trimmedPrompt,
                model: threeDModel,
                sessionId: threeDSessionId,
                negativePrompt: threeDNegativePrompt || undefined,
                textureQuality: threeDTextureQuality || undefined,
                outputFormat: threeDOutputFormat || undefined,
                geometryQuality: threeDGeometryQuality || undefined,
                mode: threeDMode || undefined,
                artStyle: threeDArtStyle || undefined,
                topology: threeDTopology || undefined,
                tier: threeDTier || undefined,
                material: threeDMaterial || undefined,
                geometryFileFormat: threeDGeometryFileFormat || undefined,
                textureMode: threeDTextureMode || undefined,
                imageBase64: threeDAttachment?.base64,
                imageMimeType: threeDAttachment?.mimeType,
                imageBase64List: threeDAttachments.map((item) => item.base64),
                imageMimeTypes: threeDAttachments.map((item) => item.mimeType),
            });

            const modelUrl = response?.modelUrl?.trim() ?? '';
            if (!modelUrl) {
                setThreeDError(text.threeDGenerateEmpty);
                return;
            }

            setGeneratedThreeDUrl(modelUrl);
            if (response?.item) {
                pushPromptHistoryItem(response.item);
            }
            void refreshWalletBalance();
        } catch (error) {
            setGeneratedThreeDUrl('');
            const message = formatUserFacingError(error, language);
            setThreeDError(message || (language === 'ru' ? 'Не удалось сгенерировать 3D.' : 'Failed to generate 3D model.'));
        } finally {
            setIsGeneratingThreeD(false);
        }
    };

    const handleNewChatDialog = async () => {
        await archiveMediaMessagesToHistory({
            messages: chatMessages,
            model: textModel,
            sessionId: chatSessionId,
            getResponse: (message) => (message?.role === 'assistant' ? message?.content : ''),
        });
        clearMediaSession('chat', chatSessionScope);
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
        <AppPageHeader
            title={title}
            onBack={onBack}
            backLabel={text.back}
        />
    );

    const renderAiScreenHeader = ({
        title,
        subtitle,
        onBack,
        onNewDialog,
        newDialogDisabled = false,
        showCoinWidget = false,
    }) => (
        <AppPageHeader
            title={title}
            subtitle={subtitle}
            onBack={onBack}
            backLabel={text.back}
            centerAddon={showCoinWidget ? (
                <CoinBalanceWidget
                    balance={tokenBalance}
                    onClick={openCoinTopUp}
                    onTopUp={openCoinTopUp}
                    compact
                    showPlus
                    topUpLabel={text.profileTopUp}
                />
            ) : null}
            trailing={onNewDialog ? (
                <button
                    type="button"
                    className="app-page-header__action app-page-header__action--text"
                    onClick={onNewDialog}
                    disabled={newDialogDisabled}
                >
                    {text.chatNewDialog}
            </button>
            ) : (
                <span className="app-page-header__spacer" aria-hidden="true" />
            )}
        />
    );

    const handleCoinPackPurchase = () => {
        showAppNotice(text.walletCoinPackSoon);
    };

    const renderSubscriptionPlanCards = (currentPlanId = 'pro', { variant = 'default' } = {}) => {
        const plans = Array.isArray(billingCatalog?.plans) && billingCatalog.plans.length
            ? billingCatalog.plans
            : subscriptionPlanDefs.map((plan) => ({
                id: plan.id,
                name: text[plan.nameKey],
                badge: text[plan.badgeKey],
                badge_class: plan.badgeClass,
                price_rub: Number(String(text[plan.priceKey] ?? '0').replace(/[^\d]/g, '')) || 0,
                price_sub: text[plan.priceSubKey],
                coins: 0,
                features: [],
                locked: [],
                popular: Boolean(plan.popular),
            }));

        return plans.map((plan, index) => {
            const planFeaturesMap = {
                free: text.planFreeFeatures,
                basic: text.planBasicFeatures,
                pro: text.planProFeatures,
                max: text.planMaxFeatures,
                ultra: text.planUltraFeatures,
            };
            const displayFeatures = (Array.isArray(plan.features) && plan.features.length)
                ? plan.features
                : (planFeaturesMap[plan.id] ?? text.planProFeatures);
            const displayLocked = (Array.isArray(plan.locked) && plan.locked.length)
                ? plan.locked
                : (plan.id === 'free' ? text.planFreeLocked : []);
            const isCurrent = plan.id === currentPlanId;
            const badgeClass = plan.badge_class || plan.badgeClass || 'free';
            const coins = Number(plan.coins) || 0;
            const planDef = subscriptionPlanDefs.find((entry) => entry.id === plan.id);
            const displayName = language === 'en'
                ? getSubscriptionPlanEnglishName(plan.id, plan.name)
                : (plan.name || (planDef ? text[planDef.nameKey] : plan.id));
            const displayBadge = plan.badge || (planDef ? text[planDef.badgeKey] : '');
            const displayPriceSub = plan.price_sub || (planDef ? text[planDef.priceSubKey] : '');

            if (variant === 'page') {
                return (
                    <article
                        key={plan.id}
                        className={[
                            'subscription-plan-card',
                            `subscription-plan-card--${badgeClass}`,
                            plan.popular ? 'subscription-plan-card--popular' : '',
                            isCurrent ? 'subscription-plan-card--current' : '',
                        ].filter(Boolean).join(' ')}
                        style={{ '--card-index': index }}
                    >
                        <div className="subscription-plan-card__header">
                            <div>
                                <h3 className="subscription-plan-card__name">{displayName}</h3>
                                <span className={`subscription-plan-card__badge subscription-plan-card__badge--${badgeClass}`}>
                                    {displayBadge}
                                </span>
                            </div>
                            <div className="subscription-plan-card__price-block">
                                <span className="subscription-plan-card__price">{formatPlanPrice(plan.price_rub, language)}</span>
                                <small>{displayPriceSub}</small>
                            </div>
                        </div>
                        {coins > 0 ? (
                            <div className="subscription-plan-card__coins">
                                <CoinIcon size={16} className="subscription-plan-card__coin-icon" />
                                <span className="subscription-plan-card__coin-value">{formatNumber(coins)}</span>
                                <span className="subscription-plan-card__coin-label">{text.subscriptionCoinsPerMonth}</span>
                            </div>
                        ) : null}
                        {isCurrent && userData.subscriptionTimeLeft ? (
                            <SubscriptionTimeBadge
                                timeLeftLabel={userData.subscriptionTimeLeft}
                                expiryDateLabel={userData.subscriptionExpiryDate}
                                expiringSoon={userData.subscriptionExpiringSoon}
                                language={language}
                                compact
                            />
                        ) : null}
                        <ul className="subscription-plan-card__features">
                            {displayFeatures.map((feature) => (
                                <li key={feature} className="subscription-plan-card__feat">
                                    <Check size={14} aria-hidden="true" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                            {displayLocked.map((feature) => (
                                <li key={feature} className="subscription-plan-card__feat subscription-plan-card__feat--locked">
                                    <Lock size={14} aria-hidden="true" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            type="button"
                            className="subscription-plan-card__details"
                            onClick={() => setPlanDetailPlanId(plan.id)}
                        >
                            {text.planDetailButton}
                        </button>
                        <button
                            type="button"
                            className={`subscription-plan-card__btn ${isCurrent ? 'subscription-plan-card__btn--current' : ''}`}
                            disabled={isCurrent}
                            onClick={isCurrent ? undefined : handleCoinPackPurchase}
                        >
                            {isCurrent && userData.subscriptionTimeLeft
                                ? userData.subscriptionTimeLeft
                                : (isCurrent ? text.planCurrentButton : text.planSelectButton)}
                        </button>
                    </article>
                );
            }

            return (
                <article
                    key={plan.id}
                    className={`profile-concept__plan-card ${plan.popular ? 'profile-concept__plan-card--popular' : ''} ${isCurrent ? 'profile-concept__plan-card--current' : ''}`}
                >
                    {plan.popular ? <span className="profile-concept__plan-glow" aria-hidden="true" /> : null}
                    <div className="profile-concept__plan-top">
                        <div>
                            <div className="profile-concept__plan-name">{displayName}</div>
                            <span className={`profile-concept__plan-badge profile-concept__plan-badge--${badgeClass}`}>
                                {displayBadge}
                            </span>
                        </div>
                        <div className="profile-concept__plan-price">
                            <span>{formatPlanPrice(plan.price_rub, language)}</span>
                            <small>{displayPriceSub}</small>
                        </div>
                    </div>
                    <div className="profile-concept__plan-features">
                        {displayFeatures.map((feature) => (
                            <div key={feature} className="profile-concept__feat">
                                <Check size={13} aria-hidden="true" />
                                {feature}
                            </div>
                        ))}
                        {displayLocked.map((feature) => (
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
                        onClick={isCurrent ? undefined : handleCoinPackPurchase}
                    >
                        {isCurrent ? text.planCurrentButton : text.planSelectButton}
                    </button>
                </article>
            );
        });
    };

    const renderCoinPackCards = () => {
        const packs = Array.isArray(billingCatalog?.coinPacks) ? billingCatalog.coinPacks : [];

        return packs.map((pack) => (
            <article key={pack.id} className="subscription-concept__coin-pack">
                <div className="subscription-concept__coin-pack-top">
                    <div>
                        <div className="subscription-concept__coin-pack-name">{pack.name}</div>
                        <div className="subscription-concept__coin-pack-coins">
                            <CoinIcon size={15} className="profile-concept__coin-icon" />
                            {formatNumber(pack.coins)}
                        </div>
                    </div>
                    <div className="subscription-concept__coin-pack-price">
                        {pack.badge ? <span className="subscription-concept__coin-pack-badge">{pack.badge}</span> : null}
                        <span>{formatPackPrice(pack.price_rub)}</span>
                    </div>
                </div>
                <button
                    type="button"
                    className="subscription-concept__plan-btn"
                    onClick={handleCoinPackPurchase}
                >
                    {text.walletCoinPackBuy}
                </button>
            </article>
        ));
    };

    const handleStopChatGeneration = useCallback(() => {
        textGenerationAbortRef.current?.abort();
        textGenerationAbortRef.current = null;
        stopAllBackgroundTyping();
        setIsGeneratingText(false);
        const pendingId = pendingAssistantIdRef.current;
        if (pendingId) {
            setChatMessages((prev) => prev.filter((message) => message.id !== pendingId));
            pendingAssistantIdRef.current = null;
        }
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

    const handleDeleteSelectedHistoryRequest = () => {
        if (selectedHistoryTopics.length === 0) {
            return;
        }

        setConfirmDialog({
            message: formatTemplate(text.historyDeleteSelectedConfirm, {
                count: selectedHistoryTopics.length,
            }),
            confirmLabel: text.historyDeleteConfirmAction,
            cancelLabel: text.historyDeleteCancel,
            onConfirm: async () => {
                try {
                    await Promise.all(selectedHistoryTopics.map((topic) => {
                        const topicIds = Array.isArray(topic.items)
                            ? topic.items.map((item) => Number(item.id)).filter((id) => Number.isFinite(id) && id > 0)
                            : [];

                        return deletePromptHistoryTopic({
                            sessionId: topic.sessionId,
                            ids: topicIds,
                        });
                    }));

                    setPromptHistoryData((prev) => removeHistoryTopicsFromPromptData(prev, selectedHistoryTopics));
                    exitHistorySelectMode();
                    showAppNotice(text.historyTopicsDeleted, 'success');
                } catch (error) {
                    showAppNotice(error instanceof Error ? error.message : text.historyTopicDeleteFailed, 'error');
                }
            },
        });
    };

    const handleHistoryDeleteAction = () => {
        if (!historySelectMode) {
            setHistorySelectMode(true);
            setSelectedHistoryTopicIds([]);
            return;
        }

        handleDeleteSelectedHistoryRequest();
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
            void refreshWalletBalance();
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

    const handleAudioComposerKeyDown = (event) => {
        if (isGeneratingAudio) {
            return;
        }

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleGenerateAudio();
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

    useEffect(() => {
        let cancelled = false;

        fetchHomeWidgets()
            .then((slides) => {
                if (!cancelled) {
                    setHomeWidgetSlides(slides);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setHomeWidgetSlides(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const homeNewsSlides = useMemo(() => {
        if (Array.isArray(homeWidgetSlides) && homeWidgetSlides.length > 0) {
            return homeWidgetSlides;
        }

        return getHomeNewsSlides(text);
    }, [homeWidgetSlides, text]);

    const homeContinueTopic = useMemo(
        () => groupHistoryIntoTopics(historyItems)[0] ?? null,
        [historyItems],
    );

    const homeHistoryLabelParams = useMemo(() => ({
        effectiveTextModels,
        textModelSelectorItems,
        imageModelSelectorItems,
        videoModelSelectorItems,
        audioModelSelectorItems,
        imageDefinitions: IMAGE_MODEL_DEFINITIONS,
        videoDefinitions: VIDEO_MODEL_DEFINITIONS,
        audioDefinitions: AUDIO_MODEL_DEFINITIONS,
        text,
        getImageSelectorChipLabel,
        getVideoSelectorChipLabel,
        getAudioSelectorChipLabel,
    }), [
        effectiveTextModels,
        textModelSelectorItems,
        imageModelSelectorItems,
        videoModelSelectorItems,
        audioModelSelectorItems,
        text,
    ]);

    const homeContinueModelLabel = useMemo(() => {
        if (homeContinueTopic) {
            return getHistoryTopicLabel({
                topic: homeContinueTopic,
                ...homeHistoryLabelParams,
            }) || text.chatTitle;
        }

        return getModelLabel(effectiveTextModels, textModel, textModelSelectorItems) || text.chatTitle;
    }, [homeContinueTopic, homeHistoryLabelParams, effectiveTextModels, textModel, textModelSelectorItems, text.chatTitle]);

    const homeContinueTitle = useMemo(() => {
        const template = homeContinueTopic ? text.homeContinueWith : text.homeContinueStart;
        return formatTemplate(template, { model: homeContinueModelLabel });
    }, [homeContinueTopic, text.homeContinueWith, text.homeContinueStart, homeContinueModelLabel]);

    const homeContinueSubtitle = useMemo(() => {
        if (homeContinueTopic?.latestAt) {
            return formatTemplate(text.homeContinueSub, {
                time: formatRelativeTime(homeContinueTopic.latestAt, language),
            });
        }

        return text.homeContinueEmptySub;
    }, [homeContinueTopic, text.homeContinueSub, text.homeContinueEmptySub, language]);

    const handleHomeContinueClick = () => {
        if (homeContinueTopic) {
            openHistoryTopic(homeContinueTopic);
            return;
        }

            openAiChat(textModel, 'home');
    };

    const handleHomeSocialTelegram = async () => {
        const url = await resolveSupportUrl();
        openSupport(url);
    };

    const renderHomeScreen = () => (
        <section className="home-screen home-screen--concept home-screen--widgets" aria-label={text.navHome}>
            <div className="home-concept__orb" aria-hidden="true" />

            <header className="home-concept__header">
                <div className="home-concept__header-left">
                    <div className="home-concept__hdr-logo">
                    <img
                            className="home-concept__logo-image home-concept__logo-image--header"
                            src="/logo-cm.png"
                        alt=""
                    />
                        <span className="home-concept__logo-name">{text.homeBrandName}</span>
                    </div>
                    <p className="home-concept__greeting-text">{homeGreetingText}</p>
                </div>
                <div className="home-concept__header-actions">
                    <AppNotifications
                        notifications={appNotifications}
                        language={language}
                        onOpenSubscription={() => setCurrentPage('subscription')}
                        onOpenWallet={() => setCurrentPage('wallet')}
                        onMarkRead={handleMarkNotificationsRead}
                    />
                    <button
                        type="button"
                        className="home-concept__icon-btn"
                        aria-label={text.settingsTitle}
                        onClick={() => setCurrentPage('settings')}
                    >
                        <Settings size={22} />
                    </button>
                </div>
            </header>

            <HomeNewsWidget slides={homeNewsSlides} />

            <button
                type="button"
                className="home-continue-card"
                onClick={handleHomeContinueClick}
            >
                <span className="home-continue-card__ico" aria-hidden="true">
                    <Play size={18} />
                </span>
                <span className="home-continue-card__text">
                    <span className="home-continue-card__title">{homeContinueTitle}</span>
                    <span className="home-continue-card__sub">{homeContinueSubtitle}</span>
                </span>
                <ChevronRight size={18} className="home-continue-card__arrow" aria-hidden="true" />
            </button>

            {userData.subscriptionIsPaid ? (
                <div className="home-subscription-widget">
                    <SubscriptionTimeBadge
                        timeLeftLabel={userData.subscriptionTimeLeft}
                        expiryDateLabel={userData.subscriptionExpiryDate}
                        expiringSoon={userData.subscriptionExpiringSoon}
                        language={language}
                        inline
                    />
                    {userData.subscriptionExpiringSoon ? (
                        <button
                            type="button"
                            className="home-subscription-widget__renew"
                            onClick={() => setCurrentPage('subscription')}
                        >
                            {text.subscriptionRenewHint}
                        </button>
                    ) : null}
                </div>
            ) : null}

            <p className="home-concept__section-label home-concept__section-label--widgets">{text.homeSocialLabel}</p>
            <div className="home-social-row">
                        <button
                            type="button"
                    className="home-social-card"
                    onClick={() => openExternalLink(HOME_SOCIAL_LINKS.tiktok)}
                        >
                    <span className="home-social-card__ico home-social-card__ico--tiktok" aria-hidden="true">
                        <Music2 size={16} />
                                </span>
                    <span className="home-social-card__label">{text.homeSocialTiktok}</span>
                </button>
                <button
                    type="button"
                    className="home-social-card"
                    onClick={() => openExternalLink(HOME_SOCIAL_LINKS.instagram)}
                >
                    <span className="home-social-card__ico home-social-card__ico--instagram" aria-hidden="true">
                        <FaInstagram size={16} />
                            </span>
                    <span className="home-social-card__label">{text.homeSocialInstagram}</span>
                        </button>
                <button
                    type="button"
                    className="home-social-card"
                    onClick={handleHomeSocialTelegram}
                >
                    <span className="home-social-card__ico home-social-card__ico--telegram" aria-hidden="true">
                        <FaTelegram size={16} />
                    </span>
                    <span className="home-social-card__label">{text.homeSocialTelegram}</span>
                </button>
            </div>
        </section>
    );

    const renderCatalogScreen = () => (
        <section className="catalog-screen catalog-screen--concept">
            <AppPageHeader
                title={text.catalogTitle}
                trailing={(
                    <CoinBalanceWidget
                        balance={tokenBalance}
                        onClick={openCoinTopUp}
                        onTopUp={openCoinTopUp}
                        compact
                        showPlus
                        topUpLabel={text.profileTopUp}
                    />
                )}
            />

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
                            const priceRange = getCatalogToolPriceRange(tool);
                            const priceLabel = formatCatalogPriceLabel(priceRange, language);

                            return (
                                <button
                                    key={tool.groupId ?? tool.id}
                                    type="button"
                                    className={`catalog-concept__card ${tool.locked ? 'catalog-concept__card--locked' : ''}`}
                                    onClick={() => handleCatalogToolClick(tool)}
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
                                    {!tool.locked ? (
                                        <span className="catalog-concept__price" aria-label={`${priceLabel} coins`}>
                                            <CoinIcon size={12} />
                                            {priceLabel}
                                        </span>
                                    ) : (
                                        <span className="catalog-concept__plan-lock">
                                            {text[tool.requiredPlanLabelKey] ?? tool.requiredPlan}
                                        </span>
                                    )}
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
        const activeSelectorItem = getSelectorItemForModelId(textModelSelectorItems, textModel);
        const headerTitle = getAiGroupTitle(activeSelectorItem, text, (item) => item.label);
        const headerSubtitle = activeSelectorItem?.type === 'tiered' && activeModel
            ? text.chatTitle
            : (activeModel?.description ?? text.chatTitle);
        const variantOptions = getAiVariantOptions(activeSelectorItem, text, 'text', userData.subscriptionPlanId);
        const supportsChatImage = textModelSupportsImage(activeModel);

        return (
            <section className="ai-chat-screen ai-chat-screen--concept" aria-label={text.chatTitle}>
                {renderAiScreenHeader({
                    title: headerTitle,
                    subtitle: headerSubtitle,
                    onBack: () => setCurrentPage(chatReturnPage),
                    onNewDialog: handleNewChatDialog,
                    newDialogDisabled: isGeneratingText,
                })}

                {variantOptions.length > 1 ? (
                    <AiVariantSelect
                        id="ai-chat-variant"
                        label={text.mediaModelVariantLabel}
                        value={textModel}
                        options={variantOptions}
                        onChange={handleTextModelChange}
                        onLockedSelect={handleLockedModelSelect}
                        text={text}
                                    disabled={isGeneratingText}
                    />
                ) : null}

                <div className="ai-chat__messages" aria-live="polite">
                    {chatMessages.length === 0 && !isGeneratingText ? (
                        <p className="ai-chat__empty">{text.chatEmpty}</p>
                    ) : null}
                    {chatMessages.map((message) => (
                        <ChatMessageBubble
                            key={message.id}
                            message={message}
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
        const activeSelectorItem = getMediaSelectorItemForModelId(imageModelSelectorItems, imageModel);
        const headerTitle = getAiGroupTitle(activeSelectorItem, text, getImageSelectorChipLabel);
        const headerSubtitle = text.imageGenerateTitle;
        const variantOptions = getAiVariantOptions(activeSelectorItem, text, 'media', userData.subscriptionPlanId);
        const canEdit = imageModelSupportsEdit(imageModel);
        const supportsSourceUpload = imageModelSupportsSourceUpload(imageModel);
        const hasAttachedImage = Boolean(imageAttachment);
        const sessionImageUrl = canEdit
            ? (getLastSessionImageUrl(imageSessionMessages) ?? generatedImageUrl?.trim() ?? '')
            : '';
        const usesSessionEdit = canEdit && !hasAttachedImage && Boolean(sessionImageUrl);
        const promptPlaceholder = (usesSessionEdit || hasAttachedImage)
            ? text.imageEditPlaceholder
            : text.imagePromptPlaceholder;

        return (
            <section className="ai-image-screen ai-image-screen--concept" aria-label={text.imageGenerateTitle}>
                {renderAiScreenHeader({
                    title: headerTitle,
                    subtitle: headerSubtitle,
                    onBack: () => setCurrentPage(imageReturnPage),
                    onNewDialog: handleNewImageDialog,
                    newDialogDisabled: isGeneratingImage,
                })}

                <AiVariantSelect
                    id="ai-image-variant"
                    label={text.mediaModelVariantLabel}
                    value={imageModel}
                    options={variantOptions}
                    onChange={handleImageModelChange}
                    onLockedSelect={handleLockedModelSelect}
                    text={text}
                    disabled={isGeneratingImage}
                />

                <div className="ai-video__main">
                    <MediaModelOptionsBar
                        capabilities={getImageModelCapabilities(imageModel)}
                        values={{
                            aspectRatio: imageAspectRatio,
                            resolution: imageResolution,
                            quality: imageQuality,
                            outputFormat: imageOutputFormat,
                        }}
                        onChange={handleImageOptionChange}
                        labels={{
                            group: text.mediaOptionsGroup,
                            aspectRatio: text.mediaOptionAspectRatio,
                            resolution: text.mediaOptionResolution,
                            quality: text.mediaOptionQuality,
                            outputFormat: text.mediaOptionOutputFormat,
                            toggleOn: text.mediaToggleOn,
                            toggleOff: text.mediaToggleOff,
                            qualityValues: {
                                low: text.mediaQualityLow,
                                medium: text.mediaQualityMedium,
                                high: text.mediaQualityHigh,
                            },
                        }}
                        disabled={isGeneratingImage}
                        idPrefix="image"
                        collapsed
                    />

                    {usesSessionEdit ? (
                        <p className="ai-image__edit-hint">{text.imageEditHint}</p>
                    ) : null}

                    {hasAttachedImage ? (
                        <p className="ai-image__edit-hint">{text.imageAttachmentHint}</p>
                    ) : null}

                    <div className="ai-image__content ai-image__content--in-main">
                        {imageSessionMessages.length > 0 ? (
                            <div className="ai-chat__messages ai-chat__messages--media" aria-live="polite">
                                {imageSessionMessages.map((message) => (
                                    <MediaMessageBubble
                                        key={message.id}
                                        message={message}
                                        onDownload={handleMediaDownload}
                                        downloadBusy={mediaDownloadBusy}
                                        downloadLabel={text.mediaDownloadButton}
                                        downloadingLabel={text.mediaDownloading}
                                    />
                                ))}
                            </div>
                        ) : isGeneratingImage ? (
                            <p className="ai-chat__empty">{text.imageGenerating}</p>
                        ) : generatedImageUrl ? (
                            <section className="ai-image__result" aria-label={text.imageResultTitle}>
                                <div className="ai-image__result-header">
                                    <p className="ai-image__result-label">{text.imageResultTitle}</p>
                                    {generatedImageUrls.length <= 1 ? (
                    <button
                        type="button"
                                            className="ai-media__download"
                                            onClick={() => handleMediaDownload('image', generatedImageUrl, 'image.png')}
                                            disabled={mediaDownloadBusy === 'image'}
                                        >
                                            <Download size={14} aria-hidden="true" />
                                            {mediaDownloadBusy === 'image' ? text.mediaDownloading : text.mediaDownloadButton}
                    </button>
                                    ) : null}
                        </div>
                                {generatedImageUrls.length > 1 ? (
                                    <div className="ai-image__gallery">
                                        {generatedImageUrls.map((url, index) => (
                                            <div key={`${url}-${index}`} className="ai-image__gallery-item">
                                                <img
                                                    className="ai-image__preview"
                                                    src={url}
                                                    alt={`${text.imageGenerateTitle} ${index + 1}`}
                                                />
                    <button
                        type="button"
                                                    className="ai-media__download"
                                                    onClick={() => handleMediaDownload(`image-${index}`, url, `image-${index + 1}.png`)}
                                                    disabled={mediaDownloadBusy === `image-${index}`}
                                                >
                                                    <Download size={14} aria-hidden="true" />
                                                    {mediaDownloadBusy === `image-${index}` ? text.mediaDownloading : text.mediaDownloadButton}
                    </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <img
                                        key={generatedImageUrl}
                                        className="ai-image__preview"
                                        src={generatedImageUrl}
                                        alt={imagePrompt || text.imageGenerateTitle}
                                    />
                                )}
                            </section>
                        ) : (
                            <p className="ai-chat__empty">{text.imagePromptPlaceholder}</p>
                        )}
                    </div>

                    {imageError ? (
                        <p className="ai-chat__inline-error" role="alert">{imageError}</p>
                    ) : null}
                </div>

                <footer className={`ai-chat__composer ${supportsSourceUpload ? '' : 'ai-chat__composer--no-attach'}`}>
                    {supportsSourceUpload ? (
                        <input
                            ref={imagePhotoInputRef}
                            type="file"
                            accept="image/*"
                            className="ai-chat__file-input"
                            aria-hidden="true"
                            tabIndex={-1}
                            onChange={handleImagePhotoSelect}
                        />
                    ) : null}
                    {supportsSourceUpload ? (
                            <button
                                type="button"
                            className="ai-chat__attach"
                            aria-label={text.imageAttachPhoto}
                                disabled={isGeneratingImage}
                            onClick={() => imagePhotoInputRef.current?.click()}
                            >
                            <Paperclip size={18} aria-hidden="true" />
                            </button>
                    ) : null}
                    <div className="ai-chat__composer-field">
                        {supportsSourceUpload && imageAttachment ? (
                            <div className="ai-chat__attachment-preview">
                                <img src={imageAttachment.previewUrl} alt="" />
                                <button
                                    type="button"
                                    className="ai-chat__attachment-remove"
                                    aria-label={text.imageRemovePhoto}
                                    onClick={() => setImageAttachment(null)}
                                >
                                    ×
                                </button>
                </div>
                        ) : null}
                    <textarea
                        id="ai-image-prompt"
                            className="ai-chat__input"
                        value={imagePrompt}
                        onChange={(event) => setImagePrompt(event.target.value)}
                            onKeyDown={handleImageComposerKeyDown}
                            placeholder={promptPlaceholder}
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
        const activeSelectorItem = getMediaSelectorItemForModelId(videoModelSelectorItems, videoModel);
        const headerTitle = getAiGroupTitle(activeSelectorItem, text, getVideoSelectorChipLabel);
        const headerSubtitle = text.videoGenerateTitle;
        const variantOptions = getAiVariantOptions(activeSelectorItem, text, 'media', userData.subscriptionPlanId);
        const requiresImage = videoModelRequiresImage(videoModel);
        const requiresVideo = videoModelRequiresVideo(videoModel);
        const isExtend = videoModel === 'seedance-v2-video-extend';
        const isUnifiedEdit = videoModel === 'seedance-v2-video-edit';
        const sessionVideoUrl = getLastSessionVideoUrl(videoSessionMessages) ?? generatedVideoUrl?.trim() ?? '';
        const hasVideoContext = Boolean(requiresVideo && sessionVideoUrl);
        const promptPlaceholder = hasVideoContext
            ? (isExtend ? text.videoExtendPlaceholder : text.videoEditPlaceholder)
            : text.videoPromptPlaceholder;

        return (
            <section className="ai-image-screen ai-image-screen--concept" aria-label={text.videoGenerateTitle}>
                {renderAiScreenHeader({
                    title: headerTitle,
                    subtitle: headerSubtitle,
                    onBack: () => setCurrentPage(videoReturnPage),
                    onNewDialog: handleNewVideoDialog,
                    newDialogDisabled: isGeneratingVideo,
                })}

                <AiVariantSelect
                    id="ai-video-variant"
                    label={text.mediaModelVariantLabel}
                    value={videoModel}
                    options={variantOptions}
                    onChange={handleVideoModelChange}
                    onLockedSelect={handleLockedModelSelect}
                    text={text}
                    disabled={isGeneratingVideo}
                />

                <div className="ai-video__main">
                <MediaModelOptionsBar
                    capabilities={getVideoModelCapabilities(videoModel)}
                    values={{
                        aspectRatio: videoAspectRatio,
                        duration: videoDuration,
                        resolution: videoResolution,
                        negativePrompt: videoNegativePrompt,
                        cameraMovement: videoCameraMovement,
                        cameraHorizontal: videoCameraHorizontal,
                        cameraVertical: videoCameraVertical,
                        cameraPan: videoCameraPan,
                        cameraTilt: videoCameraTilt,
                        cameraRoll: videoCameraRoll,
                        cameraZoom: videoCameraZoom,
                        sound: videoSound,
                        generateAudio: videoGenerateAudio,
                        cameraFixed: videoCameraFixed,
                        turboMode: videoTurboMode,
                    }}
                    onChange={handleVideoOptionChange}
                    labels={{
                        group: text.mediaOptionsGroup,
                        aspectRatio: text.mediaOptionAspectRatio,
                        resolution: text.mediaOptionResolution,
                        duration: text.mediaOptionDuration,
                        negativePrompt: text.mediaOptionNegativePrompt,
                        negativePromptPlaceholder: text.mediaNegativePromptPlaceholder,
                        cameraMovement: text.mediaOptionCameraMovement,
                        cameraMovementValues: {
                            auto: text.mediaCameraMovementAuto,
                            simple: text.mediaCameraMovementSimple,
                            down_back: text.mediaCameraMovementDownBack,
                            forward_up: text.mediaCameraMovementForwardUp,
                            right_turn_forward: text.mediaCameraMovementRightTurn,
                            left_turn_forward: text.mediaCameraMovementLeftTurn,
                        },
                        cameraAxes: text.mediaOptionCameraAxes,
                        cameraAxesHint: text.mediaCameraAxesHint,
                        cameraAxisValues: {
                            horizontal: text.mediaCameraAxisHorizontal,
                            vertical: text.mediaCameraAxisVertical,
                            pan: text.mediaCameraAxisPan,
                            tilt: text.mediaCameraAxisTilt,
                            roll: text.mediaCameraAxisRoll,
                            zoom: text.mediaCameraAxisZoom,
                        },
                        sound: text.mediaOptionSound,
                        generateAudio: text.mediaOptionGenerateAudio,
                        cameraFixed: text.mediaOptionCameraFixed,
                        turboMode: text.mediaOptionTurboMode,
                        toggleOn: text.mediaToggleOn,
                        toggleOff: text.mediaToggleOff,
                        durationValue: (seconds) => `${seconds} ${language === 'en' ? 'sec' : 'сек'}`,
                    }}
                    disabled={isGeneratingVideo}
                    idPrefix="video"
                    collapsed
                />

                {isUnifiedEdit ? (
                    <p className="ai-video__edit-hint">{text.videoEditTurboHint}</p>
                    ) : null}

                {requiresImage ? (
                    <label className="ai-video__source-field" htmlFor="ai-video-source-image">
                        <span className="ai-image__label">{text.videoSourceImageLabel}</span>
                        <input
                            id="ai-video-source-image"
                            className="ai-video__source-input"
                            type="url"
                            value={videoSourceImageUrl}
                            onChange={(event) => setVideoSourceImageUrl(event.target.value)}
                            placeholder={text.videoSourceImagePlaceholder}
                            disabled={isGeneratingVideo}
                        />
                    </label>
                ) : null}

                {requiresVideo && !hasVideoContext ? (
                    <label className="ai-video__source-field" htmlFor="ai-video-source-video">
                        <span className="ai-image__label">{text.videoSourceVideoLabel}</span>
                        <input
                            id="ai-video-source-video"
                            className="ai-video__source-input"
                            type="url"
                            value={videoSourceVideoUrl}
                            onChange={(event) => setVideoSourceVideoUrl(event.target.value)}
                            placeholder={text.videoSourceVideoPlaceholder}
                            disabled={isGeneratingVideo}
                        />
                    </label>
                ) : null}

                {hasVideoContext ? (
                    <p className="ai-video__edit-hint">
                        {isExtend ? text.videoExtendHint : text.videoEditHint}
                    </p>
                ) : null}

                <div className="ai-image__content ai-image__content--in-main">
                    {videoSessionMessages.length > 0 ? (
                        <div className="ai-chat__messages ai-chat__messages--media" aria-live="polite">
                            {videoSessionMessages.map((message) => (
                                <MediaMessageBubble
                                    key={message.id}
                                    message={message}
                                    onDownload={handleMediaDownload}
                                    downloadBusy={mediaDownloadBusy}
                                    downloadLabel={text.mediaDownloadButton}
                                    downloadingLabel={text.mediaDownloading}
                                />
                            ))}
                        </div>
                    ) : isGeneratingVideo ? (
                        <p className="ai-chat__empty">{text.videoGenerating}</p>
                    ) : generatedVideoUrl ? (
                        <section className="ai-image__result ai-video__result" aria-label={text.videoResultTitle}>
                            <div className="ai-image__result-header">
                                <p className="ai-image__result-label">{text.videoResultTitle}</p>
                    <button
                        type="button"
                                    className="ai-media__download"
                                    onClick={() => handleMediaDownload('video', generatedVideoUrl, 'video.mp4')}
                                    disabled={mediaDownloadBusy === 'video'}
                                >
                                    <Download size={14} aria-hidden="true" />
                                    {mediaDownloadBusy === 'video' ? text.mediaDownloading : text.mediaDownloadButton}
                    </button>
                            </div>
                            <video
                                key={generatedVideoUrl}
                                className="ai-image__preview ai-image__preview--video"
                                src={generatedVideoUrl}
                                controls
                                playsInline
                            />
                        </section>
                    ) : (
                        <p className="ai-chat__empty">{text.videoPromptPlaceholder}</p>
                    )}
                </div>
                </div>

                <footer className="ai-video__composer">
                    <div className="ai-video__composer-field">
                        <label className="ai-video__label" htmlFor="ai-video-prompt">{text.videoPromptLabel}</label>
                        <textarea
                            id="ai-video-prompt"
                            className="ai-video__prompt"
                            value={videoPrompt}
                            onChange={(event) => setVideoPrompt(event.target.value)}
                            placeholder={promptPlaceholder}
                            rows={3}
                            disabled={isGeneratingVideo}
                        />
                    </div>

                    {videoError ? (
                        <p className="ai-chat__inline-error" role="alert">{videoError}</p>
                    ) : null}

                    <button
                        type="button"
                        className="ai-video__submit"
                        onClick={handleGenerateVideo}
                        disabled={isGeneratingVideo}
                    >
                        {isGeneratingVideo ? text.videoGenerating : text.videoGenerateButton}
                    </button>
                </footer>
            </section>
        );
    };

    const renderAiVoiceScreen = () => {
        const activeSelectorItem = getMediaSelectorItemForModelId(audioModelSelectorItems, audioModel);
        const headerTitle = getAiGroupTitle(activeSelectorItem, text, getAudioSelectorChipLabel);
        const isMusicModel = audioModelIsMusic(audioModel);
        const isAceStep = audioModel === 'ace-step-1.5';
        const isMureka = audioModel === 'mureka-v9';
        const isOmniVoice = audioModel === 'omnivoice';
        const headerSubtitle = isMusicModel ? text.musicGenerateTitle : text.voiceGenerateTitle;
        const variantOptions = getAiVariantOptions(activeSelectorItem, text, 'media', userData.subscriptionPlanId);
        const supportsClone = audioModelSupportsClone(audioModel);
        const isCloneMode = Boolean(audioAttachment) && supportsClone;
        const promptPlaceholder = isCloneMode
            ? text.voiceClonePlaceholder
            : (isAceStep
                ? text.musicLyricsOptionalPlaceholder
                : (isMureka ? text.musicLyricsPlaceholder : text.voicePromptPlaceholder));
        const styleInstructionLabel = isAceStep
            ? text.mediaOptionMusicTags
            : (isMureka ? text.mediaOptionMusicStyle : (isOmniVoice ? text.mediaOptionVoice : text.mediaOptionStyleInstruction));
        const styleInstructionPlaceholder = isAceStep
            ? text.musicTagsPlaceholder
            : (isMureka ? text.musicStylePlaceholder : (isOmniVoice ? text.omnivoiceDescriptionPlaceholder : text.mediaStyleInstructionPlaceholder));
        const generateLabel = isMusicModel ? text.musicGenerateButton : text.voiceGenerateButton;
        const generatingLabel = isMusicModel ? text.musicGenerating : text.voiceGenerating;

        return (
            <section className="ai-image-screen ai-image-screen--concept" aria-label={headerSubtitle}>
                {renderAiScreenHeader({
                    title: headerTitle,
                    subtitle: headerSubtitle,
                    onBack: () => setCurrentPage(audioReturnPage),
                    onNewDialog: handleNewAudioDialog,
                    newDialogDisabled: isGeneratingAudio,
                })}

                <AiVariantSelect
                    id="ai-voice-variant"
                    label={text.mediaModelVariantLabel}
                    value={audioModel}
                    options={variantOptions}
                    onChange={handleAudioModelChange}
                    onLockedSelect={handleLockedModelSelect}
                    text={text}
                    disabled={isGeneratingAudio}
                />

                <div className="ai-video__main">
                    <MediaModelOptionsBar
                        capabilities={getAudioModelCapabilities(audioModel)}
                        values={{
                            language: audioLanguage,
                            voice: audioVoice,
                            styleInstruction: audioStyleInstruction,
                            referenceText: audioReferenceText,
                            speed: audioSpeed,
                            emotion: audioEmotion,
                            duration: audioDuration,
                            numberOfSongs: audioNumberOfSongs,
                            outputFormat: audioOutputFormat,
                        }}
                        onChange={handleAudioOptionChange}
                        labels={{
                            group: text.mediaOptionsGroup,
                            language: text.mediaOptionLanguage,
                            voice: text.mediaOptionVoice,
                            styleInstruction: styleInstructionLabel,
                            referenceText: text.mediaOptionReferenceText,
                            styleInstructionPlaceholder,
                            referenceTextPlaceholder: text.mediaReferenceTextPlaceholder,
                            speed: text.mediaOptionSpeed,
                            emotion: text.mediaOptionEmotion,
                            numberOfSongs: text.mediaOptionNumberOfSongs,
                            duration: text.mediaOptionDuration,
                            outputFormat: text.mediaOptionOutputFormat,
                            durationValue: (seconds) => `${seconds}s`,
                        }}
                        disabled={isGeneratingAudio}
                        idPrefix="audio"
                        cloneMode={isCloneMode}
                        collapsed
                    />

                    {supportsClone && isCloneMode ? (
                        <p className="ai-image__edit-hint">{text.voiceCloneHint}</p>
                    ) : null}

                    <div className="ai-image__content ai-image__content--in-main">
                        {isGeneratingAudio ? (
                            <p className="ai-chat__empty">{generatingLabel}</p>
                        ) : generatedAudioUrl ? (
                            <section className="ai-image__result" aria-label={text.voiceResultTitle}>
                                <div className="ai-image__result-header">
                                    <p className="ai-image__result-label">{text.voiceResultTitle}</p>
                                    <button
                                        type="button"
                                        className="ai-media__download"
                                        onClick={() => handleMediaDownload('audio', generatedAudioUrl, 'audio.mp3')}
                                        disabled={mediaDownloadBusy === 'audio'}
                                    >
                                        <Download size={14} aria-hidden="true" />
                                        {mediaDownloadBusy === 'audio' ? text.mediaDownloading : text.mediaDownloadButton}
                                    </button>
                                </div>
                                <audio
                                className="ai-image__preview"
                                    src={generatedAudioUrl}
                                    controls
                            />
                        </section>
                        ) : (
                            <p className="ai-chat__empty">{promptPlaceholder}</p>
                        )}
                    </div>

                    {audioError ? (
                        <p className="ai-chat__inline-error" role="alert">{audioError}</p>
                    ) : null}
                </div>

                <footer className={`ai-chat__composer ${supportsClone ? '' : 'ai-chat__composer--no-attach'}`}>
                    {supportsClone ? (
                        <input
                            ref={audioFileInputRef}
                            type="file"
                            accept="audio/*"
                            className="ai-chat__file-input"
                            aria-hidden="true"
                            tabIndex={-1}
                            onChange={handleAudioAttachmentSelect}
                        />
                    ) : null}
                    {supportsClone ? (
                        <button
                            type="button"
                            className="ai-chat__attach"
                            aria-label={text.voiceAttachAudio}
                            disabled={isGeneratingAudio}
                            onClick={() => audioFileInputRef.current?.click()}
                        >
                            <Paperclip size={18} aria-hidden="true" />
                        </button>
                    ) : null}
                    <div className="ai-chat__composer-field">
                        {supportsClone && audioAttachment ? (
                            <div className="ai-chat__attachment-preview ai-chat__attachment-preview--audio">
                                <audio src={audioAttachment.previewUrl} controls />
                                <button
                                    type="button"
                                    className="ai-chat__attachment-remove"
                                    aria-label={text.voiceRemoveAudio}
                                    onClick={() => setAudioAttachment(null)}
                                >
                                    ×
                                </button>
                            </div>
                        ) : null}
                        <textarea
                            id="ai-voice-prompt"
                            className="ai-chat__input"
                            value={audioPrompt}
                            onChange={(event) => setAudioPrompt(event.target.value)}
                            onKeyDown={handleAudioComposerKeyDown}
                            placeholder={promptPlaceholder}
                            rows={2}
                            disabled={isGeneratingAudio}
                        />
                    </div>
                    <button
                        type="button"
                        className="ai-chat__send"
                        aria-label={generateLabel}
                        onClick={handleGenerateAudio}
                        disabled={isGeneratingAudio}
                    >
                        <Send size={18} aria-hidden="true" />
                    </button>
                </footer>
            </section>
        );
    };

    const renderAiThreeDScreen = () => {
        const activeSelectorItem = getMediaSelectorItemForModelId(threeDModelSelectorItems, threeDModel);
        const headerTitle = getAiGroupTitle(activeSelectorItem, text, getThreeDSelectorChipLabel);
        const variantOptions = getAiVariantOptions(activeSelectorItem, text, 'media', userData.subscriptionPlanId);
        const requiresImage = threeDModelRequiresImage(threeDModel);
        const requiresMultiImage = threeDModelRequiresMultiImage(threeDModel);
        const requiresPrompt = threeDModelRequiresPrompt(threeDModel);
        const promptOptional = !requiresPrompt;

        return (
            <section className="ai-image-screen ai-image-screen--concept" aria-label={text.threeDGenerateTitle}>
                {renderAiScreenHeader({
                    title: headerTitle,
                    subtitle: text.threeDGenerateTitle,
                    onBack: () => setCurrentPage(threeDReturnPage),
                    onNewDialog: () => {
                        startNewThreeDSession();
                        setThreeDPrompt('');
                        setThreeDAttachment(null);
                        setThreeDAttachments([]);
                        setGeneratedThreeDUrl('');
                        setThreeDError('');
                    },
                    newDialogDisabled: isGeneratingThreeD,
                })}

                <AiVariantSelect
                    id="ai-3d-variant"
                    label={text.mediaModelVariantLabel}
                    value={threeDModel}
                    options={variantOptions}
                    onChange={handleThreeDModelChange}
                    onLockedSelect={handleLockedModelSelect}
                    text={text}
                    disabled={isGeneratingThreeD}
                />

                <div className="ai-video__main">
                    <MediaModelOptionsBar
                        capabilities={getThreeDModelCapabilities(threeDModel)}
                        values={{
                            negativePrompt: threeDNegativePrompt,
                            textureQuality: threeDTextureQuality,
                            outputFormat: threeDOutputFormat,
                            geometryQuality: threeDGeometryQuality,
                            mode: threeDMode,
                            artStyle: threeDArtStyle,
                            topology: threeDTopology,
                            tier: threeDTier,
                            material: threeDMaterial,
                            geometryFileFormat: threeDGeometryFileFormat,
                            textureMode: threeDTextureMode,
                        }}
                        onChange={handleThreeDOptionChange}
                        labels={{
                            group: text.mediaOptionsGroup,
                            negativePrompt: text.mediaOptionNegativePrompt,
                            negativePromptPlaceholder: text.threeDNegativePromptPlaceholder,
                            textureQuality: text.mediaOptionTextureQuality,
                            geometryQuality: text.mediaOptionGeometryQuality,
                            outputFormat: text.mediaOptionOutputFormat,
                            mode: text.mediaOptionMode,
                            artStyle: text.mediaOptionArtStyle,
                            topology: text.mediaOptionTopology,
                            tier: text.mediaOptionTier,
                            material: text.mediaOptionMaterial,
                            geometryFileFormat: text.mediaOptionGeometryFileFormat,
                            textureMode: text.mediaOptionTextureMode,
                        }}
                        disabled={isGeneratingThreeD}
                        idPrefix="three-d"
                        collapsed
                    />

                    <div className="ai-image__content ai-image__content--in-main">
                        {isGeneratingThreeD ? (
                            <p className="ai-chat__empty">{text.threeDGenerating}</p>
                        ) : generatedThreeDUrl ? (
                            <section className="ai-image__result" aria-label={text.threeDResultTitle}>
                                <div className="ai-image__result-header">
                                    <p className="ai-image__result-label">{text.threeDResultTitle}</p>
                                    <button
                                        type="button"
                                        className="ai-media__download"
                                        onClick={() => handleMediaDownload('3d', generatedThreeDUrl, 'model.glb')}
                                        disabled={mediaDownloadBusy === '3d'}
                                    >
                                        <Download size={14} aria-hidden="true" />
                                        {mediaDownloadBusy === '3d' ? text.mediaDownloading : text.mediaDownloadButton}
                                    </button>
                                </div>
                                <p className="ai-chat__empty">{generatedThreeDUrl}</p>
                            </section>
                        ) : (
                            <p className="ai-chat__empty">{text.threeDPromptPlaceholder}</p>
                        )}
                    </div>

                    {threeDError ? (
                        <p className="ai-chat__inline-error" role="alert">{threeDError}</p>
                    ) : null}
                </div>

                <footer className="ai-video__composer">
                    {(requiresImage || requiresMultiImage) ? (
                        <input
                            ref={threeDFileInputRef}
                            type="file"
                            accept="image/*"
                            multiple={requiresMultiImage}
                            className="ai-chat__file-input"
                            aria-hidden="true"
                            tabIndex={-1}
                            onChange={requiresMultiImage ? handleThreeDMultiAttachmentSelect : handleThreeDAttachmentSelect}
                        />
                    ) : null}

                    <div className="ai-video__composer-field">
                        {(requiresImage || requiresMultiImage) ? (
                            <button
                                type="button"
                                className="ai-chat__attach ai-video__attach-inline"
                                aria-label={requiresMultiImage ? text.threeDAttachImages : text.threeDAttachImage}
                                disabled={isGeneratingThreeD}
                                onClick={() => threeDFileInputRef.current?.click()}
                            >
                                <Paperclip size={18} aria-hidden="true" />
                                <span>{requiresMultiImage ? text.threeDAttachImages : text.threeDAttachImage}</span>
                            </button>
                        ) : null}

                        {threeDAttachment ? (
                            <div className="ai-chat__attachment-preview">
                                <img src={threeDAttachment.previewUrl} alt="" />
                                <button
                                    type="button"
                                    className="ai-chat__attachment-remove"
                                    onClick={() => setThreeDAttachment(null)}
                                >
                                    ×
                                </button>
                            </div>
                        ) : null}

                        {threeDAttachments.length > 0 ? (
                            <div className="ai-chat__attachment-preview ai-chat__attachment-preview--multi">
                                {threeDAttachments.map((item, index) => (
                                    <img key={`${item.previewUrl}-${index}`} src={item.previewUrl} alt="" />
                                ))}
                                <button
                                    type="button"
                                    className="ai-chat__attachment-remove"
                                    onClick={() => setThreeDAttachments([])}
                                >
                                    ×
                                </button>
                            </div>
                        ) : null}

                        <label className="ai-video__label" htmlFor="ai-3d-prompt">
                            {promptOptional ? `${text.threeDPromptLabel} (${language === 'ru' ? 'опционально' : 'optional'})` : text.threeDPromptLabel}
                        </label>
                        <textarea
                            id="ai-3d-prompt"
                            className="ai-video__prompt"
                            value={threeDPrompt}
                            onChange={(event) => setThreeDPrompt(event.target.value)}
                            placeholder={text.threeDPromptPlaceholder}
                            rows={3}
                            disabled={isGeneratingThreeD}
                        />
                    </div>

                    <button
                        type="button"
                        className="ai-video__submit"
                        onClick={handleGenerateThreeD}
                        disabled={isGeneratingThreeD}
                    >
                        {isGeneratingThreeD ? text.threeDGenerating : text.threeDGenerateButton}
                    </button>
                </footer>
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
        const tokenBalance = resolveGenerationTokenBalance(walletData, profile);
        const usageLimitRaw = walletData?.wallet?.monthlyLimit;
        const usageUsedRaw = walletData?.wallet?.usedThisMonth;
        const hasUsageQuota = usageLimitRaw != null && Number(usageLimitRaw) > 0;
        const usageLimit = hasUsageQuota ? Number(usageLimitRaw) : 0;
        const usageUsed = hasUsageQuota ? Number(usageUsedRaw ?? 0) : 0;
        const usagePercent = hasUsageQuota
            ? Math.min(100, Math.round((usageUsed / usageLimit) * 100))
            : 0;
        const requestsCount = historyItems.length;
        const referralBonus = referralBonusTotal;
        const subscriptionPlanName = userData.subscriptionPlanName;
        const subscriptionPlanId = userData.subscriptionPlanId;
        const subscriptionUntil = userData.subscriptionUntil;

        return (
            <section className="profile-screen profile-screen--concept" aria-label={text.profileTitle}>
                <AppPageHeader
                    title={text.profileTitle}
                    onBack={() => setCurrentPage('home')}
                    backLabel={text.back}
                    trailing={(
                    <button
                        type="button"
                            className="app-page-header__action"
                        aria-label={text.settingsTitle}
                        onClick={() => setCurrentPage('settings')}
                    >
                        <MoreHorizontal size={18} aria-hidden="true" />
                    </button>
                    )}
                />

                <div className="profile-concept__avatar-section">
                    <div className="profile-concept__avatar-outer">
                        <div className="profile-concept__avatar-inner">
                        {userData.avatarUrl ? (
                            <img src={userData.avatarUrl} alt={userData.displayName} />
                        ) : (
                            <span>{profileInitials}</span>
                        )}
                        {userData.subscriptionIsPaid ? (
                            <span className="profile-concept__avatar-crown" aria-hidden="true">👑</span>
                        ) : null}
                        </div>
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
                        <div className="profile-concept__stat-val">{formatNumber(tokenBalance)}</div>
                        <div className="profile-concept__stat-label">{text.profileStatCoins}</div>
                    </div>
                </div>

                <article className="profile-concept__balance-card">
                    <div className="profile-concept__balance-top">
                        <div>
                            <div className="profile-concept__balance-label">{text.profileBalanceLabel}</div>
                            <div className="profile-concept__balance-amount">
                                <CoinIcon size={30} className="profile-concept__coin-icon" />
                                <span className="profile-concept__balance-num">{formatNumber(tokenBalance)}</span>
                            </div>
                        </div>
                        <button type="button" className="profile-concept__topup-btn" onClick={openCoinTopUp}>
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
                    <button type="button" className="profile-concept__menu-item" onClick={() => setCurrentPage('subscription')}>
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

    const renderReferralScreen = () => (
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
                                +{formatNumber(referralBonusTotal || 0)}
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
                    {referralItems.map((item) => (
                            <div key={item.id} className="referral-concept__friend">
                            <ReferralFriendAvatar name={item.name} avatarUrl={item.avatarUrl} />
                                <span className="referral-concept__friend-name">{item.name}</span>
                                <span className="referral-concept__friend-reward">{item.reward}</span>
                            </div>
                    ))}
                </div>
            </section>
        );

    const renderSubscriptionScreen = () => {
        const currentPlanId = userData.subscriptionPlanId;
        const currentPlanEnglishName = getSubscriptionPlanEnglishName(
            currentPlanId,
            userData.subscriptionPlanName,
        );

        return (
            <section className="subscription-page" aria-label={text.subscriptionPageTitle}>
                <AppPageHeader
                    title={text.subscriptionPageTitle}
                    trailing={(
                        <CoinBalanceWidget
                            balance={tokenBalance}
                            onClick={openCoinTopUp}
                            onTopUp={openCoinTopUp}
                            compact
                            showPlus
                            topUpLabel={text.profileTopUp}
                        />
                    )}
                />

                <div className="subscription-page__hero subscription-page__hero--animate">
                    <p className="subscription-page__hero-label">{text.subscriptionCurrentPlan}</p>
                    <div className="subscription-page__hero-plan">
                        <Crown size={18} aria-hidden="true" />
                        <span className="subscription-page__hero-plan-name">{currentPlanEnglishName}</span>
                        {userData.subscriptionIsPaid && userData.subscriptionTimeLeft ? (
                            <span className={`subscription-page__hero-time${userData.subscriptionExpiringSoon ? ' subscription-page__hero-time--warn' : ''}`}>
                                {userData.subscriptionTimeLeft}
                                {userData.subscriptionExpiryDate ? (
                                    <span className="subscription-page__hero-time-sub">
                                        {language === 'ru'
                                            ? ` · до ${userData.subscriptionExpiryDate}`
                                            : ` · until ${userData.subscriptionExpiryDate}`}
                                    </span>
                                ) : null}
                            </span>
                        ) : null}
                    </div>
                    <p className="subscription-page__hero-sub">
                        {formatTemplate(text.subscriptionPageSub, {
                            rate: String(billingCatalog?.coinRateRub ?? 1),
                        })}
                    </p>
                </div>

                <div className="subscription-page__plans-carousel">
                    <button
                        type="button"
                        className="subscription-page__plans-nav subscription-page__plans-nav--prev"
                        aria-label={language === 'ru' ? 'Предыдущий план' : 'Previous plan'}
                        onClick={() => scrollSubscriptionPlan(-1)}
                    >
                        <ChevronLeft size={20} aria-hidden="true" />
                    </button>
                    <div className="subscription-page__plans-scroll">
                        <div className="subscription-page__plans" ref={subscriptionPlansScrollRef}>
                            {renderSubscriptionPlanCards(currentPlanId, { variant: 'page' })}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="subscription-page__plans-nav subscription-page__plans-nav--next"
                        aria-label={language === 'ru' ? 'Следующий план' : 'Next plan'}
                        onClick={() => scrollSubscriptionPlan(1)}
                    >
                        <ChevronRight size={20} aria-hidden="true" />
                    </button>
                </div>
            </section>
        );
    };

    const renderWalletScreen = () => {
        const balanceAvailable = Number(walletData?.wallet?.balanceAvailable ?? tokenBalance) || 0;
        const totalEarned = Number(walletData?.wallet?.totalEarned ?? 0) || 0;

        return (
            <section className="wallet-screen wallet-screen--concept">
                {renderConceptPageHeader(text.walletPageTitle, () => setCurrentPage('profile'))}

                <article className="profile-concept__balance-card subscription-concept__balance subscription-page__hero--animate">
                    <div className="subscription-concept__balance-grid">
                        <div className="subscription-concept__balance-item">
                            <span className="subscription-concept__balance-label">{text.walletBalanceTotal}</span>
                            <span className="subscription-concept__balance-value">
                                <CoinIcon size={16} className="profile-concept__coin-icon" />
                                {formatNumber(tokenBalance)}
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

                <div className="subscription-concept__coin-packs">
                    <h3 className="profile-concept__plans-title">{text.walletCoinPacksTitle}</h3>
                    <p className="profile-concept__plans-sub">{text.walletCoinPacksSub}</p>
                    <div className="subscription-concept__coin-packs-grid">
                        {renderCoinPackCards()}
                    </div>
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
        <section className={`history-screen history-screen--concept ${historySelectMode ? 'history-screen--select-mode' : ''}`}>
            <AppPageHeader
                title={text.historyTitle}
                subtitle={historySelectMode ? text.historySelectModeHint : undefined}
                onBack={() => {
                    if (historySelectMode) {
                        exitHistorySelectMode();
                        return;
                    }

                    setCurrentPage(historyReturnPage);
                }}
                backLabel={historySelectMode ? text.historyDeleteCancel : text.back}
                trailing={(
                <div className="history-concept__actions">
                    {historySelectMode ? (
                <button
                    type="button"
                            className="history-concept__action history-concept__action--text"
                            onClick={exitHistorySelectMode}
                >
                            {text.historyDeleteCancel}
                </button>
                    ) : null}
                    <button
                        type="button"
                        className={`history-concept__action history-concept__action--icon ${historySelectMode ? 'history-concept__action--danger' : ''}`}
                        aria-label={historySelectMode ? text.historyDeleteConfirmAction : text.historySelectModeHint}
                        onClick={handleHistoryDeleteAction}
                        disabled={historySelectMode && selectedHistoryTopics.length === 0}
                    >
                        {historySelectMode
                            ? formatTemplate(text.historyDeleteSelected, { count: selectedHistoryTopics.length })
                            : <Trash2 size={22} aria-hidden="true" />}
                    </button>
                </div>
                )}
            />

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
                            const resolvedModelId = resolveHistoryTopicModel(topic);
                            const visual = getHistoryVisual(resolvedModelId);
                            const ThumbIcon = visual.icon;
                            const mediaPreview = getHistoryTopicMediaPreview(topic, {
                                imageModelIds: IMAGE_MODEL_IDS,
                                videoModelIds: VIDEO_MODEL_IDS,
                            });
                            const toolName = getHistoryTopicLabel({
                                topic,
                                effectiveTextModels,
                                textModelSelectorItems,
                                imageModelSelectorItems,
                                videoModelSelectorItems,
                                audioModelSelectorItems,
                                imageDefinitions: IMAGE_MODEL_DEFINITIONS,
                                videoDefinitions: VIDEO_MODEL_DEFINITIONS,
                                audioDefinitions: AUDIO_MODEL_DEFINITIONS,
                                text,
                                getImageSelectorChipLabel,
                                getVideoSelectorChipLabel,
                                getAudioSelectorChipLabel,
                            }) || visual.toolName;

                            const isTopicSelected = selectedHistoryTopicIds.includes(topic.id);

                            return (
                                <article
                                    key={topic.id}
                                    className={[
                                        'history-concept__item',
                                        historySelectMode ? 'history-concept__item--selectable' : 'history-concept__item--clickable',
                                        isTopicSelected ? 'history-concept__item--selected' : '',
                                    ].filter(Boolean).join(' ')}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={historySelectMode ? isTopicSelected : undefined}
                                    onClick={() => {
                                        if (historySelectMode) {
                                            toggleHistoryTopicSelected(topic.id);
                                            return;
                                        }

                                        openHistoryTopic(topic);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();

                                            if (historySelectMode) {
                                                toggleHistoryTopicSelected(topic.id);
                                                return;
                                            }

                                            openHistoryTopic(topic);
                                        }
                                    }}
                                >
                                    {historySelectMode ? (
                                        <span
                                            className={`history-concept__checkbox ${isTopicSelected ? 'history-concept__checkbox--checked' : ''}`}
                                            aria-hidden="true"
                                        >
                                            {isTopicSelected ? <Check size={13} /> : null}
                                        </span>
                                    ) : null}
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
                                        {mediaPreview?.kind === 'image' ? (
                                            <img
                                                className="history-concept__result-media"
                                                src={mediaPreview.url}
                                                alt=""
                                            />
                                        ) : null}
                                        {mediaPreview?.kind === 'video' ? (
                                            <video
                                                className="history-concept__result-media"
                                                src={mediaPreview.url}
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                        ) : null}
                                        {!mediaPreview && visual.emoji ? (
                                            <span>{visual.emoji}</span>
                                        ) : null}
                                        {!mediaPreview && !visual.emoji ? (
                                            <MessageSquare size={14} aria-hidden="true" />
                                        ) : null}
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
                <p className="settings-concept__build-id" aria-label={text.versionLabel}>
                    {text.versionLabel}: {getActiveBuildId() || text.releaseVersion}
                </p>
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

        if (!currentScreen) {
            return (
                <section className="home-screen home-screen--concept" aria-label={text.navHome}>
                    <p className="ai-chat__empty">{text.homeGreetingSub}</p>
                    <button type="button" className="ai-media__download" onClick={() => setCurrentPage('home')}>
                        {text.back}
                    </button>
                </section>
            );
        }

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
        <div
            className={`app-shell${tgLayoutMode ? ` app-shell--${tgLayoutMode}` : ''}`}
            data-page={currentPage}
            data-tg-layout={tgLayoutMode || undefined}
        >
            {isLoading ? (
                <div className="app-boot" role="status" aria-live="polite">
                    <span className="app-boot__spinner" aria-hidden="true" />
                    <span>{language === 'ru' ? 'Загрузка…' : 'Loading…'}</span>
                </div>
            ) : null}
            <div className="app-shell__orbs" aria-hidden="true">
                <span className="app-shell__orb app-shell__orb--1" />
                <span className="app-shell__orb app-shell__orb--2" />
                <span className="app-shell__orb app-shell__orb--3" />
                <span className="app-shell__orb app-shell__orb--4" />
            </div>
            <TelegramDesktopExpand language={language} />
            <main className="app-main">
                {currentPage === 'home'
                    ? renderHomeScreen()
                    : currentPage === 'subscription'
                        ? renderSubscriptionScreen()
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
                                                        : currentPage === 'ai-voice'
                                                            ? renderAiVoiceScreen()
                                                            : currentPage === 'ai-3d'
                                                                ? renderAiThreeDScreen()
                                                    : renderInfoScreen()}
            </main>

            {showBottomNav ? (
                <nav className="bottom-nav bottom-nav--concept" aria-label={language === 'ru' ? 'Основная навигация' : 'Main navigation'}>
                    <div className="bottom-nav__inner" ref={navInnerRef}>
                        <span
                            className="bottom-nav__indicator"
                            style={navIndicatorStyle}
                            aria-hidden="true"
                        />
                        {navigationItems.map((item, index) => {
                            const { key, labelKey, icon: NavIcon } = item;
                            const isActive = activeNavKey === key;
                            const label = text[labelKey];

                            return (
                                <button
                                    key={key}
                                    ref={(element) => {
                                        navButtonRefs.current[index] = element;
                                    }}
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
                                    <span className="nav-button__icon-wrap" aria-hidden="true">
                                        <NavIcon size={19} />
                                    </span>
                                    <span className="nav-button__label">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>
            ) : null}

            <AppNotice notice={appNotice} onDismiss={clearAppNotice} />

            <PlanDetailModal
                open={Boolean(planDetailPlanId)}
                planName={(() => {
                    if (!planDetailPlanId) {
                        return '';
                    }
                    const catalogPlan = billingCatalog?.plans?.find((plan) => plan.id === planDetailPlanId);
                    const planDef = subscriptionPlanDefs.find((plan) => plan.id === planDetailPlanId);
                    if (language === 'en') {
                        return getSubscriptionPlanEnglishName(
                            planDetailPlanId,
                            catalogPlan?.name ?? (planDef ? text[planDef.nameKey] : planDetailPlanId),
                        );
                    }
                    return catalogPlan?.name ?? (planDef ? text[planDef.nameKey] : planDetailPlanId);
                })()}
                sections={planModelSectionsByPlan[planDetailPlanId] ?? []}
                text={text}
                language={language}
                onClose={() => setPlanDetailPlanId(null)}
            />

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
