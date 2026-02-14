/**
 * GraphQL-Based GitHub Service - Optimized for Rate Limits
 * 
 * Reduces API calls from 130+ per profile to 2-3 using GitHub's GraphQL API.
 * 
 * Key improvements:
 * - Single query fetches user, repos, READMEs, commits, issues, PRs
 * - ~98% reduction in API calls
 * - Enables analyzing ~1,600 users/hour instead of ~38
 */

import { GitHubAnalysisData, Repository, GitHubUser } from './github-service';

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

/**
 * Token Rotation
 * Rotates through multiple GitHub tokens to multiply rate limits.
 */
const getGitHubToken = () => {
  // Check for rotated tokens first
  if (process.env.GITHUB_TOKENS) {
    const tokens = process.env.GITHUB_TOKENS.split(',').filter(t => t.trim().length > 0);
    if (tokens.length > 0) {
      // Pick a random token to distribute load
      return tokens[Math.floor(Math.random() * tokens.length)].trim();
    }
  }
  // Fallback to single token
  return process.env.GITHUB_TOKEN || '';
};

/**
 * Query to fetch user ID first (needed for commit filtering)
 */
const GET_USER_ID_QUERY = `
  query GetUserId($username: String!) {
    user(login: $username) {
      id
    }
  }
`;

/**
 * GraphQL query to fetch complete profile data in one request
 */
const PROFILE_QUERY = `
  query GetGitHubProfile($username: String!, $authorId: ID!) {
    user(login: $username) {
      login
      name
      bio
      avatarUrl
      createdAt
      updatedAt
      followers { totalCount }
      followers { totalCount }
      following { totalCount }
      company
      location
      email
      websiteUrl
      twitterUsername
      
      # Global Stats
      issues { totalCount }
      pullRequests { totalCount }
      repositoriesContributedTo { totalCount }
      
      # Pinned repositories (prioritized for scoring)
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            stargazerCount
            forkCount
            updatedAt
            createdAt
            homepageUrl
            isFork
            primaryLanguage { name }
            repositoryTopics(first: 10) {
              nodes { topic { name } }
            }
            
            # README content
            readme: object(expression: "HEAD:README.md") {
              ... on Blob { 
                text 
                byteSize
              }
            }
            
            # Alternative README locations
            readmeLower: object(expression: "HEAD:readme.md") {
              ... on Blob { text }
            }
            
            # CI/CD detection
            githubWorkflows: object(expression: "HEAD:.github/workflows") {
              ... on Tree { 
                entries { name }
              }
            }
            
            # Test directories
            testsDir: object(expression: "HEAD:tests") {
              ... on Tree { oid }
            }
            testDir: object(expression: "HEAD:test") {
              ... on Tree { oid }
            }
            __testsDir: object(expression: "HEAD:__tests__") {
              ... on Tree { oid }
            }
            specDir: object(expression: "HEAD:spec") {
              ... on Tree { oid }
            }
            
            # TypeScript detection
            tsconfig: object(expression: "HEAD:tsconfig.json") {
              ... on Blob { oid }
            }
            
            # Linting detection
            eslintrc: object(expression: "HEAD:.eslintrc") {
              ... on Blob { oid }
            }
            eslintJson: object(expression: "HEAD:.eslintrc.json") {
              ... on Blob { oid }
            }
            prettierrc: object(expression: "HEAD:.prettierrc") {
              ... on Blob { oid }
            }
            
            # Commit history (general)
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 100) {
                    totalCount
                    nodes {
                      committedDate
                    }
                  }
                  # Check if user actually contributed (for forks)
                  authoredBy: history(first: 1, author: {id: $authorId}) {
                    totalCount
                  }
                }
              }
            }
            
            # Issues and PRs
            issues { totalCount }
            pullRequests { totalCount }
          }
        }
      }
      
      # All repositories (fallback for non-pinned) - REDUCED from 100 to 20 to prevent timeouts
      repositories(first: 20, ownerAffiliations: OWNER, 
                   orderBy: {field: UPDATED_AT, direction: DESC}) {
        totalCount
        nodes {
          name
          description
          stargazerCount
          forkCount
          updatedAt
          createdAt
          homepageUrl
          isFork
          primaryLanguage { name }
          repositoryTopics(first: 10) {
            nodes { topic { name } }
          }
          
          readme: object(expression: "HEAD:README.md") {
            ... on Blob { 
              text
              byteSize
            }
          }
          
          githubWorkflows: object(expression: "HEAD:.github/workflows") {
            ... on Tree { entries { name } }
          }
          
          testsDir: object(expression: "HEAD:tests") {
            ... on Tree { oid }
          }
          testDir: object(expression: "HEAD:test") {
            ... on Tree { oid }
          }
          
          tsconfig: object(expression: "HEAD:tsconfig.json") {
            ... on Blob { oid }
          }
          
          eslintrc: object(expression: "HEAD:.eslintrc") {
            ... on Blob { oid }
          }
          
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 100) {
                  totalCount
                  nodes { committedDate }
                }
                # Check if user actually contributed (for forks)
                authoredBy: history(first: 1, author: {id: $authorId}) {
                  totalCount
                }
              }
            }
          }
          
          issues { totalCount }
        }
      }
    }
  }
`;

