# SAMM Implementation Roadmap

## Purpose
This document is the milestone source of truth for `samm 2.0`.

The current strategy is:
- preserve the active scheduler-first marketing core
- weave in the missing deterministic layers
- keep the build Supabase-first
- stay single-server only until a blocker forces a controlled split
- execute in narrow, reversible milestone slices

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
- planned

Goal:
- turn business truth into deterministic structured config before outreach or sales automation expands

In scope:
- `icp_categories`
- `offer_catalog`
- `seasonality_profile`
- `discount_policies`
- `outreach_policy`
- `campaign_defaults`
- `approval_policy`

Out of scope:
- free-form discount overrides
- live outreach
- live sales decisions

Acceptance criteria:
- pipelines can reference structured config instead of redefining business truth in prompts
- low/high demand and discount rules come from config, not model inference
- campaign planning can read neutral `campaign_calendar` domain wrappers over physical `academic_calendar`

Rollback boundary:
- config tables and read helpers can be removed without disturbing existing marketing pipelines

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
- `M14A.1` only
