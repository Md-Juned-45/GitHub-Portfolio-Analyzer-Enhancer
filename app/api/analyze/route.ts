/**
 * GitHub Portfolio Analysis API Route
 * 
 * This is the main API endpoint that orchestrates the complete analysis flow:
 * 1. Fetch GitHub data (GitHubService)
 * 2. Calculate portfolio scores (ScoringEngine)
 * 3. Generate AI insights (AIAnalyzer)
 * 4. Return combined results
 * 
 * Endpoint: GET /api/analyze?username=<github_username>
 * 
 * Error Handling:
 * - 400: Missing username parameter
 * - 500: GitHub API errors, AI errors, or other failures
 */

import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github-service';
import { ScoringEngine } from '@/lib/scoring-engine';
import { AIAnalyzer } from '@/lib/ai-analyzer';

/**
 * GET Handler - Analyzes a GitHub profile
 * 
 * @param request - Next.js request object with username query parameter
 * @returns JSON response with complete analysis results or error
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'GitHub username is required' },
        { status: 400 }
      );
    }

    // Step 1: Fetch GitHub data (profile, repos, commits, etc.)
    console.log(`Fetching data for username: ${username}`);
    const githubData = await GitHubService.fetchUserData(username);

    // Step 2: Calculate portfolio scores across 6 dimensions
    console.log('Calculating scores...');
    const portfolioScore = ScoringEngine.calculateScore(githubData);

    // Step 3: Generate AI-powered suggestions and insights
    console.log('Generating AI insights...');
    const aiInsights = await AIAnalyzer.generateInsights(githubData, portfolioScore);

    // Step 4: Combine all results into unified response
    const result = {
      user: githubData.user,
      score: portfolioScore.totalScore,
      dimensions: portfolioScore.dimensions,
      redFlags: portfolioScore.redFlags,
      topRepos: portfolioScore.topRepos,
      strengths: portfolioScore.strengths,
      suggestions: aiInsights.suggestions,
      recruiterPerspective: aiInsights.recruiterPerspective,
      quickWins: aiInsights.quickWins,
      profileSummary: aiInsights.profileSummary,
      metadata: {
        totalRepos: githubData.repositories.length,
        originalRepos: githubData.repositories.filter((r) => !r.is_fork).length,
        totalStars: githubData.repositories.reduce((sum, r) => sum + r.stars, 0),
        languages: Object.keys(githubData.languageStats),
        lastCommitDate: githubData.activityData.lastCommitDate,
      },
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze GitHub profile' },
      { status: 500 }
    );
  }
}
