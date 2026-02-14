/**
 * NEW STUDENT-FOCUSED SCORING ENGINE
 * 
 * Redesigned from recruiter perspective with:
 * - Profile auto-detection (student/professional/open-source)
 * - Dynamic weight adjustment per profile type
 * - 6 balanced dimensions
 * - 100% actionable feedback
 */

import { GitHubAnalysisData, Repository } from './github-service';

export type ProfileType = 'student' | 'professional' | 'open-source';

export interface ScoreDimension {
  name: string;
  score: number;
  weight: number;
  feedback: string;
  whyItMatters: string;
  suggestions: DetailedSuggestion[];
}

export interface DetailedSuggestion {
  id: string;
  title: string;
  points: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeEstimate: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface PortfolioScore {
  totalScore: number;
  profileType: ProfileType;
  dimensions: ScoreDimension[];
  topRepos: Repository[];
  strengths: string[];
  topSuggestions: DetailedSuggestion[];
}

export class NewScoringEngine {
  /**
   * Main scoring entry point
   */
  static calculateScore(data: GitHubAnalysisData): PortfolioScore {
    // Step 1: Detect profile type
    const profileType = this.detectProfileType(data);
    
    // Step 2: Get weights for this profile type
    const weights = this.getWeights(profileType);
    
    // Step 3: Select top 6 repos for scoring
    const scoredRepos = this.selectReposForScoring(data);
    
    // Step 4: Calculate dimension scores
    const dimensions: ScoreDimension[] = [
      this.scoreCodeQuality(data, scoredRepos, weights.codeQuality),
      this.scoreProjectImpact(data, scoredRepos, weights.projectImpact),
      this.scoreCurrentActive(data, weights.currentActive),
      this.scoreProductionReadiness(data, scoredRepos, weights.productionReadiness),
      this.scoreTechnicalSkill(data, scoredRepos, weights.technicalSkill),
      this.scoreCommunityTrust(data, weights.communityTrust),
    ];
    
    // Step 5: Calculate weighted total
    const totalScore = Math.round(
      dimensions.reduce((sum, dim) => sum + (dim.score * dim.weight) / 100, 0)
    );
    
    // Step 6: Select top repos and identify strengths
    const topRepos = this.selectTopRepos(data);
    const strengths = this.identifyStrengths(dimensions);
    
    // Step 7: Collect and prioritize suggestions
    const allSuggestions = dimensions.flatMap(d => d.suggestions);
    const topSuggestions = this.prioritizeSuggestions(allSuggestions).slice(0, 5);
    
    return {
      totalScore,
      profileType,
      dimensions,
      topRepos,
      strengths,
      topSuggestions,
    };
  }
  
  /**
   * Detect profile type based on account characteristics
   */
  private static detectProfileType(data: GitHubAnalysisData): ProfileType {
    const accountAge = this.calculateAccountAge(data.user.created_at);
    const totalStars = data.repositories.reduce((s, r) => s + r.stars, 0);
    const totalRepos = data.repositories.length;
    
    // Student indicators (3 years, <=20 repos, <200 stars)
    if (accountAge < 3 && totalRepos <= 20 && totalStars < 200) {
      return 'student';
    }
    
    // Open source contributor
    if (totalStars > 500 || data.user.followers > 100) {
      return 'open-source';
    }
    
    // Professional (default)
    return 'professional';
  }
  
  /**
   * Get scoring weights based on profile type
   */
  private static getWeights(profileType: ProfileType): {
    codeQuality: number;
    projectImpact: number;
    currentActive: number;
    productionReadiness: number;
    technicalSkill: number;
    communityTrust: number;
  } {
    const weights = {
      student: {
        codeQuality: 20,
        projectImpact: 25,       // Highest for students
        currentActive: 20,
        productionReadiness: 10,  // Lower for students
        technicalSkill: 15,
        communityTrust: 10,
      },
      professional: {
        codeQuality: 18,
        projectImpact: 15,
        currentActive: 17,
        productionReadiness: 25,  // Highest for professionals
        technicalSkill: 15,
        communityTrust: 10,
      },
      'open-source': {
        codeQuality: 20,
        projectImpact: 15,
        currentActive: 15,
        productionReadiness: 20,
        technicalSkill: 15,
        communityTrust: 15,       // Higher for OSS
      },
    };
    
    return weights[profileType] || weights.professional;
  }
  
