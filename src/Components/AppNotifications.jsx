import React, { useEffect, useRef, useState } from 'react';
import { Bell, Crown, X } from 'lucide-react';

export default function AppNotifications({
    notifications = [],
    language = 'ru',
    onOpenSubscription,
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const unreadCount = notifications.filter((item) => item.unread !== false).length;

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [open]);

    return (
        <div className="app-notifications" ref={rootRef}>
            <button
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

            {open ? (
                <div className="app-notifications__panel" role="dialog" aria-label={language === 'ru' ? 'Уведомления' : 'Notifications'}>
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
            ) : null}
        </div>
    );
}
