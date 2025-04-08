# Self-Improving Context Framework

This collection of implementations demonstrates how Personal Context Technology can evolve and improve over time through usage patterns, neural feedback, and automated optimization strategies.

[![GitHub stars](https://img.shields.io/github/stars/mikhashev/personal-context-manager.svg)](https://github.com/mikhashev/personal-context-manager/stargazers)
[![License](https://img.shields.io/github/license/mikhashev/personal-context-manager.svg)](https://github.com/mikhashev/personal-context-manager/blob/main/LICENSE)

## Documentation

For a complete understanding of the Self-Improving Context Framework, please refer to these documentation resources:

- [Theoretical Framework](../docs/self-improvement-framework.md) - Comprehensive explanation of the principles and architecture
- [Visual Diagrams](../docs/self-improvement-diagrams.md) - Flowcharts and visual representations of the system components and interactions

## Overview

The Self-Improving Context Framework extends the core Personal Context Manager (PCM) with advanced adaptation capabilities, allowing context structures to evolve based on real-world performance metrics and neural feedback.

Key components:

- **Metrics tracking** - Collects usage patterns and effectiveness scores
- **Neural integration** - Correlates brain activity with context effectiveness
- **Automated adaptation** - Suggests and applies improvements based on observed patterns
- **Experimentation** - Tests variant approaches to optimize performance

## Components

### 1. Self-Improving Context Handler

Core implementation that tracks usage metrics and adapts context elements based on effectiveness scores.

```javascript
const contextHandler = new SelfImprovingContextHandler(myContextData);

// Track when a context element is used
const value = contextHandler.trackAccess('preferences.learning_style');

// Record effectiveness score (0-1) with optional feedback
contextHandler.recordEffectiveness('goals.short_term[0]', 0.85, 
  'This goal was clearly structured and easy to act upon');

// Get pending improvement suggestions
const suggestions = contextHandler.getPendingImprovements();

// Apply a suggested improvement
if (suggestions.length > 0) {
  contextHandler.applyImprovement(0, newImprovedValue);
}

// Export context with all metrics and history
const exportedData = contextHandler.exportContext();
```

#### Example Usage: Self-Improving Personal Goals

```javascript
// Initialize with personal context data
const userContext = {
  basic_info: { name: "Alex", focus_areas: ["programming", "machine learning"] },
  goals: {
    short_term: [
      { id: 1, description: "Complete JavaScript course", deadline: "2025-05-30" },
      { id: 2, description: "Build a personal project", deadline: "2025-06-15" }
    ]
  },
  preferences: { learning_style: "project-based" }
};

// Create handler
const handler = new SelfImprovingContextHandler(userContext);

// In your application, track when a goal is viewed
app.on('goalViewed', (goalPath) => {
  handler.trackAccess(goalPath);
});

// When a goal is completed, record effectiveness
app.on('goalCompleted', (goalPath, completionQuality, feedback) => {
  // Convert completion quality (1-10) to effectiveness score (0-1)
  const score = completionQuality / 10;
  handler.recordEffectiveness(goalPath, score, feedback);
  
  // Check for suggested improvements
  const suggestions = handler.getPendingImprovements();
  
  if (suggestions.length > 0) {
    // If effectiveness is consistently low, handler might suggest
    // restructuring the goal to be more specific or actionable
    console.log("Suggested improvement:", suggestions[0]);
    
    // You could apply this automatically or prompt the user
    if (userPreferences.autoImprove) {
      const newValue = AI.generateImprovedGoal(
        handler.getValueAtPath(suggestions[0].path),
        suggestions[0].feedback
      );
      handler.applyImprovement(0, newValue);
    } else {
      UI.promptForImprovement(suggestions[0]);
    }
  }
});

// Periodically export context with all metrics for persistence
setInterval(() => {
  const exportedData = handler.exportContext();
  Storage.saveContext(exportedData);
}, 3600000); // hourly
```

### 2. Neural Feedback Integration

Connects neural interface data with context adaptation, allowing AI to optimize based on brain activity.

```javascript
// Create with a context handler and neural device adapter
const neuralIntegrator = new NeuralFeedbackIntegrator(
  contextHandler, 
  neuralAdapter
);

// Record neural state with context access
await neuralIntegrator.trackAccessWithNeuralState(
  'cognitive_profile.focus_state'
);

// Record effectiveness with neural state
await neuralIntegrator.recordEffectivenessWithNeuralState(
  'learning_roadmap.current_topic', 
  0.92, 
  'Great focus and retention'
);

// Update context based on neural correlations
neuralIntegrator.updateContextWithNeuralInsights();

// Generate report of neural insights
const report = neuralIntegrator.generateNeuralInsightsReport();
console.log(report.recommendations);
```

#### Example Usage: Neural-Optimized Learning Platform

```javascript
// Initialize components
const userContext = loadUserContext();
const contextHandler = new SelfImprovingContextHandler(userContext);

// Create adapter for EMOTIV headset
const emotivAdapter = {
  async getCurrentState() {
    const rawData = await emotivDevice.getSensorData();
    
    // Process raw EEG data into relevant cognitive metrics
    return {
      attention_level: processBetaWaves(rawData.beta) / 100,
      relaxation_level: processAlphaWaves(rawData.alpha) / 100,
      mental_effort: processThetaBetaRatio(rawData) / 100,
      engagement: calculateEngagement(rawData) / 100,
      cognitive_load: estimateCognitiveLoad(rawData) / 100
    };
  }
};

// Create neural integrator
const neuralLearning = new NeuralFeedbackIntegrator(
  contextHandler, 
  emotivAdapter
);

// In your learning application
learningApp.on('lessonStarted', async (lessonPath) => {
  // Track which lesson is accessed along with neural state
  await neuralLearning.trackAccessWithNeuralState(lessonPath);
  
  // Get current neural state to adapt content presentation
  const neuralState = await emotivAdapter.getCurrentState();
  
  if (neuralState.cognitive_load > 0.8) {
    // Reduce complexity if cognitive load is high
    UI.simplifyContent();
  } else if (neuralState.attention_level < 0.4) {
    // Increase engagement if attention is low
    UI.presentInteractiveElement();
  }
});

// After lesson completion, record effectiveness with neural data
learningApp.on('lessonCompleted', async (lessonPath, quizScore, feedback) => {
  // Convert quiz score (0-100) to effectiveness (0-1)
  const effectiveness = quizScore / 100;
  
  await neuralLearning.recordEffectivenessWithNeuralState(
    lessonPath, 
    effectiveness, 
    feedback
  );
  
  // Update context based on neural insights weekly
  if (isWeeklyUpdateTime()) {
    neuralLearning.updateContextWithNeuralInsights();
    
    // Generate report for the user
    const insightsReport = neuralLearning.generateNeuralInsightsReport();
    
    // Update optimal learning state parameters
    contextHandler.setValueAtPath(
      'cognitive_profile.optimal_learning_state',
      insightsReport.optimalStates.learning
    );
    
    // Show learning insights to user
    UI.presentInsights(insightsReport.recommendations);
  }
});
```

### 3. Context Evolution Tracker

Analyzes how context structures evolve over time, identifying patterns to improve context quality.

```javascript
const evolutionTracker = new ContextEvolutionTracker();

// Record a new version of the context
evolutionTracker.recordContextVersion(context, {
  version: '1.2',
  timestamp: new Date()
});

// Update effectiveness score for a specific component
evolutionTracker.updateEffectivenessScore(
  '1.2', 
  'instruction.primary', 
  0.88, 
  'Clear and actionable'
);

// Generate evolution insights and recommendations
const insights = evolutionTracker.generateEvolutionInsights();
console.log(insights.recommendations);
```

#### Example Usage: Context Evolution Dashboard

```javascript
// Initialize evolution tracker
const evolutionTracker = new ContextEvolutionTracker();

// Load version history from storage
const versionHistory = await Storage.loadVersionHistory();

// Record all historical versions
versionHistory.forEach(version => {
  evolutionTracker.recordContextVersion(
    version.context,
    {
      version: version.version,
      timestamp: version.timestamp,
      author: version.author
    }
  );
  
  // If effectiveness data exists for this version, record it
  if (version.effectiveness) {
    Object.entries(version.effectiveness).forEach(([path, data]) => {
      evolutionTracker.updateEffectivenessScore(
        version.version,
        path,
        data.score,
        data.feedback
      );
    });
  }
});

// On context edit page, show evolution insights
function renderEvolutionDashboard() {
  // Generate insights and recommendations
  const evolutionData = evolutionTracker.generateEvolutionInsights();
  
  // Render summary metrics
  UI.renderTimeline({
    versions: evolutionData.summary.versions,
    timespan: evolutionData.summary.timespan,
    growthRate: evolutionData.summary.growthRate,
    effectivenessProgress: evolutionData.summary.effectivenessProgress
  });
  
  // Render top changes visualization
  UI.renderChangesHeatmap(evolutionData.summary.topChanges.changeDistribution);
  
  // Render recommendations
  UI.renderRecommendations(evolutionData.recommendations);
  
  // Render evolution path
  UI.renderEvolutionPath(evolutionData.evolutionPath);
}

// When saving a new context version
async function saveContextVersion(newContext) {
  const version = getNextVersionNumber();
  const timestamp = new Date();
  
  // Record in evolution tracker
  evolutionTracker.recordContextVersion(newContext, {
    version,
    timestamp,
    author: currentUser.name
  });
  
  // Save to storage
  await Storage.saveContextVersion({
    context: newContext,
    version,
    timestamp,
    author: currentUser.name
  });
  
  // Update dashboard
  renderEvolutionDashboard();
  
  // Show specific recommendations for this update
  const versionMetrics = evolutionTracker.getVersionMetrics(version);
  
  if (versionMetrics.structural.changedPaths?.added.length > 10) {
    UI.showNotification(
      "You've added many new elements. Consider organizing them into categories."
    );
  }
  
  if (versionMetrics.structural.depth > 5) {
    UI.showNotification(
      "Context is getting deep. Consider flattening some deeply nested structures."
    );
  }
}
```

### 4. Self-Optimizing Prompt Template

Creates instruction blocks that self-optimize based on effectiveness metrics and adaptation history.

```javascript
// Create with initial template
const templateOptimizer = new SelfOptimizingPromptTemplate({
  primary: "Use this context to provide personalized assistance",
  context_update: "Update context when new information is learned"
});

// Get current template
const currentTemplate = templateOptimizer.getTemplate();

// Record effectiveness score
templateOptimizer.recordEffectiveness(0.76, {
  user_satisfaction: 4,
  context: 'Learning session'
});

// Create an experiment with a variant
templateOptimizer.createExperiment(
  'expanded_primary',
  'primary',
  'Use this context to provide personalized assistance tailored to cognitive state',
  'Testing if more specific primary instruction improves effectiveness'
);

// Start the experiment
templateOptimizer.startExperiment('expanded_primary');

// Generate optimization report
const report = templateOptimizer.generateOptimizationReport();
```

#### Example Usage: Self-Optimizing AI Instructions

```javascript
// Initialize with default instruction template
const defaultTemplate = {
  primary: "Use this context to assist me in developing and promoting the personal-context-manager project",
  context_update: "Update context when new progress is reported",
  special_rules: [
    "Prioritize tasks that align with my focus times",
    "Suggest social media strategies to increase visibility"
  ],
  formatting: {
    response_length: "concise",
    tone: "technical"
  }
};

const promptOptimizer = new SelfOptimizingPromptTemplate(defaultTemplate);

// In your AI interaction system
class AIInteractionManager {
  constructor(promptOptimizer) {
    this.promptOptimizer = promptOptimizer;
    this.currentExperiment = null;
    this.experimentCounter = 0;
  }
  
  async getInstructionBlock() {
    // Check if we should run an experiment (every 20 interactions)
    if (this.experimentCounter % 20 === 0 && !this.currentExperiment) {
      this.createNewExperiment();
    }
    
    // Get current template
    return this.promptOptimizer.getTemplate();
  }
  
  createNewExperiment() {
    // Rotate through different experiment types
    const experimentType = this.experimentCounter % 3;
    
    if (experimentType === 0) {
      // Test more specific primary instruction
      const experimentName = `primary_specificity_${Date.now()}`;
      this.promptOptimizer.createExperiment(
        experimentName,
        'primary',
        "Use this context to assist me in developing and promoting the personal-context-manager project, focusing on neural interface integration and open-source community growth",
        'Testing if more specific primary instruction improves relevance'
      );
      this.promptOptimizer.startExperiment(experimentName);
      this.currentExperiment = experimentName;
    } 
    else if (experimentType === 1) {
      // Test different tone
      const experimentName = `tone_${Date.now()}`;
      this.promptOptimizer.createExperiment(
        experimentName,
        'formatting.tone',
        this.promptOptimizer.getComponent('formatting.tone') === 'technical' ? 'conversational' : 'technical',
        'Testing if tone affects engagement'
      );
      this.promptOptimizer.startExperiment(experimentName);
      this.currentExperiment = experimentName;
    }
    else {
      // Test different response length preference
      const experimentName = `length_${Date.now()}`;
      this.promptOptimizer.createExperiment(
        experimentName,
        'formatting.response_length',
        this.promptOptimizer.getComponent('formatting.response_length') === 'concise' ? 'detailed' : 'concise',
        'Testing if response length affects comprehension'
      );
      this.promptOptimizer.startExperiment(experimentName);
      this.currentExperiment = experimentName;
    }
    
    this.experimentCounter++;
  }
  
  recordFeedback(score, metadata) {
    // Record effectiveness
    this.promptOptimizer.recordEffectiveness(score, metadata);
    
    // This may automatically conclude experiment if enough data
    if (this.currentExperiment && 
        this.promptOptimizer.experiments[this.currentExperiment]?.status === 'concluded') {
      // Experiment concluded automatically
      this.currentExperiment = null;
    }
  }
  
  generateOptimizationReport() {
    return this.promptOptimizer.generateOptimizationReport();
  }
}

// Usage in application
const aiManager = new AIInteractionManager(promptOptimizer);

app.on('aiInteractionRequest', async (context) => {
  // Get current instruction template
  const instructionBlock = await aiManager.getInstructionBlock();
  
  // Use it to generate AI response
  const response = await AI.generateResponse(context, instructionBlock);
  
  // Send to user
  UI.displayResponse(response);
});

// When user provides feedback
app.on('userFeedback', (feedbackData) => {
  aiManager.recordFeedback(feedbackData.score / 5, {
    satisfaction: feedbackData.satisfaction,
    helpfulness: feedbackData.helpfulness,
    relevance: feedbackData.relevance,
    context: feedbackData.context
  });
});

// Admin dashboard shows optimization insights
app.on('adminDashboardRequest', () => {
  const report = aiManager.generateOptimizationReport();
  
  AdminUI.renderOptimizationReport({
    effectiveness: report.effectiveness,
    experiments: report.experiments,
    insights: report.insights
  });
});
```

## Integration with PCM

The Self-Improving Context Framework integrates with the core PCM components:

1. **Context Structure** - Automatically adjusts organization based on usage patterns
2. **Instruction Block** - Tests variations to optimize AI response quality
3. **Neural Interface** - Connects neural data with context adaptation
4. **MCP Server** - Enables persistent optimization across sessions

## Neural Interface Applications

This framework supports integration with EEG devices from:

- **Muse**
- **EMOTIV**
- **OpenBCI**

Neural data is used to:

1. Identify optimal cognitive states for different tasks
2. Customize context presentation based on current neural state
3. Evolve context structure based on neural effectiveness correlations

## Example Use Cases

### Self-Evolving Learning Templates

```javascript
// Record learning effectiveness with neural data
await neuralIntegrator.recordEffectivenessWithNeuralState(
  'learning_templates.spaced_repetition', 
  0.89, 
  'High retention rate observed'
);

// System automatically identifies that theta/alpha ratio correlates 
// with learning effectiveness and updates optimal states
```

### Adaptive Instruction Optimization

```javascript
// Create experiment with more directive instruction style
templateOptimizer.createExperiment(
  'directive_style',
  'formatting.tone',
  'authoritative',
  'Testing if more directive tone improves task completion'
);

// After collecting 10+ effectiveness scores, system determines
// which instruction style works better for this particular use case
```

## Getting Started

1. Install the framework:

```bash
npm install @personal-context-manager/self-improvement
```

2. Initialize the core components:

```javascript
const { SelfImprovingContextHandler, NeuralFeedbackIntegrator } = 
  require('@personal-context-manager/self-improvement');

// Create handler with your context
const handler = new SelfImprovingContextHandler(myContext);

// Optional: Set up neural integration
if (hasNeuralDevice) {
  const neuralAdapter = createAdapterForDevice(myDevice);
  const neuralIntegrator = new NeuralFeedbackIntegrator(handler, neuralAdapter);
}
```

3. Implement tracking in your application:

```javascript
// When context element is accessed
const value = handler.trackAccess('path.to.element');

// After using context, record effectiveness
handler.recordEffectiveness('path.to.element', score, feedback);
```

## Contributing

Contributions are welcome! Key areas for enhancement:

- Additional neural device integrations
- Advanced correlation algorithms
- UI for visualizing context evolution
- Optimization strategies for specific use cases

Please see [CONTRIBUTING.md](https://github.com/mikhashev/personal-context-manager/blob/main/CONTRIBUTING.md) for guidelines.

## Acknowledgments

- Neural interface integration inspired by research from [citation needed]
- Correlation algorithms adapted from open-source machine learning libraries
- Self-optimization strategies informed by cognitive adaptation research

---

**Personal Context Manager** | Developing the future of personalized AI interaction through structured context and neural integration.