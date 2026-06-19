function pickFiniteNumber(...values) {
    for (const value of values) {
        const number = Number(value);

        if (Number.isFinite(number)) {
            return number;
        }
    }

    return null;
}

/**
 * @param {unknown} walletPayload
 * @param {unknown} [profile]
 * @returns {number}
 */
export function resolveGenerationTokenBalance(walletPayload, profile) {
    const wallet = walletPayload?.wallet ?? walletPayload ?? {};
    const profileData = profile ?? {};

    return pickFiniteNumber(
        wallet.tokens,
        wallet.token_balance,
        wallet.tokenBalance,
        wallet.ai_tokens,
        wallet.generation_tokens,
        profileData.tokens,
        profileData.token_balance,
        profileData.tokenBalance,
        wallet.balance,
        wallet.balance_available,
        wallet.balanceAvailable,
        profileData.balance,
        profileData.coins,
        profileData.points,
    ) ?? 0;
}

/**
 * @param {unknown} payload
 * @returns {{ wallet: Record<string, unknown>, transactions: unknown[] }}
 */
export function normalizeWalletResponse(payload) {
    const data = payload?.data ?? payload ?? {};
    const wallet = data.wallet ?? data ?? {};
    const tokens = resolveGenerationTokenBalance({ wallet }, null);
    const balance = pickFiniteNumber(
        wallet.balance,
        wallet.coins,
        wallet.cyber_coins,
        tokens,
    ) ?? 0;

    return {
        wallet: {
            ...wallet,
            tokens,
            balance,
            balanceAvailable: pickFiniteNumber(
                wallet.balance_available,
                wallet.balanceAvailable,
                tokens,
                balance,
            ) ?? balance,
        },
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
    };
}