  /**
   * Select top 6 repos for scoring (pinned first, then recent)
   */
  private static selectReposForScoring(data: GitHubAnalysisData): Repository[] {
    const { repositories, pinnedRepos } = data;
    
    // Start with pinned repos
    const pinned = repositories.filter(r => pinnedRepos.includes(r.name));
    
    // Fill remaining with recent non-forks
    const remaining = repositories
      .filter(r => !pinnedRepos.includes(r.name) && !r.is_fork)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 6 - pinned.length);
    
    return [...pinned, ...remaining].slice(0, 6);
  }
  
  /**
   * Dimension 1: Code Quality (weight varies by profile)
   */
  private static scoreCodeQuality(
    data: GitHubAnalysisData,
    scoredRepos: Repository[],
    weight: number
  ): ScoreDimension {
    let score = 0;
    const suggestions: DetailedSuggestion[] = [];
    
    // README quality (50 points)
    const reposWithReadme = scoredRepos.filter(r => r.has_readme);
    const readmeScore = (reposWithReadme.length / Math.max(scoredRepos.length, 1)) * 50;
    score += readmeScore;
    
    if (reposWithReadme.length < scoredRepos.length) {
      suggestions.push({
        id: 'add-readme',
        title: `Add READMEs to ${scoredRepos.length - reposWithReadme.length} repos`,
        points: Math.round((scoredRepos.length - reposWithReadme.length) * 8),
        category: 'Code Quality',
        difficulty: 'easy',
        timeEstimate: '15 min per repo',
        priority: 'critical',
      });
    }
    
    // Code organization (30 points)
    const organizedRepos = scoredRepos.filter(r => r.description && r.topics.length > 0);
    score += (organizedRepos.length / Math.max(scoredRepos.length, 1)) * 30;
    
    if (organizedRepos.length < scoredRepos.length) {
      suggestions.push({
        id: 'add-descriptions',
        title: 'Add descriptions and topics to repos',
        points: 5,
        category: 'Code Quality',
        difficulty: 'easy',
        timeEstimate: '5 min',
        priority: 'high',
      });
    }
    
    // Linting/formatting (20 points)
    const reposWithLinting = scoredRepos.filter(r => r.code_quality?.hasLinting);
    score += (reposWithLinting.length / Math.max(scoredRepos.length, 1)) * 20;
    
    if (reposWithLinting.length === 0) {
      suggestions.push({
        id: 'add-linting',
        title: 'Add ESLint or Prettier configuration',
        points: 6,
        category: 'Code Quality',
        difficulty: 'easy',
        timeEstimate: '10 min',
        priority: 'medium',
      });
    }
    
    const feedback = reposWithReadme.length === scoredRepos.length
      ? `Excellent documentation across all ${scoredRepos.length} top repos!`
      : `${scoredRepos.length - reposWithReadme.length} repos need READMEs`;
    
    return {
      name: 'Code Quality',
      score: Math.round(score),
      weight,
      feedback,
      whyItMatters: 'Recruiters skip repos without documentation. Clean code signals professionalism.',
      suggestions,
    };
  }
  
  /**
   * Dimension 2: Project Impact (weight varies by profile)
   */
  private static scoreProjectImpact(
    data: GitHubAnalysisData,
    scoredRepos: Repository[],
    weight: number
  ): ScoreDimension {
    let score = 0;
    const suggestions: DetailedSuggestion[] = [];
    
    // Live demo detection (7 points per repo, up to 35)
    const reposWithDemo = scoredRepos.filter(r => 
      r.readme_content?.toLowerCase().includes('vercel.app') ||
      r.readme_content?.toLowerCase().includes('netlify.app') ||
      r.readme_content?.toLowerCase().includes('github.io') ||
      r.homepage
    );
    score += Math.min(reposWithDemo.length * 7, 35);
    
    if (reposWithDemo.length === 0) {
      suggestions.push({
        id: 'deploy-project',
        title: 'Deploy 1-2 projects to Vercel or Netlify',
        points: 14,
        category: 'Project Impact',
        difficulty: 'easy',
        timeEstimate: '10 min',
        priority: 'critical',
      });
    }
    
    // Project storytelling (35 points)
    const reposWithStory = scoredRepos.filter(r =>
      r.readme_content?.toLowerCase().includes('why i built') ||
      r.readme_content?.toLowerCase().includes('problem') ||
      r.readme_content?.toLowerCase().includes('motivation')
    );
    score += (reposWithStory.length / Math.max(scoredRepos.length, 1)) * 35;
    
    if (reposWithStory.length < 2) {
      suggestions.push({
        id: 'add-storytelling',
        title: 'Add "Why I Built This" section to READMEs',
        points: 7,
        category: 'Project Impact',
        difficulty: 'easy',
        timeEstimate: '15 min',
        priority: 'high',
      });
    }
    
    // Project completeness (30 points)
    const completeRepos = scoredRepos.filter(r =>
      r.description &&
      (r.readme_length || 0) > 200
    );
    score += (completeRepos.length / Math.max(scoredRepos.length, 1)) * 30;
    
    const feedback = reposWithDemo.length > 0
      ? `${reposWithDemo.length} live demos show real-world impact!`
      : 'Deploy projects to show they actually work';
    
    return {
      name: 'Project Impact',
      score: Math.round(score),
      weight,
      feedback,
      whyItMatters: 'Live demos prove your code works. Storytelling shows problem-solving skills.',
      suggestions,
    };
  }
  
