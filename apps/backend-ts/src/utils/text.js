export function cleanMarkdown(text) {
    if (!text)
        return '';
    try {
        return text
            .replace(/#{1,6}\s*/g, '')
            .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
            .replace(/[🔧📧📱🌐💫✅❌🎯🚀📍📸🌸🌐💡🔥⭐️✨💬🧠🛠️🧩📊📌]/g, '')
            .replace(/[>]{1}\s?/g, '')
            .replace(/\r?\n\s*\r?\n/g, '\n')
            .trim();
    }
    catch {
        return text;
    }
}
export function toPlainIfEnabled(text) {
    const plain = process.env.ZANTARA_PLAIN_TEXT === '1' || process.env.ZANTARA_PLAIN_TEXT === 'true' || process.env.ZANTARA_OUTPUT_FORMAT === 'plain';
    return plain ? cleanMarkdown(text) : text;
}
