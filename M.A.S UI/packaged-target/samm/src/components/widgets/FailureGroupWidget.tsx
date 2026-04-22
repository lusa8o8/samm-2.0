import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { PipelineRun } from '../../types';
import { useState } from 'react';
import { retryRun } from '../../services/mockService';

interface Props {
  data: PipelineRun[];
}

export function FailureGroupWidget({ data }: Props) {
  const [retrying, setRetrying] = useState<Set<string>>(new Set());
  const [retried, setRetried] = useState<Set<string>>(new Set());

  const handleRetry = async (runId: string) => {
    setRetrying(s => new Set(s).add(runId));
    await retryRun(runId);
    setRetrying(s => { const n = new Set(s); n.delete(runId); return n; });
    setRetried(s => new Set(s).add(runId));
  };

  const failures = data.filter(r => r.status === 'failed');

  return (
    <div className="space-y-3">
      {failures.map(run => (
        <div key={run.id} className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} className="text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-xs font-medium text-red-800 dark:text-red-300">{run.pipelineName}</p>
          </div>
          <p className="text-[11px] text-red-700 dark:text-red-400 leading-snug">{run.stepName}</p>
          {run.message && (
            <p className="text-[10px] text-red-600/70 dark:text-red-500/70 leading-snug">{run.message}</p>
          )}
          {!retried.has(run.id) && (
            <button
              onClick={() => handleRetry(run.id)}
              disabled={retrying.has(run.id)}
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline disabled:opacity-50"
              data-testid={`retry-${run.id}`}
            >
              <RefreshCw size={11} className={retrying.has(run.id) ? 'animate-spin' : ''} />
              {retrying.has(run.id) ? 'Retrying...' : 'Retry run'}
            </button>
          )}
          {retried.has(run.id) && (
            <p className="text-[11px] text-emerald-600 font-medium">Retry queued</p>
          )}
        </div>
      ))}
    </div>
  );
}
