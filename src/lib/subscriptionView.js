import { formatSubscriptionExpiryDate, formatSubscriptionTimeLeft } from './subscriptionTime.js';

const PAID_PLAN_IDS = new Set(['basic', 'pro', 'max', 'ultra']);

export function normalizeSubscriptionPlanId(raw) {
    const planId = String(raw ?? '').trim().toLowerCase();

    if (['free', 'basic', 'pro', 'max', 'ultra'].includes(planId)) {
        return planId;
    }

    return 'free';
}

/**
 * Builds subscription UI fields from API subscription state or legacy profile fields.
 */
export function deriveSubscriptionView(subscriptionState, text = {}, language = 'ru') {
    const planId = normalizeSubscriptionPlanId(
        subscriptionState?.plan_id
        ?? subscriptionState?.subscriptionPlan
        ?? subscriptionState?.role
        ?? subscriptionState?.subscription?.plan
        ?? subscriptionState?.subscriptionStatus,
    );

    const planNameKeyMap = {
        free: 'planFreeName',
        basic: 'planBasicName',
        pro: 'planProName',
        max: 'planMaxName',
        ultra: 'planUltraName',
    };
    const planNameKey = planNameKeyMap[planId] ?? 'planFreeName';
    const planName = subscriptionState?.plan_name || text[planNameKey] || planId;

    const timeLeftLabel = formatSubscriptionTimeLeft(subscriptionState, language);
    const expiryDateLabel = formatSubscriptionExpiryDate(subscriptionState, language);

    const untilLabel = timeLeftLabel
        || expiryDateLabel
        || String(subscriptionState?.subscriptionUntil ?? subscriptionState?.subscriptionLeft ?? '').trim()
        || (planId === 'free'
            ? (text.profileSubscriptionNoExpiry ?? '—')
            : (text.profileSubscriptionNoExpiry ?? '—'));

    return {
        planId,
        planName,
        planRank: Number(subscriptionState?.plan_rank ?? 0),
        untilLabel,
        timeLeftLabel,
        expiryDateLabel,
        expiresAt: subscriptionState?.expires_at ?? '',
        daysLeft: Number(subscriptionState?.days_left ?? 0),
        hoursLeft: Number(subscriptionState?.hours_left ?? 0),
        isPaid: Boolean(subscriptionState?.is_paid) || PAID_PLAN_IDS.has(planId),
        isActive: subscriptionState?.is_active !== false,
        expiringSoon: Boolean(subscriptionState?.expiring_soon),
        expired: Boolean(subscriptionState?.expired),
    };
}
