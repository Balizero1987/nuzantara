/**
 * Bali Zero Business Services Registry
 * Auto-registers all Indonesian business service handlers
 */
import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import { oracleSimulate, oracleAnalyze, oraclePredict } from './oracle.js';
import { documentPrepare, assistantRoute } from './advisory.js';
import { kbliLookup, kbliRequirements } from './kbli.js';
import { baliZeroPricing, baliZeroQuickPrice } from './bali-zero-pricing.js';
import { teamList, teamGet, teamDepartments } from './team.js';
import { teamRecentActivity } from './team-activity.js';
export function registerBaliZeroHandlers() {
    // Oracle handlers
    globalRegistry.registerModule('bali-zero', {
        'oracle.simulate': oracleSimulate,
        'oracle.analyze': oracleAnalyze,
        'oracle.predict': oraclePredict
    }, {
        requiresAuth: true,
        description: 'Business simulation and prediction'
    });
    // Advisory handlers
    globalRegistry.registerModule('bali-zero', {
        'document.prepare': documentPrepare,
        'assistant.route': assistantRoute
    }, {
        requiresAuth: true,
        description: 'Business advisory services'
    });
    // KBLI handlers
    globalRegistry.registerModule('bali-zero', {
        'kbli.lookup': kbliLookup,
        'kbli.requirements': kbliRequirements
    }, {
        requiresAuth: false,
        description: 'Indonesian business classification'
    });
    // Pricing handlers
    globalRegistry.registerModule('bali-zero', {
        'pricing.get': baliZeroPricing,
        'pricing.quick': baliZeroQuickPrice
    }, {
        requiresAuth: false,
        description: 'Official Bali Zero pricing'
    });
    // Team handlers (registered with direct keys to match router.ts expectations)
    globalRegistry.register({
        key: 'team.list',
        handler: teamList,
        module: 'bali-zero',
        requiresAuth: true,
        description: 'List all Bali Zero team members'
    });
    globalRegistry.register({
        key: 'team.get',
        handler: teamGet,
        module: 'bali-zero',
        requiresAuth: true,
        description: 'Get specific team member details'
    });
    globalRegistry.register({
        key: 'team.departments',
        handler: teamDepartments,
        module: 'bali-zero',
        requiresAuth: true,
        description: 'List team departments'
    });
    globalRegistry.register({
        key: 'team.recent_activity',
        handler: teamRecentActivity,
        module: 'bali-zero',
        requiresAuth: true,
        description: 'Get recent team activity with real-time session tracking'
    });
    logger.info('✅ Bali Zero handlers registered');
}
registerBaliZeroHandlers();
