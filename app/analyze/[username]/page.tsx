/**
 * Analysis Results Page - Cyber-Tech/Mission Control Aesthetic
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-mono">
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-between text-xs text-neutral-500 uppercase tracking-widest">
            <span>System</span>
            <span>Initializing...</span>
          </div>
          <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 w-1/2 animate-[shimmer_2s_infinite]" />
          </div>
          <div className="space-y-1 text-xs text-green-500">
            <p>&gt; Connecting to GitHub API...</p>
            <p className="delay-100 animate-fade-in">&gt; Fetching repositories...</p>
            <p className="delay-200 animate-fade-in">&gt; Running heuristic analysis...</p>
            <p className="delay-300 animate-fade-in">&gt; Generating vector scores...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-black">
        <div className="max-w-md w-full border border-red-900/50 bg-red-900/10 p-8 rounded-lg space-y-4">
          <div className="text-red-500 font-mono text-xs uppercase tracking-widest">System Error</div>
          <h2 className="text-2xl font-bold text-white">Analysis Terminated</h2>
          <p className="text-neutral-400 font-mono text-sm">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors"
          >
            RETRY SEQUENCE
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <button 
            onClick={() => router.push('/')}
            className="text-neutral-500 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors"
          >
            ← Returns to Console
          </button>
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
             
             <a href={`https://github.com/${username}`} target="_blank" className="text-neutral-500 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors">
               View Source ↗
             </a>
          </div>
        </nav>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Profile & Score (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Profile Card */}
            <div className="card p-6 flex flex-col items-center text-center space-y-4 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
               <img 
                 src={result.user.avatar_url} 
                 alt={result.user.login}
                 className="w-24 h-24 rounded-full border border-neutral-800"
               />
               <div>
                 <h1 className="text-2xl font-bold">{result.user.name || result.user.login}</h1>
                 <p className="text-neutral-500 font-mono text-sm">@{result.user.login}</p>
                 
                 {/* NEW: Profile Type Badge */}
                 {result.profileType && (
                   <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                     result.profileType === 'student' 
                       ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' 
                       : result.profileType === 'open-source'
                       ? 'bg-purple-900/30 text-purple-400 border border-purple-800/50'
                       : 'bg-green-900/30 text-green-400 border border-green-800/50'
                   }`}>
                     {result.profileType === 'open-source' ? 'OSS Contributor' : result.profileType}
                   </div>
                 )}
               </div>
               
               <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t border-neutral-900">
                 <div className="space-y-1">
                   <div className="text-xl font-bold">{result.user.followers}</div>
                   <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Followers</div>
                 </div>
                 <div className="space-y-1">
                   <div className="text-xl font-bold">{result.metadata.totalRepos}</div>
                   <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Repos</div>
                 </div>
                 <div className="space-y-1">
                   <div className="text-xl font-bold">{result.metadata.totalStars}</div>
                   <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Stars</div>
                 </div>
               </div>
            </div>

            {/* Score Card */}
            <div className="card p-8 text-center space-y-2 relative">
               <div className="text-xs text-neutral-500 uppercase tracking-widest">Composite Score</div>
               <div className="text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-600">
                 {result.score}
               </div>
               <div className="text-xs text-neutral-600 font-mono">/ 100 POINTS</div>
               
               {/* Score Indicator Line */}
               <div className="w-full h-1 bg-neutral-900 mt-4 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-white transition-all duration-1000 ease-out"
                   style={{ width: `${result.score}%` }} 
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
                <div key={idx} className="card p-5 space-y-3 hover:bg-neutral-900/50 transition-colors group">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-neutral-400 group-hover:text-white transition-colors">
                      {dim.name}
                    </h3>
                    <span className="font-mono text-xs text-neutral-600">{dim.weight}%</span>
                  </div>
                  
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">{dim.score}</span>
                    <span className="text-neutral-600 text-sm mb-1">/100</span>
                  </div>

                  <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        dim.score >= 70 ? 'bg-green-500' : dim.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-neutral-500 line-clamp-2 h-8">
                    {dim.feedback}
                  </p>
                </div>
              ))}
            </div>

            {/* NEW: Top Suggestions Cards (from new scoring engine) */}
            {result.topSuggestions && result.topSuggestions.length > 0 && (
              <div className="space-y-4 mt-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Top Improvements</h2>
                  <span className="text-xs text-neutral-600">{result.topSuggestions.length} actionable</span>
                </div>
                
                <div className="space-y-3">
                  {result.topSuggestions.map((suggestion, idx) => (
                    <div 
                      key={idx} 
                      className="card p-4 space-y-2 hover:bg-neutral-900/50 transition-colors border-l-2 border-l-transparent hover:border-l-blue-500"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-sm font-medium text-white flex-1">{suggestion.title}</h3>
                        <span className="text-xs font-bold text-blue-400">+{suggestion.points} pts</span>
                      </div>
                      
                      <div className="flex gap-2 items-center text-[10px] text-neutral-500">
                        <span className={`px-2 py-0.5 rounded uppercase font-bold ${
                          suggestion.priority === 'critical' ? 'bg-red-900/30 text-red-400' :
                          suggestion.priority === 'high' ? 'bg-orange-900/30 text-orange-400' :
                          suggestion.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-neutral-900 text-neutral-500'
                        }`}>
                          {suggestion.priority}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{suggestion.difficulty}</span>
                        <span>•</span>
                        <span>{suggestion.timeEstimate}</span>
                        <span>•</span>
                        <span className="text-neutral-600">{suggestion.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recruiter Insight */}
            <div className="card p-6 border-blue-900/30 bg-blue-950/5">
              <h3 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
                Recruiter Intelligence
              </h3>
              <p className="text-neutral-300 leading-relaxed font-light">
                "{result.recruiterPerspective}"
              </p>
            </div>

            {/* Action Plan */}
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Optimization Protocol</h3>
                <span className="text-xs font-mono text-neutral-500">{result.suggestions.length} ACTIONS PENDING</span>
              </div>
              
              <div className="divide-y divide-neutral-900">
                {result.suggestions.slice(0, 5).map((sugg, idx) => (
                  <div key={idx} className="p-4 hover:bg-neutral-900/50 transition-colors flex gap-4 items-start">
                    <div className="font-mono text-neutral-600 text-xs mt-1">0{idx + 1}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between">
                        <h4 className="font-semibold text-white">{sugg.title}</h4>
                        <div className="flex gap-2">
                           {sugg.impact === 'high' && (
                             <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-900/50 uppercase">High Impact</span>
                           )}
                           <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded border border-neutral-700 uppercase">{sugg.timeEstimate}</span>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-500">{sugg.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Repositories Table */}
        <div className="space-y-4 pt-6 text-sm">
           <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Repository Analysis</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {result.topRepos.map((repo, idx) => (
               <a 
                 key={idx} 
                 href={`https://github.com/${username}/${repo.name}`}
                 target="_blank"
                 className="card p-4 hover:border-white/30 group transition-colors"
               >
                 <div className="flex justify-between items-start mb-2">
                   <span className="font-mono text-blue-400 group-hover:text-blue-300">{repo.name}</span>
                   <span className="text-xs text-neutral-600">★ {repo.stars}</span>
                 </div>
                 <p className="text-xs text-neutral-500 mb-3 line-clamp-2 min-h-[2.5em]">
                   {repo.description || 'No description provided.'}
                 </p>
                 <div className="flex gap-2 text-[10px] uppercase tracking-wider text-neutral-500">
                   <span>{repo.language || 'Unknown'}</span>
                   <span>{repo.has_readme ? 'DOCS OK' : 'NO DOCS'}</span>
                 </div>
               </a>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
