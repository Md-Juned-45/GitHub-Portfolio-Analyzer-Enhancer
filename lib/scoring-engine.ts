/**
 * Scoring Engine - Portfolio Score Calculation
 * 
 * This is the core scoring logic that evaluates GitHub portfolios from a recruiter's perspective.
 * Unlike generic GitHub analyzers, this scoring system is designed specifically to answer:
 * "Would a recruiter be impressed by this profile?"
 * 
 * SCORING METHODOLOGY:
 * - 6 weighted dimensions (Documentation, Structure, Activity, Organization, Impact, Depth)
 * - Each dimension scored 0-100 with clear rationale
 * - Total score is weighted average (0-100)
 * - Red flags are explicitly detected and highlighted
 * - Every metric includes "why recruiters care" explanation
 * 
 * DIFFERENTIATION FROM COMPETITORS:
 * - Recruiter-centric vs developer-centric metrics
 * - Specific, actionable feedback vs generic advice
 * - Explicit red flag detection
 * - "Why it matters" explanations for each dimension
 */

import { GitHubAnalysisData, Repository } from './github-service';

/**
 * Individual Scoring Dimension
 * Each dimension represents a key aspect recruiters evaluate
 */
export interface ScoreDimension {
  name: string;           // Dimension name (e.g., "Documentation Quality")
  score: number;          // Score 0-100 for this dimension
  weight: number;         // Percentage weight in total (sum = 100%)
  feedback: string;       // Specific feedback on performance
  whyItMatters: string;   // Explains recruiter perspective
}

export interface RedFlag {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface PortfolioScore {
  totalScore: number; // Weighted average of all dimensions
  dimensions: ScoreDimension[];
  redFlags: RedFlag[];
  topRepos: Repository[];
  strengths: string[];
}

export class ScoringEngine {
  /**
   * Calculate Comprehensive Portfolio Score
   * 
   * This is the main entry point for scoring. It:
   * 1. Calculates scores for all 6 dimensions
   * 2. Computes weighted average for total score
   * 3. Detects red flags (critical issues)
   * 4. Selects top repositories to showcase
   * 5. Identifies key strengths
   * 6. ENHANCEMENT: Applies experience-level calibration
   * 
   * @param data - Complete GitHub analysis data
   * @returns Portfolio score object with all metrics
   */
  static calculateScore(data: GitHubAnalysisData): PortfolioScore {
    // ENHANCEMENT: Calculate experience level based on account age
    const accountAgeYears = this.calculateAccountAge(data.user.created_at);
    const experienceLevel = this.getExperienceLevel(accountAgeYears);
    
    // CRITICAL FIX: Detect "Legend Status" for world-class developers
    const legendStatus = this.detectLegendStatus(data);
    
    const dimensions: ScoreDimension[] = [
      this.scoreDocumentation(data, experienceLevel),
      this.scoreCodeStructure(data, experienceLevel),
      this.scoreActivityConsistency(data, experienceLevel),
      this.scoreRepositoryOrganization(data, experienceLevel),
      this.scoreProjectImpact(data, experienceLevel, legendStatus),
      this.scoreTechnicalDepth(data, experienceLevel, legendStatus),
    ];

    // Calculate weighted total score
    const totalScore = Math.round(
      dimensions.reduce((sum, dim) => sum + dim.score * (dim.weight / 100), 0)
    );

    // Detect red flags
    const redFlags = this.detectRedFlags(data);

    // ENHANCEMENT: Apply red flag penalties to actually impact score
    // LEGEND FIX: Don't penalize legends for red flags (they're infrastructure creators)
    const redFlagPenalty = legendStatus.isLegend ? 0 : redFlags.reduce((penalty, flag) => {
      if (flag.severity === 'high') return penalty + 15;
      if (flag.severity === 'medium') return penalty + 8;
      return penalty + 3;
    }, 0);

    // LEGEND FIX: Apply massive boost for legendary impact
    let finalScore = Math.max(0, totalScore - redFlagPenalty);
    if (legendStatus.isLegend) {
      finalScore = Math.max(finalScore, 95); // Minimum 95 for legends
    }

    // Select top repositories to showcase
    const topRepos = this.selectTopRepos(data);

    // Identify strengths
    const strengths = this.identifyStrengths(dimensions, data);

    return {
      totalScore: finalScore,
      dimensions,
      redFlags,
      topRepos,
      strengths,
    };
  }

