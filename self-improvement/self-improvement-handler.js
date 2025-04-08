/**
 * self-improvement-handler.js
 * 
 * Core implementation of a self-improving context handler that tracks
 * effectiveness metrics and adapts context elements accordingly.
 */

class SelfImprovingContextHandler {
    constructor(contextData) {
      this.context = contextData;
      this.usageMetrics = {};
      this.effectivenessScores = {};
      this.evolutionHistory = [];
    }
  
    // Record when a context element is accessed
    trackAccess(path) {
      if (!this.usageMetrics[path]) {
        this.usageMetrics[path] = { accessCount: 0, lastAccessed: null };
      }
      
      this.usageMetrics[path].accessCount++;
      this.usageMetrics[path].lastAccessed = new Date();
      
      return this.getValueAtPath(path);
    }
  
    // Record effectiveness of a context element
    recordEffectiveness(path, score, feedback = '') {
      if (!this.effectivenessScores[path]) {
        this.effectivenessScores[path] = [];
      }
      
      this.effectivenessScores[path].push({
        timestamp: new Date(),
        score,
        feedback
      });
      
      // Check if adaptation is needed
      this.checkForAdaptation(path);
    }
  
    // Check if context should adapt based on metrics
    checkForAdaptation(path) {
      const scores = this.effectivenessScores[path];
      if (!scores || scores.length < 5) return;
      
      // Get average of last 5 scores
      const recent = scores.slice(-5);
      const avg = recent.reduce((sum, item) => sum + item.score, 0) / recent.length;
      
      // If consistently low scores, suggest improvement
      if (avg < 0.5) {
        this.suggestImprovement(path, avg, recent);
      }
      
      // If consistently high scores but low usage, suggest promotion
      if (avg > 0.8 && this.usageMetrics[path] && this.usageMetrics[path].accessCount > 10) {
        this.suggestPromotion(path, avg);
      }
    }
  
    // Suggest improvement for low-performing context element
    suggestImprovement(path, score, recentScores) {
      // Analyze feedback for common themes
      const feedbackAnalysis = this.analyzeFeedback(
        recentScores.map(item => item.feedback).filter(Boolean)
      );
      
      const suggestion = {
        type: 'improve',
        path,
        currentScore: score,
        feedback: feedbackAnalysis,
        timestamp: new Date(),
        applied: false
      };
      
      this.evolutionHistory.push(suggestion);
      return suggestion;
    }
  
    // Suggest promotion for high-value context element
    suggestPromotion(path, score) {
      const pathParts = path.split('.');
      // Don't promote if already at top level
      if (pathParts.length <= 1) return;
      
      const suggestion = {
        type: 'promote',
        path,
        currentScore: score,
        targetPath: pathParts.slice(0, -1).join('.'),
        timestamp: new Date(),
        applied: false
      };
      
      this.evolutionHistory.push(suggestion);
      return suggestion;
    }
  
    // Apply a suggested improvement
    applyImprovement(suggestionIndex, newValue) {
      if (suggestionIndex >= this.evolutionHistory.length) return false;
      
      const suggestion = this.evolutionHistory[suggestionIndex];
      if (suggestion.applied) return false;
      
      // For 'improve' type, update the value
      if (suggestion.type === 'improve' && newValue !== undefined) {
        this.setValueAtPath(suggestion.path, newValue);
        suggestion.applied = true;
        suggestion.appliedValue = newValue;
        return true;
      }
      
      // For 'promote' type, move element higher in hierarchy
      if (suggestion.type === 'promote') {
        const currentValue = this.getValueAtPath(suggestion.path);
        const pathParts = suggestion.path.split('.');
        const key = pathParts[pathParts.length - 1];
        
        // Create or update parent object with promoted property
        const parentObj = this.getValueAtPath(suggestion.targetPath) || {};
        parentObj[key] = currentValue;
        this.setValueAtPath(suggestion.targetPath, parentObj);
        
        suggestion.applied = true;
        return true;
      }
      
      return false;
    }
  
    // Helper to analyze feedback text for improvement suggestions
    analyzeFeedback(feedbackList) {
      if (feedbackList.length === 0) return "No feedback available";
      
      // Simple word frequency analysis (would be more sophisticated in production)
      const words = feedbackList.join(' ').toLowerCase().split(/\W+/).filter(Boolean);
      const wordFreq = {};
      
      words.forEach(word => {
        if (word.length < 3) return; // Skip short words
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
      
      // Get top themes
      const sortedWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, freq]) => word);
      
      return `Common themes: ${sortedWords.join(', ')}`;
    }
  
    // Helper to get value at a path in the context
    getValueAtPath(path) {
      const parts = path.split('.');
      let current = this.context;
      
      for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
      }
      
      return current;
    }
  
    // Helper to set value at a path in the context
    setValueAtPath(path, value) {
      const parts = path.split('.');
      const lastPart = parts.pop();
      let current = this.context;
      
      for (const part of parts) {
        if (current[part] === undefined || current[part] === null) {
          current[part] = {};
        }
        current = current[part];
      }
      
      current[lastPart] = value;
      return true;
    }
  
    // Get pending improvement suggestions
    getPendingImprovements() {
      return this.evolutionHistory.filter(item => !item.applied);
    }
  
    // Export the current context with metrics
    exportContext() {
      return {
        context: this.context,
        metadata: {
          usageMetrics: this.usageMetrics,
          evolutionHistory: this.evolutionHistory
        }
      };
    }
  }
  
  module.exports = SelfImprovingContextHandler;