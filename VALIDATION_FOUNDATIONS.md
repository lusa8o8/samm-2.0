# Validation Foundations

## Purpose
This document defines the explicit validation layer required before outreach, sales, learning, and broader external automation expand.

This corresponds to `M15D`, but the contract is locked now to prevent drift in earlier milestones.

## Principle
No external action and no important derived-state commit should bypass validation.

Validation exists to prevent:
- hallucinated business truth
- policy violations
- invalid timing
- illegal discounts
- bad outreach cadence
- low-confidence derived-state commits

## Validator Families

### 1. Input Completeness Validators
Purpose:
- ensure required fields and references exist before work proceeds

Examples:
- required config presence
- required calendar references
- required identity fields
- required offer references

### 2. Policy Validators
Purpose:
- ensure decisions conform to org policy

Examples:
- ICP fit thresholds
- outreach cadence policy
- approval requirements
- discount policy

### 3. Calendar Validators
Purpose:
- ensure timing and ownership are valid

Examples:
- campaign window validity
- slot ownership
- posting budget or cadence conflicts

### 4. Offer / Discount Validators
Purpose:
- stop invented or non-compliant commercial behavior

Examples:
- offer exists
- offer is active
- discount is allowed
- discount does not exceed maximum
- forbidden conditions are not violated

### 5. Outreach Validators
Purpose:
- ensure outbound messaging deserves to happen

Examples:
- trigger confidence threshold
- channel policy
- quiet hours
- opt-in requirements
- cooldown checks

### 6. Publish Validators
Purpose:
- ensure content is safe to send/publish

Examples:
- correct channel
- allowed CTA
- not duplicate
- approval state is satisfied

### 7. Commit Validators
Purpose:
- stop weak evidence from becoming durable system truth

Examples:
- outcome confidence threshold
- pattern promotion threshold
- sequence result attribution threshold

## Implementation Direction
Validators should be:
- explicit modules or functions
- reusable
- inspectable
- callable from pipelines and future CRM / Sales logic

Validators should not be:
- scattered one-off conditionals
- prompt-only rules
- implied but undocumented assumptions

## Locked Dependencies
Before CRM P2, Sales, or Learning expands:
- validation contracts must exist
- key validators must be callable

This is why `M15D` is intentionally pulled earlier in the roadmap order.

## Acceptance Criteria
- new external-action paths cannot bypass validation
- discount and outreach logic can be checked deterministically
- future pipelines can call validators instead of embedding policy ad hoc
