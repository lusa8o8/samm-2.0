# SAMM Implementation Roadmap

## Purpose
This document is the milestone source of truth for `samm 2.0`.

The current strategy is:
- preserve the active scheduler-first marketing core
- weave in the missing deterministic layers
- keep the build Supabase-first and single-server for now
- execute in narrow, reversible milestone slices

## Current Stable Baseline
Stable through `M13I` on `main`.

Current backbone to preserve:
- `coordinator-chat` as the active coordinator runtime
- `scheduler.ts` as the control-plane authority
- pipelines `A / B / C / D` plus `publish-scheduled`
- `_shared/*` as the reusable runtime layer
- Supabase as the durable truth for org state, runs, approvals, content, calendar, and metrics

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
- planned

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

Rollback boundary:
- tables and runtime wiring can be reverted without touching CRM, Sales, or UI architecture

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
- split worker architecture
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
- `M14A` only
