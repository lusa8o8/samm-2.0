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

`M14B` is now considered closed at a validated checkpoint:
- universal structured config is live and editable
- calendar authority is live
- scheduler precedence between `Pipeline B` and `Pipeline C` is deterministic
- `Pipeline B` support-only behavior is live and validated
- successful `Pipeline B` runs now preserve content-strategy metadata through resume/success

Post-`M14B` cleanup is now complete:
- the temporary UI-to-DB calendar `event_type` translation shim has been removed
- the physical `academic_calendar.event_type` contract now matches the universal UI/domain values:
  - `launch`
  - `promotion`
  - `seasonal`
  - `community`
  - `deadline`
  - `other`

From this point forward, implementation must move in test-checkpoint slices:
- lock contract
- implement one narrow layer
- run a concrete validation checkpoint
- only then continue

The full `M14B` checkpoint sequence that is now implemented and validated is:
1. calendar-domain helper / slot resolution
2. scheduler conflict checks + decision logs
3. `Pipeline C` campaign-constraint output tightening
4. `Pipeline B` planning against allowed baseline/support slots
5. schedule/publish preflight validation
6. support-content calendar control alignment
7. final `Pipeline B` content-strategy / distribution tightening and metadata persistence

The next allowed slice is no longer inside `M14B`.

Strategic reorder now locked:
- pause new CRM / Sales implementation
- migrate marketing into the new shell first
- resume `M14C` only after marketing is stable in the new UI

Why:
- the packaged `samm 2.0 UI` is a strong shell / widget / inspector base
- it is not a production-ready data layer
- marketing is the safest current substrate for migration because it already has the most validated backend/runtime truth

Migration diagnosis:
- `samm 2.0 UI` contains a real shell app under `artifacts/samm/`
- that shell is reusable
- its pages are still mock-service driven
- its bundled API/server is only a scaffold (`/healthz`)
- prototype types do not match the live marketing-domain contracts closely enough to port directly

Locked migration rule:
- do not transplant prototype pages directly into production
- first build a frontend workspace adapter layer that normalizes live backend objects into:
  - widget descriptors
  - inspector payloads
  - message parts
  - calendar windows / slots
  - decision explanations

Marketing-first migration order:
1. shell
2. `/samm`
3. inbox
4. content
5. metrics
6. calendar
7. operations carryover

CRM / Sales pages in the packaged UI are mock-only for now.
Do not treat them as current implementation targets.

`M14UI1` first shell slice is now in code:
- the live app no longer uses the old bespoke layout wrapper as the primary shell
- new shell foundation exists in:
  - `M.A.S UI/src/components/workspace/WorkspaceShell.tsx`
  - `M.A.S UI/src/components/workspace/Sidebar.tsx`
  - `M.A.S UI/src/components/workspace/InspectorPanel.tsx`
- first frontend adapter contracts exist in:
  - `M.A.S UI/src/lib/workspace-adapter.ts`
- current pages are still live-backend pages; they have not been ported to prototype mock services
- this was intentional to keep `M14UI1` narrow:
  - shell + adapter foundation only
  - no marketing page rewrite yet

First `M14UI2`-aligned surface slice is now in code:
- `M.A.S UI/src/pages/agent/chat.tsx` is the first migrated marketing surface inside the new shell
- `/samm` remains wired to the live coordinator backend path
- coordinator responses now expose:
  - inspectable status objects
  - shared inspector payloads for coordinator decisions/failures
  - the same live confirmation controls already used in production
- this is still a narrow slice:
  - no mock-service adoption
  - no backend contract rewrite
  - no durable thread persistence yet

Next marketing-surface migration slice is now in code:
- `M.A.S UI/src/pages/inbox.tsx` is the second migrated marketing surface inside the new shell
- inbox items now expose inspector-openable workspace objects
- live approval / reject / mark-read behavior remains intact
- pipeline resume behavior remains intact
- expanded inline detail rendering is still present while the inspector seam is added

Next marketing-surface migration slice is now in code:
- `M.A.S UI/src/pages/content.tsx` is the third migrated marketing surface inside the new shell
- content items and design briefs now expose inspector-openable workspace objects
- live approval / reject / retry / edit behavior remains intact
- batch-approve and pipeline resume behavior remain intact
- expanded inline review/edit surfaces are still present while the inspector seam is added

Next marketing-surface migration slice is now in code:
- `M.A.S UI/src/pages/metrics.tsx` is the fourth migrated marketing surface inside the new shell
- the old placeholder analytics message is gone
- the page now uses live metrics queries:
  - `useListMetrics`
  - `useGetMetricsSparklines`
- metrics cards expose inspector-openable workspace objects without changing backend query contracts

Checkpoint:
- `npm run build` passed in `M.A.S UI`
- no runtime/backend contract changes were made in this slice

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
- `M14UI1` `Shared Workspace Shell`
- `M14UI2` `Tool-First Thread And Widgets`
- `M14UI3` `Operational Surface Carryover`
- `M14UI4` `Marketing Surface Migration`
- `M14C` `CRM P1` (paused until marketing migration stabilizes)
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

### Calendar Studio boundary
The current calendar migration is only the live-backed event/window layer in the new shell.
Do not treat it as Calendar Studio yet.
Slot/day planning, campaign tracing, and richer inspector-driven orchestration still belong to later Studio work.

### UI migration correction
The current hybrid shell/carryover work in `M.A.S UI` is a validated checkpoint, not the final migration target.
Do not continue major old-page carryover work as if it were the destination.
The actual frontend target is the packaged app inside:
- `samm 2.0 UI/artifacts.zip -> artifacts/samm/*`

The next UI work must:
- bind the live backend into the packaged app structure
- replace packaged `mockService.ts`
- replace packaged demo types with live marketing-normalized contracts
- preserve the current hybrid work only as fallback/reference while the packaged app is wired up

Current reset checkpoint:
- the packaged app has been materialized in-repo at:
  - `M.A.S UI/packaged-target/samm/*`
- this tree is now the working frontend target for the next UI slices
- live runtime is still served from the existing `M.A.S UI/src/*` app until the packaged target is wired up

Latest packaged-target checkpoint:
- packaged `SammPage` now uses:
  - `M.A.S UI/packaged-target/samm/src/services/liveSammService.ts`
- this is the first live adapter inside the packaged target
- it invokes `coordinator-ingress` and reads live context from:
  - `pipeline_runs`
  - `human_inbox`
  - `academic_calendar`
- packaged target `tsconfig.json` was rewritten to work in-repo and the packaged target now passes:
  - `npx tsc -p packaged-target/samm/tsconfig.json --noEmit`
- packaged `InboxPage` and `ApprovalQueueWidget` now use:
  - `M.A.S UI/packaged-target/samm/src/services/liveInboxService.ts`
- that adapter maps live `human_inbox` items into the packaged inbox card model and preserves:
  - approve / reject / mark-seen actions
  - `pipeline-b-weekly` resume side effects for draft approvals
  - `pipeline-c-campaign` resume side effects for campaign briefs
- packaged `ContentPage` and `ContentBatchReviewWidget` now use:
  - `M.A.S UI/packaged-target/samm/src/services/liveContentService.ts`
