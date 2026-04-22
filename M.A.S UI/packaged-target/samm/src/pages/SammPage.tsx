import { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, Clock, CheckCircle, Cpu, Calendar, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { StatusChip } from '../components/shared/StatusChip';
import { WidgetRenderer } from '../components/widgets/WidgetRenderer';
import { useInspector } from '../components/shell/WorkspaceShell';
import {
  getSammMessages, sendSammMessage, getSammContext,
} from '../services/liveSammService';
import type { SammMessage, WorkspaceContext } from '../types';

const suggestionChips = [
  'What needs my attention today?',
  'Show me the inbox',
  'What failed recently?',
  'Show content ready for review',
  'Any CRM updates?',
  'Show content patterns',
];

function WatchStrip({ ctx }: { ctx: WorkspaceContext }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = [
    ...ctx.activeRuns.map(r => ({
      icon: <Activity size={12} className="text-blue-500 flex-shrink-0" />,
      label: r.pipelineName,
      value: r.stepName,
      status: 'running' as const,
    })),
    ...(ctx.pendingApprovals > 0
      ? [{ icon: <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />, label: 'Approvals pending', value: `${ctx.pendingApprovals} items need review`, status: 'waiting_human' as const }]
      : []),
    ...ctx.recentFailures.map(r => ({
      icon: <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />,
      label: r.pipelineName,
      value: r.stepName,
      status: 'failed' as const,
    })),
    ...(ctx.nextCalendarEvent
      ? [{ icon: <Calendar size={12} className="text-purple-500 flex-shrink-0" />, label: ctx.nextCalendarEvent.name, value: `Starts ${format(new Date(ctx.nextCalendarEvent.startDate), 'MMM d')}`, status: 'scheduled' as const }]
      : []),
  ];

  const failureCount = ctx.recentFailures.length;
  const runningCount = ctx.activeRuns.length;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className="fixed right-4 bottom-24 z-20 flex flex-col items-end gap-2">
      {/* Expanded pill stack */}
      {open && (
        <div className="flex flex-col items-end gap-1.5 mb-1" style={{ animation: 'stackIn 180ms cubic-bezier(0.16,1,0.3,1)' }}>
          {ctx.currentFocus && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm shadow-sm">
              <Cpu size={11} className="text-primary flex-shrink-0" />
              <span className="text-[11px] font-medium text-primary whitespace-nowrap">{ctx.currentFocus}</span>
            </div>
          )}
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 border border-border/70 backdrop-blur-sm shadow-sm">
              {item.icon}
              <span className="text-[11px] text-foreground font-medium whitespace-nowrap">{item.label}:</span>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">{item.value}</span>
              <StatusChip status={item.status} size="sm" showDot />
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'h-11 w-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 relative',
          open
            ? 'bg-primary text-white shadow-primary/30'
            : 'bg-card/90 border border-border/70 backdrop-blur-sm text-foreground/60 hover:text-foreground hover:border-border'
        )}
      >
        <Activity size={16} />

        {/* Urgency dot — red if failures, amber if waiting */}
        {!open && (failureCount > 0 || ctx.pendingApprovals > 0) && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
            failureCount > 0 ? 'bg-red-500' : 'bg-amber-400'
          )} />
        )}

        {/* Pulse ring when pipelines are running */}
        {!open && runningCount > 0 && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 pointer-events-none" />
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

function MessageBubble({ message, onWidgetClick }: { message: SammMessage; onWidgetClick: (title: string, widget: never) => void }) {
  const isSamm = message.role === 'samm';

  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        if (line.startsWith('* ') || line.startsWith('- ')) {
          return <li key={i} className="ml-3" dangerouslySetInnerHTML={{ __html: boldLine.slice(2) }} />;
        }
        if (line === '') return <div key={i} className="h-1.5" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: boldLine }} />;
      });
  };

  return (
    <div className={cn('flex gap-3', isSamm ? 'flex-row' : 'flex-row-reverse')}>
      {isSamm && (
        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
          <Cpu size={13} className="text-white" />
        </div>
      )}
      <div className={cn('max-w-[85%] space-y-2.5', isSamm ? '' : 'items-end flex flex-col')}>
        <div
          className={cn(
            'rounded-xl px-4 py-3 text-sm leading-relaxed',
            isSamm
              ? 'bg-card border border-border text-foreground rounded-tl-sm'
              : 'bg-primary text-white rounded-tr-sm'
          )}
        >
          <div className="space-y-0.5 text-[13px]">
            {renderMarkdown(message.content)}
          </div>
        </div>

        {message.widgets && message.widgets.length > 0 && (
          <div className="space-y-2 w-full">
            {message.widgets.map((widget, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => onWidgetClick(widget.title ?? widget.type, widget as never)}
                data-testid={`widget-${widget.type}`}
              >
                {widget.title && (
                  <div className="px-3 py-2 border-b border-border bg-muted/30">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{widget.title}</p>
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
            {message.actions.map((action, i) => (
              <button
                key={i}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  action.variant === 'default'
                    ? 'bg-primary text-white border-primary hover:bg-primary/90'
                    : action.variant === 'destructive'
                    ? 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                )}
                data-testid={`action-${action.action}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          {format(new Date(message.timestamp), 'HH:mm')}
        </p>
      </div>
    </div>
  );
}

export default function SammPage() {
  const [messages, setMessages] = useState<SammMessage[]>([]);
  const [ctx, setCtx] = useState<WorkspaceContext | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { openInspector } = useInspector();

  useEffect(() => {
    getSammMessages().then(setMessages);
    getSammContext().then(setCtx);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: SammMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    const response = await sendSammMessage(input, [...messages, userMsg]);
    setMessages(m => [...m, response]);
    setLoading(false);
  };

  const handleChip = (chip: string) => {
    setInput(chip);
  };

  const handleWidgetClick = (title: string, widget: never) => {
    openInspector(title, widget);
  };

  return (
    <div className="flex flex-col h-full">
      {ctx && <WatchStrip ctx={ctx} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Cpu size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">SAMM is ready</p>
              <p className="text-xs mt-1">Ask SAMM about active runs, approvals, content, or CRM.</p>
            </div>
          </div>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} onWidgetClick={handleWidgetClick} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Cpu size={13} className="text-white" />
            </div>
            <div className="bg-card border border-border rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {suggestionChips.map(chip => (
              <button
                key={chip}
                onClick={() => handleChip(chip)}
                className="px-3 py-1.5 rounded-full border border-border bg-card text-[12px] text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
                data-testid={`chip-${chip}`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input composer */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-3 bg-card/80 backdrop-blur-md border border-border/60 rounded-2xl px-4 py-3 shadow-lg shadow-black/5 focus-within:border-primary/40 focus-within:shadow-primary/10 transition-all duration-200">
          <input
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            placeholder="Ask SAMM about runs, approvals, content, CRM..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            data-testid="samm-input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="h-8 w-8 rounded-full bg-primary flex items-center justify-center disabled:opacity-30 hover:bg-primary/90 active:scale-95 transition-all duration-150 flex-shrink-0 shadow-sm shadow-primary/30"
            data-testid="samm-send"
          >
            <Send size={13} className="text-white translate-x-px" />
          </button>
        </div>
      </div>
    </div>
  );
}
