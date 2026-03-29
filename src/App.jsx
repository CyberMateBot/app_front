import React, { useEffect, useState } from 'react';
import './App.css';
import Profile from './Components/Profile/ProfilePage.jsx';

const App = () => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Инициализация Telegram WebApp API
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand(); // Расширяем на весь экран
            setUserData(tg.initDataUnsafe?.user);
        }
    }, []);

    return (
        <div className="app-wrapper">
            <main className="app-content">
                <Profile user={userData} />
            </main>
        </div>
    );
};

export default App;