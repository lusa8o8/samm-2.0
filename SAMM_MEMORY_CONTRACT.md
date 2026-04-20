# SAMM Memory Contract

## Purpose
This document defines the `M14A` memory-layer contract for `samm 2.0`.

The goal is to give `SAMM` durable operational memory for:
- conversation continuity
- async work tracking
- follow-up obligations
- route-aware future follow-up

This is not generic AI memory.
It is structured operational memory only.

## Scope
This contract covers:
- `conversation_threads`
- `coordinator_tasks`
- `coordinator_obligations`
- `channel_routes`

## M14A Boundary
`M14A` includes:
- schema
- read/write contracts
- coordinator write paths
- scheduler linkage to task lifecycle

`M14A` excludes:
- outbound follow-up delivery
- reminder execution
- multi-channel sending
- CRM
- Sales
- obligation firing engine
- UI overhaul

## Core Objects

### `conversation_threads`
Purpose:
- preserve scoped conversation state per route/thread

Minimum fields:
- `id`
- `org_id`
- `channel`
- `external_conversation_id`
- `external_thread_id` nullable
- `external_user_id` nullable
- `current_state` nullable
- `current_goal` nullable
- `last_message_at`
- `recent_summary` nullable
- `active_task_id` nullable
- `created_at`
- `updated_at`

Rules:
- a thread tracks operational conversation continuity, not free-form personal memory
- `current_state`, `current_goal`, and `recent_summary` exist now to avoid future schema regret for guardrails

### `coordinator_tasks`
Purpose:
- durable ledger of meaningful work initiated or promised by `SAMM`

Minimum fields:
- `id`
- `org_id`
- `created_by_user_id` nullable
- `source_channel`
- `source_conversation_id`
- `source_thread_id` nullable
- `source_message_id` nullable
- `task_type`
- `request_text`
- `resolved_intent` nullable
- `requested_pipeline` nullable
- `linked_pipeline_run_id` nullable
- `linked_human_task_id` nullable
- `status`
- `current_summary`
- `result_summary` nullable
- `followup_route_id` nullable
- `created_at`
- `updated_at`
- `completed_at` nullable

### Allowed task status values
Controlled string set:
- `new`
- `admitted`
- `running`
- `waiting_human`
- `completed`
- `failed`
- `cancelled`

Rule:
- these are lifecycle values, not free-form labels
- status authority remains limited to the control plane and explicit resume/cancel/terminal paths

### Allowed `task_type` values
Controlled string set:
- `pipeline_run`
- `approval_request`
- `status_check`
- `summary_request`
- `calendar_followup`
- `content_review`
- `manual_action`
- `system_notice`

Rule:
- unknown values must be rejected in domain validation
- do not use a DB enum in `M14A`

### Task status authority
Only these may mutate `coordinator_tasks.status`:
- `coordinator-chat`
- `scheduler`
- explicit pipeline resume / cancel / terminal-state paths

Agents must not mutate task lifecycle directly.

### `coordinator_obligations`
Purpose:
- durable record of what `SAMM` still owes back

Minimum fields:
- `id`
- `org_id`
- `coordinator_task_id`
- `trigger_type`
- `trigger_ref_type`
- `trigger_ref_id`
- `destination_route_id`
- `obligation_status`
- `message_template_key` nullable
- `payload` jsonb nullable
- `created_at`
- `fired_at` nullable

### Allowed obligation status values
Controlled string set:
- `pending`
- `fired`
- `cancelled`

### `trigger_type` contract
Contract values:
- `on_success`
- `on_failure`
- `on_waiting_human`
- `on_stale`
- `on_cancelled`
- `on_due_time`
- `on_no_response_timeout`

`M14A` implementation values:
- `on_success`
- `on_failure`
- `on_waiting_human`
- `on_cancelled`

Placeholders only for now:
- `on_stale`
- `on_due_time`
- `on_no_response_timeout`

### `channel_routes`
Purpose:
- preserve where future follow-up should return

Minimum fields:
- `id`
- `org_id`
- `channel`
- `route_type`
- `external_user_id` nullable
- `external_conversation_id` nullable
- `external_thread_id` nullable
- `is_primary`
- `fallback_priority`
- `metadata` jsonb nullable
- `created_at`
- `updated_at`

### Channel contract
Future contract values:
- `dashboard`
- `whatsapp`
- `email`
- `slack`
- `telegram`
- `teams`

`M14A` active support:
- `dashboard`

## Behavioral Rules
1. Every meaningful async action should create a `coordinator_task`.
2. Every promised follow-up should create an obligation unless no follow-up is required.
3. `SAMM` should never initiate durable async work without a return route.
4. Threads preserve scope and summary, not generic memory.
5. Task lifecycle is control-plane state, not agent state.

## UI-Future Assumption
These objects are first-class future workspace objects.

The schema should preserve fields useful for future structured UI rendering:
- task type
- request text
- summaries
- linked run / human gate ids
- route references
- thread state / goal / summary
- obligation trigger payload

## M14A Acceptance Criteria
- `conversation_threads`, `coordinator_tasks`, `coordinator_obligations`, and `channel_routes` exist in schema
- `pipeline_runs` can link back to `coordinator_tasks`
- `coordinator-chat` creates dashboard-scoped memory context for meaningful async requests
- scheduler-created async pipeline work creates a coordinator task plus obligations
- active pipeline lifecycle paths can update linked coordinator task status
- no outbound follow-up delivery or reminder firing is implemented in this milestone
- `coordinator-chat` can create task, obligation, route, and thread records
- linked scheduler / pipeline state can update task lifecycle deterministically
- no outbound follow-up sending exists yet
- no CRM / Sales logic is mixed into the memory layer
