import { BOT_USERNAME } from '../config/env.js';

/** @returns {import('./referrals.js').ReferralLinkResponse} */
export function buildMockReferralLink(telegramId) {
    const id = String(telegramId ?? '777000').trim() || '777000';

    return {
        referral_link: `https://t.me/${BOT_USERNAME}?startapp=ref_${id}`,
    };
}

/** @returns {import('./referrals.js').ReferralsResponse} */
export function buildMockReferralsResponse() {
    return {
        referrals: [
            {
                id: 'mock-1',
                telegram_id: '910001',
                username: 'alex_ai',
                first_name: 'Алексей',
                bonus: 300,
                registered_at: '2026-05-20T12:00:00Z',
            },
            {
                id: 'mock-2',
                telegram_id: '910002',
                username: 'maria_design',
                first_name: 'Мария',
                bonus: 300,
                registered_at: '2026-05-18T09:30:00Z',
            },
            {
                id: 'mock-3',
                telegram_id: '910003',
                first_name: 'Иван',
                last_name: 'Петров',
                bonus: 150,
                registered_at: '2026-05-12T18:45:00Z',
            },
        ],
        total_count: 3,
    };
}
