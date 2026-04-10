# Next Agent Handoff

## Repo
- Root: `C:\Users\Lusa\tsh-marketing-system`
- Main app: `C:\Users\Lusa\tsh-marketing-system\M.A.S UI`
- Supabase project ref: `jxmdwltfkxstiwnwwiuf`
- GitHub repo: `https://github.com/lusa8o8/tsh-marketing-system.git`

## Working Discipline
Carry this forward exactly.

1. Do discovery first.
2. State diagnosis explicitly.
3. State a concrete plan before editing.
4. Keep changes narrow and reversible.
5. Commit every stable slice.
6. Push stable checkpoints to `main` when requested.
7. Avoid speculative cleanup.

This discipline has kept the product clean and lean. Do not regress into broad exploratory edits without a locked plan.

## If The Session Breaks Or Rate Limits Hit
Before touching code again, reread the relevant docs for full context:
- `NEXT_AGENT_HANDOFF.md`
- `SAMM_IMPLEMENTATION_ROADMAP.md`
- `SAMM_FULL_SYSTEM_ARCHITECTURE.md`
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`

Then continue with the same discipline:
- discovery
- diagnosis
- plan
- narrow execution
- verification
- commit

## Product State
Brand and product direction are now centered on `samm`.

Current product stance:
- `samm` is the product anchor.
- Hybrid control-plane model is the intended architecture.
- Full `samm` workspace redesign is deferred until after user feedback.
- Near-term UI changes, if any, should stay narrow and focus on Inbox and Content Registry.
- Optional modules like `Calendar` and `Ambassadors` are planned for onboarding/capability gating later, not implemented yet.

## Key Completed Slices
### Branding and UI
- login rebrand to `samm`
- human-centered login imagery
- dashboard shell rebrand
- `samm` promoted to top-level nav
- `Operations` replaces `Agent Manager`

### Backend / Infra
- auth wired through Supabase
- cron slice completed manually in Supabase dashboard
- `coordinator-chat` edge function implemented, committed, pushed, deployed, and browser-verified
- scheduler extraction completed
- normalized pipeline run status contract introduced in shared runtime code
- agent registry slice completed
- integration registry slice completed, committed, pushed, deployed, and parity-verified
- Pipeline A rebuilt on the shared engine, committed, pushed, deployed, and parity-verified
- Pipeline B and Pipeline C invocation baseline restored and pushed in the Milestone 5A checkpoint
- Milestone 6: Pipeline B resumable human gate complete and browser-verified
- Milestone 7: Pipeline C CEO brief gate complete and browser-verified
- Milestone 7A: two-phase copy generation for Pipeline C complete and browser-verified
- Milestone 7B: copy assets land in Content Registry as drafts, not in Inbox — complete and browser-verified
- Milestone 7C: batch approval in Content Registry — complete and browser-verified
- Milestone 7D: marketer approval gate with inline edit and rejection loop — complete and browser-verified

### Architecture Docs
Committed and pushed:
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`
- `SAMM_IMPLEMENTATION_ROADMAP.md`
- `SAMM_FULL_SYSTEM_ARCHITECTURE.md`

## Latest Important Commits
- `49decf2 feat: marketer approval gate with inline edit and rejection loop (Milestone 7D)`
- `40592f0 feat: batch approval in Content Registry (Milestone 7C)`
- `405500c fix: boost suggestion priority fyi, document Pipeline A stubs and Milestone 5B`
- `82fea3f feat: content registry as approval surface for copy assets (Milestone 7B)`
- `803b9b0 feat: two-phase copy generation for Pipeline C (Milestone 7A)`

All committed to `main`. Push to remote with: `/mingw64/bin/git -C "C:/Users/Lusa/tsh-marketing-system" push origin main`

## Current Status
Stable through Milestone 7D.

### Pipeline C end-to-end verified flow:
1. `/samm` triggers Pipeline C → `running`
2. Research phase (parallel) + campaign planner → campaign brief created
3. Run pauses at `waiting_human` — campaign brief lands in Inbox
4. CEO approves → approval completes in under 5 seconds (fire-and-forget)
5. Background resume: canonical copy (phase 1) → 6 parallel platform assets (phase 2) → design brief suggestion → pauses
6. 6 copy assets land in Content Registry as `draft`, grouped by campaign (not in Inbox)
7. Design brief suggestion lands in Inbox as FYI
8. **Marketer gate**: all drafts must be approved in Content Registry before monitor + report phase begins
9. Approve all (batch or individual) → pipeline resumes → monitor + report → campaign report in Inbox → `success`
10. Reject a draft → revision request in Inbox → marketer edits and resubmits in Content Registry → approve → resume

### Three verified approval paths:
1. Batch approve → resume → success
2. Reject → revision request → edit & resubmit → approve → resume → success
3. Inline edit (no reject) → save → approve → resume → success

### Approval surface boundary (established and stable):
- **Inbox**: workflow decisions only — campaign brief, campaign report, escalations, suggestions, revision requests
- **Content Registry**: content review only — all copy assets land here as `draft`; rejected cards editable with "Edit & resubmit"

