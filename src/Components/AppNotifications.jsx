import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Coins, Crown, ShoppingBag, X } from 'lucide-react';

const BOTTOM_NAV_RESERVE_PX = 92;

const NOTIFICATIONS_PORTAL_ID = 'app-overlays';

function getNotificationsPortalRoot() {
    if (typeof document === 'undefined') {
        return null;
    }

    return document.getElementById(NOTIFICATIONS_PORTAL_ID) ?? document.body;
}

function getPanelLayout(triggerEl) {
    if (!triggerEl || typeof window === 'undefined') {
        return null;
    }

    const rect = triggerEl.getBoundingClientRect();
    const top = rect.bottom + 8;

    return {
        top,
        right: Math.max(12, window.innerWidth - rect.right),
        width: Math.min(320, window.innerWidth - 24),
        maxHeight: Math.max(180, window.innerHeight - top - BOTTOM_NAV_RESERVE_PX),
    };
}

function NotificationIcon({ type }) {
    if (type === 'coins') {
        return <Coins size={16} />;
    }

    if (type === 'subscription-purchase') {
        return <ShoppingBag size={16} />;
    }

    return <Crown size={16} />;
}

export default function AppNotifications({
    notifications = [],
    language = 'ru',
    onOpenSubscription,
    onOpenWallet,
    onMarkRead,
}) {
    const [open, setOpen] = useState(false);
    const [panelLayout, setPanelLayout] = useState(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const notificationsRef = useRef(notifications);
    const unreadCount = notifications.filter((item) => item.unread !== false).length;

    notificationsRef.current = notifications;

    useLayoutEffect(() => {
        if (!open) {
            setPanelLayout(null);
            return undefined;
        }

        const updateLayout = () => {
            setPanelLayout(getPanelLayout(triggerRef.current));
        };

        updateLayout();
        window.addEventListener('resize', updateLayout);
        window.addEventListener('scroll', updateLayout, true);

        return () => {
            window.removeEventListener('resize', updateLayout);
            window.removeEventListener('scroll', updateLayout, true);
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        onMarkRead?.(notificationsRef.current.map((item) => item.id));

        const handlePointerDown = (event) => {
            const target = event.target;
            if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
                return;
            }
            setOpen(false);
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [open, onMarkRead]);

    const panel = open && panelLayout ? (
        <div
            ref={panelRef}
            className="app-notifications__panel app-notifications__panel--portal"
            role="dialog"
            aria-label={language === 'ru' ? 'Уведомления' : 'Notifications'}
            style={{
                top: panelLayout.top,
                right: panelLayout.right,
                width: panelLayout.width,
                maxHeight: panelLayout.maxHeight,
            }}
        >
            <div className="app-notifications__panel-glass" aria-hidden="true" />

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
                                className={`app-notifications__item${item.unread === false ? ' app-notifications__item--read' : ''}`}
                                onClick={() => {
                                    setOpen(false);
                                    if (item.action === 'subscription') {
                                        onOpenSubscription?.();
                                    } else if (item.action === 'wallet') {
                                        onOpenWallet?.();
                                    }
                                }}
                            >
                                <span className="app-notifications__item-ico" aria-hidden="true">
                                    <NotificationIcon type={item.type} />
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
                <Bell size={22} />
                {unreadCount ? (
                    <span className="app-notifications__badge" aria-hidden="true">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                ) : null}
            </button>

            {panel && getNotificationsPortalRoot()
                ? createPortal(panel, getNotificationsPortalRoot())
                : null}
        </div>
    );
}