  /**
   * Dimension 3: Current & Active (weight varies by profile)
   */
  private static scoreCurrentActive(
    data: GitHubAnalysisData,
    weight: number
  ): ScoreDimension {
    let score = 0;
    const suggestions: DetailedSuggestion[] = [];
    
    // Recency (50 points)
    if (data.activityData.lastCommitDate) {
      const daysSince = Math.floor(
        (Date.now() - new Date(data.activityData.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSince <= 7) score += 50;
      else if (daysSince <= 30) score += 40;
      else if (daysSince <= 90) score += 25;
      else score += 10;
      
      if (daysSince > 30) {
        suggestions.push({
          id: 'commit-recently',
          title: 'Make at least 1 commit this month',
          points: 10,
          category: 'Current & Active',
          difficulty: 'easy',
          timeEstimate: '1 hour',
          priority: 'critical',
        });
      }
    }
    
    // Consistency (50 points) - commits spread across weeks
    const { commitFrequency } = data.activityData;
    if (commitFrequency >= 20) score += 50;
    else if (commitFrequency >= 10) score += 35;
    else if (commitFrequency >= 5) score += 20;
    else score += 5;
    
    if (commitFrequency < 5) {
      suggestions.push({
        id: 'commit-consistently',
        title: 'Commit at least once per week for 1 month',
        points: 15,
        category: 'Current & Active',
        difficulty: 'medium',
        timeEstimate: 'Ongoing',
        priority: 'high',
      });
    }
    
    const feedback = commitFrequency >= 10
      ? `Excellent activity: ${Math.round(commitFrequency)} commits/month!`
      : `Low activity (${Math.round(commitFrequency)}/month). Code regularly to show current skills.`;
    
    return {
      name: 'Current & Active',
      score: Math.round(score),
      weight,
      feedback,
      whyItMatters: 'Recruiters filter for recent activity. Dormant accounts suggest outdated skills.',
      suggestions,
    };
  }
  
  /**
   * Dimension 4: Production Readiness (weight varies by profile)
   * Base score = 50 (neutral, no penalty)
   */
  private static scoreProductionReadiness(
    data: GitHubAnalysisData,
    scoredRepos: Repository[],
    weight: number
  ): ScoreDimension {
    let score = 50; // Base score - no penalty for missing
    const suggestions: DetailedSuggestion[] = [];
    
    // CI/CD (25 points bonus)
    const reposWithCI = scoredRepos.filter(r => r.code_quality?.hasCI);
    if (reposWithCI.length > 0) {
      score += 25;
    } else {
      suggestions.push({
        id: 'add-cicd',
        title: 'Add GitHub Actions CI/CD workflow',
        points: 25,
        category: 'Production Readiness',
        difficulty: 'easy',
        timeEstimate: '10 min',
        priority: 'medium',
      });
    }
    
    // Tests (20 points bonus)
    const reposWithTests = scoredRepos.filter(r => r.code_quality?.hasTests);
    if (reposWithTests.length > 0) {
      score += 20;
    } else {
      suggestions.push({
        id: 'add-tests',
        title: 'Add basic tests to 1-2 projects',
        points: 20,
        category: 'Production Readiness',
        difficulty: 'medium',
        timeEstimate: '30 min',
        priority: 'medium',
      });
    }
    
    // Environment setup (5 points bonus)
    // Note: This would require file tree inspection, skipping for MVP
    
    const feedback = score > 70
      ? 'Production-ready code with CI/CD and tests!'
      : 'Add CI/CD and tests to show professional workflows (optional for students)';
    
    return {
      name: 'Production Readiness',
      score: Math.min(score, 100),
      weight,
      feedback,
      whyItMatters: 'Shows you can ship to production. Not required for students, but impressive.',
      suggestions,
    };
  }
  
  /**
   * Dimension 5: Technical Skill (weight varies by profile)
   */
  private static scoreTechnicalSkill(
    data: GitHubAnalysisData,
    scoredRepos: Repository[],
    weight: number
  ): ScoreDimension {
    let score = 0;
    const suggestions: DetailedSuggestion[] = [];
    const { languageStats } = data;
    
    const topLanguages = Object.keys(languageStats);
    const uniqueLangs = topLanguages.length;
    
    // Language diversity (40 points)
    if (uniqueLangs >= 5) score += 40;
    else if (uniqueLangs >= 3) score += 30;
    else if (uniqueLangs >= 2) score += 20;
    else score += 10;
    
    if (uniqueLangs < 3) {
      suggestions.push({
        id: 'learn-language',
        title: 'Learn a complementary language (e.g., TypeScript, Python)',
        points: 10,
        category: 'Technical Skill',
        difficulty: 'hard',
        timeEstimate: '1-2 months',
        priority: 'low',
      });
    }
    
    // Modern tech (30 points)
    const modernLanguages = ['TypeScript', 'Python', 'Java', 'Kotlin', 'Swift', 'Go', 'Rust'];
    const hasModern = topLanguages.some(lang => modernLanguages.includes(lang));
    if (hasModern) score += 30;
    
    // Framework usage (30 points)
    const frameworks = ['react', 'vue', 'angular', 'nextjs', 'svelte', 'express', 'django', 'spring'];
    const frameworkRepos = scoredRepos.filter(r =>
      r.topics.some(t => frameworks.includes(t.toLowerCase()))
    );
    score += Math.min(frameworkRepos.length * 10, 30);
    
    const feedback = uniqueLangs >= 3
      ? `Strong technical breadth: ${topLanguages.slice(0, 3).join(', ')}`
      : `Limited to ${topLanguages[0]}. Learn 1-2 more languages.`;
    
    return {
      name: 'Technical Skill',
      score: Math.round(score),
      weight,
      feedback,
      whyItMatters: 'Breadth shows adaptability, depth shows mastery. Both matter to recruiters.',
      suggestions,
    };
  }
  
  /**
   * Dimension 6: Community Trust (weight varies by profile)
   * Raw points × 10 = dimension score
   */
  private static scoreCommunityTrust(
    data: GitHubAnalysisData,
    weight: number
  ): ScoreDimension {
    let rawPoints = 0;
    const suggestions: DetailedSuggestion[] = [];
    
    // PR/Issue activity (8 points)
    const hasIssues = data.repositories.some(r => r.open_issues > 0);
    if (hasIssues) rawPoints += 3;
    else {
      suggestions.push({
        id: 'create-issues',
        title: 'Create issues for feature ideas in your repos',
        points: 3,
        category: 'Community Trust',
        difficulty: 'easy',
        timeEstimate: '10 min',
        priority: 'low',
      });
    }
    
    // Note: PR activity requires GitHub token, skipping for MVP
    // Would add +3 points
    
    // Contributors (2 points)
    // Note: Requires additional API call, skipping for MVP
    
    // Stars/forks (2 points max)
    const totalStars = data.repositories.reduce((sum, r) => sum + r.stars, 0);
    if (totalStars >= 200) rawPoints += 2;
    else if (totalStars >= 50) rawPoints += 1;
    
    // Convert to 0-100 scale
    const score = Math.min(rawPoints * 10, 100);
    
    const feedback = totalStars > 50
      ? `${totalStars} stars show community validation!`
      : 'Build impressive projects to earn stars (not critical for students)';
    
    return {
      name: 'Community Trust',
      score,
      weight,
      feedback,
      whyItMatters: 'External validation matters, but not critical for early-career developers.',
      suggestions,
    };
  }
  
  /**
   * Helper: Calculate account age
   */
  private static calculateAccountAge(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365);
  }
  
  /**
   * Helper: Select top repos for display
   */
  private static selectTopRepos(data: GitHubAnalysisData): Repository[] {
    const { repositories, pinnedRepos } = data;
    
    if (pinnedRepos.length > 0) {
      return repositories
        .filter(r => pinnedRepos.includes(r.name))
        .slice(0, 5);
    }
    
    return repositories
      .filter(r => !r.is_fork)
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 5);
  }
  
  /**
   * Helper: Identify strengths
   */
  private static identifyStrengths(dimensions: ScoreDimension[]): string[] {
    return dimensions
      .filter(d => d.score >= 70)
      .map(d => d.name);
  }
  
  /**
   * Helper: Prioritize suggestions
   */
  private static prioritizeSuggestions(suggestions: DetailedSuggestion[]): DetailedSuggestion[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    return suggestions.sort((a, b) => {
      // Sort by priority first
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by points (descending)
      return b.points - a.points;
    });
  }
}
