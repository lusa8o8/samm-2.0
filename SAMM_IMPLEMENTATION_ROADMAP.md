# SAMM Implementation Roadmap

## Purpose
This document is the milestone source of truth for `samm 2.0`.

The current strategy is:
- preserve the active scheduler-first marketing core
- weave in the missing deterministic layers
- keep the build Supabase-first
- keep the current thin-ingress plus Railway worker split controlled and minimal
- execute in narrow, reversible milestone slices
- end every implementation slice at a real test checkpoint before the next slice begins

## Current Stable Baseline
Stable through `M13I` on `main`.

Current backbone to preserve:
- `coordinator-chat` as the active coordinator runtime
- `scheduler.ts` as the control-plane authority
- pipelines `A / B / C / D` plus `publish-scheduled`
- `_shared/*` as the reusable runtime layer
- Supabase as the durable truth for org state, runs, approvals, content, calendar, and metrics

## Current Redesign Trigger
The first forced architecture redesign has now been reached.

Observed blocker:
- `M14A` schema is live
- `M14A` code is implemented and pushed
- live production validation shows `channel_routes` / `conversation_threads` are still empty
- deploying updated edge functions fails with hosted Supabase bundle generation timeouts

Conclusion:
- the blocker is deployability of the heavy hosted edge runtime
- not the memory schema
- not the scheduler logic
- not the pipeline contracts themselves

Response rule:
- do not brute-force bigger hosted edge bundles
- do not rewrite the product around the blocker
- introduce a controlled runtime split that keeps Supabase as the source of truth

## Cross-Layer Invariants
These remain true across all future milestones:

1. `SAMM` must ask instead of guess.
2. Scheduler decides. Models do not execute.
3. No async work without a durable `coordinator_task`.
4. No follow-up promise without an obligation or an explicit no-follow-up result.
5. No outreach without config-backed policy.
6. No sales message without an offer decision.
7. No external action without validation.
8. Structured config is the business truth layer.
9. Learning must be structured and thresholded, never fuzzy.

## Preserve vs Weave In

### Preserve
- `coordinator-chat`
- `scheduler.ts`
- pipelines `A / B / C / D`
- `publish-scheduled`
- `_shared/*`
- Supabase as single source of truth
- persisted human gates through `human_inbox`

### Weave In
- thin-ingress runtime split
- `SAMM` memory layer
- structured config expansion
- CRM `P1 / P2 / P3`
- Sales `S1 / S2`
- explicit validation layer
- pattern learning layer
- conversation guardrail layer
- gradual pipeline standardization

## Strategic Reorder
Status:
- locked

Reason:
- marketing is now the most mature and validated product layer
- the new packaged `samm 2.0 UI` has a strong shell / inspector / widget direction but is still mock-driven
- layering CRM and Sales onto the old UI while the frontend direction has already changed would create avoidable migration debt

Decision:
- pause new CRM / Sales implementation work temporarily
- migrate and stabilize the marketing system in the new UI first
- resume `M14C` only after the marketing workspace is stable in the new shell

Meaning:
- this is not a roadmap abandonment
- it is a sequencing change
- backend/runtime contracts remain the source of truth
- the new UI must be adopted through a frontend adapter layer, not by replacing the live app with the packaged prototype wholesale

Locked migration principle:
- `M.A.S UI` remains the live operational reference until each marketing surface is ported cleanly
- `samm 2.0 UI` is the shell / interaction / widget source
- migration must stay lego-brick modular:
  - shell
  - adapter layer
  - `samm`
  - inbox
  - content
  - metrics
  - calendar
  - operations carryover

Reference architecture:
```text
Supabase + Functions + Scheduler + Worker
                |
                v
        Frontend workspace adapter layer
  - widget descriptors
  - inspector payloads
  - message parts
  - calendar windows / slots
  - decision reasons
                |
        +-------+--------+
        |                |
        v                v
  new shared shell   live queries/mutations
        |
        v
  marketing workspace surfaces
```

## M13I
Status:
- complete

Delivered:
- removed mock metric snapshot writes from active path
- hardened backend org resolution on active path
- made the Metrics UI honest until real ingestion exists

Checkpoint commits:
- `3ee8edc` `feat(M13I): make metrics UI honest`
- `32eb52f` `fix(M13I): remove mock metrics writes and harden org scope`

## M14A - SAMM Memory Layer
Status:
- complete and live-validated through thin ingress

Goal:
- make `SAMM` a durable async coordinator before adding CRM, Sales, or learning logic

In scope:
- `conversation_threads`
- `coordinator_tasks`
- `coordinator_obligations`
- `channel_routes`
- coordinator write/read contracts
- scheduler linkage between `pipeline_runs` and `coordinator_tasks`
- dashboard-only route activation

