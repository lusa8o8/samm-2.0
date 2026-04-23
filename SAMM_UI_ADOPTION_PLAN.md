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

Fifth packaged-target adapter slice now in code:
- packaged `CalendarPage` no longer depends on the packaged mock calendar path
- live calendar service:
  - `packaged-target/samm/src/services/liveCalendarService.ts`
- this adapter reads the real `academic_calendar` rows and maps them into the packaged event/window card model
- packaged calendar inspector now has a dedicated widget:
  - `packaged-target/samm/src/components/widgets/CalendarEventInspectorWidget.tsx`
- support-content and creative-deviation flags are now visible inside the packaged inspector instead of falling through to the generic widget placeholder

Sixth packaged-target adapter slice now in code:
- packaged `OperationsPage` no longer depends on the packaged mock operations path
- live operations service:
  - `packaged-target/samm/src/services/liveOperationsService.ts`
- this adapter reads the real runtime and derives the packaged operations overview from:
  - `pipeline_runs`
  - `content_registry` (for synthetic Pipeline D activity)
- packaged operations overview now renders live:
  - pipeline health cards
  - recent pipeline runs
  - trigger actions for pipelines A/B/C

Seventh packaged-target adapter slice now in code:
- packaged operations settings no longer behave as a placeholder tab
- live settings summary service:
  - `packaged-target/samm/src/services/liveSettingsSummaryService.ts`
- this adapter reads the real config state from:
  - `org_config`
  - `icp_categories`
  - `offer_catalog`
  - `seasonality_profile`
  - `campaign_defaults`
  - `approval_policy`
- packaged settings now show the real workspace configuration as a read-only summary while the packaged editor remains pending

Eighth packaged-target carryover slice now in code:
- packaged operations manual no longer uses the thin placeholder notes
- packaged Manual now reuses the fuller carryover manual from:
  - `src/pages/agent/manual.tsx`
- this gives the packaged runtime the same operations reference content as the current live fallback app while we postpone a full packaged-native manual rewrite

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

Latest packaged polish checkpoint:
- packaged `Content` no longer depends on the direct carryover re-export
- `M.A.S UI/packaged-target/samm/src/pages/ContentPage.tsx` is now a packaged-native live page again
- packaged content now restores the missing controls while staying visually aligned to the packaged shell:
  - approve / reject styling fixed
  - edit
  - image upload / replace
  - approve all
  - design brief edit
  - design brief share
- inline card expansion has been removed from the packaged content registry
- content detail review now goes through the packaged modal / blur path instead
- packaged preview cards now open on card tap / click instead of a separate details button
- packaged preview cards now show only truncated preview copy plus compact metadata
- packaged preview cards no longer use the nested tinted preview panel:
  - preview state is now a single neutral surface
  - campaign / objective / CTA / tags render as compact chips instead of boxed mini-panels
  - the duplicate large metadata blocks are removed from preview state
- expanded content panels now carry platform-tinted content backgrounds:
  - blue for LinkedIn / Facebook
  - purple for Instagram / design-heavy surfaces
  - yellow/amber for email-style surfaces
  - green for WhatsApp
- packaged inspector widget coverage was extended for live content review:
  - `campaign_brief`
  - `linked_content_list`
- packaged `Calendar` now reuses the fuller live editor surface from:
  - `M.A.S UI/src/pages/calendar.tsx`
- this restores the missing packaged calendar controls:
  - add event
  - edit
  - delete
  - support-content toggle
  - creative-deviation toggle
- packaged `Operations -> Settings` now reuses the fuller live editor surface from:
  - `M.A.S UI/src/pages/agent/settings.tsx`
- this replaces the earlier packaged read-only summary with real editable inputs
- packaged runtime now includes a visible sidebar sign-out control
- compatibility proxy modules now exist inside the packaged target so these live carryover editors can run inside the packaged shell without forking backend behavior:
  - `packaged-target/samm/src/lib/api.ts`
  - `packaged-target/samm/src/lib/supabase.ts`
  - `packaged-target/samm/src/lib/workspace-adapter.ts`
  - `packaged-target/samm/src/components/layout.tsx`

Latest packaged content-density follow-up now in code:
- the live content backend/actions remain untouched:
  - `approve all`
  - `edit`
  - `share`
  - image upload / replace
  - approve / reject / retry
- live content metadata remains intact; this was a presentation-only checkpoint
- packaged `Content` preview cards are now denser against the original packaged mock:
  - tighter card/header/action density
  - tighter chip rhythm
  - shorter preview copy presentation
- expanded packaged content surfaces are now denser through the live inspector widgets:
  - `linked_content_list`
  - `campaign_brief`
- this checkpoint deliberately treated the current oversized feel as a local content-surface density issue first, not a global token/sidebar reset
- validated checkpoints:
  - `npm run build:packaged`
  - `npm run build`

Latest packaged expanded-card follow-up now in code:
- focus stayed narrow on the expanded regular-content inspector surface only
- preview-card density work was left intact; this slice did not reopen that page-level checkpoint
- the same live content backend behavior and metadata coverage remain in place:
  - approve / reject / retry hooks
  - live invalidation paths
  - full draft body
  - campaign / objective / CTA / tags / created metadata
- expanded regular-content presentation is now closer to the original packaged mock through:
  - smaller top summary hero scale
  - clearer two-column metadata grid
  - compact tag row
  - bottom action row aligned closer to the original composition
- the implementation stayed inside:
  - `M.A.S UI/packaged-target/samm/src/components/widgets/LinkedContentListWidget.tsx`
- validated checkpoints:
  - `npm run build:packaged`
  - `npm run build`

Next sensible packaged-UI slice:
- broader visual-consistency sweep across Inbox, Calendar, and Operations
- keep it presentation-only first; do not reopen backend contracts unless a concrete UI blocker requires it

Refined packaged-content diagnosis before that wider sweep:
- the original packaged app in `samm 2.0 UI/samm.zip` does not use `linked_content_list` for regular expanded content
- the original expanded regular-content surface is `content_batch_review` via:
  - `samm/src/components/widgets/ContentBatchReviewWidget.tsx`
- the local drift is therefore not only styling; it is also inspector routing/composition drift
- the main visible mismatch is that the current regular expanded card duplicates the copy:
  - top preview excerpt
  - separate full-draft block
- the original packaged widget renders the content body once inside the tinted banner and then moves straight into metadata, tags, failures, and actions

Locked next narrow packaged-content correction:
- keep design briefs on the dedicated `campaign_brief` path
- route regular content expansion back toward the original `content_batch_review` composition
- preserve live content backend actions and metadata coverage
- preserve the preview-page checkpoint; only correct the expanded regular-content path

Latest packaged expanded-card routing correction now in code:
- regular content expansion no longer routes through the custom `linked_content_list` composition from `ContentPage`
- regular content now routes back through the original packaged expanded-widget pattern:
  - `content_batch_review`
- the current packaged target still keeps `campaign_brief` for design briefs; only regular content routing changed
- the duplicated expanded-copy presentation is removed from the live regular-content path:
  - no separate preview excerpt panel plus full-draft panel
  - the draft text now renders once inside the original tinted batch-review banner
- the original packaged widget composition is now the active base for regular expanded content again:
  - tinted content banner
  - compact metadata grid
  - compact tags
  - bottom action row
- live backend behavior remains intact:
  - approve / reject / retry still use the live packaged backend path
  - live invalidation now runs through the widget so the registry/inbox/runtime queries stay in sync
- implementation files:
  - `M.A.S UI/packaged-target/samm/src/pages/ContentPage.tsx`
  - `M.A.S UI/packaged-target/samm/src/components/widgets/ContentBatchReviewWidget.tsx`
