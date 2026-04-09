# SAMM Full System Architecture

## Purpose
This document defines the lean target architecture for the full TSH Marketing OS. It is the system-design source of truth for how `samm`, the scheduler, pipelines, agents, integrations, state, and dashboard surfaces should fit together.

The design goal is boringly effective execution:
- predictable
- inspectable
- resumable
- modular
- easy to extend
- hard to break accidentally

## Design Principles
The system should follow these rules:
- scheduler first, never model first for operational state
- state is the source of truth
- pipelines are explicit, named workflows
- agents are bounded workers, not free-form autonomous actors
- integrations plug in through adapters
- humans are first-class gatekeepers where risk is real
- every mutation is traceable through persisted run state
- adding channels or agents should not require core runtime rewrites

## System Model
The platform should be split into six core modules.

### 1. Runtime
Owns:
- operator input
- session history handling
- context assembly
- coordinator prompting
- response shaping

Runtime responsibilities:
- receive chat input from `/samm`
- build compact state-aware context
- route explicit operational requests to the scheduler first
- call the coordinator model only when interpretation is needed
- return structured responses for UI rendering

Runtime should not:
- decide whether a pipeline is live from prompt text
- write arbitrary business state directly
- bypass scheduler policy

### 2. Scheduler
Owns:
- run admission
- stale-run expiry
- pipeline state transitions
- confirmation policy
- hard limits
- resume behavior after human gates

Scheduler responsibilities:
- inspect `pipeline_runs`
- fail stale `running` rows
- decide whether a requested run may start
- normalize run states
- return deterministic action status
- resume paused runs after approvals or rejections

Scheduler is the operational boundary.
The model may recommend actions, but only the scheduler may execute them.

### 3. Pipeline Engine
Owns:
- pipeline definitions
- step orchestration
- loop, parallel, sequential, and human-gate execution
- pipeline-level resume logic

Pipelines should be expressed as explicit workflow definitions rather than large custom logic blobs.

Supported step types should include:
- `agent`
- `parallel`
- `sequential`
- `loop`
- `human_gate`
- `publish`
- `snapshot`
- `report`
- `exit`

This gives the system resumability and makes behavior inspectable.

### 4. Agent Registry
Owns:
- agent definitions
- allowed tools
- required inputs
- produced outputs
- capability declarations

Agents are not orchestration layers. They are bounded workers used inside pipeline steps.

Each agent should declare:
- `id`
- `purpose`
- `allowed_tools`
- `required_inputs`
- `produced_outputs`
- `supports_human_gate_handoff`
- `enabled_by_capability`

Examples:
- `classifier`
- `reply_writer`
- `campaign_planner`
- `reporting_agent`
- `ambassador_checkin_agent`
- future: `research_agent`, `sales_agent`

### 5. Integration Registry
Owns:
- external platform adapters
- capability mapping per platform
- authentication/config requirements
- provider-specific implementation details

The core runtime should not know Facebook-specific or TikTok-specific behavior.
It should only ask for capabilities.

Example channel capabilities:
- `fetch_comments`
- `post_reply`
- `publish_post`
- `fetch_metrics`
- `send_message`
- `fetch_signups`

Example adapters:
- `facebook`
- `whatsapp`
- `youtube`
- `email`
- `studyhub`
- later `linkedin`
- later `tiktok`

If a platform does not support a capability, the adapter should return `unsupported`, not force custom scheduler logic.

### 6. State Access Layer
Owns:
- all reads and writes to shared tables
- state shaping for runtime and pipelines
- mutation helpers
- audit-safe persistence rules

Agents and pipelines should not query raw tables directly.
They should call state access helpers.

This is what keeps the system lean and prevents business logic from scattering across functions.

## Execution Boundary
The execution rule is simple:
- runtime interprets
- scheduler decides
- pipeline engine executes
- agents produce bounded work
- adapters touch external systems
- state access persists truth

Anything that violates this boundary will make the system harder to trust.

## Runtime Flow
The target runtime flow is:
1. Receive operator input.
2. Append to session.
3. Build context from recent session, workspace state, and capabilities.
4. Let scheduler resolve explicit operational requests first.
5. If no scheduler action applies, ask coordinator model for next step.
6. Route any mutation back through scheduler.
7. Execute approved pipeline steps.
8. Persist state changes.
9. Return structured response with suggestions and action status.

## Pipeline State Machine
Every pipeline run should follow a normalized lifecycle:
- `queued`
- `running`
- `waiting_human`
- `resumed`
- `success`
- `failed`
- `cancelled`

Current verified state:
- `running`
- `success`
- `failed`

Required next state:
- `waiting_human`
- `resumed`
- `cancelled`

This state machine should be the same for Pipeline A, B, C, and future pipelines.

## Human Gate Contract
Human gates should be modeled as persisted scheduler events, not chat-only interruptions.

Contract:
1. Pipeline reaches a `human_gate` step.
2. Scheduler writes pending gate state.
3. UI exposes the task through Inbox or Content.
4. Human action resolves the gate.
5. Scheduler resumes the pipeline from the paused step.

This is required for:
- Pipeline B content approval
- Pipeline C CEO campaign-brief approval
- future sales, research, and compliance review loops

## Current Pipelines In This Model

