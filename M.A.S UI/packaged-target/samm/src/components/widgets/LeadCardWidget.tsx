import { Users, TrendingUp } from 'lucide-react';
import { StatusChip } from '../shared/StatusChip';
import type { Contact } from '../../types';

interface Props {
  data: Contact[];
}

export function LeadCardWidget({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.map(contact => (
        <div key={contact.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {contact.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{contact.name}</p>
              <p className="text-[11px] text-muted-foreground">{contact.role} · {contact.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusChip status={contact.stage} />
            <span className="text-[11px] text-muted-foreground">Score: <strong className="text-foreground">{contact.score}</strong></span>
          </div>
          {contact.outreachStatus && (
            <p className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded">{contact.outreachStatus}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {contact.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