- validated checkpoints:
  - `npm run build:packaged`
  - `npm run build`

Refined design-brief diagnosis after the regular-content correction:
- the original packaged app in `samm 2.0 UI/samm.zip` does not include a dedicated `CampaignBriefWidget`
- the current packaged target `CampaignBriefWidget` is therefore a local extension, not an original packaged source-of-truth component
- current drift is now mostly visual language drift:
  - purple/shareable header treatment
  - extra tip panel
  - legacy-feeling composition compared with the compact content-review widgets

Locked next narrow packaged-content correction:
- keep design briefs on the dedicated `campaign_brief` route/widget path
- do not collapse design briefs into `content_batch_review`, because the brief body still benefits from markdown rendering
- restyle `CampaignBriefWidget` to match the same compact visual language as the cleaned content-review widgets
- remove legacy in-widget affordances that duplicate card-level behavior

Latest packaged design-brief styling correction now in code:
- design briefs still use the dedicated `campaign_brief` widget path
- markdown rendering remains intact; this slice did not collapse briefs into the regular content-review widget
- `CampaignBriefWidget` now matches the cleaned content-review visual language more closely:
  - compact tinted header instead of the legacy purple/shareable treatment
  - compact metadata cards instead of the older floating summary/tip pattern
  - legacy in-widget share/tip affordances removed because share remains available at the card/action level
- implementation file:
  - `M.A.S UI/packaged-target/samm/src/components/widgets/CampaignBriefWidget.tsx`
- validated checkpoints:
  - `npm run build:packaged`
  - `npm run build`

Refined design-brief follow-up diagnosis:
- the remaining brief drift is now mostly composition drift, not color drift
- compared with the cleaned regular content cards, the brief still diverges because:
  - the body is split into a separate white card instead of living in the tinted content panel
  - the metadata blocks still use a different card language than the regular content-review metadata blocks

Locked next narrow packaged-content correction:
- keep design briefs on `campaign_brief`
- keep markdown rendering intact
- refactor `CampaignBriefWidget` to reuse the same expanded-card composition as the cleaned regular content cards:
  - tinted body panel
  - compact metadata blocks
  - same spacing rhythm

Latest packaged design-brief final tightening now in code:
- design briefs still use the dedicated `campaign_brief` widget path
- markdown rendering remains intact
- `CampaignBriefWidget` now reuses the same expanded-card composition language as the cleaned regular content cards more literally:
  - the brief body now lives inside the tinted primary panel
  - metadata now uses the same compact block style as the regular content-review widgets
  - spacing rhythm is aligned to the cleaned content-draft expanded cards
- implementation file:
  - `M.A.S UI/packaged-target/samm/src/components/widgets/CampaignBriefWidget.tsx`
- validated checkpoints:
  - `npm run build:packaged`
  - `npm run build`

Refined broader sweep diagnosis before touching Inbox / Calendar / Operations:
- `Inbox` page composition is already close to the original packaged reference in `samm 2.0 UI/samm.zip`
- the remaining `Inbox` drift is mostly inspector/detail-surface polish, not page-shell drift
- `Calendar` is now the clearest visual outlier because the packaged target currently reuses the older carryover page from:
  - `M.A.S UI/src/pages/calendar.tsx`
- that carryover page restores live CRUD behavior, but its density and shell language drift from the original packaged `CalendarPage`
- the current carryover calendar path also still opens inspector payloads through the older `calendar_window` adapter contract, so the packaged runtime is not aligned to the packaged calendar-inspector path
- `Operations` overview is partly aligned already, but its `Settings` and `Manual` tabs still visibly inherit older carryover-shell styling through:
  - `M.A.S UI/src/pages/agent/settings.tsx`
  - `M.A.S UI/src/pages/agent/manual.tsx`
- current honest read:
  - `Calendar` needs the main page-level correction
  - `Operations` needs shell/density tightening around carryover surfaces, not a feature rewrite
  - `Inbox` only needs small last-mile consistency touches if the inspector surface still drifts

Locked broad visual-consistency sweep:
- keep the slice strictly UI-only
- preserve all live behavior:
  - inbox approve / reject / mark-seen flows
  - calendar add / edit / delete flows
  - support-content and creative-deviation toggles
  - operations run-now and settings/manual behavior
- use the original packaged zip as the visual source of truth
- use the current live packaged target and carryover-backed pages as the behavior source of truth
- narrow implementation scope:
  - tighten packaged `Inbox` inspector/detail styling only where it still visibly drifts
  - restyle the carryover-backed `Calendar` page into the original packaged density/composition language
  - align the packaged calendar inspector path to the packaged widget model without changing backend behavior
  - tighten `Operations` carryover shell density first:
    - `Overview` only if needed for consistency
    - `Manual` and `Settings` wrappers/components before any deeper rebuild
- do not reopen:
  - content-registry polish
  - backend contracts
  - Calendar Studio work

Latest broad visual-consistency sweep now in code:
- the slice stayed UI-only and preserved all live behavior
- `Inbox` received only the last small inspector/detail alignment still visibly off-reference:
  - packaged `ApprovalQueueWidget` terminal action copy now matches the original packaged language more closely
- `Calendar` received the main correction:
  - the carryover-backed live page in `M.A.S UI/src/pages/calendar.tsx` was restyled into the denser packaged card/header rhythm
  - live add / edit / delete behavior stayed intact
  - live support-content and creative-deviation toggles stayed intact
  - calendar detail open now aligns to the packaged inspector widget path through:
    - `calendar_event_inspector`
- packaged calendar detail styling was also tightened in:
  - `M.A.S UI/packaged-target/samm/src/components/widgets/CalendarEventInspectorWidget.tsx`
- `Operations` received shell tightening rather than a feature rewrite:
  - packaged `OperationsPage` overview density was tightened slightly
  - packaged manual no longer sits inside an extra outer card wrapper
  - carryover settings shell density was tightened in:
    - `M.A.S UI/src/pages/agent/settings.tsx`
- implementation files:
  - `M.A.S UI/src/lib/workspace-adapter.ts`
  - `M.A.S UI/src/pages/calendar.tsx`
  - `M.A.S UI/src/pages/agent/settings.tsx`
  - `M.A.S UI/packaged-target/samm/src/components/widgets/ApprovalQueueWidget.tsx`
  - `M.A.S UI/packaged-target/samm/src/components/widgets/CalendarEventInspectorWidget.tsx`
  - `M.A.S UI/packaged-target/samm/src/pages/OperationsPage.tsx`
- validated checkpoints:
  - `npm run build:packaged`
  - `npm run build`
- build status note:
  - the same pre-existing sourcemap/chunk-size warnings remain
  - there were no new build failures

Refined calendar-inspector diagnosis after the broad sweep:
- the current calendar inspector is still partly improvised
- it aligns to the packaged widget route technically, but it does not yet match the original packaged calendar widget composition closely enough
- the original packaged calendar inspector code has now been recovered directly
- the correction should be narrow:
  - restore the original calendar-inspector visual composition more literally
  - keep the live payload conservative so no fake or backend-disconnected actions are introduced
  - avoid reopening the calendar page shell in this follow-up

Locked narrow calendar-inspector follow-up:
- touch only the packaged calendar inspector path plus the carryover payload mapping feeding it
- preserve current live calendar behavior
- reintroduce the original widget structure:
  - gradient banner
  - chip row
  - optional readiness section
  - compact metadata grid
  - notes block
- only show action buttons when the live payload genuinely supports them

Latest narrow calendar-inspector follow-up now in code:
- the original packaged calendar inspector composition is now restored much more literally in:
  - `M.A.S UI/packaged-target/samm/src/components/widgets/CalendarEventInspectorWidget.tsx`
