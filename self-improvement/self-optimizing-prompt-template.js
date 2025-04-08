/**
 * self-optimizing-prompt-template.js
 * 
 * Creates instruction blocks that self-optimize based on effectiveness metrics
 * and adaptation history.
 */

class SelfOptimizingPromptTemplate {
    constructor(initialTemplate = {}) {
      this.template = initialTemplate;
      this.optimizationHistory = [];
      this.effectivenessScores = [];
      this.experiments = {};
      this.currentExperiment = null;
    }
  
    // Get current template
    getTemplate() {
      return {...this.template};
    }
  
    // Get a component of the template
    getComponent(path) {
      const parts = path.split('.');
      let current = this.template;
      
      for (const part of parts) {
        if (current === undefined || current === null) {
          return undefined;
        }
        current = current[part];
      }
      
      return current;
    }
  
    // Set a component of the template
    setComponent(path, value) {
      const parts = path.split('.');
      const lastPart = parts.pop();
      let current = this.template;
      
      // Create path if it doesn't exist
      for (const part of parts) {
        if (current[part] === undefined || current[part] === null) {
          current[part] = {};
        }
        current = current[part];
      }
      
      // Set the value
      current[lastPart] = value;
      
      // Record this change
      this.optimizationHistory.push({
        timestamp: new Date(),
        type: 'manual_update',
        path,
        previousValue: current[lastPart],
        newValue: value
      });
      
      return true;
    }
  
    // Record effectiveness score for the current template
    recordEffectiveness(score, metadata = {}) {
      this.effectivenessScores.push({
        timestamp: new Date(),
        score,
        template: JSON.parse(JSON.stringify(this.template)),
        experiment: this.currentExperiment,
        metadata
      });
      
      // If we're running an experiment, record score for variant
      if (this.currentExperiment) {
        if (!this.experiments[this.currentExperiment].variantScores) {
          this.experiments[this.currentExperiment].variantScores = [];
        }
        
        this.experiments[this.currentExperiment].variantScores.push({
          timestamp: new Date(),
          score,
          metadata
        });
        
        // Check if experiment should be concluded
        this.checkExperimentConclusion();
      }
      
      // Check if we should optimize based on new data
      return this.checkForOptimization();
    }
  
    // Create an experiment with a variant of the template
    createExperiment(name, pathToVary, variantValue, description = '') {
      // Save original value
      const originalValue = this.getComponent(pathToVary);
      
      // Create experiment record
      this.experiments[name] = {
        name,
        pathToVary,
        originalValue,
        variantValue,
        description,
        startTime: new Date(),
        status: 'created',
        variantScores: [],
        baselineScores: this.getBaselineScores()
      };
      
      return true;
    }
  
    // Start running an experiment
    startExperiment(name) {
      if (!this.experiments[name]) {
        return false;
      }
      
      const experiment = this.experiments[name];
      
      if (experiment.status !== 'created') {
        return false;
      }
      
      // Apply variant value
      this.setComponent(experiment.pathToVary, experiment.variantValue);
      
      // Update experiment status
      experiment.status = 'running';
      experiment.startTime = new Date();
      
      // Set as current experiment
      this.currentExperiment = name;
      
      // Record this action
      this.optimizationHistory.push({
        timestamp: new Date(),
        type: 'experiment_start',
        experiment: name,
        path: experiment.pathToVary,
        previousValue: experiment.originalValue,
        newValue: experiment.variantValue
      });
      
      return true;
    }
  
    // Get baseline scores for comparison
    getBaselineScores() {
      // Get last 5 scores before any experiment
      return this.effectivenessScores
        .filter(record => !record.experiment)
        .slice(-5)
        .map(record => record.score);
    }
  
    // Check if an experiment should be concluded
    checkExperimentConclusion() {
      if (!this.currentExperiment) {
        return false;
      }
      
      const experiment = this.experiments[this.currentExperiment];
      
      // Need at least 5 scores to evaluate
      if (!experiment.variantScores || experiment.variantScores.length < 5) {
        return false;
      }
      
      // Get baseline scores
      const baselineScores = experiment.baselineScores;
      
      // Need baseline scores for comparison
      if (!baselineScores || baselineScores.length === 0) {
        return false;
      }
      
      // Calculate averages
      const baselineAvg = baselineScores.reduce((sum, score) => sum + score, 0) / baselineScores.length;
      
      const variantScores = experiment.variantScores.map(record => record.score);
      const variantAvg = variantScores.reduce((sum, score) => sum + score, 0) / variantScores.length;
      
      // Determine if variant is better
      const improvement = variantAvg - baselineAvg;
      const percentImprovement = improvement / baselineAvg * 100;
      
      // Evaluate result - consider significant if >10% improvement
      const isSignificant = Math.abs(percentImprovement) > 10;
      const isImprovement = improvement > 0;
      
      // Conclude experiment
      const conclusion = {
        baselineAvg,
        variantAvg,
        improvement,
        percentImprovement,
        isSignificant,
        isImprovement,
        decision: isImprovement ? 'keep_variant' : 'revert_to_original'
      };
      
      // Apply conclusion
      if (conclusion.decision === 'revert_to_original') {
        // Revert to original
        this.setComponent(experiment.pathToVary, experiment.originalValue);
      }
      // If keeping variant, it's already applied
      
      // Update experiment status
      experiment.status = 'concluded';
      experiment.endTime = new Date();
      experiment.conclusion = conclusion;
      
      // Record conclusion
      this.optimizationHistory.push({
        timestamp: new Date(),
        type: 'experiment_conclusion',
        experiment: this.currentExperiment,
        conclusion
      });
      
      // Reset current experiment
      this.currentExperiment = null;
      
      return true;
    }
  