### Coordinator
Role:
- read operational state
- decide which workflows need attention
- answer questions
- trigger scheduler-approved pipelines

It should remain small and boring.
It is not where pipeline business logic should live.

### Pipeline A: Daily Engagement
Shape:
- scheduled daily
- loop over inbound comments
- route each comment through bounded classification and response logic
- run poll posting and ambassador check-ins in parallel
- snapshot performance data
- finish with a persisted run result

Pipeline A is the first candidate for full declarative pipeline conversion because it already proved the runtime stability issues most clearly.

### Pipeline B: Weekly Publishing
Shape:
- scheduled weekly
- parallel fetch stage
- sequential planning and draft creation
- human gate for draft review
- publish approved content
- ambassador update
- report generation

Pipeline B needs resumable human-gate handling more than new model sophistication.

### Pipeline C: Campaign Engine
Shape:
- triggered by calendar events
- parallel research stage
- sequential campaign planning
- CEO approval gate
- parallel asset creation
- marketer approval gate
- scheduling and monitoring loop
- post-campaign report

Pipeline C should be designed for long-lived resumable execution from day one.

## Shared State Model
Current shared tables remain valid:
- `platform_metrics`
- `content_registry`
- `ambassador_registry`
- `academic_calendar`
- `human_inbox`
- `pipeline_runs`
- `org_config`

Recommended additions for the full system:
- `agent_runs`
- `tool_events`
- optional `human_tasks`

### agent_runs
Purpose:
- track per-agent execution inside a pipeline run
- support debugging, cost attribution, and agent-level reliability

### tool_events
Purpose:
- log every adapter call and external side effect
- support retries, observability, and auditability

### human_tasks
Purpose:
- model resumable approvals more cleanly than a generic inbox row

This can be deferred if `human_inbox` remains sufficient early on, but it should stay visible in the design.

## Extension Model
The extension target is not magic zero-code expansion. The real goal is no core runtime rewrites.

Adding a new channel should require:
- a new adapter file
- adapter registration
- config for auth/capabilities
- optional pipeline config to opt into the new channel

It should not require changes to:
- runtime core
- scheduler core
- existing agent contracts

Adding a new agent should require:
- a new agent definition
- tool registration
- pipeline wiring or policy enabling

It should not require changes to:
- runtime core
- scheduler core
- existing channel adapters

Adding a new pipeline should require:
- a new pipeline definition
- step configuration
- any new agent or adapter registrations it needs

It should not require rewriting the coordinator itself.

## Capability Gating
The system must be capability-aware per org.

Capability sources:
- `org_config`
- plan tier
- integration setup status
- feature flags

Examples:
- `facebook_enabled`
- `whatsapp_enabled`
- `youtube_enabled`
- `email_enabled`
- `campaigns_enabled`
- `ambassadors_enabled`
- `research_agent_enabled`
- `sales_agent_enabled`

This is what allows multi-client onboarding and billing enforcement without forked logic.

## Dashboard Contract
The dashboard remains the trust surface around `samm`, not a competing architecture.

### /samm
Owns:
- command input
- summaries
- suggestions
- confirmations
- execution status messaging

### Inbox
Owns:
- escalations
- approvals
- reports
- briefs
- resumable human decisions

### Content
Owns:
- drafts
- approvals
- scheduled assets
- published assets
- retries

### Operations
Owns:
- run visibility
- failures
- stale-run traces
- pipeline health
- auditability

### Settings
Owns:
- workspace config
- capabilities
- KPI targets
- brand voice
- integration setup

## Deferred Product Workstreams
These must remain inside the architecture plan, not outside it:
- multi-client onboarding
- usage metering
- billing tier enforcement
- live API adapter swaps
- capability gating
- resumable approval UX
- agent manager to operations transition completion

### Onboarding
New org onboarding should create:
- `org_config`
- default capabilities
- default KPI targets
- default pipeline settings
- default channel registry entries

### Usage Metering
Usage should be attributable to:
- pipeline run
- agent run
- tool event
- org

### Billing Enforcement
Billing should gate:
- enabled channels
- enabled agents
- run frequency
- premium workflows
- data retention or observability depth if needed

## Implementation Order
The boringly effective order is:
1. extract scheduler from `coordinator-chat`
2. define the shared pipeline run state machine
3. define agent registry contracts
4. define integration adapter contracts
5. convert Pipeline A to the declarative engine shape
6. add resumable human gates for Pipeline B
7. add resumable long-window execution for Pipeline C
8. add onboarding templates and capability gating
9. add usage metering and billing enforcement
10. wire real external APIs behind adapters

## What Not To Do
Do not:
- build a generic autonomous multi-agent swarm
- let agents write directly to raw tables from arbitrary places
- couple platform logic to scheduler logic
- let prompts become the source of operational truth
- wire many live APIs before adapter contracts are stable
- lose track of onboarding, billing, and approval flows while building agent infrastructure

## Summary
The target system is:
- `samm` as the coordination runtime
- scheduler as the execution boundary
- pipelines as explicit resumable workflows
- agents as bounded registered workers
- integrations as adapter-driven capabilities
- state as the persisted source of truth
- dashboard surfaces as trust, approval, and inspection layers

That is the lean, predictable, and extensible foundation for the full agent system.
