# Pipeline B/C Calendar Coordination

## Purpose
This contract defines how `Pipeline B` and `Pipeline C` coordinate through the calendar.

The calendar is no longer just a trigger source.
It is the deterministic authority for:
- campaign windows
- timing
- window ownership
- exclusivity
- support-content permissions
- posting budgets
- CTA / message constraints inside a window

Locked naming:
- physical table may remain `academic_calendar`
- code and domain wrappers should treat it as `campaign_calendar`

## Current Implementation Checkpoint
Live and validated so far:
- shared calendar helper resolves campaign windows, horizon-bound slots, and ownership semantics
- scheduler admission checks now gate `Pipeline B` and `Pipeline C` against the resolved calendar context
- exclusive `Pipeline C` windows now block `Pipeline B`
- `Pipeline C` emits structured campaign constraints
- `Pipeline B` plans only against resolved baseline/support slots
- `publish-scheduled` now runs calendar preflight before final action

Still intentionally open inside `M14B`:
- richer support-slot budgeting beyond the current exclusive-window gate
- stronger content-strategy / distribution-rule wiring for `Pipeline B`
- future UI-facing inspection surfaces for Calendar Studio
- current calendar UI now exposes `support_content_allowed` explicitly
  - `Allow support content` is now the operator control for `Pipeline B` support slots
  - `Allow creative deviation` remains design-only and should not be treated as the campaign-support switch
- latest validation note:
  - `Pipeline C` remains the stronger grounded path under the current contracts
  - `Pipeline B` now plans with deterministic slot directives, but residual brand-config language can still dominate if the org config itself is heavily source/story weighted

## Core Principle
`Pipeline B` and `Pipeline C` must not compete through prompt behavior.

Instead:
- config defines stable business truth
- calendar defines time-bound campaign truth
- scheduler enforces ownership and conflicts
- validators enforce final legality
- pipelines operate only inside calendar rules

## Responsibility Split

### `Pipeline B`
Role:
- baseline / weekly / gap-filling engine

Rules:
- fills approved non-campaign gaps
- may support a campaign window only if support content is explicitly allowed
- must not create competing campaign narratives
- should plan against allowed slots, not free-form weekly space

### `Pipeline C`
Role:
- campaign owner

Rules:
- owns campaign windows
- defines campaign-specific message direction and CTA constraints
- may reserve or claim slots for the window
- may suppress or constrain `Pipeline B`

Hierarchy:
- `Pipeline C` campaign ownership takes precedence over `Pipeline B` baseline planning

## Required Window Concepts
Even if not fully normalized yet, code should behave as if these concepts exist:

- `window_start`
- `window_end`
- `owner_pipeline`
- `exclusive_campaign`
- `support_content_allowed`
- `channels_in_scope`
- `allowed_ctas`
- `primary_message`
- `priority`
- `max_posts_per_day`
- `max_posts_per_week`
- `min_gap_between_posts`
- slot reservations or equivalent reserved-state semantics

## Slot Contract
Even before a physical slot table exists, the system must behave as if a strict slot contract exists.

Minimum slot shape:
- `date`
- `channel`
- `purpose` = `baseline | campaign | support`
- `owner_pipeline`
- `max_posts`
- `current_posts`
- `allowed_ctas`
- `allowed_content_types`
- `window_ref`
- `campaign_ref`

Locked rule:
- pipelines must never invent slots
- pipelines may only consume resolved / allowed slots

## Support Content Contract
`Support content` is now explicitly defined.

Support content:
- must not introduce a new offer
- must not override the campaign CTA
- must reinforce the campaign message or window objective
- must remain inside allowed channels and posting budgets

Initial support content types:
- `reminder`
- `reinforcement`
- `faq`
- `testimonial`
- `countdown`

Locked rule:
- if `Pipeline B` is allowed inside a `Pipeline C` window, it may only emit support content that satisfies this contract
- if a window is both `exclusive_campaign = true` and `support_content_allowed = true`, the scheduler should still expose deterministic support-only slots for `Pipeline B` instead of treating the window as fully closed

## Planning Horizon
Default planning horizon:
- `7 days`