  /**
   * Dimension 1: Documentation Quality (20% weight)
   */
  private static scoreDocumentation(data: GitHubAnalysisData, experienceLevel: string): ScoreDimension {
    const { repositories, pinnedRepos } = data;
    const nonForkRepos = repositories.filter((r) => !r.is_fork);
    
    let score = 0;
    let feedback = '';

    // Check README presence
    const reposWithReadme = nonForkRepos.filter((r) => r.has_readme);
    const readmePercentage = nonForkRepos.length > 0 
      ? (reposWithReadme.length / nonForkRepos.length) * 100 
      : 0;

    score += Math.min(readmePercentage * 0.5, 50); // Up to 50 points

    // Check README quality in top/pinned repos
    const topRepoNames = pinnedRepos.length > 0 ? pinnedRepos : nonForkRepos.slice(0, 3).map(r => r.name);
    const topRepos = repositories.filter((r) => topRepoNames.includes(r.name));
    
    const qualityReadmes = topRepos.filter(
      (r) => r.has_readme && (r.readme_length || 0) > 500
    );
    // FIX: Prevent division by zero when no repos exist
    score += topRepos.length > 0 ? (qualityReadmes.length / topRepos.length) * 50 : 0; // Up to 50 points

    // Generate feedback
    const topReposWithoutReadme = topRepos.filter((r) => !r.has_readme);
    if (topReposWithoutReadme.length > 0) {
      feedback = `${topReposWithoutReadme.length} of your top repos lack READMEs. Add them ASAP—recruiters skip repos without documentation.`;
    } else if (readmePercentage < 70) {
      feedback = `Only ${Math.round(readmePercentage)}% of your repos have READMEs. Archive undocumented repos or add READMEs to improve discoverability.`;
    } else {
      feedback = `Strong documentation! ${reposWithReadme.length}/${nonForkRepos.length} repos have READMEs.`;
    }

    return {
      name: 'Documentation Quality',
      score: Math.round(score),
      weight: 20,
      feedback,
      whyItMatters:
        'Recruiters spend 10-30 seconds per profile. No README = instant skip. Documentation signals professionalism and communication skills.',
    };
  }

  /**
   * Dimension 2: Code Structure (15% weight)
   */
  private static scoreCodeStructure(data: GitHubAnalysisData, experienceLevel: string): ScoreDimension {
    const { repositories } = data;
    const nonForkRepos = repositories.filter((r) => !r.is_fork);

    let score = 50; // Base score
    let feedback = '';

    // Penalize very small repos (likely trivial)
    // FIX: More conservative - only penalize truly empty repos
    const trivialRepos = nonForkRepos.filter((r) => r.size < 5);
    score -= Math.min(trivialRepos.length * 5, 30);

    // Reward repos with proper structure (topics, descriptions)
    const structuredRepos = nonForkRepos.filter(
      (r) => r.description && r.topics.length > 0
    );
    score += (structuredRepos.length / Math.max(nonForkRepos.length, 1)) * 50;

    score = Math.max(0, Math.min(100, score));

    if (trivialRepos.length > 5) {
      feedback = `You have ${trivialRepos.length} very small repos. Archive trivial projects to keep your profile focused on real work.`;
    } else if (structuredRepos.length < nonForkRepos.length / 2) {
      feedback = `Many repos lack descriptions or topics. Add them to improve searchability and first impressions.`;
    } else {
      feedback = `Well-organized repos! Most have clear descriptions and topics.`;
    }

    return {
      name: 'Code Structure & Organization',
      score: Math.round(score),
      weight: 15,
      feedback,
      whyItMatters:
        'Clean repo structure shows you write maintainable code. Descriptions and topics help recruiters quickly understand what you build.',
    };
  }