- the current live payload feeding that widget was tightened in:
  - `M.A.S UI/src/pages/calendar.tsx`
- the correction stayed UI-only:
  - no backend contracts changed
  - no calendar CRUD behavior changed
  - no new fake action state was introduced
- current implementation notes:
  - the widget now uses the original gradient-banner / chip-row / metadata-grid composition
  - the carryover payload now supplies the widget with a safer packaged-style `eventType`
  - triggered live events are mapped conservatively to avoid showing non-functional inspector actions
- validated checkpoints:
  - `npm run build:packaged`
  - `npm run build`
- build status note:
  - the same pre-existing sourcemap/chunk-size warnings remain
  - there were no new build failures

Refined packaged inspector-shell diagnosis after the content/calendar cleanup:
- the remaining visible drift is now mostly at the shell level, not inside the individual inspector widgets
- current expanded surfaces still open inside the original centered modal / blur treatment from:
  - `M.A.S UI/packaged-target/samm/src/components/shell/InspectorPanel.tsx`
- that shell now fights the intended workflow because:
  - content, inbox, and calendar are being reviewed as queue/detail surfaces, not one-off blocking dialogs
  - the centered modal hides too much of the underlying workspace context
  - taller widget bodies are starting to feel cramped in the fixed centered box
- the active carryover/live app inspector shell in `M.A.S UI/src/components/workspace/InspectorPanel.tsx` is not the current blocker here; the packaged shell is

Locked narrow packaged inspector-shell follow-up:
- keep the slice shell-only and reversible
- touch only:
  - `M.A.S UI/packaged-target/samm/src/components/shell/InspectorPanel.tsx`
  - this plan doc
  - `NEXT_AGENT_HANDOFF.md`
- convert the packaged inspector from centered modal to right-side drawer presentation
- preserve all current inspector consumers and widget routes unchanged:
  - `openInspector(...)` call sites
  - widget types / payloads
  - content/inbox/calendar/operations logic
- preserve current close behavior:
  - Escape closes
  - outside click closes
- lighten the backdrop and remove the blocking modal feel
- keep the drawer mounted long enough to animate out cleanly rather than disappearing instantly

Latest packaged inspector-shell follow-up now in code:
- the packaged inspector shell no longer uses the centered modal / blur treatment
- `M.A.S UI/packaged-target/samm/src/components/shell/InspectorPanel.tsx` now presents inspector content as a right-side drawer with:
  - top / right / bottom gutter
  - lighter dim backdrop
  - slide-in / slide-out motion instead of scale modal motion
- all current inspector consumers remain unchanged:
  - `openInspector(...)` call sites were not rewritten
  - widget routing/types were not rewritten
  - content/inbox/calendar/operations behavior remained intact
- close behavior stayed intact:
  - Escape closes
  - outside click closes
- the drawer now keeps the last rendered widget/title mounted long enough to animate out cleanly on close instead of disappearing immediately
- validated checkpoints:
  - `npm run build:packaged`
  - `npm run build`
- build status note:
  - the same pre-existing sourcemap/chunk-size warnings remain
  - there were no new build failures

Refined Calendar Studio diagnosis after the shell/content/calendar cleanup:
- the main product bottleneck is no longer raw content generation alone
- for the current MVP, the stronger backend truth now exists after the calendar is defined:
  - deterministic window / slot resolution
  - deterministic `Pipeline B` and `Pipeline C` admission
  - structured-config grounding
  - content approval / publish flow
- the current weakest layer is upstream of that backend truth:
  - helping the operator define a full month of good calendar truth in one sitting
- current honest read:
  - `academic_calendar` + `calendar-coordination.ts` are already strong enough to act as the planning authority
  - `Calendar` UI is still mostly CRUD, not a planning workspace
  - `/samm` chat still is not a true tool-streaming workspace; it can open inspectors and confirmations, but it cannot yet render and operate rich planning widgets inline

Locked Calendar Studio v1 product contract:
- Calendar Studio v1 is not a generic calendar
- Calendar Studio v1 is the planning workspace that turns operator intent into deterministic calendar truth for the existing marketing pipelines
- the feature must be designed around four buckets only:
  - structural config
  - dynamic planning input
  - committed planning output
  - derived UI state
- do not collapse those buckets together inside prompt logic or chat memory

Structural config for Calendar Studio v1:
- keep in durable org/workspace config:
  - business type / operating model
  - industry category
  - default content-mix policy
  - default channel weighting
  - asset capability profile
  - recurring campaign intensity / support-content defaults
- current config already covers:
  - ICP categories
  - offer catalog
  - seasonality
  - campaign defaults
  - approval policy
  - channel/module settings
- therefore the config gap is narrow and explicit:
  - add the missing planning defaults above instead of inventing a second config system

Dynamic planning input for Calendar Studio v1:
- capture per monthly planning session or per event/campaign:
  - planning month / horizon
  - monthly objective
  - key dates / campaigns
  - one-off notes and exceptions
  - temporary emphasis for the month
  - asset readiness per campaign/event
  - special messaging / CTA overrides
  - operator-capacity notes for the month
- this data is session-scoped or campaign-scoped, not durable org truth

Committed planning output for Calendar Studio v1:
- write the approved plan into the calendar/planning authority rather than leaving it as prose
- v1 should keep `academic_calendar` as the primary authority and extend it carefully where needed
- committed output should cover:
  - campaign/event label
  - date range
  - ownership
  - exclusivity
  - support-content allowed
  - channels in scope
  - CTA/message constraints
  - content-type requirements
  - per-window posting constraints
  - asset readiness / asset-needed state
  - planning notes
- do not create a second detached campaign-planning subsystem for v1 if the current calendar authority can hold the truth

Derived UI state for Calendar Studio v1:
- never ask the user to enter these manually:
  - day capacity bars
  - scheduled/draft/failed/waiting counts
  - readiness percentages
  - backlog/failure indicators
  - mixed-ownership hints
  - open-slot counts
- derive them from:
  - `academic_calendar`
  - `content_registry`
  - `pipeline_runs`

Locked Calendar Studio v1 surfaces:
- `Calendar Studio` month grid is the primary planning surface
- `date drawer` is the operational day surface
- `campaign drawer` is the campaign/window surface
- `/samm` must launch and host planning widgets, but it should not become a freeform substitute for the calendar itself
- chat should gather, refine, explain, and trigger; calendar should remain the primary place where planning truth is reviewed and committed

Locked Calendar Studio v1 UI requirements:
- monthly grid with soft elevated day cards
- day-level capacity + status summary derived from real data
- right-side day drawer
- right-side campaign drawer
- compact action surfaces for:
  - generate content
  - add manually
  - ask AI to fill gaps
  - adjust constraints
  - run relevant pipelines
- widget language must stay boring, premium, and operational:
  - avoid dense prose walls
  - avoid decorative dashboard clutter
  - favor compact structured controls and clear status

Locked agentic-UI requirement behind Calendar Studio:
- `/samm` must eventually support tool/widget streaming well enough to render live working planning objects inline
- this includes future inline rendering of:
  - calendar windows
  - pipeline runs
  - inbox items
  - planning-session widgets
- current workspace types/widgets are only a partial base
- Calendar Studio v1 must therefore define the next needed workspace widget surfaces explicitly before implementation

Locked Calendar Studio v1 operator-flow resolution:
- this resolution supersedes earlier generic action-surface wording wherever they conflict
- the target user is a solo operator or small team member trying to plan a full month in one sitting with guidance, not a user trying to manually drive every pipeline/day
- Calendar Studio v1 must therefore optimize for:
  - collaborative monthly planning
  - structured review
  - explicit commit to calendar truth
  - exception handling after commit
