# samm UI Adoption Plan

## Purpose
This document locks how the new `samm` shared-workspace UI should be adopted into the live product.

The rule is:
- adopt the new UI in narrow, reversible slices
- do not replace the whole app at once
- use the current `M.A.S UI` as grounding for missing operational surfaces
- keep the backend contracts stable while the frontend evolves

## Current Reality
There are now two UI sources in the repo:

1. live app
- `M.A.S UI`
- this is the production-connected frontend
- it contains the real routes, current forms, and operational surfaces

2. new packaged prototype
- `samm 2.0 UI`
- this contains the new shared-workspace shell and generative UI direction
- it is not yet the live app
- it should be treated as the design/system source for the next frontend slices

Reference libraries also exist in:
- `Open Source GenUI Libraries`

These are for grounding and best-practice inspection, not for blindly copying architecture into the product.

One explicit unresolved issue must remain visible:
- conversation persistence in `/samm` was not solved before the `M14` milestone series started
- backend memory/state milestones did not automatically solve frontend thread persistence
- persistent conversation rendering must be treated as an explicit UI adoption task

## Brand Rules
These are locked:
- always lowercase `samm`
- new UI adoption must preserve the existing `samm` brand language
- do not drift back into `TSH` naming in core user-facing surfaces

## Product Rule
The UI remains:
- `samm` first
- dashboard supported
- tool-first
- shared-workspace oriented

That means:
- `/samm` is the primary coordination surface
- Inbox, Content, Calendar, Metrics, and Operations remain supporting trust/review surfaces
- the thread should become a workspace, not remain a plain chatbot transcript

## Adoption Strategy
Adopt in this order:

1. shared workspace shell
- bring in the new shell/layout patterns for `/samm`
- preserve the live routes and backend wiring

2. tool-first thread rendering
- support structured cards/widgets in the thread
- support inspector/companion panels
- keep coordinator outputs UI-addressable
- add real conversation persistence in the shared workspace thread

3. operational carryover
- use the old UI for missing pages and details
- carry forward:
  - `Operations -> Manual`
  - `Operations -> Settings`
  - current config forms
  - other trust/audit surfaces still missing in the new UI

4. config expansion support
- once `M14B` lands, update settings/config UI to support the universal config model
- do not hardcode old TSH-specific assumptions into the new forms
- first `M14B` settings carryover is now live in `M.A.S UI`:
  - universal-config read surface
  - editable campaign defaults
  - editable approval policy
- current `M.A.S UI` now also carries the first narrow write surfaces for universal config:
  - ICP categories
  - offer catalog
  - seasonality profiles
  - discount policies
  - outreach policies
- keep broader shell/workspace adoption separate from this settings carryover

## Immediate UI Source Mapping
Use the packaged `samm 2.0 UI` as the main source for:
- workspace shell
- sidebar pattern
- inspector panel pattern
- widget renderer
- shared cards/components
- `/samm` experience direction

Use the current `M.A.S UI` as the main source for:
- existing route wiring
- settings/config grounding
- `Operations` pages
- manual/admin surfaces
- any currently working trust/review workflows that are missing from the prototype

## Guardrails
Do not:
- swap the whole frontend at once
- remove working routes before replacements exist
- rewrite backend contracts just to fit prototype assumptions
- treat the packaged UI as production-ready code without translation

Do:
- keep slices small
- preserve working flows
- lock UI assumptions in docs before complex adoption work
- test each slice against the live backend

## Acceptance Criteria For The First UI Track
The first UI adoption track is successful when:
- `/samm` uses the new shared-workspace shell
- the UI still talks to the live backend correctly
- conversation and structured workspace objects can coexist
- old operational pages remain accessible while the new shell lands
- no critical review/admin path is lost

## Summary
The new UI is not a big-bang replacement.
It is the next frontend direction for `samm`, adopted incrementally, grounded by the current live UI, and kept aligned with the locked backend/runtime contracts.
