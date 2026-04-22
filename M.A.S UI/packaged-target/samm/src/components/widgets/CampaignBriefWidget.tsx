import ReactMarkdown from "react-markdown";
import { CalendarDays, FileText, Share2, Sparkles } from "lucide-react";

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

export function CampaignBriefWidget({ data }: { data: BriefData }) {
  const title = data.campaign_name || data.subject_line || data.title || "Campaign brief";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[11px] font-medium text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              Design brief
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(data.created_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Campaign asset direction
              </span>
            </div>
          </div>
          <div className="rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[11px] font-medium text-violet-700">
            Shareable
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="prose prose-sm max-w-none text-[13px] leading-relaxed prose-p:my-2 prose-strong:text-foreground">
          <ReactMarkdown>{data.body ?? "No brief content available."}</ReactMarkdown>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <Share2 className="h-3.5 w-3.5 text-violet-600" />
          Tip
        </div>
        <p className="mt-1">Use the card-level Share action to copy or distribute this brief without leaving the registry.</p>
      </div>
    </div>
  );
}
