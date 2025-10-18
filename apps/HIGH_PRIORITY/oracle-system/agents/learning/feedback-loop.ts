/**
 * LEARNING FEEDBACK LOOP
 * System that learns from simulations, real cases, and outcomes
 */

import * as admin from 'firebase-admin';

interface FeedbackEntry {
  id: string;
  timestamp: Date;
  caseId: string;
  prediction: Prediction;
  actualOutcome: Outcome;
  accuracy: number;
  lessonLearned: string;
  adjustments: Adjustment[];
}

interface Prediction {
  timeline: string;
  success: boolean;
  confidence: number;
  risks: string[];
  investment: string;
}

interface Outcome {
  actualTimeline: string;
  actualSuccess: boolean;
  actualProblems: string[];
  actualCost: string;
  clientSatisfaction: number;
}

interface Adjustment {
  component: string;
  parameter: string;
  oldValue: any;
  newValue: any;
  reason: string;
}

interface LearningMetrics {
  totalCases: number;
  accuracyRate: number;
  timelinePrecision: number;
  costPrecision: number;
  riskPredictionAccuracy: number;
  improvements: Improvement[];
}

interface Improvement {
  area: string;
  before: number;
  after: number;
  improvement: number;
  implementedDate: Date;
}

interface Pattern {
  id: string;
  type: 'success' | 'failure' | 'delay' | 'cost_overrun';
  frequency: number;
  conditions: Condition[];
  recommendation: string;
  confidence: number;
}

interface Condition {
  variable: string;
  operator: 'equals' | 'contains' | 'greater' | 'less';
  value: any;
}

export class FeedbackLoop {
  private db: admin.firestore.Firestore;
  private learningCollection: admin.firestore.CollectionReference;
  private patternsCollection: admin.firestore.CollectionReference;
  private metricsCollection: admin.firestore.CollectionReference;

  constructor() {
    this.initializeFirestore();
  }

