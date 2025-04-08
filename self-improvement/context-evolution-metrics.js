/**
 * context-evolution-metrics.js
 * 
 * Tracks and analyzes how context structures evolve over time,
 * identifying patterns and generating insights to improve context quality.
 */

class ContextEvolutionTracker {
    constructor() {
      this.contextHistory = [];
      this.evolutionMetrics = {
        structural: {},
        content: {},
        effectiveness: {}
      };
    }
  
    // Record a new version of the context
    recordContextVersion(context, metadata = {}) {
      const timestamp = metadata.timestamp || new Date().toISOString();
      const version = metadata.version || 
        (this.contextHistory.length + 1).toString();
      
      // Create a deep copy of the context
      const snapshot = {
        timestamp,
        version,
        context: JSON.parse(JSON.stringify(context)), 
        metadata: { ...metadata, timestamp, version }
      };
      
      // Calculate metrics for this version
      if (this.contextHistory.length > 0) {
        const previousVersion = this.contextHistory[this.contextHistory.length - 1];
        this.calculateEvolutionMetrics(snapshot, previousVersion);
      } else {
        this.calculateInitialMetrics(snapshot);
      }
      
      // Add to history
      this.contextHistory.push(snapshot);
      
      return {
        version,
        metrics: this.getVersionMetrics(version)
      };
    }
  
    // Calculate metrics for initial version
    calculateInitialMetrics(snapshot) {
      const version = snapshot.version;
      
      // Initialize metric collections
      this.evolutionMetrics.structural[version] = {
        elementCount: this.countElements(snapshot.context),
        depth: this.calculateDepth(snapshot.context),
        breadth: Object.keys(snapshot.context).length,
        instructionQuality: this.evaluateInstructionQuality(snapshot.context)
      };
      
      this.evolutionMetrics.content[version] = {
        contentDensity: this.calculateContentDensity(snapshot.context),
        namedEntities: this.extractNamedEntities(snapshot.context),
        topicDistribution: this.analyzeTopics(snapshot.context)
      };
      
      this.evolutionMetrics.effectiveness[version] = {
        // Initial effectiveness is unrated
        overallScore: null,
        componentScores: {},
        userFeedback: []
      };
    }
  
    // Calculate evolution metrics between versions
    calculateEvolutionMetrics(currentSnapshot, previousSnapshot) {
      const currentVersion = currentSnapshot.version;
      const previousVersion = previousSnapshot.version;
      
      // Structure changes
      const currentElementCount = this.countElements(currentSnapshot.context);
      const previousElementCount = this.countElements(previousSnapshot.context);
      
      this.evolutionMetrics.structural[currentVersion] = {
        elementCount: currentElementCount,
        depth: this.calculateDepth(currentSnapshot.context),
        breadth: Object.keys(currentSnapshot.context).length,
        instructionQuality: this.evaluateInstructionQuality(currentSnapshot.context),
        
        // Change metrics
        elementCountChange: currentElementCount - previousElementCount,
        changedPaths: this.identifyChangedPaths(
          currentSnapshot.context, 
          previousSnapshot.context
        ),
        structuralChanges: this.summarizeStructuralChanges(
          currentSnapshot.context, 
          previousSnapshot.context
        )
      };
      
      // Content changes
      this.evolutionMetrics.content[currentVersion] = {
        contentDensity: this.calculateContentDensity(currentSnapshot.context),
        namedEntities: this.extractNamedEntities(currentSnapshot.context),
        topicDistribution: this.analyzeTopics(currentSnapshot.context),
        
        // Change metrics
        contentEvolution: this.analyzeContentEvolution(
          currentSnapshot.context, 
          previousSnapshot.context
        )
      };
      
      // Effectiveness metrics get carried over and updated
      this.evolutionMetrics.effectiveness[currentVersion] = {
        overallScore: 
          this.evolutionMetrics.effectiveness[previousVersion]?.overallScore || null,
        componentScores: {
          ...this.evolutionMetrics.effectiveness[previousVersion]?.componentScores
        },
        userFeedback: [
          ...this.evolutionMetrics.effectiveness[previousVersion]?.userFeedback || []
        ]
      };
    }
  
