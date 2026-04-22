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

2. frontend workspace adapter layer
- introduce a UI-facing adapter seam before page migration
- adapter must normalize live backend objects into:
  - widget descriptors
  - inspector payloads
  - message parts
  - calendar windows / slots
  - decision explanations
- do not let packaged prototype page types become the live domain contract

3. tool-first thread rendering
- support structured cards/widgets in the thread
- support inspector/companion panels
- keep coordinator outputs UI-addressable
- add real conversation persistence in the shared workspace thread

4. operational carryover
- use the old UI for missing pages and details
- carry forward:
  - `Operations -> Manual`
  - `Operations -> Settings`
  - current config forms
  - other trust/audit surfaces still missing in the new UI

5. config expansion support
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

Treat the packaged prototype as:
- shell-valid
- interaction-valid
- widget-direction-valid
- not production-data-valid
- not domain-contract-valid

Use the current `M.A.S UI` as the main source for:
- existing route wiring
- settings/config grounding
- `Operations` pages
- manual/admin surfaces
- any currently working trust/review workflows that are missing from the prototype

## Current Migration Diagnosis
What the packaged prototype already has:
- a strong shared shell
- a usable inspector pattern
- widget-first rendering direction
- page/layout composition that fits the product direction

What it does not yet have:
- real backend wiring
- real marketing-object types
- real calendar-window / slot contracts
- real `samm` thread persistence
- production-ready API coverage

The bundled API/server is currently only a scaffold.
The bundled page layer is still mock-service driven.

Therefore the migration rule is:
- reuse the shell and interaction model
- replace the data layer
- adapt live backend objects instead of porting prototype mocks directly

## Marketing-First Migration Order
The next frontend track is marketing-first.

Port in this order:
1. shell
2. `/samm`
3. inbox
4. content
5. metrics
6. calendar
7. operations carryover

Do not start with:
- CRM pages
- Sales pages
- full Calendar Studio implementation

Current checkpoint:
- `M14UI1` first shell slice is now live in the codebase:
  - the live app layout uses the new shared-workspace shell foundation
  - the first inspector seam exists
  - the first adapter contracts exist
- marketing page logic has not been migrated yet
- this keeps the shell and domain-adapter work isolated from page rewrites

Next validated checkpoint:
- the first real marketing page migration is now underway on `/samm`
- `/samm` still talks to the live coordinator backend
- the page now renders coordinator runtime state as inspectable workspace objects instead of plain transcript-only bubbles
- confirmation behavior remains live-backed and unchanged in contract
- durable thread persistence is still pending and stays in the `M14UI2` track

Follow-on checkpoint now in code:
- `Inbox` is the second migrated marketing surface inside the new shell
- inbox cards now expose inspector-openable workspace objects
- live approval actions and pipeline resume behavior remain unchanged in backend contract
- expanded inline details are still present, so the new shell does not remove a trust/review path while migration is in progress

Next follow-on checkpoint now in code:
- `Content Registry` is the third migrated marketing surface inside the new shell
- content cards and design brief cards now expose inspector-openable workspace objects
- live approval, retry, edit, batch-approve, and pipeline resume behavior remain unchanged in backend contract
- expanded inline review/edit surfaces remain present while the inspector seam is added

## Migration Matrix
| Surface | Prototype maturity | Migration use | Notes |
|---|---|---|---|
| `WorkspaceShell` | high | adopt early | strong base for live app |
| `Sidebar` | high | adopt early | route shell is usable |
| `InspectorPanel` | high | adopt early with adapter | needs real widget payloads |
| `/samm` | medium | rebuild on live coordinator API | mock message model must be replaced |
| `Inbox` | medium | port after shell | maps well to live approval flows |
| `Content` | medium | port after inbox | needs live registry metadata and actions |
| `Metrics` | medium | port after content | needs real metrics contracts |
| `Calendar` | low-medium | port later | current prototype is not yet Calendar Studio |
| `Operations` | low | keep old longer | current live admin surfaces are stronger |
| `CRM` | low/mock | pause | not for the current migration track |
| `Sales` | low/mock | pause | not for the current migration track |

## Adapter Contract
The migration should converge on this frontend seam:

```text
Live backend
  -> workspace adapter layer
  -> shell + widgets + inspector
  -> migrated marketing surfaces
```

Minimum adapter outputs:
- `widget_descriptor`
- `inspector_payload`
- `workspace_message_part`
- `calendar_window`
- `resolved_slot`
- `decision_reason`
- `linked_content_ref`

These contracts now exist in the live app as the starting adapter seam.

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

Marketing migration is considered stable enough to resume CRM / Sales work when:
- migrated marketing pages no longer depend on prototype mock services
- the shell, inspector, and widget model are live-backed
- the calendar path is ready for later Studio evolution
- marketing workflows are stable in the new shell under real usage

## Summary
The new UI is not a big-bang replacement.
It is the next frontend direction for `samm`, adopted incrementally, grounded by the current live UI, and kept aligned with the locked backend/runtime contracts through a dedicated frontend adapter layer.