  /**
   * Dimension 3: Activity Consistency (20% weight)
   */
  private static scoreActivityConsistency(data: GitHubAnalysisData, experienceLevel: string): ScoreDimension {
    const { activityData } = data;
    let score = 0;
    let feedback = '';

    // Check recency (up to 40 points)
    if (activityData.lastCommitDate) {
      const daysSinceLastCommit = Math.floor(
        (Date.now() - new Date(activityData.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastCommit <= 7) score += 40;
      else if (daysSinceLastCommit <= 30) score += 30;
      else if (daysSinceLastCommit <= 90) score += 20;
      else if (daysSinceLastCommit <= 180) score += 10;
    }

    // Check frequency (up to 60 points)
    const { commitFrequency } = activityData;
    if (commitFrequency >= 20) score += 60; // 20+ commits/month
    else if (commitFrequency >= 10) score += 45;
    else if (commitFrequency >= 5) score += 30;
    else if (commitFrequency >= 2) score += 15;

    if (!activityData.lastCommitDate || score < 40) {
      feedback = `Your account appears dormant. Recruiters want evidence of current, active coding practice. Start contributing regularly.`;
    } else if (commitFrequency < 5) {
      feedback = `Low commit frequency (${Math.round(commitFrequency)}/month). Consistent activity signals you're actively learning and building.`;
    } else {
      feedback = `Excellent activity! ${Math.round(commitFrequency)} commits/month shows consistent development habits.`;
    }

    return {
      name: 'Activity Consistency',
      score: Math.round(score),
      weight: 20,
      feedback,
      whyItMatters:
        'Recruiters filter for recent activity. A dormant account suggests outdated skills. Regular commits prove you code daily.',
    };
  }

  /**
   * Dimension 4: Repository Organization (15% weight)
   */
  private static scoreRepositoryOrganization(data: GitHubAnalysisData, experienceLevel: string): ScoreDimension {
    const { user, repositories, pinnedRepos } = data;
    let score = 0;
    let feedback = '';

    // Has pinned repos? (30 points)
    if (pinnedRepos.length >= 4) score += 30;
    else if (pinnedRepos.length > 0) score += 15;

    // Repos have descriptions (35 points)
    const nonForkRepos = repositories.filter((r) => !r.is_fork);
    const reposWithDesc = nonForkRepos.filter((r) => r.description);
    score += (reposWithDesc.length / Math.max(nonForkRepos.length, 1)) * 35;

    // Profile bio present (35 points)
    if (user.bio && user.bio.length > 20) score += 35;
    else if (user.bio) score += 20;

    if (pinnedRepos.length === 0) {
      feedback = `No pinned repos! Pin your 4-6 best projects—they're the first thing recruiters see.`;
    } else if (!user.bio) {
      feedback = `Add a profile bio! It's your 10-second elevator pitch to recruiters.`;
    } else if (reposWithDesc.length < nonForkRepos.length * 0.7) {
      feedback = `${nonForkRepos.length - reposWithDesc.length} repos lack descriptions. Add one-line summaries to every visible repo.`;
    } else {
      feedback = `Well-curated profile! Pinned repos, bio, and descriptions are all in place.`;
    }

    return {
      name: 'Repository Organization',
      score: Math.round(score),
      weight: 15,
      feedback,
      whyItMatters:
        'Your pinned repos and bio create the first impression. Recruiters judge you in 60 seconds—make every second count.',
    };
  }

  /**
   * Dimension 5: Project Impact (15% weight)
   * ENHANCEMENT: Calibrated by experience level
   * LEGEND FIX: Handles world-class developers properly
   */
  private static scoreProjectImpact(data: GitHubAnalysisData, experienceLevel: string, legendStatus: { isLegend: boolean; reason: string }): ScoreDimension {
    const { repositories } = data;
    const nonForkRepos = repositories.filter((r) => !r.is_fork);
    let score = 0;
    let feedback = '';

    // Check for original work vs forks
    const forkRatio = repositories.length > 0 
      ? (repositories.filter(r => r.is_fork).length / repositories.length) * 100
      : 0;

    if (forkRatio < 30) score += 40;
    else if (forkRatio < 50) score += 25;
    else if (forkRatio < 70) score += 10;

    // Check stars/engagement - ENHANCEMENT: Adjust thresholds by experience
    const totalStars = repositories.reduce((sum, r) => sum + r.stars, 0);
    
    // LEGEND FIX: Override for legendary impact
    if (legendStatus.isLegend || totalStars >= 50000) {
      score = 100; // Maximum for infrastructure creators
      feedback = `Legendary impact: ${totalStars.toLocaleString()} stars. Infrastructure-level technology.`;
    } else {
      const starThresholds = this.getStarThresholds(experienceLevel);
      
      if (totalStars >= starThresholds.excellent) score += 40;
      else if (totalStars >= starThresholds.good) score += 30;
      else if (totalStars >= starThresholds.decent) score += 20;
      else score += 10;

      // Popular repos
      const popularRepos = nonForkRepos.filter((r) => r.stars >= 5);
      score += Math.min(popularRepos.length * 5, 20);

      if (forkRatio > 70) {
        feedback = `${Math.round(forkRatio)}% of your repos are forks. Recruiters want to see YOUR original projects, not tutorial clones.`;
      } else if (totalStars === 0) {
        feedback = `No stars on any repos. Build 1-2 impressive projects that solve real problems people care about.`;
      } else if (popularRepos.length === 0) {
        feedback = `No repos with significant engagement. Focus quality over quantity—1 great project beats 10 tutorials.`;
      } else {
        feedback = `${popularRepos.length} repos have external validation (stars/forks). Shows real-world impact!`;
      }
    }

    return {
      name: 'Project Impact',
      score: Math.round(score),
      weight: 15,
      feedback,
      whyItMatters:
        'Recruiters distinguish between tutorial followers and builders. Stars and original work signal initiative and problem-solving.',
    };
  }

  /**
   * Dimension 6: Technical Depth (15% weight)
   * LEGEND FIX: Recognize systems languages (C, C++, Rust, Go, Assembly)
   */
  private static scoreTechnicalDepth(data: GitHubAnalysisData, experienceLevel: string, legendStatus: { isLegend: boolean; reason: string }): ScoreDimension {
    const { languageStats, repositories } = data;
    let score = 0;
    let feedback = '';

    const nonForkRepos = repositories.filter((r) => !r.is_fork);
    const topLanguages = Object.entries(languageStats)
      .sort(([, a], [, b]) => b - a)
      .map(([lang]) => lang);
    
    const uniqueLangs = topLanguages.length;

    // LEGEND FIX: Systems programming gets highest priority (40 points)
    const systemsLanguages = ['C', 'C++', 'Rust', 'Go', 'Assembly', 'Zig', 'Odin', 'V'];
    const hasSystemsLanguage = topLanguages.some((lang) => 
      systemsLanguages.some(sys => lang.toLowerCase().includes(sys.toLowerCase()))
    );
    
    if (hasSystemsLanguage) {
      score += 40; // Maximum points for kernel/compiler/OS development
      feedback = `Systems programming expertise (${topLanguages.filter(l => systemsLanguages.some(s => l.toLowerCase().includes(s.toLowerCase()))).join(', ')}). Infrastructure-level development!`;
    } else {
      // Language diversity (25 points) - for non-systems developers
      if (uniqueLangs >= 5) score += 25;
      else if (uniqueLangs >= 3) score += 18;
      else if (uniqueLangs >= 2) score += 12;
      else score += 5;
      
      // Modern languages bonus (15 points)
      const modernLanguages = ['TypeScript', 'Python', 'Java', 'Kotlin', 'Swift', 'Go'];
      const hasModernLanguage = topLanguages.some((lang) => 
        modernLanguages.includes(lang)
      );
      if (hasModernLanguage) score += 15;
      
      // Web frameworks (reduced to 10 points from 30)
      const webTopics = ['react', 'vue', 'angular', 'nextjs', 'svelte'];
      const webRepos = nonForkRepos.filter((r) =>
        r.topics.some((topic) => webTopics.includes(topic.toLowerCase()))
      );
      score += (webRepos.length / Math.max(nonForkRepos.length, 1)) * 10;
      
      if (uniqueLangs === 1) {
        feedback = `Single language (${topLanguages[0]}). Consider learning complementary technologies.`;
      } else {
        feedback = `${uniqueLangs} languages including ${topLanguages.slice(0, 3).join(', ')}.`;
      }
    }

    // ENHANCEMENT: Code quality bonuses (up to 25 points)
    let qualityBonus = 0;
    nonForkRepos.forEach((repo) => {
      if (repo.code_quality?.hasCI) qualityBonus += 15 / nonForkRepos.length;
      if (repo.code_quality?.hasTests) qualityBonus += 10 / nonForkRepos.length;
      if (repo.code_quality?.hasTypeScript) qualityBonus += 8 / nonForkRepos.length;
      if (repo.code_quality?.hasLinting) qualityBonus += 7 / nonForkRepos.length;
    });
    score += Math.min(qualityBonus, 25);

    // LEGEND BOOST: If legendary status, ensure high technical score
    if (legendStatus.isLegend && score < 85) {
      score = 90; // Legends get minimum 90 on technical depth
      feedback = `${feedback} [Legend Status: ${legendStatus.reason}]`;
    }

    return {
      name: 'Technical Depth',
      score: Math.round(score),
      weight: 15,
      feedback,
      whyItMatters:
        'Depth shows mastery, breadth shows adaptability. Recruiters look for modern tech stacks and diverse problem-solving.',
    };
  }

  /**
   * Detect red flags
   */
  private static detectRedFlags(data: GitHubAnalysisData): RedFlag[] {
    const flags: RedFlag[] = [];
    const { repositories, activityData, pinnedRepos, user } = data;
    const nonForkRepos = repositories.filter((r) => !r.is_fork);

    // Red flag: No READMEs in top repos
    const topRepoNames = pinnedRepos.length > 0 ? pinnedRepos : repositories.slice(0, 3).map(r => r.name);
    const topRepos = repositories.filter((r) => topRepoNames.includes(r.name));
    const topReposNoReadme = topRepos.filter((r) => !r.has_readme);

    if (topReposNoReadme.length >= 2) {
      flags.push({
        title: 'Missing READMEs in Visible Repos',
        description: `${topReposNoReadme.length} of your most visible repos lack READMEs. This is a deal-breaker for most recruiters.`,
        severity: 'high',
      });
    }

    // Red flag: Dormant account
    if (activityData.lastCommitDate) {
      const monthsSinceLastCommit = Math.floor(
        (Date.now() - new Date(activityData.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      if (monthsSinceLastCommit >= 6) {
        flags.push({
          title: 'Account Inactive',
          description: `Last commit was ${monthsSinceLastCommit} months ago. Recruiters filter out profiles with no recent activity.`,
          severity: 'high',
        });
      }
    }

    // Red flag: Only forks
    if (nonForkRepos.length === 0 && repositories.length > 0) {
      flags.push({
        title: 'No Original Work',
        description: 'All visible repos are forks. Recruiters need to see YOUR projects, not cloned tutorials.',
        severity: 'high',
      });
    }

    // Red flag: No pinned repos
    if (pinnedRepos.length === 0) {
      flags.push({
        title: 'No Pinned Repositories',
        description: 'Pin 4-6 best projects! Pinned repos are prime real estate—they control your first impression.',
        severity: 'medium',
      });
    }

    // Red flag: Too many trivial repos
    // FIX: Better detection - check for actually empty repos (no stars, no forks, tiny)
    const trivialRepos = nonForkRepos.filter((r) => 
      r.size < 10 && !r.has_readme && r.stars === 0 && r.forks === 0
    );
    if (trivialRepos.length > 10) {
      flags.push({
        title: 'Portfolio Dilution',
        description: `${trivialRepos.length} very small/undocumented repos clutter your profile. Archive or delete them to focus attention on real work.`,
        severity: 'medium',
      });
    }

    // Red flag: No profile bio
    if (!user.bio || user.bio.length < 20) {
      flags.push({
        title: 'Missing Profile Bio',
        description: 'Your bio is your elevator pitch. Add 1-2 sentences about what you build and why.',
        severity: 'low',
      });
    }

    return flags;
  }

  /**
   * Select top repositories to showcase
   */
  private static selectTopRepos(data: GitHubAnalysisData): Repository[] {
    const { repositories, pinnedRepos } = data;

    // Prefer pinned repos
    if (pinnedRepos.length > 0) {
      return repositories
        .filter((r) => pinnedRepos.includes(r.name))
        .slice(0, 5);
    }

    // Otherwise, select by stars + recency
    return repositories
      .filter((r) => !r.is_fork)
      .sort((a, b) => {
        const scoreA = a.stars * 10 + (a.has_readme ? 5 : 0);
        const scoreB = b.stars * 10 + (b.has_readme ? 5 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }

  /**
   * Identify key strengths
   */
  private static identifyStrengths(
    dimensions: ScoreDimension[],
    data: GitHubAnalysisData
  ): string[] {
    const strengths: string[] = [];

    // Top-scoring dimensions
    const topDimensions = dimensions
      .filter((d) => d.score >= 70)
      .map((d) => d.name);

    strengths.push(...topDimensions);

    // Additional signals
    if (data.activityData.commitFrequency > 15) {
      strengths.push('Highly Active Developer');
    }

    const totalStars = data.repositories.reduce((sum, r) => sum + r.stars, 0);
    if (totalStars > 20) {
      strengths.push('Community Recognition');
    }

    if (data.pinnedRepos.length >= 4) {
      strengths.push('Well-Curated Profile');
    }

    return strengths.length > 0 ? strengths : ['Keep building!'];
  }

  /**
   * ENHANCEMENT: Calculate account age in years
   */
  private static calculateAccountAge(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365);
  }

  /**
   * ENHANCEMENT: Determine experience level based on account age
   */
  private static getExperienceLevel(ageYears: number): string {
    if (ageYears < 1) return 'beginner';
    if (ageYears < 3) return 'intermediate';
    if (ageYears < 5) return 'advanced';
    return 'expert';
  }

  /**
   * LEGEND FIX: Detect world-class "Legend Status" developers
   * Criteria: 100K+ total stars OR 50K+ followers
   * Examples: Linus Torvalds, tj (TJ Holowaychuk), sindresorhus
   */
  private static detectLegendStatus(data: GitHubAnalysisData): {
    isLegend: boolean;
    reason: string;
  } {
    const { user, repositories } = data;
    const totalStars = repositories.reduce((sum, r) => sum + r.stars, 0);
    
    // Check for legendary impact
    if (totalStars >= 100000) {
      return {
        isLegend: true,
        reason: `Infrastructure-level impact: ${totalStars.toLocaleString()} stars across projects`
      };
    }
    
    if (user.followers >= 50000) {
      return {
        isLegend: true,
        reason: `Industry leader: ${user.followers.toLocaleString()} followers`
      };
    }
    
    // Check for single legendary project (50K+ stars)
    const hasLegendaryProject = repositories.some((r) => r.stars >= 50000);
    if (hasLegendaryProject) {
      return {
        isLegend: true,
        reason: `Created industry-changing technology`
      };
    }
    
    return { isLegend: false, reason: '' };
  }

  /**
   * ENHANCEMENT: Get calibrated star thresholds by experience level
   */
  private static getStarThresholds(experienceLevel: string): {
    excellent: number;
    good: number;
    decent: number;
  } {
    const thresholds = {
      beginner: { excellent: 10, good: 5, decent: 2 },
      intermediate: { excellent: 30, good: 15, decent: 5 },
      advanced: { excellent: 75, good: 35, decent: 15 },
      expert: { excellent: 150, good: 75, decent: 30 },
    };
    return thresholds[experienceLevel as keyof typeof thresholds] || thresholds.intermediate;
  }
}
