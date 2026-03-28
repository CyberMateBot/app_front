import React, { useState, useEffect } from 'react';
import { IoPersonOutline, IoKeyOutline, IoTimeOutline, IoStatsChartOutline, IoLanguageOutline, IoChevronForwardOutline } from 'react-icons/io5';
import { BsStars } from 'react-icons/bs';

const ProfilePage = () => {
    // --- СОСТОЯНИЕ ДАННЫХ (Готово для интеграции с API) ---
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

    // --- ЭФФЕКТ ДЛЯ ЗАГРУЗКИ С БЭКЕНДА ---
    useEffect(() => {
        // Здесь будет ваш запрос, например:
        // fetch('/api/profile').then(res => res.json()).then(data => setUser(data));
    }, []);

    // Вспомогательный компонент для строк данных
    const InfoRow = ({ icon: Icon, label, value, color = "text-white" }) => (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-3">
                <div className="bg-white/5 p-2 rounded-lg">
                    <Icon className="text-[#C3FF00]" size={18} />
                </div>
                <span className="text-neutral-400 text-sm font-medium">{label}</span>
            </div>
            <span className={`text-sm font-bold ${color}`}>{value}</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#030303] text-white p-5 pb-20 font-sans">

            {/* 1. ШАПКА И ID */}
            <div className="flex flex-col items-center mt-4 mb-8">
                <div className="relative mb-4">
                    <div className="w-20 h-20 bg-gradient-to-tr from-[#C3FF00] to-green-900 rounded-full flex items-center justify-center text-3xl font-bold text-black">
                        {user.username[1].toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-[#C3FF00] p-1.5 rounded-full border-4 border-[#030303]">
                        <BsStars size={12} className="text-black" />
                    </div>
                </div>
                <h1 className="text-xl font-bold mb-1">{user.username}</h1>
                <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    <span className="text-xs text-neutral-500 font-mono tracking-wider">ID: {user.id}</span>
                </div>
            </div>

            {/* 2. БЛОК ПОДПИСКИ И ТОКЕНОВ */}
            <div className="bg-[#111111] rounded-2xl p-4 mb-4 border border-white/5 shadow-xl">
                <h2 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2 px-1 font-bold">Подписка & Баланс</h2>
                <InfoRow icon={BsStars} label="Статус" value={user.subscription} color="text-[#C3FF00]" />
                <InfoRow icon={IoTimeOutline} label="Действует до" value={user.expiryDate} />
                <InfoRow icon={IoKeyOutline} label="Токены" value={user.tokens} color="text-[#C3FF00]" />
            </div>

            {/* 3. БЛОК СТАТИСТИКИ */}
            <div className="bg-[#111111] rounded-2xl p-4 mb-4 border border-white/5 shadow-xl">
                <h2 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2 px-1 font-bold">Активность</h2>
                <InfoRow icon={IoStatsChartOutline} label="Всего запросов" value={user.totalRequests} />
                <InfoRow icon={IoPersonOutline} label="С нами с" value={user.joinedDate} />
            </div>

            {/* 4. НАСТРОЙКИ (ЯЗЫК) */}
            <div className="bg-[#111111] rounded-2xl p-4 border border-white/5 shadow-xl">
                <h2 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2 px-1 font-bold">Система</h2>
                <button className="w-full flex items-center justify-between py-2 group">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/5 p-2 rounded-lg">
                            <IoLanguageOutline className="text-[#C3FF00]" size={18} />
                        </div>
                        <span className="text-neutral-400 text-sm font-medium">Язык интерфейса</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{user.language}</span>
                        <IoChevronForwardOutline className="text-neutral-600 group-active:translate-x-1 transition-transform" />
                    </div>
                </button>
            </div>

            {/* ФУТЕР-ЗАГЛУШКА */}
            <p className="text-center text-[10px] text-neutral-700 mt-8 uppercase tracking-widest font-medium">
                AI Assistant v1.0.4
            </p>

        </div>
    );
};

export default ProfilePage;