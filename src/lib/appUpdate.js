const BUILD_META_URL = '/build-meta.json';
const STORAGE_KEY = 'cybermate:active-build-id';

function readDomBuildId() {
    if (typeof document === 'undefined') {
        return '';
    }

    return document.querySelector('meta[name="cm-build-id"]')?.content?.trim() || '';
}

export function getActiveBuildId() {
    if (typeof window === 'undefined') {
        return '';
    }

    return window.sessionStorage.getItem(STORAGE_KEY) || readDomBuildId();
}

export function rememberActiveBuildId(buildId) {
    if (!buildId || typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, buildId);
}

export async function fetchLatestBuildId() {
    const url = `${BUILD_META_URL}?t=${Date.now()}`;
    const response = await fetch(url, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        return null;
    }

    const payload = await response.json();
    return String(payload?.buildId || '').trim() || null;
}

export async function checkForAppUpdate({ reload = true } = {}) {
    const current = getActiveBuildId();
    const latest = await fetchLatestBuildId();

    if (!latest || !current || latest === current) {
        return false;
    }

    rememberActiveBuildId(latest);

    if (reload) {
        window.location.reload();
    }

    return true;
}

export function initAppUpdateWatcher() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    const domBuildId = readDomBuildId();

    if (domBuildId) {
        rememberActiveBuildId(domBuildId);
    }

    const runCheck = () => {
        checkForAppUpdate().catch(() => {
            // Network hiccups should not break the app.
        });
    };

    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            runCheck();
        }
    });

    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            runCheck();
        }
    });

    window.addEventListener('focus', runCheck);

    const intervalId = window.setInterval(runCheck, 3 * 60 * 1000);

    return () => {
        window.clearInterval(intervalId);
    };
}