    // Update effectiveness score for a specific version
    updateEffectivenessScore(version, componentPath, score, feedback = '') {
      if (!this.evolutionMetrics.effectiveness[version]) {
        return false;
      }
      
      // Add component score
      this.evolutionMetrics.effectiveness[version].componentScores[componentPath] = score;
      
      // Add user feedback if provided
      if (feedback) {
        this.evolutionMetrics.effectiveness[version].userFeedback.push({
          timestamp: new Date().toISOString(),
          componentPath,
          score,
          feedback
        });
      }
      
      // Recalculate overall score (average of component scores)
      const scores = Object.values(
        this.evolutionMetrics.effectiveness[version].componentScores
      );
      
      if (scores.length > 0) {
        this.evolutionMetrics.effectiveness[version].overallScore = 
          scores.reduce((sum, val) => sum + val, 0) / scores.length;
      }
      
      return true;
    }
  
    // Helper methods for metric calculations
    
    // Count total elements in a nested structure
    countElements(obj, path = '') {
      if (typeof obj !== 'object' || obj === null) {
        return 1;
      }
      
      let count = 0;
      for (const key in obj) {
        const newPath = path ? `${path}.${key}` : key;
        count += 1; // Count this element
        
        // Recursively count nested elements
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          count += this.countElements(obj[key], newPath);
        }
      }
      
