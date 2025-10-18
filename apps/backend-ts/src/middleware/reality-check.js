// Reality Check Middleware - Advanced Anti-Hallucination Layer
import logger from '../services/logger.js';
import { RealityAnchorSystem } from "../services/reality-anchor.js";
import { AntiHallucinationSystem } from "../services/anti-hallucination.js";
const realityAnchor = RealityAnchorSystem.getInstance();
const antiHallucination = AntiHallucinationSystem.getInstance();
// Track handler performance
const handlerMetrics = new Map();
/**
 * Deep reality check middleware
 */
export function deepRealityCheck() {
    return async (req, res, next) => {
        const startTime = Date.now();
        const handlerName = req.body?.key || req.path.split('/').pop() || 'unknown';
        // Store original methods
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);
        // Override json method
        res.json = function (body) {
            // Perform async reality check
            performAsyncRealityCheck(handlerName, req.body, body, startTime);
            return originalJson(body);
        };
        // Override send method
        res.send = function (body) {
            // Perform async reality check for non-JSON responses
            if (typeof body === 'object') {
                performAsyncRealityCheck(handlerName, req.body, body, startTime);
            }
            return originalSend(body);
        };
        next();
    };
}
/**
 * Perform asynchronous reality check
 */
async function performAsyncRealityCheck(handler, input, output, startTime) {
    try {
        const processingTime = Date.now() - startTime;
        // Skip check for system endpoints
        if (handler === 'health' || handler === 'metrics' || handler === 'docs') {
            return;
        }
        // Perform reality anchor check
        const anchoredResponse = await realityAnchor.generateAnchoredResponse(output, handler);
        // Track metrics
        updateHandlerMetrics(handler, anchoredResponse.reality_anchor?.score || 0);
        // Learn from interaction
        await realityAnchor.learnFromInteraction(handler, input, anchoredResponse, output.ok !== false);
        // Log warnings for low reality scores
        if (anchoredResponse.reality_anchor?.score < 0.7) {
            logger.warn(`⚠️ Reality Check Warning for ${handler}:`);
            logger.warn(`  Score: ${anchoredResponse.reality_anchor.score}`);
            logger.warn(`  Contradictions: ${anchoredResponse.reality_anchor.contradictions_found}`);
            logger.warn(`  Processing time: ${processingTime}ms`);
        }
        // Alert on critical issues
        if (anchoredResponse.reality_anchor?.score < 0.3) {
            logger.error(`🚨 CRITICAL: Very low reality score for ${handler}`);
            logger.error(`  Input:`, input);
            logger.error(`  Output:`, output);
            // Inject warning into response if possible
            if (output && typeof output === 'object') {
                output.critical_warning = 'This response has very low reality confidence. Please verify.';
            }
        }
    }
    catch (error) {
        logger.error('Reality check error:', error);
    }
}
/**
 * Update handler metrics
 */
function updateHandlerMetrics(handler, realityScore) {
    const metrics = handlerMetrics.get(handler) || {
        totalCalls: 0,
        realityScores: [],
        failures: 0,
        lastUpdate: new Date()
    };
    metrics.totalCalls++;
    metrics.realityScores.push(realityScore);
    if (realityScore < 0.5)
        metrics.failures++;
    metrics.lastUpdate = new Date();
    // Keep only last 100 scores
    if (metrics.realityScores.length > 100) {
        metrics.realityScores = metrics.realityScores.slice(-100);
    }
    handlerMetrics.set(handler, metrics);
}
/**
 * Get reality metrics endpoint
 */
export async function getRealityMetrics(_req, res) {
    const metrics = [];
    for (const [handler, data] of handlerMetrics.entries()) {
        const avgScore = data.realityScores.length > 0
            ? data.realityScores.reduce((a, b) => a + b, 0) / data.realityScores.length
            : 0;
        metrics.push({
            handler,
            totalCalls: data.totalCalls,
            averageRealityScore: avgScore,
            failureRate: data.failures / data.totalCalls,
            lastUpdate: data.lastUpdate
        });
    }
    // Sort by lowest reality score (most problematic first)
    metrics.sort((a, b) => a.averageRealityScore - b.averageRealityScore);
    const realityReport = realityAnchor.getRealityReport();
    const validationReport = antiHallucination.getVerificationReport();
    res.json({
        ok: true,
        data: {
            handlerMetrics: metrics,
            realitySystem: realityReport,
            validationSystem: validationReport,
            recommendations: generateRecommendations(metrics),
            timestamp: new Date().toISOString()
        }
    });
}
/**
 * Generate recommendations based on metrics
 */
function generateRecommendations(metrics) {
    const recommendations = [];
    // Find problematic handlers
    const problematic = metrics.filter(m => m.averageRealityScore < 0.7);
    if (problematic.length > 0) {
        recommendations.push(`Review these handlers with low reality scores: ${problematic.map(p => p.handler).join(', ')}`);
    }
    // High failure rate handlers
    const highFailure = metrics.filter(m => m.failureRate > 0.2);
    if (highFailure.length > 0) {
        recommendations.push(`These handlers have high failure rates: ${highFailure.map(h => h.handler).join(', ')}`);
    }
    // General recommendations
    const overallAvg = metrics.reduce((sum, m) => sum + m.averageRealityScore, 0) / (metrics.length || 1);
    if (overallAvg < 0.8) {
        recommendations.push('Overall reality scores are below optimal. Consider reviewing response generation logic.');
    }
    if (recommendations.length === 0) {
        recommendations.push('System is operating within normal parameters. No immediate action required.');
    }
    return recommendations;
}
/**
 * Reality enforcement endpoint - forces reality check on specific content
 */
export async function enforceReality(req, res) {
    const { content, context } = req.body;
    if (!content) {
        return res.status(400).json({
            ok: false,
            error: 'Content is required for reality enforcement'
        });
    }
    try {
        const realityCheck = await realityAnchor.performRealityCheck(content, context || 'manual_check');
        const grounded = await antiHallucination.groundResponse({ content }, ['manual_verification'], { context });
        return res.json({
            ok: true,
            data: {
                realityCheck,
                grounding: grounded,
                safe: realityCheck.realityScore > 0.7 && grounded.grounded,
                recommendations: realityCheck.contradictions.length > 0
                    ? 'Review and correct contradictions before using this content'
                    : 'Content appears to be grounded in reality'
            }
        });
    }
    catch (error) {
        return res.status(500).json({
            ok: false,
            error: 'Reality enforcement failed',
            message: error.message
        });
    }
}
/**
 * Clear reality cache endpoint
 */
export async function clearRealityCache(_req, res) {
    realityAnchor.clearUnverifiedCache();
    antiHallucination.clearUnverifiedFacts();
    return res.json({
        ok: true,
        data: {
            message: 'Reality cache and unverified facts cleared',
            timestamp: new Date().toISOString()
        }
    });
}
