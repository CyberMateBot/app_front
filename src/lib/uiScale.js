const LAYOUT_REF_WIDTH = 390;
const MIN_SCALE_WIDTH = 768;
const MAX_SCALE = 1.12;

let resizeBound = false;

export function applyUiScale(tg) {
    if (typeof document === 'undefined') {
        return;
    }

    const root = document.documentElement;
    const layoutMode = root.dataset.tgLayout ?? '';
    const width = tg?.viewportStableWidth
        || tg?.viewportWidth
        || window.innerWidth
        || LAYOUT_REF_WIDTH;

    if (layoutMode === 'mini-pc') {
        root.style.setProperty('--ui-scale', '1');
        root.style.setProperty('--home-ui-scale', '1');
        root.style.setProperty('--chat-ui-scale', '1');
        root.style.setProperty('--header-ui-scale', '1');
        root.style.setProperty('--nav-ui-scale', '1');
        return;
    }

    const effectiveWidth = layoutMode === 'desktop-full'
        ? Math.max(width, window.innerWidth || width)
        : width;
    const scale = effectiveWidth >= MIN_SCALE_WIDTH
        ? Math.min(Math.max(effectiveWidth / LAYOUT_REF_WIDTH, 1), MAX_SCALE)
        : 1;
    const homeScale = scale <= 1 ? 1 : Math.min(1 + (scale - 1) * 0.3, 1.1);
    const chatScale = scale <= 1 ? 1 : Math.min(1 + (scale - 1) * 0.2, 1.08);
    const headerScale = scale <= 1 ? 1 : Math.min(1 + (scale - 1) * 0.35, 1.12);

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
