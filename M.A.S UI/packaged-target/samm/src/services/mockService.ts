import {
  mockPipelineRuns,
  mockInboxItems,
  mockContentDrafts,
  mockCalendarEvents,
  mockKPIs,
  mockChannelMetrics,
  mockContacts,
  mockSegments,
  mockTriggerQueue,
  mockSalesSequences,
  mockOfferDecisions,
  mockPatternSummaries,
  mockWorkspaceContext,
  mockSammMessages,
} from '../data/mockData';

import type {
  PipelineRun,
  InboxItem,
  ContentDraft,
  CalendarEvent,
  MetricKPI,
  ChannelMetric,
  Contact,
  Segment,
  TriggerQueueItem,
  SalesSequence,
  OfferDecision,
  PatternSummary,
  WorkspaceContext,
  SammMessage,
} from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getSammContext(): Promise<WorkspaceContext> {
  await delay(300);
  return { ...mockWorkspaceContext };
}

export async function getSammMessages(): Promise<SammMessage[]> {
  await delay(200);
  return [...mockSammMessages];
}

export async function sendSammMessage(content: string): Promise<SammMessage> {
  await delay(800);
  const responses: Record<string, SammMessage> = {
    default: {
      id: `msg-${Date.now()}`,
      role: 'samm',
      content: `Understood. I\'ve noted that: "${content}"\n\nI\'ll factor this into upcoming decisions. Is there anything specific you\'d like me to prioritize?`,
      timestamp: new Date().toISOString(),
    },
    inbox: {
      id: `msg-${Date.now()}`,
      role: 'samm',
      content: 'You have **5 pending items** in your inbox. The most urgent is the Spring Sale campaign brief approval — the campaign launches in 8 days and content scheduling is blocked.\n\nWould you like to review the approval queue now?',
      timestamp: new Date().toISOString(),
      widgets: [{ type: 'approval_queue', title: 'Pending approvals', data: mockInboxItems.filter(i => i.status === 'pending') }],
      actions: [
        { label: 'Go to inbox', action: 'navigate', variant: 'default', payload: { path: '/inbox' } },
      ],
    },
    content: {
      id: `msg-${Date.now()}`,
      role: 'samm',
      content: 'Here\'s the current content registry summary:\n\n- **3 drafts** awaiting approval\n- **1 post** scheduled for April 28\n- **5 posts** published\n- **1 failure** needs retry\n\nThe failed post ("Why most CRMs fail small teams") can be retried once the image service recovers.',
      timestamp: new Date().toISOString(),
      widgets: [{ type: 'content_batch_review', title: 'Content overview', data: mockContentDrafts }],
    },
    failure: {
      id: `msg-${Date.now()}`,
      role: 'samm',
      content: 'Pipeline D failed at step 2 (image generation). The image API timed out after 3 retries.\n\n**Options:**\n1. Retry now — the image service appears to be recovering\n2. Skip the image and publish text-only\n3. Cancel this run\n\nThe content is ready; only the image step failed.',
      timestamp: new Date().toISOString(),
      widgets: [{ type: 'failure_group', title: 'Failure details', data: mockPipelineRuns.filter(r => r.status === 'failed') }],
      actions: [
        { label: 'Retry now', action: 'retry_run', variant: 'default', payload: { runId: 'run-004' } },
        { label: 'Publish text-only', action: 'publish_without_image', variant: 'outline', payload: { runId: 'run-004' } },
        { label: 'Cancel run', action: 'cancel_run', variant: 'destructive', payload: { runId: 'run-004' } },
      ],
    },
    crm: {
      id: `msg-${Date.now()}`,
      role: 'samm',
      content: 'The CRM is tracking **400 contacts** across 3 segments. Today\'s activity:\n\n- **2 high-intent triggers** need routing decisions\n- Alex Morgan (Ascend Tech) submitted a demo request — currently in S2 step 3\n- Sarah Chen (Nexus Corp) engaged with a post — eligible for S1 enrollment\n\nShall I surface their contact cards?',
      timestamp: new Date().toISOString(),
      widgets: [{ type: 'lead_card', title: 'High-intent contacts', data: mockContacts.slice(0, 2) }],
    },
    patterns: {
      id: `msg-${Date.now()}`,
      role: 'samm',
      content: 'I\'ve identified **3 content patterns** from the last 30 days:\n\n1. Case study posts outperform product posts 3:1 on LinkedIn\n2. Tuesday 10am posts have 2.1x reach\n3. Offers with urgency framing convert 40% better\n\nI\'ve already applied pattern #3 to the Spring Sale content drafts.',
      timestamp: new Date().toISOString(),
      widgets: [{ type: 'pattern_summary', title: 'Detected patterns', data: mockPatternSummaries }],
    },
  };

  const lower = content.toLowerCase();
  if (lower.includes('inbox') || lower.includes('approval') || lower.includes('pending')) return responses.inbox;
  if (lower.includes('content') || lower.includes('draft')) return responses.content;
  if (lower.includes('fail') || lower.includes('error') || lower.includes('broken')) return responses.failure;
  if (lower.includes('crm') || lower.includes('contact') || lower.includes('lead')) return responses.crm;
  if (lower.includes('pattern') || lower.includes('insight') || lower.includes('learn')) return responses.patterns;
  return responses.default;
}

