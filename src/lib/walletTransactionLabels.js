function humanizeToken(value) {
    return String(value || '')
        .split(/[-_]/g)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export function formatWalletTransactionReason(reason, {
    language = 'ru',
    planNameResolver = (id) => humanizeToken(id),
    packNameResolver = (id) => humanizeToken(id),
    modelLabelResolver = (id) => humanizeToken(id),
} = {}) {
    const raw = String(reason || '').trim();
    if (!raw) {
        return language === 'ru' ? 'Операция с балансом' : 'Balance operation';
    }

    if (raw === 'registration_bonus') {
        return language === 'ru' ? 'Бонус за регистрацию' : 'Registration bonus';
    }
    if (raw === 'referral_bonus') {
        return language === 'ru' ? 'Реферальный бонус' : 'Referral bonus';
    }

    let match;

    if ((match = raw.match(/^generation:(.+)$/i))) {
        const model = modelLabelResolver(match[1]);
        return language === 'ru' ? `Генерация · ${model}` : `Generation · ${model}`;
    }
    if ((match = raw.match(/^subscription:(.+)$/i))) {
        const plan = planNameResolver(match[1]);
        return language === 'ru' ? `Начисление по подписке · ${plan}` : `Subscription credit · ${plan}`;
    }
    if ((match = raw.match(/^yookassa:pack:(.+)$/i))) {
        const pack = packNameResolver(match[1]);
        return language === 'ru' ? `Покупка монет · ${pack}` : `Coin pack · ${pack}`;
    }
    if ((match = raw.match(/^yookassa:subscription:(.+)$/i))) {
        const plan = planNameResolver(match[1]);
        return language === 'ru' ? `Оплата подписки · ${plan}` : `Subscription payment · ${plan}`;
    }

    if (/^[a-z0-9_:-]+$/i.test(raw) && (raw.includes('_') || raw.includes(':'))) {
        return humanizeToken(raw.replace(/:/g, ' '));
    }

    return raw;
}
