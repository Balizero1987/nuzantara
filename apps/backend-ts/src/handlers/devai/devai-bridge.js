/**
 * DevAI Bridge Handler
 * Enables DevAI to communicate with ZANTARA and other AI systems
 */
import { aiCommunicationService } from '../../services/ai-communication.js';
import logger from '../../services/logger.js';
/**
 * DevAI calls ZANTARA for business/user-facing tasks
 */
export async function devaiCallZantara(params) {
    try {
        logger.info('DevAI calling ZANTARA', {
            message: params.message.substring(0, 100) + '...',
            workflowId: params.workflowId
        });
        const request = {
            from: 'devai',
            to: 'zantara',
            message: params.message,
            context: params.context,
            workflowId: params.workflowId,
            priority: params.priority || 'normal'
        };
        const response = await aiCommunicationService.communicate(request);
        if (response.success) {
            logger.info('DevAI → ZANTARA communication successful', {
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
            logger.error('DevAI → ZANTARA communication failed', {
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
        logger.error('DevAI → ZANTARA communication error', {
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
 * DevAI workflow orchestration for development tasks
 */
export async function devaiOrchestrateWorkflow(params) {
    try {
        logger.info('DevAI orchestrating workflow', {
            workflowId: params.workflowId,
            steps: params.steps.length
        });
        const results = await aiCommunicationService.orchestrateWorkflow(params.workflowId, params.steps);
        const successfulSteps = results.filter(r => r.success).length;
        logger.info('DevAI workflow orchestration completed', {
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
        logger.error('DevAI workflow orchestration error', {
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
 * DevAI development workflow - Code analysis and improvement
 */
export async function devaiDevelopmentWorkflow(params) {
    try {
        logger.info('DevAI development workflow started', {
            workflowId: params.workflowId,
            task: params.task,
            codeLength: params.code.length
        });
        const steps = [
            {
                ai: 'devai',
                task: `Analyze this code: ${params.code}\n\nTask: ${params.task}`,
                context: params.context
            },
            {
                ai: 'zantara',
                task: `Based on the code analysis, provide business context and user impact assessment for: ${params.task}`,
                context: params.context
            },
            {
                ai: 'devai',
                task: `Implement the improvements based on the business context and technical analysis`,
                context: params.context
            }
        ];
        const results = await aiCommunicationService.orchestrateWorkflow(params.workflowId, steps);
        const successfulSteps = results.filter(r => r.success).length;
        logger.info('DevAI development workflow completed', {
            workflowId: params.workflowId,
            successfulSteps,
            totalSteps: steps.length
        });
        return {
            success: successfulSteps === steps.length,
            results,
            workflow: {
                type: 'development',
                task: params.task,
                steps: steps.length,
                successfulSteps
            }
        };
    }
    catch (error) {
        logger.error('DevAI development workflow error', {
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
 * Get conversation history for DevAI
 */
export async function devaiGetConversationHistory(params) {
    try {
        const history = aiCommunicationService.getConversationHistory(params.workflowId);
        return {
            success: true,
            history,
            count: history.length
        };
    }
    catch (error) {
        logger.error('DevAI get conversation history error', {
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
 * Get shared context for DevAI
 */
export async function devaiGetSharedContext(params) {
    try {
        const context = aiCommunicationService.getSharedContext(params.workflowId);
        return {
            success: true,
            context,
            keys: Object.keys(context)
        };
    }
    catch (error) {
        logger.error('DevAI get shared context error', {
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
 * Clear workflow for DevAI
 */
export async function devaiClearWorkflow(params) {
    try {
        aiCommunicationService.clearWorkflow(params.workflowId);
        logger.info('DevAI workflow cleared', {
            workflowId: params.workflowId
        });
        return {
            success: true,
            message: 'Workflow cleared successfully'
        };
    }
    catch (error) {
        logger.error('DevAI clear workflow error', {
            error: error.message,
            workflowId: params.workflowId
        });
        return {
            success: false,
            error: error.message
        };
    }
}
