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

### Architecture Docs
Committed and pushed:
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`
- `SAMM_IMPLEMENTATION_ROADMAP.md`

## Latest Important Commits
- `1b9f173 refactor: rebuild pipeline a on shared engine`
- `8a523d5 docs: update roadmap after milestone 4 parity`
- `e84703a feat: add integration registry parity slice`

These are already pushed to `main`.

## Current Status
The current runtime is stable through the Milestone 5 boundary for Pipeline A only.

Verified:
- `/samm` can run Pipeline A successfully
- inbox and Operations overview reflect the latest Pipeline A output
- integration-registry wiring did not change Pipeline A behavior
- engine-backed Pipeline A returns the same hosted parity result as the pre-engine baseline:
  - `comments_processed: 7`
  - `replies_sent: 5`
  - `escalations: 2`
  - `boosts_suggested: 2`
  - `spam_ignored: 0`
  - `errors: []`

Not yet stabilized:
- Pipeline B invocation from `coordinator-chat`
- Pipeline C invocation from `coordinator-chat`

Current diagnosed blocker:
- `coordinator-chat` invokes downstream pipelines with `org_id`
- Pipeline B and Pipeline C were reading `orgId`
- this produced `undefined` org ids and immediate 500 failures at function entry for Pipeline B, and likely the same class of failure for Pipeline C

## Exact Next Slice
### Goal
Stabilize the current Pipeline B and Pipeline C invocation baselines before continuing into the larger resumable-workflow milestones.

### Required workflow
1. Discovery:
   - confirm the current request payload contract between `coordinator-chat` and downstream pipeline functions
   - confirm Pipeline B and Pipeline C can accept scheduler-triggered payloads without entrypoint failure
2. Diagnosis:
   - separate the narrow invocation-contract bug from the larger Pipeline B resumable-gate and Pipeline C long-window execution milestones
3. Plan:
   - define the smallest stability slice that restores B and C invocation without changing their workflow logic
4. Edit:
   - keep the fix limited to request parsing and any directly related entrypoint handling
5. Verify:
   - `/samm` can trigger Pipeline B without immediate 500 failure
   - `/samm` can trigger Pipeline C without immediate 500 failure
   - direct invocation matches the same result
6. Commit stable slice
7. Push if requested

## Why This Slice Comes First
- Pipeline A is already engine-backed and parity-verified
- Pipeline B and Pipeline C should not move into larger architectural work while their basic run path is broken
- the current issue is a narrow stability defect, so it should be fixed and checkpointed separately from Milestone 6 and Milestone 7

## After This Stability Slice
1. Add resumable human-gate execution for Pipeline B.
2. Add long-window resumable execution for Pipeline C.
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
- the current local environment did not have `deno` installed, so local `deno check` was not available during parity verification
- if a resumed session starts from a user report of Pipeline B or C failing from `/samm`, check for request-shape mismatches before assuming the resumable-workflow milestone is at fault

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
