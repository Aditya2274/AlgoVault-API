import { useState, useEffect } from 'react';
import type { Question, Pagination, HealthResponse } from './types';
import { useHashRoute } from './hooks/useHashRoute';
import ProblemList from './components/ProblemList';
import ProblemWorkspace from './components/ProblemWorkspace';
import { Code2, RefreshCw } from 'lucide-react';

export default function App() {
  // ── Health ──────────────────────────────────────────────────────────────
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HealthResponse = await res.json();
      setHealthStatus(data);
    } catch {
      setHealthStatus({
        status: 'error',
        message: 'Could not connect to AlgoVault API backend',
        timeStamp: new Date().toISOString(),
      });
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // ── Lifted list state (preserved across navigation) ────────────────────
  const [cachedQuestions, setCachedQuestions] = useState<Question[]>([]);
  const [cachedPagination, setCachedPagination] = useState<Pagination | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

  const handleQuestionsLoaded = (qs: Question[], pg: Pagination | null) => {
    setCachedQuestions(qs);
    setCachedPagination(pg);
  };

  // ── Routing ──────────────────────────────────────────────────────────────
  const route = useHashRoute();

  // Workspace view occupies the full viewport — no outer header
  if (route.name === 'problem') {
    const cached = cachedQuestions.find((q) => q.id === route.id) ?? null;
    return (
      <ProblemWorkspace
        problemId={route.id}
        cachedQuestion={cached}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 text-indigo-400 p-2 rounded-lg border border-indigo-500/30">
              <Code2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                AlgoVault{' '}
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.0
                </span>
              </span>
              <p className="text-xs text-slate-400">Algorithmic Interview &amp; Problem Solving Engine</p>
            </div>
          </div>

          {/* Health pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={checkHealth}
              disabled={healthLoading}
              aria-label="Refresh API health status"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                healthStatus?.status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus?.status === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span>{healthStatus?.status === 'success' ? 'API Connected' : 'API Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Problem list */}
      <main className="flex-1 flex flex-col">
        <ProblemList
          initialSearch={searchQuery}
          initialDifficulty={selectedDifficulty}
          onSearchChange={setSearchQuery}
          onDifficultyChange={setSelectedDifficulty}
          cachedQuestions={cachedQuestions}
          cachedPagination={cachedPagination}
          onQuestionsLoaded={handleQuestionsLoaded}
        />
      </main>
    </div>
  );
}
