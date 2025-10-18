/**
 * MONTE CARLO SIMULATION MODULE
 * Runs thousands of random scenarios to test system robustness
 */

import { SimulationEngine, simulationEngine } from './simulation-engine';

interface MonteCarloConfig {
  iterations: number;
  scenarios: ScenarioType[];
  variables: Variable[];
  confidenceLevel: number;
}

interface ScenarioType {
  name: string;
  probability: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  variables: string[];
}

interface Variable {
  name: string;
  type: 'continuous' | 'discrete' | 'boolean';
  distribution: 'normal' | 'uniform' | 'exponential';
  parameters: any;
}

interface MonteCarloResult {
  scenariosTested: number;
  successRate: number;
  failureRate: number;
  averageTimeline: number;
  averageInvestment: number;
  riskDistribution: RiskDistribution;
  recommendations: string[];
  criticalFactors: CriticalFactor[];
  confidenceInterval: ConfidenceInterval;
}

interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

interface CriticalFactor {
  factor: string;
  impact: number;
  frequency: number;
  mitigation: string;
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number;
}

export class MonteCarloSimulator {
  private engine: SimulationEngine;
  private random: RandomGenerator;
  private results: any[] = [];

  constructor(engine: SimulationEngine = simulationEngine) {
    this.engine = engine;
    this.random = new RandomGenerator();
  }

  /**
   * Run Monte Carlo simulation
   */
  async runMonteCarlo(config: MonteCarloConfig): Promise<MonteCarloResult> {
    console.log(`Starting Monte Carlo simulation with ${config.iterations} iterations...`);

    const results = [];
    const startTime = Date.now();

    for (let i = 0; i < config.iterations; i++) {
      // Generate random scenario
      const scenario = this.generateRandomScenario(config);

      // Run simulation
      const result = await this.simulateScenario(scenario);

      // Store result
      results.push(result);

      // Progress update
      if (i % 100 === 0) {
        console.log(`Progress: ${i}/${config.iterations} scenarios completed`);
      }
    }

    // Analyze results
    const analysis = this.analyzeResults(results, config);

    const duration = (Date.now() - startTime) / 1000;
    console.log(`Monte Carlo completed in ${duration}s`);

    return analysis;
  }