- Calendar Studio v1 must not become:
  - a raw daily pipeline console
  - a duplicate of Content Registry
  - a freeform AI autoplan surface

Revised v1 user flow:
- step 1: durable planning defaults live in structural config
  - business type
  - industry
  - default content mix
  - default channel weighting
  - asset capability
- step 2: `/samm` runs the planning conversation
  - asks guided questions
  - explains tradeoffs
  - uses preset pills / structured prompts
  - teaches the user what a campaign/window means in practical terms
- step 3: `/samm` produces a structured planning draft
  - month goal
  - key campaigns/events
  - asset readiness
  - one-off notes
  - temporary emphasis
  - operator-capacity notes
- step 4: Calendar Studio becomes the review and commit surface
  - inspect the month visually
  - inspect days and campaign windows
  - adjust exceptions/rules
  - commit the reviewed plan to calendar truth
- step 5: only after commit may draft creation and downstream execution happen
- step 6: post-commit work happens through exception handling
  - approvals
  - retries/failures
  - asset issues
  - narrow rule changes

Locked Planning Mode vs Execution Mode rule:
- `/samm` defaults to `Planning mode`
- `Planning mode` is for:
  - month planning
  - campaign/event definition
  - content-mix guidance
  - asset-readiness discussion
  - calendar proposal / simulation
  - explanation and rationale
- `Planning mode` must not:
  - trigger Pipeline B/C/D
  - resume runs
  - publish
  - approve/reject content
  - commit calendar truth automatically
  - treat mentioning a pipeline as an execution command
- `Execution mode` is only for explicit action:
  - create drafts from committed truth
  - approvals/rejections/retries
  - commit a reviewed planning draft
  - explicit operational edits
  - explicit pipeline/resume actions where later allowed
- calendar manipulation may exist in both modes, but:
  - in `Planning mode`, calendar changes are draft/proposed only
  - in `Execution mode`, calendar changes are live committed changes

Locked `/samm` vs Calendar Studio split:
- `/samm` owns:
  - planning collaboration
  - education / explanation
  - suggested plans
  - preset pills / structured intake
  - rationale for why the month should be shaped a certain way
  - deep-linking / handoff into Calendar Studio
- Calendar Studio owns:
  - month-grid visual review
  - day/campaign inspection
  - exception edits
  - plan commit
  - post-commit draft creation
- do not make the full calendar grid the primary object inside `/samm` chat
- close the gap with shared AG UI contracts and deep-link / companion-panel handoff, not by collapsing Studio into chat

Revised v1 button contract by surface:
- `/samm` planning surface:
  - `Start monthly plan`
  - `Add event or campaign`
  - `Mark asset status`
  - `Refine this plan`
  - `Review in Calendar Studio`
- Calendar Studio month level:
  - `Plan this month`
  - `Commit plan`
  - optional later: `Edit month inputs`
- Calendar Studio day drawer:
  - primary: `Create drafts`
  - secondary: `Add manually`
  - secondary: `Edit rules`
- Calendar Studio campaign drawer:
  - primary: `Create campaign drafts`
  - secondary: `Edit campaign rules`
  - secondary: `Update asset status`
- Content Registry remains the place for:
  - `Approve`
  - `Reject`
  - `Retry`
  - `Edit`

Exact v1 meaning of `Generate content`:
- treat the action semantically as `Create drafts`
- it means:
  - generate draft content for already-planned, already-committed calendar intent
  - use the committed day/window/campaign constraints already resolved in the calendar authority
  - use the known CTA/message/content-type/channel scope for those slots
- it does not mean:
  - invent what the day should be about
  - decide campaign strategy
  - freeform “fill the calendar”
- if the visual label remains `Generate content` temporarily, its implementation contract still means `Create drafts from committed truth`

Locked v1 cuts / demotions:
- cut from Calendar Studio v1:
  - `Ask AI to fill gaps`
  - `Run pipeline`
- demote or merge:
  - freeform gap-filling should collapse into the planning conversation in `/samm`, not a calendar-day button
- keep `Add manually` as a secondary/manual escape hatch only
- keep low-level pipeline control in operational surfaces, not as a primary Calendar Studio action

Locked Calendar Studio v1 widget/build list:
- `monthly_planning_session`
  - structured planning intake used from `/samm`
- `calendar_month_grid`
  - month surface / summary grid
- `calendar_day_panel`
  - day drawer content
- `campaign_panel`
  - campaign/window drawer content
- `asset_readiness_panel`
  - campaign/event asset state and asset-needed capture
- existing widgets that remain relevant and should be reused where possible:
  - `calendar_event_inspector`
  - `content_batch_review`
  - `approval_queue`
  - `pipeline_run_timeline`
  - `failure_group`

Locked backend/read-model gaps for Calendar Studio v1:
- current `useListCalendarEvents` only returns raw calendar rows
- Calendar Studio v1 therefore needs explicit read models for:
  - month-grid summary
  - day detail
  - campaign/window detail
- it also needs careful event/window field expansion for:
  - objective
  - asset readiness
  - asset notes / source links
  - planning notes
- keep these additions narrow and aligned to existing calendar authority

Locked v1 cuts:
- no drag-and-drop calendar builder
- no separate full asset-management system
- no comments / version history
- no freeform autoplan with no structured confirmation
- no new detached campaign-planning subsystem
- no attempt to solve all future Calendar Studio layers in one release

Locked implementation order for the future Calendar Studio track:
1. lock config gaps
2. lock dynamic planning-session fields
3. lock committed calendar-output fields
4. lock workspace widget contracts for streamed planning surfaces
5. build Calendar Studio read models
6. build the month grid + day/campaign drawers
7. wire `/samm` planning widgets into those same contracts

Latest Calendar Studio prototype audit:
- the updated Replit build at:
  - `samm 2.0 UI/samm updated.zip`
  now contains the right v1 UI surface set
- confirmed prototype surfaces present in the updated zip:
  - `CalendarStudioPage`
  - `MonthlyPlanningSessionWidget`
  - `CalendarMonthGrid`
  - `CalendarDayPanel`
  - `CampaignPanel`
  - `AssetReadinessPanel`
- confirmed shared primitives present in the updated zip:
  - `ContentCapacityBar`
  - `DayMetricCounts`
  - `ContentChip`
  - `CampaignTimelineStrip`
  - `AssetReadinessPill`
  - `OwnershipChip`
- this updated zip is now good enough to act as the visual/source-composition reference for Calendar Studio v1
- treat it as:
  - visually valid
  - interaction-valid
  - component-valid
  - not yet live-data-valid
  - not yet live-widget-contract-valid

Locked Calendar Studio adoption rule:
- adoption must be pixel-to-pixel against the approved updated prototype
- do not reinterpret spacing, density, hierarchy, drawer composition, or day-card language during implementation
- keep the design boring, premium, and operational exactly as approved
- backend/data wiring may change underneath; visible UI composition should not drift without an explicit new design checkpoint

Locked Calendar Studio adoption checklist:
1. use as-is from the updated prototype
- visual composition of:
  - month grid
  - day drawer
  - campaign drawer
  - asset-readiness surface
  - planning-session surface
- shared primitives for:
  - capacity bars
  - day metric counts
  - content chips
  - ownership chips
  - campaign timeline strips

2. adapt for the live app before backend wiring
- extend live workspace widget contracts in:
  - `M.A.S UI/src/lib/workspace-adapter.ts`
- add explicit widget types for:
  - `monthly_planning_session`
  - `calendar_month_grid`
  - `calendar_day_panel`
  - `campaign_panel`
  - `asset_readiness_panel`
