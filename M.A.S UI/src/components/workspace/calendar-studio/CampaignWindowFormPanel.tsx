import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventForm, type EventFormData } from "@/components/workspace/calendar-studio/ManualEntryPanel";
import { useCalendarStudioWorkflow } from "@/components/layout";

export type CampaignWindowFormPanelViewData = {
  mode: "create" | "edit";
  windowId?: string | null;
  initialValue: EventFormData;
};

export function CampaignWindowFormPanel({ data }: { data: CampaignWindowFormPanelViewData }) {
  const workflow = useCalendarStudioWorkflow();
  const [form, setForm] = useState<EventFormData>(data.initialValue);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setForm(data.initialValue);
    setIsPending(false);
  }, [data.initialValue, data.mode, data.windowId]);

  const isEdit = data.mode === "edit";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsPending(true);

    try {
      if (isEdit && data.windowId) {
        await workflow.updateCampaignWindowRules?.(data.windowId, form);
      } else {
        await workflow.createManualCampaignWindow?.(form);
      }
      workflow.closeInspectorPanel?.();
    } catch {
      // Page-level mutations own the user-facing error toast.
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {isEdit ? "Campaign rules" : "Campaign window"}
            </p>
            <h3 className="mt-1 text-xl font-semibold leading-tight text-foreground">
              {isEdit ? "Edit campaign rules" : "Add campaign or key date"}
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              {isEdit
                ? "Update the committed calendar window so future planning and draft creation stay aligned."
                : "Add a real calendar window Calendar Studio can treat as committed planning truth."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => workflow.closeInspectorPanel?.()}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            aria-label="Back to calendar detail"
          >
            <ArrowLeft size={14} />
          </button>
        </div>

        <EventForm
          value={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          isPending={isPending}
          submitLabel={isEdit ? "Save changes" : "Save window"}
        />

        <div className="mt-3 flex justify-start">
          <Button type="button" variant="ghost" size="sm" onClick={() => workflow.closeInspectorPanel?.()}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
