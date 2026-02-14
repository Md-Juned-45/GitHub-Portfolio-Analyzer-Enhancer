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
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

/**
 * GraphQL query to fetch complete profile data in one request
 */
const PROFILE_QUERY = `
  query GetGitHubProfile($username: String!) {
    user(login: $username) {
      login
      name
      bio
      avatarUrl
      createdAt
      updatedAt
      followers { totalCount }
      following { totalCount }
      
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
            
            # Commit history
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 100) {
                    totalCount
                    nodes {
                      committedDate
                    }
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
      // Single GraphQL query fetches everything
      const response = await fetch(GITHUB_GRAPHQL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: PROFILE_QUERY,
          variables: { username }
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

      return {
        user,
        repositories,
        pinnedRepos: pinnedRepoNames,
        totalCommits: activityData.totalCommits,
        languageStats,
        activityData: {
          lastCommitDate: activityData.lastCommitDate,
          commitFrequency: activityData.commitFrequency,
          activeDays: activityData.activeDays,
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
      open_issues: repo.issues?.totalCount || 0,
      homepage: repo.homepageUrl,
      code_quality,
    };
  }

  /**
   * Calculate activity metrics from repositories (raw GraphQL data)
   */
  private static calculateActivityData(repositories: any[]) {
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
    const commitFrequency = (recentCommits.length / 6) || 0;

    // Calculate active days
    const uniqueDays = new Set(commitDates.map(d => d.toDateString()));
    const activeDays = uniqueDays.size;

    return {
      totalCommits,
      lastCommitDate,
      commitFrequency,
      activeDays,
    };
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