Out of scope:
- outbound follow-up delivery
- reminder execution
- multi-channel delivery
- CRM logic
- Sales logic
- UI overhaul
- obligation firing engine
- frontend conversation persistence

Locked decisions:
- `coordinator_tasks.task_type` is a controlled string set, not a DB enum
- `human_inbox` stays active for actionable human decisions only
- only `coordinator-chat`, `scheduler`, and explicit resume/cancel/terminal paths may mutate `coordinator_tasks.status`
- memory is structured operational memory, not generic AI memory

Acceptance criteria:
- meaningful async coordinator actions create a `coordinator_task`
- promised follow-ups create an obligation
- conversation route and thread state are persisted
- linked pipeline state can update task lifecycle deterministically
- no outbound follow-up sending exists yet

Delivered in code:
- memory tables + `pipeline_runs.coordinator_task_id` migration
- shared `samm-memory` helper module
- `coordinator-chat` dashboard memory context creation
- scheduler task/obligation creation + run linkage
- pipeline lifecycle sync back into `coordinator_tasks`

Validation result:
- production migration is applied
- manual product testing shows pipelines A/B/C/D still run cleanly
- production SQL checks now return rows in:
  - `channel_routes`
  - `conversation_threads`
- `M14A` is now considered closed through the thin ingress path

Important non-goal clarification:
- conversation persistence in the `/samm` UI was already unresolved before the `M14` series began
- `M14A` solved durable backend memory/state contracts, not frontend thread-history rendering
- persistent conversation UI remains a separate frontend/workspace milestone

Rollback boundary:
- tables and runtime wiring can be reverted without touching CRM, Sales, or UI architecture

## M14A.1 - Thin Ingress Runtime Split
Status:
- complete for the initial worker target set

Goal:
- restore deployability and preserve the scheduler-first architecture by moving heavy execution out of hosted Supabase edge bundling while keeping Supabase as the durable control/data plane

Decision:
- frontend remains unchanged for this slice
- Supabase remains the source of truth
- heavy execution moves to a dedicated Node worker runtime
- selected host target: Railway
- exact split contract lives in `SAMM_RUNTIME_SPLIT_CONTRACT.md`

What stays in Supabase:
- auth-aware ingress
- lightweight `coordinator-chat` admission path
- durable writes to:
  - `coordinator_tasks`
  - `coordinator_obligations`
  - `pipeline_runs`
  - `human_inbox`
  - `content_registry`
  - `org_config`
  - physical `academic_calendar`
- thin status and control endpoints

What moves first:
- heavy scheduler orchestration logic where necessary
- pipeline execution entry for the heaviest paths
- long-running / retry-prone execution paths

In scope:
- define first worker contract
- define how Supabase ingress enqueues work for the worker
- keep `coordinator-chat` thin enough to deploy reliably
- preserve all existing state contracts
- move only the minimum execution surface required to unblock deployability
- create a dedicated worker directory and service surface instead of linking the repo root

Delivered in first slice:
- `pipeline_runs` worker-claim contract migration
- claim / release / heartbeat SQL functions for worker execution
- dedicated `samm-worker/` scaffold with:
  - isolated `package.json`
  - TypeScript config
  - Supabase admin client
  - polling loop
  - deterministic claim helper
  - placeholder dispatch map for `pipeline-b-weekly` and `pipeline-c-campaign`

Delivered in second slice:
- deployable thin ingress function:
  - `supabase/functions/coordinator-ingress`
- ingress handles explicit scheduler paths itself
- ingress proxies non-explicit chat requests to the current live `coordinator-chat`
- frontend function slug switched locally from `coordinator-chat` to `coordinator-ingress`

Delivered in third slice:
- `coordinator-ingress` configured for ES256-authenticated browser sessions
- explicit scheduler traffic now validates `M14A` memory writes in production
- `pipeline-b-weekly` is queued with `execution_target = 'worker'`
- worker claims and dispatches Pipeline B through the existing edge executor
- `pipeline-b-weekly` accepts `worker_run_id` and reuses the claimed run
- first worker path is validated end to end:
  - queue
  - claim
  - draft creation
  - approval gate
  - resume
  - success

Railway validation result:
- `samm-worker` is deployed to Railway service `worker`
- `pipeline-b-weekly` now runs successfully through Railway with no local worker running
- thin ingress queueing still works
- drafts land in `content_registry`
- Pipeline B reaches `waiting_human` and remains resumable
- `pipeline-c-campaign` now runs successfully through Railway with preserved calendar event context
- campaign briefs land in `human_inbox`
- the resume path creates copy assets after approval
- campaign drafts land in `content_registry`
- Pipeline C reaches terminal success and logs monitor/report execution