- add live renderer support for those widgets in the shared workspace path
- keep this step UI-contract-only; do not invent backend behavior here

3. backend/read-model work required before the Studio can be real
- current blocker:
  - `useListCalendarEvents` still returns only raw `academic_calendar` rows
- required read models:
  - month-grid summary
  - day detail
  - campaign/window detail
  - asset-readiness detail
- required narrow field expansion on calendar truth:
  - `objective`
  - `target_audience_note`
  - `asset_mode`
  - `asset_notes`
  - `source_asset_url`
  - `planning_notes`
- do not wire the Studio page to fake aggregates once implementation starts

4. adapt into the live frontend in this order
- first adopt the Calendar Studio widgets/page into the packaged target tree as the pixel reference
- then bind them to real read models
- then expose the same widget contracts to `/samm`
- only after those contracts are stable should inline tool/widget streaming render the same planning surfaces inside chat

5. explicitly defer
- freeform chat-first planning without structured widgets
- drag-and-drop month editing
- comments/version history
- full asset-management workflows
- any redesign pass that drifts from the approved prototype

Locked implementation-ready Calendar Studio contract:
- the approved updated prototype is the visual source
- the live backend/calendar domain is the data source
- adapters must bridge those two layers explicitly
- do not let prototype field names become accidental backend truth

Locked canonical live naming rule:
- backend/calendar truth stays grounded in the existing calendar/window/slot naming used by:
  - `academic_calendar`
  - `calendar-coordination.ts`
  - current content metadata refs
- canonical live refs remain:
  - `campaign_ref`
  - `window_ref`
  - `slot_ref`
  - `owner_pipeline`
  - `exclusive_campaign`
  - `support_content_allowed`
  - `channels_in_scope`
  - `allowed_ctas`
  - `primary_message`
  - `content_types_required`
- the prototype may use friendlier UI field names such as:
  - `campaignId`
  - `campaignName`
  - `ownerPipeline`
  - `campaignContext`
- those names are adapter/output concerns only, not new backend contracts

Locked structural-config field contract:
- existing durable planning config already in scope:
  - ICP
  - offers
  - seasonality
  - campaign defaults
  - approval policy
  - channel/module settings
- missing durable planning-default fields to add:
  - `business_type`
  - `industry_category`
  - `default_content_mix_policy`
  - `default_channel_weighting`
  - `asset_capability_profile`
  - `default_campaign_intensity`
  - `default_support_content_posture`
- these are the only Calendar Studio config additions allowed in v1 unless the docs are updated first

Locked dynamic planning-session field contract:
- `monthly_planning_session` is the structured intake surface
- editable fields:
  - `planning_month`
  - `monthly_objective`
  - `key_campaigns[]`
  - `temporary_emphasis[]`
  - `operator_capacity_note`
  - `asset_readiness_by_campaign`
  - `one_off_notes[]`
  - `status`
- each `key_campaign` may include only:
  - `id`
  - `name`
  - `kind`
  - `start_date`
  - `end_date`
  - `exclusivity`
  - `asset_readiness`
  - `notes`
- derived/session-summary fields that must remain read-only:
  - `total_planned_days`
  - `estimated_content_volume`

Locked committed calendar-output field contract:
- v1 should commit approved planning output into `academic_calendar` truth rather than inventing a second planner store
- current supported/grounded fields already present or already implied by the backend:
  - `label`
  - `event_type`
  - `event_date`
  - `event_end_date`
  - `lead_days`
  - `owner_pipeline`
  - `exclusive_campaign`
  - `support_content_allowed`
  - `channels_in_scope`
  - `allowed_ctas`
  - `disallowed_ctas`
  - `primary_message`
  - `content_types_required`
  - `posting_frequency`
  - `priority`
  - `max_posts_per_day`
  - `max_posts_per_week`
  - `min_gap_between_posts`
- narrow additions required for Calendar Studio v1:
  - `objective`
  - `target_audience_note`
  - `asset_mode`
  - `asset_notes`
  - `source_asset_url`
  - `planning_notes`
- these additions must be treated as committed planning truth, not loose chat annotations

Locked derived read-model contract:
- the following are display/read-model outputs only and must not be editable source-of-truth fields:
  - capacity bars
  - scheduled/draft/failed/waiting counts
  - readiness percentages
  - backlog counts
  - failure pressure indicators
  - mixed-ownership hints
  - open-slot counts
- required read models and exact purpose:
  - `month_grid_summary`
    - returns one month view with per-day derived counts, preview chips, active campaigns, and month totals
  - `day_detail`
    - returns one day with campaign context, per-channel limits, scheduled items, drafts, failures, notes, and open-slot state
  - `campaign_window_detail`
    - returns one campaign/window with date range, constraints, readiness, approval backlog, content breakdown, and timeline cells
  - `asset_readiness_detail`
    - returns asset state, source links, notes, and asset-request summary for one campaign/event context

Locked widget payload contract for live adoption:
- `calendar_month_grid`
  - payload should carry:
    - `month_label`
    - `month_iso`
    - `weekday_labels`
    - `days[]`
    - `total_scheduled`
    - `total_drafts`
    - `total_failed`
    - `total_open_slots`
    - `committed_percent`
    - `active_campaigns[]`
- `calendar_day_panel`
  - payload should carry:
    - base day-cell data
    - `campaign_context`
    - `support_content_allowed`
    - `per_channel_limits[]`
    - `scheduled_items[]`
    - `draft_items[]`
    - `failure_items[]`
    - `notes`
- `campaign_panel`
  - payload should carry:
    - `id`
    - `name`
    - `kind`
    - `color`
    - `start_date`
    - `end_date`
    - `objective`
    - `target_audience`
    - `owner_pipeline`
    - `exclusivity`
    - `support_content_allowed`
    - `messaging_constraints[]`
    - `cta_rules[]`
    - `offer_in_scope`
    - `asset_readiness`
    - `asset_source_links[]`
    - `asset_notes`
    - derived:
      - `content_breakdown`
      - `readiness_percent`
      - `missing_slots`
      - `approval_backlog`
      - `timeline[]`
- `asset_readiness_panel`
  - payload should carry only:
    - `context_id`
    - `context_label`
    - `state`
    - `source_links[]`
    - `notes`
    - `asset_request_summary`
- `monthly_planning_session`
  - payload should carry only the locked dynamic planning-session fields above plus read-only derived session-summary fields

Locked prototype-to-live mapping rule:
- use adapters to map prototype UI fields onto live truth:
  - `campaignId` -> `campaign_ref` or event/window identity resolved by adapter
  - `campaignName` -> `label`
  - `ownerPipeline` -> `owner_pipeline`
  - `supportContentAllowed` -> `support_content_allowed`
  - `exclusivity` -> `exclusive_campaign`
  - `ctaRules` -> `allowed_ctas`
  - `messagingConstraints` -> `primary_message` plus structured constraint arrays
  - `openSlots` -> derived from slots, not persisted directly
  - `contentBreakdown` / `approvalBacklog` / `readinessPercent` -> read-model outputs only
- never persist prototype display summaries directly when a canonical backend field or derivation already exists

Latest Calendar Studio first contract/render slice now in code:
- the slice stayed inside the first locked implementation boundary only:
  - widget contracts
  - renderer support
  - no read models
  - no page wiring
  - no backend/calendar mutations
- live workspace widget contract now includes:
  - `monthly_planning_session`
  - `calendar_month_grid`
  - `calendar_day_panel`
  - `campaign_panel`
  - `asset_readiness_panel`
- new live workspace renderer now exists in:
  - `M.A.S UI/src/components/workspace/WorkspaceWidgetRenderer.tsx`