    // Check if optimization should occur based on effectiveness
    checkForOptimization() {
      // Need at least 10 scores to detect patterns
      if (this.effectivenessScores.length < 10) {
        return false;
      }
      
      // Don't optimize while experiment is running
      if (this.currentExperiment) {
        return false;
      }
      
      // Check for declining effectiveness
      const recent = this.effectivenessScores.slice(-5);
      const previous = this.effectivenessScores.slice(-10, -5);
      
      const recentAvg = recent.reduce((sum, record) => sum + record.score, 0) / recent.length;
      const previousAvg = previous.reduce((sum, record) => sum + record.score, 0) / previous.length;
      
      const decline = previousAvg - recentAvg;
      const percentDecline = decline / previousAvg * 100;
      
      // If effectiveness is declining significantly, suggest optimization
      if (percentDecline > 15) {
        return this.suggestOptimization();
      }
      
      return false;
    }
  
    // Suggest optimization based on patterns
    suggestOptimization() {
      // Analyze which template sections might need improvement
      const componentAnalysis = this.analyzeComponentEffectiveness();
      
      // Find the component with the strongest correlation to effectiveness
      const targetComponent = Object.entries(componentAnalysis)
        .sort((a, b) => Math.abs(b[1].correlation) - Math.abs(a[1].correlation))
        [0];
      
      if (!targetComponent) {
        return false;
      }
      
      const [path, analysis] = targetComponent;
      
      // Generate suggested improvements
      const suggestions = [];
      
      if (analysis.correlation < -0.5) {
        // Negative correlation - component might be harmful
        suggestions.push({
          type: 'structure',
          path,
          action: 'simplify',
          reason: 'Strong negative correlation with effectiveness',
          confidence: Math.abs(analysis.correlation)
        });
      } else if (analysis.correlation > 0.5) {
        // Positive correlation - component is working well, enhance it
        suggestions.push({
          type: 'structure',
          path,
          action: 'enhance',
          reason: 'Strong positive correlation with effectiveness',
          confidence: analysis.correlation
        });
      }
      
      // Check length patterns
      if (analysis.lengthCorrelation && Math.abs(analysis.lengthCorrelation) > 0.4) {
        suggestions.push({
          type: 'length',
          path,
          action: analysis.lengthCorrelation > 0 ? 'expand' : 'shorten',
          reason: `${analysis.lengthCorrelation > 0 ? 'Positive' : 'Negative'} correlation between length and effectiveness`,
          confidence: Math.abs(analysis.lengthCorrelation)
        });
      }
      
      // Record suggestions
      this.optimizationHistory.push({
        timestamp: new Date(),
        type: 'optimization_suggestions',
        suggestions
      });
      
      return suggestions;
    }
  
    // Analyze which components correlate with effectiveness
    analyzeComponentEffectiveness() {
      const result = {};
      
      // Helper function to extract all paths from template
      const extractPaths = (obj, basePath = '') => {
        const paths = [];
        
        for (const key in obj) {
          const path = basePath ? `${basePath}.${key}` : key;
          paths.push(path);
          
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            paths.push(...extractPaths(obj[key], path));
          }
        }
        
        return paths;
      };
      
      // Get all paths
      const allPaths = extractPaths(this.template);
      
