# samm Asset Brief Architecture

This document defines the next-step contract for campaign visuals, one-time post visuals, and external rendering.

## Decision

`samm` will not generate images or videos internally for now.

`samm` owns:

- grounding
- planning intent
- message structure
- brand and campaign constraints
- brief/spec generation
- approval and tracking

External tools own rendering:

- Canva for image-based outputs
- Higgsfield for video outputs
- manual copy/paste into external tools when no direct integration exists yet

This keeps `samm` focused on deterministic planning and orchestration rather than becoming a visual studio.

## Product Model

There are three planning intents:

1. `campaign`
2. `one_time`
3. `recurring` later, not part of the first rollout

Only `campaign` creates an `academic_calendar` window.

`one_time` content should bypass campaign-window creation and route directly into content drafting.

## Current State

### Campaign flow today

```text
Calendar event
  -> academic_calendar
  -> pipeline-c-campaign
     -> campaign brief
     -> platform copy drafts
     -> plain-text design brief in content_registry
```

### One-time flow today

```text
Chat write_post action
  -> pipeline-d-post
     -> platform copy drafts only
```

Gaps:

- Calendar Studio treats all new dated events as campaigns.
- Pipeline D does not support visual briefs.
- Design briefs are plain text and effectively optimized for single-image assets.
- Carousel and video are not first-class brief formats yet.

## Target Flow

```text
Calendar Studio / samm chat
        |
        v
Intent selection or coordinator action
        |
        +-- campaign --------------------> academic_calendar
        |                                  |
        |                                  v
        |                           pipeline-c-campaign
        |                                  |
        |                                  +-- campaign brief
        |                                  +-- copy drafts
        |                                  +-- asset brief spec
        |                                  +-- human-readable brief
        |
        +-- one_time ---------------------> pipeline-d-post
                                           |
                                           +-- copy drafts
                                           +-- optional asset brief spec
                                           +-- optional human-readable brief
```

External generation then happens outside `samm`:

```text
asset brief spec
  -> manual copy/paste
  -> Canva adapter payload
  -> Higgsfield adapter payload
  -> returned asset URL / upload back into content
```

## Contract Shape

The canonical internal contract lives in:

- [supabase/functions/_shared/asset-brief-contract.ts](<C:/Users/Lusa/samm 2.0/supabase/functions/_shared/asset-brief-contract.ts:1>)

Important fields:

- `intent`: `campaign` or `one_time`
- `asset_need`: `none`, `static`, `carousel`, `video`, `design_brief`
- `brief_type`: defaulted from `intent` + `asset_need`
- `targets`: platform and placement outputs
- `brand_rules`: reusable brand visual constraints
- `slides`: used for carousel
- `storyboard`: used for video
- `external_generation`: source of truth for external rendering state

## Why Structured Spec First

The current plain-text design brief is fine for copy/paste, but it is not a stable contract for:

- Canva payload generation
- Higgsfield payload generation
- deterministic carousel planning
- storing visual decisions across agents

The structured spec becomes the source of truth. From it, `samm` can render:

- a marketer-facing natural-language brief
- a Canva adapter payload
- a Higgsfield adapter payload

## Asset Need Rules

### Campaign

Campaigns can set a visual default at the campaign level later, but the first required capability is:

- Pipeline C always supports asset briefs
- Pipeline C can emit `campaign_static`, `carousel`, or `video_storyboard`

### One-time

One-time posts should support:

- `none`
- `static`
- `carousel`
- `video`

If `asset_need !== none`, Pipeline D should generate an asset brief spec in addition to copy.

## Brief Types

The first brief types should be:

- `campaign_static`
- `one_time_static`
- `carousel`
- `video_storyboard`

This avoids building multiple design agents too early. One brief capability can render different formats from one schema.

## Pipeline Responsibilities

### Pipeline C

Owns:

- campaign planning
- campaign copy
- campaign visual briefing
- campaign-level defaults

Should output:

- campaign copy drafts
- one or more asset brief specs
- human-readable design brief view

### Pipeline D

Owns:

- one-off content drafting
- date-aware one-time scheduling context
- optional one-time visual briefing

