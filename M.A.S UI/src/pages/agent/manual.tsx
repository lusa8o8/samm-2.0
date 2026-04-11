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
              samm is your AI marketing coordinator. You talk to it in plain language and it handles
              the work — planning campaigns, writing posts, routing approvals, and keeping your content calendar on track.
            </p>

            <Section title="Workspace layout">
              <Field name="samm" desc="Your chat with samm. Every action starts here — just type what you need." />
              <Field name="Inbox" desc="Where samm asks for your input — campaign plans waiting for approval, flagged issues, and post-campaign reports." />
              <Field name="Content" desc="Everything samm has written — drafts to review, posts scheduled to go out, published content, and engagement replies." />
              <Field name="Calendar" desc="Your event calendar. samm plans campaigns around the events you add here." />
              <Field name="Operations" desc="Overview of what samm has been doing, your settings, and this manual." />
            </Section>

            <Section title="First-time setup checklist">
              <Step n={1}>Operations → Settings → enter your organisation name and full trading name.</Step>
              <Step n={2}>Settings → Brand Voice — describe your tone, what to always or never say, your preferred call to action, and paste an example of a great post and a bad one.</Step>
              <Step n={3}>Settings → Visual Brand — add your brand colors, font names, social handles, and the main link you want on every post.</Step>
              <Step n={4}>Settings → Integrations — turn on the platforms you publish to.</Step>
              <Step n={5}>Calendar → add at least one upcoming event (exam, orientation, graduation).</Step>
              <Step n={6}>Chat with samm: <Cmd>run the campaign pipeline</Cmd> to create your first campaign plan.</Step>
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
              Type any of these in samm chat. You don't need to match the wording exactly — samm understands what you mean.
            </p>

            <Section title="Campaign">
              <div className="space-y-2 text-sm">
                <div><Cmd>run the campaign pipeline</Cmd> — starts a full campaign for the next event on your calendar</div>
                <div><Cmd>schedule a campaign for UNZA graduation on 30 April and run</Cmd> — adds the event to the calendar and kicks off a campaign for it straight away</div>
                <div><Cmd>approve</Cmd> / <Cmd>reject</Cmd> — responds to a campaign plan waiting in Inbox</div>
                <div><Cmd>resume the campaign</Cmd> — continues a campaign that is waiting for your approval</div>
              </div>
            </Section>

            <Section title="Quick posts">
              <div className="space-y-2 text-sm">
                <div><Cmd>write a post about the upcoming orientation week</Cmd> — writes drafts for all four platforms (Facebook, WhatsApp, YouTube, Email) and puts them in your Content tab</div>
                <div><Cmd>draft a WhatsApp message about exam timetable release</Cmd> — writes a WhatsApp draft only</div>
                <div><Cmd>create a Facebook post about our new study group feature</Cmd> — writes a Facebook draft only</div>
              </div>
            </Section>

            <Section title="Engagement">
              <div className="space-y-2 text-sm">
                <div><Cmd>run the engagement pipeline</Cmd> — reads comments from your platforms, writes replies, and flags anything that needs your attention</div>
              </div>
            </Section>

            <Section title="Weekly publishing">
              <div className="space-y-2 text-sm">
                <div><Cmd>run the publishing pipeline</Cmd> — picks this week's best scheduled posts, sends them to you for review, and publishes after you approve</div>
              </div>
            </Section>

            <Section title="Calendar">
              <div className="space-y-2 text-sm">
                <div><Cmd>add an exam event on 15 May called UNZA Semester 1 Exams</Cmd> — adds a new calendar event</div>
                <div><Cmd>change UNZA orientation to 10 June</Cmd> — updates an existing event date</div>
                <div><Cmd>delete the May exam event</Cmd> — removes a calendar event (samm will ask you to confirm first)</div>
              </div>
            </Section>

            <Section title="Status checks">
              <div className="space-y-2 text-sm">
                <div><Cmd>what is the status of the engagement pipeline</Cmd> — tells you how the last run went</div>
                <div><Cmd>is the campaign pipeline running</Cmd> — works for any pipeline</div>
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 3. Campaign Workflow */}
        <AccordionItem value="campaign-workflow" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Campaign Workflow
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              The Campaign Pipeline is the full end-to-end process for producing a marketing campaign.
              It runs through several steps automatically and stops twice to ask for your approval.
            </p>

            <Section title="Step by step">
              <Step n={1}><strong>Start it:</strong> type <Cmd>run the campaign pipeline</Cmd> in samm chat, or combine it with a calendar event. samm targets the next event on your calendar.</Step>
              <Step n={2}><strong>Planning:</strong> samm researches similar campaigns and plans your post schedule. The campaign runs for up to 14 days before the event — never longer than the lead time available.</Step>
              <Step n={3}><strong>Campaign plan arrives in Inbox:</strong> samm sends you a structured plan — event, key message, call to action, post schedule, and hashtags — and waits for you to review it.</Step>
              <Step n={4}><strong>You approve or reject:</strong> click Approve on the Inbox card to continue, or Reject to cancel the whole campaign.</Step>
              <Step n={5}><strong>Writing:</strong> samm agrees on the core message first — a headline, call to action, and key fact that stays the same across every platform. Then it writes all the posts at the same time, adapting only the length and format per platform.</Step>
              <Step n={6}><strong>Design brief arrives in Content:</strong> alongside the copy drafts, samm creates a Canva-ready design brief — brand colors, fonts, platform dimensions, and your social handles — so your designer has everything they need.</Step>
              <Step n={7}><strong>You review the posts:</strong> go to Content → Drafts to review. Approve posts one by one or tap "Approve all" for the whole campaign. Rejecting a post sends a revision request to your Inbox.</Step>
              <Step n={8}><strong>Readiness check + report:</strong> once all posts are approved, samm runs a quick check and drops a campaign summary in your Inbox.</Step>
              <Step n={9}><strong>Scheduling:</strong> approved posts are queued on each platform's best posting days. All platforms go out together on the first day, then follow their own schedule after that.</Step>
            </Section>

            <Section title="Good to know">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>— The headline, call to action, and key fact stay exactly the same across all platforms — samm only changes the length and format.</p>
                <p>— Competitor research is based on samm's training, not live web searches. This is labelled clearly in the campaign plan so you know.</p>
                <p>— Rejecting a post pauses the campaign and sends a revision request to Inbox. Edit the post in Content, then approve it to continue.</p>
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Quick Posts */}
        <AccordionItem value="pipeline-d" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Quick Posts
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Use Quick Posts when you need something written right now — no planning, no approval steps, no campaign.
              Just tell samm the topic and drafts appear in your Content tab within seconds.
            </p>

            <Section title="How it works">
              <Step n={1}>Type <Cmd>write a post about [topic]</Cmd> in samm chat.</Step>
              <Step n={2}>samm agrees on the core message first — headline, call to action, and key fact.</Step>
              <Step n={3}>Posts for each platform are written at the same time.</Step>
              <Step n={4}>Drafts land in Content → Drafts within about 10 seconds.</Step>
              <Step n={5}>Review, edit if needed, then approve. Approved posts move to Scheduled.</Step>
            </Section>

            <Section title="What to know">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>— Quick posts don't appear in Operations → Overview — they're too fast to need tracking there.</p>
                <p>— samm writes from the topic and your brand voice settings only. There's no research phase.</p>
                <p>— To write for one platform only: <Cmd>draft a WhatsApp message about X</Cmd> or name the platform explicitly.</p>
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 5. Content */}
        <AccordionItem value="content-registry" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Content
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              The Content tab is where all posts live. Everything samm writes ends up here — drafts,
              approved posts, scheduled posts, published content, and engagement replies.
            </p>

            <Section title="Tabs">
              <Field name="Drafts" desc="Posts waiting for your review. Campaign posts are grouped under their campaign name." />
              <Field name="Scheduled" desc="Posts you've approved, waiting to go out at their scheduled date and time." />
              <Field name="Published" desc="Posts that have been sent to a live platform." />
              <Field name="Comments" desc="Replies and engagement items written by the Engagement Pipeline." />
            </Section>

            <Section title="What each status means">
              <Field name="Draft" desc="Written by samm, not reviewed yet. All new posts land here." />
              <Field name="Rejected" desc="You rejected this post. It stays in the Drafts tab with an orange badge — edit it and approve again." />
              <Field name="Approved / Scheduled" desc="You approved it. Moves to the Scheduled tab and will go out at the set time." />
              <Field name="Published" desc="Successfully sent to the platform." />
              <Field name="Failed" desc="Something went wrong when publishing. Check Operations for more detail." />
            </Section>

            <Section title="What you can do">
              <Field name="Approve" desc="Marks the post as approved. If it's part of a campaign, this moves the campaign forward." />
              <Field name="Reject" desc="Pauses the campaign and opens a reason box. A revision request will appear in Inbox." />
              <Field name="Approve all" desc="Approves every post in a campaign at once. Only affects that campaign's posts." />
              <Field name="Edit" desc="Opens an edit box. Saving puts the post back in your Drafts — approve it when you're happy." />
              <Field name="Share" desc="On design brief cards — send it to your designer via WhatsApp, email, Telegram, or copy to clipboard." />
              <Field name="Attach image" desc="Upload an image to a draft before approving. A thumbnail will appear on the card." />
            </Section>

            <Section title="Design brief cards">
              <div className="text-sm text-muted-foreground">
                When a campaign runs, samm creates a design brief alongside the copy drafts — brand colors, fonts,
                platform dimensions, social handles, and any custom design notes you've added in Settings.
                It's grouped with the campaign posts so you can review everything together.
                Use the Share button to send it to your designer. The Approve button will connect to Canva in a future update.
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
              Inbox is where samm asks for your input before it can continue.
              Reviewing and approving posts happens in the Content tab — Inbox is for decisions that move a campaign forward or stop it.
            </p>

            <Section title="What you'll see in Inbox">
              <Field name="Campaign Plan" desc="samm has written a campaign plan and needs your sign-off before it starts writing posts. Approve to continue, Reject to cancel." />
              <Field name="Revision Request" desc="A post was rejected. Tap through to the Content tab to edit and resubmit it." />
              <Field name="Escalation" desc="samm spotted a comment that needs your attention — a complaint or serious issue. Includes the comment and a suggested reply." />
              <Field name="Boost Suggestion" desc="samm noticed a comment thread doing well and thinks it's worth boosting. Mark read or act on it." />
              <Field name="Campaign Report" desc="A summary of a completed campaign. No action needed — just for your records." />
              <Field name="Performance Tip" desc="An observation about engagement or content performance. Mark read when done." />
            </Section>

            <Section title="How to respond">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>— <strong>Approve:</strong> tells samm to continue. Appears on Campaign Plan cards.</p>
                <p>— <strong>Reject:</strong> stops or pauses the campaign. Adding a reason helps samm improve.</p>
                <p>— <strong>Mark read:</strong> archives the item. Used for reports and tips that need no action.</p>
                <p>— Unread count appears in the sidebar next to Inbox.</p>
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 7. Calendar */}
        <AccordionItem value="calendar" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Calendar
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4 pt-1">
            <p className="text-sm text-muted-foreground">
              samm plans campaigns around the events on your calendar.
              Keep it up to date and campaigns will always be timed correctly.
            </p>

            <Section title="Event types">
              <Field name="Exam" desc="An exam window. samm focuses on study support, preparation tips, and reassurance." />
              <Field name="Registration" desc="An enrollment period. samm focuses on deadlines, next steps, and urgency." />
              <Field name="Orientation" desc="New student intake. samm focuses on welcome messages, community, and first steps." />
              <Field name="Graduation" desc="A graduation event. Celebratory tone. samm can use a looser brand style for these." />
              <Field name="Holiday" desc="A public holiday or break. Lighter tone. samm can be more playful with style." />
              <Field name="Other" desc="Anything else. samm can use a looser brand style if you allow it." />
            </Section>

            <Section title="Event fields">
              <Field name="Event name" desc="Appears exactly as written in campaign plans and posts." />
              <Field name="Event type" desc="Tells samm the right tone and style to use for this event." />
              <Field name="Start date" desc="samm counts back from this date to plan how long the campaign should run." />
              <Field name="End date (optional)" desc="For multi-day events like exam weeks or orientation. samm uses the full window for scheduling." />
              <Field name="Allow creative deviation" desc="When turned on, samm can be more playful with colors and visual style. Only available for graduation, holiday, and other event types — not exams or registration." />
            </Section>

            <Section title="Managing events by chat">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>You can add, edit, and delete calendar events by talking to samm. See the samm Commands section for examples.</p>
                <p>If a date or name is unclear, samm will ask you — it won't guess.</p>
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
              All your configuration lives in Operations → Settings. Changes take effect the next time samm writes something.
            </p>

            <Section title="Organisation details">
              <Field name="Organisation name" desc="Your short workspace name — shown in the sidebar." />
              <Field name="Full name" desc="Your full trading or legal name — used in campaign plans and posts." />
              <Field name="Target audience" desc="A short description of who you're talking to. samm uses this when writing every piece of content." />
              <Field name="Timezone" desc="Your local timezone — used for scheduling and displaying times correctly." />
            </Section>

            <Section title="Brand Voice">
              <Field name="Tone" desc="How you want samm to sound — e.g. 'warm but authoritative'. Used in every piece of content samm writes." />
              <Field name="Always say" desc="Words, phrases, or topics that must appear in every post." />
              <Field name="Never say" desc="Words or topics that are off-limits. samm will never use these." />
              <Field name="Call to action" desc="The exact action you want people to take — e.g. 'Register now at studyhub.co.zm'. Included word-for-word in every post." />
              <Field name="Good post example" desc="A real example of a post you love. samm matches this style." />
              <Field name="Bad post example" desc="A real example of a post you hate. samm avoids this style." />
              <Field name="Approved hashtags" desc="Up to 6 hashtags. samm only uses these — it won't invent new ones." />
              <Field name="Post format" desc="How long and structured your posts should be — short, medium, or long; prose or bullets." />
            </Section>

            <Section title="Visual Brand">
              <Field name="Primary color" desc="Your main brand color as a hex code (e.g. #0055FF). Copied exactly into every design brief." />
              <Field name="Secondary color" desc="A supporting brand color as a hex code." />
              <Field name="Accent color" desc="A highlight color for buttons and emphasis — as a hex code." />
              <Field name="Background color" desc="Your content background color as a hex code." />
              <Field name="Heading font" desc="Font name exactly as it appears in Canva or your design tool." />
              <Field name="Body font" desc="Font name for body text, exactly as it appears in Canva." />
              <Field name="Logo usage rules" desc="Write any rules about how your logo should be used — minimum size, what backgrounds it can appear on, what to avoid." />
              <Field name="Visual style" desc="Describe the look and feel of your designs — e.g. 'clean and minimal, lots of white space, flat icons'." />
              <Field name="Photography style" desc="Describe the kind of photos to use — e.g. 'real students, natural light, no stock photos'." />
              <Field name="Layout preference" desc="Any layout rules — e.g. 'important info at the top, design for phone screens first'." />
              <Field name="Design notes" desc="Anything else your designer needs to know. Written in plain text and included word-for-word in every design brief." />
            </Section>

            <Section title="Social handles">
              <Field name="YouTube" desc="Your channel handle, e.g. @StudyHubZM. Added to every design brief so Canva AI can place it correctly." />
              <Field name="Facebook" desc="Your Facebook page name." />
              <Field name="WhatsApp" desc="Your business WhatsApp number including country code, e.g. +260 97..." />
              <Field name="Instagram" desc="Optional. Added to design briefs when provided." />
              <Field name="TikTok" desc="Optional. Added to design briefs when provided." />
              <Field name="Primary link" desc="The main link you want people to visit — e.g. your registration or sign-up page. Included in every design brief and post." />
            </Section>

            <Section title="Integrations">
              <div className="text-sm text-muted-foreground">
                Turn each platform on or off. Only connected platforms receive posts from samm.
                Coming soon: LinkedIn, TikTok, Slack, Teams, Telegram.
              </div>
            </Section>

            <Section title="Automation schedule">
              <div className="text-sm text-muted-foreground">
                Each workflow runs on a schedule — for example, the Engagement Pipeline runs daily.
                You can turn the schedule on or off, or use "Run now" to start any workflow immediately.
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

        {/* 9. Workflows Reference */}
        <AccordionItem value="pipelines" className="rounded-lg border border-border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            Workflows Reference
          </AccordionTrigger>
          <AccordionContent className="space-y-5 px-4 pb-4 pt-1">
            <Section title="Engagement Pipeline">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p><strong>What it does:</strong> reads comments from your connected platforms, sorts them (routine question, spam, complaint, or worth boosting), writes a reply for each, and flags complaints in Inbox for you to review.</p>
                <p><strong>How to start:</strong> runs automatically every day, or type <Cmd>run the engagement pipeline</Cmd> in samm chat.</p>
                <p><strong>What you get:</strong> replies in Content → Comments; complaints in Inbox; suggestions to boost strong posts in Inbox.</p>
                <p><strong>No approval needed</strong> — runs fully automatically.</p>
              </div>
            </Section>

            <Section title="Weekly Publishing">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p><strong>What it does:</strong> picks the best posts scheduled for this week, sends them to you for review, then publishes after you approve.</p>
                <p><strong>How to start:</strong> runs automatically every week, or type <Cmd>run the publishing pipeline</Cmd> in samm chat.</p>
                <p><strong>What you get:</strong> drafts in Content to review; published posts after approval.</p>
                <p><strong>Approval step:</strong> samm pauses after drafts are ready. Approve them in the Content tab to continue.</p>
              </div>
            </Section>

            <Section title="Campaign Pipeline">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p><strong>What it does:</strong> runs the full campaign process — planning, sign-off, writing, design, review, and scheduling.</p>
                <p><strong>How to start:</strong> type <Cmd>run the campaign pipeline</Cmd>, or combine it with a calendar event command.</p>
                <p><strong>What you get:</strong> a campaign plan in Inbox; posts for each platform plus a design brief in Content; a campaign summary in Inbox when done.</p>
                <p><strong>Approval steps:</strong> you approve the campaign plan first, then the individual posts.</p>
              </div>
            </Section>

            <Section title="Quick Posts">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p><strong>What it does:</strong> writes posts on demand for any topic. No planning, no approval needed — just drafts.</p>
                <p><strong>How to start:</strong> type <Cmd>write a post about [topic]</Cmd> in samm chat.</p>
                <p><strong>What you get:</strong> a draft per platform in Content, ready within about 10 seconds.</p>
                <p><strong>Not shown in Operations → Overview</strong> — quick posts are too fast to need tracking there.</p>
              </div>
            </Section>

            <Section title="Posting schedule">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>samm uses fixed rules to decide when to post — it doesn't guess. The rules per platform are:</p>
                <div className="mt-2 space-y-1">
                  <div className="flex gap-3 text-sm"><span className="w-24 font-medium">Facebook</span><span>Tuesdays and Thursdays at 08:00, up to 2 posts per campaign</span></div>
                  <div className="flex gap-3 text-sm"><span className="w-24 font-medium">WhatsApp</span><span>Wednesdays and Saturdays at 07:30, up to 2 posts per campaign</span></div>
                  <div className="flex gap-3 text-sm"><span className="w-24 font-medium">YouTube</span><span>Thursdays at 09:00, 1 post per campaign</span></div>
                  <div className="flex gap-3 text-sm"><span className="w-24 font-medium">Email</span><span>Tuesdays at 09:00, 1 per campaign</span></div>
                </div>
                <p className="mt-2">On the first day of a campaign, all platforms go out at the same time. After that, each platform follows its own days.</p>
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
            <Section title="Campaign plan never arrives in Inbox">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>1. Check Operations → Overview — look for a row showing In Progress or Failed.</p>
                <p>2. If it shows Failed, the most common reason is no upcoming event on your calendar. Go to Calendar, add one, and try again.</p>
                <p>3. If it's been In Progress for more than 2 minutes, samm may have timed out. Try starting it again from samm chat.</p>
              </div>
            </Section>

            <Section title="Quick post — no drafts appeared in Content">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>1. Quick posts don't appear in Operations → Overview — check Content → Drafts directly.</p>
                <p>2. If the drafts aren't there, samm may have started a full campaign instead. Check Inbox for a campaign plan.</p>
                <p>3. Use clearer phrasing: <Cmd>write a post about X</Cmd> rather than "run a campaign about X".</p>
              </div>
            </Section>

            <Section title="Canva AI asks for social handles, logo, or a link">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>The design brief is missing your social handles or primary link.</p>
                <p>Go to Operations → Settings → Visual Brand, fill in the Social Handles fields and Primary Link, and save. The next campaign's design brief will include them.</p>
              </div>
            </Section>

            <Section title="Posts don't sound like my brand">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>1. Check that your Brand Voice settings are saved — reload Settings and confirm the values are there.</p>
                <p>2. Tone, always/never say, and your example posts all guide samm's writing. If they're blank, samm has no constraints to work with.</p>
                <p>3. If hashtags are blank, samm will invent them. Add up to 6 approved hashtags in Brand Voice.</p>
              </div>
            </Section>

            <Section title="Approved post is not publishing">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>Live publishing is coming soon — it's not active yet. Approved posts move to Scheduled but are not sent to platforms until live publishing is available.</p>
                <p>For now: use the design brief and copy from Content to publish manually.</p>
              </div>
            </Section>

            <Section title="samm says there are no upcoming calendar events">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>samm needs at least one future event on the calendar to run a campaign. Go to Calendar, add an event with a future start date, then try again.</p>
              </div>
            </Section>

            <Section title="Approving a campaign plan in Inbox had no effect">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>1. The campaign may have already been cancelled or expired. Check Operations → Overview for the current status.</p>
                <p>2. If it shows Cancelled, start a new campaign from samm chat.</p>
                <p>3. If it showed Waiting for Approval but the button had no effect, try refreshing the page and approving again. If it still doesn't work, check your internet connection.</p>
              </div>
            </Section>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
