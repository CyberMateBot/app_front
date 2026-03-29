import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Глобальные стили (сброс отступов и т.д.)

// Инициализируем корень приложения
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);