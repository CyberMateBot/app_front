/**
 * DeepSeek / ChatGPT often use \( \) and \[ \]; remark-math expects $ and $$.
 */
export function normalizeMathDelimiters(text) {
    if (!text) {
        return '';
    }

    return String(text)
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, body) => `$$\n${body.trim()}\n$$`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, body) => `$${body.trim()}$`);
}
