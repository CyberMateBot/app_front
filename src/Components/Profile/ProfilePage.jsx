import React from 'react';
import {
    ChevronLeft,
    Menu,
    Sparkles,
    Clock,
    Key,
    BarChart2,
    User,
    Languages,
    ChevronRight,
} from 'lucide-react';
import './ProfilePage.css';

function buildProfileView(profile, telegramUser) {
    const displayName = [profile?.name, profile?.surname].filter(Boolean).join(' ')
        || telegramUser?.first_name
        || 'Telegram User';

    return {
        displayName,
        username: profile?.username || telegramUser?.username || 'username_not_set',
        telegramId: profile?.telegramId || (telegramUser?.id ? String(telegramUser.id) : '—'),
        backendId: profile?.backendId || '—',
        language: profile?.language || telegramUser?.language_code || 'ru',
        avatarUrl: profile?.avatarUrl || '',
    };
}

const ProfilePage = ({ appName, profile, telegramUser, startParam, statusMessage, isLoading }) => {
    const userData = buildProfileView(profile, telegramUser);
    const avatarLetter = (userData.displayName || userData.username).charAt(0).toUpperCase();
    const statusColor = statusMessage?.includes('успешно') ? '#4ade80' : '#facc15';

    if (isLoading) {
        return <div className="profile-loading">Загрузка профиля...</div>;
    }

    return (
        <div className="profile-page">
            <header className="profile-header-nav">
                <button className="icon-btn" aria-label="Назад">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="header-title">{appName}</h1>
                <button className="icon-btn" aria-label="Меню">
                    <Menu size={24} />
                </button>
            </header>

            <div className="profile-avatar-section">
                <div className="avatar-container">
                    {userData.avatarUrl ? (
                        <img
                            src={userData.avatarUrl}
                            alt={`Аватар пользователя @${userData.username}`}
                            className="user-avatar"
                        />
                    ) : (
                        <div
                            className="user-avatar"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #4ade80, #0ea5e9)',
                                fontSize: '32px',
                                fontWeight: '700',
                            }}
                        >
                            {avatarLetter}
                        </div>
                    )}
                </div>
                <h2 className="username">{userData.displayName}</h2>
                <span className="user-id">TG ID: {userData.telegramId}</span>
            </div>

            <div className="cards-container">
                <div className="info-card">
                    <div className="card-header-title">ПРОФИЛЬ</div>

                    <div className="card-row">
                        <div className="row-left">
                            <User size={18} className="row-icon" />
                            <span className="row-label">Имя</span>
                        </div>
                        <div className="row-right">{userData.displayName}</div>
                    </div>
                    <div className="divider"></div>

                    <div className="card-row">
                        <div className="row-left">
                            <Sparkles size={18} className="row-icon" />
                            <span className="row-label">Username</span>
                        </div>
                        <div className="row-right">@{userData.username}</div>
                    </div>
                    <div className="divider"></div>

                    <div className="card-row">
                        <div className="row-left">
                            <Key size={18} className="row-icon" />
                            <span className="row-label">Backend ID</span>
                        </div>
                        <div className="row-right">{userData.backendId}</div>
                    </div>
                </div>

                <div className="info-card">
                    <div className="card-header-title">TELEGRAM MINI APP</div>

                    <div className="card-row">
                        <div className="row-left">
                            <BarChart2 size={18} className="row-icon" />
                            <span className="row-label">Telegram ID</span>
                        </div>
                        <div className="row-right">{userData.telegramId}</div>
                    </div>
                    <div className="divider"></div>

                    <div className="card-row">
                        <div className="row-left">
                            <Clock size={18} className="row-icon" />
                            <span className="row-label">Start param</span>
                        </div>
                        <div className="row-right">{startParam || '—'}</div>
                    </div>
                    <div className="divider"></div>

                    <div className="card-row">
                        <div className="row-left">
                            <Languages size={18} className="row-icon" />
                            <span className="row-label">Язык интерфейса</span>
                        </div>
                        <div className="row-right clickable">
                            {userData.language}
                            <ChevronRight size={16} className="chevron-icon" />
                        </div>
                    </div>
                </div>

                <div className="info-card interactive-card">
                    <div className="card-header-title">СТАТУС ИНТЕГРАЦИИ</div>
                    <div className="row-right" style={{ justifyContent: 'center', textAlign: 'center', color: statusColor }}>
                        {statusMessage || 'Ожидаем ответ от backend...'}
                    </div>
                </div>
            </div>

            <footer className="profile-footer">
                {appName} v0
            </footer>
        </div>
    );
};

export default ProfilePage;