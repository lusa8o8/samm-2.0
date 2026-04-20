# SAMM Full System Architecture

## Purpose
This document defines the `samm 2.0` target architecture.

It is the system-design source of truth for how:
- `samm`
- the scheduler
- pipelines
- memory
- structured config
- CRM
- Sales
- learning
- validation
- and future channel routing

should fit together while staying:
- Supabase-first
- single-server for now
- deterministic
- inspectable
- resumable
- hard to break accidentally

## Design Principles
The architecture follows these rules:
- scheduler first, never model first for operational state
- state is the source of truth
- pipelines are explicit named workflows
- agents are bounded workers, not orchestration layers
- integrations plug in through adapters
- humans remain first-class gatekeepers where risk is real
- every meaningful mutation is traceable through persisted state
- adding channels or agents should not require runtime rewrites
- `SAMM` memory is structured operational memory, not generic AI memory

## Top-Level System Model

```text
USERS / TEAMS
dashboard / whatsapp / email / future channels
        |
        v
CHANNEL ADAPTER LAYER
receive_message / send_message / approvals
        |
        v
SAMM COORDINATOR
(current active runtime: coordinator-chat)
        |
        +--> SAMM MEMORY LAYER
        |    conversation_threads / coordinator_tasks / coordinator_obligations / channel_routes
        |
        +--> SCHEDULER LAYER
        |    run admission / stale expiry / pause-resume / policy enforcement
        |
        +--> CONFIG + CALENDAR + POLICY LAYER
        |    org config / campaign calendar / offers / seasonality / outreach policy
        |
        +--> PIPELINE ENGINE
        |    A / B / C / D / publish-scheduled / future standardized workflows
        |
        +--> HUMAN TASK LAYER
        |    current: human_inbox
        |
        +--> VALIDATION LAYER
        |    completeness / policy / calendar / offer / outreach / publish / commit checks
        |
        +--> AGENT LAYER
        |    bounded workers via registry
        |
        +--> TOOL / ACTION LAYER
             integration adapters / publish / fetch / send

All durable truth persists in Supabase.
Learning and outcome tracking sit on top of CRM + Sales rather than replacing them.
```

## Current Backbone To Preserve
The current build already has the right control-plane foundation:

- `coordinator-chat` as active runtime
- `scheduler.ts` as control-plane authority
- pipelines `A / B / C / D` plus `publish-scheduled`
- shared modules:
  - `agent-registry`
  - `integration-registry`
  - `pipeline-engine`
  - `llm-client`
  - `pipeline-run-status`
  - `publish-content`
  - `org-capabilities`
- Supabase as durable truth for:
  - `org_config`
  - `pipeline_runs`
  - `content_registry`
  - `human_inbox`
  - physical `academic_calendar`
  - `platform_metrics`
  - `ambassador_registry`

This is not a rebuild plan.
It is a weave-in plan.

## Execution Boundary
The execution rule stays simple:
- runtime interprets
- scheduler decides
- pipeline engine executes
- agents produce bounded work
- adapters touch external systems
- state access persists truth

Anything that violates this boundary makes the system harder to trust.

## Missing Layers To Weave In

### 1. SAMM Memory Layer
Purpose:
- remember what `SAMM` was asked
- remember what `SAMM` decided
- remember what `SAMM` still owes back
- preserve the return path for future follow-up

Core objects:
- `conversation_threads`
- `coordinator_tasks`
- `coordinator_obligations`
- `channel_routes`

This is the first `samm 2.0` foundational layer and corresponds to `M14A`.

### 2. Structured Config Expansion
Purpose:
- move business truth out of prompts and free text

Core objects:
- `icp_categories`
- `offer_catalog`
- `seasonality_profile`
- `discount_policies`
- `outreach_policy`
- `campaign_defaults`
- `approval_policy`

This is `M14B`.

### 3. CRM Layer
Purpose:
- turn raw interaction signals into deterministic contact truth and controlled outreach logic

Phases:
- `CRM P1` scoring / segmentation / trigger detection
- `CRM P2` outreach decisions and rendered messages
- `CRM P3` outcomes and attribution

