# SAMM Scheduler Contract

## Purpose
The scheduler is the execution boundary for `samm`. It decides whether an action may run, normalizes execution state, and prevents the coordinator model from guessing about live operational state.

## Current Contract
The current scheduler lives inline inside `coordinator-chat` and owns these responsibilities:
- inspect recent `pipeline_runs`
- expire stale `running` rows before any action decision
- answer explicit pipeline status questions deterministically
- gate new pipeline runs when a live run already exists
- invoke approved pipelines
- fetch the latest run row after invocation
- return structured execution results to the caller

## Inputs
Current scheduler inputs:
- `orgId`
- operator message
- optional `confirmationAction`
- recent `pipeline_runs`
- inferred pipeline target

## Outputs
Current scheduler outputs are runtime response objects with:
- `message`
- `suggestions`
- optional `invoked_action`

`invoked_action` shape:
- `type: 'run_pipeline'`
- `pipeline: string`
- `status: 'running' | 'completed' | 'failed'`
- `run_id?: string | null`

## Decision Order
The current scheduler decision order is:
1. Load recent runs.
2. Mark stale `running` rows as `failed` when they exceed the runtime window.
3. Resolve explicit status requests first.
4. Resolve explicit run requests next.
5. Respect cancel requests.
6. Respect confirmation requests.
7. Only then allow the coordinator model to propose an action.
8. Route model-approved mutations back through the same scheduler path.

## Stale Run Policy
Current stale-run rule:
- any `pipeline_runs` row with `status = 'running'`
- and `started_at` older than 10 minutes
- is marked `failed`
- with `result.error = 'Marked stale after exceeding runtime window'`

This rule exists so old stuck runs do not block new operator requests or pollute status narration.

## Pipeline Run Contract
For an approved run request, the scheduler should:
1. confirm no active live run remains after stale expiry
2. invoke the target pipeline function
3. reload the latest run row for that pipeline
4. return one of three outcomes:
   - `running`
   - `completed`
   - `failed`

The scheduler should not narrate guessed state when a concrete run row is available.

## Status Contract
For an explicit status request, the scheduler should:
- return the latest run for the requested pipeline
- prefer persisted state over model-generated narration
- describe `running`, `failed`, and `success` states directly
- include the failure summary when present

## Guardrails
Current guardrails:
- explicit status checks never trigger pipeline execution
- explicit cancel requests never mutate state
- only one pipeline invocation should occur in a single request path
- stale rows are cleaned before deciding whether a new run is allowed

## Known Gaps
The scheduler is stable but still incomplete:
- it is not yet extracted into a dedicated module
- it does not yet expose a first-class queue or lease system
- it does not yet enforce full per-request hard limits
- it does not yet support UI polling by `run_id`
- it still depends on a one-shot edge function request lifecycle

## Next Refactor Target
The next scheduler refactor should:
1. extract scheduler helpers into a dedicated module
2. normalize scheduler request/result types
3. expose `run_id` as a first-class UI polling key
4. separate scheduler execution from coordinator prompting more cleanly
5. add capability gating and explicit policy enforcement