- that adapter maps live `content_registry` rows into the packaged content card/detail model and preserves:
  - approve / reject / retry actions
  - `pipeline-b-weekly` resume side effects when draft sets clear
  - `pipeline-c-campaign` resume side effects for campaign content gating
- packaged target channel types/icons now cover the live marketing channels needed by current content flows:
  - `facebook`
  - `whatsapp`
  - `youtube`
  - `email`
  - `design_brief`
- packaged `MetricsPage` now uses:
  - `M.A.S UI/packaged-target/samm/src/services/liveMetricsService.ts`
- that adapter reads live `platform_metrics` rows and derives the packaged metrics surface:
  - KPI cards
  - channel performance rows
  - reach/signup sparkline data
  - packaged `samm` summary copy
  - lightweight pattern cards
- packaged `CalendarPage` now uses:
  - `M.A.S UI/packaged-target/samm/src/services/liveCalendarService.ts`
- that adapter reads live `academic_calendar` rows and maps them into the packaged event/window model
- packaged calendar inspector now has:
  - `M.A.S UI/packaged-target/samm/src/components/widgets/CalendarEventInspectorWidget.tsx`
- the packaged calendar surface now shows the live support-content and creative-deviation flags through the inspector instead of a generic widget fallback
- packaged `OperationsPage` now uses:
  - `M.A.S UI/packaged-target/samm/src/services/liveOperationsService.ts`
- that adapter reads live runtime state from:
  - `pipeline_runs`
  - `content_registry` (for synthetic Pipeline D activity)
- the packaged operations overview now shows:
  - real pipeline health cards
  - real recent run rows
  - real trigger actions for pipelines A/B/C
- packaged operations settings now use:
  - `M.A.S UI/packaged-target/samm/src/services/liveSettingsSummaryService.ts`
- that adapter reads real config state from:
  - `org_config`
  - `icp_categories`
  - `offer_catalog`
  - `seasonality_profile`
  - `campaign_defaults`
  - `approval_policy`
- the packaged settings tab now shows a live read-only summary of the actual workspace configuration
- the packaged manual tab now reuses the fuller carryover manual from:
  - `M.A.S UI/src/pages/agent/manual.tsx`
- packaged Operations now gives the packaged runtime:
  - live overview
  - live settings summary
  - full operations manual carryover
- latest packaged polish slice closes the remaining missing-controls gap by running fuller live carryover editors inside the packaged shell:
  - packaged `Calendar` now reuses `M.A.S UI/src/pages/calendar.tsx`
  - packaged `Operations -> Settings` now reuses `M.A.S UI/src/pages/agent/settings.tsx`
- packaged runtime now exposes the expected operator affordances again:
  - settings input fields
  - calendar add/edit/delete
  - support-content toggle
  - creative-deviation toggle
  - content edit
  - image upload
  - approve all
  - design brief edit/share
  - sidebar sign-out
- latest packaged content interaction polish is also now in code:
  - preview cards open on card tap / click rather than a separate details button
  - preview cards stay summary-level only; full content remains in the expanded modal
  - expanded content surfaces now use platform-tinted backgrounds for quicker channel recognition

Latest packaged-runtime checkpoint:
- `M.A.S UI/vite.packaged.config.ts` now provides a separate runtime entry for the packaged app
- use:
  - `npm run dev` for the existing fallback/live app
  - `npm run dev:packaged` for the packaged target
- packaged runtime checkpoints now pass:
  - `npm run build:packaged`
  - `npm run typecheck:packaged`
- this is the first point where the packaged app is runnable side-by-side without cutting over the default entrypoint
- packaged runtime now has its own auth gate plus `/login`, so separate-port sessions sign into the live backend instead of falling through to the dummy dev org
- packaged runtime also now includes compatibility proxy modules so the live carryover editors can run safely inside the packaged shell:
  - `M.A.S UI/packaged-target/samm/src/lib/api.ts`
  - `M.A.S UI/packaged-target/samm/src/lib/supabase.ts`
  - `M.A.S UI/packaged-target/samm/src/lib/workspace-adapter.ts`
  - `M.A.S UI/packaged-target/samm/src/components/layout.tsx`
- follow-up packaged content polish is now also in code:
  - packaged `ContentPage` is packaged-native again instead of a direct carryover re-export
  - the packaged registry no longer uses inline card expansion
  - content review now uses the packaged modal / blur path
  - missing packaged inspector widget coverage for content review is closed through:
    - `campaign_brief`
    - `linked_content_list`
  - design brief cards now span the full grid width to separate them visually from post drafts
  - preview cards now stay on a single neutral surface instead of the earlier nested tinted panel
  - preview metadata now renders as compact chips instead of stacked boxed panels
- current validated preview-tightening checkpoint before the next slice:
  - preview copy is shorter
  - full detail remains in the expanded inspector flow
  - live content actions and metadata remain intact
  - `npm run build:packaged` passed
  - `npm run build` passed
- latest content-density follow-up is now also in code:
  - all live content actions remain exactly as wired:
    - `approve all`
    - `edit`
    - `share`
    - image upload / replace
    - approve / reject / retry
  - all live content metadata remains intact; this was presentation only
  - packaged `Content` preview-card density is tighter against the original packaged mock:
    - tighter card/header/action rhythm
    - tighter chip spacing
    - shorter preview presentation
  - expanded inspector-backed content surfaces are also denser through:
    - `linked_content_list`
    - `campaign_brief`
  - this checkpoint intentionally treated the oversized feel as local content-surface density first, not a global shell/token reset
  - files touched:
    - `M.A.S UI/packaged-target/samm/src/pages/ContentPage.tsx`
    - `M.A.S UI/packaged-target/samm/src/components/widgets/LinkedContentListWidget.tsx`
    - `M.A.S UI/packaged-target/samm/src/components/widgets/CampaignBriefWidget.tsx`
  - validated checkpoints:
    - `npm run build:packaged`
    - `npm run build`
- latest expanded regular-content inspector follow-up is now also in code:
  - the slice stayed presentation-only and only touched:
    - `M.A.S UI/packaged-target/samm/src/components/widgets/LinkedContentListWidget.tsx`
  - live content backend behavior remains unchanged:
    - approve / reject / retry hooks
    - query invalidation paths
    - full draft body and metadata coverage
  - the regular-content expanded card is now closer to the original packaged mock:
    - smaller summary-hero typography
    - denser metadata-card rhythm
    - compact tag row
    - bottom action row composition aligned closer to the reference
  - validated checkpoints:
    - `npm run build:packaged`
    - `npm run build`
- next sensible packaged-UI slice after this checkpoint:
  - broader visual-consistency sweep across Inbox, Calendar, and Operations
  - keep that first pass presentation-only unless a concrete backend-coupled blocker appears
- refined packaged-content diagnosis after comparing against `samm 2.0 UI/samm.zip`:
  - the original packaged app does not use `linked_content_list` for regular expanded content
  - the original expanded regular-content widget is:
    - `samm/src/components/widgets/ContentBatchReviewWidget.tsx`
  - the current visible drift is partly routing drift, not only styling drift
  - the clearest mismatch is duplicated copy in the current regular expanded card:
    - preview excerpt
    - separate full-draft block
  - the original widget renders the draft body once in the tinted banner, then metadata/tags/actions
- locked next narrow correction:
  - keep design briefs on `campaign_brief`
  - route regular content expansion back toward the original `content_batch_review` composition
  - preserve live content actions and metadata coverage
  - do not reopen preview-card density in this slice
