/**
 * GitHub Service - Comprehensive GitHub API Integration
 * 
 * This service handles all interactions with GitHub's REST and GraphQL APIs.
 * It fetches user profile data, repositories, README content, commit activity,
 * pinned repositories, and calculates various metrics for portfolio analysis.
 * 
 * Key Features:
 * - User profile fetching (bio, followers, stats)
 * - Repository metadata collection (stars, forks, languages, topics)
 * - README detection and quality assessment
 * - Pinned repositories via GraphQL
 * - Commit activity analysis (frequency, recency)
 * - Language distribution statistics
 * - Error handling for rate limits and missing data
 */

import { Octokit } from '@octokit/rest';

// Initialize Octokit client with GitHub Personal Access Token
// This provides authenticated access to GitHub API with higher rate limits
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * GitHub User Profile Data
 * Contains essential user information from GitHub profile
 */
export interface GitHubUser {
  login: string;              // GitHub username
  name: string | null;         // Display name
  bio: string | null;          // Profile bio text
  avatar_url: string;          // Profile picture URL
  followers: number;           // Follower count
  following: number;           // Following count
  public_repos: number;        // Total public repositories
  created_at: string;          // Account creation date
  updated_at: string;          // Last profile update
}

/**
 * Repository Metadata
 * Comprehensive repository information including README analysis
 */
export interface Repository {
  name: string;                // Repository name
  description: string | null;   // Repository description
  stars: number;               // Star count (community validation)
  forks: number;               // Fork count (impact indicator)
  language: string | null;      // Primary programming language
  topics: string[];            // GitHub topics/tags
  updated_at: string;          // Last update timestamp
  created_at: string;          // Creation timestamp
  size: number;                // Repository size in KB
  has_readme: boolean;         // README presence (critical for documentation score)
  readme_content?: string;     // Decoded README text (for quality analysis)
  readme_length?: number;      // README character count (quality indicator)
  is_fork: boolean;            // Whether this is a forked repository
  open_issues: number;         // Number of open issues
}

export interface GitHubAnalysisData {
  user: GitHubUser;
  repositories: Repository[];
  pinnedRepos: string[];
  totalCommits: number;
  languageStats: Record<string, number>;
  activityData: {
    lastCommitDate: string | null;
    commitFrequency: number; // commits per month average over last 6 months
    activeDays: number;
  };
}

