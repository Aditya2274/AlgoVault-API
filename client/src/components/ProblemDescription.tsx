import type { Question, Difficulty } from '../types';
import { Terminal, Layers } from 'lucide-react';

interface ProblemDescriptionProps {
  question: Question;
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

export default function ProblemDescription({ question }: ProblemDescriptionProps) {
  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-4">
      {/* Title + badge */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getDifficultyBadge(question.difficulty)}`}
          >
            {question.difficulty}
          </span>
          <span className="text-xs text-slate-500 font-mono">ID: {question.id.slice(0, 8)}…</span>
        </div>
        <h2 className="text-xl font-bold text-white leading-snug">{question.title}</h2>
      </div>

      {/* Problem statement */}
      <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
        {question.description}
      </div>

      {/* Tags */}
      {question.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Test cases */}
      {question.testCases && question.testCases.length > 0 && (
        <div className="flex flex-col gap-3 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            <span>
              {question.testCases.length} Test {question.testCases.length === 1 ? 'Case' : 'Cases'}
            </span>
            <Layers className="w-3 h-3 ml-1 text-slate-600" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-2">
            {question.testCases.map((tc, idx) => (
              <div
                key={tc.id}
                className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col gap-2 text-xs"
              >
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  Case {idx + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider">Input</span>
                  <pre className="font-mono text-slate-300 whitespace-pre-wrap bg-slate-900 rounded p-2">
                    {tc.input}
                  </pre>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider">Expected Output</span>
                  <pre className="font-mono text-emerald-400 whitespace-pre-wrap bg-slate-900 rounded p-2">
                    {tc.expectedOutput}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
