import type { Difficulty } from '../types';

export function getDifficultyBadge(difficulty: Difficulty): string {
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