export async function getInboxItems(): Promise<InboxItem[]> {
  await delay(300);
  return [...mockInboxItems];
}

export async function approveInboxItem(id: string): Promise<{ success: boolean }> {
  await delay(400);
  return { success: true };
}

export async function rejectInboxItem(id: string): Promise<{ success: boolean }> {
  await delay(400);
  return { success: true };
}

export async function getContentRegistry(): Promise<ContentDraft[]> {
  await delay(300);
  return [...mockContentDrafts];
}

export async function approveContentItem(id: string): Promise<{ success: boolean }> {
  await delay(400);
  return { success: true };
}

export async function rejectContentItem(id: string): Promise<{ success: boolean }> {
  await delay(400);
  return { success: true };
}

export async function retryContentItem(id: string): Promise<{ success: boolean }> {
  await delay(600);
  return { success: true };
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  await delay(300);
  return [...mockCalendarEvents];
}

export async function getOperationsOverview(): Promise<{
  runs: PipelineRun[];
  kpis: MetricKPI[];
}> {
  await delay(300);
  return {
    runs: mockPipelineRuns,
    kpis: mockKPIs,
  };
}

export async function getMetrics(): Promise<{
  kpis: MetricKPI[];
  channels: ChannelMetric[];
  patterns: PatternSummary[];
}> {
  await delay(300);
  return {
    kpis: mockKPIs,
    channels: mockChannelMetrics,
    patterns: mockPatternSummaries,
  };
}

export async function getContacts(): Promise<Contact[]> {
  await delay(300);
  return [...mockContacts];
}

export async function getSegments(): Promise<Segment[]> {
  await delay(300);
  return [...mockSegments];
}

export async function getTriggerQueue(): Promise<TriggerQueueItem[]> {
  await delay(300);
  return [...mockTriggerQueue];
}

export async function getSalesSequences(): Promise<SalesSequence[]> {
  await delay(300);
  return [...mockSalesSequences];
}

export async function getOfferDecisions(): Promise<OfferDecision[]> {
  await delay(300);
  return [...mockOfferDecisions];
}

export async function getPatternSummaries(): Promise<PatternSummary[]> {
  await delay(300);
  return [...mockPatternSummaries];
}

export async function retryRun(runId: string): Promise<{ success: boolean }> {
  await delay(600);
  return { success: true };
}

export async function cancelRun(runId: string): Promise<{ success: boolean }> {
  await delay(400);
  return { success: true };
}
