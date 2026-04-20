# SAMM Runtime Split Contract

## Purpose
This document locks the `M14A.1` runtime split contract for `samm 2.0`.

It exists to solve one specific blocker:
- hosted Supabase Edge deployment for the heavier runtime now times out during bundle generation

The response is deliberately narrow:
- keep Supabase as the durable source of truth
- keep ingress thin
- move heavy execution into a dedicated Node worker runtime
- use Railway as the first worker host target

This is a controlled runtime split, not a rewrite and not a platform reset.

## Trigger
The split is justified only because the blocker is real and repeatable.

Observed facts:
- `M14A` schema is live
- `M14A` code is implemented and pushed
- production validation showed `channel_routes` / `conversation_threads` remained empty
- repeated deploy attempts for updated functions failed with:
  - `Bundle generation timed out`

Conclusion:
- deployability of the hosted edge runtime is the blocker
- the memory schema and pipeline semantics are not the primary issue

## Locked Architecture Shape

```text
UI / Dashboard
        |
        v
Thin Supabase ingress
- auth-aware request entry
- lightweight coordinator admission
- memory writes
- task / run creation
        |
        v
Supabase durable truth
- org_config
- pipeline_runs
- coordinator_tasks
- coordinator_obligations
- content_registry
- human_inbox
- academic_calendar
        |
        v
Node worker runtime (Railway)
- heavy pipeline execution
- longer-running coordinator work
- retry-prone orchestration
- later obligation processing
```

## What Stays In Supabase
These remain on Supabase in `M14A.1`:

- database
- auth
- existing durable tables
- thin ingress functions
- scheduler authority
- human gate persistence
- lightweight status reads

Supabase functions are still responsible for:
- authenticated request entry
- reading org/workspace scope
- creating or updating:
  - `channel_routes`
  - `conversation_threads`
  - `coordinator_tasks`
  - `coordinator_obligations`
  - `pipeline_runs`
- returning compact operator-facing responses

## What Moves To The Worker
The worker owns only heavy execution paths.

Initial move set:
- heavy pipeline execution
- retry-prone orchestration
- longer-running execution paths that do not fit a deploy-fragile edge bundle

The first target paths are:
1. `pipeline-b-weekly`
2. `pipeline-c-campaign`

Those are the highest-value / heaviest paths and give the cleanest relief.

## Authority Rules
The split does not change the control-plane authority model.

These rules remain locked:
- runtime interprets
- scheduler decides
- worker executes approved work
- agents produce bounded outputs only
- durable state remains the system truth

The worker must not become an alternate scheduler.

## First Worker Contract
Do not invent a brand-new queue system in `M14A.1`.

Use existing durable state:
- ingress creates or updates `pipeline_runs`
- worker polls for runnable rows
- worker claims a run deterministically
- worker executes the claimed run
- worker writes terminal or waiting state back to `pipeline_runs`
- worker syncs linked `coordinator_tasks`

### Runnable Run Criteria
Initial runnable contract should stay simple and explicit.

Candidate shape:
- `pipeline_runs.status = 'queued'`
- `pipeline_runs.worker_claimed_at is null`
- `pipeline_runs.started_at is null`

If a claim field does not exist yet, add only the minimum fields needed to avoid duplicate execution.

### Claim Rule
The worker must claim before execution.

Initial claim behavior should:
- select a small batch of runnable rows
- atomically claim one row
- record claim metadata
- skip already-claimed rows

No optimistic duplicate execution is allowed.

## Thin Ingress Contract
`coordinator-chat` must become deployable by doing less.

For `M14A.1`, ingress may:
- parse the operator request
- use scheduler-first routing
- create memory records
- create the `pipeline_runs` row
- link the run to `coordinator_tasks`
- return a structured accepted / queued response

For `M14A.1`, ingress must not:
- carry heavy orchestration inline for moved pipelines
- become the long-running executor again

## Worker Service Shape
The worker should live in a dedicated repo folder, not the repo root.

Recommended path:
- `samm-worker/`

Recommended shape:
- own `package.json`
- own TypeScript config
- own small runtime entrypoint
- Supabase client via service role
- polling / claim loop
- minimal worker-specific modules

The worker should not import frontend code.

## Railway Contract
Railway is the first worker host target.

Initial setup assumptions:
- project: `samm-worker`
- service: `worker`

The repo should later link only the worker directory to Railway.

Do not attach the whole application repo root as the worker deploy surface.

## Required Environment Variables
Expected worker variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

Optional later:
- channel-specific API keys
- worker tuning values

The worker must not depend on frontend-only env vars.

## Rollout Phases

### Phase 1 - Contract Lock
- document split rules
- document worker responsibility boundaries
- document first moved paths

### Phase 2 - Worker Foundation
- create `samm-worker/`
- add minimal Node runtime
- add Supabase connection
- add claim / execute / write-back loop

### Phase 3 - First Execution Move
- move `pipeline-b-weekly` execution to the worker path first
- keep scheduler authority in ingress

### Phase 4 - Second Execution Move
- move `pipeline-c-campaign`

### Phase 5 - Revalidate `M14A`
- verify `channel_routes`
- verify `conversation_threads`
- verify `coordinator_tasks`
- verify linked run/task lifecycle in production

## Success Criteria
`M14A.1` is successful when:
- `coordinator-chat` becomes reliably deployable again
- at least one blocked heavy execution path runs through the worker contract
- Supabase remains the durable truth layer
- linked run/task state still behaves deterministically
- `M14A` memory writes can finally be validated in production

Current validation state:
- `coordinator-ingress` is deployed and handling explicit scheduler traffic successfully
- `channel_routes` and `conversation_threads` now populate in production validation
- the first worker path is proven for `pipeline-b-weekly`
- Railway deployment is the next operational step, not a design unknown

## Explicit Non-Goals
`M14A.1` does not include:
- CRM
- Sales
- learning
- UI overhaul
- replacing Supabase
- replacing the scheduler
- multi-worker complexity
- a generalized job platform

## Rollback Boundary
The worker split must be reversible.

Rollback means:
- frontend contracts unchanged
- database truth tables unchanged
- remove or disable worker execution path
- restore previous execution entry only if deployability permits

The split must not force a second rewrite to undo it.
