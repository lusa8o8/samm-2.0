import { useState } from 'react';
import { Users, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  {
    id: 'contacts',
    label: 'Contacts',
    icon: Users,
    title: 'No live CRM contacts connected yet',
    body: 'Contacts will appear here after a real lead, customer, or CRM source is connected.',
  },
  {
    id: 'segments',
    label: 'Segments',
    icon: Target,
    title: 'No live segments connected yet',
    body: 'Audience segments will appear here after CRM or customer data is wired in.',
  },
  {
    id: 'triggers',
    label: 'Triggers',
    icon: Zap,
    title: 'No live outreach triggers connected yet',
    body: 'Trigger queues will populate only after legitimate CRM events are available.',
  },
] as const;

type TabId = typeof tabs[number]['id'];

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState<TabId>('contacts');
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const EmptyIcon = active.icon;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b border-border px-6 pb-4 pt-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">CRM</h1>
          <span className="rounded-full border border-muted-foreground/20 bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Not connected
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Contacts, segments, and outreach triggers will stay empty until real CRM data is connected.
        </p>

        <div className="mt-4 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
                activeTab === tab.id
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              data-testid={`crm-tab-${tab.id}`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <EmptyIcon size={18} />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">{active.title}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{active.body}</p>
        </div>
      </div>
    </div>
  );
}
