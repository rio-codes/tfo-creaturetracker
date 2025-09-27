import DOMPurify from 'dompurify';

let purifyInstance: DOMPurify.DOMPurify | null = null;

/**
 * Initializes and returns a DOMPurify instance.
 * This function ensures that `jsdom` is only imported on the server-side,
 * preventing it from being included in the client bundle.
 * @returns A promise that resolves to a DOMPurify instance.
 */
async function getPurify() {
    if (purifyInstance) {
        return purifyInstance;
    }

    if (typeof window !== 'undefined') {
        // We are on the client, use the browser's window object.
        purifyInstance = DOMPurify(window as any);
    } else {
        // We are on the server, dynamically import jsdom.
        const { JSDOM } = await import('jsdom');
        const serverWindow = new JSDOM('').window;
        purifyInstance = DOMPurify(serverWindow as any);
    }

    return purifyInstance;
}

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * It allows a safe subset of HTML tags and attributes, like <strong>.
 * Unicode characters and emojis are preserved.
 *
 * @param dirtyHtml The potentially unsafe HTML string to sanitize.
 * @returns A promise that resolves to the sanitized HTML string.
 */
export async function sanitizeHtml(dirtyHtml: string): Promise<string> {
    const purify = await getPurify();
    return purify.sanitize(dirtyHtml);
}
