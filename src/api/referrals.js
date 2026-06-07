import { errorFromResponse } from './apiError.js';
import { ENABLE_TELEGRAM_MOCK } from '../config/env.js';
import { apiFetch } from './httpClient.js';
import { buildMockReferralLink, buildMockReferralsResponse } from './referrals.mock.js';

/**
 * @typedef {Object} ReferralItem
 * @property {string} [id]
 * @property {string} [telegram_id]
 * @property {string} [username]
 * @property {string} [first_name]
 * @property {string} [last_name]
 * @property {string} [name]
 * @property {number} [bonus]
 * @property {number} [earnings]
 * @property {number} [reward]
 * @property {string} [registered_at]
 */

/**
 * @typedef {Object} ReferralsResponse
 * @property {ReferralItem[]} referrals
 * @property {number} total_count
 */

/**
 * @typedef {Object} ReferralLinkResponse
 * @property {string} referral_link
 */

function normalizeReferralsPayload(payload) {
    const data = payload?.data ?? payload ?? {};
    const referrals = Array.isArray(data.referrals) ? data.referrals : [];
    const totalCount = Number(data.total_count);

    return {
        referrals,
        total_count: Number.isFinite(totalCount) ? totalCount : referrals.length,
    };
}

function shouldUseReferralMock(result) {
    if (!ENABLE_TELEGRAM_MOCK) {
        return false;
    }

    if (!result) {
        return true;
    }

    if (typeof result === 'object' && 'total_count' in result) {
        return result.total_count === 0 && (!result.referrals || result.referrals.length === 0);
    }

    return false;
}

/**
 * @param {string | number} telegramId
 * @returns {Promise<ReferralLinkResponse | null>}
 */
export async function fetchReferralLink(telegramId) {
    const id = String(telegramId ?? '').trim();

    if (!id) {
        throw new Error('Telegram user id is required.');
    }

    if (ENABLE_TELEGRAM_MOCK) {
        try {
            const res = await apiFetch(`/v1/users/telegram/${id}/referral-link`, {
                headers: { Accept: 'application/json' },
            });

            if (res.ok) {
                const payload = await res.json();
                const referralLink = payload?.referral_link ?? payload?.data?.referral_link ?? '';

                if (referralLink) {
                    return { referral_link: String(referralLink) };
                }
            }
        } catch {
            // Fall back to demo link in local mock mode.
        }

        return buildMockReferralLink(id);
    }

    const res = await apiFetch(`/v1/users/telegram/${id}/referral-link`, {
        headers: { Accept: 'application/json' },
    });

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to load referral link.');
    }

    const payload = await res.json();
    const referralLink = payload?.referral_link ?? payload?.data?.referral_link ?? '';

    if (!referralLink) {
        throw new Error('Referral link is not available.');
    }

    return { referral_link: String(referralLink) };
}

/**
 * @param {string | number} telegramId
 * @returns {Promise<ReferralsResponse>}
 */
export async function fetchReferrals(telegramId) {
    const id = String(telegramId ?? '').trim();

    if (!id) {
        throw new Error('Telegram user id is required.');
    }

    if (ENABLE_TELEGRAM_MOCK) {
        try {
            const res = await apiFetch(`/v1/users/telegram/${id}/referrals`, {
                headers: { Accept: 'application/json' },
            });

            if (res.ok) {
                const payload = await res.json();
                const normalized = normalizeReferralsPayload(payload);

                if (!shouldUseReferralMock(normalized)) {
                    return normalized;
                }
            }
        } catch {
            // Fall back to demo list in local mock mode.
        }

        return buildMockReferralsResponse();
    }

    const res = await apiFetch(`/v1/users/telegram/${id}/referrals`, {
        headers: { Accept: 'application/json' },
    });

    if (res.status === 404) {
        return { referrals: [], total_count: 0 };
    }

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to load referrals.');
    }

    const payload = await res.json();
    return normalizeReferralsPayload(payload);
}
