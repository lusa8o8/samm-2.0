import { getOrgId, supabase } from "../../../../src/lib/supabase";
import type { CalendarEvent } from "../types";

type LiveCalendarRow = {
  id: string;
  event_type?: string | null;
  event_date?: string | null;
  event_end_date?: string | null;
  label?: string | null;
  universities?: string[] | null;
  creative_override_allowed?: boolean | null;
  support_content_allowed?: boolean | null;
};

function normalizeEventType(eventType?: string | null): CalendarEvent["eventType"] {
  switch ((eventType ?? "").toLowerCase()) {
    case "launch":
      return "campaign_launch";
    case "promotion":
      return "promotion";
    case "seasonal":
      return "holiday";
    case "community":
      return "webinar";
    case "deadline":
      return "product_release";
    case "other":
    default:
      return "campaign_launch";
  }
}

function toPriority(row: LiveCalendarRow): CalendarEvent["priority"] {
  const type = (row.event_type ?? "").toLowerCase();
  if (type === "promotion" || type === "seasonal") return "high";
  if (type === "launch" || type === "deadline") return "medium";
  return "low";
}

function toStatus(row: LiveCalendarRow): CalendarEvent["status"] {
  const now = new Date();
  const start = row.event_date ? new Date(row.event_date) : null;
  const end = row.event_end_date ? new Date(row.event_end_date) : start;

  if (end && end < now) return "completed";
  if (start && start > now) return "planned";
  return "active";
}

function buildNotes(row: LiveCalendarRow) {
  const notes: string[] = [];
  if (row.support_content_allowed) notes.push("Support content allowed inside this campaign window.");
  if (row.creative_override_allowed) notes.push("Creative deviation is allowed for this event.");
  return notes.join(" ");
}

function mapCalendarRow(row: LiveCalendarRow): CalendarEvent {
  return {
    id: row.id,
    name: row.label ?? "Calendar event",
    eventType: normalizeEventType(row.event_type),
    startDate: row.event_date ?? new Date().toISOString(),
    endDate: row.event_end_date ?? undefined,
    targetICP: Array.isArray(row.universities) && row.universities.length > 0 ? row.universities.join(", ") : undefined,
    objective: row.label ?? undefined,
    campaignType: row.event_type ?? undefined,
    priority: toPriority(row),
    status: toStatus(row),
    ownerPipeline: "C",
    notes: buildNotes(row) || undefined,
    linkedCampaign: row.label ?? undefined,
    supportContentAllowed: row.support_content_allowed ?? false,
    creativeOverrideAllowed: row.creative_override_allowed ?? false,
    audienceTags: row.universities ?? [],
  };
}

export async function getCalendarEvents() {
  const { data, error } = await supabase
    .from("academic_calendar")
    .select("*")
    .eq("org_id", getOrgId())
    .order("event_date", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapCalendarRow(row as LiveCalendarRow));
}