- latest expanded-card routing correction is now also in code:
  - `ContentPage` no longer opens regular content into `linked_content_list`
  - regular content now routes back through:
    - `content_batch_review`
  - design briefs remain on:
    - `campaign_brief`
  - the duplicated expanded-copy drift is removed from the live regular-content path:
    - no separate preview excerpt block plus full-draft block
    - content now renders once inside the original tinted batch-review banner
  - the original packaged expanded composition is the active base again:
    - tinted banner
    - compact metadata grid
    - compact tags
    - bottom action row
  - live behavior remains intact:
    - approve / reject / retry still hit the live packaged backend path
    - query invalidation now runs through the batch-review widget so content/inbox/runtime state stays in sync
  - files touched:
    - `M.A.S UI/packaged-target/samm/src/pages/ContentPage.tsx`
    - `M.A.S UI/packaged-target/samm/src/components/widgets/ContentBatchReviewWidget.tsx`
  - validated checkpoints:
    - `npm run build:packaged`
    - `npm run build`
- refined design-brief diagnosis after the regular-content correction:
  - the original packaged app in `samm 2.0 UI/samm.zip` does not include a dedicated `CampaignBriefWidget`
  - the current packaged target `CampaignBriefWidget` is a local extension, not an original packaged source-of-truth component
  - the remaining drift is mostly visual-language drift:
    - purple/shareable header treatment
    - extra tip panel
    - legacy-feeling composition compared with the compact content-review widgets
- locked next narrow correction:
  - keep design briefs on `campaign_brief`
  - do not collapse design briefs into `content_batch_review`; keep markdown rendering
  - restyle `CampaignBriefWidget` into the same compact widget language as the cleaned content-review surfaces
  - remove legacy in-widget affordances that duplicate card-level behavior
- latest design-brief styling correction is now also in code:
  - design briefs still route through:
    - `campaign_brief`
  - markdown rendering remains intact
  - `CampaignBriefWidget` now matches the cleaned content-review language more closely:
    - compact tinted header instead of the legacy purple/shareable treatment
    - compact metadata cards
    - no extra in-widget share/tip affordances
  - file touched:
    - `M.A.S UI/packaged-target/samm/src/components/widgets/CampaignBriefWidget.tsx`
  - validated checkpoints:
    - `npm run build:packaged`
    - `npm run build`
- refined design-brief follow-up diagnosis:
  - the remaining brief drift is now composition drift, not color drift
  - compared with the cleaned regular content cards, the brief still diverges because:
    - the brief body sits in a separate white card instead of the tinted body panel
    - the metadata blocks do not yet reuse the same compact block language as the regular content-review widgets
- locked next narrow correction:
  - keep design briefs on `campaign_brief`
  - keep markdown rendering intact
  - refactor `CampaignBriefWidget` to reuse the same expanded-card composition as the cleaned regular content cards:
    - tinted body panel
    - compact metadata blocks
    - same spacing rhythm
- latest design-brief final tightening is now also in code:
  - design briefs still route through:
    - `campaign_brief`
  - markdown rendering remains intact
  - `CampaignBriefWidget` now reuses the same expanded-card composition language as the cleaned regular content cards more literally:
    - the brief body now lives inside the tinted primary panel
    - metadata now uses the same compact block style as the regular content-review widgets
    - spacing rhythm is aligned to the cleaned content-draft expanded cards
  - file touched:
    - `M.A.S UI/packaged-target/samm/src/components/widgets/CampaignBriefWidget.tsx`
  - validated checkpoints:
    - `npm run build:packaged`
    - `npm run build`
- refined diagnosis before the next broader sweep:
  - `Inbox` page composition is already very close to the original packaged reference in `samm 2.0 UI/samm.zip`
  - the remaining `Inbox` drift is mainly detail/inspector polish, not page-shell drift
  - `Calendar` is the main visual outlier because the packaged target currently reuses the older carryover page:
    - `M.A.S UI/src/pages/calendar.tsx`
  - that carryover page restores live CRUD/toggle behavior but still reads visually heavier and older than the original packaged `CalendarPage`
  - `Calendar` inspector routing also still flows through the older `calendar_window` adapter contract, so the packaged runtime is not yet aligned to the packaged calendar-inspector widget path
  - `Operations` overview is partly aligned already, but the carried-over `Settings` and `Manual` surfaces still visibly inherit older shell styling through:
    - `M.A.S UI/src/pages/agent/settings.tsx`
    - `M.A.S UI/src/pages/agent/manual.tsx`
- locked next broad sweep:
  - keep it strictly UI-only
  - preserve all live behavior:
    - inbox actions
    - calendar add/edit/delete and rule toggles
    - operations run-now/settings/manual behavior
  - use the original packaged zip as the visual source of truth
  - use the current live packaged target and carryover pages as the behavior source of truth
  - narrow implementation scope:
    - inbox: only last-mile inspector/detail alignment if still visibly off-reference
    - calendar: main page-density correction plus packaged-style inspector alignment
    - operations: carryover shell/density tightening first, especially manual/settings
  - explicitly do not reopen:
    - content-registry polish
    - backend/domain contracts
    - Calendar Studio work
- latest broad visual-consistency sweep is now also in code:
  - the slice stayed UI-only and kept all live behavior intact
  - `Inbox` only received the final small inspector/detail alignment still visibly off-reference:
    - packaged `ApprovalQueueWidget` terminal action copy now matches the original packaged language more closely
  - `Calendar` received the main correction:
    - the carryover-backed live page in `M.A.S UI/src/pages/calendar.tsx` was restyled into the denser packaged header/card rhythm
    - add / edit / delete behavior stayed intact
    - support-content and creative-deviation toggles stayed intact
    - calendar detail open now aligns to the packaged inspector widget path through:
      - `calendar_event_inspector`
  - packaged calendar detail styling was also tightened in:
    - `M.A.S UI/packaged-target/samm/src/components/widgets/CalendarEventInspectorWidget.tsx`
  - `Operations` received shell tightening instead of a feature rewrite:
    - packaged `OperationsPage` overview density was tightened slightly
    - packaged manual no longer sits inside an extra outer card wrapper
    - carryover settings shell density was tightened in:
      - `M.A.S UI/src/pages/agent/settings.tsx`
  - implementation files:
    - `M.A.S UI/src/lib/workspace-adapter.ts`
    - `M.A.S UI/src/pages/calendar.tsx`
    - `M.A.S UI/src/pages/agent/settings.tsx`
    - `M.A.S UI/packaged-target/samm/src/components/widgets/ApprovalQueueWidget.tsx`
    - `M.A.S UI/packaged-target/samm/src/components/widgets/CalendarEventInspectorWidget.tsx`
    - `M.A.S UI/packaged-target/samm/src/pages/OperationsPage.tsx`
  - validated checkpoints:
    - `npm run build:packaged`
    - `npm run build`
  - build status note:
    - the same pre-existing sourcemap/chunk-size warnings remain
    - there were no new build failures
- refined calendar-inspector diagnosis after that sweep:
  - the current calendar inspector is still partly improvised
  - it routes through the correct packaged widget path now, but it does not yet match the original packaged calendar widget composition closely enough
  - the original packaged calendar inspector code has now been recovered directly