Should output:

- one-time copy drafts
- optional asset brief spec when `asset_need !== none`
- human-readable brief view when applicable

## External Rendering Strategy

Generation remains external until the product proves a need to bring rendering in-house.

Benefits:

- faster execution
- lower product complexity
- better partnership surface area
- easier trust transfer from familiar tools
- less engineering burden while grounding is still evolving

For now, returned assets can be:

- copied back into `content_registry`
- stored as URLs
- attached through existing content workflows

## Example Specs

### One-time static asset

```json
{
  "version": "v1",
  "intent": "one_time",
  "asset_need": "static",
  "brief_type": "one_time_static",
  "objective": "announce graduation week",
  "audience": "students at CBU and UNILUS",
  "message": "Graduation week is happening on April 24, 2026.",
  "cta": "Register now",
  "scheduled_for": "2026-04-24",
  "targets": [
    { "platform": "facebook", "dimensions": "1080x1080" }
  ],
  "brand_rules": {
    "must_include": ["event date", "school names"],
    "must_avoid": ["crowded copy"]
  },
  "external_generation": {
    "producer": "manual",
    "adapter": "copy_paste",
    "status": "not_requested"
  }
}
```

### Carousel

```json
{
  "version": "v1",
  "intent": "campaign",
  "asset_need": "carousel",
  "brief_type": "carousel",
  "objective": "educate students on exam preparation",
  "audience": "university students",
  "message": "Study tips that improve exam readiness.",
  "cta": "Save this post and share with a friend",
  "targets": [
    { "platform": "facebook", "placement": "feed", "dimensions": "1080x1080" }
  ],
  "slides": [
    { "slide_number": 1, "role": "hook", "headline": "Exams next week?", "supporting_copy": "Start here." },
    { "slide_number": 2, "role": "detail", "headline": "Time blocking", "supporting_copy": "Study in focused sessions." },
    { "slide_number": 3, "role": "proof", "headline": "Practice recall", "supporting_copy": "Test yourself before the exam." },
    { "slide_number": 4, "role": "cta", "headline": "Save this guide", "supporting_copy": "Use it tonight." }
  ],
  "external_generation": {
    "producer": "canva",
    "adapter": "canva_payload",
    "status": "brief_ready"
  }
}
```

### Video storyboard

```json
{
  "version": "v1",
  "intent": "one_time",
  "asset_need": "video",
  "brief_type": "video_storyboard",
  "objective": "promote a short event teaser",
  "audience": "students and parents",
  "message": "Join graduation week celebrations.",
  "cta": "Get your ticket",
  "targets": [
    { "platform": "youtube", "placement": "short", "dimensions": "1080x1920" }
  ],
  "storyboard": [
    { "frame_number": 1, "timestamp_hint": "0-3s", "scene_prompt": "Students entering campus", "on_screen_text": "Graduation Week" },
    { "frame_number": 2, "timestamp_hint": "3-7s", "scene_prompt": "Crowd energy and decorations", "voiceover_line": "Celebrate the moment together." },
    { "frame_number": 3, "timestamp_hint": "7-10s", "scene_prompt": "Ticket CTA screen", "on_screen_text": "Register now" }
  ],
  "external_generation": {
    "producer": "higgsfield",
    "adapter": "higgsfield_payload",
    "status": "brief_ready"
  }
}
```

## Rollout Order

1. Land the shared schema.
2. Add a first-class `create_one_time_post` coordinator action.
3. Update Calendar Studio manual flow to create one-time posts instead of fake campaign windows.
4. Extend Pipeline D to accept `scheduled_for`, `asset_need`, and optional `event_ref`.
5. Generate one-time asset brief specs from Pipeline D when `asset_need !== none`.
6. Render a human-readable brief alongside the JSON spec for copy/paste.
7. Add Canva adapter payload generation.
8. Add Higgsfield adapter payload generation.

## PMF Guardrail

Do not over-design recurring content or native rendering yet.

The first product win is:

- campaigns stay campaigns
- one-time posts stop becoming campaign windows
- visuals use a shared spec
- rendering stays external

Everything else can wait for real usage feedback.
