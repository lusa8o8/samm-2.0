# samm Product Architecture

## Product Model
`samm` should evolve as a hybrid control-plane product.

This means:
- `samm` is the primary coordinating intelligence and product identity
- structured dashboard views remain visible as trust, review, and operational surfaces
- users should be able to initiate work through `samm` and verify work through the dashboard

This is not a dashboard-first product and not a pure chat-first product.
It is a `samm-first, dashboard-supported` system.

## Primary Principle
The interface should answer two user needs at once:
- `tell samm what I need done`
- `show me the state of the work`

## Recommended Information Architecture
Top-level product areas:
- `samm`
- `inbox`
- `content`
- `calendar`
- `metrics`
- `ambassadors`
- `operations`
- `settings`

## Meaning Of Each Area
### samm
The primary coordination surface.
This is where users interact directly with the coordinating intelligence.

Purpose:
- ask for work
- direct campaigns or workflows
- review recommendations
- get summaries, explanations, and next steps
- issue commands across multiple subsystems

### inbox
The decision surface.

Purpose:
- approvals
- escalations
- reports
- flagged decisions
- suggested actions requiring human review

### content
The publishing surface.

Purpose:
- drafts
- approvals
- schedules
- published assets
- retries and channel-specific outputs

### calendar
The trigger surface.

Purpose:
- important dates
- academic timelines
- planning windows
- event-driven coordination triggers

### metrics
The feedback surface.

Purpose:
- outcome visibility
- trend tracking
- reach and engagement checks
- campaign performance feedback for future decisions

### ambassadors
The people surface.

Purpose:
- operators, ambassadors, or human contributors in the loop
- community-facing or field-facing workflow visibility

### operations
The system activity surface.
This replaces the current `Agent Manager` language.

Purpose:
- pipeline health
- run history
- workflow states
- failures, retries, and system visibility
- internal coordination traces that support trust

### settings
The workspace configuration surface.

Purpose:
- workspace settings
- org identity
- integrations
- universal business config
- user-level and system-level controls

## Navigation Priority
Recommended priority order in the left nav:
1. `samm`
2. `inbox`
3. `content`
4. `calendar`
5. `metrics`
6. `ambassadors`
7. `operations`
8. `settings`

Rationale:
- `samm` leads because it is the product identity and future primary interaction mode
- inbox/content/calendar/metrics remain highly visible because they are trust and workflow surfaces
- operations remains visible but should no longer feel like the main product identity

## Route Map
Recommended route structure:
- `/samm`
- `/inbox`
- `/content`
- `/calendar`
- `/metrics`
- `/ambassadors`
- `/operations`
- `/operations/overview`
- `/operations/chat` only temporarily if needed during transition
- `/operations/settings`
- `/settings`

## Transition Guidance
Short-term transition:
- add top-level `samm`
- route it to the current chat experience or an upgraded chat workspace
- rename `Agent Manager` to `Operations`
- keep `Overview` and `Settings` under `Operations`
- remove the need to discover chat inside a hidden submenu

Mid-term transition:
- expand `/samm` into a richer coordination workspace
- reduce the visibility of raw agent terminology in user-facing surfaces
- let operational views support trust rather than carry the primary identity
- adopt the new shared-workspace UI incrementally instead of swapping the whole frontend at once
- use the current UI as grounding for missing operational/admin surfaces during the transition

Long-term direction:
- `samm` becomes the clear front door
- dashboard surfaces behave like audit, monitoring, and execution contexts around `samm`

## What This Architecture Prevents
This structure avoids:
- making `samm` feel like a buried feature
- making the product feel like a generic dashboard with an optional chatbot
- prematurely collapsing into a chat-only experience that users may not yet trust
- forcing operations/debug language to stand in for the core product experience

## Summary
The product should evolve toward a `samm-first hybrid control plane`.
Users should talk to `samm` to coordinate work and use the surrounding surfaces to review, inspect, approve, and understand what the system is doing.
