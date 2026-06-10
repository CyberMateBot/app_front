export async function downloadMediaUrl(url, filename = 'cybermate-media') {
    const trimmed = String(url || '').trim();
    if (!trimmed) {
        throw new Error('No media URL to download.');
    }

    try {
        const response = await fetch(trimmed);
        if (!response.ok) {
            throw new Error('Download failed.');
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = filename;
        anchor.rel = 'noopener';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
    } catch {
        const anchor = document.createElement('a');
        anchor.href = trimmed;
        anchor.download = filename;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }
}

export function guessMediaFilename(url, fallbackBase = 'cybermate') {
    const trimmed = String(url || '').trim();
    const path = trimmed.split('?')[0] || '';
    const extMatch = path.match(/\.([a-z0-9]{2,5})$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'bin';
    return `${fallbackBase}.${ext}`;
}