This corresponds to:
- `M14C`
- `M14D`
- `M14E`

### 4. Sales Layer
Purpose:
- make offer selection and conversion progression explicit

Phases:
- `Sales S1` offer engine
- `Sales S2` sequence engine

This corresponds to:
- `M15A`
- `M15B`

### 5. Learning Layer
Purpose:
- learn structured patterns, not free-form “good post” folklore

Core objects:
- `content_items`
- `content_patterns`
- `pattern_performance`
- `baseline_metrics`

This corresponds to `M15C`.

### 6. Validation Layer
Purpose:
- stop unvalidated LLM output from becoming truth or external action

Validator families:
- input completeness
- policy validation
- calendar preflight
- offer / discount validation
- outreach validation
- publish validation
- commit validation

This corresponds to `M15D` and is intentionally moved earlier in implementation order.

### 7. Conversation Guardrails
Purpose:
- keep `SAMM` useful, scoped, and operationally aligned

Core ideas:
- conversation state
- north-star tracking
- topic bounds
- safe fallback / redirect logic
- template family selection

This corresponds to `M15E`.

## Calendar Domain Naming
The physical database table remains:
- `academic_calendar`

The neutral domain concept for docs and code wrappers is:
- `campaign_calendar`

Do not rename the physical table in this phase.

## Human Gate Contract
Human gates remain persisted scheduler events, not chat-only interruptions.

Current active human gate surface:
- `human_inbox`

Rule:
- create inbox rows only for actionable human decisions
- do not use `human_inbox` for every async coordinator task or passive obligation

## Pipeline Model
Pipelines should continue moving toward explicit workflow definitions.

Supported step families should include:
- `agent`
- `parallel`
- `sequential`
- `loop`
- `human_gate`
- `publish`
- `snapshot`
- `report`
- `exit`

Pipeline A already points most strongly in this direction.
Pipeline B and C should be gradually normalized there, not rewritten in one shot.

## Deterministic Decision Spine

```text
CONFIG
- ICP
- offers
- seasonality
- discounts
- outreach policy
- approvals

CALENDAR
- campaign timing
- windows
- ownership

SAMM
- asks instead of guesses
- resolves intent
- creates tasks
- creates obligations

PIPELINES
- choose from known patterns
- apply policy
- validate outputs

TOOLS / CHANNELS
- send / publish / fetch

OUTCOMES
- CRM P3
- pattern learning
- sequence learning
```

## State Ownership Direction
Supabase remains the durable truth layer.

Current core:
- `org_config`
- `pipeline_runs`
- `content_registry`
- `human_inbox`
- `academic_calendar`
- `platform_metrics`
- `ambassador_registry`

Planned additions:
- `conversation_threads`
- `coordinator_tasks`
- `coordinator_obligations`
- `channel_routes`
- `icp_categories`
- `offer_catalog`
- `discount_policies`
- `seasonality_profile`
- `outreach_policy`
- `contacts`
- `contact_signals`
- `contact_scores`
- `contact_segments`
- `trigger_queue`
- `outreach_decisions`
- `outreach_messages`
- `outcomes`
- `offer_decisions`
- `sales_sequences`
- `sequence_steps`
- `sequence_executions`
- `content_items`
- `content_patterns`
- `pattern_performance`
- `baseline_metrics`

## Current Build Order
The roadmap order is now:

1. `M14A` `SAMM Memory Layer`
2. `M14B` `Structured Config Expansion`
3. `M14C` `CRM P1`
4. `M15D` `Validation Foundations`
5. `M14D` `CRM P2`
6. `M15A` `Sales S1`
7. `M14E` `CRM P3`
8. `M15B` `Sales S2`
9. `M15C` `Pattern Learning Layer`
10. `M15E` `Conversation Guardrails`
11. `M16A` `Pipeline Standardization`

This order is intentional:
- memory first
- config before CRM
- validation before outbound automation
- learning only after structured outcomes exist

## One-Line Mental Model
`samm 2.0 = current scheduler-first marketing backend + coordinator memory + deterministic business config + CRM + Sales + learning + validators`
