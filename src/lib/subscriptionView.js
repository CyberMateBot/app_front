const PAID_PLAN_IDS = new Set(['pro', 'ultra']);

export function normalizeSubscriptionPlanId(raw) {
    const planId = String(raw ?? '').trim().toLowerCase();

    if (planId === 'pro' || planId === 'ultra' || planId === 'free') {
        return planId;
    }

    return 'free';
}

/**
 * Builds subscription UI fields from API profile (no hardcoded Premium/Pro mocks).
 */
export function deriveSubscriptionView(profile, text = {}) {
    const planId = normalizeSubscriptionPlanId(
        profile?.subscriptionPlan
        ?? profile?.role
        ?? profile?.subscription?.plan
        ?? profile?.subscriptionStatus,
    );

    const planNameKey = planId === 'pro'
        ? 'planProName'
        : planId === 'ultra'
            ? 'planUltraName'
            : 'planFreeName';

    const planName = text[planNameKey] ?? planId;

    const untilRaw = profile?.subscriptionUntil
        ?? profile?.subscriptionLeft
        ?? profile?.subscriptionSince
        ?? profile?.subscription?.until
        ?? '';

    const untilLabel = String(untilRaw || '').trim()
        || (planId === 'free'
            ? (text.profileSubscriptionNoExpiry ?? '—')
            : (text.profileSubscriptionNoExpiry ?? '—'));

    return {
        planId,
        planName,
        untilLabel,
        isPaid: PAID_PLAN_IDS.has(planId),
    };
}