- locked narrow follow-up:
  - restore the original calendar-inspector composition more literally
  - keep the live payload conservative so no fake/backend-disconnected actions appear
  - do not reopen the calendar page shell in this correction
  - only touch:
    - `M.A.S UI/packaged-target/samm/src/components/widgets/CalendarEventInspectorWidget.tsx`
    - the carryover payload mapping in `M.A.S UI/src/pages/calendar.tsx`
- latest narrow calendar-inspector follow-up is now also in code:
  - the original packaged calendar inspector composition is restored much more literally in:
    - `M.A.S UI/packaged-target/samm/src/components/widgets/CalendarEventInspectorWidget.tsx`
  - the live payload feeding that widget was tightened in:
    - `M.A.S UI/src/pages/calendar.tsx`
  - the correction stayed UI-only:
    - no backend contracts changed
    - no calendar CRUD behavior changed
    - no new fake action state was introduced
  - current implementation notes:
    - the widget now uses the original gradient-banner / chip-row / metadata-grid composition
    - the carryover payload now supplies a safer packaged-style `eventType`
    - triggered live events are mapped conservatively to avoid non-functional inspector actions
  - validated checkpoints:
    - `npm run build:packaged`
    - `npm run build`
  - build status note:
    - the same pre-existing sourcemap/chunk-size warnings remain
    - there were no new build failures
- refined packaged inspector-shell diagnosis after the content/calendar cleanup:
  - the main remaining UX drift is now at the shell level, not the individual widgets
  - packaged expanded surfaces still open inside the original centered modal / blur shell from:
    - `M.A.S UI/packaged-target/samm/src/components/shell/InspectorPanel.tsx`
  - that shell now fights the intended queue/detail workflow:
    - it hides too much workspace context
    - it feels cramped for taller content/calendar/detail widgets
    - it reads as a blocking dialog rather than a review drawer
  - the live carryover inspector shell in `M.A.S UI/src/components/workspace/InspectorPanel.tsx` is not the blocker for this checkpoint
- locked next narrow correction:
  - keep the slice shell-only and reversible
  - touch only:
    - `M.A.S UI/packaged-target/samm/src/components/shell/InspectorPanel.tsx`
    - `SAMM_UI_ADOPTION_PLAN.md`
    - `NEXT_AGENT_HANDOFF.md`
  - convert the packaged inspector from centered modal to right-side drawer presentation
  - preserve all current inspector consumers and widget logic unchanged:
    - `openInspector(...)`
    - widget routes/types
    - content/inbox/calendar/operations behavior
  - preserve current close behavior:
    - Escape
    - outside click
  - lighten the backdrop and support clean slide-out animation instead of hard unmounting
- latest packaged inspector-shell follow-up is now also in code:
  - packaged expanded surfaces no longer open inside the centered modal / blur shell
  - `M.A.S UI/packaged-target/samm/src/components/shell/InspectorPanel.tsx` now renders a right-side drawer with:
    - top/right/bottom gutter
    - lighter dim backdrop
    - slide-in / slide-out motion instead of centered modal scale motion
  - all current inspector consumers remain unchanged:
    - `openInspector(...)` call sites were not rewritten
    - widget routes/types were not rewritten
    - content/inbox/calendar/operations behavior stayed intact
  - close behavior stayed intact:
    - Escape
    - outside click
  - the drawer now keeps the last rendered title/widget mounted long enough to animate out cleanly on close
  - validated checkpoints:
    - `npm run build:packaged`
    - `npm run build`
  - build status note:
    - the same pre-existing sourcemap/chunk-size warnings remain
    - there were no new build failures
- refined Calendar Studio diagnosis after the shell/content/calendar cleanup:
  - the main remaining bottleneck is upstream planning quality, not only content-generation throughput
  - the deterministic backend is now materially stronger once calendar truth exists:
    - window / slot resolution
    - `Pipeline B` / `Pipeline C` admission
    - structured-config grounding
    - content approval / publish flow
  - the weak layer is still helping the operator define a full month of good calendar truth in one sitting
  - current `Calendar` is still mainly CRUD, not a planning workspace
  - current `/samm` chat still is not a true tool-streaming workspace; it can open confirmations/inspectors but cannot yet operate rich planning widgets inline
- locked Calendar Studio v1 rule:
  - treat Calendar Studio as the planning workspace that turns operator intent into deterministic calendar truth for the existing pipelines
  - do not treat it as a generic calendar
  - do not let prompt logic blur:
    - structural config
    - dynamic planning input
    - committed planning output
    - derived UI state
- locked Calendar Studio v1 config bucket:
  - durable config should hold:
    - business type / operating model
    - industry category
    - default content-mix policy
    - default channel weighting
    - asset capability profile
    - recurring campaign/support-content defaults
  - current config already covers:
    - ICP
    - offers
    - seasonality
    - campaign defaults
    - approval policy
    - channel/module settings
  - therefore implementation should add only the missing planning-default fields instead of inventing a second config system
- locked Calendar Studio v1 dynamic-input bucket:
  - monthly/session/event input should hold:
    - planning month / horizon
    - monthly objective
    - key dates / campaigns
    - one-off notes and exceptions
    - temporary emphasis
    - asset readiness per campaign/event
    - CTA/message overrides
    - operator-capacity notes
- locked Calendar Studio v1 committed-output bucket:
  - approved plans must become calendar/planning truth, not linger as prose in chat
  - keep `academic_calendar` as the primary authority in v1 and extend it carefully where needed
  - committed output should cover:
    - date range
    - ownership
    - exclusivity
    - support-content allowed
    - channels in scope
    - CTA/message constraints
    - content-type requirements
    - per-window posting constraints
    - asset readiness / asset-needed state
    - planning notes
- locked Calendar Studio v1 derived-state rule:
  - do not collect day capacity, backlog, readiness, open slots, or failure mix as user input
  - derive them from:
    - `academic_calendar`
    - `content_registry`
    - `pipeline_runs`
- locked Calendar Studio v1 surfaces:
  - month grid = primary planning surface
  - date drawer = operational day surface
  - campaign drawer = campaign/window surface
  - `/samm` should launch/refine planning widgets, not replace the calendar as the place where truth is committed
- locked revised Calendar Studio v1 operator flow:
  - the target user is a solo operator / small team planning a month with guided help, not manually driving every pipeline/day
  - revised flow:
    1. structural config provides durable defaults
    2. `/samm` conducts the planning conversation and explains the why
    3. `/samm` turns that conversation into a structured planning draft
    4. Calendar Studio is used to review the month visually and commit the plan
    5. only after commit may draft creation / downstream execution happen
    6. post-commit work is exception handling, not open-ended replanning
- locked Planning mode vs Execution mode rule:
  - `/samm` defaults to `Planning mode`
  - `Planning mode` may:
    - ask questions
    - explain tradeoffs
    - suggest plans
    - simulate/propose calendar changes
    - open planning widgets / Studio handoffs
  - `Planning mode` must not:
    - trigger any pipeline
    - resume runs
    - publish
    - approve/reject content
    - auto-commit calendar truth
    - treat pipeline mentions as execution commands
  - `Execution mode` is only for explicit action on committed truth
  - calendar manipulation may exist in both modes, but:
    - planning mode edits draft/proposed state
    - execution mode edits committed/live state