      return count;
    }
    
    // Calculate maximum nesting depth
    calculateDepth(obj, depth = 0) {
      if (typeof obj !== 'object' || obj === null) {
        return depth;
      }
      
      let maxDepth = depth;
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const childDepth = this.calculateDepth(obj[key], depth + 1);
          maxDepth = Math.max(maxDepth, childDepth);
        }
      }
      
      return maxDepth;
    }
    
    // Evaluate instruction quality (simple heuristic)
    evaluateInstructionQuality(context) {
      // Check if instruction block exists
      if (!context.instruction) {
        return 0;
      }
      
      let score = 0;
      
      // Check for key instruction components (simplistic)
      if (context.instruction.primary) score += 3;
      if (context.instruction.context_update) score += 2;
      if (context.instruction.privacy) score += 1;
      
      // Check length of primary instruction
      const primaryLength = context.instruction.primary?.length || 0;
      if (primaryLength > 50 && primaryLength < 500) {
        score += 2;
      } else if (primaryLength > 0) {
        score += 1;
      }
      
      // Normalize to 0-10 scale
      return Math.min(10, score);
    }
    
    // Calculate content density (text content vs structure)
    calculateContentDensity(context) {
      const jsonString = JSON.stringify(context);
      const totalLength = jsonString.length;
      
      // Extract all string values
      const stringValues = [];
      const extractStrings = (obj) => {
        if (typeof obj === 'string') {
          stringValues.push(obj);
        } else if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            extractStrings(obj[key]);
          }
        }
      };
      
      extractStrings(context);
      
      // Calculate total string content length
      const contentLength = stringValues.join('').length;
      
      // Density = content / total
      return contentLength / totalLength;
    }
    
    // Extract named entities (simple implementation)
    extractNamedEntities(context) {
      // In a real implementation, this would use NLP techniques
      const jsonString = JSON.stringify(context);
      
      // Very simple named entity extraction (just a placeholder)
      const entities = {
        people: [],
        organizations: [],
        locations: [],
        technologies: []
      };
      
      // Extract strings with uppercase first letter (potential named entities)
      const potentialEntities = jsonString.match(/"\b[A-Z][a-zA-Z]*\b"/g) || [];
      
      // Simple categorization (would be more sophisticated in real implementation)
      potentialEntities.forEach(entity => {
        const cleaned = entity.replace(/"/g, '');
        
        // Very simplistic categorization
        if (cleaned.endsWith('Inc') || cleaned.endsWith('Corp')) {
          entities.organizations.push(cleaned);
        } else if (cleaned.includes('JS') || cleaned.includes('AI')) {
          entities.technologies.push(cleaned);
        }
        // Other categories would have more sophisticated detection
      });
      
      return entities;
    }
    
    // Analyze topic distribution (placeholder)
    analyzeTopics(context) {
      // In a real implementation, this would use topic modeling techniques
      
      // Simple placeholder implementation
      const topics = {
        'personal_info': 0,
        'preferences': 0,
        'goals': 0,
        'technical': 0,
        'instructions': 0
      };
      
      // Check for common sections and assign topic weights
      if (context.basic_info) topics.personal_info += 1;
      if (context.preferences) topics.preferences += 1;
      if (context.goals) topics.goals += 1;
      if (context.technical_skills || context.projects) topics.technical += 1;
      if (context.instruction) topics.instructions += 1;
      
      return topics;
    }
    
    // Identify which paths have changed between versions
    identifyChangedPaths(currentContext, previousContext, basePath = '') {
      const changes = {
        added: [],
        removed: [],
        modified: []
      };
      
      // Helper function to recursively get all paths
      const getAllPaths = (obj, currentPath = '') => {
        const paths = [];
        
        for (const key in obj) {
          const path = currentPath ? `${currentPath}.${key}` : key;
          paths.push(path);
          
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            paths.push(...getAllPaths(obj[key], path));
          }
        }
        
        return paths;
      };
      
      // Get all paths in both contexts
      const currentPaths = getAllPaths(currentContext);
      const previousPaths = getAllPaths(previousContext);
      
      // Find added paths
      changes.added = currentPaths.filter(path => !previousPaths.includes(path));
      
      // Find removed paths
      changes.removed = previousPaths.filter(path => !currentPaths.includes(path));
      
      // Find modified paths
      const getValueAtPath = (obj, path) => {
        const parts = path.split('.');
        let current = obj;
        
        for (const part of parts) {
          if (current === undefined || current === null) return undefined;
          current = current[part];
        }
        
        return current;
      };
      
      // Check common paths for modifications
      const commonPaths = currentPaths.filter(path => previousPaths.includes(path));
      
      commonPaths.forEach(path => {
        const currentValue = getValueAtPath(currentContext, path);
        const previousValue = getValueAtPath(previousContext, path);
        
        // Only check modifications for leaf nodes (non-objects)
        if (typeof currentValue !== 'object' && 
            JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
          changes.modified.push(path);
        }
      });
      
      return changes;
    }
    
    // Summarize structural changes
    summarizeStructuralChanges(currentContext, previousContext) {
      const changes = this.identifyChangedPaths(currentContext, previousContext);
      
      // Group changes by section
      const sections = {};
      
      // Helper to get top-level section
      const getTopSection = (path) => path.split('.')[0];
      
      // Group added paths
      changes.added.forEach(path => {
        const section = getTopSection(path);
        if (!sections[section]) {
          sections[section] = { added: 0, removed: 0, modified: 0 };
        }
        sections[section].added++;
      });
      
      // Group removed paths
      changes.removed.forEach(path => {
        const section = getTopSection(path);
        if (!sections[section]) {
          sections[section] = { added: 0, removed: 0, modified: 0 };
        }
        sections[section].removed++;
      });
      
      // Group modified paths
      changes.modified.forEach(path => {
        const section = getTopSection(path);
        if (!sections[section]) {
          sections[section] = { added: 0, removed: 0, modified: 0 };
        }
        sections[section].modified++;
      });
      
      return {
        totalChanges: changes.added.length + changes.removed.length + changes.modified.length,
        changesBySection: sections,
        mostChangedSection: Object.entries(sections)
          .sort((a, b) => {
            const aTotal = a[1].added + a[1].removed + a[1].modified;
            const bTotal = b[1].added + b[1].removed + b[1].modified;
            return bTotal - aTotal;
          })
          .map(([section, changes]) => ({
            section,
            changes: changes.added + changes.removed + changes.modified
          }))[0]
      };
    }
    
    // Analyze content evolution between versions
    analyzeContentEvolution(currentContext, previousContext) {
      // In a real implementation, this would do sophisticated content analysis
      
      // Simple placeholder that focuses on instruction changes
      if (currentContext.instruction && previousContext.instruction) {
        const currentInstr = currentContext.instruction;
        const previousInstr = previousContext.instruction;
        
        // Check if primary instruction changed
        const primaryChanged = currentInstr.primary !== previousInstr.primary;
        
        // Check if new instruction fields were added
        const currentFields = Object.keys(currentInstr);
        const previousFields = Object.keys(previousInstr);
        const newFields = currentFields.filter(field => !previousFields.includes(field));
        
        return {
          primaryInstructionChanged: primaryChanged,
          newInstructionFields: newFields,
          instructionEvolved: primaryChanged || newFields.length > 0
        };
      }
      
      return {
        primaryInstructionChanged: false,
        newInstructionFields: [],
        instructionEvolved: false
      };
    }
  
    // Get metrics for a specific version
    getVersionMetrics(version) {
      return {
        structural: this.evolutionMetrics.structural[version] || {},
        content: this.evolutionMetrics.content[version] || {},
        effectiveness: this.evolutionMetrics.effectiveness[version] || {}
      };
    }
  
    // Generate evolution insights
    generateEvolutionInsights() {
      if (this.contextHistory.length < 2) {
        return {
          status: "Insufficient history",
          message: "Need at least 2 versions to analyze evolution"
        };
      }
      
      // Get first and latest versions
      const firstVersion = this.contextHistory[0].version;
      const latestVersion = this.contextHistory[this.contextHistory.length - 1].version;
      
      // Evolution summary metrics
      const summary = {
        versions: this.contextHistory.length,
        timespan: this.calculateTimespan(),
        growthRate: this.calculateGrowthRate(firstVersion, latestVersion),
        effectivenessProgress: this.calculateEffectivenessProgress(),
        topChanges: this.identifyTopChanges()
      };
      
      // Recommendations based on evolution patterns
      const recommendations = this.generateEvolutionRecommendations();
      
      return {
        summary,
        recommendations,
        evolutionPath: this.summarizeEvolutionPath()
      };
    }
  
    // Calculate timespan between first and last recorded versions
    calculateTimespan() {
      if (this.contextHistory.length < 2) return "N/A";
      
      const firstDate = new Date(this.contextHistory[0].timestamp);
      const lastDate = new Date(this.contextHistory[this.contextHistory.length - 1].timestamp);
      
      const diffMs = lastDate - firstDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) {
        return "Less than a day";
      } else if (diffDays === 1) {
        return "1 day";
      } else if (diffDays < 30) {
        return `${diffDays} days`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? 'month' : 'months'}`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `${years} ${years === 1 ? 'year' : 'years'}`;
      }
    }
  
    // Calculate growth rate between versions
    calculateGrowthRate(firstVersion, latestVersion) {
      const firstMetrics = this.evolutionMetrics.structural[firstVersion];
      const latestMetrics = this.evolutionMetrics.structural[latestVersion];
      
      if (!firstMetrics || !latestMetrics) return { elements: 0, depth: 0 };
      
      // Calculate element growth rate
      const elementGrowth = latestMetrics.elementCount - firstMetrics.elementCount;
      const elementGrowthRate = firstMetrics.elementCount ? 
        elementGrowth / firstMetrics.elementCount : 0;
      
      // Calculate depth growth rate
      const depthGrowth = latestMetrics.depth - firstMetrics.depth;
      const depthGrowthRate = firstMetrics.depth ? 
        depthGrowth / firstMetrics.depth : 0;
      
      return {
        elements: elementGrowthRate,
        depth: depthGrowthRate,
        description: this.describeGrowthPattern(elementGrowthRate, depthGrowthRate)
      };
    }
  
    // Describe the growth pattern in words
    describeGrowthPattern(elementGrowth, depthGrowth) {
      if (elementGrowth > 0.5 && depthGrowth > 0.3) {
        return "Rapid expansion in both breadth and depth";
      } else if (elementGrowth > 0.5 && depthGrowth <= 0.3) {
        return "Significant horizontal growth with moderate depth increase";
      } else if (elementGrowth <= 0.5 && elementGrowth > 0.1 && depthGrowth > 0.3) {
        return "Moderate growth with focus on deeper structure";
      } else if (elementGrowth <= 0.5 && elementGrowth > 0.1 && depthGrowth <= 0.3) {
        return "Steady, balanced growth";
      } else if (elementGrowth <= 0.1 && elementGrowth >= -0.1) {
        return "Structural refinement with minimal size change";
      } else {
        return "Consolidation and simplification";
      }
    }
  
    // Calculate effectiveness progress over time
    calculateEffectivenessProgress() {
      // Collect all effectiveness scores that are available
      const scores = Object.entries(this.evolutionMetrics.effectiveness)
        .filter(([_, data]) => data.overallScore !== null)
        .map(([version, data]) => ({
          version,
          score: data.overallScore
        }))
        .sort((a, b) => {
          // Sort by version (assuming versions are comparable strings or numbers)
          return a.version.localeCompare(b.version, undefined, { numeric: true });
        });
      
      if (scores.length < 2) {
        return {
          status: "Insufficient data",
          trend: "unknown"
        };
      }
      
      // Calculate trend
      const firstScore = scores[0].score;
      const lastScore = scores[scores.length - 1].score;
      const change = lastScore - firstScore;
      const percentChange = (change / firstScore) * 100;
      
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
        initialScore: firstScore,
        currentScore: lastScore,
        change,
        percentChange,
        trend,
        dataPoints: scores.length
      };
    }
  
    // Identify top changes across all versions
    identifyTopChanges() {
      // Collect all changes from all versions
      const allChanges = [];
      
      for (let i = 1; i < this.contextHistory.length; i++) {
        const currentVersion = this.contextHistory[i].version;
        const metrics = this.evolutionMetrics.structural[currentVersion];
        
        if (metrics && metrics.changedPaths) {
          // Add all paths with their version
          metrics.changedPaths.added.forEach(path => {
            allChanges.push({
              version: currentVersion,
              type: 'added',
              path
            });
          });
          
          metrics.changedPaths.removed.forEach(path => {
            allChanges.push({
              version: currentVersion,
              type: 'removed',
              path
            });
          });
          
          metrics.changedPaths.modified.forEach(path => {
            allChanges.push({
              version: currentVersion,
              type: 'modified',
              path
            });
          });
        }
      }
      
      // Group by path to find most frequently changed paths
      const changesByPath = {};
      allChanges.forEach(change => {
        // Get top-level section
        const section = change.path.split('.')[0];
        
        if (!changesByPath[section]) {
          changesByPath[section] = {
            added: 0,
            removed: 0,
            modified: 0,
            total: 0
          };
        }
        
        changesByPath[section][change.type]++;
        changesByPath[section].total++;
      });
      
      // Sort sections by total changes
      const sortedSections = Object.entries(changesByPath)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([section, counts]) => ({
          section,
          ...counts
        }));
      
      return {
        mostChangedSections: sortedSections.slice(0, 3),
        totalChanges: allChanges.length,
        changeDistribution: Object.fromEntries(
          sortedSections.map(item => [item.section, item.total])
        )
      };
    }
  
    // Generate evolution-based recommendations
    generateEvolutionRecommendations() {
      const recommendations = [];
      
      // Recommend based on growth pattern
      if (this.contextHistory.length >= 3) {
        const firstVersion = this.contextHistory[0].version;
        const latestVersion = this.contextHistory[this.contextHistory.length - 1].version;
        const growthRate = this.calculateGrowthRate(firstVersion, latestVersion);
        
        if (growthRate.elements > 0.7 && growthRate.depth > 0.5) {
          recommendations.push({
            type: "structure",
            priority: "high",
            issue: "Rapid growth may lead to navigation complexity",
            recommendation: "Consider restructuring to improve organization and accessibility",
            details: "The context is growing quickly in both size and depth. Consider organizing related information into more intuitive groups."
          });
        }
        
        if (growthRate.elements > 0.5 && growthRate.depth < 0.2) {
          recommendations.push({
            type: "organization",
            priority: "medium",
            issue: "Flat structure with many elements",
            recommendation: "Introduce hierarchical organization for better navigation",
            details: "The context has many top-level elements but little depth. Consider grouping related items into hierarchical categories."
          });
        }
      }
      
      // Recommend based on effectiveness
      const effectivenessProgress = this.calculateEffectivenessProgress();
      if (effectivenessProgress.trend === "moderate_decline" || 
          effectivenessProgress.trend === "significant_decline") {
        recommendations.push({
          type: "effectiveness",
          priority: "high",
          issue: "Declining effectiveness scores",
          recommendation: "Review recent changes and consider reverting problematic modifications",
          details: `Effectiveness has declined by ${Math.abs(effectivenessProgress.percentChange).toFixed(1)}%. Identify which changes may have caused this decline.`
        });
      }
      
      // Recommend based on instruction quality
      const latestVersion = this.contextHistory[this.contextHistory.length - 1];
      const instructionQuality = this.evolutionMetrics.structural[latestVersion.version]?.instructionQuality;
      
      if (instructionQuality !== undefined && instructionQuality < 7) {
        recommendations.push({
          type: "instruction",
          priority: "high",
          issue: "Instruction quality could be improved",
          recommendation: "Enhance instruction block with more specific guidance",
          details: "The instruction block would benefit from clearer primary directives and update protocols."
        });
      }
      
      // Recommend based on changed sections
      const topChanges = this.identifyTopChanges();
      const mostChanged = topChanges.mostChangedSections[0];
      
      if (mostChanged && mostChanged.total > 5) {
        recommendations.push({
          type: "stability",
          priority: "medium",
          issue: `Frequent changes to ${mostChanged.section} section`,
          recommendation: "Consider stabilizing this frequently changing section",
          details: `The ${mostChanged.section} section has changed ${mostChanged.total} times, which may indicate it needs better structure or clearer purpose.`
        });
      }
      
      return recommendations;
    }
  
    // Summarize the evolution path of the context
    summarizeEvolutionPath() {
      if (this.contextHistory.length < 2) return [];
      
      const evolutionPath = [];
      
      for (let i = 1; i < this.contextHistory.length; i++) {
        const previousVersion = this.contextHistory[i-1];
        const currentVersion = this.contextHistory[i];
        
        const structuralMetrics = this.evolutionMetrics.structural[currentVersion.version];
        const contentMetrics = this.evolutionMetrics.content[currentVersion.version];
        
        // Skip if no metrics available
        if (!structuralMetrics || !contentMetrics) continue;
        
        // Calculate changes
        const elementChange = structuralMetrics.elementCount - 
          this.evolutionMetrics.structural[previousVersion.version].elementCount;
        
        const significantChanges = 
          (structuralMetrics.changedPaths?.added.length || 0) + 
          (structuralMetrics.changedPaths?.removed.length || 0) + 
          (structuralMetrics.changedPaths?.modified.length || 0);
        
        // Effectiveness change if available
        let effectivenessChange = null;
        if (this.evolutionMetrics.effectiveness[currentVersion.version]?.overallScore !== null && 
            this.evolutionMetrics.effectiveness[previousVersion.version]?.overallScore !== null) {
          effectivenessChange = 
            this.evolutionMetrics.effectiveness[currentVersion.version].overallScore - 
            this.evolutionMetrics.effectiveness[previousVersion.version].overallScore;
        }
        
        // Create evolution stage description
        evolutionPath.push({
          fromVersion: previousVersion.version,
          toVersion: currentVersion.version,
          timestamp: currentVersion.timestamp,
          elementChange,
          significantChanges,
          effectivenessChange,
          instructionChanged: contentMetrics.contentEvolution?.primaryInstructionChanged,
          summary: this.generateEvolutionStageSummary(
            elementChange, 
            significantChanges, 
            effectivenessChange,
            contentMetrics.contentEvolution?.primaryInstructionChanged
          )
        });
      }
      
      return evolutionPath;
    }
  
    // Generate summary for evolution stage
    generateEvolutionStageSummary(elementChange, significantChanges, effectivenessChange, instructionChanged) {
      let focusAreas = [];
      
      if (elementChange > 10) focusAreas.push("significant expansion");
      else if (elementChange > 3) focusAreas.push("moderate growth");
      else if (elementChange < -5) focusAreas.push("substantial reduction");
      else if (elementChange < 0) focusAreas.push("minor consolidation");
      
      if (significantChanges > 20) focusAreas.push("major restructuring");
      else if (significantChanges > 10) focusAreas.push("notable refinement");
      else if (significantChanges > 5) focusAreas.push("targeted improvements");
      
      if (instructionChanged) focusAreas.push("instruction reformulation");
      
      if (effectivenessChange !== null) {
        if (effectivenessChange > 1) focusAreas.push("significant effectiveness improvement");
        else if (effectivenessChange > 0.3) focusAreas.push("effectiveness enhancement");
        else if (effectivenessChange < -0.5) focusAreas.push("effectiveness decline");
      }
      
      if (focusAreas.length === 0) focusAreas.push("minor adjustments");
      
      return focusAreas.join(", ");
    }
  }
  
  module.exports = ContextEvolutionTracker;