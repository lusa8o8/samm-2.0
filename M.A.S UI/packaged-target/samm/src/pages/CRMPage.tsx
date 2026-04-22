import { useState, useEffect } from 'react';
import { Users, Target, Zap, Send } from 'lucide-react';
import { format } from 'date-fns';
import { StatusChip } from '../components/shared/StatusChip';
import { useInspector } from '../components/shell/WorkspaceShell';
import { getContacts, getSegments, getTriggerQueue } from '../services/mockService';
import type { Contact, Segment, TriggerQueueItem } from '../types';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'segments', label: 'Segments', icon: Target },
  { id: 'triggers', label: 'Triggers', icon: Zap },
];

function ContactRow({ contact, onInspect }: { contact: Contact; onInspect: (c: Contact) => void }) {
  return (
    <div
      className="flex items-center gap-4 py-3 px-4 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg"
      onClick={() => onInspect(contact)}
      data-testid={`contact-row-${contact.id}`}
    >
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
        {contact.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{contact.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{contact.role} · {contact.company}</p>
      </div>
      <div className="hidden md:flex items-center gap-2">
        <StatusChip status={contact.stage} />
        <StatusChip status={contact.segment.toLowerCase() as never} label={contact.segment} />
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-foreground">{contact.score}</p>
        <p className="text-[10px] text-muted-foreground">score</p>
      </div>
      {contact.outreachStatus && (
        <p className="text-[10px] text-muted-foreground hidden lg:block w-32 truncate">{contact.outreachStatus}</p>
      )}
    </div>
  );
}

function SegmentCard({ segment }: { segment: Segment }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3" data-testid={`segment-${segment.id}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{segment.name}</p>
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{segment.count}</span>
      </div>
      <p className="text-[12px] text-muted-foreground leading-relaxed">{segment.description}</p>
      <div className="flex items-center gap-3 text-[12px]">
        <div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Avg Score</p>
          <p className="font-semibold text-foreground">{segment.avgScore}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Primary Stage</p>
          <StatusChip status={segment.stage as never} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Criteria</p>
        <div className="flex flex-wrap gap-1">
          {segment.criteria.map(c => (
            <span key={c} className="text-[10px] px-2 py-0.5 bg-muted rounded text-muted-foreground">{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TriggerRow({ trigger }: { trigger: TriggerQueueItem }) {
  return (
    <div className="flex items-start gap-3 py-3 px-4 border-b border-border last:border-0" data-testid={`trigger-${trigger.id}`}>
      <div className={cn(
        'h-2 w-2 rounded-full mt-1.5 flex-shrink-0',
        trigger.status === 'pending' && 'bg-amber-500',
        trigger.status === 'processing' && 'bg-blue-500 animate-pulse',
        trigger.status === 'completed' && 'bg-emerald-500',
        trigger.status === 'failed' && 'bg-red-500',
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{trigger.contactName}</p>
          <StatusChip status={trigger.priority} />
          <StatusChip status={trigger.status} />
        </div>
        <p className="text-[12px] text-muted-foreground mt-0.5">{trigger.triggerType}</p>
        {trigger.outreachDecision && (
          <div className="mt-2 bg-primary/5 border border-primary/20 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <Send size={10} className="text-primary flex-shrink-0" />
            <p className="text-[11px] text-primary font-medium">{trigger.outreachDecision}</p>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(trigger.triggeredAt), 'MMM d, HH:mm')}</p>
      </div>
    </div>
  );
}

export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [triggers, setTriggers] = useState<TriggerQueueItem[]>([]);
  const [activeTab, setActiveTab] = useState('contacts');
  const { openInspector } = useInspector();

  useEffect(() => {
    getContacts().then(setContacts);
    getSegments().then(setSegments);
    getTriggerQueue().then(setTriggers);
  }, []);

  const handleInspectContact = (contact: Contact) => {
    openInspector(contact.name, {
      type: 'lead_card',
      title: 'Contact details',
      data: [contact],
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">CRM</h1>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">NEW</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">Contacts, segments, and outreach triggers</p>

        <div className="flex gap-1 mt-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              data-testid={`crm-tab-${tab.id}`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === 'contacts' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {contacts.map(contact => (
              <ContactRow key={contact.id} contact={contact} onInspect={handleInspectContact} />
            ))}
          </div>
        )}
        {activeTab === 'segments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {segments.map(segment => (
              <SegmentCard key={segment.id} segment={segment} />
            ))}
          </div>
        )}
        {activeTab === 'triggers' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {triggers.map(trigger => (
              <TriggerRow key={trigger.id} trigger={trigger} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
