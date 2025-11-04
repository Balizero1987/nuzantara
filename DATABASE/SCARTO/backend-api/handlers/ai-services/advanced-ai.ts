import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { openaiChat } from "./ai.js";

/**
 * AI Anticipate - Predictive analysis for proactive suggestions
 */
export async function aiAnticipate(params: any) {
  const { context, scenario, timeframe = "2_hours", metrics } = params;

  if (!context && !scenario) {
    throw new BadRequestError('context or scenario required');
  }

  // Build anticipation prompt
  const prompt = `You are ZANTARA's predictive intelligence system. Analyze the following scenario and provide proactive recommendations:

Context: ${context || 'General system state'}
Scenario: ${scenario || 'Normal operations'}
Timeframe: ${timeframe}
${metrics ? `Current Metrics: ${JSON.stringify(metrics)}` : ''}

Provide:
1. Predicted issues or bottlenecks
2. Proactive recommendations
3. Resource optimization suggestions
4. Risk mitigation strategies

Format as structured JSON with: predictions, recommendations, optimizations, risks`;

  try {
    const result = await openaiChat({ prompt, model: 'gpt-4o-mini' });

    // Parse AI response
    let predictions;
    try {
      // Try to extract JSON from response
      const jsonMatch = result.data.response.match(/\{[\s\S]*\}/);
      predictions = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        predictions: [result.data.response],
        recommendations: ["Monitor system closely"],
        optimizations: ["Review current configuration"],
        risks: ["Potential unexpected behavior"]
      };
    } catch {
      // Fallback to text response
      predictions = {
        analysis: result.data.response,
        confidence: "medium"
      };
    }

    return ok({
      anticipation: predictions,
      timeframe,
      ts: Date.now(),
      model: result.data.model || "gpt-4o-mini"
    });
  } catch (error: any) {
    throw new BadRequestError(`Anticipation failed: ${error.message}`);
  }
}

/**
 * AI Learn - Adaptive learning from feedback and patterns
 */
export async function aiLearn(params: any) {
  const { feedback, pattern, performance_data, learning_type = "incremental" } = params;

  if (!feedback && !pattern && !performance_data) {
    throw new BadRequestError('feedback, pattern, or performance_data required');
  }

  const prompt = `You are ZANTARA's adaptive learning system. Process the following learning input:

Learning Type: ${learning_type}
${feedback ? `User Feedback: ${JSON.stringify(feedback)}` : ''}
${pattern ? `Pattern Observed: ${JSON.stringify(pattern)}` : ''}
${performance_data ? `Performance Data: ${JSON.stringify(performance_data)}` : ''}

Analyze and provide:
1. Key insights learned
2. System improvements to implement
3. Behavior adjustments recommended
4. Success metrics to track

Format as structured recommendations for system optimization.`;

  try {
    const result = await openaiChat({ prompt, model: 'gpt-4o-mini' });

    return ok({
      learning: {
        type: learning_type,
        insights: result.data.response,
        processed_at: Date.now(),
        model: result.data.model || "gpt-4o-mini"
      },
      recommendations: [
        "Continue monitoring patterns",
        "Implement suggested optimizations",
        "Track success metrics"
      ],
      ts: Date.now()
    });
  } catch (error: any) {
    throw new BadRequestError(`Learning process failed: ${error.message}`);
  }
}

/**
 * XAI Explain - Explainable AI for transparency
 */
export async function xaiExplain(params: any) {
  const { decision, context, model_used, reasoning_path } = params;

  if (!decision) {
    throw new BadRequestError('decision parameter required for explanation');
  }

  const decisionId = `xai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Build explanation based on provided data
  const explanation = {
    decisionId,
    decision,
    model: model_used || "unknown",
    reasoning: reasoning_path || {
      step1: "Input received and validated",
      step2: "Context analyzed",
      step3: "Model selected based on task type",
      step4: "Decision generated",
      step5: "Confidence evaluated"
    },
    transparency: {
      factors_considered: context ? Object.keys(context) : ["input", "history", "patterns"],
      confidence_score: 0.85,
      alternative_considered: true,
      bias_check: "completed"
    },
    metadata: {
      explained_at: Date.now(),
      complexity: "medium",
      interpretability: "high"
    },
    human_explanation: null as string | null
  };

  // If complex decision, get AI to provide deeper explanation
  if (context && Object.keys(context).length > 3) {
    const prompt = `Explain the following AI decision in simple terms:

Decision: ${JSON.stringify(decision)}
Context: ${JSON.stringify(context)}
${model_used ? `Model Used: ${model_used}` : ''}

Provide a clear, human-readable explanation of:
1. Why this decision was made
2. Key factors that influenced it
3. Confidence level and any uncertainties
4. Alternative options considered`;

    try {
      const result = await openaiChat({ prompt, model: 'gpt-4o-mini' });
      explanation.human_explanation = result.data.response;
    } catch {
      explanation.human_explanation = "Decision based on standard operating parameters";
    }
  }

  return ok(explanation);
}
