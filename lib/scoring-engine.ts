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
   * 
   * @param data - Complete GitHub analysis data
   * @returns Portfolio score object with all metrics
   */
  static calculateScore(data: GitHubAnalysisData): PortfolioScore {
    const dimensions: ScoreDimension[] = [
      this.scoreDocumentation(data),
      this.scoreCodeStructure(data),
      this.scoreActivityConsistency(data),
      this.scoreRepositoryOrganization(data),
      this.scoreProjectImpact(data),
      this.scoreTechnicalDepth(data),
    ];

    // Calculate weighted total score
    const totalScore = Math.round(
      dimensions.reduce((sum, dim) => sum + dim.score * (dim.weight / 100), 0)
    );

    // Detect red flags
    const redFlags = this.detectRedFlags(data);

    // Select top repositories to showcase
    const topRepos = this.selectTopRepos(data);

    // Identify strengths
    const strengths = this.identifyStrengths(dimensions, data);

    return {
      totalScore,
      dimensions,
      redFlags,
      topRepos,
      strengths,
    };
  }

  /**
   * Dimension 1: Documentation Quality (20% weight)
   */
  private static scoreDocumentation(data: GitHubAnalysisData): ScoreDimension {
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
  private static scoreCodeStructure(data: GitHubAnalysisData): ScoreDimension {
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
  private static scoreActivityConsistency(data: GitHubAnalysisData): ScoreDimension {
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
  private static scoreRepositoryOrganization(data: GitHubAnalysisData): ScoreDimension {
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
   */
  private static scoreProjectImpact(data: GitHubAnalysisData): ScoreDimension {
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

    // Check stars/engagement
    const totalStars = repositories.reduce((sum, r) => sum + r.stars, 0);
    if (totalStars >= 50) score += 40;
    else if (totalStars >= 20) score += 30;
    else if (totalStars >= 5) score += 20;
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
   */
  private static scoreTechnicalDepth(data: GitHubAnalysisData): ScoreDimension {
    const { languageStats, repositories } = data;
    let score = 0;
    let feedback = '';

    // Language diversity (50 points)
    const uniqueLangs = Object.keys(languageStats).length;
    if (uniqueLangs >= 5) score += 50;
    else if (uniqueLangs >= 3) score += 35;
    else if (uniqueLangs >= 2) score += 20;
    else score += 10;

    // Modern frameworks/tech stack indicators (50 points)
    const nonForkRepos = repositories.filter((r) => !r.is_fork);
    const modernTopics = ['react', 'vue', 'angular', 'nextjs', 'typescript', 'nodejs', 'docker', 'kubernetes', 'aws'];
    const modernRepos = nonForkRepos.filter((r) =>
      r.topics.some((topic) => modernTopics.includes(topic.toLowerCase()))
    );
    score += (modernRepos.length / Math.max(nonForkRepos.length, 1)) * 50;

    const topLanguages = Object.entries(languageStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([lang]) => lang);

    if (uniqueLangs === 1) {
      feedback = `Only one language (${topLanguages[0]}). Learn 1-2 complementary technologies to show versatility.`;
    } else if (modernRepos.length === 0) {
      feedback = `No modern frameworks detected. Add topics like 'react', 'typescript', or 'docker' to signal current skills.`;
    } else {
      feedback = `${uniqueLangs} languages, including ${topLanguages.join(', ')}. Shows technical breadth!`;
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
}
