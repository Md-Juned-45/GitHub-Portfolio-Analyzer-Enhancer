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
import { GraphQLGitHubService } from '@/lib/graphql-github-service';
import { GitHubService } from '@/lib/github-service';  // Fallback for GraphQL failures
import { NewScoringEngine } from '@/lib/new-scoring-engine';
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

    // Step 1: Fetch GitHub data - Try GraphQL first, fallback to REST if it fails
    console.log(`Fetching data for username: ${username} (GraphQL mode)`);
    let githubData;
    let fetchMode = 'graphql'; // Track which mode was used for UI display
    
    try {
      githubData = await GraphQLGitHubService.fetchUserData(username);
    } catch (graphqlError: any) {
      console.warn('GraphQL failed, falling back to REST API:', graphqlError.message);
      console.log(`Fetching data for username: ${username} (REST fallback mode)`);
      fetchMode = 'rest';
      githubData = await GitHubService.fetchUserData(username);
    }

    // Step 2: Calculate portfolio scores with NEW student-focused engine
    console.log('Calculating scores with new profile-aware engine...');
    const portfolioScore = NewScoringEngine.calculateScore(githubData);

    // Step 3: Generate AI-powered suggestions and insights
    console.log('Generating AI insights...');
    const aiInsights = await AIAnalyzer.generateInsights(githubData, portfolioScore as any);

    // Step 4: Combine all results into unified response
    const result = {
      user: githubData.user,
      score: portfolioScore.totalScore,
      profileType: portfolioScore.profileType,
      badges: githubData.badges || [], // NEW: Gamification
      dimensions: portfolioScore.dimensions,
      topRepos: portfolioScore.topRepos,
      strengths: portfolioScore.strengths,
      topSuggestions: portfolioScore.topSuggestions,
      suggestions: aiInsights.suggestions,
      recruiterPerspective: aiInsights.recruiterPerspective,
      quickWins: aiInsights.quickWins,
      profileSummary: aiInsights.profileSummary,
      profileTag: aiInsights.profileTag, // NEW: Sarcastic tag
      projectIdeas: aiInsights.projectIdeas, // NEW: Project ideas
      activity: {
        totalCommits: githubData.totalCommits,
        lastCommitDate: githubData.activityData.lastCommitDate,
        commitFrequency: githubData.activityData.commitFrequency,
        activeDays: githubData.activityData.activeDays,
        currentStreak: (githubData.activityData as any).currentStreak || 0,
        longestStreak: (githubData.activityData as any).longestStreak || 0,
        totalContributions: (githubData.activityData as any).totalContributions || 0,
      },
      metadata: {
        totalRepos: githubData.repositories.length,
        originalRepos: githubData.repositories.filter((r) => !r.is_fork).length,
        totalStars: githubData.repositories.reduce((sum, r) => sum + r.stars, 0),
        languages: Object.keys(githubData.languageStats),
        topLanguages: githubData.languageStats, // For language graph
        lastCommitDate: githubData.activityData.lastCommitDate,
        fetchMode,
        aiModel: aiInsights.modelUsed, // NEW: Hybrid AI tracking
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