- approved Calendar Studio prototype widgets are now mirrored into the live workspace layer as the local render source:
  - `M.A.S UI/src/components/workspace/calendar-studio/MonthlyPlanningSessionWidget.tsx`
  - `M.A.S UI/src/components/workspace/calendar-studio/CalendarMonthGrid.tsx`
  - `M.A.S UI/src/components/workspace/calendar-studio/CalendarDayPanel.tsx`
  - `M.A.S UI/src/components/workspace/calendar-studio/CampaignPanel.tsx`
  - `M.A.S UI/src/components/workspace/calendar-studio/AssetReadinessPanel.tsx`
- supporting shared primitives are now mirrored into:
  - `M.A.S UI/src/components/workspace/shared/*`
- the live workspace now renders structured widgets in both currently-available surfaces:
  - inspector drawer via `InspectorPanel.tsx`
  - `/samm` chat message body when a `WorkspaceMessagePart` of type `widget` appears
- current stop point is explicit:
  - widgets can render
  - payload producers for these widget types are not yet wired
  - Calendar Studio read models are not yet built
  - Studio routes/pages are not yet connected to live data
- validated checkpoints:
  - `npm run build`
  - `npm run build:packaged`
- build status note:
  - the same pre-existing sourcemap/chunk-size warnings remain
  - there were no new build failures

Locked next slice: Calendar Studio read-model layer only
- scope:
  - frontend-only derived read models
  - no page wiring
  - no widget payload production
  - no backend mutations
  - no schema changes
- read-model source tables for this slice:
  - `academic_calendar`
  - `content_registry`
  - `pipeline_runs`
- required outputs for this slice:
  - `month_grid_summary`
  - `day_detail`
  - `campaign_window_detail`
  - `asset_readiness_detail`
- implementation shape:
  - build the read-model layer in the live frontend under `M.A.S UI/src/lib/*`
  - outputs must already match the locked widget payload contracts
  - the layer may expose hooks and/or pure async loaders, but pages must not start using them in this slice

Locked derivation rules for the read-model slice
- canonical campaign identity:
  - use `academic_calendar.id` as the canonical event/campaign identity
  - derive the canonical window identity as `window:${academic_calendar.id}`
  - do not invent a second campaign id scheme
- content-to-campaign association precedence:
  1. `content_registry.metadata.campaign_ref` exact match to `academic_calendar.id`
  2. `content_registry.campaign_name` case-insensitive exact match to `academic_calendar.label`
  3. otherwise the content row is treated as unlinked/baseline content
- content-to-window association precedence:
  1. `content_registry.metadata.window_ref` exact match to derived `window:${academic_calendar.id}`
  2. fallback to the canonical campaign association above
- day bucketing precedence:
  - scheduled and approved rows bucket to `scheduled_at`
  - published rows bucket to `published_at` first, otherwise `scheduled_at`
  - draft / pending approval / rejected / failed rows bucket to `created_at`
  - rows without a usable timestamp are excluded from day-level bucketing
- active campaign window derivation:
  - derive `window_start` from `event_date - lead_days`
  - derive `window_end` from `event_end_date ?? event_date`
  - use `lead_days ?? 21`
  - use the currently-grounded calendar fields for owner pipeline and constraints
- primary day campaign selection:
  - if one active window touches the day, use it
  - if multiple windows touch the day, choose the highest-priority window first
  - priority resolution:
    - explicit `priority` descending
    - then shortest window duration
    - then earliest window start
    - then lexical id as final tie-break
- day ownership mode derivation:
  - `campaign_exclusive` when the primary active window is exclusive
  - `campaign_dominant` when there is one active non-exclusive campaign window
  - `mixed` when multiple active windows touch the day
  - `baseline` when there is no active window but linked/unlinked content exists for the day
  - `open` when none of the above apply
- daily capacity derivation:
  - base capacity uses the primary active window only
  - `max_posts_per_day` when present is authoritative
  - otherwise use `channels_in_scope.length` when scope exists
  - otherwise use `1` for an active campaign day
  - otherwise use `0`
  - `open_slots = max(capacity_max - capacity_used, 0)`
- per-channel limits derivation:
  - until explicit per-channel caps exist, every channel in scope has `max = 1`
  - if the active window has no `channels_in_scope`, derive the channel list from linked content on that day
- month totals derivation:
  - `total_scheduled`, `total_drafts`, `total_failed`, `total_open_slots` are sums across current-month days only
  - `committed_percent = round(total_scheduled / max(total_scheduled + total_drafts + total_failed + total_open_slots, 1) * 100)`
- preview-chip derivation:
  - max 3 chips per day
  - sort by:
    1. scheduled
    2. draft / pending approval
    3. failed
    4. newest timestamp
- campaign readiness derivation:
  - `content_breakdown` is grouped from all linked content rows across the resolved window
  - `approval_backlog = pending approval count`
  - `missing_slots = sum(open_slots)` across window days
  - `readiness_percent = round((published + scheduled) / max(published + scheduled + drafts + pending_approval + failed + missing_slots, 1) * 100)`
- asset readiness derivation for v1 before committed asset fields land:
  - `assets_ready` if a linked row has `media_url`
  - `partial_assets` if linked rows exist for the context but no linked row has `media_url`
  - `assets_needed` if there are no linked rows for the context
  - `source_links` come from linked `media_url` values first
  - this is provisional display state only until committed asset fields are added to calendar truth
- explicit stop point for the slice:
  - the new read-model layer may be implemented and verified
  - no page may begin consuming it yet
  - no drawer/chat payload producer may begin emitting the new widget types yet

Latest Calendar Studio read-model slice now in code:
- the slice stayed inside the locked boundary with one verification-only compatibility fix:
  - frontend-only derived read models
  - no page wiring
  - no widget payload production
  - no backend mutations
  - no schema changes
- new live read-model layer now exists in:
  - `M.A.S UI/src/lib/calendar-studio-read-models.ts`
- the layer now provides:
  - `loadCalendarStudioSourceBundle()`
  - `useCalendarStudioSourceBundle()`
  - `buildCalendarStudioMonthGrid()`
  - `buildCalendarStudioDayDetail()`
  - `buildCalendarStudioCampaignWindowDetail()`
  - `buildCalendarStudioAssetReadinessDetail()`
  - corresponding query hooks for each of the four locked outputs
- source bundle grounding in code:
  - `academic_calendar`
  - `content_registry`
  - `pipeline_runs`
- live channel compatibility note:
  - the workspace Calendar Studio layer now accepts `whatsapp` and `youtube` channels so the future read-model payloads can represent live content without lossy channel remapping
  - the workspace `ChannelIcon` renderer now supports those channels
- verification-only chat fix:
  - `agent/chat.tsx` now maps coordinator `invoked_action.status = completed` to workspace status tone `success`
  - this was required to clear typecheck and does not change runtime flow