      // Calculate correlation for each path
      allPaths.forEach(path => {
        // Collect data points
        const dataPoints = [];
        
        this.effectivenessScores.forEach(record => {
          const value = this.getValueFromPath(record.template, path);
          
          if (value !== undefined) {
            // For non-string values, just check presence
            if (typeof value !== 'string') {
              dataPoints.push({
                present: true,
                score: record.score
              });
              return;
            }
            
            // For string values, track length and content
            dataPoints.push({
              present: true,
              length: value.length,
              complexity: this.estimateComplexity(value),
              score: record.score
            });
          } else {
            dataPoints.push({
              present: false,
              score: record.score
            });
          }
        });
        
        // Calculate correlation between presence and score
        const presenceX = dataPoints.map(point => point.present ? 1 : 0);
        const scores = dataPoints.map(point => point.score);
        const presenceCorrelation = this.calculateCorrelation(presenceX, scores);
        
        // Calculate correlation between length and score (if applicable)
        let lengthCorrelation = null;
        const pointsWithLength = dataPoints.filter(point => point.length !== undefined);
        if (pointsWithLength.length > 5) {
          const lengths = pointsWithLength.map(point => point.length);
          const lengthScores = pointsWithLength.map(point => point.score);
          lengthCorrelation = this.calculateCorrelation(lengths, lengthScores);
        }
        
        // Calculate correlation between complexity and score (if applicable)
        let complexityCorrelation = null;
        const pointsWithComplexity = dataPoints.filter(point => point.complexity !== undefined);
        if (pointsWithComplexity.length > 5) {
          const complexities = pointsWithComplexity.map(point => point.complexity);
          const complexityScores = pointsWithComplexity.map(point => point.score);
          complexityCorrelation = this.calculateCorrelation(complexities, complexityScores);
        }
        
        result[path] = {
          correlation: presenceCorrelation,
          lengthCorrelation,
          complexityCorrelation,
          dataPoints: dataPoints.length
        };
      });
      
