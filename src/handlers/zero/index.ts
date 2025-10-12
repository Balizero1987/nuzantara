/**
 * Zero Handlers - Development tools for Zero (Antonello)
 *
 * All handlers require userId === 'zero'
 * Security enforced via middleware
 */

import { zeroChat } from './chat.ts';
import { zeroChatSimple } from './chat-simple.ts';

export const handlers = {
  'zero.chat': zeroChat, // Claude with tool use (requires ANTHROPIC_API_KEY)
  'zero.chat.simple': zeroChatSimple // Gemini fallback (no tool execution)
};
