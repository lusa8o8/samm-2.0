# Content Strategy And Distribution Contract

## Purpose
This contract defines the deterministic baseline content-strategy layer for `samm 2.0`.

It exists to reduce weekly planning drift in `Pipeline B` by making content categories, volume, and channel distribution explicit.

This is not a campaign-specific document.
It is the baseline planning truth that campaigns may override through calendar ownership rules.

## Core Principle
If content volume, content type, posting cadence, or promotional density matters, it must come from config or calendar rules, not from model inference.

Split:
- config = stable baseline strategy
- calendar = this-window overrides

## Universal Content Categories
The first universal taxonomy is:
- `education`
- `inspiration`
- `interactive`
- `trust`
- `promotional`

These categories are intentionally universal enough to work across:
- retail / CPG
- SaaS / B2B
- professional services
- creator businesses
- edtech and other verticals

## Baseline Planning Controls
Structured config should eventually define:
- baseline posts per week
- per-channel caps / mins / maxes
- content-category percentage targets
- maximum promotional ratio
- CTA density rules
- repetition spacing
- support-content allowance rules
- planning horizon

The planning engine should use these controls to answer:
- how much content this week
- on which channels
- in what content mix
- with how much promotional pressure

Default planning horizon:
- `7 days`

## Seeded Default Profiles
The system may seed default profiles by industry cluster, but these are defaults, not immutable truth.

Example clusters:
- `b2b_tech_saas`
- `b2c_retail_cpg`
- `professional_services`
- `creator_influencer`

Example baseline directional mixes:
- B2B / Tech / SaaS: heavier `education` and `trust`
- B2C / Retail / CPG: heavier `inspiration` and `interactive`
- Professional Services: heavier `trust` and `education`
- Creator / Influencer: heavier `inspiration` and `interactive`

Locked rule:
- default matrices may seed org config
- org-level config must be able to override them
- later learning may refine them, but learning must not bypass explicit config without thresholds

## Pipeline B Behavioral Contract
`Pipeline B` should stop asking:
- what should we post this week

`Pipeline B` should start asking:
- which baseline or support slots are open this week, and what mix should fill them

That means:
- baseline planning must obey the configured content-strategy profile
- campaign windows may suppress or constrain baseline planning
- outputs should be taggable by:
  - content category
  - slot / window
  - baseline vs support classification
  - channel
  - CTA intent

## Support Content Rules
Support content is not a loose label.

Support content:
- may reinforce a campaign
- may remind, explain, reassure, count down, or provide proof
- may not introduce a competing offer
- may not override the campaign CTA
- must fit the window constraints and slot allowance

Initial support content types:
- `reminder`
- `reinforcement`
- `faq`
- `testimonial`
- `countdown`

Locked rule:
- `Pipeline B` support output must be classified explicitly
- support classification must be validator-checkable in code

## Campaign Override Rule
Campaigns do not erase the baseline strategy.
They temporarily override it for owned windows.

Therefore:
- config owns the default weekly distribution logic
- calendar windows owned by `Pipeline C` may override:
  - volume
  - channels
  - support-content allowance
  - CTA restrictions
  - message direction

## Validation Implication
The validation layer should eventually enforce:
- weekly volume caps
- per-channel caps
- promotional ratio limits
- campaign override compliance
- support-content classification when a campaign window is active

## Calendar Studio Readiness
This contract must remain inspectable by the future planning surface.

That means the backend should preserve enough structure for the UI to later render:
- slot purpose
- content category
- campaign vs baseline vs support classification
- channel distribution
- posting budget usage
- validator decisions

## Milestone Placement
This work stays inside `M14B`.

Reason:
- it extends structured config and planning truth
- it explains a large part of current `Pipeline B` drift
- it should be implemented before UI adoption is asked to represent it
