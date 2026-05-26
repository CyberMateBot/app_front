import React, { useEffect, useState } from 'react';
import {
    ChevronLeft,
    Menu,
    Copy,
    CheckCheck,
    Users,
    Gift,
} from 'lucide-react';
import { getMyReferralLink } from '../../api/telegramApi.js';
import { showTelegramAlert } from '../../lib/telegramWebApp.js';
import './ReferalPage.css';

const ReferralPage = ({ appName, isLoading }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [referralLink, setReferralLink] = useState('');
    const [referralLinkLoading, setReferralLinkLoading] = useState(false);

    useEffect(() => {
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
                    console.error('Не удалось загрузить реферальную ссылку:', error);
                    setReferralLink('');
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
    }, []);

    const handleCopyLink = async () => {
        if (!referralLink) {
            return;
        }

        try {
            await navigator.clipboard.writeText(referralLink);
            setIsCopied(true);
            showTelegramAlert('Ссылка скопирована');
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error('Не удалось скопировать ссылку:', error);
        }
    };

    if (isLoading) {
        return <div className="ref-loading">Готовим реферальные данные...</div>;
    }

    return (
        <div className="ref-page">
            <header className="ref-header-nav">
                <button className="icon-btn" aria-label="Назад">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="header-title">{appName}</h1>
                <button className="icon-btn" aria-label="Меню">
                    <Menu size={24} />
                </button>
            </header>

            <div className="ref-hero">
                <h2 className="ref-page-title">Партнерская программа</h2>
                <p className="ref-page-subtitle">
                    Приглашайте друзей в CyberMate и получайте бонусы за активных пользователей.
                </p>
            </div>

            <div className="ref-cards-container">
                <div className="ref-stats-row">
                    <div className="glass-card stat-card">
                        <Users size={24} className="stat-icon" />
                        <div className="stat-info">
                            <span className="stat-value">0</span>
                            <span className="stat-label">Друзей</span>
                        </div>
                    </div>
                    <div className="glass-card stat-card">
                        <Gift size={24} className="stat-icon highlight" />
                        <div className="stat-info">
                            <span className="stat-value">0</span>
                            <span className="stat-label">Токенов</span>
                        </div>
                    </div>
                </div>

                <div className="glass-card link-card">
                    <div className="card-header-title">ВАША ССЫЛКА</div>
                    <div className="link-input-wrapper">
                        <input
                            type="text"
                            className="ref-link-input"
                            value={referralLinkLoading ? 'Загрузка...' : referralLink}
                            readOnly
                        />
                        <button
                            className={`copy-btn ${isCopied ? 'copied' : ''}`}
                            onClick={handleCopyLink}
                            aria-label="Скопировать ссылку"
                            disabled={referralLinkLoading || !referralLink}
                        >
                            {isCopied ? <CheckCheck size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                </div>

                <div className="glass-card list-card">
                    <div className="card-header-title">СПИСОК РЕФЕРАЛОВ</div>
                    <div className="empty-state">
                        Пока нет активных рефералов.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralPage;