- locked `/samm` vs Calendar Studio split:
  - `/samm` owns:
    - planning collaboration
    - education
    - rationale
    - preset pills / structured prompts
    - planning draft creation
    - handoff into Studio
  - Calendar Studio owns:
    - month-grid review
    - day/campaign inspection
    - exception edits
    - plan commit
    - post-commit draft creation
  - do not put the full calendar grid in `/samm` chat as the primary object
  - use shared AG UI contracts + deep-link/companion handoff instead
- locked revised v1 button contract:
  - `/samm`:
    - `Start monthly plan`
    - `Add event or campaign`
    - `Mark asset status`
    - `Refine this plan`
    - `Review in Calendar Studio`
  - Calendar Studio month level:
    - `Plan this month`
    - `Commit plan`
  - Calendar Studio day drawer:
    - `Create drafts`
    - `Add manually`
    - `Edit rules`
  - Calendar Studio campaign drawer:
    - `Create campaign drafts`
    - `Edit campaign rules`
    - `Update asset status`
  - Content Registry remains the action surface for:
    - approve / reject / retry / edit
- locked exact meaning of `Generate content`:
  - semantically it means `Create drafts`
  - only for already-planned, already-committed calendar intent
  - it must not invent strategy or fill the month from scratch
  - if the UI label remains `Generate content` temporarily, implementation still means `Create drafts from committed truth`
- locked v1 cuts:
  - remove `Ask AI to fill gaps` from the Calendar Studio workflow contract
  - remove `Run pipeline` from the Calendar Studio workflow contract
  - keep `Add manually` only as a secondary/manual escape hatch
  - keep low-level pipeline controls in operational surfaces, not as first-class Calendar Studio actions
- locked Calendar Studio v1 widget/build list:
  - `monthly_planning_session`
  - `calendar_month_grid`
  - `calendar_day_panel`
  - `campaign_panel`
  - `asset_readiness_panel`
  - reuse where possible:
    - `calendar_event_inspector`
    - `content_batch_review`
    - `approval_queue`
    - `pipeline_run_timeline`
    - `failure_group`
- locked backend/read-model gap list for Calendar Studio v1:
  - current `useListCalendarEvents` only returns raw calendar rows
  - v1 needs explicit read models for:
    - month-grid summary
    - day detail
    - campaign/window detail
  - v1 also needs narrow calendar-field expansion for:
    - objective
    - asset readiness
    - asset notes / source links
    - planning notes
- locked v1 cuts:
  - no drag-and-drop builder
  - no full asset-management system
  - no comments / version history
  - no unstructured autoplan with no structured confirmation
  - no detached campaign-planning subsystem
  - no attempt to solve all future Calendar Studio layers in one release
- locked implementation order for the future Calendar Studio track:
  1. config gaps
  2. dynamic planning-session fields
  3. committed calendar-output fields
  4. workspace widget contracts for streamed planning surfaces
  5. Calendar Studio read models
  6. month grid + day/campaign drawers
  7. `/samm` planning-widget wiring into those same contracts
- latest Calendar Studio prototype audit:
  - the updated Replit build in:
    - `samm 2.0 UI/samm updated.zip`
    now contains the right v1 surface set
  - confirmed prototype surfaces present:
    - `CalendarStudioPage`
    - `MonthlyPlanningSessionWidget`
    - `CalendarMonthGrid`
    - `CalendarDayPanel`
    - `CampaignPanel`
    - `AssetReadinessPanel`
  - confirmed shared primitives present:
    - `ContentCapacityBar`
    - `DayMetricCounts`
    - `ContentChip`
    - `CampaignTimelineStrip`
    - `AssetReadinessPill`
    - `OwnershipChip`
  - treat that updated zip as the current visual/component source for Calendar Studio v1
  - do not treat it as live-data wiring or a finished workspace contract
- locked Calendar Studio pixel rule:
  - implementation must adopt the approved updated prototype pixel-to-pixel
  - do not reinterpret spacing, density, drawer composition, or day-card hierarchy during integration
  - backend/read-model wiring may change underneath; visible UI composition should not drift without an explicit new design checkpoint
- locked adoption checklist:
  1. use the updated prototype as-is for visual composition and shared primitives
  2. add the next widget contracts to `M.A.S UI/src/lib/workspace-adapter.ts`:
     - `monthly_planning_session`
     - `calendar_month_grid`
     - `calendar_day_panel`
     - `campaign_panel`
     - `asset_readiness_panel`
  3. add renderer support for those widget types in the live workspace path
  4. build the required read models before trying to make the Studio real:
     - month-grid summary
     - day detail
     - campaign/window detail
     - asset-readiness detail
  5. extend calendar truth narrowly for:
     - `objective`
     - `target_audience_note`
     - `asset_mode`
     - `asset_notes`
     - `source_asset_url`
     - `planning_notes`
  6. adopt the Studio page/widgets into the packaged target first, then bind live data, then expose those same widget contracts to `/samm`
  7. only after the contracts are stable should inline tool/widget streaming render the same planning surfaces inside chat
- still explicitly deferred:
  - freeform chat-first planning with no structured confirmation
  - drag-and-drop month editing
  - comments/version history
  - full asset-management workflows
  - any redesign drift away from the approved updated prototype
- locked implementation-ready Calendar Studio contract:
  - the updated approved prototype is the visual source
  - the live backend/calendar domain is the data source
  - adapters must bridge those layers explicitly
  - do not let prototype names become accidental backend truth
- locked canonical live naming rule:
  - keep backend/live truth grounded in current calendar/window/slot naming:
    - `campaign_ref`
    - `window_ref`
    - `slot_ref`
    - `owner_pipeline`
    - `exclusive_campaign`
    - `support_content_allowed`
    - `channels_in_scope`
    - `allowed_ctas`
    - `primary_message`
    - `content_types_required`
  - prototype-friendly names such as:
    - `campaignId`
    - `campaignName`
    - `ownerPipeline`
    - `campaignContext`
    are adapter/output names only
- locked structural-config additions for Calendar Studio v1:
  - `business_type`
  - `industry_category`
  - `default_content_mix_policy`
  - `default_channel_weighting`
  - `asset_capability_profile`
  - `default_campaign_intensity`
  - `default_support_content_posture`
  - no other config additions are allowed in v1 unless the docs change first
- locked dynamic planning-session fields:
  - `planning_month`
  - `monthly_objective`
  - `key_campaigns[]`
  - `temporary_emphasis[]`
  - `operator_capacity_note`
  - `asset_readiness_by_campaign`
  - `one_off_notes[]`
  - `status`
  - each `key_campaign` may contain only:
    - `id`
    - `name`
    - `kind`
    - `start_date`
    - `end_date`
    - `exclusivity`
    - `asset_readiness`
    - `notes`
  - `total_planned_days` and `estimated_content_volume` remain derived/read-only
- locked committed calendar-output additions:
  - keep `academic_calendar` as the primary v1 authority
  - narrow additions required:
    - `objective`
    - `target_audience_note`
    - `asset_mode`
    - `asset_notes`
    - `source_asset_url`
    - `planning_notes`
- locked read-model outputs:
  - `month_grid_summary`
  - `day_detail`
  - `campaign_window_detail`
  - `asset_readiness_detail`
  - these outputs are derived display state, not editable source-of-truth fields
