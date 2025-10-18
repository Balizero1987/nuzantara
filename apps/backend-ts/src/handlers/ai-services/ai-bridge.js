/**
 * ZANTARA Bridge Handler
 * Enables ZANTARA to communicate with DevAI and other AI systems
 */
import { aiCommunicationService } from '../../services/ai-communication.js';
import logger from '../../services/logger.js';
/**
 * ZANTARA calls DevAI for development tasks
 */
export async function zantaraCallDevAI(params) {
    try {
        logger.info('ZANTARA calling DevAI', {
            message: params.message.substring(0, 100) + '...',
            workflowId: params.workflowId
        });
        const request = {
            from: 'zantara',
            to: 'devai',
            message: params.message,
            context: params.context,
            workflowId: params.workflowId,
            priority: params.priority || 'normal'
        };
        const response = await aiCommunicationService.communicate(request);
        if (response.success) {
            logger.info('ZANTARA → DevAI communication successful', {
                responseLength: response.response.length,
                workflowId: params.workflowId
            });
            return {
                success: true,
                response: response.response,
                context: response.context,
                metadata: response.metadata
            };
        }
        else {
            logger.error('ZANTARA → DevAI communication failed', {
                error: response.response,
                workflowId: params.workflowId
            });
            return {
                success: false,
                error: response.response,
                metadata: response.metadata
            };
        }
    }
    catch (error) {
        logger.error('ZANTARA → DevAI communication error', {
            error: error.message,
            workflowId: params.workflowId
        });
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * ZANTARA workflow orchestration
 */
export async function zantaraOrchestrateWorkflow(params) {
    try {
        logger.info('ZANTARA orchestrating workflow', {
            workflowId: params.workflowId,
            steps: params.steps.length
        });
        const results = await aiCommunicationService.orchestrateWorkflow(params.workflowId, params.steps);
        const successfulSteps = results.filter(r => r.success).length;
        logger.info('ZANTARA workflow orchestration completed', {
            workflowId: params.workflowId,
            totalSteps: params.steps.length,
            successfulSteps
        });
        return {
            success: successfulSteps === params.steps.length,
            results,
            summary: {
                totalSteps: params.steps.length,
                successfulSteps,
                failedSteps: params.steps.length - successfulSteps
            }
        };
    }
    catch (error) {
        logger.error('ZANTARA workflow orchestration error', {
            error: error.message,
            workflowId: params.workflowId
        });
        return {
            success: false,
            error: error.message,
            results: []
        };
    }
}
/**
 * Get conversation history for ZANTARA
 */
export async function zantaraGetConversationHistory(params) {
    try {
        const history = aiCommunicationService.getConversationHistory(params.workflowId);
        return {
            success: true,
            history,
            count: history.length
        };
    }
    catch (error) {
        logger.error('ZANTARA get conversation history error', {
            error: error.message,
            workflowId: params.workflowId
        });
        return {
            success: false,
            error: error.message,
            history: []
        };
    }
}
/**
 * Get shared context for ZANTARA
 */
export async function zantaraGetSharedContext(params) {
    try {
        const context = aiCommunicationService.getSharedContext(params.workflowId);
        return {
            success: true,
            context,
            keys: Object.keys(context)
        };
    }
    catch (error) {
        logger.error('ZANTARA get shared context error', {
            error: error.message,
            workflowId: params.workflowId
        });
        return {
            success: false,
            error: error.message,
            context: {}
        };
    }
}
/**
 * Clear workflow for ZANTARA
 */
export async function zantaraClearWorkflow(params) {
    try {
        aiCommunicationService.clearWorkflow(params.workflowId);
        logger.info('ZANTARA workflow cleared', {
            workflowId: params.workflowId
        });
        return {
            success: true,
            message: 'Workflow cleared successfully'
        };
    }
    catch (error) {
        logger.error('ZANTARA clear workflow error', {
            error: error.message,
            workflowId: params.workflowId
        });
        return {
            success: false,
            error: error.message
        };
    }
}
