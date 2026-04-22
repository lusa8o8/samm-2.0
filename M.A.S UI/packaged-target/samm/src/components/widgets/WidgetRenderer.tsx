import type { WidgetDescriptor } from '../../types';
import { ApprovalQueueWidget } from './ApprovalQueueWidget';
import { PipelineRunTimelineWidget } from './PipelineRunTimelineWidget';
import { ContentBatchReviewWidget } from './ContentBatchReviewWidget';
import { LeadCardWidget } from './LeadCardWidget';
import { FailureGroupWidget } from './FailureGroupWidget';
import { PatternSummaryWidget } from './PatternSummaryWidget';
import { MetricsSnapshotWidget } from './MetricsSnapshotWidget';
import { SequenceStatusWidget } from './SequenceStatusWidget';

interface WidgetRendererProps {
  widget: WidgetDescriptor;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  switch (widget.type) {
    case 'approval_queue':
      return <ApprovalQueueWidget data={widget.data as never} />;
    case 'pipeline_run_timeline':
      return <PipelineRunTimelineWidget data={widget.data as never} />;
    case 'content_batch_review':
      return <ContentBatchReviewWidget data={widget.data as never} />;
    case 'lead_card':
      return <LeadCardWidget data={widget.data as never} />;
    case 'failure_group':
      return <FailureGroupWidget data={widget.data as never} />;
    case 'pattern_summary':
      return <PatternSummaryWidget data={widget.data as never} />;
    case 'metrics_snapshot':
      return <MetricsSnapshotWidget data={widget.data as never} />;
    case 'sequence_status_panel':
      return <SequenceStatusWidget data={widget.data as never} />;
    default:
      return (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Widget type "{widget.type}" — not yet implemented
        </div>
      );
  }
}