- locked live widget payload set:
  - `calendar_month_grid`
  - `calendar_day_panel`
  - `campaign_panel`
  - `asset_readiness_panel`
  - `monthly_planning_session`
  - each of these should carry only the fields already locked in `SAMM_UI_ADOPTION_PLAN.md`
- locked prototype-to-live mapping rule:
  - map through adapters, never by ad hoc page logic
  - examples:
    - `campaignId` -> `campaign_ref`
    - `campaignName` -> `label`
    - `ownerPipeline` -> `owner_pipeline`
    - `supportContentAllowed` -> `support_content_allowed`
    - `exclusivity` -> `exclusive_campaign`
    - `ctaRules` -> `allowed_ctas`
  - `openSlots`, readiness, backlog, and breakdown summaries stay derived-only
- latest Calendar Studio first contract/render slice is now in code:
  - the slice stayed inside the first locked boundary only:
    - widget contracts
    - renderer support
    - no read models
    - no page wiring
    - no backend/calendar mutations
  - live workspace widget types now include:
    - `monthly_planning_session`
    - `calendar_month_grid`
    - `calendar_day_panel`
    - `campaign_panel`
    - `asset_readiness_panel`
  - new live renderer exists in:
    - `M.A.S UI/src/components/workspace/WorkspaceWidgetRenderer.tsx`
  - approved prototype Calendar Studio widgets are now mirrored into the live workspace layer at:
    - `M.A.S UI/src/components/workspace/calendar-studio/MonthlyPlanningSessionWidget.tsx`
    - `M.A.S UI/src/components/workspace/calendar-studio/CalendarMonthGrid.tsx`
    - `M.A.S UI/src/components/workspace/calendar-studio/CalendarDayPanel.tsx`
    - `M.A.S UI/src/components/workspace/calendar-studio/CampaignPanel.tsx`
    - `M.A.S UI/src/components/workspace/calendar-studio/AssetReadinessPanel.tsx`
  - supporting shared primitives are mirrored in:
    - `M.A.S UI/src/components/workspace/shared/*`
  - the live workspace can now render structured widgets in both current surfaces:
    - inspector drawer via `InspectorPanel.tsx`
    - `/samm` chat body when a `WorkspaceMessagePart` of type `widget` appears
  - explicit stop point:
    - widget rendering exists
    - payload producers for those widget types are not yet wired
    - Calendar Studio read models are not yet built
    - Studio routes/pages are not yet connected to live data
  - validated checkpoints:
    - `npm run build`
    - `npm run build:packaged`
  - build status note:
    - the same pre-existing sourcemap/chunk-size warnings remain
    - there were no new build failures

- locked next slice: Calendar Studio read-model layer only
  - scope:
    - frontend-only derived read models
    - no page wiring
    - no widget payload producers
    - no backend mutations
    - no schema changes
  - source tables:
    - `academic_calendar`
    - `content_registry`
    - `pipeline_runs`
  - required outputs:
    - `month_grid_summary`
    - `day_detail`
    - `campaign_window_detail`
    - `asset_readiness_detail`
  - implementation target:
    - live frontend under `M.A.S UI/src/lib/*`
    - outputs must already match the locked widget payload contracts

- locked read-model derivation rules:
  - canonical campaign identity:
    - `academic_calendar.id`
    - canonical window id = `window:${academic_calendar.id}`
  - content-to-campaign association precedence:
    1. `content_registry.metadata.campaign_ref` exact match
    2. `content_registry.campaign_name` exact label match (case-insensitive)
    3. else unlinked/baseline
  - content-to-window association precedence:
    1. `content_registry.metadata.window_ref` exact match
    2. else fallback to canonical campaign association
  - day bucketing precedence:
    - scheduled and approved -> `scheduled_at`
    - published -> `published_at`, otherwise `scheduled_at`
    - draft / pending approval / rejected / failed -> `created_at`
    - rows without a usable timestamp are excluded from day-level bucketing
  - active window derivation:
    - `window_start = event_date - (lead_days ?? 21)`
    - `window_end = event_end_date ?? event_date`
  - primary day campaign selection:
    - one touching window -> use it
    - multiple windows -> explicit `priority` desc, then shorter duration, then earlier start, then lexical id
  - day ownership mode:
    - `campaign_exclusive`
    - `campaign_dominant`
    - `mixed`
    - `baseline`
    - `open`
    using the exact rules now locked in `SAMM_UI_ADOPTION_PLAN.md`
  - daily capacity:
    - `max_posts_per_day` if present
    - else `channels_in_scope.length`
    - else `1` on an active campaign day
    - else `0`
    - `open_slots = max(capacity_max - capacity_used, 0)`
  - per-channel limits:
    - until explicit per-channel caps exist, each channel has `max = 1`
    - if no `channels_in_scope`, derive channels from linked content on that day
  - month totals / committed percent:
    - sum current-month day values only
    - `committed_percent = round(total_scheduled / max(total_scheduled + total_drafts + total_failed + total_open_slots, 1) * 100)`
  - preview chips:
    - max 3
    - order = scheduled -> draft/pending approval -> failed -> newest timestamp
  - campaign readiness:
    - `approval_backlog = pending approval count`
    - `missing_slots = sum(open_slots)` across window days
    - `readiness_percent = round((published + scheduled) / max(published + scheduled + drafts + pending_approval + failed + missing_slots, 1) * 100)`
  - provisional asset readiness until committed asset fields land:
    - `assets_ready` if any linked row has `media_url`
    - `partial_assets` if linked rows exist but none has `media_url`
    - `assets_needed` if no linked rows exist
    - `source_links` come from linked `media_url` values first

- explicit stop point for this slice:
  - implement and verify the read-model layer only
  - do not wire pages yet
  - do not start emitting the new widget payloads yet

- latest Calendar Studio read-model slice is now in code
  - the slice stayed inside the locked boundary with one verification-only compatibility fix:
    - frontend-only derived read models
    - no page wiring
    - no widget payload producers
    - no backend mutations
    - no schema changes
  - new read-model layer:
    - `M.A.S UI/src/lib/calendar-studio-read-models.ts`
  - provided outputs/loaders:
    - `loadCalendarStudioSourceBundle()`
    - `useCalendarStudioSourceBundle()`
    - `buildCalendarStudioMonthGrid()`
    - `buildCalendarStudioDayDetail()`
    - `buildCalendarStudioCampaignWindowDetail()`
    - `buildCalendarStudioAssetReadinessDetail()`
    - the corresponding hooks for each locked read-model output
  - source bundle is grounded directly in:
    - `academic_calendar`
    - `content_registry`
    - `pipeline_runs`
  - live channel compatibility note:
    - the workspace Calendar Studio layer now accepts `whatsapp` and `youtube`
    - `ChannelIcon.tsx` now renders those channels
  - verification-only chat fix:
    - `src/pages/agent/chat.tsx` maps coordinator `completed` status to workspace `success`
    - this was required only to clear typecheck
  - validated checkpoints:
    - `npm run typecheck`
    - `npm run build`
    - `npm run build:packaged`
  - build status note:
    - the same pre-existing sourcemap warnings remain
    - the same chunk-size warnings remain
    - there were no new build failures
