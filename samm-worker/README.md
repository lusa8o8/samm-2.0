# samm-worker

Initial Railway worker scaffold for `M14A.1`.

Purpose:
- poll Supabase for worker-targeted `pipeline_runs`
- claim runs deterministically
- dispatch heavy execution paths outside hosted Supabase edge bundling

This first slice is intentionally narrow:
- no ingress changes yet
- no production dispatch of Pipeline B/C yet
- no obligation delivery engine

Environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SAMM_WORKER_ID`
- `SAMM_WORKER_POLL_INTERVAL_MS` optional
- `SAMM_WORKER_PIPELINES` optional comma-separated allow-list

Safety default:
- if `SAMM_WORKER_PIPELINES` is unset, the worker stays inert and claims nothing
