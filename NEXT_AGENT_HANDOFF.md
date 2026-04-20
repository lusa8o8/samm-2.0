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
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`
- `SAMM_MEMORY_CONTRACT.md`
- `STRUCTURED_CONFIG_CONTRACT.md`
- `CONTACT_IDENTITY_AND_MERGE_RULES.md`
- `VALIDATION_FOUNDATIONS.md`

## Current Build Status
Stable through `M13I` on `main`.

Latest pushed `M13I` commits:
- `3ee8edc` `feat(M13I): make metrics UI honest`
- `32eb52f` `fix(M13I): remove mock metrics writes and harden org scope`

The source of truth is now:
- `SAMM_IMPLEMENTATION_ROADMAP.md` for milestone order and acceptance boundaries
- `git log` for what has actually landed
- this file for current institutional memory and next-slice guidance

## Current Active Slice
No implementation has started for `M14A` yet.

The next allowed execution slice is:
- `M14A` `SAMM Memory Layer`

`M14A` is intentionally narrow:
- schema
- write/read contracts
- coordinator creates tasks, obligations, routes, and thread state
- scheduler updates linked task states
- linkage between `pipeline_runs` and `coordinator_tasks`

Explicitly out of scope for `M14A`:
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
- `M14A` `SAMM Memory Layer`
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
