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
- Milestone 7E: design brief to Content Registry, image upload on copy cards, share button — complete and browser-verified

### Architecture Docs
Committed and pushed:
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`
- `SAMM_IMPLEMENTATION_ROADMAP.md`
- `SAMM_FULL_SYSTEM_ARCHITECTURE.md`

## Latest Important Commits
- `c06ba39 fix: design brief prompt enforces plain text, no markdown formatting`
- `cb6b32d fix: design brief card strip markdown in preview, hide actions when collapsed`
- `19c61bd fix: design brief card full width, markdown rendering, platform constraint migration`
- `eec038d feat: design brief to Content Registry, image upload, share button (Milestone 7E)`
- `2d7db3a fix: map fyi mark-read action to actioned status (not read)`
- `49decf2 feat: marketer approval gate with inline edit and rejection loop (Milestone 7D)`

All pushed to `main`.

## Current Status
Stable through Milestone 7E.

### Pipeline C end-to-end verified flow:
1. `/samm` triggers Pipeline C → `running`
2. Research phase (parallel) + campaign planner → campaign brief created
3. Run pauses at `waiting_human` — campaign brief lands in Inbox
4. CEO approves → approval completes in under 5 seconds (fire-and-forget)
5. Background resume: canonical copy (phase 1) → 6 parallel platform assets (phase 2) → design brief suggestion → pauses
6. 6 copy cards + 1 design brief card land in Content Registry as `draft`, grouped by campaign
7. Design brief: full-width violet card with Edit, Share (WhatsApp/Telegram/Email/clipboard), Approve
8. **Marketer gate**: all copy drafts must be approved before monitor + report phase (design brief approval is independent)
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
### Milestone 8: Multi-Tenant Infrastructure

Milestones 7 through 7E are all complete. The next slice is Milestone 8.

### What is already built
- Supabase auth (login/signup screen exists, branded as samm)
- `org_config` table with `brand_voice`, `kpi_targets`, `org_name`, `timezone`
- All pipeline DB queries already scope by `org_id` — data isolation is complete
- `coordinator-chat` reads `org_id` from `user.app_metadata?.org_id`

### What needs building
1. **Frontend org resolution** — replace hardcoded `ORG_ID` constant in `supabase.ts` with a function that reads `org_id` from the auth session. Propagate to all `api.ts` query hooks.
2. **Auto-provisioning** — edge function or DB trigger that creates a default `org_config` row when a new user signs up. Default includes: brand voice placeholder, default KPI targets, all pipelines enabled.

### Deferred from this slice
- Onboarding UI flow (4-5 screen wizard) — Milestone 8B
- Capability flags and sidebar filtering — after broad integration coverage
- Progressive narrowing (ambassador vs affiliate vs UGC) — after broad integration coverage
- Usage metering and billing enforcement

### Full product roadmap
See `SAMM_IMPLEMENTATION_ROADMAP.md` for full milestone list including:
- M8B: Onboarding flow UI
- M9: Copy quality check (Pipeline C phase 3 critic)
- M10: Editable calendar + NL calendar commands
- M11: Live platform publishing
- M12: Multi-channel access (Slack, Teams, WhatsApp, Telegram, email)
- M13: Voice interface
- M14: Dashless operation (Google Sheets, Docs, Excel)
- M15: Visual plugin builder (n8n-style)
- M16: Sales and CRM integration

### Architecture vision to carry forward
Go broad by default — all connectors, agents, and pipelines available to every org. Narrowing comes later via onboarding questions that set capability flags. Each channel (Slack, Teams, WhatsApp) is a plugin in the integration registry — adding a new channel does not touch core scheduler or pipelines. Inbox = workflow decisions. Content Registry = all content assets.

## Relevant Files
### Frontend
- `M.A.S UI/src/pages/content.tsx` — Content Registry UI, has Drafts tab with Approve/Reject
- `M.A.S UI/src/pages/inbox.tsx` — Inbox UI
- `M.A.S UI/src/lib/api.ts` — all mutations: useActionContent, useActionInboxItem, useBatchApproveContent, useEditContent, useUploadContentImage
- `M.A.S UI/src/lib/supabase.ts` — ORG_ID hardcoded constant (Milestone 8 changes this to session-derived)

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
