/**
 * Zero Handlers - Development tools for Zero (Antonello)
 *
 * All handlers require userId === 'zero'
 * Security enforced via middleware
 */

import { zeroChat } from './chat.js';

export const handlers = {
  'zero.chat': zeroChat
};
