import React, { useState, useEffect } from 'react';
import './App.css';
import {
    IoPersonOutline,
    IoTimeOutline,
    IoStatsChartOutline,
    IoLanguageOutline,
    IoChevronForwardOutline
} from 'react-icons/io5';
import { BsStars } from 'react-icons/bs';
import { VscKey } from 'react-icons/vsc';

export default function App() {
    // Состояние пользователя. Здесь мы готовим структуру для получения данных с бэкенда
    const [user, setUser] = useState({
        id: '12345678',
        username: '@user',
        joinedDate: '12.10.2025',
        subscription: 'Premium Plus',
        expiryDate: '15.04.2026',
        tokens: '45,500',
        totalRequests: '1,240',
        language: 'Русский'
    });

    const [isLoading, setIsLoading] = useState(false);

    // Пример того, как вы будете запрашивать данные с бэкенда при загрузке
    /*
    useEffect(() => {
      setIsLoading(true);
      fetch('https://ваш-бекенд.com/api/user/profile')
        .then(res => res.json())
        .then(data => {
          setUser(data);
          setIsLoading(false);
        })
        .catch(err => console.error('Ошибка загрузки профиля:', err));
    }, []);
    */

    if (isLoading) {
        return <div className="loading-screen">Загрузка данных системы...</div>;
    }

    return (
        <div className="app-container">
            {/* Фоновые элементы для кибер-эффекта */}
            <div className="bg-glow-top"></div>
            <div className="bg-glow-bottom"></div>

            <div className="cyber-layout">

                {/* --- ШАПКА ПРОФИЛЯ --- */}
                <div className="profile-header">
                    {/* Если у вас есть картинка логотипа CM, раскомментируйте строку ниже и удалите div logo-placeholder */}
                    {/*<img src="/7a34f05a3415bbf30ce1789771b1499b.png" alt="CM Logo" className="main-logo" /> */}
                    <div className="logo-placeholder">
                        <span className="logo-text">CM</span>
                        <div className="status-dot"></div>
                    </div>
                    <h1 className="username">{user.username}</h1>
                    <div className="id-badge">ID: {user.id}</div>
                </div>

                {/* --- СЕКЦИЯ 1: ПОДПИСКА И БАЛАНС --- */}
                <div className="section">
                    <div className="section-title">ПОДПИСКА & БАЛАНС</div>
                    <div className="cyber-card">
                        <div className="card-row">
                            <div className="row-left">
                                <BsStars className="row-icon" />
                                <span>Статус</span>
                            </div>
                            <span className="row-value">{user.subscription}</span>
                        </div>
                        <div className="card-row">
                            <div className="row-left">
                                <IoTimeOutline className="row-icon" />
                                <span>Действует до</span>
                            </div>
                            <span className="row-value">{user.expiryDate}</span>
                        </div>
                        <div className="card-row no-border">
                            <div className="row-left">
                                <VscKey className="row-icon" />
                                <span>Токены</span>
                            </div>
                            <span className="row-value">{user.tokens}</span>
                        </div>
                    </div>
                </div>

                {/* --- СЕКЦИЯ 2: АКТИВНОСТЬ --- */}
                <div className="section">
                    <div className="section-title">АКТИВНОСТЬ</div>
                    <div className="cyber-card">
                        <div className="card-row">
                            <div className="row-left">
                                <IoStatsChartOutline className="row-icon" />
                                <span>Всего запросов</span>
                            </div>
                            <span className="row-value">{user.totalRequests}</span>
                        </div>
                        <div className="card-row no-border">
                            <div className="row-left">
                                <IoPersonOutline className="row-icon" />
                                <span>С нами с</span>
                            </div>
                            <span className="row-value">{user.joinedDate}</span>
                        </div>
                    </div>
                </div>

                {/* --- СЕКЦИЯ 3: ПАРАМЕТРЫ СИСТЕМЫ --- */}
                <div className="section">
                    <div className="section-title">ПАРАМЕТРЫ СИСТЕМЫ</div>
                    <div className="cyber-card clickable-card">
                        <div className="card-row no-border">
                            <div className="row-left">
                                <IoLanguageOutline className="row-icon" />
                                <span>Язык интерфейса</span>
                            </div>
                            <div className="row-right-clickable">
                                <span className="row-value">{user.language}</span>
                                <IoChevronForwardOutline className="chevron-icon" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ПОДВАЛ --- */}
                <div className="footer">CyberMate v0</div>

            </div>
        </div>
    );
}