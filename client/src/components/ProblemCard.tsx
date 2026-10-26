import type { Question, Difficulty } from '../types';
import { Layers, ChevronRight } from 'lucide-react';

interface ProblemCardProps {
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

export default function ProblemCard({ question }: ProblemCardProps) {
  const href = `#/problem/${encodeURIComponent(question.id)}`;

  return (
    <a
      href={href}
      className="block p-4 hover:bg-slate-800/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
      aria-label={`Open problem: ${question.title}, difficulty: ${question.difficulty}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5 flex-1 pr-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${getDifficultyBadge(question.difficulty)}`}>
              {question.difficulty}
            </span>
            <h3 className="font-semibold text-slate-200 text-sm">{question.title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {question.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                #{tag}
              </span>
            ))}
            <span className="text-[10px] text-slate-500 ml-auto flex items-center gap-1">
              <Layers className="w-3 h-3" aria-hidden="true" />
              {question.testCases?.length || 0} tests
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
      </div>
    </a>
  );
}