  /**
   * Generate random scenario based on configuration
   */
  private generateRandomScenario(config: MonteCarloConfig): any {
    const scenario: any = {
      id: `mc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      variables: {}
    };

    // Randomly select scenario type
    const scenarioType = this.selectWeightedRandom(config.scenarios);
    scenario.type = scenarioType.name;

    // Generate random variables
    config.variables.forEach(variable => {
      scenario.variables[variable.name] = this.generateRandomVariable(variable);
    });

    // Generate random case description
    scenario.case = this.generateRandomCase(scenarioType, scenario.variables);

    return scenario;
  }

  /**
   * Generate random case description
   */
  private generateRandomCase(scenarioType: ScenarioType, variables: any): string {
    const templates = {
      'visa_application': [
        `${variables.nationality} citizen needs ${variables.visaType} visa for ${variables.purpose}`,
        `${variables.age} year old ${variables.profession} from ${variables.nationality} wants to stay ${variables.duration} months`
      ],
      'business_setup': [
        `${variables.nationality} wants to start ${variables.businessType} in ${variables.location} with ${variables.investment} IDR investment`,
        `Foreign investor needs ${variables.companyType} for ${variables.businessSector} business`
      ],
      'property_investment': [
        `${variables.buyerType} wants to ${variables.action} ${variables.propertyType} in ${variables.area} for ${variables.budget} IDR`,
        `Investor looking for ${variables.propertyType} with ${variables.roi}% expected return`
      ],
      'tax_optimization': [
        `Company with ${variables.revenue} IDR revenue needs tax optimization`,
        `${variables.companyType} seeks to reduce tax from ${variables.currentRate}% to optimal rate`
      ],
      'complex_case': [
        `${variables.nationality} couple wants ${variables.businessType} and ${variables.visaType} visa with ${variables.propertyType} purchase`
      ]
    };

    const typeTemplates = templates[scenarioType.name] || templates['complex_case'];
    const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];

    // Simple template replacement
    let description = template;
    Object.keys(variables).forEach(key => {
      description = description.replace(`\${variables.${key}}`, variables[key]);
    });

    return description;
  }

  /**
   * Simulate a single scenario
   */
  private async simulateScenario(scenario: any): Promise<any> {
    try {
      // Run simulation engine
      const result = await this.engine.simulateCase(scenario.case);

      return {
        scenarioId: scenario.id,
        success: result.integratedSolution.successProbability > 0.7,
        timeline: this.parseTimeline(result.integratedSolution.totalTimeline),
        investment: this.parseInvestment(result.integratedSolution.totalInvestment),
        confidence: result.integratedSolution.successProbability,
        risks: result.conflicts.length,
        classification: result.classification,
        variables: scenario.variables
      };
    } catch (error) {
      // Handle simulation failure
      return {
        scenarioId: scenario.id,
        success: false,
        timeline: null,
        investment: null,
        confidence: 0,
        risks: 999,
        error: error.message,
        variables: scenario.variables
      };
    }
  }

  /**
   * Analyze Monte Carlo results
   */
  private analyzeResults(results: any[], config: MonteCarloConfig): MonteCarloResult {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Calculate success rate
    const successRate = successful.length / results.length;
    const failureRate = failed.length / results.length;

    // Calculate averages
    const avgTimeline = this.calculateAverage(successful.map(r => r.timeline).filter(t => t));
    const avgInvestment = this.calculateAverage(successful.map(r => r.investment).filter(i => i));

    // Risk distribution
    const riskDistribution = this.calculateRiskDistribution(results);

    // Critical factors
    const criticalFactors = this.identifyCriticalFactors(results);

    // Confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(
      successful.map(r => r.confidence),
      config.confidenceLevel
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(results, criticalFactors);

    return {
      scenariosTested: results.length,
      successRate,
      failureRate,
      averageTimeline: avgTimeline,
      averageInvestment: avgInvestment,
      riskDistribution,
      recommendations,
      criticalFactors,
      confidenceInterval
    };
  }

  /**
   * Calculate risk distribution
   */
  private calculateRiskDistribution(results: any[]): RiskDistribution {
    const total = results.length;
    const distribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    results.forEach(result => {
      if (result.risks === 0) distribution.low++;
      else if (result.risks <= 2) distribution.medium++;
      else if (result.risks <= 5) distribution.high++;
      else distribution.critical++;
    });

    return {
      low: distribution.low / total,
      medium: distribution.medium / total,
      high: distribution.high / total,
      critical: distribution.critical / total
    };
  }

  /**
   * Identify critical success/failure factors
   */
  private identifyCriticalFactors(results: any[]): CriticalFactor[] {
    const factors = new Map<string, { success: number, failure: number }>();

    // Count success/failure by variable values
    results.forEach(result => {
      Object.entries(result.variables).forEach(([key, value]) => {
        const factorKey = `${key}:${value}`;

        if (!factors.has(factorKey)) {
          factors.set(factorKey, { success: 0, failure: 0 });
        }

        const factor = factors.get(factorKey)!;
        if (result.success) {
          factor.success++;
        } else {
          factor.failure++;
        }
      });
    });

    // Calculate impact
    const criticalFactors: CriticalFactor[] = [];
    factors.forEach((stats, factorKey) => {
      const total = stats.success + stats.failure;
      const successRate = stats.success / total;
      const impact = Math.abs(successRate - 0.5); // Deviation from neutral

      if (impact > 0.2) { // Significant impact
        criticalFactors.push({
          factor: factorKey,
          impact,
          frequency: total / results.length,
          mitigation: successRate < 0.5
            ? `Avoid or mitigate ${factorKey}`
            : `Leverage ${factorKey} for success`
        });
      }
    });

    return criticalFactors.sort((a, b) => b.impact - a.impact).slice(0, 10);
  }

  /**
   * Generate recommendations based on simulation
   */
  private generateRecommendations(results: any[], factors: CriticalFactor[]): string[] {
    const recommendations: string[] = [];

    // Success rate recommendations
    const successRate = results.filter(r => r.success).length / results.length;
    if (successRate < 0.5) {
      recommendations.push('System shows high failure rate - review requirements');
    } else if (successRate > 0.9) {
      recommendations.push('System shows high success rate - maintain current approach');
    }

    // Critical factor recommendations
    factors.slice(0, 3).forEach(factor => {
      recommendations.push(factor.mitigation);
    });

    // Risk recommendations
    const highRisk = results.filter(r => r.risks > 5).length / results.length;
    if (highRisk > 0.2) {
      recommendations.push('High risk scenarios common - implement additional safeguards');
    }

    return recommendations;
  }

  // Utility methods
  private selectWeightedRandom(items: ScenarioType[]): ScenarioType {
    const totalWeight = items.reduce((sum, item) => sum + item.probability, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
      random -= item.probability;
      if (random <= 0) return item;
    }

    return items[0];
  }

  private generateRandomVariable(variable: Variable): any {
    switch (variable.type) {
      case 'continuous':
        return this.random.generateContinuous(variable.distribution, variable.parameters);

      case 'discrete':
        return this.random.generateDiscrete(variable.parameters.values);

      case 'boolean':
        return Math.random() < variable.parameters.probability;

      default:
        return null;
    }
  }

  private parseTimeline(timeline: string): number {
    // Extract months from timeline string
    const match = timeline.match(/(\d+)/);
    return match ? parseInt(match[1]) : 3;
  }

  private parseInvestment(investment: string): number {
    // Extract number from investment string
    const match = investment.match(/(\d+)/);
    return match ? parseInt(match[1]) * 1000000000 : 10000000000;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private calculateConfidenceInterval(values: number[], confidence: number): ConfidenceInterval {
    const mean = this.calculateAverage(values);
    const stdDev = this.calculateStandardDeviation(values, mean);
    const z = this.getZScore(confidence);
    const margin = z * (stdDev / Math.sqrt(values.length));

    return {
      lower: mean - margin,
      upper: mean + margin,
      confidence
    };
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = this.calculateAverage(squaredDiffs);
    return Math.sqrt(avgSquaredDiff);
  }

  private getZScore(confidence: number): number {
    // Simplified z-score lookup
    const zScores = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    return zScores[confidence] || 1.96;
  }
}

/**
 * Random number generator for various distributions
 */
class RandomGenerator {
  generateContinuous(distribution: string, parameters: any): number {
    switch (distribution) {
      case 'normal':
        return this.normalDistribution(parameters.mean, parameters.stdDev);

      case 'uniform':
        return this.uniformDistribution(parameters.min, parameters.max);

      case 'exponential':
        return this.exponentialDistribution(parameters.lambda);

      default:
        return Math.random();
    }
  }

  generateDiscrete(values: any[]): any {
    return values[Math.floor(Math.random() * values.length)];
  }

  private normalDistribution(mean: number, stdDev: number): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  private uniformDistribution(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private exponentialDistribution(lambda: number): number {
    return -Math.log(1 - Math.random()) / lambda;
  }
}

/**
 * Predefined Monte Carlo test configurations
 */
export const MonteCarloTests = {
  // Stress test visa system
  visaStressTest: {
    iterations: 1000,
    scenarios: [
      { name: 'visa_application', probability: 1.0, impact: 'medium', variables: ['visaType', 'nationality'] }
    ],
    variables: [
      {
        name: 'nationality',
        type: 'discrete',
        distribution: 'uniform',
        parameters: { values: ['US', 'UK', 'AU', 'FR', 'DE', 'IT', 'RU', 'CN', 'JP'] }
      },
      {
        name: 'visaType',
        type: 'discrete',
        distribution: 'uniform',
        parameters: { values: ['B211A', 'B211B', 'KITAS', 'KITAP'] }
      },
      {
        name: 'purpose',
        type: 'discrete',
        distribution: 'uniform',
        parameters: { values: ['tourism', 'business', 'investment', 'retirement'] }
      },
      {
        name: 'duration',
        type: 'continuous',
        distribution: 'normal',
        parameters: { mean: 6, stdDev: 3 }
      }
    ],
    confidenceLevel: 0.95
  },

  // Business setup scenarios
  businessSetupTest: {
    iterations: 500,
    scenarios: [
      { name: 'business_setup', probability: 1.0, impact: 'high', variables: ['businessType', 'investment'] }
    ],
    variables: [
      {
        name: 'businessType',
        type: 'discrete',
        distribution: 'uniform',
        parameters: { values: ['restaurant', 'villa', 'consulting', 'trading', 'spa'] }
      },
      {
        name: 'investment',
        type: 'continuous',
        distribution: 'exponential',
        parameters: { lambda: 0.0000001 }
      },
      {
        name: 'location',
        type: 'discrete',
        distribution: 'uniform',
        parameters: { values: ['Canggu', 'Seminyak', 'Ubud', 'Sanur', 'Uluwatu'] }
      },
      {
        name: 'companyType',
        type: 'discrete',
        distribution: 'uniform',
        parameters: { values: ['PT PMA', 'Local PT', 'CV'] }
      }
    ],
    confidenceLevel: 0.95
  },

  // Complex multi-agent scenarios
  complexScenarioTest: {
    iterations: 200,
    scenarios: [
      { name: 'complex_case', probability: 1.0, impact: 'critical', variables: ['nationality', 'businessType', 'visaType'] }
    ],
    variables: [
      {
        name: 'nationality',
        type: 'discrete',
        distribution: 'uniform',
        parameters: { values: ['US', 'EU', 'AU', 'Asia'] }
      },
      {
        name: 'businessType',
        type: 'discrete',
        distribution: 'uniform',
        parameters: { values: ['hospitality', 'tech', 'wellness', 'trading'] }
      },
      {
        name: 'visaType',
        type: 'discrete',
        distribution: 'uniform',
        parameters: { values: ['investor', 'working', 'dependent'] }
      },
      {
        name: 'propertyType',
        type: 'discrete',
        distribution: 'uniform',
        parameters: { values: ['villa', 'land', 'commercial', 'none'] }
      }
    ],
    confidenceLevel: 0.99
  }
};

// Export handler for ZANTARA integration
export async function runMonteCarloTest(testName: string): Promise<MonteCarloResult> {
  const simulator = new MonteCarloSimulator();
  const config = MonteCarloTests[testName];

  if (!config) {
    throw new Error(`Unknown test configuration: ${testName}`);
  }

  return await simulator.runMonteCarlo(config);
}