Still open after `M14A.1`:
- decide whether additional paths should move behind the worker or stay edge-backed
- decide whether Pipeline B / C resume should remain edge-backed or be worker-owned end to end later

Out of scope:
- full infra rewrite
- replacing Supabase functions entirely
- UI adoption work
- CRM / Sales implementation
- pattern learning
- obligation delivery engine

Acceptance criteria:
- production deploy path no longer depends on a heavyweight hosted edge bundle
- `coordinator-chat` becomes reliably deployable again
- at least one blocked execution path has a worker-ready contract
- first moved execution paths are `pipeline-b-weekly` then `pipeline-c-campaign`
- `M14A` memory writes can be validated live after the ingress/runtime split

Rollback boundary:
- worker introduction can be reverted without changing frontend contracts or database truth tables

## M14B - Structured Config Expansion
Status:
- complete

Goal:
- make config and calendar the deterministic planning-truth layers for `Pipeline B` and `Pipeline C`

Delivered so far:
- universal config schema foundation
- current settings read/write surfaces for:
  - ICP
  - offers
  - seasonality
  - discount policies
  - outreach policies
- planner access to structured config through `_shared/structured-config.ts`
- first planner adoption in `pipeline-b-weekly` and `pipeline-c-campaign`
- settings cleanup slices for:
  - active ICP counts
  - active offer counts
  - seasonality persistence
  - seasonality duplicate-profile display cleanup
- calendar-domain helper and slot resolution through:
  - `supabase/functions/_shared/calendar-coordination.ts`
- scheduler admission checks and structured decision output for:
  - `pipeline-b-weekly`
  - `pipeline-c-campaign`
- `Pipeline C` structured campaign-constraint output in:
  - `pipeline_runs.result`
  - `human_inbox.payload`
  - campaign draft metadata in `content_registry`
- `Pipeline B` slot-aware planning against allowed baseline / support slots only
- calendar-aware publish preflight validation in `publish-scheduled`
- explicit calendar support-content control aligned end to end:
  - `Allow support content` maps to `support_content_allowed`
  - `Allow creative deviation` remains design-only
- support-slot behavior now live:
  - exclusive campaign windows suppress baseline planning
  - support-only slots reopen when `Allow support content` is enabled
  - support-mode output is constrained to campaign-aligned reminder/reinforcement behavior
- final `Pipeline B` planner-fidelity slice now live:
  - support slots reserve budget before baseline allocation
  - weekly strategy now persists:
    - `support_slot_budget`
    - `content_type_targets`
    - `selected_baseline_slot_ids`
    - `selected_support_slot_ids`
  - resume/success paths preserve strategy metadata instead of dropping it

Current validation read:
- `Pipeline C` is materially grounded by structured config and calendar constraints
- `Pipeline C` happy path is validated after the resume-path fix:
  - campaign brief lands
  - `6` copy assets land
  - design brief lands
- calendar authority is now live:
  - `Pipeline C` owns exclusive campaign windows
  - `Pipeline B` is blocked during exclusive windows unless support is explicitly allowed
- `Pipeline B` now has two validated modes:
  - normal baseline mode when the horizon is open
  - support-only mode when an exclusive campaign window allows support content
- the latest `Pipeline B` support-only checkpoint is validated:
  - run is constrained to `2` support drafts
  - drafts stay aligned to the campaign CTA/message
  - no competing offer is introduced
- strategy metadata now persists on successful `Pipeline B` runs, including channel/content targets and selected slot groups
- publish/send legality now has a deterministic calendar firewall before final action
- some repeated local/source language may still appear because it is explicitly present in brand config, not because planning truth is still missing

Locked expansion inside `M14B`:
- baseline content strategy / distribution rules
- `Pipeline B` / `Pipeline C` calendar coordination rules
- slot contract and support-content contract
- scheduler decision logs
- campaign constraint schema
- planning horizon and deterministic tie-break rules
- Calendar Studio backend readiness as a domain contract, not as a UI implementation task

Implementation rule from this point forward:
- every `M14B` code slice must end at a test checkpoint
- no next slice starts until the current slice has a concrete validation read

Out of scope for the current `M14B` extension:
- Calendar Studio UI implementation
- visual redesign work
- full calendar normalization into new physical tables unless wrappers become inadequate
- in progress, with schema foundation, read/write surfaces, and first planner adoption live

Goal:
- turn business truth into deterministic universal structured config before outreach or sales automation expands

