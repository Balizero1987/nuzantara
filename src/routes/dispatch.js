import { Router } from 'express';
import { BridgeError } from '../utils/errors.js';
const router = Router();
// Bridge dispatch endpoint
router.post('/bridge/dispatch', async (req, res) => {
    try {
        const { handler, params } = req.body;
        if (!handler) {
            throw new BridgeError(400, 'MISSING_HANDLER', 'Handler is required');
        }
        const bridge = req.bridge;
        if (!bridge) {
            throw new BridgeError(500, 'BRIDGE_NOT_INITIALIZED', 'Bridge instance not found');
        }
        const result = await bridge.dispatch(handler, params);
        res.json({ success: true, result });
    }
    catch (error) {
        const err = error;
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: err.code || 'INTERNAL_ERROR',
            message: err.message
        });
    }
});
// Health check endpoint
router.get('/bridge/status', (req, res) => {
    res.json({
        ok: true,
        service: 'zantara-bridge',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
export default router;
