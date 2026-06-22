import { resolveApiUrl } from '../api/httpClient.js';

export const DEFAULT_COIN_PACKS = [
    { id: 'pack-100', name: '100 монет', coins: 100, price_rub: 99, badge: '', sort_order: 1 },
    { id: 'pack-500', name: '500 монет', coins: 500, price_rub: 449, badge: '−10%', sort_order: 2 },
    { id: 'pack-1000', name: '1000 монет', coins: 1000, price_rub: 799, badge: '−20%', sort_order: 3 },
];

export const DEFAULT_SUBSCRIPTION_PLANS = [
    {
        id: 'free', name: 'Старт', badge: 'Бесплатно', badge_class: 'free',
        price_rub: 0, price_sub: 'навсегда', coins: 10, popular: false, sort_order: 1,
        features: ['10 монет / месяц', '3 базовые чат-модели', 'FLUX (картинки)', 'Озвучка (базовая)'],
        locked: ['Видео — нет', '3D — нет', 'Премиум модели — нет'],
    },
    {
        id: 'basic', name: 'Базовый', badge: 'Доступный', badge_class: 'basic',
        price_rub: 149, price_sub: '/ месяц', coins: 40, popular: false, sort_order: 2,
        features: ['40 монет / месяц', 'Fast-модели + GPT-4o mini', 'Alice AI, Nano Banana', 'Kling Standard', 'ElevenLabs, 3D rapid'],
        locked: ['Pro/Max видео и 3D — нет'],
    },
    {
        id: 'pro', name: 'Про', badge: 'Популярный', badge_class: 'popular',
        price_rub: 349, price_sub: '/ месяц', coins: 100, popular: true, sort_order: 3,
        features: ['100 монет / месяц', 'Claude Sonnet, GPT-5.4', 'GPT Image 2', 'Kling Pro, Seedance', 'Mureka, Tripo 3D'],
        locked: [],
    },
    {
        id: 'max', name: 'Максимум', badge: 'Выгодный', badge_class: 'max',
        price_rub: 799, price_sub: '/ месяц', coins: 250, popular: false, sort_order: 4,
        features: ['250 монет / месяц', 'GPT-4o, Gemini 2.5 Pro', 'Claude Opus 4.7', 'Kling 4K', 'Rodin 3D'],
        locked: [],
    },
    {
        id: 'ultra', name: 'Бизнес', badge: 'Для бизнеса', badge_class: 'biz',
        price_rub: 1999, price_sub: '/ месяц', coins: 600, popular: false, sort_order: 5,
        features: ['600 монет / месяц', 'Все модели', 'Claude Opus 4.8, o1', 'Максимальный приоритет'],
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
    return {
        coinRateRub: Number(payload?.coin_rate_rub ?? 1) || 1,
        plans: Array.isArray(payload?.plans) && payload.plans.length
            ? payload.plans
            : DEFAULT_SUBSCRIPTION_PLANS,
        coinPacks: Array.isArray(payload?.coin_packs) && payload.coin_packs.length
            ? payload.coin_packs
            : DEFAULT_COIN_PACKS,
    };
}

export function getFallbackBillingCatalog() {
    return {
        coinRateRub: 1,
        plans: DEFAULT_SUBSCRIPTION_PLANS,
        coinPacks: DEFAULT_COIN_PACKS,
    };
}
