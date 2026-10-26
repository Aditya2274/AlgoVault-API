import { useState, useEffect, useRef, useCallback } from 'react';
import type { Question, Difficulty, ApiResponse } from '../types';
import ProblemDescription from './ProblemDescription';
import CodeWorkspace from './CodeWorkspace';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

interface ProblemWorkspaceProps {
  problemId: string;
  /** If we already have it in cache, pass it directly */
  cachedQuestion: Question | null;
}

function getDifficultyBadge(difficulty: Difficulty): string {
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
}

/** Clamp splitter position between 25% and 75% */
const MIN_PCT = 25;
const MAX_PCT = 75;

export default function ProblemWorkspace({ problemId, cachedQuestion }: ProblemWorkspaceProps) {
  const [question, setQuestion] = useState<Question | null>(cachedQuestion);
  const [loading, setLoading] = useState<boolean>(!cachedQuestion);
  const [error, setError] = useState<string | null>(null);

  // Draggable divider state (left pane width in %)
  const [leftPct, setLeftPct] = useState<number>(45);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${encodeURIComponent(problemId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse<Question> = await res.json();
      if (json.status === 'success' && json.data) {
        setQuestion(json.data);
      } else {
        throw new Error(json.message || 'Problem not found');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading problem';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    if (!cachedQuestion) {
      fetchQuestion();
    } else {
      setQuestion(cachedQuestion);
      setLoading(false);
    }
  }, [cachedQuestion, fetchQuestion]);

  // Draggable divider handlers
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawPct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(MAX_PCT, Math.max(MIN_PCT, rawPct)));
    };
    const onMouseUp = () => {
      isDragging.current = false;
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {/* Slim top bar */}
      <div className="shrink-0 h-12 bg-slate-900/80 border-b border-slate-800 flex items-center gap-3 px-4">
        <a
          href="#/"
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          aria-label="Back to problems list"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Problems</span>
        </a>

        {question && (
          <>
            <span className="text-slate-700 select-none">|</span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${getDifficultyBadge(question.difficulty)}`}
            >
              {question.difficulty}
            </span>
            <h1 className="text-sm font-semibold text-slate-200 truncate">{question.title}</h1>
          </>
        )}
      </div>

      {/* Split pane area */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-slate-400" role="status" aria-live="polite">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" aria-hidden="true" />
          <span className="text-sm">Loading problem…</span>
        </div>
      ) : error || !question ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-rose-400" role="alert">
          <AlertCircle className="w-8 h-8" aria-hidden="true" />
          <p className="text-sm font-medium">{error ?? 'Problem not found'}</p>
          <a
            href="#/"
            className="text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            ← Back to problems list
          </a>
        </div>
      ) : (
        /* Desktop: side-by-side; Mobile: stacked */
        <div
          ref={containerRef}
          className="flex-1 flex flex-col lg:flex-row overflow-hidden"
        >
          {/* LEFT – description */}
          <div
            className="lg:h-full overflow-hidden border-b border-slate-800 lg:border-b-0 lg:border-r lg:border-slate-800 bg-slate-900/30"
            style={{ flexBasis: `${leftPct}%`, flexShrink: 0 }}
          >
            <ProblemDescription question={question} />
          </div>

          {/* Draggable divider (desktop only) */}
          <div
            role="separator"
            aria-label="Resize panels"
            onMouseDown={onMouseDown}
            className="hidden lg:flex w-1.5 shrink-0 bg-slate-800 hover:bg-indigo-600/60 active:bg-indigo-600 cursor-col-resize transition-colors items-center justify-center group"
          >
            <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-indigo-400 rounded-full transition-colors" />
          </div>

          {/* RIGHT – code workspace */}
          <div className="flex-1 overflow-hidden">
            <CodeWorkspace question={question} />
          </div>
        </div>
      )}
    </div>
  );
}
