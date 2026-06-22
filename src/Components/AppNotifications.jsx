import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Crown, X } from 'lucide-react';

function getPanelPosition(triggerEl) {
    if (!triggerEl || typeof window === 'undefined') {
        return null;
    }

    const rect = triggerEl.getBoundingClientRect();
    return {
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
        width: Math.min(320, window.innerWidth - 24),
    };
}

export default function AppNotifications({
    notifications = [],
    language = 'ru',
    onOpenSubscription,
}) {
    const [open, setOpen] = useState(false);
    const [panelPosition, setPanelPosition] = useState(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const unreadCount = notifications.filter((item) => item.unread !== false).length;

    useLayoutEffect(() => {
        if (!open) {
            setPanelPosition(null);
            return undefined;
        }

        const updatePosition = () => {
            setPanelPosition(getPanelPosition(triggerRef.current));
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            const target = event.target;
            if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
                return;
            }
            setOpen(false);
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [open]);

    const panel = open && panelPosition ? (
        <div
            ref={panelRef}
            className="app-notifications__panel app-notifications__panel--portal"
            role="dialog"
            aria-label={language === 'ru' ? 'Уведомления' : 'Notifications'}
            style={{
                top: panelPosition.top,
                right: panelPosition.right,
                width: panelPosition.width,
            }}
        >
            <div className="app-notifications__panel-head">
                <strong>{language === 'ru' ? 'Уведомления' : 'Notifications'}</strong>
                <button
                    type="button"
                    className="app-notifications__close"
                    aria-label={language === 'ru' ? 'Закрыть' : 'Close'}
                    onClick={() => setOpen(false)}
                >
                    <X size={16} />
                </button>
            </div>

            {notifications.length ? (
                <ul className="app-notifications__list">
                    {notifications.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                className="app-notifications__item"
                                onClick={() => {
                                    setOpen(false);
                                    if (item.action === 'subscription') {
                                        onOpenSubscription?.();
                                    }
                                }}
                            >
                                <span className="app-notifications__item-ico" aria-hidden="true">
                                    <Crown size={14} />
                                </span>
                                <span className="app-notifications__item-body">
                                    <span className="app-notifications__item-title">{item.title}</span>
                                    <span className="app-notifications__item-text">{item.message}</span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="app-notifications__empty">
                    {language === 'ru' ? 'Нет новых уведомлений' : 'No new notifications'}
                </p>
            )}
        </div>
    ) : null;

    return (
        <div className="app-notifications">
            <button
                ref={triggerRef}
                type="button"
                className={`home-concept__icon-btn app-notifications__trigger${unreadCount ? ' app-notifications__trigger--active' : ''}`}
                aria-label={language === 'ru' ? 'Уведомления' : 'Notifications'}
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
            >
                <Bell size={18} />
                {unreadCount ? (
                    <span className="app-notifications__badge" aria-hidden="true">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                ) : null}
            </button>

            {typeof document !== 'undefined' && panel
                ? createPortal(panel, document.body)
                : null}
        </div>
    );
}