Guiding rule:
- `samm` is structure-aware, not domain-aware
- core config must work for any business
- domain-specific fields remain pluggable, not hardcoded into core schema
- ICP remains first-class inside the audience/targeting model and must not be dropped

In scope:
- audience segments with explicit ICP support
- `icp_categories` as the initial targeting object if we keep the current name in first implementation
- `offer_catalog`
- `seasonality_profile`
- `discount_policies`
- `outreach_policy`
- `campaign_defaults`
- `approval_policy`
- organization identity
- brand and communication rules
- contact identity / merge rules as config-adjacent reference inputs
- learning thresholds as a documented config boundary for later milestones

Out of scope:
- free-form discount overrides
- live outreach
- live sales decisions
- domain-specific hardcoding in core schema

Locked interpretation:
- `icp_categories` should be treated as the first implementation seam for universal audience segments
- ICP is not an edtech-only idea; it is the ideal customer profile / targeting truth for any business
- campaign input must remain distinct from config:
  - config = stable business truth
  - campaign = time-bound intent

Acceptance criteria:
- pipelines can reference structured config instead of redefining business truth in prompts
- low/high demand and discount rules come from config, not model inference
- campaign planning can read neutral `campaign_calendar` domain wrappers over physical `academic_calendar`
- audience targeting works through universal segment / ICP structure rather than domain-specific assumptions
- organization, brand, offer, pricing, seasonality, outreach, and approval truth can all be configured without prompt rewriting

Delivered in first slice:
- universal config schema foundation is now live in Supabase
- new tables added:
  - `icp_categories`
  - `offer_catalog`
  - `seasonality_profile`
  - `seasonality_periods`
  - `discount_policies`
  - `outreach_policy`
  - `campaign_defaults`
  - `approval_policy`
- `provision-org` now seeds safe defaults for:
  - `campaign_defaults`
  - `approval_policy`
  - `outreach_policy`

Delivered in second slice:
- frontend read contracts now exist for:
  - `icp_categories`
  - `offer_catalog`
  - `seasonality_profile` / `seasonality_periods`
  - `discount_policies`
  - `outreach_policy`
  - `campaign_defaults`
  - `approval_policy`
- current `Operations -> Settings` now exposes the first universal-config surface:
  - read-only snapshot for audience, offers, seasonality, pricing, and outreach
  - editable `campaign_defaults`
  - editable `approval_policy`

Delivered in third slice:
- current `Operations -> Settings` now supports write surfaces for:
  - `icp_categories`
  - `offer_catalog`
  - `seasonality_profile` / `seasonality_periods`
  - `discount_policies`
  - `outreach_policy`
- the current admin UI intentionally uses compact inputs and JSON-backed fields where needed to keep this milestone narrow and reversible

Delivered in fourth slice:
- `pipeline-b-weekly` now loads structured config and includes it in weekly planning context
- `pipeline-c-campaign` now loads structured config and includes it in campaign planner context
- shared structured-config loader now exists in:
  - `supabase/functions/_shared/structured-config.ts`
- seasonality save path in the current settings UI is fixed against the real schema:
  - unsupported `active` field removed from `seasonality_periods`
  - new periods now omit `id` so DB-generated UUIDs work
- `coordinator-ingress` explicit pipeline-start path is fixed again after the missing `linkCoordinatorTaskToPipelineRun` import
- `pipeline-b-weekly` and `pipeline-c-campaign` are redeployed against the corrected structured-config loader

Current validation read:
- `Pipeline C` is now materially more grounded by config than before the `M14B` planner adoption slice
- `Pipeline B` is improved, but still not strongly enough governed by config to call fidelity complete
- `Pipeline B` drift is now understood as an under-specified deterministic layer issue, not a runtime issue
- settings summary / persistence cleanup is now validated for:
  - active ICP counts
  - active offer counts
  - seasonality persistence
  - active seasonality profile counts
- duplicate retry-created seasonality profiles no longer distort the current admin summary surfaces

Delivered in fifth slice:
- current `Operations -> Settings` now rehydrates saved offer and seasonality state correctly after writes
- active ICP and active-offer summary counts now reflect stored state correctly
- seasonality profile views now prefer the populated saved profile over duplicate retry-created rows
- seasonality periods now persist and re-open correctly in the editor

Delivered in sixth slice:
- shared calendar-domain helper now resolves:
  - campaign windows
  - slot ownership
  - planning horizon
  - support/baseline slot semantics
- `pipeline-b-weekly` and `pipeline-c-campaign` now write calendar-planning metadata into `pipeline_runs.result`
- scheduler admission checks now persist structured `scheduler_decisions` / `calendar_planning`
- explicit `Pipeline B` requests are now blocked during exclusive `Pipeline C` windows instead of improvising around them

