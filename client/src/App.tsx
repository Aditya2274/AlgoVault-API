import { useState, useEffect } from 'react';
import type { Question, Difficulty, Pagination, HealthResponse, ApiResponse } from './types';
import CodeWorkspace from './components/CodeWorkspace';
import { 
  Code2, 
  Search, 
  AlertCircle, 
  Layers, 
  ChevronRight,
  Database,
  Terminal,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  // Check backend health
  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HealthResponse = await res.json();
      setHealthStatus(data);
    } catch (err) {
      setHealthStatus({
        status: 'error',
        message: 'Could not connect to AlgoVault API backend',
        timeStamp: new Date().toISOString(),
      });
    } finally {
      setHealthLoading(false);
    }
  };

  // Fetch questions from API
  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedDifficulty !== 'All') {
        params.append('difficulty', selectedDifficulty);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      params.append('limit', '20');

      const url = `/api/questions?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load questions: HTTP ${res.status}`);
      }
      const json: ApiResponse<Question[]> = await res.json();
      if (json.status === 'success' && json.data) {
        setQuestions(json.data);
        setPagination(json.pagination || null);
        if (json.data.length > 0 && !selectedQuestion) {
          setSelectedQuestion(json.data[0]);
        }
      } else {
        throw new Error(json.message || 'Error loading questions');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedDifficulty, searchQuery]);

  const getDifficultyBadge = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'Hard':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 text-indigo-400 p-2 rounded-lg border border-indigo-500/30">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                AlgoVault <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">v1.0</span>
              </span>
              <p className="text-xs text-slate-400">Algorithmic Interview & Problem Solving Engine</p>
            </div>
          </div>

          {/* System Health Status */}
          <div className="flex items-center gap-3">
            <button 
              onClick={checkHealth}
              disabled={healthLoading}
              title="Refresh Health"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              healthStatus?.status === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${healthStatus?.status === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{healthStatus?.status === 'success' ? 'API Connected' : 'API Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Problem List & Filters */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="text"
                placeholder="Search challenges by title or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Difficulty Filter Tabs */}
            <div className="flex items-center gap-2">
              {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                    selectedDifficulty === diff 
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                  }`}
                >
                  {diff}
                </button>
              ))}
              {pagination && (
                <span className="ml-auto text-xs text-slate-400">
                  {pagination.total} {pagination.total === 1 ? 'problem' : 'problems'}
                </span>
              )}
            </div>
          </div>

          {/* Problem List */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-sm">Fetching challenges from backend...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-rose-400 flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                <span className="text-sm">{error}</span>
                <button 
                  onClick={fetchQuestions}
                  className="mt-2 px-3 py-1 text-xs bg-rose-500/20 text-rose-300 rounded hover:bg-rose-500/30 transition"
                >
                  Retry
                </button>
              </div>
            ) : questions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm">No questions found matching your filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 overflow-y-auto max-h-[calc(100vh-280px)]">
                {questions.map((q) => {
                  const isSelected = selectedQuestion?.id === q.id;
                  return (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuestion(q)}
                      className={`p-4 cursor-pointer transition flex items-center justify-between ${
                        isSelected 
                          ? 'bg-indigo-950/40 border-l-4 border-indigo-500' 
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex flex-col gap-1.5 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${getDifficultyBadge(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                          <h3 className="font-semibold text-slate-200 text-sm">{q.title}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {q.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              #{tag}
                            </span>
                          ))}
                          <span className="text-[10px] text-slate-500 ml-auto flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {q.testCases?.length || 0} tests
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-500 transition ${isSelected ? 'text-indigo-400 translate-x-1' : ''}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Problem Detail, Interactive Monaco Editor & Test Runner */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          {selectedQuestion ? (
            <div className="flex flex-col gap-4">
              {/* Problem Overview Card */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getDifficultyBadge(selectedQuestion.difficulty)}`}>
                        {selectedQuestion.difficulty}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">ID: {selectedQuestion.id.slice(0, 8)}...</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{selectedQuestion.title}</h2>
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedQuestion.description}
                </div>

                {/* Tags & Test Cases Info */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/60">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedQuestion.tags.map((tag) => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    {selectedQuestion.testCases?.length || 0} validation cases
                  </span>
                </div>
              </div>

              {/* In-Browser Interactive Monaco Code Editor & Test Runner Console */}
              <CodeWorkspace question={selectedQuestion} />
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
              <Database className="w-12 h-12 mb-3 text-slate-600" />
              <p className="text-base font-medium">Select a challenge from the list</p>
              <p className="text-xs text-slate-600 mt-1">Write code in Monaco Editor, run test cases, and verify output</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
