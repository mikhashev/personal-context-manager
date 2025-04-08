/**
 * neural-feedback-integration.js
 * 
 * Demonstrates how to integrate neural interface feedback
 * to drive context evolution based on brain activity metrics.
 */

const SelfImprovingContextHandler = require('./self-improvement-handler');

class NeuralFeedbackIntegrator {
  constructor(contextHandler, neuralAdapter) {
    this.contextHandler = contextHandler;
    this.neuralAdapter = neuralAdapter;
    this.neuralHistory = [];
    this.correlations = {};
  }

  // Record neural state along with context access
  async trackAccessWithNeuralState(path) {
    // Get neural data from device
    const neuralState = await this.neuralAdapter.getCurrentState();
    
    // Record when context element was accessed
    const value = this.contextHandler.trackAccess(path);
    
    // Record neural state with access
    this.neuralHistory.push({
      timestamp: new Date(),
      path,
      neuralState,
      value
    });
    
    return value;
  }

  // Record effectiveness with neural state
  async recordEffectivenessWithNeuralState(path, score, feedback = '') {
    // Get neural data
    const neuralState = await this.neuralAdapter.getCurrentState();
    
    // Record both effectiveness and neural state
    this.contextHandler.recordEffectiveness(path, score, feedback);
    this.neuralHistory.push({
      timestamp: new Date(),
      path,
      neuralState,
      score,
      feedback,
      type: 'effectiveness'
    });
    
    // Update correlation analysis
    this.updateCorrelations();
  }

  // Update correlation between neural states and effectiveness
  updateCorrelations() {
    const effectivenessEvents = this.neuralHistory.filter(
      event => event.type === 'effectiveness'
    );
    
    if (effectivenessEvents.length < 5) return;
    
    // Get all neural metrics from first event
    const metrics = Object.keys(effectivenessEvents[0].neuralState).filter(
      key => typeof effectivenessEvents[0].neuralState[key] === 'number'
    );
    
    // Calculate correlation for each metric
    metrics.forEach(metric => {
      const data = effectivenessEvents.map(event => ({
        value: event.neuralState[metric],
        score: event.score
      }));
      
      this.correlations[metric] = this.calculateCorrelation(
        data.map(item => item.value),
        data.map(item => item.score)
      );
    });
  }

  // Calculate Pearson correlation
  calculateCorrelation(x, y) {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;
    
    // Calculate means
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate coefficients
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(xDenominator * yDenominator);
    return denominator ? numerator / denominator : 0;
  }

