import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AppErrorBoundary from './Components/AppErrorBoundary.jsx';
import {
    API_BASE_URL,
    API_BASE_URL_MISCONFIGURED,
    API_BASE_URL_MISSING_IN_PROD,
    ENABLE_TELEGRAM_MOCK,
} from './config/env.js';
import './index.css';
import { initUiScale } from './lib/uiScale.js';
import { initAppUpdateWatcher } from './lib/appUpdate.js';
import { initTelegramMiniApp } from './lib/telegramWebApp.js';

function showFatalBootError(message) {
    const root = document.getElementById('root');

    if (!root) {
        return;
    }

    root.innerHTML = `
        <div class="app-fatal">
            <p class="app-fatal__title">Не удалось открыть приложение</p>
            <p class="app-fatal__message">${String(message).replace(/</g, '&lt;')}</p>
            <button type="button" class="app-fatal__btn" onclick="window.location.reload()">Обновить</button>
        </div>
    `;
}

if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        if (event.message) {
            showFatalBootError(event.message);
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : String(reason ?? 'Unknown error');
        showFatalBootError(message);
    });
}

initTelegramMiniApp();
initUiScale();
initAppUpdateWatcher();

if (import.meta.env.DEV) {
    console.info('[CyberMate] API_BASE_URL:', API_BASE_URL || '(proxy → localhost:8090)');
    console.info('[CyberMate] Telegram mock:', ENABLE_TELEGRAM_MOCK);
} else {
    console.info('[CyberMate] API_BASE_URL:', API_BASE_URL || '(not set — set VITE_API_BASE_URL and redeploy)');
    if (API_BASE_URL_MISCONFIGURED || API_BASE_URL_MISSING_IN_PROD) {
        console.error('[CyberMate] API URL misconfigured. Fix VITE_API_BASE_URL on Railway frontend service.');
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AppErrorBoundary>
            <App />
        </AppErrorBoundary>
    </React.StrictMode>,
);