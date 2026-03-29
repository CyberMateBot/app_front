import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    Menu,
    Sparkles,
    Clock,
    Key,
    BarChart2,
    User,
    Languages,
    ChevronRight
} from 'lucide-react';
import './ProfilePage.css';

// ==========================================
// ЗАГЛУШКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ (MOCK DATA)
// ==========================================
// Используйте эту структуру данных для тестов в браузере.
// Ссылка на аватарку ведет на бесплатное тестовое изображение с Unsplash.
// Вы можете заменить URL на любой другой доступный.

const MOCK_USER_DATA = {
    username: 'ivan_ivanov',
    id: '77654321',
    // URL-адрес аватарки пользователя (заглушка)
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    subscription: {
        status: 'Premium Plus',
        validUntil: '15.04.2026',
        tokens: '45,500'
    },
    activity: {
        totalRequests: '1,240',
        joinedAt: '12.10.2025'
    },
    settings: {
        language: 'Русский'
    }
};

const ProfilePage = () => {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Имитация загрузки данных с бэкенда
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // ЗДЕСЬ БУДЕТ ВАШ API ЗАПРОС К БЭКЕНДУ
                // Например: const response = await fetch('/api/user/profile');
                //          const data = await response.json();

                // Для теста используем таймаут и мок-данные
                setTimeout(() => {
                    setUserData(MOCK_USER_DATA);
                    setIsLoading(false);
                }, 800); // Имитация задержки сети
            } catch (error) {
                console.error("Ошибка при загрузке данных пользователя:", error);
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (isLoading || !userData) {
        return <div className="profile-loading">Загрузка профиля...</div>;
    }

    return (
        <div className="profile-page">
            {/* Header */}
            <header className="profile-header-nav">
                <button className="icon-btn" aria-label="Назад">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="header-title">CyberMate</h1>
                <button className="icon-btn" aria-label="Меню">
                    <Menu size={24} />
                </button>
            </header>

            {/* Main Profile Info with Avatar */}
            <div className="profile-avatar-section">
                {/* Контейнер для аватарки (заменяет старый логотип) */}
                <div className="avatar-container">
                    <img
                        src={userData.avatarUrl}
                        alt={`Аватарка пользователя @${userData.username}`}
                        className="user-avatar"
                    />
                </div>
                <h2 className="username">@{userData.username}</h2>
                <span className="user-id">ID: {userData.id}</span>
            </div>

            {/* Cards Section (без изменений) */}
            <div className="cards-container">

                {/* Card: Подписка & Баланс */}
                <div className="info-card">
                    <div className="card-header-title">ПОДПИСКА & БАЛАНС</div>

                    <div className="card-row">
                        <div className="row-left">
                            <Sparkles size={18} className="row-icon" />
                            <span className="row-label">Статус</span>
                        </div>
                        <div className="row-right">{userData.subscription.status}</div>
                    </div>
                    <div className="divider"></div>

                    <div className="card-row">
                        <div className="row-left">
                            <Clock size={18} className="row-icon" />
                            <span className="row-label">Действует до</span>
                        </div>
                        <div className="row-right">{userData.subscription.validUntil}</div>
                    </div>
                    <div className="divider"></div>

                    <div className="card-row">
                        <div className="row-left">
                            <Key size={18} className="row-icon" />
                            <span className="row-label">Токены</span>
                        </div>
                        <div className="row-right">{userData.subscription.tokens}</div>
                    </div>
                </div>

                {/* Card: Активность */}
                <div className="info-card">
                    <div className="card-header-title">АКТИВНОСТЬ</div>

                    <div className="card-row">
                        <div className="row-left">
                            <BarChart2 size={18} className="row-icon" />
                            <span className="row-label">Всего запросов</span>
                        </div>
                        <div className="row-right">{userData.activity.totalRequests}</div>
                    </div>
                    <div className="divider"></div>

                    <div className="card-row">
                        <div className="row-left">
                            <User size={18} className="row-icon" />
                            <span className="row-label">С нами с</span>
                        </div>
                        <div className="row-right">{userData.activity.joinedAt}</div>
                    </div>
                </div>

                {/* Card: Параметры системы */}
                <div className="info-card interactive-card">
                    <div className="card-header-title">ПАРАМЕТРЫ СИСТЕМЫ</div>

                    <div className="card-row">
                        <div className="row-left">
                            <Languages size={18} className="row-icon" />
                            <span className="row-label">Язык интерфейса</span>
                        </div>
                        <div className="row-right clickable">
                            {userData.settings.language}
                            <ChevronRight size={16} className="chevron-icon" />
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer (без изменений) */}
            <footer className="profile-footer">
                CyberMate v0
            </footer>
        </div>
    );
};

export default ProfilePage;