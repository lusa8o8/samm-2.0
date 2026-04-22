import { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, Clock, RefreshCw, Settings, BookOpen, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { StatusChip } from '../components/shared/StatusChip';
import { useInspector } from '../components/shell/WorkspaceShell';
import { getOperationsOverview } from '../services/mockService';
import { useModules } from '../store/moduleStore';
import type { PipelineRun, ModuleId } from '../types';
import { cn } from '@/lib/utils';
import { mockPipelineRuns } from '../data/mockData';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'manual', label: 'Manual', icon: BookOpen },
];

const settingsSections = [
  { id: 'org', label: 'Organisation Details', description: 'Workspace name, timezone, branding basics' },
  { id: 'brand-voice', label: 'Brand Voice', description: 'Tone, vocabulary, and communication style guidelines' },
  { id: 'visual-brand', label: 'Visual Brand', description: 'Logo, colors, and visual identity settings' },
  { id: 'connections', label: 'Connections & Modules', description: 'Enable or disable optional modules and external integrations' },
  { id: 'icp', label: 'ICP Categories', description: 'Ideal customer profile definitions and scoring criteria' },
  { id: 'offers', label: 'Offer Catalog', description: 'Available offers, discounts, and pricing tiers' },
  { id: 'seasonality', label: 'Seasonality', description: 'Key dates, seasonal campaigns, and promotional calendar' },
  { id: 'discount', label: 'Discount Policies', description: 'Rules for when and how discounts are applied' },
  { id: 'outreach', label: 'Outreach Policy', description: 'Frequency caps, channel preferences, and sequencing rules' },
  { id: 'approval', label: 'Approval Policy', description: 'Which actions require human review before execution' },
];

const pipelineDescriptions: Record<string, string> = {
  'A': 'Engagement pipeline — comments, replies, suggestions, escalations',
  'B': 'Weekly baseline — content planning and drafting',
  'C': 'Campaign planner — calendar-triggered campaigns',
  'D': 'On-demand posts from plain language prompts',
  'publish': 'Scheduled publisher — publishes due content',
};

function OverviewTab({ runs }: { runs: PipelineRun[] }) {
  const { openInspector } = useInspector();
  const byStatus = {
    running: runs.filter(r => r.status === 'running'),
    waiting_human: runs.filter(r => r.status === 'waiting_human'),
    failed: runs.filter(r => r.status === 'failed'),
    completed: runs.filter(r => r.status === 'completed'),
    scheduled: runs.filter(r => r.status === 'scheduled'),
  };

  const statusCards = [
    { label: 'Running', count: byStatus.running.length, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Waiting', count: byStatus.waiting_human.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Failed', count: byStatus.failed.length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'Completed', count: byStatus.completed.length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-4 gap-3">
        {statusCards.map(card => (
          <div key={card.label} className={cn('rounded-xl border border-border p-4 flex items-center gap-3', card.bg)}>
            <card.icon size={18} className={card.color} />
            <div>
              <p className="text-xl font-bold text-foreground">{card.count}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline health */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-semibold text-foreground mb-4">Pipeline runs</p>
        <div className="space-y-3">
          {runs.map(run => (
            <div
              key={run.id}
              className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
              onClick={() => openInspector(run.pipelineName, { type: 'pipeline_run_timeline', data: [run] })}
              data-testid={`run-row-${run.id}`}
            >
              <StatusChip status={run.status} showDot />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{run.pipelineName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{run.stepName}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-shrink-0">
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: run.stepTotal > 0 ? `${(run.stepCurrent / run.stepTotal) * 100}%` : '0%' }}
                  />
                </div>
                <span>{run.stepCurrent}/{run.stepTotal}</span>
              </div>
              <p className="text-[10px] text-muted-foreground flex-shrink-0">{format(new Date(run.lastActivity), 'HH:mm')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const { modules, toggleModule } = useModules();
  const [expanded, setExpanded] = useState<string | null>('connections');

  return (
    <div className="space-y-2">
      {settingsSections.map(section => (
        <div key={section.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            onClick={() => setExpanded(expanded === section.id ? null : section.id)}
            data-testid={`settings-section-${section.id}`}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{section.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{section.description}</p>
            </div>
            <span className={cn('text-muted-foreground transition-transform', expanded === section.id ? 'rotate-180' : '')}>
              ▾
            </span>
          </button>
          {expanded === section.id && (
            <div className="px-4 pb-4 border-t border-border">
              {section.id === 'connections' ? (
                <div className="space-y-3 pt-3">
                  <p className="text-xs text-muted-foreground mb-3">Toggle optional modules on or off. Changes take effect immediately.</p>
                  {modules.filter(m => m.optional).map(module => (
                    <div key={module.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{module.label}</p>
                        <p className="text-[11px] text-muted-foreground">Optional module</p>
                      </div>
                      <button
                        onClick={() => toggleModule(module.id as ModuleId)}
                        className={cn(
                          'w-10 h-5.5 rounded-full transition-colors relative flex-shrink-0',
                          module.enabled ? 'bg-primary' : 'bg-muted'
                        )}
                        data-testid={`toggle-module-${module.id}`}
                      >
                        <span className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                          module.enabled ? 'translate-x-5' : 'translate-x-0.5'
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-3">
                  <p className="text-xs text-muted-foreground">Configuration for {section.label} will appear here once connected.</p>
                  <div className="mt-3 bg-muted/40 rounded-lg p-3 border border-dashed border-border">
                    <p className="text-[11px] text-muted-foreground text-center">Coming soon</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ManualTab() {
  const sections = [
    {
      title: 'How SAMM works',
      content: 'SAMM (Strategic Agentic Marketing Manager) is a coordination layer that runs marketing pipelines, manages content workflows, and surfaces relevant decisions to you. It operates continuously in the background and alerts you when human input is required.',
    },
    {
      title: 'Pipeline overview',
      content: Object.entries(pipelineDescriptions).map(([id, desc]) => `Pipeline ${id}: ${desc}`).join('\n'),
    },
    {
      title: 'Approval policy',
      content: 'By default, all content drafts require human approval before scheduling. Campaign briefs require approval before Pipeline C begins executing. Escalations are surfaced within 30 minutes of detection. You can configure these rules in Settings > Approval Policy.',
    },
    {
      title: 'CRM integration',
      content: 'The CRM module tracks contacts, segments, and outreach decisions. Triggers are fired automatically based on contact behavior (content engagement, form submissions, demo requests). SAMM routes trigger decisions through the configured outreach policy before taking action.',
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map(section => (
        <div key={section.title} className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">{section.title}</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
        </div>
      ))}
    </div>
  );
}

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [runs, setRuns] = useState<PipelineRun[]>([]);

  useEffect(() => {
    getOperationsOverview().then(d => setRuns(d.runs));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Operations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">System status, settings, and documentation</p>

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
              data-testid={`ops-tab-${tab.id}`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === 'overview' && <OverviewTab runs={runs} />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'manual' && <ManualTab />}
      </div>
    </div>
  );
}
