import { describe, expect, it } from 'vitest';
import { isSafeExternalUrl } from './safeUrl.js';

describe('isSafeExternalUrl', () => {
    it('allows http and https urls', () => {
        expect(isSafeExternalUrl('https://example.com')).toBe(true);
        expect(isSafeExternalUrl('http://example.com/path?x=1')).toBe(true);
    });

    it('allows root-relative and hash urls', () => {
        expect(isSafeExternalUrl('/legal/terms')).toBe(true);
        expect(isSafeExternalUrl('#section')).toBe(true);
    });

    it('rejects javascript: urls', () => {
        expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
        expect(isSafeExternalUrl('  javascript:alert(1)  ')).toBe(false);
        expect(isSafeExternalUrl('JaVaScRiPt:alert(1)')).toBe(false);
    });

    it('rejects data: and vbscript: urls', () => {
        expect(isSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
        expect(isSafeExternalUrl('vbscript:msgbox(1)')).toBe(false);
    });

    it('rejects empty/nullish input', () => {
        expect(isSafeExternalUrl('')).toBe(false);
        expect(isSafeExternalUrl(null)).toBe(false);
        expect(isSafeExternalUrl(undefined)).toBe(false);
    });

    it('rejects urls with unsupported schemes', () => {
        expect(isSafeExternalUrl('ftp://example.com/file')).toBe(false);
        expect(isSafeExternalUrl('mailto:someone@example.com')).toBe(false);
        expect(isSafeExternalUrl('tel:+123456789')).toBe(false);
    });

    it('allows protocol-relative urls that resolve to http(s)', () => {
        expect(isSafeExternalUrl('//example.com/path')).toBe(true);
    });
});
