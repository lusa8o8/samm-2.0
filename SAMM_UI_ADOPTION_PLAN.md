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
- actual route/page compositions from `artifacts/samm`

Treat the packaged prototype as:
- shell-valid
- interaction-valid
- widget-direction-valid
- route-composition-valid
- not production-data-valid until adapted
- not domain-contract-valid until adapted

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

## Correction: Target UI vs Hybrid Carryover
The current committed `M.A.S UI` shell/carryover work is useful, but it is not the final migration target.

What already exists in the live repo:
- shared shell foundation
- first workspace adapter seam
- migrated live-backed marketing surfaces inside that shell

What that work now represents:
- a rollback-safe checkpoint
- a live backend reference
- an adapter seed
- not the final frontend direction

The actual frontend target is the packaged `samm` app inside:
- `samm 2.0 UI/artifacts.zip -> artifacts/samm/*`

The corrected migration rule is:
- keep the current hybrid work as fallback/reference
- stop extending old-page carryover as the primary migration strategy
- bind the live backend into the actual packaged `samm` route/page system
- preserve only the adapter seam and backend-safe logic from the hybrid path where useful

## Packaged App Reality
The packaged UI is not checked out as a normal source tree.
It currently exists as zip artifacts:
- `samm 2.0 UI/artifacts.zip`
- `samm 2.0 UI/lib.zip`

The real packaged app tree inside `artifacts.zip` is:
- `artifacts/samm/src/App.tsx`
- `artifacts/samm/src/pages/*`
- `artifacts/samm/src/components/shell/*`
- `artifacts/samm/src/components/widgets/*`
- `artifacts/samm/src/services/mockService.ts`
- `artifacts/samm/src/types/index.ts`

That means the next clean migration step is not another old-page carryover.
It is to treat `artifacts/samm` as the actual frontend target and replace its mock service/types/contracts with live adapters.

## Marketing-First Migration Order
The next frontend track is still marketing-first, but the strategy is corrected.

Do in this order:
1. bind the packaged `samm` app structure into the live repo as the frontend target
2. replace `mockService.ts` assumptions with live adapter/query layers
3. rewire packaged `/samm`
4. rewire packaged `Inbox`
5. rewire packaged `Content`
6. rewire packaged `Metrics`
7. rewire packaged `Calendar`
8. only then decide what `Operations` should borrow from the old UI vs be rebuilt in the packaged model

Do not start with:
- CRM pages
- Sales pages
- full Calendar Studio implementation

Current checkpoint truth:
- the live repo contains a validated hybrid shell/carryover implementation
- that hybrid path is now a safety checkpoint, not the final migration target
- no more major surface carryover work should continue until the packaged app is made the target

Next required checkpoint:
- import or materialize the packaged `artifacts/samm` frontend as the working target inside the live app
- keep the backend live
- replace mock services/types through adapters instead of continuing old-page wraps

Checkpoint now completed:
- the packaged `samm` app has been materialized into the live repo at:
  - `M.A.S UI/packaged-target/samm/*`
- the target is now source-visible and no longer zip-only
- the live app still builds unchanged, so this remains a safe reset checkpoint
- next code slices should modify that packaged target tree directly rather than extending the hybrid carryover path

First packaged-target adapter slice now in code:
- packaged `/samm` no longer depends on `src/services/mockService.ts`
- packaged `SammPage` now uses a live adapter service:
  - `packaged-target/samm/src/services/liveSammService.ts`
- that adapter talks to the real coordinator function and reads live workspace context from:
  - `pipeline_runs`
  - `human_inbox`
  - `academic_calendar`
- the packaged target now also has a standalone in-repo `tsconfig.json` and passes its own typecheck checkpoint

Second packaged-target adapter slice now in code:
- packaged `InboxPage` no longer depends on the packaged mock inbox path
- packaged `ApprovalQueueWidget` also uses the same live adapter path
- live inbox service:
  - `packaged-target/samm/src/services/liveInboxService.ts`
- this adapter maps live `human_inbox` item types into the packaged approval/suggestion/escalation/fyi UI model
- approve / reject / mark-seen actions now use the real backend path and keep pipeline resume side effects intact

