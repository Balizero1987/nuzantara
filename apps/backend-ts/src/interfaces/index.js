/**
 * Interface Files Registry
 * HTML interfaces for different parts of the ZANTARA system
 */
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const interfaces = {
    devai: path.resolve(__dirname, 'devai-interface.html'),
    conversationDemo: path.resolve(__dirname, 'zantara-conversation-demo.html'),
    intelligenceV6: path.resolve(__dirname, 'zantara-intelligence-v6.html'),
    production: path.resolve(__dirname, 'zantara-production.html')
};
export function getInterfacePath(name) {
    return interfaces[name];
}
