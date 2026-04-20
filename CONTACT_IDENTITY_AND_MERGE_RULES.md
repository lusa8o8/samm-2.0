# Contact Identity And Merge Rules

## Purpose
This document locks the contact identity rules for `samm 2.0` before CRM `P1` implementation.

The goal is boring precision:
- false negatives are acceptable
- false merges are expensive
- uncertainty is better than hidden identity hallucination

## Merge Precedence
Use this precedence order:

1. explicit internal `contact_id`
2. WhatsApp number
3. email
4. channel-specific external id
5. weak social or display-name hints -> never auto-merge

## Hard Rule
No auto-merge when strong identifiers disagree.

If two records disagree on strong identifiers such as:
- WhatsApp number
- email

then `SAMM` must not auto-merge later based on soft evidence.

Required behavior:
- preserve both records
- create uncertainty or review-needed state
- wait for explicit human resolution or deterministic future rule

## Weak Identifier Rule
Weak identifiers include:
- display name
- profile name
- loose social hints
- inferred affinity

Weak identifiers may:
- suggest potential relationship
- contribute to confidence

Weak identifiers may not:
- force merges
- override strong identifiers

## Expected CRM P1 Objects
These rules will apply to:
- `contacts`
- `contact_signals`
- `contact_scores`
- `contact_segments`
- `trigger_queue`

## Confidence Rule
Signals are evidence, not truth.

Contact truth should emerge from:
- explicit identifiers
- bounded scoring logic
- deterministic merge rules

not from loose narrative inference.

## Acceptance Criteria
- conflicting strong identifiers do not silently merge
- weak identifiers never force identity collapse
- uncertainty states remain visible and recoverable for later review
