// Integration script to add dashboard to existing Zantara Bridge

import fs from 'fs';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';

// Import dashboard components
import {
    setupDashboardRoutes,
    metricsMiddleware,
    metricsCollector
} from './dashboard-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Integration function to be added to your main server file
function integrateDashboard(app) {
    console.log('🚀 Integrating Zantara AI Dashboard...');

    // Add metrics middleware
    app.use(metricsMiddleware);

    // Setup dashboard routes
    setupDashboardRoutes(app);

    // Hook into existing handlers to track metrics
    integrateWithHandlers();

    // Start metrics collection
    startMetricsCollection();

    console.log('✅ Dashboard integration complete!');
    console.log('📊 Access dashboard at: http://localhost:8081/dashboard');
}

// Hook into existing custom-gpt-handlers
async function integrateWithHandlers() {
    const { customGptHandlers } = await import('./custom-gpt-handlers.js');

    // Wrap each handler to track metrics
    Object.keys(customGptHandlers).forEach(action => {
        const originalHandler = customGptHandlers[action];

        customGptHandlers[action] = async (params) => {
            const start = Date.now();

            try {
                // Track conversation start for certain actions
                if (['lead.save', 'quote.generate'].includes(action)) {
                    metricsCollector.trackConversation('start', { action });
                }

                // Execute original handler
                const result = await originalHandler(params);

                // Track successful action
                metricsCollector.trackAction(action, {
                    success: true,
                    latency: Date.now() - start,
                    revenue: extractRevenue(action, result)
                });

                // Track conversation end
                if (['lead.save', 'quote.generate'].includes(action)) {
                    setTimeout(() => {
                        metricsCollector.trackConversation('end', { action });
                    }, 5000);
                }

                return result;
            } catch (error) {
                // Track failed action
                metricsCollector.trackAction(action, {
                    success: false,
                    error: true,
                    latency: Date.now() - start,
                    errorMessage: error.message
                });

                throw error;
            }
        };
    });
}

// Extract revenue from action results
function extractRevenue(action, result) {
    if (action === 'quote.generate' && result?.data?.options) {
        // Extract price from first option
        const firstOption = result.data.options[0];
        if (firstOption?.price) {
            const price = firstOption.price.replace(/[^0-9]/g, '');
            return parseInt(price) / 1000; // Convert IDR to approximate USD
        }
    }

    if (action === 'payment.process' && result?.data?.amount) {
        return result.data.amount;
    }

    return 0;
}

// Start automatic metrics collection
function startMetricsCollection() {
    // Simulate initial data
    simulateInitialMetrics();

    // Start periodic updates
    setInterval(simulateMetricsUpdates, 10000);

    // Monitor system health
    monitorSystemHealth();
}

// Simulate initial metrics for demo
function simulateInitialMetrics() {
    // Add some initial conversions
    for (let i = 0; i < 47; i++) {
        metricsCollector.trackConversation('start', {
            source: 'ChatGPT',
            timestamp: Date.now() - Math.random() * 3600000
        });
    }

    // Add action history
    const actions = ['lead.save', 'quote.generate', 'contact.info', 'visa.check'];
    actions.forEach(action => {
        const count = Math.floor(Math.random() * 100) + 50;
        for (let i = 0; i < count; i++) {
            metricsCollector.trackAction(action, {
                timestamp: Date.now() - Math.random() * 3600000
            });
        }
    });

    // Add revenue data
    const services = ['Visa Services', 'Company Setup', 'Consulting'];
    services.forEach(service => {
        const revenue = Math.floor(Math.random() * 5000) + 1000;
        metricsCollector.trackRevenue(revenue, service);
    });
}

// Simulate ongoing metrics updates
function simulateMetricsUpdates() {
    // Random chance of new action
    if (Math.random() > 0.3) {
        const actions = ['lead.save', 'quote.generate', 'contact.info', 'visa.check', 'company.setup'];
        const action = actions[Math.floor(Math.random() * actions.length)];

        metricsCollector.trackAction(action, {
            source: 'ChatGPT',
            success: Math.random() > 0.05
        });
    }

    // Random chance of revenue
    if (Math.random() > 0.8) {
        const services = ['Visa Services', 'Company Setup', 'Consulting'];
        const service = services[Math.floor(Math.random() * services.length)];
        const amount = Math.floor(Math.random() * 2000) + 500;

        metricsCollector.trackRevenue(amount, service);
    }

    // Update performance metrics
    metricsCollector.trackPerformance('latency', 30 + Math.random() * 50);
    metricsCollector.trackPerformance('cache', 85 + Math.random() * 10);
    metricsCollector.trackPerformance('error', Math.random() * 2);
}

// Monitor system health
function monitorSystemHealth() {
    setInterval(() => {
        // Check process memory
        const memUsage = process.memoryUsage();
        const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

        if (memPercent > 80) {
            metricsCollector.addAlert({
                type: 'warning',
                title: 'High Memory Usage',
                description: `Memory usage at ${memPercent.toFixed(1)}%`,
                timestamp: Date.now()
            });
        }

        // Monitor CPU (simplified)
        const cpuUsage = Math.random() * 60; // Simulate CPU usage
        metricsCollector.metrics.performance.cpu = cpuUsage;

        // Check service connections
        checkServiceHealth();
    }, 30000);
}

// Check external service health
async function checkServiceHealth() {
    const services = [
        { name: 'ChatGPT API', check: checkChatGPT },
        { name: 'Firebase', check: checkFirebase },
        { name: 'Google Drive', check: checkGoogleDrive }
    ];

    for (const service of services) {
        try {
            const isHealthy = await service.check();
            metricsCollector.metrics.health.services[service.name] = {
                status: isHealthy ? 'healthy' : 'error',
                lastCheck: Date.now()
            };
        } catch (error) {
            metricsCollector.metrics.health.services[service.name] = {
                status: 'error',
                lastCheck: Date.now(),
                error: error.message
            };
        }
    }
}

// Service health check functions
async function checkChatGPT() {
    // Simulate health check
    return Math.random() > 0.05;
}

async function checkFirebase() {
    // Simulate health check
    return Math.random() > 0.05;
}

async function checkGoogleDrive() {
    // Simulate health check
    return Math.random() > 0.05;
}

// Quick start function
function quickStart() {
    const app = express();

    app.use(express.json());
    app.use(express.static('public'));

    // Integrate dashboard
    integrateDashboard(app);

    // Start server
    const PORT = process.env.PORT || 8081;
    app.listen(PORT, () => {
        console.log(`🌟 Zantara Bridge with AI Dashboard running on port ${PORT}`);
        console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    });
}

// Export for use in main application
export {
    integrateDashboard,
    metricsCollector,
    quickStart
};

// If run directly, start the dashboard
if (import.meta.url === `file://${process.argv[1]}`) {
    quickStart();
}