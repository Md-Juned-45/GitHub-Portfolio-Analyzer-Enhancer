/**
 * AI Analyzer - Gemini-Powered Portfolio Insights
 * 
 * This module uses Google Gemini 2.0 Flash Exp to generate:
 * - Specific, actionable improvement suggestions
 * - Recruiter-perspective analysis
 * - Quick wins (high impact, low effort tasks)
 * - Priority-ranked recommendations
 * 
 * KEY FEATURES:
 * - Brutally honest feedback (not generic advice)
 * - Mentions actual repository names
 * - Prioritizes by impact/effort ratio
 * - Returns structured JSON for easy parsing
 * - Fallback logic if AI fails
 * 
 * PROMPT ENGINEERING:
 * The prompt is carefully designed to:
 * 1. Provide full context (repos, scores, red flags)
 * 2. Demand specific actions ("Archive 'hello-world'" not "clean up repos")
 * 3. Request recruiter perspective
 * 4. Prioritize quick wins first
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GitHubAnalysisData, Repository } from './github-service';
import { PortfolioScore } from './scoring-engine';

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Use Gemini 2.0 Flash Exp for fast, high-quality responses
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

export interface ActionableSuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'high' | 'medium' | 'low';
  timeEstimate: string;
}

export interface AIInsights {
  suggestions: ActionableSuggestion[];
  recruiterPerspective: string;
  quickWins: string[];
  profileSummary: string;
}

export class AIAnalyzer {
  /**
   * Generate AI-powered insights and suggestions
   */
  static async generateInsights(
    data: GitHubAnalysisData,
    score: PortfolioScore
  ): Promise<AIInsights> {
    try {
      const prompt = this.buildAnalysisPrompt(data, score);
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Parse the AI response
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('AI analysis error:', error);
      // Fallback to rule-based suggestions
      return this.generateFallbackInsights(data, score);
    }
  }

  /**
   * Build comprehensive analysis prompt
   */
  private static buildAnalysisPrompt(
    data: GitHubAnalysisData,
    score: PortfolioScore
  ): string {
    const { user, repositories, activityData, languageStats } = data;
    const nonForkRepos = repositories.filter((r) => !r.is_fork);

    // Summarize key metrics
    const repoSummary = `
- Total repos: ${repositories.length} (${nonForkRepos.length} original, ${repositories.filter(r => r.is_fork).length} forks)
- Repos with READMEs: ${repositories.filter(r => r.has_readme).length}/${repositories.length}
- Total stars: ${repositories.reduce((sum, r) => sum + r.stars, 0)}
- Languages: ${Object.keys(languageStats).join(', ')}
- Activity: ${Math.round(activityData.commitFrequency)} commits/month, last commit ${this.formatDate(activityData.lastCommitDate)}
- Portfolio Score: ${score.totalScore}/100
    `.trim();

    // Top repos detail
    const topReposDetail = score.topRepos
      .map(
        (r: Repository) =>
          `  • ${r.name}: ${r.description || 'No description'} (★${r.stars}, ${r.language || 'Unknown'}, README: ${r.has_readme ? 'Yes' : 'No'})`
      )
      .join('\n');

    // Red flags
    const redFlagsText = score.redFlags.length > 0
      ? score.redFlags.map((f) => `  • [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`).join('\n')
      : '  • None detected';

    const prompt = `You are a senior technical recruiter with 10 years of experience evaluating GitHub profiles for software engineering positions.

Analyze this GitHub profile and provide brutally honest, actionable feedback:

PROFILE: @${user.login}
Bio: ${user.bio || 'No bio'}

METRICS:
${repoSummary}

TOP REPOSITORIES:
${topReposDetail}

CURRENT SCORE BREAKDOWN:
${score.dimensions.map((d) => `  • ${d.name}: ${d.score}/100 - ${d.feedback}`).join('\n')}

RED FLAGS:
${redFlagsText}

TASK: Generate insights in this EXACT JSON format (no markdown, just raw JSON):

{
  "profileSummary": "<2-sentence first impression a recruiter would have>",
  "recruiterPerspective": "<100-word analysis: what stands out positively, what raises concerns, overall hiring signal>",
  "quickWins": ["<specific action>", "<specific action>", "<specific action>"],
  "suggestions": [
    {
      "title": "<specific action>",
      "description": "<why this matters, exactly what to do>",
      "priority": "high|medium|low",
      "effort": "low|medium|high",
      "impact": "high|medium|low",
      "timeEstimate": "<realistic time: e.g., 30 minutes, 2 hours, 1 week>"
    }
  ]
}

CRITICAL RULES:
1. Be SPECIFIC, not generic. Say "Archive 'hello-world' and 'test-repo'" not "clean up your repos"
2. Prioritize HIGH IMPACT, LOW EFFORT actions first (quick wins)
3. Be brutally honest about red flags—recruiters are
4. Mention actual repo names when giving feedback
5. Quick wins should be actionable in under 1 hour each
6. Generate 5-7 suggestions total, sorted by impact/effort ratio
7. Return ONLY valid JSON, no markdown code blocks

Generate the JSON now:`;

    return prompt;
  }

  /**
   * Parse AI response into structured insights
   */
  private static parseAIResponse(response: string): AIInsights {
    try {
      // Remove markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanedResponse);

      return {
        suggestions: parsed.suggestions || [],
        recruiterPerspective: parsed.recruiterPerspective || '',
        quickWins: parsed.quickWins || [],
        profileSummary: parsed.profileSummary || '',
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw error;
    }
  }

  /**
   * Generate fallback insights if AI fails
   */
  private static generateFallbackInsights(
    data: GitHubAnalysisData,
    score: PortfolioScore
  ): AIInsights {
    const suggestions: ActionableSuggestion[] = [];
    const { repositories, activityData, pinnedRepos } = data;
    const nonForkRepos = repositories.filter((r) => !r.is_fork);

    // Generate rule-based suggestions from red flags and low scores
    score.redFlags.forEach((flag) => {
      if (flag.severity === 'high') {
        suggestions.push({
          title: flag.title,
          description: flag.description,
          priority: 'high',
          effort: 'low',
          impact: 'high',
          timeEstimate: '30 minutes',
        });
      }
    });

    // Add suggestions for low-scoring dimensions
    score.dimensions
      .filter((d) => d.score < 50)
      .forEach((dim) => {
        suggestions.push({
          title: `Improve ${dim.name}`,
          description: dim.feedback,
          priority: 'high',
          effort: 'medium',
          impact: 'high',
          timeEstimate: '1-2 hours',
        });
      });

    // Default quick wins
    const quickWins: string[] = [];
    if (pinnedRepos.length === 0) quickWins.push('Pin your 4 best repositories');
    if (!data.user.bio) quickWins.push('Add a professional bio to your profile');
    const noReadmeCount = nonForkRepos.filter((r) => !r.has_readme).length;
    if (noReadmeCount > 0) quickWins.push(`Add READMEs to ${noReadmeCount} repos`);

    return {
      suggestions: suggestions.slice(0, 5),
      recruiterPerspective: `This profile shows ${score.totalScore < 50 ? 'significant room for improvement' : score.totalScore < 70 ? 'moderate potential with key gaps' : 'strong fundamentals'}. ${score.redFlags.length > 0 ? 'Address critical red flags immediately.' : 'Focus on consistency and documentation.'}`,
      quickWins,
      profileSummary: `Portfolio score: ${score.totalScore}/100. ${score.strengths.length > 0 ? `Strengths: ${score.strengths.join(', ')}.` : ''}`,
    };
  }

  /**
   * Format date for readability
   */
  private static formatDate(date: string | null): string {
    if (!date) return 'unknown';

    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
}
