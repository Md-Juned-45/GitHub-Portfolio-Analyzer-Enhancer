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
  };
  score: number;
  profileType?: string;  // NEW: student/professional/open-source
  badges?: string[];     // NEW: Gamification
  profileTag?: string;   // NEW: Sarcastic tag
  projectIdeas?: ProjectIdea[]; // NEW: Tech-stack based ideas
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
                 <p className="text-text-secondary font-mono text-sm">@{result.user.login}</p>
                 
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

                  {/* Gamification Badges (0xarchit Style) */}
                  {result.badges && result.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center mt-3 animate-fade-in">
                      {result.badges.map(badge => (
                        <div key={badge} className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-600 dark:text-yellow-500 uppercase tracking-wider font-mono flex items-center hover:bg-yellow-500/20 transition-colors cursor-help" title={`GitHub Achievement: ${badge}`}>
                          {badge === 'pull-shark' && '🦈 '}
                          {badge === 'yolo' && '🤠 '}
                          {badge === 'quickdraw' && '⚡ '}
                          {badge === 'starstruck' && '⭐ '}
                          {badge === 'pair-extraordinaire' && '👯 '}
                          {badge === 'famed-user' && '👑 '}
                          {badge.replace(/-/g, ' ')}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sarcastic Profile Tag (0xarchit Style) */}
                  {result.profileTag && (
                    <div className="mt-4 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-lg text-pink-600 dark:text-pink-400 text-sm font-mono italic text-center max-w-full animate-fade-in relative group cursor-default">
                       <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-page px-1 text-[8px] text-pink-700 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">AI Roast</span>
                       "{result.profileTag}"
                    </div>
                  )}
               </div>
               
               <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t border-border-subtle">
                 <div className="space-y-1">
                   <div className="text-xl font-bold text-text-primary">{result.user.followers}</div>
                   <div className="text-[10px] text-text-tertiary uppercase tracking-wider">Followers</div>
                 </div>
                 <div className="space-y-1">
                   <div className="text-xl font-bold text-text-primary">{result.metadata.totalRepos}</div>
                   <div className="text-[10px] text-text-tertiary uppercase tracking-wider">Repos</div>
                 </div>
                 <div className="space-y-1">
                   <div className="text-xl font-bold text-text-primary">{result.metadata.totalStars}</div>
                   <div className="text-[10px] text-text-tertiary uppercase tracking-wider">Stars</div>
                 </div>
               </div>
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

      </div>
    </div>
  );
}
