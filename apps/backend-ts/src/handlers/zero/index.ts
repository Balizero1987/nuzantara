/**
 * Zero Handlers - Development tools for Zero (Antonello)
 *
 * All handlers require userId === 'zero'
 * Security enforced via middleware
 */

import { zeroChat } from './chat.js';
import { zeroChatSimple } from './chat-simple.js';

export const handlers = {
  'zero.chat': zeroChat, // ZANTARA-ONLY with tool use
  'zero.chat.simple': zeroChatSimple, // ZANTARA-ONLY simplified
};