### Content Registry draft tab includes:
- `draft` status rows
- `pending_approval` rows
- `rejected` rows (editable with "Edit & resubmit"; orange badge)

## Known Pipeline A Stubs (critical — must not be forgotten)
Pipeline A classification and reply generation are NOT using the LLM. Both `classifyComment` and `draftReply` have `void anthropic` placeholders — Claude is explicitly discarded.

Current state:
- `classifyComment`: keyword matching only; no LLM call; brand voice ignored
- `draftReply`: hardcoded template strings only; no LLM call; brand voice partially used in one template only
- comment source: `getMockComments()` — 7 hardcoded mock comments, no live platform API reads
- spam/complaint ordering bug: `'scam'` keyword check runs in the complaint branch BEFORE the spam check, so spam URLs containing the word `scam` (e.g. `bit.ly/scam123`) are incorrectly classified as complaints

Milestone placement:
- **Milestone 5B** (planned): enable real LLM classification and reply generation — does NOT require live APIs, can be done anytime
- **Milestone 10**: real comment fetching from Facebook, WhatsApp, YouTube APIs

Already fixed this session:
- boost suggestion priority changed from `normal` to `fyi` — shows "Mark read" instead of Approve/Reject, since the reply is already written before the inbox item is created

## Exact Next Slice
### Milestone 8: Onboarding And Capability Templates

Milestones 7 through 7D are all complete. The next slice is Milestone 8.

### Goal
Make multi-client onboarding a first-class system path so a new org can be provisioned without manual table surgery.

### Scope
- org bootstrap template
- default `org_config` values
- default capability flags per plan tier
- default KPI targets
- default pipeline enablement
- default adapter registrations per plan tier

### After Milestone 8
- Milestone 9: usage metering and billing enforcement
- Milestone 5B (can be done any time): enable real LLM classification and reply generation in Pipeline A
- Milestone 10: live API swaps behind adapters (includes real comment fetching for Pipeline A)

### Architecture vision to carry forward
The user has confirmed the system should be "super modular — lego set up and plugin modular." Every new capability should be addable without touching existing pipelines. Inbox is the routing surface for workflow decisions; Content Registry is the review surface for content. Do not blur this boundary.

## Relevant Files
### Frontend
- `M.A.S UI/src/pages/content.tsx` — Content Registry UI, has Drafts tab with Approve/Reject
- `M.A.S UI/src/pages/inbox.tsx` — Inbox UI
- `M.A.S UI/src/lib/api.ts` — all mutations: useActionContent, useActionInboxItem, useBatchApproveContent, useEditContent
- `M.A.S UI/src/lib/supabase.ts` — ORG_ID constant

### Supabase
- `supabase/functions/pipeline-a-engagement/index.ts` — Pipeline A; classifyComment and draftReply are stubbed
- `supabase/functions/pipeline-b-weekly/index.ts`
- `supabase/functions/pipeline-c-campaign/index.ts`
- `supabase/functions/coordinator-chat/index.ts`
- `supabase/functions/coordinator-chat/scheduler.ts`
- `supabase/functions/_shared/pipeline-engine.ts`
- `supabase/functions/_shared/agent-registry.ts`
- `supabase/functions/_shared/integration-registry.ts`
- `supabase/functions/_shared/pipeline-run-status.ts`

### Architecture Source Of Truth
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`
- `SAMM_IMPLEMENTATION_ROADMAP.md`
- `SAMM_FULL_SYSTEM_ARCHITECTURE.md`

## Important Operational Notes
- `ANTHROPIC_API_KEY` already exists in hosted Supabase Edge Function secrets
- supabase CLI is at `C:/Users/Lusa/.scoop/shims/supabase.exe` (not in the bash PATH; use that path directly)
- git is at `/c/Program\ Files/Git/cmd/git.exe` (not in bash PATH)
- Python is at `/c/Python314/python.exe`
- `cat`, `ls`, `head`, `grep`, `find` are not available in bash — use Read, Glob, Grep tools instead
- local environment does not have `deno` installed — no local `deno check` available
- the schema slice for Milestone 6 exists in `supabase/migrations/20260409161000_pipeline_runs_status_states.sql`
- content_registry status lifecycle: `draft` → `scheduled` (on approval) or `rejected`; `published` is written directly by Pipeline B mock publisher
- pipeline_runs status lifecycle: `running` → `waiting_human` → `resumed` → `success` / `failed` / `cancelled`
- the 54-second Pipeline C resume runs in background via `EdgeRuntime.waitUntil` — coordinator-chat returns immediately

## Constraints To Preserve
- Do not do a broad `samm` workspace redesign yet.
- Do not widen scope into optional-module implementation yet.
- Do not add external API work before the engine-backed execution core is stable.
- Keep the product professional and restrained; avoid overdesigned UI changes.
- Inbox = workflow decisions only. Content Registry = content review only. Do not blur this boundary.

## Last Known Good Principle
The work has gone well because every slice followed:
- discovery
- diagnosis
- plan
- narrow execution
- verification
- commit

That is the method to continue with.
