import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  Settings,
  BarChart2,
} from "lucide-react";
import { StatusChip } from "../components/shared/StatusChip";
import { useInspector } from "../components/shell/WorkspaceShell";
import {
  getOperationsOverview,
  triggerOperationsPipeline,
  type OperationsOverview,
  type OperationsPipelineHealth,
} from "../services/liveOperationsService";
import OperationsManual from "../../../../src/pages/agent/manual";
import CarryoverSettingsEditor from "../../../../src/pages/agent/settings";
import type { PipelineRun } from "../types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "manual", label: "Manual", icon: BookOpen },
] as const;

function OverviewTab({
  runs,
  health,
  statusCounts,
  refreshing,
  triggering,
  onTrigger,
}: {
  runs: PipelineRun[];
  health: OperationsPipelineHealth[];
  statusCounts: OperationsOverview["statusCounts"];
  refreshing: boolean;
  triggering: string | null;
  onTrigger: (pipelineId?: string) => void;
}) {
  const { openInspector } = useInspector();

  const statusCards = [
    { label: "Running", count: statusCounts.running, icon: Activity, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Waiting", count: statusCounts.waiting_human, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Failed", count: statusCounts.failed, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: "Completed", count: statusCounts.completed, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {statusCards.map((card) => (
          <div key={card.label} className={cn("rounded-xl border border-border p-4 flex items-center gap-3", card.bg)}>
            <card.icon size={18} className={card.color} />
            <div>
              <p className="text-xl font-bold text-foreground">{card.count}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {health.map((item) => {
          const isTriggering = triggering === item.id;
          const isBlocked = item.status === "running" || item.status === "waiting_human";
          return (
            <div key={item.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                </div>
                <StatusChip status={item.status} showDot />
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between gap-3">
                  <span>Last run</span>
                  <span className="truncate text-right text-foreground/80">
                    {item.lastRun ? format(new Date(item.lastRun), "HH:mm") : "Never"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Duration</span>
                  <span className="text-foreground/80">{item.duration ?? "—"}</span>
                </div>
              </div>
              {item.canTrigger && (
                <button
                  type="button"
                  className={cn(
                    "mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                    isBlocked || isTriggering
                      ? "border-border bg-muted text-muted-foreground"
                      : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                  )}
                  disabled={isBlocked || isTriggering || refreshing}
                  onClick={() => onTrigger(item.pipelineId)}
                >
                  <Play className="h-3.5 w-3.5" />
                  {isTriggering ? "Starting..." : isBlocked ? item.status.replace(/_/g, " ") : "Run now"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Recent pipeline activity</p>
            <p className="text-xs text-muted-foreground">Live pipeline runs from the current workspace.</p>
          </div>
          {refreshing && <StatusChip status="processing" label="Refreshing" showDot />}
        </div>

        <div className="space-y-3">
          {runs.map((run) => (
            <div
              key={run.id}
              className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5 transition-colors hover:bg-muted/30"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => openInspector(run.pipelineName, { type: "pipeline_run_timeline", data: [run] })}
                data-testid={`run-row-${run.id}`}
              >
                <StatusChip status={run.status} showDot />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{run.pipelineName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{run.stepName}</p>
                </div>
                <div className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: run.stepTotal > 0 ? `${(run.stepCurrent / run.stepTotal) * 100}%` : "0%" }}
                    />
                  </div>
                  <span>{run.stepCurrent}/{run.stepTotal}</span>
                </div>
                <p className="hidden text-[10px] text-muted-foreground sm:block">
                  {format(new Date(run.lastActivity), "HH:mm")}
                </p>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ManualTab() {
  return <OperationsManual />;
}

function SettingsTab() {
  return (
    <div className="-mx-6 -my-4">
      <CarryoverSettingsEditor />
    </div>
  );
}

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("overview");
  const [overview, setOverview] = useState<OperationsOverview | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [triggeringPipeline, setTriggeringPipeline] = useState<string | null>(null);
  const { toast } = useToast();

  const loadOverview = async () => {
    setIsOverviewLoading(true);
    try {
      setOverview(await getOperationsOverview());
    } catch (error) {
      toast({
        title: "Operations load failed",
        description: error instanceof Error ? error.message : "Failed to load operations overview.",
        variant: "destructive",
      });
    } finally {
      setIsOverviewLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const runs = useMemo(() => overview?.runs ?? [], [overview]);
  const health = useMemo(() => overview?.health ?? [], [overview]);
  const statusCounts = useMemo(
    () =>
      overview?.statusCounts ?? {
        running: 0,
        waiting_human: 0,
        failed: 0,
        completed: 0,
        scheduled: 0,
      },
    [overview]
  );

  async function handleTrigger(pipelineId?: string) {
    if (!pipelineId || (pipelineId !== "A" && pipelineId !== "B" && pipelineId !== "C")) return;

    setTriggeringPipeline(pipelineId);
    try {
      await triggerOperationsPipeline(pipelineId);
      toast({
        title: "Pipeline queued",
        description: `${pipelineId === "A" ? "Pipeline A" : pipelineId === "B" ? "Pipeline B" : "Pipeline C"} has been queued for execution.`,
      });
      await loadOverview();
    } catch (error) {
      toast({
        title: "Trigger failed",
        description: error instanceof Error ? error.message : "Could not trigger the pipeline.",
        variant: "destructive",
      });
    } finally {
      setTriggeringPipeline(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border px-6 pb-4 pt-6">
        <h1 className="text-xl font-semibold text-foreground">Operations</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Live system status, carryover admin surfaces, and operational guidance.</p>

        <div className="mt-4 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                activeTab === tab.id
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
        {activeTab === "overview" && (
          <OverviewTab
            runs={runs}
            health={health}
            statusCounts={statusCounts}
            refreshing={isOverviewLoading}
            triggering={triggeringPipeline}
            onTrigger={handleTrigger}
          />
        )}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "manual" && <ManualTab />}
      </div>
    </div>
  );
}
