import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Activity, AlertTriangle, Calendar, PlayCircle, Send, Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { StatusChip } from '../shared/StatusChip';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { useInspector } from '../shell/WorkspaceShell';
import {
  getSammContext,
  getSammMessages,
  sendSammMessage,
} from '../../services/liveSammService';
import type { SammConversationMode } from '../../services/liveSammService';
import type { ActionDescriptor, SammMessage, WorkspaceContext } from '../../types';

const suggestionChipsByMode: Record<SammConversationMode, string[]> = {
  planning: [
    'Help me plan this month',
    'Add an event or campaign',
    'Mark asset status',
    'Review in Calendar Studio',
  ],
  execution: [
    'What needs my attention today?',
    'Show me the inbox',
    'What failed recently?',
    'Show content ready for review',
  ],
};

const SAMM_LOGO_SRC = '/samm-app-icon.png?v=20260423';

function SammLogo({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center overflow-hidden', className)}>
      <img src={SAMM_LOGO_SRC} alt="samm" className={cn('h-full w-full object-contain', imageClassName)} />
    </div>
  );
}

function WatchStrip({ ctx }: { ctx: WorkspaceContext }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = [
    ...ctx.activeRuns.map((run) => ({
      icon: <Activity size={12} className="text-blue-500 flex-shrink-0" />,
      label: run.pipelineName,
      value: run.stepName,
      status: 'running' as const,
    })),
    ...(ctx.pendingApprovals > 0
      ? [
          {
            icon: <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />,
            label: 'Approvals pending',
            value: `${ctx.pendingApprovals} items need review`,
            status: 'waiting_human' as const,
          },
        ]
      : []),
    ...ctx.recentFailures.map((run) => ({
      icon: <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />,
      label: run.pipelineName,
      value: run.stepName,
      status: 'failed' as const,
    })),
    ...(ctx.nextCalendarEvent
      ? [
          {
            icon: <Calendar size={12} className="text-purple-500 flex-shrink-0" />,
            label: ctx.nextCalendarEvent.name,
            value: `Starts ${format(new Date(ctx.nextCalendarEvent.startDate), 'MMM d')}`,
            status: 'scheduled' as const,
          },
        ]
      : []),
  ];

  const failureCount = ctx.recentFailures.length;
  const runningCount = ctx.activeRuns.length;

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className="fixed right-4 bottom-24 z-20 flex flex-col items-end gap-2">
      {open && (
        <div className="mb-1 flex flex-col items-end gap-1.5" style={{ animation: 'stackIn 180ms cubic-bezier(0.16,1,0.3,1)' }}>
          {ctx.currentFocus && (
            <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 backdrop-blur-sm shadow-sm">
              <SammLogo className="h-[11px] w-[11px] flex-shrink-0" />
              <span className="whitespace-nowrap text-[11px] font-medium text-primary">{ctx.currentFocus}</span>
            </div>
          )}
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-3 py-1.5 backdrop-blur-sm shadow-sm">
              {item.icon}
              <span className="whitespace-nowrap text-[11px] font-medium text-foreground">{item.label}:</span>
              <span className="whitespace-nowrap text-[11px] text-muted-foreground">{item.value}</span>
              <StatusChip status={item.status} size="sm" showDot />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'relative flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all duration-200',
          open
            ? 'bg-primary text-white shadow-primary/30'
            : 'border border-border/70 bg-card/90 text-foreground/60 backdrop-blur-sm hover:border-border hover:text-foreground'
        )}
      >
        <Activity size={16} />

        {!open && (failureCount > 0 || ctx.pendingApprovals > 0) && (
          <span
            className={cn(
              'absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background',
              failureCount > 0 ? 'bg-red-500' : 'bg-amber-400'
            )}
          />
        )}

        {!open && runningCount > 0 && (
          <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-primary/20" />
        )}
      </button>

      <style>{`
        @keyframes stackIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function MessageBubble({
  message,
  onActionClick,
  onWidgetClick,
}: {
  message: SammMessage;
  onWidgetClick: (title: string, widget: never) => void;
  onActionClick: (action: ActionDescriptor) => void;
}) {
  const isSamm = message.role === 'samm';

  const renderMarkdown = (text: string) =>
    text.split('\n').map((line, index) => {
      const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={index} className="ml-3" dangerouslySetInnerHTML={{ __html: boldLine.slice(2) }} />;
      }
      if (line === '') return <div key={index} className="h-1.5" />;
      return <p key={index} dangerouslySetInnerHTML={{ __html: boldLine }} />;
    });

  return (
    <div className={cn('flex gap-3', isSamm ? 'flex-row' : 'flex-row-reverse')}>
      {isSamm && (
        <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary">
          <SammLogo className="h-4 w-4" />
        </div>
      )}

      <div className={cn('max-w-[85%] space-y-2.5', isSamm ? '' : 'flex flex-col items-end')}>
        <div
          className={cn(
            'rounded-xl px-4 py-3 text-sm leading-relaxed',
            isSamm ? 'rounded-tl-sm border border-border bg-card text-foreground' : 'rounded-tr-sm bg-primary text-white'
          )}
        >
          <div className="space-y-0.5 text-[13px]">{renderMarkdown(message.content)}</div>
        </div>

        {message.widgets && message.widgets.length > 0 && (
          <div className="w-full space-y-2">
            {message.widgets.map((widget, index) => (
              <div
                key={index}
                className="cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50"
                onClick={() => onWidgetClick(widget.title ?? widget.type, widget as never)}
                data-testid={`widget-${widget.type}`}
              >
                {widget.title && (
                  <div className="border-b border-border bg-muted/30 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{widget.title}</p>
                  </div>
                )}
                <div className="p-3">
                  <WidgetRenderer widget={widget} />
                </div>
              </div>
            ))}
          </div>
        )}

        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.actions.map((action, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onActionClick(action)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  action.variant === 'default'
                    ? 'border-primary bg-primary text-white hover:bg-primary/90'
                    : action.variant === 'destructive'
                      ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20'
                      : 'border-border bg-card text-foreground hover:bg-muted'
                )}
                data-testid={`action-${action.action}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">{format(new Date(message.timestamp), 'HH:mm')}</p>
      </div>
    </div>
  );
}