  private initializeFirestore() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    }

    this.db = admin.firestore();
    this.learningCollection = this.db.collection('learning_feedback');
    this.patternsCollection = this.db.collection('learned_patterns');
    this.metricsCollection = this.db.collection('learning_metrics');
  }

  /**
   * Record feedback from a completed case
   */
  async recordFeedback(
    caseId: string,
    prediction: Prediction,
    actualOutcome: Outcome
  ): Promise<FeedbackEntry> {
    // Calculate accuracy
    const accuracy = this.calculateAccuracy(prediction, actualOutcome);

    // Extract lesson learned
    const lessonLearned = this.extractLesson(prediction, actualOutcome);

    // Generate adjustments
    const adjustments = this.generateAdjustments(prediction, actualOutcome, accuracy);

    const feedback: FeedbackEntry = {
      id: `feedback_${Date.now()}`,
      timestamp: new Date(),
      caseId,
      prediction,
      actualOutcome,
      accuracy,
      lessonLearned,
      adjustments
    };

    // Store feedback
    await this.learningCollection.doc(feedback.id).set(feedback);

    // Update patterns
    await this.updatePatterns(feedback);

    // Update metrics
    await this.updateMetrics(feedback);

    // Apply adjustments
    await this.applyAdjustments(adjustments);

    console.log(`[Learning] Recorded feedback for case ${caseId}: ${accuracy}% accurate`);

    return feedback;
  }

  /**
   * Calculate prediction accuracy
   */
  private calculateAccuracy(prediction: Prediction, outcome: Outcome): number {
    let score = 0;
    let factors = 0;

    // Success prediction accuracy
    if (prediction.success === outcome.actualSuccess) {
      score += 40;
    }
    factors += 40;

    // Timeline accuracy
    const timelineAccuracy = this.compareTimelines(prediction.timeline, outcome.actualTimeline);
    score += timelineAccuracy * 20;
    factors += 20;

    // Cost accuracy
    const costAccuracy = this.compareCosts(prediction.investment, outcome.actualCost);
    score += costAccuracy * 20;
    factors += 20;

    // Risk prediction accuracy
    const riskAccuracy = this.compareRisks(prediction.risks, outcome.actualProblems);
    score += riskAccuracy * 20;
    factors += 20;

    return Math.round((score / factors) * 100);
  }

  /**
   * Extract lesson from prediction vs outcome
   */
  private extractLesson(prediction: Prediction, outcome: Outcome): string {
    const lessons: string[] = [];

    // Success mismatch
    if (prediction.success !== outcome.actualSuccess) {
      if (prediction.success) {
        lessons.push('Overestimated success probability');
      } else {
        lessons.push('Underestimated success probability');
      }
    }

    // Timeline mismatch
    const timelineDiff = this.compareTimelines(prediction.timeline, outcome.actualTimeline);
    if (timelineDiff < 0.8) {
      lessons.push('Timeline prediction needs adjustment');
    }

    // Unexpected problems
    const newProblems = outcome.actualProblems.filter(
      p => !prediction.risks.some(r => r.includes(p))
    );
    if (newProblems.length > 0) {
      lessons.push(`Unexpected issues: ${newProblems.join(', ')}`);
    }

    return lessons.length > 0 ? lessons.join('; ') : 'Prediction accurate';
  }

  /**
   * Generate adjustments based on feedback
   */
  private generateAdjustments(
    prediction: Prediction,
    outcome: Outcome,
    accuracy: number
  ): Adjustment[] {
    const adjustments: Adjustment[] = [];

    // If accuracy is low, generate adjustments
    if (accuracy < 80) {
      // Timeline adjustment
      if (this.compareTimelines(prediction.timeline, outcome.actualTimeline) < 0.8) {
        adjustments.push({
          component: 'timeline_predictor',
          parameter: 'buffer_percentage',
          oldValue: 0.1,
          newValue: 0.2,
          reason: 'Underestimated timeline'
        });
      }

      // Risk assessment adjustment
      if (outcome.actualProblems.length > prediction.risks.length) {
        adjustments.push({
          component: 'risk_analyzer',
          parameter: 'sensitivity',
          oldValue: 'medium',
          newValue: 'high',
          reason: 'Missed risk factors'
        });
      }

      // Confidence adjustment
      if (prediction.confidence > 0.8 && !outcome.actualSuccess) {
        adjustments.push({
          component: 'confidence_calculator',
          parameter: 'base_confidence',
          oldValue: 0.8,
          newValue: 0.7,
          reason: 'Overconfident predictions'
        });
      }
    }

    return adjustments;
  }

  /**
   * Update learned patterns based on feedback
   */
  private async updatePatterns(feedback: FeedbackEntry) {
    // Look for patterns in failures
    if (!feedback.actualOutcome.actualSuccess) {
      await this.identifyFailurePattern(feedback);
    }

    // Look for patterns in delays
    if (this.compareTimelines(feedback.prediction.timeline, feedback.actualOutcome.actualTimeline) < 0.7) {
      await this.identifyDelayPattern(feedback);
    }

    // Look for patterns in cost overruns
    if (this.compareCosts(feedback.prediction.investment, feedback.actualOutcome.actualCost) < 0.7) {
      await this.identifyCostPattern(feedback);
    }

    // Look for success patterns
    if (feedback.actualOutcome.actualSuccess && feedback.accuracy > 90) {
      await this.identifySuccessPattern(feedback);
    }
  }

  /**
   * Identify failure patterns
   */
  private async identifyFailurePattern(feedback: FeedbackEntry) {
    // Query similar failed cases
    const similarCases = await this.learningCollection
      .where('actualOutcome.actualSuccess', '==', false)
      .limit(50)
      .get();

    if (similarCases.size > 10) {
      // Analyze common factors
      const commonFactors = this.findCommonFactors(similarCases.docs);

      if (commonFactors.length > 0) {
        const pattern: Pattern = {
          id: `pattern_${Date.now()}`,
          type: 'failure',
          frequency: similarCases.size,
          conditions: commonFactors,
          recommendation: 'Avoid these conditions or implement additional safeguards',
          confidence: similarCases.size / 50
        };

        await this.patternsCollection.doc(pattern.id).set(pattern);
        console.log(`[Learning] Identified failure pattern: ${pattern.conditions.map(c => c.variable).join(', ')}`);
      }
    }
  }

  /**
   * Apply learned adjustments to the system
   */
  private async applyAdjustments(adjustments: Adjustment[]) {
    for (const adjustment of adjustments) {
      // Update configuration based on adjustment
      await this.updateSystemConfiguration(adjustment);

      // Log adjustment
      console.log(`[Learning] Applied adjustment: ${adjustment.component}.${adjustment.parameter} = ${adjustment.newValue}`);
    }
  }

  /**
   * Get learning metrics
   */
  async getMetrics(): Promise<LearningMetrics> {
    const metricsDoc = await this.metricsCollection.doc('current').get();

    if (!metricsDoc.exists) {
      // Calculate initial metrics
      return await this.calculateMetrics();
    }

    return metricsDoc.data() as LearningMetrics;
  }

  /**
   * Calculate learning metrics from all feedback
   */
  private async calculateMetrics(): Promise<LearningMetrics> {
    const allFeedback = await this.learningCollection.get();

    let totalAccuracy = 0;
    let totalTimeline = 0;
    let totalCost = 0;
    let totalRisk = 0;
    let count = 0;

    allFeedback.docs.forEach(doc => {
      const feedback = doc.data() as FeedbackEntry;
      totalAccuracy += feedback.accuracy;

      totalTimeline += this.compareTimelines(
        feedback.prediction.timeline,
        feedback.actualOutcome.actualTimeline
      );

      totalCost += this.compareCosts(
        feedback.prediction.investment,
        feedback.actualOutcome.actualCost
      );

      totalRisk += this.compareRisks(
        feedback.prediction.risks,
        feedback.actualOutcome.actualProblems
      );

      count++;
    });

    const metrics: LearningMetrics = {
      totalCases: count,
      accuracyRate: count > 0 ? totalAccuracy / count : 0,
      timelinePrecision: count > 0 ? totalTimeline / count : 0,
      costPrecision: count > 0 ? totalCost / count : 0,
      riskPredictionAccuracy: count > 0 ? totalRisk / count : 0,
      improvements: await this.trackImprovements()
    };

    // Store metrics
    await this.metricsCollection.doc('current').set(metrics);

    return metrics;
  }

  /**
   * Track improvements over time
   */
  private async trackImprovements(): Promise<Improvement[]> {
    const improvements: Improvement[] = [];

    // Get metrics from 30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const oldFeedback = await this.learningCollection
      .where('timestamp', '<', thirtyDaysAgo)
      .get();

    const newFeedback = await this.learningCollection
      .where('timestamp', '>=', thirtyDaysAgo)
      .get();

    if (oldFeedback.size > 10 && newFeedback.size > 10) {
      // Calculate improvement in accuracy
      const oldAccuracy = this.calculateAverageAccuracy(oldFeedback.docs);
      const newAccuracy = this.calculateAverageAccuracy(newFeedback.docs);

      improvements.push({
        area: 'Overall Accuracy',
        before: oldAccuracy,
        after: newAccuracy,
        improvement: newAccuracy - oldAccuracy,
        implementedDate: thirtyDaysAgo
      });
    }

    return improvements;
  }

  /**
   * Get learned patterns
   */
  async getPatterns(type?: string): Promise<Pattern[]> {
    let query = this.patternsCollection.orderBy('frequency', 'desc');

    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.limit(20).get();
    return snapshot.docs.map(doc => doc.data() as Pattern);
  }

  /**
   * Predict outcome based on learned patterns
   */
  async enhancePrediction(originalPrediction: Prediction, caseDetails: any): Promise<Prediction> {
    const patterns = await this.getPatterns();
    const enhancedPrediction = { ...originalPrediction };

    // Check if case matches any patterns
    for (const pattern of patterns) {
      if (this.matchesPattern(caseDetails, pattern)) {
        // Adjust prediction based on pattern
        if (pattern.type === 'failure') {
          enhancedPrediction.confidence *= 0.7;
          enhancedPrediction.risks.push(`Warning: Matches failure pattern ${pattern.id}`);
        } else if (pattern.type === 'delay') {
          enhancedPrediction.timeline = this.adjustTimeline(enhancedPrediction.timeline, 1.3);
        } else if (pattern.type === 'cost_overrun') {
          enhancedPrediction.investment = this.adjustCost(enhancedPrediction.investment, 1.2);
        }
      }
    }

    return enhancedPrediction;
  }

  // Utility methods
  private compareTimelines(predicted: string, actual: string): number {
    const predictedDays = this.parseTimeline(predicted);
    const actualDays = this.parseTimeline(actual);

    if (predictedDays === 0 || actualDays === 0) return 0;

    const ratio = Math.min(predictedDays, actualDays) / Math.max(predictedDays, actualDays);
    return ratio;
  }

  private compareCosts(predicted: string, actual: string): number {
    const predictedAmount = this.parseCost(predicted);
    const actualAmount = this.parseCost(actual);

    if (predictedAmount === 0 || actualAmount === 0) return 0;

    const ratio = Math.min(predictedAmount, actualAmount) / Math.max(predictedAmount, actualAmount);
    return ratio;
  }

  private compareRisks(predicted: string[], actual: string[]): number {
    if (predicted.length === 0 && actual.length === 0) return 1;
    if (predicted.length === 0 || actual.length === 0) return 0;

    const matches = predicted.filter(p => actual.some(a => a.includes(p) || p.includes(a)));
    return matches.length / Math.max(predicted.length, actual.length);
  }

  private parseTimeline(timeline: string): number {
    const match = timeline.match(/(\d+)/);
    return match ? parseInt(match[1]) * 30 : 0; // Convert to days
  }

  private parseCost(cost: string): number {
    const match = cost.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private adjustTimeline(timeline: string, factor: number): string {
    const days = this.parseTimeline(timeline);
    const adjusted = Math.round(days * factor);
    return `${Math.round(adjusted / 30)} months`;
  }

  private adjustCost(cost: string, factor: number): string {
    const amount = this.parseCost(cost);
    const adjusted = Math.round(amount * factor);
    return `${adjusted} IDR`;
  }

  private findCommonFactors(docs: admin.firestore.DocumentSnapshot[]): Condition[] {
    // Simplified common factor detection
    const conditions: Condition[] = [];

    // This would be more sophisticated in production
    const commonValues = new Map<string, any>();

    docs.forEach(doc => {
      const data = doc.data() as FeedbackEntry;
      // Extract and count common values
    });

    return conditions;
  }

  private matchesPattern(caseDetails: any, pattern: Pattern): boolean {
    return pattern.conditions.every(condition => {
      const value = caseDetails[condition.variable];

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(condition.value);
        case 'greater':
          return value > condition.value;
        case 'less':
          return value < condition.value;
        default:
          return false;
      }
    });
  }

  private calculateAverageAccuracy(docs: admin.firestore.DocumentSnapshot[]): number {
    if (docs.length === 0) return 0;

    const total = docs.reduce((sum, doc) => {
      const feedback = doc.data() as FeedbackEntry;
      return sum + feedback.accuracy;
    }, 0);

    return total / docs.length;
  }

  private async identifyDelayPattern(feedback: FeedbackEntry) {
    // Implementation similar to identifyFailurePattern
    console.log('[Learning] Analyzing delay pattern...');
  }

  private async identifyCostPattern(feedback: FeedbackEntry) {
    // Implementation similar to identifyFailurePattern
    console.log('[Learning] Analyzing cost overrun pattern...');
  }

  private async identifySuccessPattern(feedback: FeedbackEntry) {
    // Implementation similar to identifyFailurePattern
    console.log('[Learning] Analyzing success pattern...');
  }

  private async updateMetrics(feedback: FeedbackEntry) {
    // Update running metrics
    const metrics = await this.getMetrics();

    // Recalculate with new feedback
    await this.calculateMetrics();
  }

  private async updateSystemConfiguration(adjustment: Adjustment) {
    // This would update actual system configuration
    // For now, just log it
    console.log(`[Config Update] ${adjustment.component}: ${adjustment.parameter} = ${adjustment.newValue}`);
  }
}

// Export handler for ZANTARA integration
export async function recordCaseFeedback(params: any): Promise<any> {
  const feedbackLoop = new FeedbackLoop();

  if (!params.caseId || !params.prediction || !params.outcome) {
    return { error: 'Missing required parameters: caseId, prediction, outcome' };
  }

  const feedback = await feedbackLoop.recordFeedback(
    params.caseId,
    params.prediction,
    params.outcome
  );

  return {
    success: true,
    feedback,
    accuracy: feedback.accuracy,
    lesson: feedback.lessonLearned,
    adjustments: feedback.adjustments.length
  };
}

export async function getLearningMetrics(): Promise<LearningMetrics> {
  const feedbackLoop = new FeedbackLoop();
  return await feedbackLoop.getMetrics();
}

export async function getLearnedPatterns(type?: string): Promise<Pattern[]> {
  const feedbackLoop = new FeedbackLoop();
  return await feedbackLoop.getPatterns(type);
}