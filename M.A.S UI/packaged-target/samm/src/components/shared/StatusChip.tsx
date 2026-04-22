import { cn } from '@/lib/utils';

type StatusVariant =
  | 'running'
  | 'waiting_human'
  | 'failed'
  | 'completed'
  | 'scheduled'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'draft'
  | 'published'
  | 'active'
  | 'paused'
  | 'high'
  | 'medium'
  | 'low'
  | 'new'
  | 'engaged'
  | 'qualified'
  | 'opportunity'
  | 'customer'
  | 'churned'
  | 'processing';

const variantClasses: Record<StatusVariant, string> = {
  running: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  waiting_human: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  failed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  scheduled: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  rejected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  draft: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-700',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  active: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  paused: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-700',
  high: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  low: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-700',
  new: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  engaged: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  qualified: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
  opportunity: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  customer: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  churned: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
};

const dots: Partial<Record<StatusVariant, string>> = {
  running: 'bg-blue-500 animate-pulse',
  waiting_human: 'bg-amber-500',
  failed: 'bg-red-500',
  active: 'bg-blue-500 animate-pulse',
  processing: 'bg-indigo-500 animate-pulse',
};

interface StatusChipProps {
  status: StatusVariant;
  label?: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export function StatusChip({ status, label, size = 'sm', showDot, className }: StatusChipProps) {
  const displayLabel = label ?? status.replace(/_/g, ' ');
  const hasDot = showDot && dots[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium capitalize',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        variantClasses[status] ?? variantClasses.draft,
        className
      )}
    >
      {hasDot && <span className={cn('h-1.5 w-1.5 rounded-full', dots[status])} />}
      {displayLabel}
    </span>
  );
}
