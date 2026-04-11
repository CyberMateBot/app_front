import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    Brush,
    ChevronDown,
    CirclePlay,
    Clock3,
    CreditCard,
    House,
    Image,
    Menu,
    Moon,
    Music2,
    Shirt,
    SunMedium,
    User,
    Users,
    Wallet,
} from 'lucide-react';
import {
    buildReferralLink,
    getMyProfile,
    getMyPromptHistory,
    getMyReferrals,
    getMyWallet,
    normalizeProfileResponse,
    registerTelegramUser,
    savePromptHistory,
} from './api/telegramApi.js';
import mainPreview from './assets/main.svg';
import './App.css';
import { APP_NAME, BOT_USERNAME, ENABLE_TELEGRAM_MOCK } from './config/env.js';
import { initTelegramMiniApp } from './lib/telegramWebApp.js';

const navigationItems = [
    { key: 'home', label: 'Home', icon: House },
    { key: 'wallet', label: 'Wallet', icon: CreditCard },
    { key: 'referrals', label: 'Referral', icon: Users },
    { key: 'profile', label: 'Profile', icon: User },
];

const categoryItems = [
    { key: 'images', icon: Image },
    { key: 'design', icon: Brush },
    { key: 'music', icon: Music2 },
    { key: 'video', icon: CirclePlay },
    { key: 'fashion', icon: Shirt },
];

const translations = {
    ru: {
        updates: 'Обновления',
        releaseBadge: 'Релиз 0.1',
        homeDescription: 'CyberMate — все нейросети в одном месте, под твоим контролем.',
        promptHistory: 'История Промтов',
        categoriesTitle: 'Категории',
        categoryLabels: {
            images: 'Изображения',
            design: 'Дизайн',
            music: 'Музыка',
            video: 'Видео',
            fashion: 'Одежда',
        },
        historyTitle: 'История промтов',
        promptPlaceholder: 'Введите промт, который хотите сохранить',
        promptCategoryPlaceholder: 'Категория (например, marketing)',
        savePromptButton: 'Сохранить промт',
        promptSaved: 'Промт сохранён в историю.',
        promptEmpty: 'Введите текст промта перед сохранением.',
        settingsTitle: 'Настройки',
        balanceTitle: 'Баланс',
        subscriptionTitle: 'Подписка',
        walletPageTitle: 'Подписки',
        referralProgramTitle: 'Реферальная программа',
        referralIntro: 'Товарищи! сложившаяся структура организации в значительной степени обусловливает создание модели развития. Товарищи! новая модель организационной деятельности играет важную роль в формировании существенных финансовых и административных условий. Равным образом реализация намеченных плановых заданий играет важную роль в формировании новых предложений.',
        referralLinkTitle: 'Реферальная ссылка',
        activeReferralsTitle: 'Активные рефералы',
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
    },
    en: {
        updates: 'Updates',
        releaseBadge: 'Release 0.1',
        homeDescription: 'CyberMate — all AI tools in one place, under your control.',
        promptHistory: 'Prompt History',
        categoriesTitle: 'Categories',
        categoryLabels: {
            images: 'Images',
            design: 'Design',
            music: 'Music',
            video: 'Video',
            fashion: 'Fashion',
        },
        historyTitle: 'Prompt history',
        promptPlaceholder: 'Enter a prompt to save',
        promptCategoryPlaceholder: 'Category (for example, marketing)',
        savePromptButton: 'Save prompt',
        promptSaved: 'Prompt saved to history.',
        promptEmpty: 'Enter a prompt before saving.',
        settingsTitle: 'Settings',
        balanceTitle: 'Balance',
        subscriptionTitle: 'Subscription',
        walletPageTitle: 'Subscriptions',
        referralProgramTitle: 'Referral program',
        referralIntro: 'Comrades! the current organizational structure strongly determines the development model. The new organizational model plays an important role in shaping substantial financial and administrative conditions. Likewise, the implementation of planned tasks plays an important role in forming new proposals.',
        referralLinkTitle: 'Referral link',
        activeReferralsTitle: 'Active referrals',
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
    },
};

