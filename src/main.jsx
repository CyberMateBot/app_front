import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import {
    API_BASE_URL,
    API_BASE_URL_MISCONFIGURED,
    API_BASE_URL_MISSING_IN_PROD,
    ENABLE_TELEGRAM_MOCK,
} from './config/env.js';
import './index.css';

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
        <App />
    </React.StrictMode>,
);