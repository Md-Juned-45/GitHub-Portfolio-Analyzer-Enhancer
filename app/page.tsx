/**
 * Landing Page Component - Cyber-Tech Aesthetic
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAnalyze = async () => {
    if (!username.trim()) return;
    setIsLoading(true);
    router.push(`/analyze/${username}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden bg-page text-text-primary transition-colors duration-300">
      
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      {/* Background Glow */}
      {/* Background Glow - Subtler in Light Mode */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-100/50 dark:bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />

      <main className="max-w-4xl w-full z-10 space-y-16">
        
        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono tracking-wider uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            System Online v1.0
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-text-primary leading-tight">
            GITHUB PORTFOLIO
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-black to-neutral-500 dark:from-white dark:to-white/40">
              ANALYZER
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-text-secondary max-w-xl mx-auto font-light leading-relaxed">
            Get a recruiter-ready analysis of your GitHub profile.
            <br />
            Including <b>AI Roasts</b>, <b>Project Ideas</b>, and <b>Smart Scoring</b>.
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-lg mx-auto space-y-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-20 dark:opacity-30 group-hover:opacity-100 transition duration-500 blur" />
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-text-tertiary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="github_username"
              className="relative w-full bg-card text-text-primary pl-12 pr-32 py-4 rounded-lg border border-border-subtle focus:outline-none focus:border-blue-500 placeholder-text-tertiary font-mono tracking-wide transition-colors"
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !username.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 bg-text-primary text-page font-semibold rounded text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all tracking-tight"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-page/30 border-t-page rounded-full animate-spin" />
                  PROCESSING
                </span>
              ) : (
                'ANALYZE'
              )}
            </button>
          </div>
          
          <div className="flex justify-between text-xs text-text-tertiary font-mono uppercase tracking-widest px-1">
            <span>Latency: &lt;100ms</span>
            <span>Status: Operational</span>
          </div>
        </div>

        {/* Features Grid - Minimalist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border-subtle border border-border-subtle rounded-lg overflow-hidden">
          {[
            { title: "Metric Analysis", desc: "6-point vector scoring system" },
            { title: "Anomaly Detection", desc: "Red flag identification engine" },
            { title: "Strategic Insight", desc: "AI-driven optimization path" }
          ].map((item, idx) => (
            <div key={idx} className="bg-card p-8 hover:bg-card-hover transition-colors group">
              <h3 className="text-text-primary font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full opacity-50 group-hover:opacity-100" />
                {item.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
