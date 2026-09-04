import { describe, expect, it } from 'vitest';
import { extractHtmlFromChat, guessHtmlFilename, wrapHtmlDocument } from './chatHtml.js';

describe('extractHtmlFromChat', () => {
    it('returns null for plain text', () => {
        expect(extractHtmlFromChat('Hello, how can I help you today?')).toBeNull();
    });

    it('returns null for empty/nullish content', () => {
        expect(extractHtmlFromChat('')).toBeNull();
        expect(extractHtmlFromChat(null)).toBeNull();
        expect(extractHtmlFromChat(undefined)).toBeNull();
    });

    it('extracts an ```html fenced block and wraps it as a full document', () => {
        const content = [
            'Here is your page:',
            '```html',
            '<h1>Hello</h1><p>World</p>',
            '```',
        ].join('\n');

        const html = extractHtmlFromChat(content);
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<h1>Hello</h1><p>World</p>');
    });

    it('does not re-wrap a fenced block that is already a full document', () => {
        const content = [
            '```html',
            '<!DOCTYPE html><html><head><title>T</title></head><body>hi</body></html>',
            '```',
        ].join('\n');

        const html = extractHtmlFromChat(content);
        const doctypeMatches = html.match(/<!DOCTYPE html>/gi) || [];
        expect(doctypeMatches).toHaveLength(1);
    });

    it('picks the largest block when multiple html fences are present', () => {
        const small = '<div>small</div>';
        const large = '<div>' + 'x'.repeat(200) + '</div>';
        const content = [
            '```html',
            small,
            '```',
            'some text',
            '```html',
            large,
            '```',
        ].join('\n');

        const html = extractHtmlFromChat(content);
        expect(html).toContain(large);
        expect(html).not.toContain(small);
    });

    it('detects a generic fenced block that looks like html even without an html language tag', () => {
        const content = [
            '```',
            '<div class="a"><section><h1>Title</h1></section></div>',
            '```',
        ].join('\n');

        const html = extractHtmlFromChat(content);
        expect(html).toContain('<h1>Title</h1>');
    });

    it('ignores a generic fenced code block that is not html (e.g. JS/JSON)', () => {
        const content = [
            '```json',
            '{"a": 1, "b": 2}',
            '```',
        ].join('\n');

        expect(extractHtmlFromChat(content)).toBeNull();
    });

    it('extracts raw (unfenced) full documents starting with <!DOCTYPE html>', () => {
        const content = 'Sure, here you go:\n<!DOCTYPE html><html><body><p>raw</p></body></html>';
        const html = extractHtmlFromChat(content);
        expect(html).toContain('<p>raw</p>');
    });

    it('detects raw html-like content with several structural tags', () => {
        const content = '<div><header><nav>menu</nav></header><main>content</main></div>';
        const html = extractHtmlFromChat(content);
        expect(html).toContain('<main>content</main>');
    });
});

describe('wrapHtmlDocument', () => {
    it('returns empty string for empty input', () => {
        expect(wrapHtmlDocument('')).toBe('');
        expect(wrapHtmlDocument(null)).toBe('');
    });

    it('wraps a bare snippet in a full document shell', () => {
        const wrapped = wrapHtmlDocument('<p>hi</p>');
        expect(wrapped).toContain('<!DOCTYPE html>');
        expect(wrapped).toContain('<p>hi</p>');
    });
});

describe('guessHtmlFilename', () => {
    it('derives a filename from <title>', () => {
        const html = '<html><head><title>My Cool Page</title></head><body></body></html>';
        expect(guessHtmlFilename(html)).toBe('my-cool-page.html');
    });

    it('falls back to <h1> when there is no title', () => {
        const html = '<html><body><h1>Landing Page</h1></body></html>';
        expect(guessHtmlFilename(html)).toBe('landing-page.html');
    });

    it('falls back to a default name when neither title nor h1 exist', () => {
        const html = '<html><body><p>no headings here</p></body></html>';
        expect(guessHtmlFilename(html)).toBe('cybermate-page.html');
    });

    it('always ends with .html', () => {
        expect(guessHtmlFilename('<title>Test</title>')).toMatch(/\.html$/);
    });
});
