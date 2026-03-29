import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    Menu,
    Copy,
    CheckCheck,
    Users,
    Gift
} from 'lucide-react';
import './ReferalPage.css';


// ЗАГЛУШКА ДАННЫХ РЕФЕРАЛОВ (MOCK DATA)

const MOCK_REFERRAL_DATA = {
    referralLink: 'https://t.me/CyberMateBot?start=ref_77654321',
    stats: {
        totalReferrals: 12,
        totalEarned: '3,000'
    },
    referralsList: [
        {
            id: '101',
            username: 'alex_dev',
            avatarUrl: 'file:///C:/Users/sssdy/Downloads/e1039606530ab1a8499c0583407889ba.jpg',
            date: '12.03.2026',
            bonus: '+250'
        },
        {
            id: '102',
            username: 'crypto_queen',
            avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop',
            date: '10.03.2026',
            bonus: '+250'
        },
        {
            id: '103',
            username: 'neo_matrix',
            avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
            date: '05.03.2026',
            bonus: '+250'
        }
    ]
};

const ReferralPage = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);

    // Имитация загрузки данных
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Здесь будет реальный fetch к API
                setTimeout(() => {
                    setData(MOCK_REFERRAL_DATA);
                    setIsLoading(false);
                }, 600);
            } catch (error) {
                console.error("Ошибка при загрузке рефералов:", error);
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Функция копирования ссылки
    const handleCopyLink = async () => {
        if (!data) return;
        try {
            await navigator.clipboard.writeText(data.referralLink);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Возвращаем иконку обратно через 2 сек
        } catch (err) {
            console.error('Не удалось скопировать текст: ', err);
        }
    };

    if (isLoading || !data) {
        return <div className="ref-loading">Загрузка данных...</div>;
    }

    return (
        <div className="ref-page">
            {/* Header */}
            <header className="ref-header-nav">
                <button className="icon-btn" aria-label="Назад">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="header-title">CyberMate</h1>
                <button className="icon-btn" aria-label="Меню">
                    <Menu size={24} />
                </button>
            </header>

            {/* Hero Section */}
            <div className="ref-hero">
                <h2 className="ref-page-title">Партнерская программа</h2>
                <p className="ref-page-subtitle">Приглашайте друзей и получайте токены за их активность в приложении.</p>
            </div>

            <div className="ref-cards-container">

                {/* Статистика */}
                <div className="ref-stats-row">
                    <div className="glass-card stat-card">
                        <Users size={24} className="stat-icon" />
                        <div className="stat-info">
                            <span className="stat-value">{data.stats.totalReferrals}</span>
                            <span className="stat-label">Друзей</span>
                        </div>
                    </div>
                    <div className="glass-card stat-card">
                        <Gift size={24} className="stat-icon highlight" />
                        <div className="stat-info">
                            <span className="stat-value">{data.stats.totalEarned}</span>
                            <span className="stat-label">Токенов</span>
                        </div>
                    </div>
                </div>

                {/* Карточка ссылки */}
                <div className="glass-card link-card">
                    <div className="card-header-title">ВАША ССЫЛКА</div>
                    <div className="link-input-wrapper">
                        <input
                            type="text"
                            className="ref-link-input"
                            value={data.referralLink}
                            readOnly
                        />
                        <button
                            className={`copy-btn ${isCopied ? 'copied' : ''}`}
                            onClick={handleCopyLink}
                            aria-label="Скопировать ссылку"
                        >
                            {isCopied ? <CheckCheck size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                </div>

                {/* Список рефералов */}
                <div className="glass-card list-card">
                    <div className="card-header-title">СПИСОК РЕФЕРАЛОВ</div>

                    {data.referralsList.length > 0 ? (
                        <div className="referrals-list">
                            {data.referralsList.map((ref, index) => (
                                <React.Fragment key={ref.id}>
                                    <div className="ref-list-item">
                                        <div className="ref-user-info">
                                            <img src={ref.avatarUrl} alt={ref.username} className="ref-avatar" />
                                            <div className="ref-details">
                                                <span className="ref-username">@{ref.username}</span>
                                                <span className="ref-date">{ref.date}</span>
                                            </div>
                                        </div>
                                        <div className="ref-profit">{ref.bonus}</div>
                                    </div>
                                    {/* Добавляем разделитель, кроме последнего элемента */}
                                    {index < data.referralsList.length - 1 && <div className="divider"></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">У вас пока нет приглашенных друзей.</div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ReferralPage;