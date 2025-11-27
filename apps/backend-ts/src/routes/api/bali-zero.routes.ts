/**
 * ZANTARA Bali Zero API Routes
 * Simplified routes for Bali Zero services
 */

import { Router, Request, Response } from 'express';
import { baliZeroChat } from '../../handlers/rag/rag.js';
import logger from '../../logging/unified-logger.js';

const router = Router();

/**
 * Bali Zero Chat
 * POST /api/bali-zero/chat
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const result = await baliZeroChat(req.body);
    res.json(result);
  } catch (error: any) {
    logger.error('Bali Zero chat error:', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      success: false,
      error: error.message || 'Chat service error'
    });
  }
});

/**
 * Bali Zero Chat Stream (SSE)
 * POST /api/bali-zero/chat-stream
 */
router.post('/chat-stream', async (req: Request, res: Response) => {
  try {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Simple SSE implementation
    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send initial response
    sendEvent({
      type: 'start',
      message: 'Bali Zero chat initiated'
    });

    // Process chat (simplified)
    try {
      const result = await baliZeroChat(req.body);
      sendEvent({
        type: 'response',
        data: result
      });
    } catch (error: any) {
      sendEvent({
        type: 'error',
        error: error.message
      });
    }

    // Send completion event
    sendEvent({
      type: 'end',
      message: 'Chat completed'
    });

    res.end();
  } catch (error: any) {
    logger.error('Bali Zero chat stream error:', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      success: false,
      error: error.message || 'Stream service error'
    });
  }
});

export default router;