- validated checkpoints:
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:packaged`
- build status note:
  - the same pre-existing sourcemap warnings remain
  - the same chunk-size warnings remain
  - there were no new build failures
- current explicit stop point:
  - the read-model layer exists
  - no page consumes it yet
  - no widget payload producer emits the new Calendar Studio widget types yet
  - no live Calendar Studio route/page wiring has started yet

Locked next slice: live Calendar Studio page wiring only
- scope:
  - wire `/calendar` to the approved Calendar Studio page composition
  - consume the live read models for month/day/campaign state
  - open the existing inspector drawer with the already-renderable Calendar Studio widgets
  - keep the approved prototype layout pixel-to-pixel
- allowed code changes in this slice:
  - add the live Calendar Studio route/page component
  - update route wiring for `/calendar`
  - add page-local helpers needed to open the correct inspector payloads
  - add page-local loading/empty states only where required by the live data path
- not allowed in this slice:
  - backend mutations
  - schema changes
  - pipeline triggers
  - page-level edit/create/delete forms
  - new read-model outputs beyond the ones already locked
  - `/samm` chat streaming changes
  - inspector action-button behavior changes
- live page-wiring rule:
  - `/calendar` becomes the Calendar Studio route
  - the previous CRUD page should remain in the repo as fallback/reference, but it is no longer the active route after this slice
- monthly planning widget rule for this slice:
  - the `Plan this month` button may open a provisional planning-session payload derived from the current month read-model/source bundle
  - this payload must stay inside the locked dynamic planning-session field contract
  - it must not write anything or imply committed planning state
- explicit stop point for the slice:
  - `/calendar` renders the approved Studio page against live read models
  - day clicks open `calendar_day_panel`
  - campaign clicks open `campaign_panel`
  - `Plan this month` opens `monthly_planning_session`
  - no other workflow behavior is introduced yet

Latest live Calendar Studio page-wiring slice now in code:
- the slice stayed inside the locked page-wiring boundary:
  - `/calendar` now points to a dedicated live Studio page component
  - the previous CRUD calendar page remains in the repo as fallback/reference
  - no backend mutations
  - no schema changes
  - no pipeline triggers
  - no chat streaming changes
- new live route/page component:
  - `M.A.S UI/src/pages/calendar-studio.tsx`
- route wiring change:
  - `M.A.S UI/src/App.tsx`
  - `/calendar` now renders the new live Calendar Studio page
- live page behavior now wired:
  - header month navigation
  - pixel-matched Studio month grid using `CalendarMonthGrid`
  - `Plan this month` opens `monthly_planning_session`
  - day cards open `calendar_day_panel`
  - campaign pills open `campaign_panel`
- page data path:
  - source bundle from `useCalendarStudioSourceBundle()`
  - month rendering from `buildCalendarStudioMonthGrid()`
  - day drawer payloads from `buildCalendarStudioDayDetail()`
  - campaign drawer payloads from `buildCalendarStudioCampaignWindowDetail()`
  - provisional planning-session payload derived from the current month source/read model only
- loading/error handling note:
  - the route now has dedicated loading and failure states for the live data path
  - no fallback to the old CRUD UI occurs at runtime
- validated checkpoints:
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:packaged`

Packaged-runtime correction locked before any further Calendar Studio work:
- the prior `/calendar` Studio wiring landed in the main app, but `localhost:5174` serves the packaged runtime rooted at `M.A.S UI/packaged-target/samm`
- therefore the next corrective slice must land natively in the packaged target:
  - the packaged route must stop forwarding to the main app calendar page
  - the packaged widget renderer must understand the five Calendar Studio widget types
  - the packaged runtime must expose the same approved Studio page composition and drawer widgets pixel-to-pixel
- allowed code changes in this corrective slice:
  - add packaged-target compatibility shims required to reuse the approved Studio page/read-model code safely
  - add the packaged-target Calendar Studio component tree and shared primitives
  - update packaged route wiring and packaged widget rendering only
- not allowed in this corrective slice:
  - backend/schema changes
  - workflow/write/commit logic
  - visual reinterpretation of the approved prototype

Packaged-runtime Calendar Studio correction now in code:
- the packaged target now has the native Calendar Studio compatibility layer needed to reuse the approved Studio page/read-model layer safely:
  - `M.A.S UI/packaged-target/samm/src/components/layout.tsx`
  - `M.A.S UI/packaged-target/samm/src/lib/calendar-studio-read-models.ts`
- the approved Studio component tree and shared primitives are now present in the packaged target at:
  - `M.A.S UI/packaged-target/samm/src/components/workspace/calendar-studio/*`
  - `M.A.S UI/packaged-target/samm/src/components/workspace/shared/*`
- packaged widget rendering now supports:
  - `monthly_planning_session`
  - `calendar_month_grid`
  - `calendar_day_panel`
  - `campaign_panel`
  - `asset_readiness_panel`
- packaged route wiring now points `/calendar` at the approved Studio page instead of the legacy CRUD surface:
  - `M.A.S UI/packaged-target/samm/src/pages/CalendarPage.tsx`
- validated checkpoints:
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:packaged`
- build status note:
  - the same pre-existing sourcemap warnings remain
  - the same chunk-size warnings remain
  - there were no new build failures
- new stop point:
  - `/calendar` on `localhost:5174` is now expected to render Calendar Studio
  - day/campaign/month planning drawers are live through the packaged inspector
  - no workflow/write/commit logic is wired yet
  - no manual CRUD carryover is reintroduced into Studio

Narrow post-adoption polish slice locked:
- only the `CalendarDayPanel` footer action row may change in this slice
- objective:
  - tighten the `Generate content` / `Add manually` / `Ask AI to fill gaps` / `Adjust constraints` / `Run pipeline` row to match the approved prototype density more closely
  - prevent wrapped labels and oversized button feel inside the packaged drawer
- not allowed:
  - no text changes
  - no logic changes
  - no layout changes outside the footer action row
  - no changes to month grid, campaign panel, or planner panel

Narrow footer-row polish now in code:
- updated `CalendarDayPanel` footer action density in:
  - `M.A.S UI/src/components/workspace/calendar-studio/CalendarDayPanel.tsx`
  - `M.A.S UI/packaged-target/samm/src/components/workspace/calendar-studio/CalendarDayPanel.tsx`
- exact polish applied:
  - prevent button shrink/wrap with `shrink-0` + `whitespace-nowrap`
  - tighten text rhythm from `text-[12px]` to `text-[11px]`
  - slightly tighten tertiary button horizontal padding
  - keep all labels, icons, actions, and surrounding layout unchanged
- validated checkpoints:
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:packaged`

First implementation slice under the revised v1 contract:
- scope is limited to two things only:
  1. real `/samm` Planning mode vs Execution mode guardrails
  2. Calendar Studio action-surface reduction to the revised v1 buttons
- allowed in this slice:
  - add explicit mode state to `/samm`
  - make `/samm` default to Planning mode
  - pass mode through the live coordinator request path
  - prevent scheduler / mutating action execution while in Planning mode
  - remove or relabel disallowed Calendar Studio actions so the drawers match the revised button contract
- not allowed in this slice:
  - commit/plan-write workflow
  - draft-generation wiring
  - new planner storage
  - backend schema changes
  - chat widget streaming expansion
  - broad Calendar Studio redesign
- build status note:
  - the same pre-existing sourcemap warnings remain
  - the same chunk-size warnings remain
  - there were no new build failures
- current explicit stop point:
  - `/calendar` is now Studio-backed
  - Studio drawers are live from page interactions
  - no commit/write workflow exists yet
  - no manual event CRUD has been reintroduced into the new Studio route
  - the next allowed slice is workflow wiring only, not visual reinterpretation

Planning/Execution guardrail slice now in code:
- `/samm` now exposes explicit `Planning` vs `Execution` mode in both:
  - `M.A.S UI/src/pages/agent/chat.tsx`
  - `M.A.S UI/packaged-target/samm/src/pages/SammPage.tsx`
- default mode is now `Planning`
- frontend coordinator requests now carry `mode` through:
  - `M.A.S UI/src/lib/api.ts`
  - `M.A.S UI/packaged-target/samm/src/services/liveSammService.ts`
- ingress now forwards mode and keeps existing callers safe by defaulting missing mode to `execution`:
  - `supabase/functions/coordinator-ingress/index.ts`
- scheduler fast-path guardrails are now active:
  - `resolveExplicitSchedulerRequest()` will still answer pipeline status in `Planning` mode
  - `run` / `resume` / explicit confirm paths no longer trigger pipelines in `Planning` mode
  - instead, they return a planning-safe guidance response
