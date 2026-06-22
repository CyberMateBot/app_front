export function formatSubscriptionTimeLeft(subscription, language = 'ru') {
    if (!subscription?.is_paid) {
        return '';
    }

    if (subscription.no_expiry || !subscription.expires_at) {
        return language === 'ru' ? 'Без срока' : 'No expiry';
    }

    const days = Number(subscription.days_left ?? 0);
    const hours = Number(subscription.hours_left ?? 0);

    if (days > 1) {
        return language === 'ru' ? `Осталось ${days} дн.` : `${days} days left`;
    }
    if (days === 1) {
        return language === 'ru' ? 'Остался 1 день' : '1 day left';
    }
    if (hours > 1) {
        return language === 'ru' ? `Осталось ${hours} ч.` : `${hours} hours left`;
    }
    if (hours === 1) {
        return language === 'ru' ? 'Остался 1 час' : '1 hour left';
    }

    return language === 'ru' ? 'Истекает сегодня' : 'Expires today';
}

export function formatSubscriptionExpiryDate(subscription, language = 'ru') {
    if (!subscription?.expires_at) {
        return '';
    }

    try {
        const date = new Date(subscription.expires_at);
        return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return subscription.expires_at;
    }
}
