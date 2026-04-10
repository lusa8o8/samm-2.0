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
- Near-term UI changes, if any, should stay narrow and focus on Inbox and Content Registry, especially tab treatment.
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

### Architecture Docs
Committed and pushed:
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`
- `SAMM_IMPLEMENTATION_ROADMAP.md`

## Latest Important Commits
- `c3cd0af fix: fire-and-forget pipeline resume in coordinator-chat`
- `a127214 fix: query waiting_human run directly in scheduler resume path`
- `ae5138c fix: accept scheduler org_id for pipeline b and c`
- `16119f9 docs: add pipeline b and c stability milestones`

These are already pushed to `main`.

## Current Status
Stable through Milestone 7.

Verified end-to-end in browser:
- Pipeline C runs from `/samm` chat
- campaign brief appears in Inbox with `waiting_human` in Operations
- approval completes in under 5 seconds (fire-and-forget fix working)
- Operations transitions `waiting_human` → `resumed` → `success` in real time without page refresh
- draft approvals (6 copy assets) and campaign report land in Inbox after resume

## Exact Next Slice
### Milestone 7A: Two-Phase Copy Generation For Pipeline C

### Goal
Replace the current 6 independent single-shot copy writer calls with a two-phase approach:
- Phase 1: one canonical copy writer call that produces the verbatim source of truth (headline, core body, exact CTA, key fact)
- Phase 2: 6 parallel platform adapter calls that each receive the canonical copy and tailor format/length/tone only

### Why
- current 6 calls independently interpret the campaign brief — can produce divergent emphasis, urgency, and phrasing across platforms
- two Facebook posts may not tell the same story; email CTA may differ from WhatsApp CTA
- human reviewers are approving 6 assets that may not form one coherent campaign message
- two-phase locks the message verbatim at the core and adapts only the wrapper
- parallel phase 2 also cuts resume time significantly vs current sequential loop

### Required workflow
1. Discovery:
   - read current `runCopyWriter` in `pipeline-c-campaign/index.ts`
   - confirm none of the 6 calls read from shared state or each other's output
2. Plan:
   - define the canonical copy writer prompt (JSON output: headline, core_body, exact_cta, key_fact)
   - define how each platform adapter prompt receives and locks the canonical fields
3. Edit:
   - introduce `runCanonicalCopyWriter` as phase 1 in `resumePipelineCRun`
   - rewrite `runCopyWriter` to accept canonical copy and run platform adapters in `Promise.all`
   - update platform adapter prompts to use canonical fields verbatim
4. Verify:
   - all 6 copy assets share the same headline, CTA, and key fact
   - platform formatting still differs correctly
   - draft approvals still land in Inbox
   - Operations run still reaches `success`
5. Commit stable slice

## After Milestone 7A
1. Add the second Pipeline C human gate for marketer approval of campaign assets.
2. Add Pipeline C monitoring-loop and post-campaign resumability.
3. Move to onboarding/capability-template work once the execution core is stable.
4. Add usage metering and billing enforcement.
5. Swap mocked adapters for live provider APIs only after the engine and gate boundaries are stable.

## Relevant Files
### Frontend
- `M.A.S UI/src/pages/agent/chat.tsx`
- `M.A.S UI/src/lib/api.ts`
- `M.A.S UI/src/lib/supabase.ts`
- any Content review UI that approves or rejects drafts

### Supabase
- `supabase/functions/pipeline-b-weekly/index.ts`
- `supabase/functions/pipeline-c-campaign/index.ts`
- `supabase/functions/coordinator-chat/index.ts`
- `supabase/functions/coordinator-chat/scheduler.ts`
- `supabase/functions/_shared/pipeline-engine.ts`
- `supabase/functions/_shared/agent-registry.ts`
- `supabase/functions/_shared/integration-registry.ts`
- `supabase/functions/_shared/pipeline-run-status.ts`
- `supabase/config.toml`

### Architecture Source Of Truth
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`
- `SAMM_IMPLEMENTATION_ROADMAP.md`
- `SAMM_FULL_SYSTEM_ARCHITECTURE.md`

## Important Operational Notes
- `ANTHROPIC_API_KEY` already exists in hosted Supabase Edge Function secrets.
- browser parity for Milestone 4 was verified after running Pipeline A from `/samm`
- engine-backed Pipeline A was deployed and matched the previous hosted parity baseline exactly
- Milestone 5A is already complete and pushed
- Milestone 6 is now verified through the real browser app flow for Pipeline B pause/resume
- Milestone 7 is complete and browser-verified
- the active next slice is Milestone 7A: two-phase copy generation for Pipeline C
- Milestone 7 fixes: `a127214` (direct DB query for waiting_human run) and `c3cd0af` (fire-and-forget resume via EdgeRuntime.waitUntil)
- the 54-second Pipeline C resume is handled by fire-and-forget; the run completes in the background after coordinator-chat returns
- Milestone 6 follow-up fixes included removing unsupported `content_registry` column writes from the UI approval path and exposing `draft_approval` rows in Inbox
- the schema slice for Milestone 6 exists in `supabase/migrations/20260409161000_pipeline_runs_status_states.sql` and was applied with `supabase db push`
- the current local environment did not have `deno` installed, so local `deno check` was not available during parity verification
- supabase CLI is at `C:/Users/Lusa/.scoop/shims/supabase.exe` (not in the bash PATH; use that path directly)
- supabase CLI is at `C:/Users/Lusa/.scoop/shims/supabase.exe` (not in the bash PATH; use that path directly)

## Constraints To Preserve
- Do not do a broad `samm` workspace redesign yet.
- Do not widen scope into optional-module implementation yet.
- Do not add external API work before the engine-backed execution core is stable.
- Keep the product professional and restrained; avoid overdesigned UI changes.

## Last Known Good Principle
The work has gone well because every slice followed:
- discovery
- diagnosis
- plan
- narrow execution
- verification
- commit

That is the method to continue with.
