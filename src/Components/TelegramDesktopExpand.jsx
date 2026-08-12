import { useEffect, useState } from 'react';
import { API_BASE_URL, BOT_USERNAME } from '../config/env.js';
import {
    buildMainMiniAppFullscreenLink,
    getTelegramWebApp,
    openMainMiniAppFullscreen,
    shouldShowDesktopExpandPrompt,
    subscribeTelegramLayout,
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
    if (API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/v1/app/links`);
            if (response.ok) {
                const data = await response.json();
                if (data?.mini_app_fullscreen_url) {
                    return data.mini_app_fullscreen_url;
                }
            }
        } catch {
            // Fall through to env default.
        }
    }

    const tg = getTelegramWebApp();
    const startParam = tg?.initDataUnsafe?.start_param ?? '';
    return buildMainMiniAppFullscreenLink(BOT_USERNAME, startParam);
}

export default function TelegramDesktopExpand({ language = 'ru' }) {
    const [visible, setVisible] = useState(false);
    const [fullscreenUrl, setFullscreenUrl] = useState(() => {
        const tg = getTelegramWebApp();
        return buildMainMiniAppFullscreenLink(BOT_USERNAME, tg?.initDataUnsafe?.start_param ?? '');
    });

    useEffect(() => {
        if (readDismissed()) {
            return undefined;
        }

        const sync = () => {
            setVisible(shouldShowDesktopExpandPrompt(getTelegramWebApp()));
        };

        sync();
        const unsubscribe = subscribeTelegramLayout(sync);
        const intervalId = window.setInterval(sync, 600);

        resolveFullscreenLink().then((url) => {
            if (url) {
                setFullscreenUrl(url);
            }
        });

        return () => {
            unsubscribe();
            window.clearInterval(intervalId);
        };
    }, []);

    if (!visible) {
        return null;
    }

    const title = language === 'ru' ? 'Открыть на весь экран' : 'Open fullscreen';
    const hint = language === 'ru'
        ? 'Telegram открыл приложение в компактном окне. Нажмите, чтобы перейти в полноэкранный режим.'
        : 'Telegram opened the app in a compact window. Tap to switch to fullscreen.';

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
