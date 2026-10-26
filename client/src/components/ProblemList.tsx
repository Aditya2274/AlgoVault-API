import { useState, useEffect } from 'react';
import type { Question, Pagination, ApiResponse } from '../types';
import ProblemCard from './ProblemCard';
import { Search, AlertCircle, RefreshCw } from 'lucide-react';

const DIFFICULTY_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

interface ProblemListProps {
  /** Lifted state so going back preserves filter/search */
  initialSearch: string;
  initialDifficulty: string;
  onSearchChange: (v: string) => void;
  onDifficultyChange: (v: string) => void;
  /** Cache of questions from App so we don't re-fetch on back */
  cachedQuestions: Question[];
  cachedPagination: Pagination | null;
  onQuestionsLoaded: (qs: Question[], pg: Pagination | null) => void;
}

export default function ProblemList({
  initialSearch,
  initialDifficulty,
  onSearchChange,
  onDifficultyChange,
  cachedQuestions,
  cachedPagination,
  onQuestionsLoaded,
}: ProblemListProps) {
  const [questions, setQuestions] = useState<Question[]>(cachedQuestions);
  const [pagination, setPagination] = useState<Pagination | null>(cachedPagination);
  const [loading, setLoading] = useState<boolean>(cachedQuestions.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(initialDifficulty);

  const fetchQuestions = async (difficulty: string, search: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (difficulty !== 'All') params.append('difficulty', difficulty);
      if (search.trim()) params.append('search', search.trim());
      params.append('limit', '100');

      const res = await fetch(`/api/questions?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load questions: HTTP ${res.status}`);

      const json: ApiResponse<Question[]> = await res.json();
      if (json.status === 'success' && json.data) {
        const pg = json.pagination ?? null;
        setQuestions(json.data);
        setPagination(pg);
        onQuestionsLoaded(json.data, pg);
      } else {
        throw new Error(json.message || 'Error loading questions');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error connecting to server';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Debounce re-fetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions(selectedDifficulty, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDifficulty, searchQuery]);

  const handleSearchChange = (v: string) => {
    setSearchQuery(v);
    onSearchChange(v);
  };

  const handleDifficultyChange = (v: string) => {
    setSelectedDifficulty(v);
    onDifficultyChange(v);
  };

  const sorted = [...questions].sort(
    (a, b) =>
      (DIFFICULTY_ORDER[a.difficulty] ?? 99) - (DIFFICULTY_ORDER[b.difficulty] ?? 99),
  );

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-4">
      {/* Filters bar */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            aria-label="Search challenges by title or keyword"
            placeholder="Search challenges by title or keyword..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition"
          />
        </div>

        {/* Difficulty tabs + count */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => handleDifficultyChange(diff)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                selectedDifficulty === diff
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              {diff}
            </button>
          ))}
          <div role="status" aria-live="polite" className="ml-auto text-xs text-slate-400">
            {!loading && pagination != null
              ? `${pagination.total} ${pagination.total === 1 ? 'problem' : 'problems'}`
              : !loading && questions.length > 0
              ? `${questions.length} ${questions.length === 1 ? 'problem' : 'problems'}`
              : null}
          </div>
        </div>
      </div>

      {/* Problem cards */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2" role="status" aria-live="polite">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" aria-hidden="true" />
            <span className="text-sm">Fetching challenges from backend...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-400 flex flex-col items-center gap-2" role="alert">
            <AlertCircle className="w-6 h-6" aria-hidden="true" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => fetchQuestions(selectedDifficulty, searchQuery)}
              className="mt-2 px-3 py-1 text-xs bg-rose-500/20 text-rose-300 rounded hover:bg-rose-500/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              Retry
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center text-slate-400" role="status" aria-live="polite">
            <p className="text-sm">No questions found matching your filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {sorted.map((q) => (
              <ProblemCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
