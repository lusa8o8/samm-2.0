import type { WorkspaceWidgetDescriptor } from "@/lib/workspace-adapter";
import { AssetReadinessPanel } from "@/components/workspace/calendar-studio/AssetReadinessPanel";
import { CalendarDayPanel } from "@/components/workspace/calendar-studio/CalendarDayPanel";
import { CalendarMonthGrid } from "@/components/workspace/calendar-studio/CalendarMonthGrid";
import { CampaignPanel } from "@/components/workspace/calendar-studio/CampaignPanel";
import { MonthlyPlanningSessionWidget } from "@/components/workspace/calendar-studio/MonthlyPlanningSessionWidget";
import type {
  AssetReadinessRecordViewData,
  CalendarDayPanelViewData,
  CalendarMonthGridViewData,
  CampaignPanelViewData,
  MonthlyPlanningSessionViewData,
} from "@/components/workspace/calendar-studio/types";

interface WorkspaceWidgetRendererProps {
  widget: WorkspaceWidgetDescriptor;
}

function UnsupportedWidgetPreview({ widget }: WorkspaceWidgetRendererProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{widget.type}</p>
        {widget.title ? <p className="mt-1 text-sm font-medium text-foreground">{widget.title}</p> : null}
      </div>
      <pre className="overflow-x-auto rounded-xl border bg-muted/30 p-4 text-[11px] leading-relaxed text-muted-foreground">
        {JSON.stringify(widget.data, null, 2)}
      </pre>
    </div>
  );
}

export function WorkspaceWidgetRenderer({ widget }: WorkspaceWidgetRendererProps) {
  switch (widget.type) {
    case "monthly_planning_session":
      return <MonthlyPlanningSessionWidget data={widget.data as MonthlyPlanningSessionViewData} />;
    case "calendar_month_grid":
      return <CalendarMonthGrid data={widget.data as CalendarMonthGridViewData} />;
    case "calendar_day_panel":
      return <CalendarDayPanel data={widget.data as CalendarDayPanelViewData} />;
    case "campaign_panel":
      return <CampaignPanel data={widget.data as CampaignPanelViewData} />;
    case "asset_readiness_panel":
      return <AssetReadinessPanel data={widget.data as AssetReadinessRecordViewData} />;
    default:
      return <UnsupportedWidgetPreview widget={widget} />;
  }
}
