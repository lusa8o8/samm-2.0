import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

function Cmd({ children }: { children: React.ReactNode }) {
  return (
    <code className="inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">
      {children}
    </code>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Field({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex gap-3 py-1.5 text-sm">
      <span className="w-48 shrink-0 font-medium text-foreground">{name}</span>
      <span className="text-muted-foreground">{desc}</span>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
        {n}
      </span>
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

export default function OperationsManual() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Operations Manual</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete reference for every samm feature — commands, settings, workflows, and troubleshooting.
        </p>
      </div>

      <Accordion type="multiple" className="space-y-2">

        {/* 1. Quick Start */}
        <AccordionItem value="quick-start" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Quick Start
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              samm is an AI marketing coordinator. You talk to it in plain language; it decides what to do —
              schedule campaigns, write posts, route approvals, and manage your content calendar.
            </p>

            <Section title="Workspace layout">
              <Field name="samm" desc="Chat interface. Every action starts here." />
              <Field name="Inbox" desc="Workflow decisions — campaign briefs, revision requests, escalations, reports." />
              <Field name="Content" desc="All content assets — drafts, scheduled posts, approved content, published posts, and comments." />
              <Field name="Calendar" desc="Academic/marketing calendar. Events drive campaign timing." />
              <Field name="Operations" desc="Overview (pipeline runs), Settings (org config), Manual (this page)." />
            </Section>

            <Section title="First-time setup checklist">
              <Step n={1}>Operations → Settings → fill in Org name and full name.</Step>
              <Step n={2}>Settings → Brand Voice — set tone, always/never say, CTA preference, and example posts.</Step>
              <Step n={3}>Settings → Visual Brand — set hex colors, font names, social handles, and primary CTA URL.</Step>
              <Step n={4}>Settings → Integrations — connect the platforms you publish to.</Step>
              <Step n={5}>Calendar → add at least one upcoming event (exam, orientation, graduation).</Step>
              <Step n={6}>Chat with samm: <Cmd>run the campaign pipeline</Cmd> to generate your first campaign brief.</Step>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 2. samm Commands */}
        <AccordionItem value="commands" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            samm Commands
          </AccordionTrigger>
          <AccordionContent className="space-y-5 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Type these in the samm chat. Variations in phrasing are fine — samm understands intent.
            </p>

            <Section title="Campaign pipeline">
              <div className="space-y-2 text-sm">
                <div><Cmd>run the campaign pipeline</Cmd> — starts Pipeline C for the next calendar event</div>
                <div><Cmd>schedule a campaign for UNZA graduation on 30 April and run</Cmd> — creates the event and triggers Pipeline C for it immediately</div>
                <div><Cmd>approve</Cmd> / <Cmd>reject</Cmd> — responds to a pending campaign brief in Inbox (must be in active brief context)</div>
                <div><Cmd>resume pipeline c</Cmd> — resumes a paused campaign run after approval</div>
              </div>
            </Section>

            <Section title="One-off posts (Pipeline D)">
              <div className="space-y-2 text-sm">
                <div><Cmd>write a post about the upcoming orientation week</Cmd> — writes 4 platform drafts (Facebook, WhatsApp, YouTube, Email), lands in Content Registry</div>
                <div><Cmd>draft a WhatsApp message about exam timetable release</Cmd> — writes a WhatsApp-only draft</div>
                <div><Cmd>create a Facebook post about our new study group feature</Cmd> — Facebook-only draft</div>
              </div>
            </Section>

            <Section title="Engagement pipeline">
              <div className="space-y-2 text-sm">
                <div><Cmd>run pipeline a</Cmd> — runs the engagement pipeline (classifies comments, drafts replies, logs escalations)</div>
                <div><Cmd>run the engagement pipeline</Cmd> — same as above</div>
              </div>
            </Section>

            <Section title="Weekly publishing pipeline">
              <div className="space-y-2 text-sm">
                <div><Cmd>run pipeline b</Cmd> — runs the weekly publishing pipeline, pauses for content approval</div>
                <div><Cmd>run the publishing pipeline</Cmd> — same as above</div>
              </div>
            </Section>

            <Section title="Calendar commands">
              <div className="space-y-2 text-sm">
                <div><Cmd>add an exam event on 15 May called UNZA Semester 1 Exams</Cmd> — creates calendar event</div>
                <div><Cmd>change UNZA orientation to 10 June</Cmd> — edits an existing event date</div>
                <div><Cmd>delete the May exam event</Cmd> — removes a calendar event (asks for confirmation)</div>
              </div>
            </Section>

            <Section title="Status checks">
              <div className="space-y-2 text-sm">
                <div><Cmd>what is the status of pipeline a</Cmd> — returns the most recent run status</div>
                <div><Cmd>is the campaign pipeline running</Cmd> — same pattern for any pipeline</div>
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 3. Campaign Workflow */}
        <AccordionItem value="campaign-workflow" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Campaign Workflow (Pipeline C)
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Pipeline C is the full campaign production workflow. It uses multiple AI agents, two human approval gates, and writes content to the Content Registry.
            </p>

            <Section title="Step-by-step lifecycle">
              <Step n={1}><strong>Trigger:</strong> type <Cmd>run the campaign pipeline</Cmd> or combine with a calendar event. Pipeline C targets the next upcoming calendar event.</Step>
              <Step n={2}><strong>Research:</strong> competitor researcher and campaign planner agents run in parallel. Duration is capped to the lead window (max 14 days before the event).</Step>
              <Step n={3}><strong>Campaign brief:</strong> a structured brief (event, key message, CTA, post plan, hashtags) lands in <strong>Inbox</strong> for CEO review. Run is paused (<code className="text-xs">waiting_human</code>).</Step>
              <Step n={4}><strong>CEO approval:</strong> click Approve or Reject on the Inbox card. Rejection cancels the run. Approval resumes it.</Step>
              <Step n={5}><strong>Copy generation:</strong> canonical copy writer produces a locked headline, CTA, and key fact. 6 platform adapters (Facebook, WhatsApp, YouTube, Email × 3) run in parallel using that core.</Step>
              <Step n={6}><strong>Design brief:</strong> a Canva-ready design spec (brand colors, fonts, dimensions, social handles) lands in <strong>Content Registry</strong> alongside the copy cards, grouped under the campaign name.</Step>
              <Step n={7}><strong>Marketer review:</strong> review copy and design brief in <strong>Content Registry → Drafts</strong>. Approve individually or use "Approve all" for the campaign group. Reject sends a revision request to Inbox.</Step>
              <Step n={8}><strong>Monitor + report:</strong> after all drafts are approved, the monitor agent runs a readiness check. A campaign report lands in Inbox.</Step>
              <Step n={9}><strong>Scheduling:</strong> approved posts are scheduled using the platform cadence policy (Facebook: Tue/Thu, WhatsApp: Wed/Sat, YouTube: Thu, Email: Tue). Launch blast fires all platforms on day 0.</Step>
            </Section>

            <Section title="Key rules">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>— Campaign duration is bounded to the lead window, never more than 14 days.</p>
                <p>— Headline, CTA, and key fact are locked after the canonical copy writer — adapters cannot change them.</p>
                <p>— Competitor insights are simulated (no live scraping) — marked clearly in the brief.</p>
                <p>— Rejecting a draft pauses the run and creates a revision request in Inbox.</p>
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Pipeline D */}
        <AccordionItem value="pipeline-d" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            One-Off Posts (Pipeline D)
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Pipeline D writes ad-hoc posts on demand — no research, no brief, no CEO gate.
              Use it when you need a quick post about a specific topic, not a full campaign.
            </p>

            <Section title="How it works">
              <Step n={1}>Type <Cmd>write a post about [topic]</Cmd> in samm chat.</Step>
              <Step n={2}>Canonical copy writer locks the headline, CTA, and key fact (1 LLM call).</Step>
              <Step n={3}>Platform adapters run in parallel — one per requested platform (default: all 4).</Step>
              <Step n={4}>Drafts land in <strong>Content Registry → Drafts</strong> within ~10 seconds.</Step>
              <Step n={5}>Review, edit if needed, then approve. Approved posts move to Scheduled.</Step>
            </Section>

            <Section title="Scope limits">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>— No pipeline_runs row (Pipeline D is not tracked in Operations Overview).</p>
                <p>— No research phase — content is based on topic + brand voice only.</p>
                <p>— To target specific platforms: <Cmd>draft a WhatsApp message about X</Cmd> or specify platforms explicitly.</p>
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 5. Content Registry */}
        <AccordionItem value="content-registry" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Content Registry
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Content Registry is the single place all content assets live. Drafts, approvals, scheduling, and publishing all happen here.
            </p>

            <Section title="Tabs">
              <Field name="Drafts" desc="All draft and rejected content awaiting review. Campaign drafts appear grouped under their campaign name." />
              <Field name="Scheduled" desc="Approved content waiting to publish at its scheduled_at time." />
              <Field name="Published" desc="Content that has been published to a live platform." />
              <Field name="Comments" desc="Replies and engagement items logged by Pipeline A (Engagement pipeline)." />
            </Section>

            <Section title="Content statuses">
              <Field name="draft" desc="Created, not yet reviewed. All new drafts from Pipeline C or D land here." />
              <Field name="rejected" desc="Marketer rejected this asset. Appears in Drafts tab with an orange badge. Edit and resubmit." />
              <Field name="approved / scheduled" desc="Approved by the marketer. Moves to Scheduled tab. Will publish at scheduled_at." />
              <Field name="published" desc="Successfully sent to the live platform." />
              <Field name="failed" desc="Publish attempt failed. Error is stored in metadata. Retry or investigate in Operations." />
            </Section>

            <Section title="Actions">
              <Field name="Approve" desc="Marks asset as approved and triggers the next pipeline gate (if applicable)." />
              <Field name="Reject" desc="Pauses the campaign run. Opens a reason input. Creates a revision request in Inbox." />
              <Field name="Approve all" desc="Batch-approves all drafts in a campaign group. Scoped to one campaign only." />
              <Field name="Edit" desc="Opens inline editor. Saving resets status to draft (not rejected). Resubmit to resume." />
              <Field name="Share" desc="On design brief cards — share via WhatsApp, email, Telegram, or clipboard." />
              <Field name="Attach image" desc="Upload an image to a copy card before approving. Thumbnail appears on the card." />
            </Section>

            <Section title="Design brief cards">
              <div className="text-sm text-muted-foreground">
                Design briefs land in Content Registry alongside copy cards, grouped under the same campaign.
                They contain brand colors, fonts, platform dimensions, social handles, and any freeform design spec you have set in Settings → Visual Brand.
                Share the brief with your designer via the Share button. The Approve button is reserved for a future Canva integration.
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 6. Inbox */}
        <AccordionItem value="inbox" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Inbox &amp; Approvals
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Inbox is for workflow decisions — gates that require a human response before a pipeline can continue.
              Content review happens in Content Registry, not Inbox.
            </p>

            <Section title="Inbox item types">
              <Field name="campaign_brief" desc="CEO gate: review the campaign plan before copy is written. Approve to continue, Reject to cancel." />
              <Field name="revision_request" desc="Marketer rejected a draft. Brief summary of what needs fixing. Go to Content Registry to edit and resubmit." />
              <Field name="escalation" desc="Pipeline A flagged a comment as a complaint or serious issue. Includes the original comment and a suggested reply." />
              <Field name="boost_suggestion" desc="Pipeline A suggests boosting a high-performing comment thread. Mark read or act on it." />
              <Field name="campaign_report" desc="Post-campaign summary from Pipeline C. Informational — no action required. Mark read." />
              <Field name="performance_suggestion" desc="AI-generated insight about engagement or content performance. Mark read." />
            </Section>

            <Section title="How to respond">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>— <strong>Approve:</strong> resumes the pipeline run. Appears on campaign_brief cards.</p>
                <p>— <strong>Reject:</strong> cancels or pauses the run. Reason is optional but helpful.</p>
                <p>— <strong>Mark read:</strong> archives the item without a pipeline action (used on reports and suggestions).</p>
                <p>— Inbox items are scoped to your org. Unread count appears in the sidebar.</p>
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 7. Calendar */}
        <AccordionItem value="calendar" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Academic Calendar
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              The calendar drives campaign timing. Pipeline C always targets the next upcoming event.
              Keep it up to date to ensure campaigns are timed correctly.
            </p>

            <Section title="Event types">
              <Field name="exam" desc="Exam window. Campaign planner focuses on study support, preparation, and exam tips." />
              <Field name="registration" desc="Enrollment period. Campaign planner focuses on deadlines, steps, and urgency." />
              <Field name="orientation" desc="New student intake. Campaign focuses on welcome, community, and first steps." />
              <Field name="graduation" desc="Graduation event. Celebratory tone. Creative override allowed." />
              <Field name="holiday" desc="Public holiday or break. Lighter tone. Creative override allowed." />
              <Field name="other" desc="Catch-all for custom events. Creative override allowed." />
            </Section>

            <Section title="Fields">
              <Field name="Event name" desc="Name used verbatim in campaign briefs and copy." />
              <Field name="Event type" desc="Controls campaign tone, hashtags, and whether creative override is offered." />
              <Field name="Start date" desc="Campaign lead window starts from this date and counts back." />
              <Field name="End date (optional)" desc="For multi-day events (exam weeks, orientation). Campaign planner uses the full window." />
              <Field name="Allow creative deviation" desc="Visible for graduation, holiday, and other events. When on, design briefs note that palette deviations are permitted within the accent color family. Locked to off for exams and registration." />
            </Section>

            <Section title="Calendar NL commands">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>samm can create, edit, and delete calendar events from the chat. See samm Commands section for examples.</p>
                <p>samm asks for clarification if a date or name is ambiguous — it does not hallucinate calendar entries.</p>
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 8. Settings Reference */}
        <AccordionItem value="settings" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Settings Reference
          </AccordionTrigger>
          <AccordionContent className="space-y-5 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              All configuration lives in Operations → Settings. Changes take effect on the next pipeline run.
            </p>

            <Section title="Org details">
              <Field name="Organisation name" desc="Short workspace name shown in the sidebar." />
              <Field name="Full name" desc="Full legal or trading name — used in campaign briefs and copy." />
              <Field name="Target audience" desc="One-line audience description injected into every LLM prompt." />
              <Field name="Timezone" desc="Used for scheduling and display. Set to your local timezone." />
            </Section>

            <Section title="Brand Voice">
              <Field name="Tone" desc="One-word or short tone descriptor (e.g. 'warm but authoritative'). Injected into every copy prompt." />
              <Field name="Always say" desc="Phrases, words, or topics that must appear in every post. Comma-separated." />
              <Field name="Never say" desc="Words or topics that are off-limits. Enforced across all pipeline copy." />
              <Field name="CTA preference" desc="Your default call to action (e.g. 'Register now at studyhub.co.zm'). Used verbatim in copy." />
              <Field name="Good post example" desc="Example of an ideal post in your voice. The LLM uses this as a tone reference." />
              <Field name="Bad post example" desc="Example of a post that misses your tone. Used as a negative reference." />
              <Field name="Approved hashtags" desc="Up to 6 hashtags. Copy uses only these — no hallucinated alternatives." />
              <Field name="Post format preference" desc="Controls copy length and structure (short/medium/long, prose/bullets)." />
            </Section>

            <Section title="Visual Brand">
              <Field name="Primary color" desc="Hex code for main brand color. Injected verbatim into design briefs." />
              <Field name="Secondary color" desc="Hex code for supporting color." />
              <Field name="Accent color" desc="Hex code for highlights, buttons, and emphasis elements." />
              <Field name="Background color" desc="Hex code for content backgrounds." />
              <Field name="Heading font" desc="Exact font name as it appears in Canva or your design tool." />
              <Field name="Body font" desc="Exact font name for body text." />
              <Field name="Logo usage rules" desc="Freeform text: min size, clear space, approved backgrounds, restricted placements." />
              <Field name="Visual style" desc="Describe your design aesthetic (e.g. 'flat illustration, minimal, high whitespace')." />
              <Field name="Photography style" desc="Describe image direction (e.g. 'real students, natural light, no stock photography')." />
              <Field name="Layout preference" desc="Any layout rules (e.g. 'mobile-first, key info above the fold, never centre-align body text')." />
              <Field name="Markdown design spec" desc="Freeform Markdown injected verbatim into every design brief. Use for rules that don't fit the structured fields above." />
            </Section>

            <Section title="Social handles">
              <Field name="YouTube handle" desc="Your channel handle (e.g. @StudyHubZM). Included in design briefs for Canva AI." />
              <Field name="Facebook page" desc="Page name or URL slug." />
              <Field name="WhatsApp number" desc="Business WhatsApp number in international format." />
              <Field name="Instagram handle" desc="Optional — included in design briefs." />
              <Field name="TikTok handle" desc="Optional." />
              <Field name="Primary CTA URL" desc="The main link you want on every post (e.g. your registration page). Used in design briefs and copy." />
            </Section>

            <Section title="Integrations">
              <div className="text-sm text-muted-foreground">
                Toggle each platform on or off. Connected platforms receive content from publishing pipelines.
                Coming soon: LinkedIn, TikTok, Slack, Teams, Telegram.
              </div>
            </Section>

            <Section title="Pipeline Automation">
              <div className="text-sm text-muted-foreground">
                Each pipeline has a schedule (e.g. Pipeline A runs daily). Toggle automation on or off.
                Use "Run now" to trigger a pipeline immediately outside the schedule.
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 9. Pipeline Reference */}
        <AccordionItem value="pipelines" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Pipeline Reference
          </AccordionTrigger>
          <AccordionContent className="space-y-5 px-4 pb-4 pt-1">
            <Section title="Pipeline A — Engagement">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p><strong>What it does:</strong> processes incoming comments from connected platforms. Classifies each comment (routine, boost, spam, complaint), drafts replies, and escalates complaints to Inbox.</p>
                <p><strong>Trigger:</strong> scheduled (daily) or <Cmd>run pipeline a</Cmd></p>
                <p><strong>Outputs:</strong> replies in Content Registry → Comments tab; complaints in Inbox; boost suggestions in Inbox (FYI).</p>
                <p><strong>No human gate</strong> — runs fully automatically.</p>
              </div>
            </Section>

            <Section title="Pipeline B — Weekly Publishing">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p><strong>What it does:</strong> selects the best scheduled content for the week, packages it for review, waits for approval, then publishes.</p>
                <p><strong>Trigger:</strong> scheduled (weekly) or <Cmd>run pipeline b</Cmd></p>
                <p><strong>Outputs:</strong> content drafts in Content Registry; approval gate; published posts on approval.</p>
                <p><strong>Human gate:</strong> pauses after drafts are created. Resume after review.</p>
              </div>
            </Section>

            <Section title="Pipeline C — Campaign">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p><strong>What it does:</strong> full campaign production — research, brief, CEO approval, copy, design brief, marketer review, scheduling.</p>
                <p><strong>Trigger:</strong> <Cmd>run the campaign pipeline</Cmd> or combined with a calendar event command.</p>
                <p><strong>Outputs:</strong> campaign brief in Inbox; 6 copy drafts + design brief in Content Registry; campaign report in Inbox.</p>
                <p><strong>Human gates:</strong> CEO brief approval + marketer copy approval.</p>
              </div>
            </Section>

            <Section title="Pipeline D — One-Off Post">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p><strong>What it does:</strong> writes ad-hoc post copy for a given topic. No research, no brief, no gates.</p>
                <p><strong>Trigger:</strong> <Cmd>write a post about [topic]</Cmd></p>
                <p><strong>Outputs:</strong> draft per platform in Content Registry. Completes in ~10 seconds.</p>
                <p><strong>Not tracked</strong> in Operations Overview — too lightweight for a pipeline run row.</p>
              </div>
            </Section>

            <Section title="Platform cadence policy">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>Post scheduling is deterministic — not decided by the AI. Rules per platform:</p>
                <div className="mt-2 space-y-1">
                  <div className="flex gap-3 text-sm"><span className="w-24 font-medium">Facebook</span><span>Tue + Thu at 08:00 UTC, max 2 posts per campaign</span></div>
                  <div className="flex gap-3 text-sm"><span className="w-24 font-medium">WhatsApp</span><span>Wed + Sat at 07:30 UTC, max 2 posts per campaign</span></div>
                  <div className="flex gap-3 text-sm"><span className="w-24 font-medium">YouTube</span><span>Thu at 09:00 UTC, max 1 post per campaign</span></div>
                  <div className="flex gap-3 text-sm"><span className="w-24 font-medium">Email</span><span>Tue at 09:00 UTC, max 1 per campaign</span></div>
                </div>
                <p className="mt-2">Day 0 launch blast fires all platforms within their preferred time window. Sustaining posts follow the interval schedule from day 1 onward.</p>
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 10. Troubleshooting */}
        <AccordionItem value="troubleshooting" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Troubleshooting
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4 pt-1">
            <Section title="Pipeline C: campaign brief never appears in Inbox">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>1. Check Operations → Overview for a run with <Badge variant="outline" className="text-xs">running</Badge> or <Badge variant="outline" className="text-xs">failed</Badge> status.</p>
                <p>2. If failed, the most common cause is no upcoming calendar event. Go to Calendar and add one.</p>
                <p>3. If stuck in <Badge variant="outline" className="text-xs">running</Badge> for more than 2 minutes, the edge function may have timed out. Re-trigger from samm.</p>
              </div>
            </Section>

            <Section title="Pipeline D: no drafts in Content Registry">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>1. Pipeline D is not tracked in Operations — check Content Registry → Drafts directly.</p>
                <p>2. If drafts are missing, samm may have routed your message to Pipeline C instead. Check Inbox for a campaign brief.</p>
                <p>3. Use more explicit phrasing: <Cmd>write a post about X</Cmd> (not "run a campaign about X").</p>
              </div>
            </Section>

            <Section title="Canva AI asks for social handles, logo, or QR code">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>The design brief did not contain social handles or a primary CTA URL.</p>
                <p>Fix: go to Operations → Settings → Visual Brand and fill in Social Handles and Primary CTA URL. Save, then re-run Pipeline C. The next design brief will include these fields.</p>
              </div>
            </Section>

            <Section title="Copy does not reflect brand voice">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>1. Confirm Brand Voice is saved in Settings — reload the page and check the values are present.</p>
                <p>2. The tone, always/never say, and example posts are all injected into every copy prompt. If they are blank, the AI has no constraints.</p>
                <p>3. Approved hashtags: if blank, the AI will invent hashtags. Add up to 6 in Brand Voice.</p>
              </div>
            </Section>

            <Section title="Approved post not publishing">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>Live publishing (M13) is not yet active. Approved posts move to Scheduled status but are not sent to live platforms until M13 is deployed.</p>
                <p>For now: use the design brief and copy from Content Registry to publish manually.</p>
              </div>
            </Section>

            <Section title="samm says 'no upcoming calendar event'">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>Pipeline C requires at least one future event in the calendar. Go to Calendar, add an event with a future start date, then re-run the campaign pipeline.</p>
              </div>
            </Section>

            <Section title="Inbox approval has no effect on the pipeline">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>1. The Approve action sends a resume signal to <code className="text-xs">coordinator-chat</code>. If the run row has already expired or moved to <code className="text-xs">cancelled</code>, the resume silently no-ops.</p>
                <p>2. Check Operations → Overview for the run status. If cancelled, re-trigger from samm.</p>
                <p>3. If the run shows <code className="text-xs">waiting_human</code> but the button had no effect, check the browser console for a network error on the approval request.</p>
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