      return result;
    }
  
    // Apply an automated optimization
    applyOptimization(suggestion) {
      if (!suggestion || !suggestion.path) {
        return false;
      }
      
      const path = suggestion.path;
      const currentValue = this.getComponent(path);
      
      if (currentValue === undefined) {
        return false;
      }
      
      // Apply optimization based on suggestion type
      let newValue = currentValue;
      
      if (suggestion.type === 'length') {
        if (typeof currentValue === 'string') {
          if (suggestion.action === 'shorten' && currentValue.length > 50) {
            // Simplistic shortening for demonstration
            newValue = currentValue.split('. ').slice(0, -1).join('. ') + '.';
          } else if (suggestion.action === 'expand') {
            // For expansion, we'd need more sophisticated logic
            // This would use AI generation in a real implementation
            newValue = currentValue + ' This expanded version includes additional details.';
          }
        }
      } else if (suggestion.type === 'structure') {
        if (suggestion.action === 'simplify' && typeof currentValue === 'object') {
          // Simplify by removing nested elements
          // This is simplified for demonstration
          newValue = {};
          for (const key in currentValue) {
            if (typeof currentValue[key] !== 'object') {
              newValue[key] = currentValue[key];
            }
          }
        }
        // Other structural optimizations would be more complex
      }
      
      // Apply the change
      this.setComponent(path, newValue);
      
      // Record the optimization
      this.optimizationHistory.push({
        timestamp: new Date(),
        type: 'automated_optimization',
        path,
        action: suggestion.action,
        previousValue: currentValue,
        newValue
      });
      
      return true;
    }
  
    // Helper functions
    
    // Get value at path from object
    getValueFromPath(obj, path) {
      const parts = path.split('.');
      let current = obj;
      
      for (const part of parts) {
        if (current === undefined || current === null) {
          return undefined;
        }
        current = current[part];
      }
      
      return current;
    }
    
    // Calculate correlation between two arrays
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
    
    // Estimate complexity of text content
    estimateComplexity(text) {
      if (typeof text !== 'string') return 0;
      
      // Simple complexity estimation based on:
      // - Sentence length
      // - Word length
      // - Punctuation variety
      
      // Count sentences
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const sentenceCount = sentences.length;
      
      if (sentenceCount === 0) return 0;
      
      // Count words
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      
      // Average word length
      const totalChars = words.reduce((sum, word) => sum + word.length, 0);
      const avgWordLength = wordCount > 0 ? totalChars / wordCount : 0;
      
      // Average sentence length
      const avgSentenceLength = wordCount / sentenceCount;
      
      // Punctuation variety
      const punctuation = (text.match(/[;:,'"()\[\]{}]/g) || []).length;
      const punctuationVariety = punctuation / text.length;
      
      // Calculate weighted complexity score
      return (
        avgSentenceLength * 0.4 +
        avgWordLength * 0.3 +
        punctuationVariety * 40
      );
    }
  
    // Generate optimization report
    generateOptimizationReport() {
      return {
        template: this.template,
        effectiveness: {
          dataPoints: this.effectivenessScores.length,
          averageScore: this.calculateAverageEffectiveness(),
          trend: this.calculateEffectivenessTrend()
        },
        experiments: Object.values(this.experiments).map(exp => ({
          name: exp.name,
          status: exp.status,
          path: exp.pathToVary,
          improvement: exp.conclusion ? exp.conclusion.percentImprovement : null,
          significant: exp.conclusion ? exp.conclusion.isSignificant : null
        })),
        optimization: {
          count: this.optimizationHistory.filter(h => 
            h.type === 'automated_optimization' || 
            h.type === 'experiment_conclusion'
          ).length,
          lastOptimization: this.optimizationHistory
            .filter(h => h.type === 'automated_optimization')
            .slice(-1)[0]
        },
        insights: this.generateOptimizationInsights()
      };
    }
  
    // Calculate average effectiveness
    calculateAverageEffectiveness() {
      if (this.effectivenessScores.length === 0) return 0;
      
      return this.effectivenessScores.reduce((sum, record) => 
        sum + record.score, 0) / this.effectivenessScores.length;
    }
  
    // Calculate effectiveness trend
    calculateEffectivenessTrend() {
      if (this.effectivenessScores.length < 5) {
        return { trend: "insufficient_data" };
      }
      
      // Compare first and last 5 scores
      const first5 = this.effectivenessScores.slice(0, 5);
      const last5 = this.effectivenessScores.slice(-5);
      
      const first5Avg = first5.reduce((sum, record) => sum + record.score, 0) / 5;
      const last5Avg = last5.reduce((sum, record) => sum + record.score, 0) / 5;
      
      const change = last5Avg - first5Avg;
      const percentChange = (change / first5Avg) * 100;
      
      let trend;
      if (percentChange > 20) {
        trend = "strong_improvement";
      } else if (percentChange > 5) {
        trend = "moderate_improvement";
      } else if (percentChange >= -5) {
        trend = "stable";
      } else if (percentChange >= -20) {
        trend = "moderate_decline";
      } else {
        trend = "significant_decline";
      }
      
      return {
        initialAverage: first5Avg,
        currentAverage: last5Avg,
        change,
        percentChange,
        trend
      };
    }
  
    // Generate optimization insights
    generateOptimizationInsights() {
      const insights = [];
      
      // Check effectiveness trend
      const trend = this.calculateEffectivenessTrend();
      if (trend.trend && trend.trend !== "insufficient_data") {
        insights.push({
          type: "effectiveness_trend",
          trend: trend.trend,
          description: `Effectiveness has ${trend.trend.replace('_', ' ')} over time (${trend.percentChange.toFixed(1)}% change)`
        });
      }
      
      // Check experiment results
      const completedExperiments = Object.values(this.experiments)
        .filter(exp => exp.status === 'concluded');
      
      if (completedExperiments.length > 0) {
        const successfulExperiments = completedExperiments
          .filter(exp => exp.conclusion && exp.conclusion.isImprovement);
        
        insights.push({
          type: "experiment_results",
          total: completedExperiments.length,
          successful: successfulExperiments.length,
          success_rate: (successfulExperiments.length / completedExperiments.length * 100).toFixed(1) + '%',
          best_improvement: this.findBestExperiment()
        });
      }
      
      // Check component effectiveness
      const componentAnalysis = this.analyzeComponentEffectiveness();
      const significantComponents = Object.entries(componentAnalysis)
        .filter(([_, analysis]) => Math.abs(analysis.correlation) > 0.5)
        .sort((a, b) => Math.abs(b[1].correlation) - Math.abs(a[1].correlation));
      
      if (significantComponents.length > 0) {
        insights.push({
          type: "component_effectiveness",
          components: significantComponents.slice(0, 3).map(([path, analysis]) => ({
            path,
            correlation: analysis.correlation.toFixed(2),
            impact: analysis.correlation > 0 ? "positive" : "negative"
          }))
        });
      }
      
      return insights;
    }
  
    // Find the most successful experiment
    findBestExperiment() {
      const completedExperiments = Object.values(this.experiments)
        .filter(exp => exp.status === 'concluded' && exp.conclusion);
      
      if (completedExperiments.length === 0) {
        return null;
      }
      
      const bestExperiment = completedExperiments.reduce((best, current) => {
        if (!best || (current.conclusion.improvement > best.conclusion.improvement)) {
          return current;
        }
        return best;
      }, null);
      
      if (!bestExperiment) {
        return null;
      }
      
      return {
        name: bestExperiment.name,
        path: bestExperiment.pathToVary,
        improvement: bestExperiment.conclusion.percentImprovement.toFixed(1) + '%'
      };
    }
  }
  
  // Example usage: Create a self-optimizing instruction template
  function createInstructionTemplate() {
    const initialTemplate = {
      primary: "Use this context to provide personalized assistance",
      context_update: "Update context when new information is learned",
      special_rules: [
        "Prioritize user's stated goals",
        "Reference relevant context elements"
      ],
      formatting: {
        response_length: "concise",
        tone: "helpful"
      }
    };
    
    return new SelfOptimizingPromptTemplate(initialTemplate);
  }
  
  module.exports = { SelfOptimizingPromptTemplate, createInstructionTemplate };