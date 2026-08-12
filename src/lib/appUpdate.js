const BUILD_META_URL = '/build-meta.json';
const BUILD_PARAM = 'cm_b';
const STORAGE_KEY = 'cybermate:active-build-id';

function readDomBuildId() {
    if (typeof document === 'undefined') {
        return '';
    }

    return document.querySelector('meta[name="cm-build-id"]')?.content?.trim() || '';
}

function readUrlBuildId() {
    if (typeof window === 'undefined') {
        return '';
    }

    try {
        return new URL(window.location.href).searchParams.get(BUILD_PARAM)?.trim() || '';
    } catch {
        return '';
    }
}

export function getActiveBuildId() {
    if (typeof window === 'undefined') {
        return '';
    }

    return readUrlBuildId()
        || window.sessionStorage.getItem(STORAGE_KEY)
        || readDomBuildId();
}

export function rememberActiveBuildId(buildId) {
    if (!buildId || typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, buildId);
}

export function replaceUrlWithBuildId(buildId) {
    if (!buildId || typeof window === 'undefined') {
        return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set(BUILD_PARAM, buildId);
    url.searchParams.set('cm_t', String(Date.now()));
    window.location.replace(url.toString());
}

export async function fetchLatestBuildId() {
    const url = `${BUILD_META_URL}?t=${Date.now()}`;
    const response = await fetch(url, {
        cache: 'no-store',
        headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
        },
    });

    if (!response.ok) {
        return null;
    }

    const payload = await response.json();
    return String(payload?.buildId || '').trim() || null;
}

export async function checkForAppUpdate({ reload = true } = {}) {
    const domBuildId = readDomBuildId();
    const latest = await fetchLatestBuildId();

    if (!latest) {
        return false;
    }

    const current = domBuildId || getActiveBuildId();

    if (current && latest === current) {
        rememberActiveBuildId(latest);
        return false;
    }

    rememberActiveBuildId(latest);

    if (reload) {
        replaceUrlWithBuildId(latest);
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

    runCheck();

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

    const intervalId = window.setInterval(runCheck, 60 * 1000);

    return () => {
        window.clearInterval(intervalId);
    };
}
