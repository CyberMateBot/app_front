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
import { getTelegramWebApp, initTelegramMiniAppAsync } from './lib/telegramWebApp.js';

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

void initTelegramMiniAppAsync({ timeoutMs: 12000 }).then((tg) => {
    initUiScale(tg ?? getTelegramWebApp());
});
initAppUpdateWatcher();

if (import.meta.env.DEV) {
    // Only log the actual backend host locally. Printing it in the shipped
    // production build handed the exact API host/path to anyone who opened
    // devtools — an easy first step for scripting requests straight at the
    // backend (e.g. POST /register) instead of going through the app.
    console.info('[CyberMate] API_BASE_URL:', API_BASE_URL || '(proxy → localhost:8090)');
    console.info('[CyberMate] Telegram mock:', ENABLE_TELEGRAM_MOCK);
} else if (API_BASE_URL_MISCONFIGURED || API_BASE_URL_MISSING_IN_PROD) {
    // Deployment misconfiguration still needs to be loud so it gets fixed,
    // but without echoing the (broken) URL value itself.
    console.error('[CyberMate] API URL is misconfigured. Check the API base URL build setting and redeploy.');
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AppErrorBoundary>
            <App />
        </AppErrorBoundary>
    </React.StrictMode>,
);