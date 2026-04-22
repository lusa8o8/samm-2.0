export type WorkspaceWidgetType =
  | "approval_queue"
  | "campaign_brief"
  | "content_batch_review"
  | "calendar_window"
  | "calendar_slot"
  | "pipeline_run_timeline"
  | "metrics_snapshot"
  | "failure_group"
  | "settings_editor"
  | "decision_log"
  | "linked_content_list"
  | "custom";

export interface WorkspaceWidgetDescriptor<T = unknown> {
  type: WorkspaceWidgetType;
  title?: string;
  data: T;
}

export interface WorkspaceInspectorPayload<T = unknown> {
  title: string;
  subtitle?: string;
  widget?: WorkspaceWidgetDescriptor<T>;
}

export type WorkspaceMessagePart =
  | { type: "text"; text: string }
  | { type: "widget"; widget: WorkspaceWidgetDescriptor }
  | {
      type: "action";
      label: string;
      action: string;
      variant?: "default" | "destructive" | "outline" | "secondary";
      payload?: unknown;
    }
  | {
      type: "status";
      label: string;
      status: "running" | "waiting_human" | "failed" | "success" | "scheduled" | "queued";
    };

export interface WorkspaceDecisionReason {
  code: string;
  summary: string;
  details?: string;
  window_ref?: string | null;
  slot_ref?: string | null;
}

export interface CalendarWindowSummary {
  window_ref: string;
  owner_pipeline: string;
  exclusive_campaign: boolean;
  support_content_allowed: boolean;
  channels_in_scope: string[];
  allowed_ctas: string[];
  primary_message?: string | null;
  start_date: string;
  end_date: string;
}

export interface ResolvedSlotSummary {
  slot_ref: string;
  date: string;
  channel: string;
  purpose: "baseline" | "campaign" | "support";
  owner_pipeline: string;
  allowed_ctas: string[];
  allowed_content_types: string[];
  window_ref?: string | null;
  campaign_ref?: string | null;
}

export interface LinkedContentRef {
  id: string;
  platform: string;
  status: string;
  pipeline_run_id?: string | null;
  campaign_ref?: string | null;
  slot_ref?: string | null;
}

export function createInspectorPayload<T = unknown>(
  title: string,
  widget?: WorkspaceWidgetDescriptor<T>,
  subtitle?: string
): WorkspaceInspectorPayload<T> {
  return { title, subtitle, widget };
}
