import { resolveApiUrl } from '../api/httpClient.js';

export const HOME_SOCIAL_LINKS = {
    tiktok: 'https://www.tiktok.com/@cybermate',
    instagram: 'https://www.instagram.com/cybermate',
};

export function mapHomeWidgetToSlide(widget) {
    return {
        id: String(widget.id),
        tag: widget.tag_text ?? '',
        tagBg: widget.tag_bg || 'rgba(60,200,100,0.85)',
        tagColor: widget.tag_color || '#06291a',
        title: widget.title ?? '',
        description: widget.description ?? '',
        background: widget.background_style || 'linear-gradient(135deg,#1a1030,#2a1840)',
        imageUrl: widget.image_url || '',
    };
}

export async function fetchHomeWidgets() {
    const response = await fetch(resolveApiUrl('/v1/home/widgets'));
    if (!response.ok) {
        throw new Error(`home widgets ${response.status}`);
    }
    const payload = await response.json();
    const items = Array.isArray(payload?.data) ? payload.data : [];
    return items.map(mapHomeWidgetToSlide);
}

export function getHomeNewsSlides(text) {
    return [
        {
            id: 'seedance',
            tag: text.homeNews1Tag,
            tagBg: 'rgba(60,200,100,0.85)',
            tagColor: '#06291a',
            title: text.homeNews1Title,
            description: text.homeNews1Desc,
            background: 'linear-gradient(135deg,#1a1030,#2a1840)',
        },
        {
            id: 'promo',
            tag: text.homeNews2Tag,
            tagBg: 'rgba(255,150,50,0.85)',
            tagColor: '#2b1502',
            title: text.homeNews2Title,
            description: text.homeNews2Desc,
            background: 'linear-gradient(135deg,#301a10,#402010)',
        },
        {
            id: 'speed',
            tag: text.homeNews3Tag,
            tagBg: 'rgba(80,160,255,0.85)',
            tagColor: '#031530',
            title: text.homeNews3Title,
            description: text.homeNews3Desc,
            background: 'linear-gradient(135deg,#101830,#102040)',
        },
    ];
}

export function formatRelativeTime(value, language = 'ru') {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();

    if (Number.isNaN(date.getTime()) || diffMs < 0) {
        return '';
    }

    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) {
        return language === 'ru' ? 'только что' : 'just now';
    }
    if (minutes < 60) {
        return language === 'ru' ? `${minutes} мин назад` : `${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return language === 'ru' ? `${hours} ч назад` : `${hours} h ago`;
    }

    const days = Math.floor(hours / 24);
    return language === 'ru' ? `${days} д назад` : `${days} d ago`;
}

export function openExternalLink(url) {
    if (!url) {
        return;
    }

    const tg = window.Telegram?.WebApp;
    if (tg?.openLink) {
        tg.openLink(url);
        return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
}
