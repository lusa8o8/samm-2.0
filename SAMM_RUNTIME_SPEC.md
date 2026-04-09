# SAMM Runtime Spec

## Purpose
`samm` is the coordinating runtime for the product, not just a chat endpoint. Its job is to observe workspace state, decide what should happen next, request or execute bounded actions, and report back to the operator in a way that is inspectable and controllable.

The runtime should be boringly effective:
- prefer inspection over guessing
- prefer reversible actions over irreversible ones
- separate reasoning from execution
- keep operator trust higher than novelty
- expose failure honestly

## Runtime Loop
The current `samm` loop is:

1. Receive operator input.
2. Append the input to the active frontend session.
3. Build runtime context from:
   - recent session history
   - workspace memory and configuration
   - enabled capabilities/modules
   - current operational state
4. Expire stale `pipeline_runs` rows before action planning.
5. Resolve explicit status and run requests through the scheduler path first.
6. If no explicit scheduler action is needed, ask the coordinator model for the next step.
7. If no action is needed, finish the turn with a direct response.
8. If an action is requested, execute only scheduler-approved actions.
9. Return a structured response with status, suggestions, and action metadata.
10. Stop when a terminal response or a hard limit is reached.

## Runtime Inputs
Every turn should be able to draw from these inputs:
- operator message
- session history
- workspace identity
- org configuration
- inbox state
- recent pipeline runs
- metrics snapshot
- upcoming trigger events
- capability flags
- prior scheduler results in the same turn when available

## Runtime Outputs
A runtime turn should produce one of four outcomes:
- direct answer
- clarifying question
- confirmation request
- action result

All operator-facing responses should be structured enough to support UI affordances such as:
- confirmation cards
- suggested follow-up actions
- status notices
- execution summaries
- deterministic pipeline status messaging

## Layers
The runtime is currently split into these layers.

### 1. Session Layer
Responsible for:
- storing the current conversation state in the UI
- sending recent history to the runtime
- preserving enough context for continuity across turns

Current status:
- frontend-managed only
- no persisted runtime session store yet

### 2. Context Builder
Responsible for:
- selecting relevant workspace state
- shaping it into a compact prompt payload
- avoiding raw overstuffing of tables or logs

Current status:
- implemented inline in `coordinator-chat`
- reads from `org_config`, `platform_metrics`, `pipeline_runs`, `academic_calendar`, and `human_inbox`
- now uses stale-run-adjusted pipeline state instead of raw rows

### 3. Coordinator Model
Responsible for:
- deciding whether to answer, ask, confirm, or act
- selecting which workflow should be used next
- staying inside the response contract

Current status:
- single Anthropic call in `coordinator-chat`
- only used after explicit scheduler-first checks
- configured with `claude-sonnet-4-20250514`

### 4. Scheduler
Responsible for:
- validating requested actions
- checking whether confirmation is required
- expiring stale running rows before action execution
- enforcing bounded pipeline execution behavior
- returning structured execution results with concrete status

Current status:
- implemented inline inside `coordinator-chat`
- covers explicit pipeline status checks
- covers explicit pipeline run requests
- returns deterministic `invoked_action` metadata including `run_id` when available
- marks stale `running` rows as `failed` after the runtime window

### 5. Operator Response Formatter
Responsible for:
- turning the final runtime result into UI-friendly objects
- preserving calm, direct, non-hyped language
- showing failures without hiding them

Current status:
- backend returns `message`, `suggestions`, optional `confirmation`, and optional `invoked_action`
- frontend surfaces backend error payloads instead of generic non-2xx failures

## Hard Controls
The runtime should always enforce bounded execution.

Current enforced controls:
- stale `running` pipeline rows are failed after 10 minutes
- one pipeline invocation is returned per request path
- explicit status checks do not invoke pipelines
- mutation actions still require explicit intent or confirmation flow

Recommended next controls:
- `maxCoordinatorTurnsPerRequest`
- `maxToolCallsPerTurn`
- `maxSessionMessages`
- `maxContextTokens`
- `maxConsecutiveFailures`
- `requiresConfirmationForMutations`
- `maxPipelineInvocationsPerRequest`

Recommended defaults for the current stage:
- `maxCoordinatorTurnsPerRequest = 3`
- `maxToolCallsPerTurn = 2`
- `maxSessionMessages = 12`
- `maxConsecutiveFailures = 2`
- `requiresConfirmationForMutations = true`
- `maxPipelineInvocationsPerRequest = 1`

## Action Classes
`samm` actions should be grouped by risk.

### Read Actions
Safe by default.
Examples:
- inspect inbox summary
- inspect recent runs
- inspect metrics
- inspect upcoming events
- inspect pipeline status

### Soft Mutations
Visible, reversible, or low-risk actions.
Examples:
- draft a plan
- prepare a campaign brief
- queue a recommendation

### Hard Mutations
Anything that can change real operational state or trigger automation.
Examples:
- run a pipeline
- publish content
- send outbound messages
- write to external APIs

Hard mutations should require either:
- explicit operator confirmation
- or a trusted policy that has already been opted into

## Failure Behavior
When something fails, `samm` should:
- report the failure clearly
- avoid pretending success
- surface the failing layer when possible
- suggest the next best action

Good failure modes:
- "I could not load recent runs."
- "I could not trigger Pipeline A because the function returned an error."
- "Run Pipeline A last failed at 09 Apr, 5:30. Marked stale after exceeding runtime window."
- "I need confirmation before I run that workflow."

## Current Stable State
The current stable runtime now has:
- deployed `coordinator-chat` scheduler-first handling for pipeline status and run requests
- stale-run expiry persisted into `pipeline_runs`
- deterministic `Pipeline A` execution rows that transition from `running` to `success` or `failed`
- Operations overview reading `pipeline_runs` without the old `created_at` ordering bug
- frontend error normalization that surfaces backend JSON failures in chat

## Evolution Path
### Current State
- one-shot coordinator chat function with a bounded inline scheduler
- reads shared state directly
- explicit status checks and pipeline triggers routed through scheduler logic
- deterministic Pipeline A runtime behavior verified in production-like usage

### Next State
- extract scheduler logic into a dedicated module
- introduce normalized scheduler request and result types
- add capability gating and per-request hard-limit enforcement
- return scheduler state directly to the UI for polling by `run_id`

### Later State
- dedicated runtime module separate from UI wiring
- memory and context summarization
- richer tool registry
- external API execution through scheduler-approved actions
