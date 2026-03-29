import React, { useState } from 'react';
import ProfilePage from './Components/Profile/ProfilePage.jsx';
import ReferralPage from './Components/ReferalPage/ReferalPage.jsx';

// Глобальные стили
const globalStyles = {
    margin: 0,
    padding: 0,
    backgroundColor: '#050505',
    minHeight: '100vh',
    color: 'white',
    fontFamily: 'sans-serif',
    paddingBottom: '80px' // Отступ, чтобы контент не залезал под кнопки
};

function App() {
    const [currentPage, setCurrentPage] = useState('profile');

    return (
        <div style={globalStyles}>
            {/* Контент страницы */}
            <main>
                {currentPage === 'profile' ? <ProfilePage /> : <ReferralPage />}
            </main>

            {/* Нижняя навигация (Tab Bar) */}
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '70px',
                display: 'flex',
                gap: '15px',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'rgba(26, 26, 26, 0.8)', // Полупрозрачный фон
                backdropFilter: 'blur(10px)', // Эффект стекла
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: 'env(safe-area-inset-bottom)', // Учет полоски на iPhone
                zIndex: 1000
            }}>
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
                        color: currentPage === 'profile' ? '#000' : '#8e8e93'
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
                        color: currentPage === 'referrals' ? '#000' : '#8e8e93'
                    }}
                >
                    Рефералы
                </button>
            </nav>
        </div>
    );
}

export default App;