- explicit new stop point:
  - read-models exist
  - no page consumes them yet
  - no widget payload producer emits the new Calendar Studio widget types yet
  - no live route/page wiring has started yet

- locked next slice: live Calendar Studio page wiring only
  - scope:
    - wire `/calendar` to the approved Calendar Studio composition
    - consume the live read models for month/day/campaign state
    - open the existing inspector drawer with the already-renderable Calendar Studio widgets
    - keep the approved prototype layout pixel-to-pixel
  - allowed:
    - add the live Calendar Studio route/page component
    - update `/calendar` route wiring
    - add page-local inspector payload helpers
    - add required loading/empty states for the live data path only
  - not allowed:
    - backend mutations
    - schema changes
    - pipeline triggers
    - page-level edit/create/delete forms
    - new read-model outputs beyond the locked set
    - `/samm` chat streaming changes
    - inspector action-button behavior changes
  - route rule:
    - `/calendar` becomes the active Calendar Studio route
    - keep the previous CRUD page in the repo as fallback/reference
  - monthly planning button rule:
    - `Plan this month` may open a provisional planning-session payload derived from the current month source/read model
    - it must stay within the locked dynamic planning-session field contract
    - it must not write anything
- explicit stop point:
  - `/calendar` renders the approved Studio page against live read models
  - day clicks open `calendar_day_panel`
  - campaign clicks open `campaign_panel`
  - `Plan this month` opens `monthly_planning_session`
  - no other workflow behavior is introduced yet

- latest live Calendar Studio page-wiring slice is now in code
  - the slice stayed inside the locked page-wiring boundary:
    - `/calendar` now points to a dedicated live Studio page component
    - the previous CRUD calendar page remains in the repo as fallback/reference
    - no backend mutations
    - no schema changes
    - no pipeline triggers
    - no chat streaming changes
  - new live Studio route/page:
    - `M.A.S UI/src/pages/calendar-studio.tsx`
  - route change:
    - `M.A.S UI/src/App.tsx`
    - `/calendar` now renders the new live Studio page
  - live page behavior now wired:
    - month navigation
    - pixel-matched Studio month grid
    - `Plan this month` -> `monthly_planning_session`
    - day cards -> `calendar_day_panel`
    - campaign pills -> `campaign_panel`
  - page data path:
    - `useCalendarStudioSourceBundle()`
    - `buildCalendarStudioMonthGrid()`
    - `buildCalendarStudioDayDetail()`
    - `buildCalendarStudioCampaignWindowDetail()`
    - provisional planning-session payload derived from the current month source/read model only
  - route loading/error states now exist for the live data path
  - validated checkpoints:
    - `npm run typecheck`
    - `npm run build`
    - `npm run build:packaged`
  - build status note:
    - the same pre-existing sourcemap warnings remain
    - the same chunk-size warnings remain
    - there were no new build failures
  - explicit new stop point:
    - `/calendar` is Studio-backed
    - Studio drawers are live from page interactions
    - no commit/write workflow exists yet
    - no manual event CRUD is present on the new Studio route
    - the next allowed slice is workflow wiring only
  - packaged-runtime correction after user verification:
    - `localhost:5174` is the packaged runtime rooted at `M.A.S UI/packaged-target/samm`
    - the prior main-app-only Studio route wiring is therefore not sufficient
    - the packaged runtime still shows the old CRUD calendar until the packaged target is patched natively
    - the next required slice before workflow work is:
      - add packaged-target compatibility shims for the approved Studio page/read-model layer
      - add packaged-target Calendar Studio components and shared primitives
      - update packaged `CalendarPage` and packaged `WidgetRenderer` so `/calendar` on `5174` becomes the approved Studio view
    - packaged adoption remains pixel-to-pixel against the approved prototype
  - packaged-runtime correction now completed:
    - packaged compatibility shims now exist for the Studio page/read-model layer
    - packaged Calendar Studio components/shared primitives now exist under `packaged-target/samm/src/components/workspace/*`
    - packaged `WidgetRenderer` now renders the five Calendar Studio widget types
    - packaged `CalendarPage` now resolves to the approved Studio page instead of the legacy CRUD page
    - validated checkpoints:
      - `npm run typecheck`
      - `npm run build`
      - `npm run build:packaged`
    - stop point after correction:
      - `/calendar` on `localhost:5174` should now render Studio
      - packaged drawers are live
      - no workflow/write/commit logic exists yet
  - narrow follow-up polish approved:
    - only the `CalendarDayPanel` footer action row may change
    - tighten button density and prevent wrapped labels to restore pixel-match with the approved prototype
    - no logic/text/layout changes are allowed outside that footer row
  - narrow follow-up polish now completed:
    - `CalendarDayPanel` footer buttons no longer shrink or wrap
    - action-row typography/padding is tightened to match the approved prototype more closely
    - validated checkpoints:
      - `npm run typecheck`
      - `npm run build`
      - `npm run build:packaged`
  - next implementation slice locked under the revised v1 contract:
    - add real `/samm` Planning mode vs Execution mode guardrails
    - default `/samm` to Planning mode
    - prevent scheduler interception and other mutating coordinator actions while in Planning mode
    - reduce Calendar Studio drawer actions to the revised v1 button contract
    - do not add commit/write workflow in this slice
  - planning/execution guardrail slice now completed:
    - `/samm` now exposes explicit `Planning` and `Execution` mode in both the main app and the packaged runtime
    - default mode is now `Planning`
    - frontend requests now pass `mode` through the coordinator path
    - `coordinator-ingress` and `coordinator-chat` both default missing mode to `execution` for backward compatibility
    - scheduler fast-path now blocks run/resume/confirm execution while in `Planning` mode but still allows status reads
    - legacy coordinator chat now blocks:
      - live calendar mutation
      - write-post execution
      - fast-path delete confirmation
      - model pipeline execution
      while in `Planning` mode
    - prompt instructions now force `action: null` for planning-mode mutation/execution asks
  - Calendar Studio v1 action reduction now completed in both main and packaged copies:
    - day drawer:
      - `Create drafts`
      - `Add manually`
      - `Edit rules`
      - removed `Ask AI to fill gaps`
      - removed `Run pipeline`
    - campaign drawer:
      - `Create campaign drafts`
      - `Edit campaign rules`
      - `Update asset status`
      - removed `Regenerate batch`
      - removed footer support-toggle action
    - open-slot helper copy now reflects committed-truth draft creation only
  - validated checkpoints after this slice:
    - `npm run typecheck`
    - `npm run build`
    - `npm run build:packaged`
  - build status note:
    - same pre-existing sourcemap warnings remain
    - same chunk-size warnings remain
    - no new build failures
  - new stop point:
    - `/samm` now has a real planning-vs-execution safety boundary
    - Calendar Studio no longer advertises disallowed v1 verbs
    - there is still no planning draft persistence
    - there is still no commit/write workflow
    - `Create drafts` and the reduced campaign actions are still UI-only at this stage
  - next allowed slice:
    - workflow wiring only
    - specifically:
      - monthly planning review/commit flow
      - explicit handler wiring for `Create drafts`, `Add manually`, `Edit rules`, `Create campaign drafts`, `Edit campaign rules`, and `Update asset status`
    - do not expand scope into schema work, draft storage, or new UI invention during that slice
  - workflow-wiring diagnosis now locked before code:
    - Studio actions render inside the shared inspector, so wiring must use a shared workflow controller/context instead of page-local callbacks
    - only two safe seams are allowed in this slice:
      1. existing live `academic_calendar` create/update mutations for real rule/window edits
      2. explicit handoff into `/samm` with mode + starter context for collaboration or generation steps that do not yet have a direct deterministic action seam
    - therefore:
      - `Edit rules` / `Edit campaign rules` should open real calendar-rule editing
      - `Review draft plan` / `Commit to calendar` should become explicit review/acknowledgement flow only
      - `Create drafts` / `Create campaign drafts` should hand off into `/samm` `Execution mode`, not trigger pipelines directly from Studio
      - `Add manually` should hand off into `/samm` planning collaboration, not invent a new manual-content system
      - `Update asset status` should use planning-mode handoff, not schema writes
    - still not allowed in this slice:
      - planner storage
      - new schema fields
      - direct pipeline buttons in Studio
      - speculative direct draft-generation endpoints
      - broad UI redesign