Delivered in seventh slice:
- `Pipeline C` now emits structured campaign constraints into:
  - `pipeline_runs.result`
  - campaign brief inbox payloads
  - campaign draft metadata
- `Pipeline B` now plans only against resolved baseline/support slots and tags drafts with:
  - `slot_ref`
  - `window_ref`
  - `campaign_ref`
  - `purpose`
  - `content_type`
  - `cta_text`
- support content rules are now enforced in the weekly planner prompt contract
- `publish-scheduled` now runs calendar preflight before publish/schedule execution
- the `Pipeline C` resume-path regression (`campaignWindow is not defined`) was fixed and revalidated

Still open in `M14B`:
- explicit carryover from current settings forms into the full universal model beyond the first narrow editor
- stronger planner weighting so primary ICP, primary offer, active seasonality, and default CTA dominate output more clearly
- deterministic baseline content strategy and posting-control rules for `Pipeline B`
- richer slot budgeting / support-content behavior beyond the current exclusive-window gate
- final content-strategy / distribution-rule wiring for `Pipeline B`
- UI-facing explanation surfaces remain future work even though backend decision reasons are now being produced
- current calendar UI now carries the explicit support-content control:
  - `Allow support content` maps to `support_content_allowed`
  - `Allow creative deviation` remains design-only

Post-`M14B` cleanup completed:
- the temporary UI-to-DB event-type translation shim around `academic_calendar.event_type` has been removed
- the physical calendar event-type contract now matches the universal UI/domain values:
  - `launch`
  - `promotion`
  - `seasonal`
  - `community`
  - `deadline`
  - `other`

Locked interpretation for the next `M14B` sub-slice:
- `Pipeline B` drift is not a prompt-tuning problem first
- it is a missing deterministic contract problem
- the next config expansion must therefore include:
  - baseline content strategy / distribution rules
  - campaign-calendar coordination rules between B and C
- these remain part of `M14B`, not a separate milestone family, because they extend the same business-truth / planning-truth layer

Rollback boundary:
- config tables and read helpers can be removed without disturbing existing marketing pipelines

## M14UI1 - Shared Workspace Shell
Status:
- in progress

Goal:
- adopt the new generative `samm` shared-workspace shell in narrow slices without replacing the live app wholesale

In scope:
- lowercase `samm` brand treatment remains intact
- adopt the new shared workspace shell from `samm 2.0 UI`
- keep `/samm` as the primary coordination surface
- preserve existing live routes and backend contracts
- use current `M.A.S UI` as grounding for missing operational details

Out of scope:
- full app rewrite
- replacing all old pages at once
- backend contract rewrites just to fit the UI

Acceptance criteria:
- `/samm` uses the new shared-workspace shell
- the old UI remains available as the reference source for missing surfaces
- no existing operational page is lost during adoption

Additional locked interpretation:
- the packaged UI shell is reusable
- its page/service layer is not production-ready
- `M14UI1` must therefore start with shell adoption plus a frontend adapter seam, not a straight page transplant

Delivered in first slice:
- live app layout now uses the new shared-workspace shell foundation instead of the old bespoke layout wrapper
- shell foundation includes:
  - new sidebar component
  - new inspector-panel seam
  - new workspace-shell wrapper
- first frontend adapter contracts now exist in the live app for:
  - widget descriptors
  - inspector payloads
  - message parts
  - calendar windows / slots
  - decision reasons
  - linked content refs
- this slice intentionally does not migrate any marketing page logic yet
- all current marketing pages still run against the live backend inside the new shell

Checkpoint result:
- `npm run build` passed in `M.A.S UI`
- this slice is layout / adapter foundation only
- no marketing page logic was ported to prototype mock services

## M14UI2 - Tool-First Thread And Widgets
Status:
- planned

Goal:
- make the `samm` thread a native shared workspace with structured cards/widgets, not a plain chat transcript

Problem statement:
- `/samm` conversation persistence was not solved before `M14`
- it remains intentionally unsolved after `M14A` / `M14A.1`
- this milestone is where persistent thread rendering should be addressed in the UI layer

In scope:
- thread-level widget rendering
- inspector / companion panel patterns
- quick actions and suggested next moves
- persistence-aware conversation thread rendering

Out of scope:
- CRM / Sales implementation
- replacing inbox/content/calendar/metrics logic

Acceptance criteria:
- coordinator outputs can render as structured workspace objects
- cards/widgets can coexist with conversation naturally
- `/samm` feels like a shared operational workspace, not a stateless chatbot

