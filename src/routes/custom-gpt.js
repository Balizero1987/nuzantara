// 🤖 CUSTOM GPT ROUTES
// Endpoint specifici per l'integrazione Custom GPT
import { Router } from 'express';
import { customGptHandlers } from '../custom-gpt-handlers.js';
const router = Router();
// 💼 LEAD MANAGEMENT
router.post('/lead/save', async (req, res) => {
    try {
        const result = await customGptHandlers['lead.save'](req.body);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            error: 'LEAD_SAVE_ERROR',
            message: error.message
        });
    }
});
// 💰 QUOTE GENERATION
router.post('/quote/generate', async (req, res) => {
    try {
        const result = await customGptHandlers['quote.generate'](req.body);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            error: 'QUOTE_GENERATE_ERROR',
            message: error.message
        });
    }
});
// 📋 DOCUMENT PREPARATION
router.post('/document/prepare', async (req, res) => {
    try {
        const result = await customGptHandlers['document.prepare'](req.body);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            error: 'DOCUMENT_PREPARE_ERROR',
            message: error.message
        });
    }
});
// 📞 CONTACT INFO
router.get('/contact/info', async (req, res) => {
    try {
        const result = await customGptHandlers['contact.info']({});
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            error: 'CONTACT_INFO_ERROR',
            message: error.message
        });
    }
});
// 🎯 ASSISTANT ROUTING
router.post('/assistant/route', async (req, res) => {
    try {
        const result = await customGptHandlers['assistant.route'](req.body);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            error: 'ROUTING_ERROR',
            message: error.message
        });
    }
});
// 📊 CUSTOM GPT STATUS
router.get('/status', async (req, res) => {
    res.json({
        ok: true,
        service: 'ZANTARA Custom GPT API',
        version: '1.0.0',
        endpoints: [
            'POST /gpt/lead/save',
            'POST /gpt/quote/generate',
            'POST /gpt/document/prepare',
            'GET /gpt/contact/info',
            'POST /gpt/assistant/route'
        ],
        integration: 'OpenAI Custom GPT Actions',
        timestamp: new Date().toISOString()
    });
});
export default router;
