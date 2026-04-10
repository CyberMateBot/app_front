import React, { useEffect, useState } from 'react';
import ProfilePage from './Components/Profile/ProfilePage.jsx';
import ReferralPage from './Components/ReferalPage/ReferalPage.jsx';
import {
    getMyProfile,
    normalizeProfileResponse,
    registerTelegramUser,
} from './api/telegramApi.js';
import { APP_NAME, ENABLE_TELEGRAM_MOCK } from './config/env.js';
import { initTelegramMiniApp } from './lib/telegramWebApp.js';

const globalStyles = {
    margin: 0,
    padding: 0,
    backgroundColor: '#050505',
    minHeight: '100vh',
    color: 'white',
    fontFamily: 'sans-serif',
    paddingBottom: '80px',
};

function App() {
    const [currentPage, setCurrentPage] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [telegramUser, setTelegramUser] = useState(null);
    const [startParam, setStartParam] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

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
                            ? 'Профиль найден на backend.'
                            : 'Пользователь зарегистрирован и профиль получен с backend.',
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

    return (
        <div style={globalStyles}>
            <main>
                {currentPage === 'profile' ? (
                    <ProfilePage
                        appName={APP_NAME}
                        profile={profile}
                        telegramUser={telegramUser}
                        startParam={startParam}
                        statusMessage={statusMessage}
                        isLoading={isLoading}
                    />
                ) : (
                    <ReferralPage
                        appName={APP_NAME}
                        telegramUser={telegramUser}
                        startParam={startParam}
                        isLoading={isLoading}
                    />
                )}
            </main>

            <nav
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '70px',
                    display: 'flex',
                    gap: '15px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'rgba(26, 26, 26, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={() => setCurrentPage('profile')}
                    style={{
                        flex: 1,
                        maxWidth: '150px',
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        background: currentPage === 'profile' ? '#4ade80' : 'transparent',
                        color: currentPage === 'profile' ? '#000' : '#8e8e93',
                    }}
                >
                    Профиль
                </button>

                <button
                    onClick={() => setCurrentPage('referrals')}
                    style={{
                        flex: 1,
                        maxWidth: '150px',
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        background: currentPage === 'referrals' ? '#4ade80' : 'transparent',
                        color: currentPage === 'referrals' ? '#000' : '#8e8e93',
                    }}
                >
                    Рефералы
                </button>
            </nav>
        </div>
    );
}

export default App;