Third packaged-target adapter slice now in code:
- packaged `ContentPage` no longer depends on the packaged mock content path
- packaged `ContentBatchReviewWidget` also uses the same live adapter path
- live content service:
  - `packaged-target/samm/src/services/liveContentService.ts`
- this adapter maps live `content_registry` rows into the packaged content-card model
- approve / reject / retry actions now use the real backend path and keep pipeline resume side effects intact
- packaged content rendering now supports live marketing channels directly instead of only prototype/demo channels

Fourth packaged-target adapter slice now in code:
- packaged `MetricsPage` no longer depends on the packaged mock metrics path
- live metrics service:
  - `packaged-target/samm/src/services/liveMetricsService.ts`
- this adapter reads the real `platform_metrics` snapshot table and derives the packaged metrics surface from live data
- packaged metrics now render live:
  - KPI cards
  - channel performance rows
  - sparkline trend data
  - `samm` summary text
  - lightweight detected-pattern cards

Packaged runtime target now available:
- run the current fallback/live app with:
  - `npm run dev`
- run the packaged frontend target with:
  - `npm run dev:packaged`
- packaged-target checkpoints now pass:
  - `npm run build:packaged`
  - `npm run typecheck:packaged`
- the packaged app still is not the default runtime entry; it is now the sanctioned side-by-side dev/build target for adapter replacement work
- packaged runtime now includes a lightweight auth gate and `/login` route so separate-port dev sessions can sign into the live backend cleanly

## Migration Matrix
| Surface | Packaged-app maturity | Migration use | Notes |
|---|---|---|---|
| `WorkspaceShell` | high | adopt wholesale | strong base for live app |
| `Sidebar` | high | adopt wholesale | route shell is usable |
| `InspectorPanel` | high | adopt wholesale with adapter | needs real widget payloads |
| `WidgetRenderer` | medium | adopt with expanded live widget coverage | current widget support is incomplete |
| `/samm` | medium | rewire packaged page | mock message model must be replaced |
| `Inbox` | medium | rewire packaged page | maps well to live approval flows |
| `Content` | medium | rewire packaged page | needs live registry metadata and actions |
| `Metrics` | medium | rewire packaged page | needs real metrics contracts |
| `Calendar` | low-medium | rewire packaged page later | still pre-Studio even in packaged app |
| `Operations` | low | decide later | old live admin surfaces may still be stronger |
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

Additional required packaged-app replacements:
- replace packaged `types/index.ts` demo channels/event types with live marketing-normalized contracts
- replace packaged `services/mockService.ts` with live query/mutation adapters
- replace packaged mock workspace context with real coordinator/runtime context
- expand packaged widget coverage so live objects do not fall through to placeholder widgets

## Guardrails
Do not:
- swap the whole frontend at once
- remove working routes before replacements exist
- rewrite backend contracts just to fit prototype assumptions
- continue extending the hybrid old-page carryover path as if it were the final target
- treat the packaged UI as production-ready code without translation

Do:
- keep slices small
- preserve working flows
- lock UI assumptions in docs before complex adoption work
- test each slice against the live backend

## Acceptance Criteria For The Reset UI Track
The corrected UI adoption track is successful when:
- the actual packaged `samm` app structure is the active frontend target
- the packaged shell/sidebar/inspector are live-backed, not mock-backed
- packaged marketing pages no longer depend on `mockService.ts`
- live coordinator/content/calendar/metrics flows render inside packaged page compositions
- the current hybrid carryover remains available only as a safe reference/rollback boundary during migration

Marketing migration is considered stable enough to resume CRM / Sales work when:
- the packaged marketing pages no longer depend on prototype mock services
- the packaged shell, inspector, and widget model are live-backed
- the packaged calendar path is ready for later Studio evolution
- marketing workflows are stable in the packaged UI under real usage

## Summary
The new UI is still not a big-bang replacement.
But the target is now explicit:
- the actual packaged `samm` frontend becomes the real migration destination
- the current hybrid shell/carryover work is only a checkpoint and adapter seed
- the next implementation slices must bind the live backend into the packaged app, not keep wrapping old pages
