## Packaged UI Target

This directory contains the materialized source tree from:

- `samm 2.0 UI/artifacts.zip -> artifacts/samm/*`

It exists so the packaged `samm` frontend can be treated as the real migration target inside the live repo, rather than as a zip-only reference artifact.

Current rules:
- do not treat this tree as production-ready yet
- do not wire it to mock services in the live app
- replace packaged `src/services/mockService.ts` through live adapter/query layers
- replace packaged demo/domain types through live marketing-normalized contracts
- preserve the current hybrid `M.A.S UI` shell/carryover implementation only as a rollback-safe checkpoint while this packaged target is wired up

This extraction is an intermediate migration checkpoint, not the final cutover.
