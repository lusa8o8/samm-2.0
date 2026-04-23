import ReactMarkdown from "react-markdown";
import { Calendar, Link2, Sparkles, Target } from "lucide-react";

type BriefData = {
  title?: string | null;
  body?: string | null;
  campaign_name?: string | null;
  subject_line?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

function formatDate(value?: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function textValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

export function CampaignBriefWidget({ data }: { data: BriefData }) {
  const title = data.campaign_name || data.subject_line || data.title || "Campaign brief";
  const objective =
    textValue(data.metadata?.objective) ||
    textValue(data.metadata?.purpose) ||
    textValue(data.metadata?.slot_purpose);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-violet-50/70 to-white p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white/85 px-2.5 py-0.5 text-[10px] font-medium text-violet-700">
              <Sparkles className="h-3 w-3" />
              Design brief
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
            <div className="prose prose-sm max-w-none text-[13px] leading-relaxed text-foreground/80 prose-p:my-2 prose-li:my-0.5 prose-ul:my-2 prose-strong:text-foreground prose-headings:my-2 prose-headings:text-[13px] prose-headings:font-semibold prose-headings:text-foreground">
              <ReactMarkdown>{data.body ?? "No brief content available."}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {data.campaign_name && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Link2 size={12} className="mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Campaign</p>
              <p className="text-[12px] font-medium text-foreground">{data.campaign_name}</p>
            </div>
          </div>
        )}
        {objective && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Target size={12} className="mt-0.5 flex-shrink-0 text-purple-500" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Objective</p>
              <p className="text-[12px] font-medium text-foreground">{objective}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
          <Calendar size={12} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Created</p>
            <p className="text-[12px] font-medium text-foreground">{formatDate(data.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