export class GraphQLGitHubService {
  /**
   * Fetch complete GitHub profile data using GraphQL (2-3 API calls instead of 130+)
   */
  static async fetchUserData(username: string): Promise<GitHubAnalysisData> {
    try {
      // Step 1: Fetch User ID first (needed for commit filtering)
      const idResponse = await fetch(GITHUB_GRAPHQL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getGitHubToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_USER_ID_QUERY,
          variables: { username }
        })
      });

      if (!idResponse.ok) {
        throw new Error(`GraphQL ID request failed: ${idResponse.statusText}`);
      }

      const idData = await idResponse.json();
      if (idData.errors || !idData.data?.user?.id) {
        // Fallback: If we can't get ID, we can't filter commits by author. 
        // We could proceed without it but let's throw to trigger REST fallback if strictly needed
        // OR we can just pass null and handle it? 
        // The query requires $authorId : ID! so we must have it.
        throw new Error('Could not resolve User ID for commit filtering');
      }

      const authorId = idData.data.user.id;

      // Step 2: Single GraphQL query fetches everything using authorId
      const response = await fetch(GITHUB_GRAPHQL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getGitHubToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: PROFILE_QUERY,
          variables: { username, authorId }
        })
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }

      const { data, errors } = await response.json();
      
      if (errors) {
        console.error('GraphQL errors:', errors);
        throw new Error(errors[0]?.message || 'GraphQL query failed');
      }

      if (!data?.user) {
        throw new Error(`User ${username} not found`);
      }

      const userData = data.user;

      // Transform GraphQL response to match existing interface
      const user: GitHubUser = {
        login: userData.login,
        name: userData.name,
        bio: userData.bio,
        avatar_url: userData.avatarUrl,
        followers: userData.followers.totalCount,
        following: userData.following.totalCount,
        public_repos: userData.repositories.totalCount,
        created_at: userData.createdAt,
        updated_at: userData.updatedAt,
        company: userData.company,
        location: userData.location,
        email: userData.email,
        blog: userData.websiteUrl,
        twitter_username: userData.twitterUsername,
        total_issues: userData.issues.totalCount,
        total_prs: userData.pullRequests.totalCount,
        contributed_to: userData.repositoriesContributedTo.totalCount,
      };

      // Combine pinned and regular repos (raw GraphQL data)
      const rawPinnedRepos = userData.pinnedItems.nodes;
      const rawAllRepos = userData.repositories.nodes;
      
      // Deduplicate raw repos
      const rawRepoMap = new Map<string, any>();
      [...rawPinnedRepos, ...rawAllRepos].forEach((repo: any) => {
        if (!rawRepoMap.has(repo.name)) {
          rawRepoMap.set(repo.name, repo);
        }
      });
      
      const rawRepositories = Array.from(rawRepoMap.values());

      // Calculate activity data BEFORE transforming (need raw GraphQL data)
      const activityData = this.calculateActivityData(rawRepositories);

      // NOW transform to Repository interface
      const repositories = rawRepositories.map(repo => this.transformRepo(repo));

      // Extract pinned repo names
      const pinnedRepoNames = userData.pinnedItems.nodes.map((r: any) => r.name);

      // Calculate language stats
      const languageStats = this.calculateLanguageStats(repositories);

      // Detect badges
      const badges = await this.detectBadges(username);

      return {
        user,
        repositories,
        pinnedRepos: pinnedRepoNames,
        totalCommits: activityData.totalCommits,
        languageStats,
        badges, // NEW: Gamification badges
        activityData: {
          lastCommitDate: activityData.lastCommitDate,
          commitFrequency: activityData.commitFrequency,
          activeDays: activityData.activeDays,
          currentStreak: activityData.currentStreak,
          longestStreak: activityData.longestStreak,
          totalContributions: activityData.totalContributions,
        },
      };

    } catch (error: any) {
      console.error('GraphQL fetch error:', error);
      throw new Error(`Failed to fetch GitHub data: ${error.message}`);
    }
  }

  /**
   * Transform GraphQL repo to Repository interface
   */
  private static transformRepo(repo: any): Repository {
    // Get README content (try different locations)
    const readmeContent = repo.readme?.text || repo.readmeLower?.text;
    const readmeLength = readmeContent?.length || 0;
    const has_readme = !!readmeContent;

    // Detect code quality indicators
    const code_quality = {
      hasCI: !!repo.githubWorkflows?.entries?.length,
      hasTests: !!(repo.testsDir || repo.testDir || repo.__testsDir || repo.specDir),
      hasTypeScript: !!repo.tsconfig,
      hasLinting: !!(repo.eslintrc || repo.eslintJson || repo.prettierrc),
    };

    // Extract authored commit count (from our smart filtering)
    const authored_commit_count = repo.defaultBranchRef?.target?.authoredBy?.totalCount || 0;

    return {
      name: repo.name,
      description: repo.description,
      stars: repo.stargazerCount || 0,
      forks: repo.forkCount || 0,
      language: repo.primaryLanguage?.name || null,
      topics: repo.repositoryTopics?.nodes?.map((t: any) => t.topic.name) || [],
      updated_at: repo.updatedAt,
      created_at: repo.createdAt,
      size: 0, // Not available in GraphQL, but not critical
      has_readme,
      readme_content: readmeContent,
      readme_length: readmeLength,
      is_fork: repo.isFork || false,
      authored_commit_count, // NEW: Real contribution tracking
      open_issues: repo.issues?.totalCount || 0,
      homepage: repo.homepageUrl,
      code_quality,
    };
  }

  /**
   * Calculate activity metrics from repositories (raw GraphQL data)
   */
  private static calculateActivityData(repositories: any[]) {
    try {
      let totalCommits = 0;
      let lastCommitDate: string | null = null;
      const commitDates: Date[] = [];

      repositories.forEach((repo: any) => {
        const history = repo.defaultBranchRef?.target?.history;
        if (history) {
          totalCommits += history.totalCount || 0;
          
          history.nodes?.forEach((commit: any) => {
            const date = new Date(commit.committedDate);
            commitDates.push(date);
            
            if (!lastCommitDate || date > new Date(lastCommitDate)) {
              lastCommitDate = commit.committedDate;
            }
          });
        }
      });

      // Calculate commit frequency (commits per month over last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentCommits = commitDates.filter(d => d >= sixMonthsAgo);
      const commitFrequency = recentCommits.length > 0 ? (recentCommits.length / 6) : 0;
      
      const uniqueDays = new Set(commitDates.map(d => d.toDateString()));
      const activeDays = uniqueDays.size;

      // Calculate Streaks
      const sortedDates = Array.from(uniqueDays)
        .map(d => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime());
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      // Check current streak
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (sortedDates.length > 0) {
        const lastCommit = sortedDates[0];
        const isRecent = 
          lastCommit.toDateString() === today.toDateString() || 
          lastCommit.toDateString() === yesterday.toDateString();
          
        if (isRecent) {
          currentStreak = 1;
          for (let i = 0; i < sortedDates.length - 1; i++) {
            const curr = sortedDates[i];
            const next = sortedDates[i + 1];
            const diffTime = Math.abs(curr.getTime() - next.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }

      // Check longest streak
      if (sortedDates.length > 0) {
        tempStreak = 1;
        longestStreak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const curr = sortedDates[i];
          const next = sortedDates[i + 1];
          const diffDays = Math.ceil(Math.abs(curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
          longestStreak = Math.max(longestStreak, tempStreak);
        }
      }

      return {
        totalCommits,
        lastCommitDate,
        commitFrequency,
        activeDays,
        currentStreak,
        longestStreak,
        totalContributions: totalCommits, 
      };
    } catch (error) {
      console.error('Error calculating activity data:', error);
      return {
        totalCommits: 0,
        lastCommitDate: null,
        commitFrequency: 0,
        activeDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalContributions: 0,
      };
    }
  }

  /**
   * Check if a user has a specific GitHub achievement badge
   * Uses HEAD request to avoid API costs
   */
  private static async checkAchievementStatus(username: string, slug: string): Promise<string | null> {
    try {
      const url = `https://github.com/${username}?tab=achievements&achievement=${slug}`;
      const res = await fetch(url, { method: 'HEAD' });
      return res.status === 200 ? slug : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Detect all supported badges in parallel
   */
  private static async detectBadges(username: string): Promise<string[]> {
    const BADGES = ['pull-shark', 'yolo', 'quickdraw', 'famed-user', 'pair-extraordinaire', 'starstruck'];
    
    // Run all checks in parallel
    const results = await Promise.all(
      BADGES.map(slug => this.checkAchievementStatus(username, slug))
    );
    
    return results.filter((slug): slug is string => slug !== null);
  }

  /**
   * Calculate language statistics
   */
  private static calculateLanguageStats(repositories: Repository[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    repositories.forEach(repo => {
      if (repo.language && !repo.is_fork) {
        stats[repo.language] = (stats[repo.language] || 0) + 1;
      }
    });

    return stats;
  }
}
