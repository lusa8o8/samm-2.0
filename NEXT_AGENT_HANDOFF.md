# Next Agent Handoff

## Repo
- Root: `C:\Users\Lusa\samm 2.0`
- Main app: `C:\Users\Lusa\samm 2.0\M.A.S UI`
- Supabase project ref: `jxmdwltfkxstiwnwwiuf`
- GitHub repo: `https://github.com/lusa8o8/samm-2.0.git`

## Working Discipline
Carry this forward exactly.

1. Do discovery first. Read before editing.
2. State diagnosis explicitly before proposing a fix.
3. Lock a plan in the docs before writing any code.
4. Keep changes narrow and reversible.
5. Commit every stable slice with a descriptive message.
6. Push stable checkpoints to `main` when requested.
7. Avoid speculative cleanup or scope creep.

The product has stayed clean because every session followed:
`discovery -> diagnosis -> plan -> narrow execution -> verification -> commit`.

## If The Session Breaks Or Rate Limits Hit
Before touching code, reread:
- `NEXT_AGENT_HANDOFF.md`
- `SAMM_IMPLEMENTATION_ROADMAP.md`
- `SAMM_FULL_SYSTEM_ARCHITECTURE.md`
- `SAMM_RUNTIME_SPLIT_CONTRACT.md`
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`
- `SAMM_MEMORY_CONTRACT.md`
- `STRUCTURED_CONFIG_CONTRACT.md`
- `SAMM_UI_ADOPTION_PLAN.md`
- `CONTACT_IDENTITY_AND_MERGE_RULES.md`
- `VALIDATION_FOUNDATIONS.md`

## Current Build Status
Stable through `M14A` on `main`, with `M14A.1` validated locally and on Railway for both initial worker paths, and `M14B` now materially advanced through the first deterministic calendar-control slices.

Latest pushed `M14A` commits:
- `a68b790` `docs: lock SAMM 2.0 milestone and contract docs`
- `a326633` `feat(M14A): add SAMM memory foundation`
- `e3829c9` `feat(M14A): wire SAMM memory into run lifecycle`

The source of truth is now:
- `SAMM_IMPLEMENTATION_ROADMAP.md` for milestone order and acceptance boundaries
- `git log` for what has actually landed
- this file for current institutional memory and next-slice guidance

## Current Active Slice
`M14A` is live-validated, `M14A.1` is validated for both initial worker paths, and `M14B` is the active milestone.

Resolved blocker:
- the database migration is live
- `coordinator-ingress` is deployed and authenticates correctly
- `channel_routes` and `conversation_threads` now populate in production validation
- hosted bundle timeouts still block heavy `coordinator-chat`, but explicit scheduler paths no longer depend on that deploy surface

The runtime blocker is now resolved for the scoped heavy paths:
- keep Supabase as source of truth
- keep ingress thin and deployable
- keep Railway worker as the active execution plane for the moved heavy paths
- follow `SAMM_RUNTIME_SPLIT_CONTRACT.md` as the execution contract for future runtime moves

The active planning focus is now explicitly:
- `M14B` as universal structured config with ICP retained as first-class targeting truth
- incremental adoption of the packaged `samm 2.0 UI` shared-workspace shell
- use `M.A.S UI` as grounding for missing operational/admin surfaces rather than replacing the whole frontend at once

`M14B` has now moved well past the schema foundation and into deterministic calendar-control behavior:
- the universal config schema foundation is live in Supabase
- `provision-org` now seeds default rows for:
  - `campaign_defaults`
  - `approval_policy`
  - `outreach_policy`
- current `Operations -> Settings` now includes the first universal-config slice:
  - read-only snapshot for audience / offers / seasonality / outreach
  - editable `campaign_defaults`
  - editable `approval_policy`
- read hooks now exist for the new config tables in `M.A.S UI/src/lib/api.ts`
- current `Operations -> Settings` now also supports narrow write surfaces for:
  - `icp_categories`
  - `offer_catalog`
  - `seasonality_profile`
  - `discount_policies`
  - `outreach_policy`
- these write forms intentionally use compact fields and JSON-backed inputs where needed to keep `M14B` narrow
- ICP remains explicitly locked in the config model
- both planners now read structured config through:
  - `supabase/functions/_shared/structured-config.ts`
- `Pipeline C` is now materially more grounded by config than before this slice
- `Pipeline B` is improved but still under-grounded relative to the configured offer / ICP / seasonality / CTA
- current settings summary / persistence cleanup is validated for:
  - active ICP counts
  - active offer counts
  - seasonality persistence
  - active seasonality profile counts
- `campaign_calendar` semantics now resolve through the shared calendar helper
- scheduler admission checks now gate:
  - `pipeline-b-weekly`
  - `pipeline-c-campaign`
- `Pipeline C` now emits structured campaign constraints into runs, inbox payloads, and campaign asset metadata
- `Pipeline B` now plans only against resolved baseline/support slots and tags output metadata with slot/window/campaign context
- `publish-scheduled` now runs calendar preflight before final publish/schedule actions
- the `Pipeline C` resume-path regression (`campaignWindow is not defined`) is fixed and revalidated on the live happy path
- current validated live behavior is:
  - `Pipeline C` owns exclusive campaign windows
  - `Pipeline B` is blocked during those exclusive windows
  - `Pipeline C` still lands `6` copy assets plus the design brief
- `Pipeline B` still lands `9` drafts when the calendar allows it
- the latest `Pipeline B` planner-fidelity slice is also live:
  - deterministic slot directives are built before planning
  - directives now push required content type, CTA intent, and angle constraints per slot
  - planner/copywriter now receive stronger structured-config grounding:
    - primary offer
    - primary audience / ICP
    - active seasonality
    - structured config summary
    - approved hashtags
    - post-format preference
- current honest read:
  - `Pipeline C` remains the more grounded path
  - `Pipeline B` is better, but not yet considered fully tuned
  - some “Chililabombwe/raw/wild” repetition still comes from explicit brand config, not only from planner drift

Support-content alignment note:
- calendar UI exposes `Allow support content`
- `academic_calendar.support_content_allowed` now exists in the live schema
- existing rows were backfilled from `creative_override_allowed` so prior event behavior remains stable

The next `M14B` focus is explicitly:
- not a new milestone expansion
- not UI-first work
- deterministic tightening of the remaining business-truth and planning-truth layers through:
  - deterministic baseline content strategy / distribution rules for `Pipeline B`
  - richer slot budgeting and support-content behavior beyond the current exclusive-window gate
  - final grounding pass so `Pipeline B` reflects slot directives and config with less residual brand-keyword overuse

From this point forward, implementation must move in test-checkpoint slices:
- lock contract
- implement one narrow layer
- run a concrete validation checkpoint
- only then continue

The current `M14B` checkpoint sequence that is already implemented and validated is:
1. calendar-domain helper / slot resolution
2. scheduler conflict checks + decision logs
3. `Pipeline C` campaign-constraint output tightening
4. `Pipeline B` planning against allowed baseline/support slots
5. schedule/publish preflight validation

The next allowed `M14B` slice now starts after that checkpoint, not before it.

Calendar Studio note:
- do not implement the UI yet
- treat it as a backend/domain contract target
- preserve explainable windows, slots, constraints, linked content refs, and decision reasons for future UI consumption

This remains a continuation of `M14B`, not a new branch of work.

Current `M14A.1` delivered slice:
- worker-claim contract added to `pipeline_runs`
- SQL claim / release / heartbeat functions added
- isolated `samm-worker/` scaffold added
- worker now claims deterministically and dispatches `pipeline-b-weekly`
- deployable thin ingress function added:
  - `coordinator-ingress`
- ingress handles explicit scheduler paths directly
- ingress proxies non-explicit chat requests to the currently live `coordinator-chat`
- frontend hook now points locally to `coordinator-ingress`
- `coordinator-ingress` is configured with `verify_jwt = false` and auth-bound session verification
- `pipeline-b-weekly` can reuse a claimed worker run via `worker_run_id`
- local validation proved:
  - `run pipeline b` queues through thin ingress
  - worker claims the queued run
  - drafts land in Content Registry
  - approval gate still works
  - resume path still works
  - Pipeline B completes successfully after approval
- Railway deployment proved the same first worker path remotely:
  - `samm-worker` is deployed to Railway service `worker`
  - `run pipeline b` queues through thin ingress with no local worker running
  - drafts land in Content Registry
  - Pipeline B reaches `waiting_human`
  - Supabase `pipeline-b-weekly` logs show drafts sent to Content Registry
- Pipeline C is now validated through the same worker path remotely:
  - `pipeline-c-campaign` is queued through thin ingress with preserved calendar event context
  - campaign briefs land in `human_inbox`
  - the approval resume path now creates copy assets correctly
  - campaign drafts land in Content Registry
  - Pipeline C reaches terminal success after approval / resume
  - Supabase `pipeline-c-campaign` logs confirm copy asset creation, monitor run, and post-campaign report generation

`M14A` remains intentionally narrow:
- schema
- write/read contracts
- coordinator creates tasks, obligations, routes, and thread state
- scheduler updates linked task states
- linkage between `pipeline_runs` and `coordinator_tasks`

Still explicitly out of scope for `M14A`:
- outbound follow-up delivery
- multi-channel delivery
- CRM
- Sales
- obligation firing engine
- reminder execution
- UI overhaul

## Locked SAMM 2.0 Decisions

### Calendar naming
- Keep physical DB table `academic_calendar` for now.
- Use neutral domain naming `campaign_calendar` in docs, wrappers, and future services.
- Do not rename the physical table in this phase.

### Human task surface
- Keep `human_inbox` as the active human gate surface for now.
- Create `human_inbox` rows only for actionable human decisions.
- Do not create inbox rows for passive async status tracking.

### `coordinator_tasks.task_type`
Use a controlled string set, not a DB enum.

Initial allowed values:
- `pipeline_run`
- `approval_request`
- `status_check`
- `summary_request`
- `calendar_followup`
- `content_review`
- `manual_action`
- `system_notice`

Unknown values must be rejected in domain validation.

### `coordinator_obligations.trigger_type`
Contract includes:
- `on_success`
- `on_failure`
- `on_waiting_human`
- `on_stale`
- `on_cancelled`
- `on_due_time`
- `on_no_response_timeout`

`M14A` implements only:
- `on_success`
- `on_failure`
- `on_waiting_human`
- `on_cancelled`

### `channel_routes`
Contract includes future channels:
- `dashboard`
- `whatsapp`
- `email`
- `slack`
- `telegram`
- `teams`

`M14A` actively supports only:
- `dashboard`

### Contact merge policy
No auto-merge when strong identifiers disagree.

Merge precedence:
1. explicit internal `contact_id`
2. WhatsApp number
3. email
4. channel-specific external id
5. weak display-name or social hints -> never auto-merge

Conflicts should create uncertainty/review-needed state, not silent merges.

### Task status authority
Only these may mutate `coordinator_tasks.status`:
- `coordinator-chat`
- `scheduler`
- explicit pipeline resume, cancel, and terminal-state paths

Agents must never mutate coordinator task lifecycle directly.

### Discounts
- No free-form discount overrides in SAMM 2.0 foundational work.
- Discounts must come from structured config and policy layers.

### Learning thresholds
- Must be documented before the learning layer lands.
- Do not implement pattern promotion without explicit thresholds.

### Memory principle
`SAMM` memory is structured operational memory, not generic AI memory.

It exists for:
- conversation continuity
- work tracking
- obligations
- routing

It does not exist for:
- fuzzy personal memory
- speculative long-term memory
- summarization-as-truth

## Immediate Milestone Queue
- `M14A` `SAMM Memory Layer` (implemented and live-validated)
- `M14A.1` `Thin Ingress Runtime Split` (implemented and validated for initial worker targets)
- `M14B` `Structured Config Expansion`
- `M14C` `CRM P1`
- `M15D` `Validation Foundations`
- `M14D` `CRM P2`
- `M15A` `Sales S1`
- `M14E` `CRM P3`
- `M15B` `Sales S2`
- `M15C` `Pattern Learning Layer`
- `M15E` `Conversation Guardrails`
- `M16A` `Pipeline Standardization`

This order is locked unless the roadmap docs are explicitly amended first.

## Current Source-Of-Truth Clarification
Current roadmap truth:
- `M14A` and `M14A.1` are complete for the scoped foundation and worker split
- `M14B` is active and now includes:
  - universal config schema
  - current-settings read/write surfaces
  - first planner adoption
- the next planning work remains inside `M14B`
- do not let the new baseline content-strategy and B/C calendar coordination contracts masquerade as a separate milestone family before `M14B` is tightened

## Product State
`samm` remains the product anchor.

Current stance:
- preserve the scheduler-first control plane
- preserve pipelines A/B/C/D and `publish-scheduled`
- preserve Supabase as single durable source of truth
- extend with deterministic layers instead of rewriting the system

The current architecture is:
- `coordinator-chat` as active runtime
- `scheduler.ts` as control-plane authority
- shared `_shared/*` modules as common runtime layer
- Supabase tables as durable truth for org state, runs, content, approvals, calendar, and metrics

## Institutional Memory

### Metrics honesty
`M13I` removed mock metric writes and hardened org resolution on the active path.
If identical analytics values appear again, do not assume shared-org leakage without verifying the writer path first.

### Supabase JS insert error pattern
`supabase.from(...).insert({...})` does not throw on failure; it returns `{ data, error }`.
Always destructure and handle `error` explicitly.

### Claude Haiku markdown fence behavior
Haiku may wrap JSON in fenced blocks even when told not to.
Strip fences before `JSON.parse` using the existing regex pattern.

### `ref_table` is not a column on `human_inbox`
Do not add it back.

### Calendar table widening
If the UI adds a new event type, add a migration widening the physical `academic_calendar.event_type` constraint in the same slice.

### Confirmation card pattern
The chat UI renders confirmation cards from `response.confirmation`, not `response.action`.
Destructive actions needing confirmation must use a deterministic `confirmation.action` token and a fast-path handler.

### Scheduler interception note
Messages containing a pipeline keyword plus a run verb can bypass the LLM and go through scheduler handling.
Keep explicit guards whenever a message must create state before triggering a pipeline.

## Key Files

### Frontend
- `M.A.S UI/src/pages/content.tsx`
- `M.A.S UI/src/pages/inbox.tsx`
- `M.A.S UI/src/pages/metrics.tsx`
- `M.A.S UI/src/pages/agent/overview.tsx`
- `M.A.S UI/src/pages/agent/settings.tsx`
- `M.A.S UI/src/lib/api.ts`
- `M.A.S UI/src/lib/supabase.ts`

### Supabase edge functions
- `supabase/functions/coordinator-chat/index.ts`
- `supabase/functions/coordinator-chat/scheduler.ts`
- `supabase/functions/pipeline-a-engagement/index.ts`
- `supabase/functions/pipeline-b-weekly/index.ts`
- `supabase/functions/pipeline-c-campaign/index.ts`
- `supabase/functions/pipeline-d-post/index.ts`
- `supabase/functions/publish-scheduled/index.ts`
- `supabase/functions/_shared/pipeline-engine.ts`
- `supabase/functions/_shared/agent-registry.ts`
- `supabase/functions/_shared/integration-registry.ts`
- `supabase/functions/_shared/pipeline-run-status.ts`
- `supabase/functions/provision-org/index.ts`

## Current M14A Goal
Build the `SAMM` memory foundation without expanding into CRM, Sales, or outbound delivery.

Success looks like:
- every meaningful async coordinator action creates a durable coordinator task
- follow-up promises create obligations
- conversation routes and thread state are persisted
- scheduler and pipeline lifecycle can update linked task state
- no external follow-up sending is attempted yet

## Latest Validation Read
Manual product validation now confirms:
- Pipeline A runs successfully
- Pipeline B runs successfully and writes drafts
- Pipeline C runs successfully with calendar -> inbox -> content flow
- Pipeline D runs successfully
- `/samm` explicit scheduler traffic works through `coordinator-ingress`
- `channel_routes` rows are present
- `conversation_threads` rows are present
- first worker handoff path for Pipeline B is validated end to end
- first Railway worker path for Pipeline B is validated end to end

Open issue:
- `/samm` chat remains non-persistent in the UI
- this is a separate frontend/UI slice, not an `M14A` or `M14A.1` backend blocker
- this issue predates the `M14` series and must not be misread as already solved by backend memory work

Current backend concern:
- hosted deploys for heavier functions still fail with `Bundle generation timed out`
- thin ingress now works around that blocker for explicit scheduler paths
- continue `M14A.1` before starting the first generative UI adoption slice

## Runtime Direction
Locked decision:
- do not brute-force larger hosted Supabase edge bundles
- keep Supabase for DB/Auth/durable state
- keep thin ingress functions in Supabase
- use a dedicated Node worker runtime for heavy execution
- selected first worker host target: Railway

This is a partial runtime split, not a rewrite and not a platform reset.

Locked worker host target:
- Railway

Locked first moved execution paths:
- `pipeline-b-weekly`
- `pipeline-c-campaign`

Locked ingress/worker rule:
- scheduler authority stays in ingress
- worker executes approved work against existing durable contracts

Current immediate next implementation step:
- commit and push the validated `M14A.1` Railway slice
- move `pipeline-c-campaign` behind the worker path next