Additional locked interpretation:
- the thread must evolve toward typed message parts and widget envelopes
- do not bind the new `/samm` page directly to prototype mock-service types
- inspector payloads must reflect live backend objects

First validated slice now in code:
- `/samm` is the first real marketing surface migrated inside the new shell
- it remains wired to the live `coordinator-ingress` backend path
- coordinator responses now expose inspectable workspace objects in the shell:
  - status pills for queued/completed/failed runtime actions
  - shared inspector payloads for coordinator decisions/failures
  - existing human confirmation controls remain intact
- thread persistence is still intentionally pending

## M14UI3 - Operational Surface Carryover
Status:
- planned

Goal:
- carry forward the missing operational/admin surfaces from the current UI into the new shell as needed

In scope:
- `Operations -> Manual`
- `Operations -> Settings`
- current config forms as grounding for the expanded config model
- any trust/audit surfaces still missing in the new UI

Out of scope:
- silent feature removal
- broad redesign of operational logic without milestone approval

Acceptance criteria:
- no critical current operational surface is lost in the new UI adoption
- old UI is only used as grounding / carryover reference, not as the long-term product direction

## M14UI4 - Marketing Surface Migration
Status:
- planned

Goal:
- migrate the validated marketing system into the new UI before CRM / Sales implementation resumes

In scope:
- inbox
- content registry
- metrics
- calendar migration path
- route-by-route marketing carryover into the new shell
- backend adapter alignment for marketing objects

Out of scope:
- CRM implementation
- Sales implementation
- full Calendar Studio UI in one slice
- replacing every old page at once

Acceptance criteria:
- marketing surfaces run inside the new shell against the live backend
- no page depends on prototype mock services
- object contracts are adapter-backed and inspectable
- marketing workflows are stable enough that CRM / Sales can later layer on top cleanly

Current validated slices:
- `/samm` is migrated into the new shell with inspectable coordinator runtime state
- `Inbox` is now the second migrated marketing surface inside the new shell
- `Inbox` remains wired to the live approval backend path
- inbox items now expose inspector-openable workspace objects while preserving:
  - existing approve / reject / mark-read behavior
  - existing pipeline resume behavior
  - existing expanded inline detail rendering
- `Content Registry` is now the third migrated marketing surface inside the new shell
- content items and design briefs now expose inspector-openable workspace objects while preserving:
  - existing approve / reject / retry / edit behavior
  - existing batch-approve and pipeline resume behavior
  - existing expanded inline review/edit surfaces
- `Metrics` is now the fourth migrated marketing surface inside the new shell
- the old placeholder analytics message has been replaced with live org-scoped metrics cards backed by:
  - `useListMetrics`
  - `useGetMetricsSparklines`
- metrics cards now expose inspector-openable workspace objects while preserving live dashboard truth
- `Calendar` is now the fifth migrated marketing surface inside the new shell
- the page remains live-backed on the current calendar query/mutation path
- event cards now expose inspector-openable workspace objects and surface campaign-state badges for:
  - support content allowed
  - creative deviation
  - campaign-window event types
- full Calendar Studio remains intentionally out of scope for this slice

## M14C - CRM P1
Status:
- planned

Goal:
- create deterministic contact truth from signals before outreach exists

In scope:
- `contacts`
- `contact_signals`
- `contact_scores`
- `contact_segments`
- `trigger_queue`

Out of scope:
- outreach execution
- attribution
- sales sequencing

Locked rule:
- no auto-merge when strong identifiers disagree

Acceptance criteria:
- interactions can be persisted as signals
- signals can produce bounded scores/segments/triggers
- merge behavior follows documented precedence and uncertainty rules

Rollback boundary:
- CRM P1 state can be reverted without disturbing config or memory foundations

Execution note:
- `M14C` is paused until the `M14UI*` marketing migration track reaches a stable checkpoint
- do not start CRM implementation work while marketing still depends on the old shell as the primary surface

## M15D - Validation Foundations
Status:
- planned

Goal:
- establish explicit validation before outreach, sales, or learning commit external or derived state

In scope:
- input completeness validation
- policy validation
- calendar preflight
- offer/discount validation
- publish/send policy validation
- commit validation hooks

Out of scope:
- full outreach automation
- full sales automation
- pattern promotion

Acceptance criteria:
- no new external-action path can bypass validation
- validators are explicit modules/contracts, not scattered conditionals

Rollback boundary:
- validation helpers can be reverted independently of CRM/Sales layers

## M14D - CRM P2
Status:
- planned

Goal:
- add policy-driven outreach decisions after CRM P1 and validation foundations exist

In scope:
- `outreach_decisions`
- `outreach_messages`
- `template_families`
- send/no-send logic driven by policy

