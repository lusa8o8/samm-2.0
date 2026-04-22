import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, ExternalLink } from 'lucide-react';
import { StatusChip } from '../components/shared/StatusChip';
import { useInspector } from '../components/shell/WorkspaceShell';
import { getCalendarEvents } from '../services/mockService';
import type { CalendarEvent } from '../types';
import { cn } from '@/lib/utils';

const eventTypeColors: Record<string, string> = {
  promotion: 'bg-amber-500',
  webinar: 'bg-blue-500',
  campaign_launch: 'bg-primary',
  product_release: 'bg-purple-500',
  holiday: 'bg-emerald-500',
};

const eventTypeLabels: Record<string, string> = {
  promotion: 'Promotion',
  webinar: 'Webinar',
  campaign_launch: 'Campaign',
  product_release: 'Release',
  holiday: 'Holiday',
};

function EventCard({ event, onInspect }: { event: CalendarEvent; onInspect: (e: CalendarEvent) => void }) {
  const dotColor = eventTypeColors[event.eventType] ?? 'bg-muted-foreground';
  const readinessPercent = event.contentTotal
    ? Math.round(((event.contentReady ?? 0) / event.contentTotal) * 100)
    : null;

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-sm transition-all cursor-pointer group"
      onClick={() => onInspect(event)}
      data-testid={`calendar-event-${event.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn('h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0', dotColor)} />
          <div>
            <p className="text-sm font-semibold text-foreground leading-snug">{event.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {eventTypeLabels[event.eventType]} · {format(new Date(event.startDate), 'MMM d')}
              {event.endDate && ` – ${format(new Date(event.endDate), 'MMM d')}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusChip status={event.priority} />
          <StatusChip status={event.status as never} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[12px]">
        {event.targetICP && (
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Target ICP</p>
            <p className="text-foreground font-medium mt-0.5">{event.targetICP}</p>
          </div>
        )}
        {event.objective && (
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Objective</p>
            <p className="text-foreground font-medium mt-0.5 line-clamp-1">{event.objective}</p>
          </div>
        )}
        {event.ownerPipeline && (
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Pipeline</p>
            <p className="text-foreground font-medium mt-0.5">Pipeline {event.ownerPipeline}</p>
          </div>
        )}
        {event.campaignType && (
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Type</p>
            <p className="text-foreground font-medium mt-0.5">{event.campaignType}</p>
          </div>
        )}
      </div>

      {readinessPercent !== null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Content readiness</span>
            <span className="font-medium text-foreground">{event.contentReady}/{event.contentTotal}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', readinessPercent === 100 ? 'bg-emerald-500' : 'bg-primary')}
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>
      )}

      {event.notes && (
        <p className="text-[11px] text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg leading-relaxed">{event.notes}</p>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { openInspector } = useInspector();

  useEffect(() => {
    getCalendarEvents().then(setEvents);
  }, []);

  const handleInspect = (event: CalendarEvent) => {
    openInspector(event.name, {
      type: 'calendar_event_inspector',
      title: event.name,
      data: event,
    });
  };

  const upcoming = events.filter(e => e.status !== 'completed' && e.status !== 'cancelled');
  const past = events.filter(e => e.status === 'completed' || e.status === 'cancelled');

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{upcoming.length} upcoming events</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Upcoming */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            )}
            {upcoming.map(event => (
              <EventCard key={event.id} event={event} onInspect={handleInspect} />
            ))}
          </div>
        </div>

        {past.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past</h2>
            <div className="space-y-3 opacity-60">
              {past.map(event => (
                <EventCard key={event.id} event={event} onInspect={handleInspect} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
