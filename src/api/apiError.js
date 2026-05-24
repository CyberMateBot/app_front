/**
 * @param {Response} res
 * @returns {Promise<Error & { code?: string }>}
 */
export async function errorFromResponse(res, fallbackMessage) {
    const raw = await res.text();
    let message = fallbackMessage;
    let code;

    try {
        const payload = JSON.parse(raw);
        if (payload?.message) {
            message = payload.message;
        }
        if (payload?.code) {
            code = payload.code;
        }
    } catch {
        if (raw) {
            message = raw;
        }
    }

    const err = new Error(message);
    if (code) {
        err.code = code;
    }
    return err;
}
