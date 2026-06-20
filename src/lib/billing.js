import { resolveApiUrl } from '../api/httpClient.js';

export const DEFAULT_COIN_PACKS = [
    { id: 'pack-100', name: '100 монет', coins: 100, price_rub: 99, badge: '', sort_order: 1 },
    { id: 'pack-500', name: '500 монет', coins: 500, price_rub: 449, badge: '−10%', sort_order: 2 },
    { id: 'pack-1000', name: '1000 монет', coins: 1000, price_rub: 799, badge: '−20%', sort_order: 3 },
];

export const DEFAULT_SUBSCRIPTION_PLANS = [
    {
        id: 'free', name: 'Старт', badge: 'Бесплатно', badge_class: 'free',
        price_rub: 0, price_sub: 'навсегда', coins: 50, popular: false, sort_order: 1,
        features: ['50 монет / месяц', 'Базовые чат-модели', '10 изображений (FLUX)', 'TTS (базовый)'],
        locked: ['Видео и музыка — нет', 'Премиум модели — нет'],
    },
    {
        id: 'basic', name: 'Базовый', badge: 'Доступный', badge_class: 'basic',
        price_rub: 149, price_sub: '/ месяц', coins: 250, popular: false, sort_order: 2,
        features: ['250 монет / месяц', 'Все fast-модели', '25 изображений HD', '3 видео (Kling Std)', 'Музыка и озвучка'],
        locked: [],
    },
    {
        id: 'pro', name: 'Про', badge: 'Популярный', badge_class: 'popular',
        price_rub: 349, price_sub: '/ месяц', coins: 700, popular: true, sort_order: 3,
        features: ['700 монет / месяц', 'Claude, Gemini, GPT-5.4', '35 изображений (GPT Image 2)', '8 видео (Kling/Seedance)', 'Музыка + 3D', 'Приоритетная очередь'],
        locked: [],
    },
    {
        id: 'max', name: 'Максимум', badge: 'Выгодный', badge_class: 'max',
        price_rub: 799, price_sub: '/ месяц', coins: 2000, popular: false, sort_order: 4,
        features: ['2000 монет / месяц', 'Все PRO модели', '100 изображений (4K)', '25 видео HD', 'Все инструменты', 'Перенос 20% монет'],
        locked: [],
    },
    {
        id: 'ultra', name: 'Бизнес', badge: 'Для бизнеса', badge_class: 'biz',
        price_rub: 1999, price_sub: '/ месяц', coins: 6000, popular: false, sort_order: 5,
        features: ['6000 монет / месяц', 'Claude Opus, o3 и всё', '300+ изображений', '75 видео 4K', 'API доступ', 'Перенос 50% монет'],
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
