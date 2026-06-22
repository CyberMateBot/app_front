import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/env.js';
import {
    getTelegramWebApp,
    openMainMiniAppFullscreen,
    shouldShowDesktopExpandPrompt,
} from '../lib/telegramWebApp.js';

const DISMISS_KEY = 'cybermate.tg_expand_dismissed';

function readDismissed() {
    try {
        return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
        return false;
    }
}

function writeDismissed() {
    try {
        sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
        // Ignore storage errors.
    }
}

async function resolveFullscreenLink() {
    if (!API_BASE_URL) {
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/v1/app/links`);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        return data?.mini_app_fullscreen_url || null;
    } catch {
        return null;
    }
}

export default function TelegramDesktopExpand({ language = 'ru' }) {
    const [visible, setVisible] = useState(false);
    const [fullscreenUrl, setFullscreenUrl] = useState(null);

    useEffect(() => {
        if (readDismissed()) {
            return undefined;
        }

        const tg = getTelegramWebApp();
        const sync = () => {
            setVisible(shouldShowDesktopExpandPrompt(tg));
        };

        sync();
        const intervalId = window.setInterval(sync, 800);

        resolveFullscreenLink().then((url) => {
            if (url) {
                setFullscreenUrl(url);
            }
        });

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    if (!visible) {
        return null;
    }

    const title = language === 'ru' ? 'Открыть на весь экран' : 'Open fullscreen';
    const hint = language === 'ru'
        ? 'Из списка чатов Telegram открывает приложение в компактном окне. Нажмите, чтобы перейти в полноэкранный режим.'
        : 'Telegram may open the app in a compact window from the chat list. Tap to switch to fullscreen.';

    return (
        <div className="tg-desktop-expand" role="region" aria-label={title}>
            <p className="tg-desktop-expand__text">{hint}</p>
            <div className="tg-desktop-expand__actions">
                <button
                    type="button"
                    className="tg-desktop-expand__btn tg-desktop-expand__btn--primary"
                    onClick={() => openMainMiniAppFullscreen(fullscreenUrl)}
                >
                    {title}
                </button>
                <button
                    type="button"
                    className="tg-desktop-expand__btn"
                    onClick={() => {
                        writeDismissed();
                        setVisible(false);
                    }}
                >
                    {language === 'ru' ? 'Скрыть' : 'Dismiss'}
                </button>
            </div>
        </div>
    );
}