function buildProfileView(profile, telegramUser) {
    const displayName = [profile?.name, profile?.surname].filter(Boolean).join(' ')
        || telegramUser?.first_name
        || 'Telegram User';

    const rawUsername = profile?.username || telegramUser?.username || '';
    const fallbackHandle = telegramUser?.id ? `@${telegramUser.id}` : '@2281448';
    const handle = rawUsername && rawUsername !== 'username_not_set' ? `@${rawUsername}` : fallbackHandle;
    const balance = String(profile?.balance ?? profile?.coins ?? profile?.points ?? 10500);
    const tokens = String(profile?.tokens ?? profile?.tokenBalance ?? profile?.points ?? balance);
    const subscriptionStatus = profile?.subscriptionStatus ?? profile?.subscription?.status ?? 'Premium';
    const subscriptionSince = profile?.subscriptionSince ?? profile?.subscription?.since ?? '05.04.26';
    const subscriptionLeftRaw = profile?.subscriptionLeft ?? profile?.subscription?.daysLeft ?? '30 days';
    const subscriptionLeft = typeof subscriptionLeftRaw === 'number'
        ? `${subscriptionLeftRaw} days`
        : subscriptionLeftRaw;

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
        subscriptionStatus,
        subscriptionSince,
        subscriptionLeft,
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
    const [statusMessage, setStatusMessage] = useState('');
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

    useEffect(() => {
        let isMounted = true;

        const bootstrapTelegramFlow = async () => {
            let currentTelegramUser = null;

            setIsLoading(true);
            setStatusMessage('');

            try {
                const tg = initTelegramMiniApp();
                currentTelegramUser = tg?.initDataUnsafe?.user ?? null;
                const currentStartParam = tg?.initDataUnsafe?.start_param ?? '';

                if (!isMounted) {
                    return;
                }

                setTelegramUser(currentTelegramUser);
                setStartParam(currentStartParam);

                if (!tg) {
                    setStatusMessage(
                        ENABLE_TELEGRAM_MOCK
                            ? 'Не удалось инициализировать Telegram mock.'
                            : 'Telegram WebApp SDK не найден. Откройте Mini App внутри Telegram или включите VITE_ENABLE_TELEGRAM_MOCK=true.',
                    );
                    return;
                }

                const registrationResult = await registerTelegramUser();
                const backendProfile = await getMyProfile();

                if (!isMounted) {
                    return;
                }

                if (backendProfile) {
                    setProfile(normalizeProfileResponse(backendProfile, currentTelegramUser));
                    setStatusMessage(
                        registrationResult?.alreadyRegistered
                            ? 'Профиль синхронизирован с backend.'
                            : 'Пользователь зарегистрирован и профиль получен.',
                    );
                } else {
                    setProfile(normalizeProfileResponse(null, currentTelegramUser));
                    setStatusMessage('Пользователь зарегистрирован, но профиль на backend пока пустой.');
                }
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                setProfile((prevProfile) => prevProfile ?? normalizeProfileResponse(null, currentTelegramUser));
                setStatusMessage(error instanceof Error ? error.message : 'Не удалось связаться с backend.');
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
            try {
                if (currentPage === 'wallet' && walletData === null) {
                    setPageLoading((prev) => ({ ...prev, wallet: true }));
                    const data = await getMyWallet();
                    if (!isCancelled) {
                        setWalletData(data ?? { wallet: null, transactions: [] });
                    }
                }

                if (currentPage === 'referrals' && referralData === null) {
                    setPageLoading((prev) => ({ ...prev, referrals: true }));
                    const data = await getMyReferrals();
                    if (!isCancelled) {
                        setReferralData(data ?? { items: [] });
                    }
                }

                if (currentPage === 'history' && promptHistoryData === null) {
                    setPageLoading((prev) => ({ ...prev, history: true }));
                    const data = await getMyPromptHistory();
                    if (!isCancelled) {
                        setPromptHistoryData(data ?? { items: [] });
                    }
                }
            } catch (error) {
                if (!isCancelled) {
                    setStatusMessage(error instanceof Error ? error.message : 'Не удалось загрузить данные страницы.');
                }
            } finally {
                if (!isCancelled) {
                    setPageLoading((prev) => ({
                        ...prev,
                        wallet: currentPage === 'wallet' ? false : prev.wallet,
                        referrals: currentPage === 'referrals' ? false : prev.referrals,
                        history: currentPage === 'history' ? false : prev.history,
                    }));
                }
            }
        };

        loadPageData();

        return () => {
            isCancelled = true;
        };
    }, [currentPage, telegramUser, walletData, referralData, promptHistoryData]);

    const userData = useMemo(() => buildProfileView({
        ...profile,
        balance: walletData?.wallet?.balance ?? profile?.balance,
        tokenBalance: walletData?.wallet?.balanceAvailable ?? profile?.tokenBalance,
    }, telegramUser), [profile, telegramUser, walletData]);
    const text = translations[language] ?? translations.ru;
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
    const activeNavKey = currentPage === 'settings'
        ? 'profile'
        : currentPage === 'history'
            ? 'home'
            : currentPage;

    const handleReferralLinkCopy = async () => {
        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
            return;
        }

        try {
            await navigator.clipboard.writeText(referralLink);
        } catch {
            // noop
        }
    };

    const handleSavePrompt = async () => {
        const trimmedPrompt = promptDraft.trim();
        const trimmedCategory = promptCategory.trim() || 'general';

        if (!trimmedPrompt) {
            setStatusMessage(text.promptEmpty);
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
            setStatusMessage(text.promptSaved);
        } catch (error) {
            setStatusMessage(error instanceof Error ? error.message : 'Не удалось сохранить промт.');
        } finally {
            setIsSavingPrompt(false);
        }
    };

    const renderHomeScreen = () => (
        <section className="home-screen">
            <header className="brand-section">
                <h1 className="brand-title">{APP_NAME}</h1>
            </header>

            <section className="content-section">
                <h2 className="section-title">{text.updates}</h2>
                <div className="updates-layout">
                    <article className="release-card" aria-label={text.releaseBadge}>
                        <span className="release-badge">{text.releaseBadge}</span>
                        <img src={mainPreview} alt="Превью интерфейса CyberMate" className="release-image" />
                    </article>

                    <p className="release-description">{text.homeDescription}</p>
                </div>
            </section>

            <button type="button" className="history-pill" onClick={() => setCurrentPage('history')}>
                <span className="history-pill__label">{text.promptHistory}</span>
                <span className="history-pill__icon" aria-hidden="true">
                    <Clock3 size={24} />
                </span>
            </button>

            <section className="content-section content-section--categories">
                <h2 className="section-title">{text.categoriesTitle}</h2>
                <div className="category-grid">
                    {categoryItems.map(({ key, icon: Icon }) => {
                        const label = text.categoryLabels[key];

                        return (
                            <button key={key} type="button" className="category-tile" aria-label={label} title={label}>
                                <Icon size={44} />
                            </button>
                        );
                    })}
                </div>
            </section>
        </section>
    );

    const renderProfileScreen = () => (
        <section className="profile-screen">
            <div className="profile-topbar">
                <button
                    type="button"
                    className="profile-menu-button"
                    aria-label={text.settingsTitle}
                    onClick={() => setCurrentPage('settings')}
                >
                    <Menu size={32} />
                </button>
            </div>

            <div className="profile-hero">
                <div className="profile-avatar">
                    {userData.avatarUrl ? <img src={userData.avatarUrl} alt={userData.displayName} /> : null}
                </div>
                <h2 className="profile-name">{userData.displayName}</h2>
                <p className="profile-handle">{userData.handle}</p>
            </div>

            <section className="profile-block">
                <h3 className="profile-section-title">{text.balanceTitle}</h3>
                <div className="profile-panel profile-panel--balance">
                    <div className="profile-panel__icon" aria-hidden="true">
                        <Wallet size={70} strokeWidth={1.9} />
                    </div>
                    <div className="profile-panel__divider" />
                    <div className="profile-balance-list">
                        <div className="profile-data-row">
                            <span>Balance:</span>
                            <strong>{userData.balance}</strong>
                        </div>
                        <div className="profile-data-row">
                            <span>Tokens:</span>
                            <strong>{userData.tokens}</strong>
                        </div>
                    </div>
                </div>
            </section>

            <section className="profile-block">
                <h3 className="profile-section-title">{text.subscriptionTitle}</h3>
                <div className="profile-panel profile-panel--subscription">
                    <div className="profile-subscription-list">
                        <div className="profile-data-row">
                            <span>{text.profileStatus}</span>
                            <strong className="profile-data-row__accent">{userData.subscriptionStatus}</strong>
                        </div>
                        <div className="profile-data-row">
                            <span>{text.profileSince}</span>
                            <strong>{userData.subscriptionSince}</strong>
                        </div>
                        <div className="profile-data-row">
                            <span>{text.profileLeft}</span>
                            <strong>{userData.subscriptionLeft}</strong>
                        </div>
                    </div>
                </div>
            </section>
        </section>
    );

    const renderReferralScreen = () => (
        <section className="referral-screen">
            <h2 className="referral-screen__title">{text.referralProgramTitle}</h2>

            <div className="referral-card referral-card--intro">
                <p className="referral-card__text">{text.referralIntro}</p>
            </div>

            <div className="referral-section">
                <h3 className="referral-section__title">{text.referralLinkTitle}</h3>
                <button type="button" className="referral-card referral-card--link" onClick={handleReferralLinkCopy}>
                    {referralLink}
                </button>
            </div>

            <div className="referral-section referral-section--list">
                <h3 className="referral-section__title">{text.activeReferralsTitle}</h3>
                <div className="referral-list-card">
                    {pageLoading.referrals ? <p className="referral-card__text">{text.loading}</p> : null}
                    {!pageLoading.referrals && referralItems.length === 0 ? (
                        <p className="referral-card__text">{language === 'ru' ? 'Пока нет активных рефералов.' : 'No active referrals yet.'}</p>
                    ) : null}
                    {referralItems.map((item) => (
                        <div key={item.id} className="referral-pill">
                            <div className="referral-pill__avatar" aria-hidden="true" />
                            <span className="referral-pill__name">{item.name}</span>
                            <strong className="referral-pill__reward">{item.reward}</strong>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const renderWalletScreen = () => (
        <section className="wallet-screen">
            <h2 className="wallet-screen__title">{text.walletPageTitle}</h2>

            <div className="info-card-shell">
                <div className="info-list">
                    <div className="info-list__row">
                        <span>Balance</span>
                        <strong>{walletData?.wallet?.balance ?? 0}</strong>
                    </div>
                    <div className="info-list__row">
                        <span>Available</span>
                        <strong>{walletData?.wallet?.balanceAvailable ?? 0}</strong>
                    </div>
                    <div className="info-list__row">
                        <span>Total earned</span>
                        <strong>{walletData?.wallet?.totalEarned ?? 0}</strong>
                    </div>
                </div>
            </div>

            <div className="referral-section referral-section--list">
                <h3 className="referral-section__title">Transactions</h3>
                <div className="referral-list-card">
                    {pageLoading.wallet ? <p className="referral-card__text">{text.loading}</p> : null}
                    {!pageLoading.wallet && walletTransactions.length === 0 ? (
                        <p className="referral-card__text">{language === 'ru' ? 'Транзакций пока нет.' : 'No transactions yet.'}</p>
                    ) : null}
                    {walletTransactions.map((item) => (
                        <div key={item.id} className="referral-pill">
                            <div className="referral-pill__avatar" aria-hidden="true" />
                            <span className="referral-pill__name">{item.description || item.type}</span>
                            <strong className="referral-pill__reward">{`${item.amount > 0 ? '+' : ''}${item.amount}`}</strong>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const renderHistoryScreen = () => (
        <section className="history-screen">
            <header className="history-header">
                <button
                    type="button"
                    className="history-back-button"
                    aria-label={text.back}
                    onClick={() => setCurrentPage('home')}
                >
                    <ArrowLeft size={34} />
                </button>
                <h2 className="history-title">{text.historyTitle}</h2>
            </header>

            <div className="referral-card referral-card--intro" style={{ display: 'grid', gap: '12px' }}>
                <textarea
                    value={promptDraft}
                    onChange={(event) => setPromptDraft(event.target.value)}
                    placeholder={text.promptPlaceholder}
                    rows={4}
                    style={{ width: '100%', borderRadius: '16px', padding: '12px', resize: 'vertical', border: 'none' }}
                />
                <input
                    value={promptCategory}
                    onChange={(event) => setPromptCategory(event.target.value)}
                    placeholder={text.promptCategoryPlaceholder}
                    style={{ width: '100%', borderRadius: '16px', padding: '12px', border: 'none' }}
                />
                <button
                    type="button"
                    className="settings-card settings-row settings-row--button"
                    onClick={handleSavePrompt}
                    disabled={isSavingPrompt}
                >
                    <span className="settings-label">{isSavingPrompt ? text.loading : text.savePromptButton}</span>
                </button>
            </div>

            <div className="referral-list-card">
                {pageLoading.history ? <p className="referral-card__text">{text.loading}</p> : null}
                {!pageLoading.history && historyItems.length === 0 ? (
                    <p className="referral-card__text">{language === 'ru' ? 'История промтов пока пуста.' : 'Prompt history is empty.'}</p>
                ) : null}
                {historyItems.map((item) => (
                    <div key={item.id} className="referral-pill">
                        <div className="referral-pill__avatar" aria-hidden="true" />
                        <span className="referral-pill__name">{item.prompt}</span>
                        <strong className="referral-pill__reward">{[item.category, item.createdAt].filter(Boolean).join(' • ')}</strong>
                    </div>
                ))}
            </div>
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

        const switchLanguage = (nextLanguage) => {
            setLanguage(nextLanguage);
            setIsLanguageMenuOpen(false);
        };

        return (
            <section className="settings-screen">
                <header className="settings-header">
                    <button
                        type="button"
                        className="settings-back-button"
                        aria-label={text.back}
                        onClick={() => setCurrentPage('profile')}
                    >
                        <ArrowLeft size={34} />
                    </button>
                    <h2 className="settings-title">{text.settingsTitle}</h2>
                </header>

                <div className="settings-list">
                    <div className="settings-card">
                        <button
                            type="button"
                            className="settings-row"
                            aria-expanded={isLanguageMenuOpen}
                            onClick={() => setIsLanguageMenuOpen((prevState) => !prevState)}
                        >
                            <span className="settings-label">{text.languageLabel}</span>
                            <span className="settings-value">
                                <span>{text.languageNames[language]}</span>
                                <ChevronDown
                                    size={24}
                                    className={`settings-chevron ${isLanguageMenuOpen ? 'settings-chevron--open' : ''}`}
                                />
                            </span>
                        </button>

                        {isLanguageMenuOpen ? (
                            <div className="settings-options">
                                {['ru', 'en'].map((langCode) => (
                                    <button
                                        key={langCode}
                                        type="button"
                                        className={`settings-option ${language === langCode ? 'settings-option--active' : ''}`}
                                        onClick={() => switchLanguage(langCode)}
                                    >
                                        {text.languageNames[langCode]}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <button type="button" className="settings-card settings-row settings-row--button" onClick={toggleTheme}>
                        <span className="settings-label">{text.themeLabel}</span>
                        <span className="settings-value">
                            <span className={`settings-theme-toggle settings-theme-toggle--${theme}`} aria-hidden="true">
                                <span className="settings-theme-toggle__knob">
                                    {theme === 'dark' ? <Moon size={14} /> : <SunMedium size={14} />}
                                </span>
                            </span>
                            <span>{text.themeNames[theme]}</span>
                            <ChevronDown size={24} className="settings-chevron" />
                        </span>
                    </button>

                    <button
                        type="button"
                        className="settings-card settings-row settings-row--button settings-row--support"
                        onClick={handleSupportClick}
                    >
                        <span className="settings-label">{text.supportLabel}</span>
                    </button>
                </div>

                <div className="settings-footer">{APP_NAME}</div>
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
        <div className="app-shell">
            <main className="app-main">
                {statusMessage ? (
                    <div className="referral-card referral-card--intro" style={{ marginBottom: '16px' }}>
                        <p className="referral-card__text">{statusMessage}</p>
                    </div>
                ) : null}
                {currentPage === 'home'
                    ? renderHomeScreen()
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
                                        : renderInfoScreen()}
            </main>

            <nav className="bottom-nav" aria-label="Основная навигация">
                <div className="bottom-nav__inner">
                    {navigationItems.map(({ key, label, icon: Icon }) => {
                        const isActive = activeNavKey === key;

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
                                <Icon size={36} />
                                <span className="sr-only">{label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

export default App;