- legacy coordinator chat now enforces the same boundary:
  - `Planning` mode blocks live calendar mutation, write-post execution, pipeline triggers, and fast-path delete confirmation
  - prompt instructions explicitly require `action: null` for mutation/execution requests in `Planning` mode
  - model pipeline actions are also blocked server-side if they still leak through
- Calendar Studio action surfaces now match the revised v1 contract in both main and packaged copies:
  - `CalendarDayPanel`:
    - `Generate content` -> `Create drafts`
    - removed `Ask AI to fill gaps`
    - `Adjust constraints` -> `Edit rules`
    - removed `Run pipeline`
  - `CampaignPanel`:
    - `Add content` -> `Create campaign drafts`
    - removed `Regenerate batch`
    - removed support-toggle footer action
    - `Edit rules` -> `Edit campaign rules`
    - added `Update asset status`
- open-slot helper copy in the day drawer now matches the locked v1 meaning:
  - draft creation only from committed rules
  - no implication that the system will freeform-fill the calendar
- validated checkpoints:
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:packaged`
- build status note:
  - the same pre-existing sourcemap warnings remain
  - the same chunk-size warnings remain
  - there were no new build failures

Locked stop point after this slice:
- `/samm` now has a real planning-vs-execution boundary at the UI and coordinator layers
- Calendar Studio no longer advertises disallowed v1 actions
- no planning draft storage exists yet
- no calendar commit/write workflow exists yet
- no draft-generation wiring exists behind `Create drafts` yet
- the next allowed slice is workflow wiring only:
  - commit/review flow for the monthly planning session
  - explicit handler wiring for the reduced day/campaign actions
  - no broad new UI invention

Workflow-wiring diagnosis now locked before implementation:
- the current Studio widgets are rendered through the shared inspector, so action wiring must use a shared workflow controller/context rather than page-local button handlers
- this slice must only use two safe execution seams:
  1. real calendar-window mutation through the existing `academic_calendar` create/update paths already used by the legacy calendar UI
  2. explicit handoff into `/samm` with mode + starter context for collaboration/generation steps that do not yet have a deterministic direct action seam
- therefore, in this slice:
  - `Edit rules` / `Edit campaign rules` must reuse live calendar mutation dialogs against existing fields only
  - monthly planning `Review draft plan` / `Commit to calendar` must become explicit review/acknowledgement flow without inventing planner storage
  - `Create drafts` / `Create campaign drafts` must hand off into `/samm` `Execution mode` with explicit starter context, not trigger pipelines directly from Studio
  - `Add manually` must hand off into `/samm` planning collaboration rather than invent a new manual-content creation system in this slice
  - `Update asset status` must use planning-mode handoff, not schema writes, because explicit asset-state persistence is not in scope here
- explicitly not allowed in this slice:
  - new planner persistence
  - new calendar schema fields
  - direct pipeline trigger buttons inside Calendar Studio
  - speculative direct draft-generation endpoint invention
  - broad Calendar Studio redesign

Workflow-wiring slice now in code:
- a shared Calendar Studio workflow controller/provider now wraps both live shells:
  - `M.A.S UI/src/components/layout.tsx`
  - `M.A.S UI/packaged-target/samm/src/components/layout.tsx`
  - shared contract lives in `M.A.S UI/src/lib/calendar-studio-workflow.tsx`
- the live `/calendar` Studio page now registers explicit handlers for the reduced v1 workflow actions:
  - monthly planning:
    - `Review draft plan`
    - `Commit to calendar`
    - `Add campaign or key date`
  - day drawer:
    - `Create drafts`
    - `Add manually`
    - `Edit rules`
  - campaign drawer:
    - `Create campaign drafts`
    - `Edit campaign rules`
    - `Update asset status`
- handler behavior is now locked and implemented:
  - `Edit rules` / `Edit campaign rules` reuse the real `academic_calendar` create/update seams only
  - `Create drafts` / `Create campaign drafts` hand off to `/samm` in `Execution` mode with explicit starter context
  - `Add manually` and `Update asset status` hand off to `/samm` in `Planning` mode with explicit starter context
  - monthly planning review/commit remains acknowledgement/review flow only; no planner persistence was invented
- widget buttons are now actually wired through the shared controller in both main and packaged copies:
  - `MonthlyPlanningSessionWidget`
  - `CalendarDayPanel`
  - `CampaignPanel`
  - `AssetReadinessPanel`
- `/samm` now accepts Studio handoff query state in both runtimes:
  - reads `mode`
  - reads `prompt`
  - preloads the correct conversation mode and starter text
- packaged runtime now exposes `/samm` as an alias to the packaged SAMM page so Studio handoff paths stay uniform
- validation checkpoint for this slice:
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:packaged`

Locked stop point after workflow wiring:
- Calendar Studio v1 now has live read models and live action wiring without inventing new planner storage or fake direct draft endpoints
- Studio can now do only two kinds of operational work:
  1. real calendar-window mutation against existing fields
  2. explicit handoff into `/samm` for planning or execution collaboration
- still not solved:
  - planner/session persistence
  - direct deterministic draft-creation endpoint from Studio
  - explicit asset-state persistence
  - `/samm` inline tool-streamed Studio widgets with shared session state
- next disciplined step is no longer more Calendar Studio invention
- next diagnosis must return to the remaining `M14UI` gaps, especially:
  - `M14UI2` thread/tool-first workspace behavior and persistence
  - `M14UI3` remaining operational surface carryover
  - confirmation that `M14UI4` marketing migration is operationally stable enough to close

## Summary
The new UI is still not a big-bang replacement.
But the target is now explicit:
- the actual packaged `samm` frontend becomes the real migration destination
- the current hybrid shell/carryover work is only a checkpoint and adapter seed
- the next implementation slices must bind the live backend into the packaged app, not keep wrapping old pages

## Post-Test Findings
- packaged-runtime stale control bug was real and is now fixed locally:
  - packaged app had been mounting `WorkspaceShell` directly instead of the provider-backed `Layout`
  - result: Calendar Studio widget buttons rendered but their workflow actions were no-ops in the packaged runtime
  - fix: packaged app now mounts `Layout`, so the shared Calendar Studio workflow context is actually available
- packaged `/samm` confirmation bug was real and is now fixed locally:
  - confirmation buttons rendered from `message.actions` but had no click handler
  - fix: packaged SAMM page now routes action clicks back through `sendSammMessage(..., confirmationAction)`
- validated after the packaged fix:
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:packaged`
- important deployment diagnosis:
  - the local/frontend code is now sending `mode` correctly
  - if Planning mode still triggers live execution during manual testing, the running Supabase edge functions are not yet using the guarded backend code from this repo
  - this is a deploy/state issue, not a remaining frontend contract issue
- planning prompt/guidance was also tightened locally in:
  - `supabase/functions/coordinator-chat/index.ts`
  - `supabase/functions/coordinator-chat/scheduler.ts`
  but those changes will not affect live behavior until the edge functions are deployed

Deployment status update:
- `coordinator-chat` has now been deployed to Supabase project `jxmdwltfkxstiwnwwiuf`
  - verified by `supabase functions list`
  - remote version advanced from `28` to `29`
- `coordinator-ingress` deploy command also succeeded to the same project
  - remote list output still showed version `7`
  - treat this as "accepted deploy with no visible version bump" unless a later regression proves ingress is stale
- immediate regression expectation after this checkpoint:
  - Planning mode should now block pipeline run/resume, one-off post creation, and live calendar mutation
  - if those still execute, continue diagnosis against the live runtime path instead of the earlier pending-deploy assumption