  // Generate neural-based improvement suggestions
  generateNeuralImprovementSuggestions() {
    if (Object.keys(this.correlations).length === 0) {
      return [];
    }
    
    const suggestions = [];
    
    // Find strong correlations (positive or negative)
    Object.entries(this.correlations)
      .filter(([_, value]) => Math.abs(value) > 0.6)
      .forEach(([metric, correlation]) => {
        // Find which neural states correspond to high effectiveness
        const effectivenessEvents = this.neuralHistory.filter(
          event => event.type === 'effectiveness'
        );
        
        // Split events into high and low effectiveness
        const highEffectivenessEvents = effectivenessEvents.filter(
          event => event.score > 0.7
        );
        
        if (highEffectivenessEvents.length < 3) return;
        
        // Calculate average neural state for high effectiveness
        const optimalValues = {};
        highEffectivenessEvents.forEach(event => {
          Object.entries(event.neuralState).forEach(([key, value]) => {
            if (typeof value === 'number') {
              if (!optimalValues[key]) optimalValues[key] = [];
              optimalValues[key].push(value);
            }
          });
        });
        
        // Calculate average for each metric
        Object.entries(optimalValues).forEach(([key, values]) => {
          optimalValues[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
        });
        
        suggestions.push({
          type: 'neural_optimization',
          metric,
          correlation,
          optimalValue: optimalValues[metric],
          allOptimalValues: optimalValues,
          timestamp: new Date()
        });
      });
    
    return suggestions;
  }

  // Update the context based on neural correlations
  updateContextWithNeuralInsights() {
    const suggestions = this.generateNeuralImprovementSuggestions();
    if (suggestions.length === 0) return false;
    
    // Get context and find neural configuration sections
    const context = this.contextHandler.context;
    
    // Look for neural configuration in different possible locations
    let neuralConfig = null;
    let neuralConfigPath = '';
    
    // Common paths where neural configuration might be stored
    const possiblePaths = [
      'cognitive_profile.neural_metrics.optimal_learning_state',
      'neurointerface.optimal_states.learning',
      'neural_preferences',
      'optimal_neural_states'
    ];
    
    for (const path of possiblePaths) {
      const config = this.contextHandler.getValueAtPath(path);
      if (config) {
        neuralConfig = config;
        neuralConfigPath = path;
        break;
      }
    }
    
    // If no neural config found, create one
    if (!neuralConfig) {
      neuralConfig = {};
      neuralConfigPath = 'cognitive_profile.neural_metrics.optimal_learning_state';
      
      // Ensure path exists
      const pathParts = neuralConfigPath.split('.');
      let current = context;
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      // Set empty config
      current[pathParts[pathParts.length - 1]] = neuralConfig;
    }
    
    // Update neural configuration with optimizations
    let updateCount = 0;
    suggestions.forEach(suggestion => {
      const metric = suggestion.metric;
      const optimalValue = suggestion.optimalValue;
      
      // Calculate optimal range (±10% of optimal value)
      const min = Math.max(0, optimalValue * 0.9);
      const max = Math.min(1, optimalValue * 1.1);
      
      // Update context with new optimal range
      if (Array.isArray(neuralConfig[metric])) {
        // If already an array, update it
        neuralConfig[metric] = [min, max];
      } else {
        // Otherwise create new array
        neuralConfig[metric] = [min, max];
      }
      
      updateCount++;
    });
    
    // Add evolution record
    if (updateCount > 0) {
      this.contextHandler.evolutionHistory.push({
        type: 'neural_optimization',
        path: neuralConfigPath,
        updates: updateCount,
        timestamp: new Date(),
        applied: true
      });
    }
    
    return updateCount > 0;
  }

  // Generate a report of neural insights
  generateNeuralInsightsReport() {
    if (this.neuralHistory.length < 10) {
      return { status: "Insufficient data", recommendations: [] };
    }
    
    const report = {
      dataPoints: this.neuralHistory.length,
      correlations: this.correlations,
      strongCorrelations: Object.entries(this.correlations)
        .filter(([_, value]) => Math.abs(value) > 0.5)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .map(([metric, value]) => ({ metric, correlation: value })),
      optimalStates: {},
      recommendations: []
    };
    
    // Calculate optimal states for different activities
    const activities = [
      { name: 'learning', filterFn: e => e.type === 'effectiveness' && e.score > 0.7 },
      { name: 'focus', filterFn: e => e.neuralState?.attention_level > 0.7 },
      { name: 'relaxation', filterFn: e => e.neuralState?.relaxation_level > 0.7 }
    ];
    
    activities.forEach(activity => {
      const relevantEvents = this.neuralHistory.filter(activity.filterFn);
      if (relevantEvents.length < 3) return;
      
      const metrics = {};
      
      // Collect all metric values
      relevantEvents.forEach(event => {
        Object.entries(event.neuralState).forEach(([key, value]) => {
          if (typeof value === 'number') {
            if (!metrics[key]) metrics[key] = [];
            metrics[key].push(value);
          }
        });
      });
      
      // Calculate ranges for each metric
      const ranges = {};
      Object.entries(metrics).forEach(([key, values]) => {
        values.sort((a, b) => a - b);
        ranges[key] = [
          values[Math.floor(values.length * 0.1)], // 10th percentile
          values[Math.floor(values.length * 0.9)]  // 90th percentile
        ];
      });
      
      report.optimalStates[activity.name] = ranges;
    });
    
    // Generate recommendations
    if (report.strongCorrelations.length > 0) {
      report.strongCorrelations.forEach(({ metric, correlation }) => {
        report.recommendations.push({
          metric,
          importance: "high",
          finding: `${metric} shows ${correlation > 0 ? 'positive' : 'negative'} correlation (${correlation.toFixed(2)}) with effectiveness`,
          action: correlation > 0
            ? `Optimize content for high ${metric} states`
            : `Reduce complexity when ${metric} is high`
        });
      });
    }
    
    return report;
  }
}

module.exports = NeuralFeedbackIntegrator;