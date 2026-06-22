export function buildAppNotifications(subscription, text = {}, language = 'ru') {
    const items = [];
    if (!subscription) {
        return items;
    }

    const planName = subscription.plan_name
        || text[`plan${String(subscription.plan_id ?? 'free').replace(/^./, (c) => c.toUpperCase())}Name`]
        || subscription.plan_id;

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

    return items;
}
