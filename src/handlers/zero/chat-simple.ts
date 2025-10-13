/**
 * Zero Chat Handler - ZANTARA-ONLY simplified version
 * Uses ZANTARA for all Zero interactions
 */

// Removed unused imports for ZANTARA-ONLY mode
import { aiChat } from "../ai-services/ai.js";

export interface ZeroChatSimpleParams {
  userId: string;
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ZeroChatSimpleResult {
  ok: boolean;
  response?: string;
  toolsUsed?: string[];
  error?: string;
}

/**
 * Zero Chat with ZANTARA (simplified)
 */
export async function zeroChatSimple(params: ZeroChatSimpleParams): Promise<ZeroChatSimpleResult> {
  const { userId, message } = params;

  if (userId !== 'zero') {
    return {
      ok: false,
      error: 'Zero access required'
    };
  }

  try {
    // Use ZANTARA for Zero chat
    const result = await aiChat({
      prompt: message,
      context: 'Zero administrative access - you have full system permissions',
      provider: 'zantara',
      userId: 'zero'
    });

    const responseData: any = result.data || result;
    
    return {
      ok: true,
      response: responseData.response || responseData.answer,
      toolsUsed: ['zantara']
    };
  } catch (error: any) {
    console.error('Zero chat simple error:', error);
    return {
      ok: false,
      error: `Zero chat failed: ${error.message}`
    };
  }
}