export class GitHubService {
  /**
   * Fetch complete GitHub profile data for analysis
   */
  static async fetchUserData(username: string): Promise<GitHubAnalysisData> {
    try {
      // Fetch user profile
      const { data: user } = await octokit.users.getByUsername({ username });

      // Fetch all public repos
      const { data: repos } = await octokit.repos.listForUser({
        username,
        per_page: 100,
        sort: 'updated',
      });

      // Process repositories with README checks
      const repositories: Repository[] = await Promise.all(
        repos.map(async (repo) => {
          let has_readme = false;
          let readme_content: string | undefined;
          let readme_length = 0;

          try {
            const { data: readme } = await octokit.repos.getReadme({
              owner: username,
              repo: repo.name,
            });
            has_readme = true;
            readme_content = Buffer.from(readme.content, 'base64').toString('utf-8');
            readme_length = readme_content.length;
          } catch {
            // README doesn't exist
          }

          return {
            name: repo.name,
            description: repo.description,
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            language: repo.language || null,  // Convert undefined to null
            topics: repo.topics || [],
            updated_at: repo.updated_at || '',
            created_at: repo.created_at || '',
            size: repo.size || 0,
            has_readme,
            readme_content,
            readme_length,
            is_fork: repo.fork || false,
            open_issues: repo.open_issues_count || 0,
          };
        })
      );

      // Fetch pinned repositories (requires GraphQL)
      const pinnedRepos = await this.fetchPinnedRepos(username);

      // Calculate commit statistics
      const activityData = await this.calculateActivityData(username, repositories);

      // Calculate language statistics
      const languageStats = this.calculateLanguageStats(repositories);

      return {
        user: {
          login: user.login,
          name: user.name,
          bio: user.bio,
          avatar_url: user.avatar_url,
          followers: user.followers,
          following: user.following,
          public_repos: user.public_repos,
          created_at: user.created_at || '',
          updated_at: user.updated_at || '',
        },
        repositories,
        pinnedRepos,
        totalCommits: activityData.totalCommits,
        languageStats,
        activityData: {
          lastCommitDate: activityData.lastCommitDate,
          commitFrequency: activityData.commitFrequency,
          activeDays: activityData.activeDays,
        },
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error('GitHub user not found');
      }
      if (error.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
      throw new Error('Failed to fetch GitHub data: ' + error.message);
    }
  }

  /**
   * Fetch pinned repositories using GraphQL
   */
  private static async fetchPinnedRepos(username: string): Promise<string[]> {
    try {
      const query = `
        query {
          user(login: "${username}") {
            pinnedItems(first: 6, types: REPOSITORY) {
              nodes {
                ... on Repository {
                  name
                }
              }
            }
          }
        }
      `;

      const response: any = await octokit.graphql(query);
      return response.user.pinnedItems.nodes.map((node: any) => node.name);
    } catch {
      return [];
    }
  }

  /**
   * Calculate Activity Metrics
   * 
   * Analyzes commit history to determine developer activity patterns.
   * This is crucial for the "Activity Consistency" scoring dimension.
   * 
   * Metrics calculated:
   * - Total commits: Overall contribution volume
   * - Last commit date: Recency indicator (dormant account detection)
   * - Commit frequency: Average commits per month over last 6 months
   * - Active days: Number of unique days with commits (consistency indicator)
   * 
   * @param username - GitHub username
   * @param repositories - List of user's repositories
   * @returns Activity metrics object
   */
  private static async calculateActivityData(
    username: string,
    repositories: Repository[]
  ): Promise<{
    totalCommits: number;
    lastCommitDate: string | null;
    commitFrequency: number;
    activeDays: number;
  }> {
    try {
      // Get the most recent non-fork repos to analyze genuine activity
      // Limit to 10 repos to balance API rate limits vs data accuracy
      const recentRepos = repositories
        .filter((r) => !r.is_fork)  // Exclude forks (not original work)
        .slice(0, 10);               // Top 10 most recently updated

      let totalCommits = 0;
      let lastCommitDate: string | null = null;
      const commitDates: string[] = [];

      for (const repo of recentRepos) {
        try {
          const { data: commits } = await octokit.repos.listCommits({
            owner: username,
            repo: repo.name,
            author: username,
            per_page: 100,
          });

          totalCommits += commits.length;

          commits.forEach((commit) => {
            const date = commit.commit.author?.date;
            if (date) {
              commitDates.push(date);
              if (!lastCommitDate || new Date(date) > new Date(lastCommitDate)) {
                lastCommitDate = date;
              }
            }
          });
        } catch {
          // Skip repos with no commits or errors
        }
      }

      // Calculate commit frequency (commits per month over last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentCommits = commitDates.filter(
        (date) => new Date(date) > sixMonthsAgo
      );
      const commitFrequency = (recentCommits.length / 6);

      // Calculate active days
      const uniqueDays = new Set(
        commitDates.map((date) => new Date(date).toLocaleDateString())
      );

      return {
        totalCommits,
        lastCommitDate,
        commitFrequency,
        activeDays: uniqueDays.size,
      };
    } catch {
      return {
        totalCommits: 0,
        lastCommitDate: null,
        commitFrequency: 0,
        activeDays: 0,
      };
    }
  }

  /**
   * Calculate language distribution
   */
  private static calculateLanguageStats(
    repositories: Repository[]
  ): Record<string, number> {
    const stats: Record<string, number> = {};

    repositories.forEach((repo) => {
      if (repo.language) {
        stats[repo.language] = (stats[repo.language] || 0) + 1;
      }
    });

    return stats;
  }
}