Locked rule:
- `Pipeline B` planning must be horizon-bound
- no open-ended weekly planning or freeform extension beyond the horizon without explicit config

## Deterministic Rules
1. No publish or schedule action should happen without a calendar context check.
2. If a calendar window is owned by `Pipeline C` and marked exclusive, `Pipeline B` may not schedule inside that window.
3. If a calendar window is owned by `Pipeline C` and marked `support_content_allowed = true`, `Pipeline B` may schedule only support content aligned with the campaign message / CTA constraints.
4. If no active campaign window exists, `Pipeline B` may operate normally as the baseline engine.
5. If multiple windows overlap, the highest-priority window wins; if priority is tied, require deterministic tie-break or human resolution.
6. Posting budgets must be enforced centrally, not by prompt logic.
7. `Pipeline C` must explicitly claim ownership of the campaign window when it starts.
8. `Pipeline B` should only plan against open / allowed slots, not free-form weekly space.

Tie-break order:
1. explicit `priority`
2. shorter window wins
3. earlier start date wins
4. fallback to human resolution

## Scheduler Responsibilities
This logic belongs in the scheduler and validation layer, not only in prompts.

### When `Pipeline B` starts
- read relevant upcoming / active campaign windows
- determine whether the planning horizon intersects a `Pipeline C`-owned window
- if yes:
  - deny conflicting slots
  - or restrict B to non-window gaps
  - or mark B support-only if the calendar allows support content

### When `Pipeline C` starts
- claim ownership of the campaign window
- mark exclusivity / support rules
- optionally reserve slots
- expose downstream conflict state to `Pipeline B`

### When `publish-scheduled` runs
- perform final calendar preflight
- block publishes that violate ownership, budget, exclusivity, or CTA/channel constraints

## Decision Log Contract
Scheduler and validator decisions must be explainable.

Minimum decision-log shape:
- `reason_code`
- `window_ref`
- `slot_ref` nullable
- `rule_triggered`
- `decision` = `allowed | blocked | constrained`
- `alternative_action` nullable

Examples of `reason_code`:
- `blocked_by_exclusive_campaign`
- `restricted_to_support_content`
- `blocked_by_channel_budget`
- `blocked_by_cta_constraint`
- `won_tie_break_on_priority`

Locked rule:
- blocked or constrained actions must emit structured reasons, not just internal branching

## Campaign Constraint Schema
`Pipeline C` must output structured campaign constraints, not vague direction.

Minimum campaign constraint shape:
- `primary_message`
- `allowed_ctas`
- `disallowed_ctas`
- `channels_in_scope`
- `content_types_required`
- `posting_frequency`
- `exclusive_campaign`
- `support_content_allowed`

Locked rule:
- downstream logic should consume explicit constraints
- do not rely on prompt wording alone as campaign ownership state

## Validation Requirements
Calendar-aware validators should eventually enforce:
- slot ownership
- exclusivity conflicts
- channel allowed
- posting budget exceeded
- support-content compliance
- CTA allowed in this window
- duplicate or conflicting campaigns within the same window

Locked rule:
- prompts must not be trusted to remember these constraints
- code must validate them explicitly

## UI Implications
The future shared workspace should make calendar coordination visible through:
- campaign window inspector
- owner-pipeline badge
- exclusive / support status
- slot usage / posting budget
- support-content-allowed flag
- linked planned content

The user should be able to see why `Pipeline B` is suppressed or why `Pipeline C` owns the window.

## Calendar Studio Readiness
Calendar Studio is not a current UI implementation task.
It is a backend/domain contract requirement.

The calendar domain should be able to support future queries like:
- what windows are active on this date
- who owns this day or window
- which slots are open
- why `Pipeline B` is blocked or allowed here
- which content items are linked to this day or window
- which campaign constraints apply here
- how a campaign traces from start to end

## Milestone Placement
This work remains inside `M14B` as a deterministic planning-truth extension.

It should not become a vague prompt-tuning exercise or a separate milestone family before:
- structured config tightening
- settings summary cleanup
- current planner-fidelity issues are addressed