export function SammWorkspacePanel({
  embedded = false,
  selectedContextLabel,
}: {
  embedded?: boolean;
  selectedContextLabel?: string;
}) {
  const [messages, setMessages] = useState<SammMessage[]>([]);
  const [ctx, setCtx] = useState<WorkspaceContext | null>(null);
  const [mode, setMode] = useState<SammConversationMode>('planning');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { openInspector } = useInspector();
  const [location] = useLocation();

  useEffect(() => {
    getSammMessages().then(setMessages);
    getSammContext().then(setCtx);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const nextMode = params.get('mode');
    const prompt = params.get('prompt');

    if (nextMode === 'planning' || nextMode === 'execution') {
      setMode(nextMode);
    }
    if (prompt) {
      setInput(prompt);
    }
  }, [location]);

  const handleSend = async (contentOverride?: string, confirmationAction?: string | null) => {
    const content = (contentOverride ?? input).trim();
    if (!content || loading) return;

    const userMessage: SammMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);

    const response = await sendSammMessage(content, [...messages, userMessage], mode, confirmationAction ?? null);
    setMessages((current) => [...current, response]);
    setLoading(false);
  };

  const handleWidgetClick = (title: string, widget: never) => {
    openInspector(title, widget);
  };

  const handleActionClick = (action: ActionDescriptor) => {
    const confirmationAction =
      typeof action.payload === 'object' && action.payload !== null && 'confirmationAction' in action.payload
        ? String((action.payload as { confirmationAction?: unknown }).confirmationAction ?? action.action)
        : action.action;

    void handleSend(action.label, confirmationAction);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!embedded && ctx && <WatchStrip ctx={ctx} />}

      <div className={cn('border-b border-border/70', embedded ? 'px-5 py-4' : 'px-4 py-4')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">samm</p>
            <h1 className={cn('mt-1 font-semibold text-foreground', embedded ? 'text-base' : 'text-lg')}>
              {mode === 'planning' ? 'Plan with samm' : 'Coordinate execution'}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {mode === 'planning'
                ? 'Use guided planning to shape the month before anything becomes live.'
                : 'Use explicit actions against committed truth, approvals, and runtime state.'}
            </p>
            {embedded && selectedContextLabel ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] text-primary">
                <SammLogo className="h-3 w-3" />
                <span className="font-medium">Working on {selectedContextLabel}</span>
              </div>
            ) : null}
          </div>

          <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
            {(['planning', 'execution'] as SammConversationMode[]).map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                onClick={() => setMode(nextMode)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  mode === nextMode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {nextMode === 'planning' ? <Sparkles size={12} /> : <PlayCircle size={12} />}
                {nextMode === 'planning' ? 'Planning' : 'Execution'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cn('flex-1 overflow-y-auto space-y-6', embedded ? 'px-5 py-5' : 'px-4 py-6')}>
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <SammLogo className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">samm is ready</p>
              <p className="mt-1 text-xs">
                {mode === 'planning'
                  ? 'Use planning mode to shape the month, define campaigns, and mark asset needs.'
                  : 'Use execution mode for approvals, live status, and explicit next-step actions.'}
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onWidgetClick={handleWidgetClick}
            onActionClick={handleActionClick}
          />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary">
              <SammLogo className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5 rounded-xl rounded-tl-sm border border-border bg-card px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className={cn(embedded ? 'px-5 pb-2' : 'px-4 pb-2')}>
          <div className="flex flex-wrap gap-1.5">
            {suggestionChipsByMode[mode].map((chip) => (
              <button
                key={chip}
                onClick={() => setInput(chip)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                data-testid={`chip-${chip}`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={cn(embedded ? 'px-5 pb-5' : 'px-4 pb-5 sm:px-6 sm:pb-6')}>
        <div className="flex items-center gap-2 overflow-hidden rounded-2xl border border-border/60 bg-card/80 px-3 py-2.5 shadow-lg shadow-black/5 backdrop-blur-md transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-primary/10 sm:gap-3 sm:px-4 sm:py-3">
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            placeholder={
              mode === 'planning'
                ? 'Ask samm to help plan the month, define a campaign, or explain the why...'
                : 'Ask samm to summarize, review, or carry out an explicit next step...'
            }
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && handleSend()}
            data-testid="samm-input"
          />
          <button
            onClick={() => {
              void handleSend();
            }}
            disabled={!input.trim() || loading}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary shadow-sm shadow-primary/30 transition-all duration-150 hover:bg-primary/90 disabled:opacity-30 active:scale-95 sm:h-8 sm:w-8"
            data-testid="samm-send"
          >
            <Send size={13} className="translate-x-px text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
