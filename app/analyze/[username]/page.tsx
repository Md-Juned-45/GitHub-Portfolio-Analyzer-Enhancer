/**
 * Analysis Results Page - Cyber-Tech/Mission Control Aesthetic
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

// ... (Interfaces remain the same)
interface ScoreDimension {
  name: string;
  score: number;
  weight: number;
  feedback: string;
  whyItMatters: string;
}

interface RedFlag {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface Suggestion {
  title: string;
  description: string;
  priority: string;
  effort: string;
  impact: string;
  timeEstimate: string;
}

interface Repository {
  name: string;
  description: string | null;
  stars: number;
  language: string | null;
  has_readme: boolean;
  is_fork?: boolean;
  authored_commit_count?: number;
}

interface ProjectIdea {
  title: string;
  description: string;
  techStack: string[];
}

interface AnalysisResult {
  user: {
    login: string;
    name: string | null;
    bio: string | null;
    avatar_url: string;
    followers: number;
    public_repos: number;
    company?: string | null;
    location?: string | null;
    email?: string | null;
    blog?: string | null;
    twitter_username?: string | null;
    total_issues?: number;
    total_prs?: number;
    contributed_to?: number;
  };
  score: number;
  profileType?: string;  // NEW: student/professional/open-source
  badges?: string[];     // NEW: Gamification
  profileTag?: string;   // NEW: Sarcastic tag
  projectIdeas?: ProjectIdea[]; // NEW: Tech-stack based ideas
  
  // Activity Data
  activity: {
    totalCommits: number;
    lastCommitDate: string | null;
    commitFrequency: number;
    activeDays: number;
    currentStreak: number;
    longestStreak: number;
    totalContributions: number;
  };
  
  dimensions: ScoreDimension[];
  redFlags?: RedFlag[];  // OPTIONAL: Old scoring engine only
  topSuggestions?: Array<{  // NEW: From new scoring engine
    id: string;
    title: string;
    points: number;
    category: string;
    difficulty: string;
    timeEstimate: string;
    priority: string;
  }>;
  topRepos: Repository[];
  strengths: string[];
  suggestions: Suggestion[];
  recruiterPerspective: string;
  quickWins: string[];
  profileSummary: string;
  metadata: {
    totalRepos: number;
    originalRepos: number;
    totalStars: number;
    languages: string[];
    topLanguages?: Record<string, number>; // Language distribution
    lastCommitDate: string | null;
    fetchMode?: 'graphql' | 'rest'; // Which API was used
    aiModel?: string; // NEW: Hybrid AI tracking
  };
}

export default function AnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!username) return;

    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/analyze?username=${username}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Analysis Failed');
        setResult(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [username]);

  // Loading Screen - Terminal Style
  if (isLoading) {
    return (
      <div className="min-h-screen bg-page text-text-primary flex flex-col items-center justify-center p-8 font-mono">
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-between text-xs text-text-tertiary uppercase tracking-widest">
            <span>System</span>
            <span>Initializing...</span>
          </div>
          <div className="h-1 bg-border-subtle rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 w-1/2 animate-[shimmer_2s_infinite]" />
          </div>
          <div className="space-y-1 text-xs text-green-500 font-mono">
            <p>&gt; Establishing secure uplink to GitHub...</p>
            <p className="delay-100 animate-fade-in">&gt; Downloading repository metadata [==================]</p>
            <p className="delay-200 animate-fade-in">&gt; Analyzing commit patterns & code frequency...</p>
            <p className="delay-300 animate-fade-in text-blue-400">&gt; Running recruiter simulation algorithm...</p>
            <p className="delay-500 animate-fade-in text-yellow-500">&gt; DETECTING ANOMALIES...</p>
            <p className="delay-700 animate-fade-in text-green-500 font-bold">&gt; OPTIMIZATION MATRIX GENERATED.</p>
          </div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-page">
        <div className="max-w-md w-full border border-red-500/30 bg-red-500/10 p-8 rounded-lg space-y-4">
          <div className="text-red-500 font-mono text-xs uppercase tracking-widest">System Error</div>
          <h2 className="text-2xl font-bold text-text-primary">Analysis Terminated</h2>
          <p className="text-text-secondary font-mono text-sm">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-text-primary text-page font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            RETRY SEQUENCE
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen bg-page text-text-primary p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Print-Only Header */}
        <div className="hidden print:block pb-6 border-b border-black mb-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-black tracking-tighter">GITHUB PORTFOLIO ANALYZER</h1>
              <p className="text-sm text-gray-600 mt-1">Recruiter-Ready Profile Assessment Report</p>
              <a href="https://github.com/Md-Juned-45" target="_blank" className="flex items-center gap-2 mt-2" style={{ textDecoration: 'none' }}>
                <img src="https://github.com/Md-Juned-45.png" alt="Juned Pinjari" className="w-6 h-6 rounded-full border border-gray-300" />
                <p className="text-xs text-gray-500">Created by <b>Juned Pinjari</b></p>
              </a>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-black">@{username}</div>
              <div className="text-xs text-gray-500 mt-1">Generated: {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="flex items-center justify-between border-b border-border-subtle pb-4">
          <button 
            onClick={() => router.push('/')}
            className="text-text-tertiary hover:text-text-primary text-xs font-mono uppercase tracking-widest transition-colors"
          >
            ← Returns to Console
          </button>
          
          {/* Right Nav */}
          <div className="flex gap-4 items-center">
             {/* Fetch Mode Indicator */}
             {result.metadata.fetchMode && (
               <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                 result.metadata.fetchMode === 'graphql' 
                   ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' 
                   : 'bg-amber-900/30 text-amber-400 border border-amber-800/50'
               }`}>
                 {result.metadata.fetchMode === 'graphql' ? '⚡ Fast mode' : '🔄 Compatibility mode'}
               </span>
             )}
             
             <ThemeToggle />
             
             <button
               onClick={() => window.print()}
               className="text-text-tertiary hover:text-text-primary text-xs font-mono uppercase tracking-widest transition-colors flex items-center gap-1"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
               Download Report
             </button>

             <a href={`https://github.com/${username}`} target="_blank" className="text-text-tertiary hover:text-text-primary text-xs font-mono uppercase tracking-widest transition-colors">
               View Source ↗
             </a>
          </div>
        </nav>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Profile & Score (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Profile Card */}
            <div className="card p-6 flex flex-col items-center text-center space-y-4 relative overflow-hidden bg-card border-border-subtle">
               <div className="absolute inset-0 bg-gradient-to-b from-blue-100 dark:from-blue-900/10 to-transparent pointer-events-none" />
               <img 
                 src={result.user.avatar_url} 
                 alt={result.user.login}
                 className="w-24 h-24 rounded-full border border-border-subtle"
               />
               <div>
                 <h1 className="text-2xl font-bold text-text-primary">{result.user.name || result.user.login}</h1>
                 <p className="text-text-secondary font-mono text-sm mb-3">@{result.user.login}</p>
                 
                 {/* Bio */}
                 <p className="text-sm text-text-secondary mb-4 italic max-w-xs mx-auto leading-relaxed">
                   {result.user.bio || "No bio available"}
                 </p>

                 {/* Profile Details */}
                 <div className="flex flex-col gap-1.5 text-xs text-text-secondary w-full max-w-xs mx-auto mb-4 px-4">
                   {result.user.company && (
                     <div className="flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8.8a2 2 0 0 0-2-2h-2.8a2 2 0 0 0-2 2V21"/></svg>
                       <span className="truncate">{result.user.company}</span>
                     </div>
                   )}
                   {result.user.location && (
                     <div className="flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                       <span className="truncate">{result.user.location}</span>
                     </div>
                   )}
                   {result.user.email && (
                     <div className="flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                       <a href={`mailto:${result.user.email}`} className="hover:text-text-primary hover:underline truncate">{result.user.email}</a>
                     </div>
                   )}
                   {result.user.blog && (
                     <div className="flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                       <a href={result.user.blog.startsWith('http') ? result.user.blog : `https://${result.user.blog}`} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary hover:underline truncate text-blue-500">{result.user.blog}</a>
                     </div>
                   )}
                   {result.user.twitter_username && (
                     <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                        <a href={`https://twitter.com/${result.user.twitter_username}`} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary hover:underline truncate">@{result.user.twitter_username}</a>
                     </div>
                   )}
                 </div>
                 
                 {/* NEW: Profile Type Badge */}
                 {result.profileType && (
                   <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                     result.profileType === 'student' 
                       ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50' 
                       : result.profileType === 'open-source'
                       ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50'
                       : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                   }`}>
                     {result.profileType === 'open-source' ? 'OSS Contributor' : result.profileType}
                   </div>
                 )}

                  {/* Gamification Badges */}
                  {result.badges && result.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center mt-3 animate-fade-in">
                      {result.badges.map(badge => {
                        const badgeMap: Record<string, string> = {
                          'pull-shark': 'https://github.githubassets.com/images/modules/profile/achievements/pull-shark-default.png',
                          'yolo': 'https://github.githubassets.com/images/modules/profile/achievements/yolo-default.png',
                          'quickdraw': 'https://github.githubassets.com/images/modules/profile/achievements/quickdraw-default.png',
                          'starstruck': 'https://github.githubassets.com/images/modules/profile/achievements/starstruck-default.png',
                          'pair-extraordinaire': 'https://github.githubassets.com/images/modules/profile/achievements/pair-extraordinaire-default.png',
                          'famed-user': 'https://github.githubassets.com/images/modules/profile/achievements/galaxy-brain-default.png'
                        };
                        
                        const imageUrl = badgeMap[badge];
                        
                        if (imageUrl) {
                          return (
                            <img 
                              key={badge}
                              src={imageUrl} 
                              alt={badge} 
                              className="w-12 h-12 hover:scale-110 transition-transform cursor-help"
                              title={`GitHub Achievement: ${badge.replace(/-/g, ' ')}`}
                            />
                          );
                        }
                        
                        return (
                          <div key={badge} className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-600 dark:text-yellow-500 uppercase tracking-wider font-mono flex items-center hover:bg-yellow-500/20 transition-colors cursor-help" title={`GitHub Achievement: ${badge}`}>
                            {badge.replace(/-/g, ' ')}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Sarcastic Profile Tag */}
                  {result.profileTag && (
                    <div className="mt-4 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-lg text-pink-600 dark:text-pink-400 text-sm font-mono italic text-center max-w-full animate-fade-in relative group cursor-default">
                       <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-page px-1 text-[8px] text-pink-700 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">AI Roast</span>
                       "{result.profileTag}"
                    </div>
                  )}
               </div>
               

                   
                   {/* Stats moved to main column */}

                   {/* Original Stats Grid (Hidden or Removed) */}

            </div>

            {/* Score Card */}
            <div className="card p-8 text-center space-y-2 relative bg-card border-border-subtle">
               <div className="text-xs text-text-tertiary uppercase tracking-widest">Composite Score</div>
               <div className="text-8xl font-bold tracking-tighter text-text-primary">
                 {result.score ?? 0}
               </div>
               <div className="text-xs text-text-secondary font-mono">/ 100 POINTS</div>
               
               {/* Score Indicator Line */}
               <div className="w-full h-1 bg-border-subtle mt-4 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-blue-600 dark:bg-white transition-all duration-1000 ease-out"
                   style={{ width: `${result.score ?? 0}%` }} 
                 />
               </div>
            </div>

             {/* Red Flags - DEPRECATED: New scoring engine uses suggestions instead
            {result.redFlags.length > 0 && (
              <div className="card p-6 space-y-4 border-red-900/30 bg-red-950/10">
                <h3 className="text-red-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  System Alerts Detected
                </h3>
                <div className="space-y-3">
                  {result.redFlags.map((flag, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="text-white font-medium block">{flag.title}</span>
                      <span className="text-red-400/60 text-xs">{flag.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            */}
          </div>

          {/* RIGHT COLUMN: Metrics & Insights (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* NEW: GitHub Activity Stats (Relocated) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                
                {/* 1. General Stats */}
                <div className="bg-card-subtle/50 rounded-xl p-4 border border-border-subtle col-span-1">
                <h3 className="text-sm font-bold text-text-secondary mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
                    GitHub Statistics
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        Total Stars Earned:
                    </span>
                    <span className="font-mono font-bold text-text-primary">{result.metadata.totalStars}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Total Commits:
                    </span>
                    <span className="font-mono font-bold text-text-primary">{result.activity.totalCommits + (result.user.total_issues || 0) + (result.user.total_prs || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>
                        Total PRs:
                        </span>
                        <span className="font-mono font-bold text-text-primary">{result.user.total_prs || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                        Total Issues:
                        </span>
                        <span className="font-mono font-bold text-text-primary">{result.user.total_issues || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        Contributed to:
                        </span>
                        <span className="font-mono font-bold text-text-primary">{result.user.contributed_to || 0}</span>
                    </div>
                </div>
                </div>

                {/* 2. Most Used Languages */}
                <div className="bg-card-subtle/50 rounded-xl p-4 border border-border-subtle col-span-1">
                <h3 className="text-sm font-bold text-text-secondary mb-3 text-blue-500">Language Distribution</h3>
                <div className="space-y-4">
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-border-subtle/30">
                    {Object.entries(result.metadata.topLanguages || {})
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([lang, count], index) => {
                        const total = Object.values(result.metadata.topLanguages || {}).reduce((sum, c) => (sum as number) + (c as number), 0) as number;
                        const percent = ((count as number) / total) * 100;
                        const colors = ['bg-blue-500', 'bg-yellow-400', 'bg-red-500', 'bg-purple-500', 'bg-green-500'];
                        return (
                            <div 
                            key={lang} 
                            className={`${colors[index % colors.length]}`} 
                            style={{ width: `${percent}%` }}
                            />
                        );
                        })}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                    {Object.entries(result.metadata.topLanguages || {})
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 4)
                        .map(([lang, count], index) => {
                        const total = Object.values(result.metadata.topLanguages || {}).reduce((sum, c) => (sum as number) + (c as number), 0) as number;
                        const percent = ((count as number) / total) * 100;
                        const colors = ['text-blue-500', 'text-yellow-400', 'text-red-500', 'text-purple-500', 'text-green-500'];
                        const dotColors = ['bg-blue-500', 'bg-yellow-400', 'bg-red-500', 'bg-purple-500', 'bg-green-500'];
                        return (
                            <div key={lang} className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${dotColors[index % dotColors.length]}`} />
                            <span className="text-text-secondary truncate">{lang}</span>
                            <span className="text-text-primary font-mono ml-auto">{percent.toFixed(1)}%</span>
                            </div>
                        );
                        })}
                    </div>
                </div>
                </div>

                {/* 3. Streaks & Contributions */}
                <div className="bg-card-subtle/50 rounded-xl p-4 border border-border-subtle col-span-1 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-text-primary">{result.activity.totalContributions || result.activity.totalCommits}</div>
                        <div className="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">Total Contributions</div>
                        <div className="text-[10px] text-text-tertiary opacity-50">Last 6 Months</div>
                    </div>
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-border-subtle" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="175" strokeDashoffset={175 - (175 * 60 / 100)} className="text-orange-500" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-orange-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                            <span className="text-sm font-bold">{result.activity.currentStreak || 0}</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-border-subtle pt-4">
                    <div className="text-center">
                        <div className="text-lg font-bold text-text-primary">{result.activity.longestStreak || 0}</div>
                        <div className="text-[10px] text-text-tertiary uppercase tracking-wider">Longest Streak</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-text-primary">{result.activity.activeDays || 0}</div>
                        <div className="text-[10px] text-text-tertiary uppercase tracking-wider">Active Days</div>
                    </div>
                </div>
                </div>

            </div>
            
            {/* Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.dimensions.map((dim, idx) => (
                <div key={idx} className="card p-5 space-y-3 hover:bg-card-hover transition-colors group">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                      {dim.name}
                    </h3>
                    <span className="font-mono text-xs text-text-tertiary">{dim.weight}%</span>
                  </div>
                  
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold font-mono text-text-primary">{dim.score}</span>
                    <span className="text-text-tertiary text-sm mb-1">/100</span>
                  </div>

                  <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        dim.score >= 70 ? 'bg-green-500' : dim.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-text-secondary line-clamp-2 h-8">
                    {dim.feedback}
                  </p>
                </div>
              ))}
            </div>

            {/* NEW: Top Suggestions Cards (from new scoring engine) */}
            {result.topSuggestions && result.topSuggestions.length > 0 && (
              <div className="space-y-4 mt-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Top Improvements</h2>
                  <span className="text-xs text-text-secondary">{result.topSuggestions.length} actionable</span>
                </div>
                
                <div className="space-y-3">
                  {result.topSuggestions.map((suggestion, idx) => (
                    <div 
                      key={idx} 
                      className="card p-4 space-y-2 hover:bg-card-hover transition-colors border-l-2 border-l-transparent hover:border-l-blue-500"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-sm font-medium text-text-primary flex-1">{suggestion.title}</h3>
                        <span className="text-xs font-bold text-blue-400">+{suggestion.points} pts</span>
                      </div>
                      
                      <div className="flex gap-2 items-center text-[10px] text-text-secondary">
                        <span className={`px-2 py-0.5 rounded uppercase font-bold ${
                          suggestion.priority === 'critical' ? 'bg-red-500/10 text-red-500' :
                          suggestion.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
                          suggestion.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-border-subtle text-text-tertiary'
                        }`}>
                          {suggestion.priority}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{suggestion.difficulty}</span>
                        <span>•</span>
                        <span>{suggestion.timeEstimate}</span>
                        <span>•</span>
                        <span className="text-text-tertiary">{suggestion.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recruiter Insight */}
            <div className="card p-6 border-blue-500/20 bg-blue-50 dark:bg-blue-900/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-primary flex items-center">
                  <span className="w-1 h-6 bg-purple-500 mr-3 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                  Recruiter Perspective
                </h2>
                {result.metadata.aiModel && (
                  <div className="px-3 py-1 bg-card border border-border-subtle rounded-full text-xs font-mono text-text-secondary flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${result.metadata.aiModel.includes('Cerebras') ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-green-500'}`}></span>
                    Powered by {result.metadata.aiModel}
                  </div>
                )}
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-text-primary leading-relaxed font-light">
                  "{result.recruiterPerspective}"
                </p>
              </div>
            </div>

            {/* AI Project Recommendations (New Feature) */}
            {result.projectIdeas && result.projectIdeas.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">AI Project Ideas</h3>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 text-[10px] rounded border border-blue-200 dark:border-blue-900/30 uppercase tracking-wide">Based on your stack</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.projectIdeas.map((idea, idx) => (
                    <div key={idx} className="card p-4 hover:border-blue-500/30 transition-colors group flex flex-col h-full bg-card">
                      <h4 className="font-bold text-text-primary mb-2 text-sm group-hover:text-blue-400 transition-colors">{idea.title}</h4>
                      <p className="text-text-secondary text-xs mb-3 leading-relaxed flex-grow">{idea.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-border-subtle">
                        {idea.techStack.map(tech => (
                          <span key={tech} className="text-[10px] px-1.5 py-0.5 bg-border-subtle text-text-secondary rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Plan */}
            <div className="bg-card border border-border-subtle rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-border-subtle/50">
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">Optimization Protocol</h3>
                <span className="text-xs font-mono text-text-secondary">{result.suggestions.length} ACTIONS PENDING</span>
              </div>
              
              <div className="divide-y divide-border-subtle">
                {result.suggestions.slice(0, 5).map((sugg, idx) => (
                  <div key={idx} className="p-4 hover:bg-card-hover transition-colors flex gap-4 items-start">
                    <div className="font-mono text-text-tertiary text-xs mt-1">0{idx + 1}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between">
                        <h4 className="font-semibold text-text-primary">{sugg.title}</h4>
                        <div className="flex gap-2">
                           {sugg.impact === 'high' && (
                             <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded border border-green-500/20 uppercase">High Impact</span>
                           )}
                           <span className="text-[10px] bg-border-subtle text-text-secondary px-2 py-0.5 rounded border border-border-highlight uppercase">{sugg.timeEstimate}</span>
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary">{sugg.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Repositories Table */}
        <div className="space-y-4 pt-6 text-sm">
           <h3 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Repository Analysis</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {result.topRepos.map((repo, idx) => (
               <a 
                 key={idx} 
                 href={`https://github.com/${username}/${repo.name}`}
                 target="_blank"
                 className="card p-4 hover:border-border-highlight group transition-colors bg-card"
               >
                 <div className="flex justify-between items-start mb-2">
                   <span className="font-mono text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300">{repo.name}</span>
                   <span className="text-xs text-text-secondary">★ {repo.stars}</span>
                 </div>
                 <p className="text-xs text-text-secondary mb-3 line-clamp-2 min-h-[2.5em]">
                   {repo.description || 'No description provided.'}
                 </p>
                 <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-subtle">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${repo.language ? 'bg-blue-500' : 'bg-border-highlight'}`}></span>
                    <span className="text-xs text-text-tertiary">{repo.language || 'Text'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {repo.is_fork && (
                       <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                         (repo.authored_commit_count || 0) > 0 
                           ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' 
                           : 'bg-border-subtle border-border-highlight text-text-secondary'
                       }`}>
                         {repo.is_fork && (repo.authored_commit_count || 0) > 0 ? 'CONTRIBUTED' : 'FORK'}
                       </span>
                    )}
                    <span className="text-xs text-text-secondary flex items-center">
                      ★ {repo.stars}
                    </span>
                  </div>
                </div>
               </a>
             ))}
           </div>
        </div>

        {/* Print-Only Footer */}
        <div className="hidden print:block pt-6 border-t border-black mt-6 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="opacity-70">GitHub Portfolio Analyzer &copy; {new Date().getFullYear()}</span>
            <span className="opacity-50">•</span>
            <a href="https://github.com/Md-Juned-45" target="_blank" className="flex items-center gap-1.5" style={{ textDecoration: 'none' }}>
              <span className="opacity-70">Created by</span>
              <img src="https://github.com/Md-Juned-45.png" alt="Juned Pinjari" className="w-5 h-5 rounded-full border border-gray-300" />
              <b className="text-black">Juned Pinjari</b>
            </a>
          </div>
          <p>Detailed Report for @{username}</p>
        </div>

      </div>
    </div>
  );
}
