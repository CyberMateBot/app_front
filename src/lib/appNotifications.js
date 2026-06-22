const READ_STORAGE_KEY = 'cm-app-notifications-read';

const RECENT_SUBSCRIPTION_MS = 14 * 24 * 60 * 60 * 1000;
const RECENT_WALLET_TX_MS = 30 * 24 * 60 * 60 * 1000;

function readStorageIds() {
    if (typeof window === 'undefined') {
        return new Set();
    }

    try {
        const raw = window.localStorage.getItem(READ_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
        return new Set();
    }
}

export function loadReadNotificationIds() {
    return readStorageIds();
}

export function markNotificationsRead(ids = []) {
    const next = readStorageIds();
    ids.forEach((id) => next.add(String(id)));

    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...next]));
        } catch {
            // Ignore storage quota issues.
        }
    }

    return next;
}

export function applyReadState(items = [], readIds = readStorageIds()) {
    return items.map((item) => ({
        ...item,
        unread: !readIds.has(String(item.id)),
    }));
}

function planNameFromSubscription(subscription, text = {}) {
    const planId = String(subscription?.plan_id ?? 'free');
    const planKey = `plan${planId.charAt(0).toUpperCase()}${planId.slice(1)}Name`;
    return subscription?.plan_name || text[planKey] || planId;
}

function isRecentTimestamp(value, maxAgeMs) {
    const parsed = Date.parse(String(value ?? ''));
    if (Number.isNaN(parsed)) {
        return false;
    }

    return Date.now() - parsed <= maxAgeMs;
}

function walletTransactionId(tx, index) {
    return String(
        tx?.id
        ?? tx?.transaction_id
        ?? `${tx?.type ?? 'tx'}-${tx?.created_at ?? tx?.date ?? index}`,
    );
}

function walletTransactionTimestamp(tx) {
    return tx?.created_at ?? tx?.date ?? tx?.timestamp ?? '';
}

function isSubscriptionWalletTransaction(tx) {
    const haystack = `${tx?.type ?? ''} ${tx?.description ?? ''} ${tx?.reason ?? ''}`.toLowerCase();
    return haystack.includes('subscription')
        || haystack.includes('подписк')
        || haystack.includes('plan');
}

function buildWalletNotifications(walletTransactions = [], language = 'ru') {
    const items = [];

    walletTransactions.forEach((tx, index) => {
        const timestamp = walletTransactionTimestamp(tx);
        if (timestamp && !isRecentTimestamp(timestamp, RECENT_WALLET_TX_MS)) {
            return;
        }

        const amount = Number(tx?.amount ?? 0);
        const description = String(tx?.description ?? tx?.reason ?? '').trim();
        const id = `wallet-${walletTransactionId(tx, index)}`;

        if (amount > 0) {
            items.push({
                id,
                type: 'coins',
                title: language === 'ru' ? 'Начисление коинов' : 'Coins credited',
                message: description
                    || (language === 'ru'
                        ? `На баланс зачислено +${amount} коинов.`
                        : `+${amount} coins were added to your balance.`),
                action: 'wallet',
                unread: true,
            });
            return;
        }

        if (amount < 0 && isSubscriptionWalletTransaction(tx)) {
            items.push({
                id,
                type: 'subscription-purchase',
                title: language === 'ru' ? 'Покупка подписки' : 'Subscription purchase',
                message: description
                    || (language === 'ru'
                        ? 'Подписка успешно оформлена.'
                        : 'Your subscription purchase was successful.'),
                action: 'subscription',
                unread: true,
            });
        }
    });

    return items;
}

export function buildAppNotifications({
    subscription = null,
    walletTransactions = [],
    text = {},
    language = 'ru',
} = {}) {
    const items = [];

    if (subscription) {
        const planName = planNameFromSubscription(subscription, text);

        if (subscription.expired) {
            items.push({
                id: 'subscription-expired',
                type: 'subscription',
                title: language === 'ru' ? 'Подписка истекла' : 'Subscription expired',
                message: language === 'ru'
                    ? `План «${planName}» закончился. Доступ к премиум-моделям ограничен.`
                    : `Your "${planName}" plan has ended. Premium models are locked.`,
                action: 'subscription',
                unread: true,
            });
        } else if (subscription.expiring_soon && subscription.is_paid) {
            const days = subscription.days_left ?? 0;
            items.push({
                id: 'subscription-expiring',
                type: 'subscription',
                title: language === 'ru' ? 'Подписка скоро закончится' : 'Subscription expiring soon',
                message: language === 'ru'
                    ? `План «${planName}» активен ещё ${days} дн. Продлите, чтобы не потерять доступ к моделям.`
                    : `"${planName}" expires in ${days} days. Renew to keep model access.`,
                action: 'subscription',
                unread: true,
            });
        }

        if (
            subscription.is_paid
            && subscription.started_at
            && isRecentTimestamp(subscription.started_at, RECENT_SUBSCRIPTION_MS)
        ) {
            items.push({
                id: `subscription-started-${subscription.plan_id}-${subscription.started_at}`,
                type: 'subscription-purchase',
                title: language === 'ru' ? 'Подписка оформлена' : 'Subscription activated',
                message: language === 'ru'
                    ? `План «${planName}» активен. Доступны модели и коины по тарифу.`
                    : `Your "${planName}" plan is active. Plan models and coins are unlocked.`,
                action: 'subscription',
                unread: true,
            });
        }
    }

    items.push(...buildWalletNotifications(walletTransactions, language));

    return items;
}
