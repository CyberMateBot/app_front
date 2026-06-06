const LAYOUT_REF_WIDTH = 390;
const MIN_SCALE_WIDTH = 768;
const MAX_SCALE = 2;

let resizeBound = false;

export function applyUiScale(tg) {
    if (typeof document === 'undefined') {
        return;
    }

    const width = tg?.viewportStableWidth
        || tg?.viewportWidth
        || window.innerWidth
        || LAYOUT_REF_WIDTH;
    const scale = width >= MIN_SCALE_WIDTH
        ? Math.min(Math.max(width / LAYOUT_REF_WIDTH, 1), MAX_SCALE)
        : 1;
    const homeScale = scale <= 1 ? 1 : Math.min(1 + (scale - 1) * 0.65, 1.55);
    const chatScale = scale <= 1 ? 1 : Math.min(1 + (scale - 1) * 0.4, 1.28);
    const headerScale = scale <= 1 ? 1.08 : Math.min(1 + (scale - 1) * 0.75, 1.65);

    const root = document.documentElement;
    root.style.setProperty('--ui-scale', String(scale));
    root.style.setProperty('--home-ui-scale', String(homeScale));
    root.style.setProperty('--chat-ui-scale', String(chatScale));
    root.style.setProperty('--header-ui-scale', String(headerScale));
    root.style.setProperty('--nav-ui-scale', String(scale));
}

export function initUiScale(tg) {
    applyUiScale(tg);

    if (typeof window === 'undefined' || resizeBound) {
        return;
    }

    resizeBound = true;
    window.addEventListener('resize', () => applyUiScale(tg));
}