Out of scope:
- final multi-channel rollout
- autonomous message sending without policy gates

Acceptance criteria:
- raw signals do not send directly
- template families constrain outbound phrasing structure
- outreach decisions are explainable and policy-backed

## M15A - Sales S1
Status:
- planned

Goal:
- make offer selection explicit and deterministic

In scope:
- `offer_decisions`
- no-offer / nurture fallback
- discount-policy integration

Out of scope:
- sequence execution
- free-form offer invention

Acceptance criteria:
- no sales motion proceeds without an explicit offer decision
- offer decisions only reference structured config and policy

## M14E - CRM P3
Status:
- planned

Goal:
- track outcomes and attribution after outreach and offer logic exist

In scope:
- `outcomes`
- attribution windows / normalized attribution inputs
- channel/template performance inputs

Out of scope:
- pattern promotion
- advanced experimentation

Acceptance criteria:
- positive and negative outcomes are first-class
- attribution is time-bounded and structured

## M15B - Sales S2
Status:
- planned

Goal:
- run structured conversion sequences rather than isolated sales pings

In scope:
- `sales_sequences`
- `sequence_steps`
- `sequence_executions`
- branching and stop conditions

Out of scope:
- experimentation engine
- unbounded autonomous selling

Acceptance criteria:
- sequences have explicit steps, timing, and stop conditions
- sequence execution status is durable and inspectable

## M15C - Pattern Learning Layer
Status:
- planned

Goal:
- learn structured reusable patterns, not free-form “winning posts”

In scope:
- `content_items`
- `content_patterns`
- `pattern_performance`
- `baseline_metrics`

Out of scope:
- unthresholded auto-promotion
- opaque heuristic learning

Prerequisite:
- learning thresholds must be documented before implementation starts

Acceptance criteria:
- sent/published items are structurally tagged
- pattern performance is contextual and thresholded

## M15E - Conversation Guardrails
Status:
- planned

Goal:
- keep `SAMM` conversationally useful without drifting out of domain

In scope:
- conversation state
- north-star tracking
- topic bounds
- safe fallback / redirect logic
- reply family selection

Out of scope:
- general-purpose assistant behavior
- broad personal memory

Acceptance criteria:
- coordinator can answer and steer without drifting
- future conversation state can reuse existing `conversation_threads` fields

## M16A - Pipeline Standardization
Status:
- planned

Goal:
- gradually normalize Pipeline B/C onto explicit engine-driven contracts without a big-bang rewrite

In scope:
- move B/C toward explicit step contracts
- align with shared engine step families
- preserve current behavior while normalizing contracts

Out of scope:
- immediate full rewrite of all pipelines

Acceptance criteria:
- B/C become more inspectable and resumable through shared contracts
- behavior remains stable while internals standardize

## Deferred Work
Do not pull these into the current critical path:
- MCP / Apps SDK integration
- external workspace integration
- creative add-on agents
- advanced experimentation engine
- generalized multi-model orchestration

## Implementation Rule
No code starts for a milestone until:
- ambiguity is closed in docs
- acceptance criteria are written
- in-scope and out-of-scope are locked
- rollback boundary is clear

The next allowed implementation slice is:
- UI migration reset only:
  - treat the packaged `samm 2.0 UI/artifacts.zip -> artifacts/samm` app as the actual frontend target
  - stop extending the hybrid old-page carryover path as the primary migration strategy
  - preserve the current hybrid shell/carryover work only as a rollback-safe checkpoint
  - replace packaged mock services/types through live adapter layers
  - keep live backend contracts stable
  - do not begin CRM / Sales implementation during this slice

Reordered immediate milestone queue:
- `M14UI1` `Shared Workspace Shell`
- `M14UI2` `Tool-First Thread And Widgets`
- `M14UI3` `Operational Surface Carryover`
- `M14UI4` `Marketing Surface Migration`
- `M14C` `CRM P1`
- `M15D` `Validation Foundations`
- `M14D` `CRM P2`
- `M15A` `Sales S1`
- `M14E` `CRM P3`
- `M15B` `Sales S2`
- `M15C` `Pattern Learning Layer`
- `M15E` `Conversation Guardrails`
- `M16A` `Pipeline Standardization`

Current UI migration clarification:
- the validated hybrid shell/carryover work remains useful and should not be discarded casually
- however, it is no longer the target end-state for the marketing migration
- the target end-state is the actual packaged `samm` frontend, rebound to the live backend/runtime
- no more major page-carryover slices should be started until that packaged-app reset is underway

Current UI reset checkpoint:
- the packaged `samm` app has been materialized in-repo at `M.A.S UI/packaged-target/samm/*`
- the live app still builds after this extraction
- the next allowed UI code slices must target that packaged tree and its adapter replacement work