### Confirmation card pattern
The chat UI renders confirmation cards from `response.confirmation`, not `response.action`.
Destructive actions needing confirmation must use a deterministic `confirmation.action` token and a fast-path handler.

### Scheduler interception note
Messages containing a pipeline keyword plus a run verb can bypass the LLM and go through scheduler handling.
Keep explicit guards whenever a message must create state before triggering a pipeline.

## Key Files

### Frontend
- `M.A.S UI/src/pages/calendar.tsx`
- `M.A.S UI/src/pages/content.tsx`
- `M.A.S UI/src/pages/inbox.tsx`
- `M.A.S UI/src/pages/metrics.tsx`
- `M.A.S UI/src/pages/agent/overview.tsx`
- `M.A.S UI/src/pages/agent/settings.tsx`
- `M.A.S UI/src/lib/api.ts`
- `M.A.S UI/src/lib/supabase.ts`
- `M.A.S UI/src/components/workspace/WorkspaceShell.tsx`
- `M.A.S UI/src/components/workspace/Sidebar.tsx`
- `M.A.S UI/src/components/workspace/InspectorPanel.tsx`
- `M.A.S UI/src/lib/workspace-adapter.ts`
- `samm 2.0 UI/artifacts.zip`
- packaged app paths of interest inside the archive:
  - `artifacts/samm/src/App.tsx`
  - `artifacts/samm/src/pages/*`
  - `artifacts/samm/src/components/shell/*`
  - `artifacts/samm/src/components/widgets/*`
  - `artifacts/samm/src/services/mockService.ts`
  - `artifacts/samm/src/types/index.ts`

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

## Calendar Studio Workflow Wiring

This slice is now implemented and must be treated as the current frontend truth.

What changed:
- a shared Calendar Studio workflow controller/provider now exists:
  - `M.A.S UI/src/lib/calendar-studio-workflow.tsx`
- both shells now expose that controller:
  - `M.A.S UI/src/components/layout.tsx`
  - `M.A.S UI/packaged-target/samm/src/components/layout.tsx`
- the live Studio page now registers the workflow actions in:
  - `M.A.S UI/src/pages/calendar-studio.tsx`
- those actions now do only two allowed things:
  1. mutate real calendar windows through existing create/update seams
  2. hand off into `/samm` with explicit `mode` + starter `prompt`

Current action behavior:
- monthly planning:
  - `Review draft plan` = explicit review acknowledgement only
  - `Commit to calendar` = acknowledgement of current committed truth, or prompt to add a key date if the month has none
  - `Add campaign or key date` = opens real calendar-window creation dialog
- day drawer:
  - `Create drafts` = handoff to `/samm` in `Execution` mode
  - `Add manually` = handoff to `/samm` in `Planning` mode
  - `Edit rules` = edit existing campaign window or create a new one for that day
- campaign drawer:
  - `Create campaign drafts` = handoff to `/samm` in `Execution` mode
  - `Edit campaign rules` = edit real calendar-window rules
  - `Update asset status` = handoff to `/samm` in `Planning` mode
- asset panel buttons:
  - `Mark ready`
  - `Request assets`
  - `Update notes`
  all route through planning-mode handoff, not schema writes

Cross-surface handoff is now supported:
- main `/samm` chat reads `mode` + `prompt` from the URL query string
- packaged SAMM page does the same
- packaged runtime now exposes `/samm` as a route alias to keep handoff paths identical

Validation for this slice:
- `npm run typecheck`
- `npm run build`
- `npm run build:packaged`

Locked stop point:
- do not invent planner/session persistence next
- do not invent direct draft-generation endpoints next
- do not add new calendar schema fields as part of this UI slice
- do not expand Calendar Studio with more buttons
- Calendar Studio v1 is now "read models + constrained workflow wiring"

What remains open after this:
- `/samm` still lacks inline tool-streamed Studio widgets with shared session state
- thread persistence / real tool-first thread behavior remains an `M14UI2` concern
- remaining operational carryover remains an `M14UI3` concern
- the next disciplined diagnosis should return to the unresolved `M14UI` series work, not reopen Calendar Studio design

## Post-Test Fixes

Manual validation exposed two real packaged-runtime regressions and one deployment-state issue.

Packaged regressions now fixed locally:
- packaged app had mounted `WorkspaceShell` directly in `packaged-target/samm/src/App.tsx`
  - this bypassed `components/layout.tsx`
  - result: Calendar Studio widget buttons rendered but the shared workflow context stayed at no-op defaults
  - fix: packaged app now mounts `Layout`
- packaged `/samm` rendered confirmation/action buttons but did not execute them
  - result: delete confirmation pills appeared stale in chat
  - fix:
    - `packaged-target/samm/src/pages/SammPage.tsx` now handles action clicks
    - `packaged-target/samm/src/services/liveSammService.ts` now accepts and forwards `confirmationAction`

Validated after the packaged-runtime fix:
- `npm run typecheck`
- `npm run build`
- `npm run build:packaged`

Important deployment/state note:
- the frontend is now sending Planning/Execution `mode` correctly
- if manual testing still shows Planning mode executing pipelines, draft creation, or live calendar mutation, the active Supabase edge functions are not yet running the guarded backend code from this repo
- current local backend changes that still require deployment to affect live behavior:
  - planning-mode guardrails in `supabase/functions/coordinator-chat/index.ts`
  - planning-mode scheduler guardrails in `supabase/functions/coordinator-chat/scheduler.ts`
  - tightened planning prompt/guidance rules in those same files

Do not misdiagnose the planning-mode leak as a current frontend-mode bug unless the guarded edge functions have first been deployed and the issue still reproduces.

Deployment status update:
- `coordinator-chat` was deployed successfully to Supabase project `jxmdwltfkxstiwnwwiuf` on `2026-04-23`
  - remote version advanced from `28` to `29`
- `coordinator-ingress` deploy command also succeeded against the same project on `2026-04-23`
  - `supabase functions list` still reported version `7` with the prior `UPDATED_AT`
  - treat ingress as "deploy accepted; version list did not advance" unless later evidence shows otherwise
- current retest rule:
  - if Planning mode still executes pipelines, draft creation, or live calendar deletion after this deploy, the issue is no longer explained by pending backend deployment and must be re-diagnosed in the live runtime path
