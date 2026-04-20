# Structured Config Contract

## Purpose
This document defines the deterministic business-truth layer for `samm 2.0`.

The goal is to remove free-text business truth from prompts and runtime guesswork.

Pipelines, CRM, and Sales should read and apply structured config.
They should not reinvent:
- ICP
- offers
- seasonality
- discounts
- outreach rules
- approval defaults

## Scope
This contract corresponds to `M14B`.

## Core Objects

### `icp_categories`
Purpose:
- reusable audience categories per org

Expected fields:
- `id`
- `org_id`
- `name`
- `active`
- `description` nullable
- `hard_filters` jsonb
- `soft_signals` jsonb
- `exclusion_rules` jsonb
- `default_channels` array
- `default_cta_style` nullable
- `default_offer_ids` array
- `default_outreach_policy_id` nullable
- `priority_score`

### `offer_catalog`
Purpose:
- central definition of what the business sells

Expected fields:
- `id`
- `org_id`
- `active`
- `name`
- `type`
- `category`
- `description` nullable
- `base_price` nullable
- `currency` nullable
- `pricing_model` nullable
- `valid_from` nullable
- `valid_until` nullable
- `applicable_icp_ids` array
- `applicable_channels` array
- `applicable_subjects` array nullable
- `applicable_seasons` array nullable
- `default_cta` nullable
- `delivery_method` nullable
- `landing_url` nullable
- `discount_allowed`
- `discount_policy_id` nullable
- `approval_required`
- `priority_score`

### `seasonality_profile`
Purpose:
- merchant-defined demand truth

Expected fields:
- `id`
- `org_id`
- `name`
- `description` nullable
- `active`

Related period fields should support:
- date boundaries
- demand level
- allow discounts flag
- outreach intensity
- campaign priority
- notes

### `discount_policies`
Purpose:
- deterministic discount control

Expected fields:
- `id`
- `org_id`
- `name`
- `max_discount_percent`
- `allowed_discount_types` array
- `allowed_offer_ids` array
- `allowed_icp_ids` array
- `allowed_conditions` jsonb
- `forbidden_conditions` jsonb
- `cooldown_days`
- `stacking_allowed`
- `approval_required`

Locked rule:
- no free-form discount overrides in this phase

### `outreach_policy`
Purpose:
- deterministic send / no-send rules

Expected fields:
- `id`
- `org_id`
- `name`
- `min_icp_fit_score`
- `min_trigger_confidence`
- `negative_signal_suppression_days`
- `max_contacts_per_7d`
- `max_contacts_per_30d`
- `channel_rules` jsonb

### `campaign_defaults`
Purpose:
- default campaign behavior without hidden prompt assumptions

Expected fields:
- `id`
- `org_id`
- `default_duration_days`
- `default_channels` array
- `default_objective` nullable
- `default_cta_style` nullable
- `default_icp_category_id` nullable

### `approval_policy`
Purpose:
- formalize when approval is required

Expected fields:
- `id`
- `org_id`
- `brief_approval_required`
- `copy_approval_required`
- `discount_approval_required`
- `outreach_approval_required`
- `notes` nullable

## Calendar Rule
The physical DB table remains:
- `academic_calendar`

The neutral domain concept is:
- `campaign_calendar`

Structured config and calendar must stay distinct:
- config = stable business truth
- calendar = time-bound timing and ownership

## Behavioral Rules
1. Config stores merchant-defined truth.
2. Calendar stores timing-bound intent.
3. Pipelines reference config and calendar; they do not redefine them.
4. Discounts must come from `offer_catalog` plus `discount_policies`.
5. No model may invent seasonality or offer logic outside config.

## Acceptance Criteria
- low/high demand can be configured without prompt rewriting
- offers are selected from catalog, not hallucinated
- discounts are policy-backed only
- future CRM / Sales layers can reference these objects directly
