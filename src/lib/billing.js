import { resolveApiUrl } from '../api/httpClient.js';
import { BILLING_PLAN_FEATURES_RU } from './planFeatureCopy.js';

export const DEFAULT_COIN_PACKS = [
    { id: 'pack-100', name: '100 монет', coins: 100, price_rub: 99, badge: '', sort_order: 1 },
    { id: 'pack-500', name: '500 монет', coins: 500, price_rub: 449, badge: '−10%', sort_order: 2 },
    { id: 'pack-1000', name: '1000 монет', coins: 1000, price_rub: 799, badge: '−20%', sort_order: 3 },
];

export const DEFAULT_SUBSCRIPTION_PLANS = [
    {
        id: 'free', name: 'Старт', badge: 'Бесплатно', badge_class: 'free',
        price_rub: 0, price_sub: 'навсегда', coins: 10, popular: false, sort_order: 1,
        features: BILLING_PLAN_FEATURES_RU.free,
        locked: BILLING_PLAN_FEATURES_RU.freeLocked,
    },
    {
        id: 'basic', name: 'Базовый', badge: 'Доступный', badge_class: 'basic',
        price_rub: 149, price_sub: '/ месяц', coins: 40, popular: false, sort_order: 2,
        features: BILLING_PLAN_FEATURES_RU.basic,
        locked: BILLING_PLAN_FEATURES_RU.basicLocked,
    },
    {
        id: 'pro', name: 'Про', badge: 'Популярный', badge_class: 'popular',
        price_rub: 349, price_sub: '/ месяц', coins: 100, popular: true, sort_order: 3,
        features: BILLING_PLAN_FEATURES_RU.pro,
        locked: [],
    },
    {
        id: 'max', name: 'Максимум', badge: 'Выгодный', badge_class: 'max',
        price_rub: 799, price_sub: '/ месяц', coins: 250, popular: false, sort_order: 4,
        features: BILLING_PLAN_FEATURES_RU.max,
        locked: [],
    },
    {
        id: 'ultra', name: 'Бизнес', badge: 'Для бизнеса', badge_class: 'biz',
        price_rub: 1999, price_sub: '/ месяц', coins: 600, popular: false, sort_order: 5,
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

function normalizePlan(plan) {
    return {
        ...plan,
        price_rub: Number(plan?.price_rub ?? 0) || 0,
        coins: Number(plan?.coins ?? 0) || 0,
        popular: Boolean(plan?.popular),
        enabled: plan?.enabled !== false,
    };
}

function normalizePack(pack) {
    return {
        ...pack,
        coins: Number(pack?.coins ?? 0) || 0,
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
