// Standalone Dashboard Server for Zantara Bridge

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001; // Different port to avoid conflicts

// Serve static dashboard files
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));

// Redirect root to dashboard
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// Simple API endpoint for testing
app.get('/api/status', (req, res) => {
    res.json({
        status: 'operational',
        version: '5.2.0',
        timestamp: new Date().toISOString()
    });
});

// Mock metrics endpoint
app.get('/api/dashboard/metrics', (req, res) => {
    res.json({
        conversations: 47 + Math.floor(Math.random() * 10),
        actionsPerMinute: 120 + Math.floor(Math.random() * 30),
        successRate: (97 + Math.random() * 2).toFixed(1),
        revenue: {
            today: 12847 + Math.floor(Math.random() * 1000),
            week: 76234,
            month: 342891,
            byService: {
                'Visa Services': 8350,
                'Company Setup': 3212,
                'Consulting': 1285
            }
        },
        performance: {
            latency: 42 + Math.floor(Math.random() * 20),
            cacheHitRate: 94.2,
            errorRate: 0.03
        },
        health: {
            'ChatGPT API': { status: 'healthy' },
            'Firebase': { status: 'healthy' },
            'Google Drive': { status: 'healthy' },
            'Redis Cache': { status: 'warning' },
            'OAuth Service': { status: 'healthy' },
            'Webhook Server': { status: 'healthy' }
        },
        topActions: [
            { action: 'lead.save', count: 342 },
            { action: 'quote.generate', count: 156 },
            { action: 'contact.info', count: 98 },
            { action: 'visa.check', count: 67 },
            { action: 'company.setup', count: 34 },
            { action: 'document.process', count: 12 }
        ],
        alerts: [
            {
                type: 'warning',
                title: 'Traffic Spike Predicted',
                description: 'Expected 3x load in 45 minutes',
                timestamp: Date.now()
            }
        ],
        predictions: [
            {
                type: 'traffic',
                confidence: 0.85,
                message: 'High visa inquiry traffic expected',
                suggestedAction: 'Scale up ChatGPT workers'
            }
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 Zantara AI Dashboard Started!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Dashboard URL: http://localhost:${PORT}/dashboard`);
    console.log(`📡 API Status: http://localhost:${PORT}/api/status`);
    console.log('');
    console.log('✨ Features:');
    console.log('  • Real-time ChatGPT monitoring');
    console.log('  • AI predictions & anomaly detection');
    console.log('  • Revenue intelligence');
    console.log('  • Performance metrics');
    console.log('');
    console.log('Press Ctrl+C to stop the dashboard');
    console.log('═══════════════════════════════════════');
});