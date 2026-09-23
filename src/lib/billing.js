import { resolveApiUrl } from '../api/httpClient.js';
import { BILLING_PLAN_FEATURES_RU } from './planFeatureCopy.js';

export const DEFAULT_COIN_PACKS = [
    { id: 'pack-100', name: 'Пакет «Старт»', coins: 100, price_rub: 129, badge: '', sort_order: 1 },
    { id: 'pack-300', name: 'Пакет «Стандарт»', coins: 300, price_rub: 349, badge: '−10%', sort_order: 2 },
    { id: 'pack-1000', name: 'Пакет «Оптимум»', coins: 1000, price_rub: 1049, badge: '−18%', sort_order: 3 },
    { id: 'pack-2500', name: 'Пакет «Макси»', coins: 2500, price_rub: 2399, badge: '−26%', sort_order: 4 },
];

export const COIN_PACK_DISPLAY_NAMES = {
    ru: {
        'pack-100': 'Пакет «Старт»',
        'pack-300': 'Пакет «Стандарт»',
        'pack-1000': 'Пакет «Оптимум»',
        'pack-2500': 'Пакет «Макси»',
    },
    en: {
        'pack-100': 'Starter Pack',
        'pack-300': 'Standard Pack',
        'pack-1000': 'Optimum Pack',
        'pack-2500': 'Maxi Pack',
    },
};

export function getCoinPackDisplayName(pack, language = 'ru') {
    const lang = language === 'en' ? 'en' : 'ru';
    if (pack?.id && COIN_PACK_DISPLAY_NAMES[lang]?.[pack.id]) {
        return COIN_PACK_DISPLAY_NAMES[lang][pack.id];
    }
    const rawName = String(pack?.name ?? '').trim();
    if (!rawName || /^\d+\s*(монет[а-я]*|coins?|cybercoins?)$/i.test(rawName)) {
        return lang === 'en' ? 'Coin Pack' : 'Пакет монет';
    }
    return rawName;
}

export const DEFAULT_SUBSCRIPTION_PLANS = [
    {
        id: 'free', name: 'Старт', badge: 'Бесплатно', badge_class: 'free',
        price_rub: 0, price_sub: 'навсегда', coins: 15, popular: false, sort_order: 1,
        features: BILLING_PLAN_FEATURES_RU.free,
        locked: BILLING_PLAN_FEATURES_RU.freeLocked,
    },
    {
        id: 'basic', name: 'Базовый', badge: 'Доступный', badge_class: 'basic',
        price_rub: 149, price_sub: '/ месяц', coins: 160, popular: false, sort_order: 2,
        features: BILLING_PLAN_FEATURES_RU.basic,
        locked: BILLING_PLAN_FEATURES_RU.basicLocked,
    },
    {
        id: 'pro', name: 'Про', badge: 'Популярный', badge_class: 'popular',
        price_rub: 349, price_sub: '/ месяц', coins: 400, popular: true, sort_order: 3,
        features: BILLING_PLAN_FEATURES_RU.pro,
        locked: [],
    },
    {
        id: 'max', name: 'Максимум', badge: 'Выгодный', badge_class: 'max',
        price_rub: 799, price_sub: '/ месяц', coins: 950, popular: false, sort_order: 4,
        features: BILLING_PLAN_FEATURES_RU.max,
        locked: [],
    },
    {
        id: 'ultra', name: 'Бизнес', badge: 'Для бизнеса', badge_class: 'biz',
        price_rub: 1999, price_sub: '/ месяц', coins: 2600, popular: false, sort_order: 5,
        features: BILLING_PLAN_FEATURES_RU.ultra,
        locked: [],
    },
];

export function formatPlanPrice(priceRub, language = 'ru') {
    if (!priceRub) {
        return language === 'ru' ? '0 ₽' : '0 ₽';
    }
    return `${new Intl.NumberFormat('ru-RU').format(priceRub)} ₽`;
}

export function formatPackPrice(priceRub) {
    return `${new Intl.NumberFormat('ru-RU').format(priceRub)} ₽`;
}

export async function fetchBillingCatalog() {
    const response = await fetch(resolveApiUrl('/v1/billing/catalog'));
    if (!response.ok) {
        throw new Error(`billing catalog ${response.status}`);
    }
    const payload = await response.json();
    const plans = Array.isArray(payload?.plans) ? payload.plans.map(normalizePlan) : [];
    const coinPacks = Array.isArray(payload?.coin_packs) ? payload.coin_packs.map(normalizePack) : [];
    return {
        coinRateRub: Number(payload?.coin_rate_rub ?? 1) || 1,
        plans: plans.length ? plans : DEFAULT_SUBSCRIPTION_PLANS,
        coinPacks: coinPacks.length ? coinPacks : DEFAULT_COIN_PACKS,
    };
}

const DEFAULT_PLAN_COINS = {
    free: 15,
    basic: 160,
    pro: 400,
    max: 950,
    ultra: 2600,
};

function normalizePlan(plan) {
    const defaultCoins = DEFAULT_PLAN_COINS[plan?.id] ?? 0;
    const planCoins = Number(plan?.coins ?? 0) || 0;
    return {
        ...plan,
        price_rub: Number(plan?.price_rub ?? 0) || 0,
        coins: Math.max(planCoins, defaultCoins),
        popular: Boolean(plan?.popular),
        enabled: plan?.enabled !== false,
    };
}

const DEFAULT_PACK_COINS = {
    'pack-100': 100,
    'pack-300': 300,
    'pack-1000': 1000,
    'pack-2500': 2500,
};

function normalizePack(pack) {
    const defaultCoins = DEFAULT_PACK_COINS[pack?.id] ?? 0;
    const packCoins = Number(pack?.coins ?? 0) || 0;
    return {
        ...pack,
        coins: Math.max(packCoins, defaultCoins),
        price_rub: Number(pack?.price_rub ?? 0) || 0,
        enabled: pack?.enabled !== false,
    };
}

export function getFallbackBillingCatalog() {
    return {
        coinRateRub: 1,
        plans: DEFAULT_SUBSCRIPTION_PLANS,
        coinPacks: DEFAULT_COIN_PACKS,
    };
}