Latest UI adapter checkpoint:
- the first packaged-target live adapter now exists for `/samm`
- packaged `SammPage` no longer depends on the packaged mock service path
- packaged target now has a standalone in-repo `tsconfig.json`
- packaged target passes a direct typecheck checkpoint before broader route rewiring continues
- packaged `InboxPage` and `ApprovalQueueWidget` now use a live adapter service:
  - `M.A.S UI/packaged-target/samm/src/services/liveInboxService.ts`
- packaged inbox actions now hit the real approval/read/reject path and preserve resume side effects for:
  - `pipeline-b-weekly`
  - `pipeline-c-campaign`
- packaged `ContentPage` and `ContentBatchReviewWidget` now use a live adapter service:
  - `M.A.S UI/packaged-target/samm/src/services/liveContentService.ts`
- packaged content actions now hit the real content registry path and preserve resume side effects for:
  - `pipeline-b-weekly`
  - `pipeline-c-campaign`
- packaged content rendering now supports live marketing channels directly:
  - `facebook`
  - `whatsapp`
  - `youtube`
  - `email`
  - `design_brief`
- packaged `MetricsPage` now uses a live adapter service:
  - `M.A.S UI/packaged-target/samm/src/services/liveMetricsService.ts`
- packaged metrics now read the real `platform_metrics` snapshot table and derive:
  - KPI cards
  - channel performance rows
  - signup/reach sparkline data
  - packaged `samm` summary copy
  - lightweight detected pattern cards
- packaged `CalendarPage` now uses a live adapter service:
  - `M.A.S UI/packaged-target/samm/src/services/liveCalendarService.ts`
- packaged calendar now reads the real `academic_calendar` table and renders:
  - live event/window cards
  - support-content and creative-deviation notes
  - a dedicated calendar event inspector widget instead of the generic widget fallback
- packaged `OperationsPage` now uses a live adapter service:
  - `M.A.S UI/packaged-target/samm/src/services/liveOperationsService.ts`
- packaged operations overview now reads the live runtime and renders:
  - real pipeline health cards
  - real recent pipeline runs
  - real trigger actions for pipelines A/B/C
- packaged operations settings now use a live summary adapter:
  - `M.A.S UI/packaged-target/samm/src/services/liveSettingsSummaryService.ts`
- packaged settings now show the real workspace state for:
  - organisation details
  - brand voice
  - visual brand
  - connections
  - audience/offers/seasonality counts
  - campaign + approval defaults
- packaged manual now reuses the fuller carryover operations manual from the live app:
  - `M.A.S UI/src/pages/agent/manual.tsx`
- packaged Operations is now effectively complete enough for day-to-day marketing use:
  - live overview
  - live settings summary
  - full manual carryover
- latest packaged polish slice closes the remaining missing-controls gap by running fuller live carryover editors inside the packaged shell:
  - packaged `Content` now reuses `M.A.S UI/src/pages/content.tsx`
  - packaged `Calendar` now reuses `M.A.S UI/src/pages/calendar.tsx`
  - packaged `Operations -> Settings` now reuses `M.A.S UI/src/pages/agent/settings.tsx`
- this restores the packaged-runtime controls that were still missing:
  - settings input fields
  - calendar add/edit/delete
  - support-content toggle
  - creative-deviation toggle
  - content edit
  - image upload
  - approve all
  - design brief edit/share
  - sidebar sign-out

Latest packaged-runtime checkpoint:
- `M.A.S UI` now exposes a dedicated packaged-app runtime target:
  - `npm run dev:packaged`
  - `npm run build:packaged`
  - `npm run serve:packaged`
  - `npm run typecheck:packaged`
- `vite.packaged.config.ts` boots the materialized packaged app from:
  - `M.A.S UI/packaged-target/samm/*`
- current fallback runtime is unchanged:
  - `npm run dev` still serves the existing hybrid/live app
- checkpoints passed:
  - `npm run build`
  - `npm run build:packaged`
  - `npm run typecheck:packaged`
- packaged runtime now has its own auth gate and login route, so the packaged app no longer boots directly into live queries with a missing session
- packaged runtime now also includes compatibility proxy modules so live carryover editors can run inside the packaged shell without duplicating backend contracts:
  - `M.A.S UI/packaged-target/samm/src/lib/api.ts`
  - `M.A.S UI/packaged-target/samm/src/lib/supabase.ts`
  - `M.A.S UI/packaged-target/samm/src/lib/workspace-adapter.ts`
  - `M.A.S UI/packaged-target/samm/src/components/layout.tsx`
