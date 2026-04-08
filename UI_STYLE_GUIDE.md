# samm UI Style Guide

## Purpose
This guide defines how the `samm` product should look and feel across the dashboard, login experience, and future product surfaces. It translates the brand into practical interface decisions so the product feels cohesive, intentional, and trustworthy.

## Core Principle
`samm` should feel like an operating surface, not a decorated SaaS template. The interface should communicate calm control over complex work.

The visual system should consistently suggest:
- clarity over spectacle
- restraint over clutter
- oversight over noise
- human judgment over AI theatrics

## Design Personality
The product UI should feel:
- calm
- precise
- editorial but operational
- modern without trend-chasing
- human-guided, not machine-showy

It should not feel:
- glossy
- overly futuristic
- gamified
- cartoonish
- overloaded with analytics decoration

## Layout Principles
- Use strong structure and spacing before using color.
- Prefer clear sections with stable alignment.
- Use negative space deliberately to reduce mental pressure.
- Make pages feel composed even when data is dense.
- Avoid cluttered dashboards with too many competing panels.

## Color Application
Base the UI on a monochrome-first system.

Primary surfaces:
- dark sidebar or dark focal panel: `#0B0B0C`
- light content surface: `#F5F3EF` or near-white
- default page background: soft light neutral with minimal warmth
- primary text on light surfaces: near-black
- primary text on dark surfaces: white

Use accent color sparingly:
- reserve accent for primary actions, unread counts, active states, and key system emphasis
- do not use multiple saturated accent colors at once
- status colors should be practical and muted, not neon

## Typography System
### Brand Wordmark
- always lowercase `samm`
- high contrast against the background
- slightly imperfect, custom-feeling, non-geometric
- no decorative treatments

### UI Typography
Use clean, neutral supporting typography that lets the wordmark carry the personality.

Recommended UI font directions:
- Inter
- IBM Plex Sans
- Manrope

Usage:
- page titles should be firm and quiet, not oversized
- supporting text should be readable and slightly softened
- labels should be compact and useful, not ornamental

Avoid:
- excessive font mixing
- overly condensed display type in product UI
- giant hero typography inside the application shell

## Shape and Component Language
Use simple geometry with slightly softened edges.

Guidance:
- cards should feel stable, not floating excessively
- border radii should be moderate, not overly pill-like
- inputs and buttons should feel direct and usable
- separators and borders should be subtle but present
- shadows should be minimal and mostly used for layer separation

Avoid:
- glassmorphism
- heavy blur effects
- bright gradient panels
- glowing AI-style borders

## Sidebar Style
The sidebar should feel like the control spine of the system.

Rules:
- dark background is preferred
- strong contrast between active and inactive states
- active nav item should feel grounded, not flashy
- unread counts and state badges should be compact and crisp
- footer identity area should be simple and product-like, not crowded

Brand treatment:
- the sidebar is an appropriate place for the `samm` wordmark once implemented
- the wordmark should lead, with supporting context secondary

## Card Design
Cards are where the system presents work to be reviewed, approved, or understood.

Rules:
- cards should have clear hierarchy: type, title, preview, metadata, action
- do not over-style every card variant differently
- trust spacing and typography before introducing more color
- previews should be quiet and easy to scan
- expanded states should feel like deeper reading, not a new app inside the card

For inbox and content cards:
- collapsed state should stay compact and scannable
- expanded state should support comfortable reading with proper markdown styling
- metadata should remain subordinate to the title and summary

## Data Views
Metrics, tables, and pipeline views should feel operational rather than decorative.

Rules:
- prioritize legibility
- use whitespace and alignment to create order
- prefer a few strong visual anchors over many small chart ornaments
- status chips should be clean and muted
- charts should not dominate the interface unless the page is explicitly analytics-first

## Motion
Motion should be minimal and meaningful.

Use motion for:
- expanding and collapsing content
- page transitions only if subtle
- hover and focus states
- loading transitions that reduce abruptness

Avoid:
- playful bounce
- decorative animations
- constant pulsing or shimmer beyond skeleton loading

## Login Experience
The login screen should do more than authenticate. It should reassure the user that this system is for them.

The login experience should communicate:
- business control
- reduction of marketing chaos
- calm coordination
- software built for real operators and small teams

Structure guidance:
- keep the split-screen structure or equivalent strong composition
- one side should carry the functional form
- the other side should carry brand atmosphere, audience relevance, and emotional promise

## Login Imagery Direction
Default direction:
- use a 2x2 image grid instead of a slideshow

Reason:
- it communicates audience breadth immediately
- it feels more editorial and intentional
- it avoids generic carousel behavior
- it can show multiple user archetypes without adding interaction burden

Image content should depict:
- founders reviewing campaign or business performance
- small teams planning or approving work
- operators working calmly from dashboards or laptops
- owners or coordinators in control, not overwhelmed

Image tone should be:
- grounded
- modern
- real
- calm
- business-relevant
- lightly cinematic without looking like ad stock

Avoid imagery that feels:
- like a corporate handshake ad
- overly polished stock photography
- chaotic, frantic, or cliché startup hustle

## Copy Style in Product UI
The interface copy should remain direct and useful.

Headings:
- short
- clear
- non-promotional

Supporting text:
- explain what matters
- reduce uncertainty
- avoid hype language

Empty states and helper text should sound like:
- an operator speaking clearly
- not a chatbot trying to impress

## Accessibility and Trust
Trust is part of the visual system.

Required qualities:
- strong contrast
- readable type sizes
- clear focus states
- obvious action hierarchy
- consistent navigation placement
- no reliance on color alone for status meaning

## What to Avoid
Do not let the product drift into:
- generic AI startup gradients
- purple-on-white default SaaS aesthetics
- excessive chart chrome
- cute assistants or mascots in product-critical flows
- over-rounded toy-like component styling
- dense interface clutter disguised as sophistication

## Implementation Priorities
When applying this guide to the current product, prioritize:
1. replacing `TSH`-specific visual identity with `samm` branding where appropriate
2. refining the login screen to reflect the `samm` brand and target audience
3. tightening spacing, hierarchy, and contrast across the dashboard
4. ensuring cards and tables feel consistent under one visual system
5. keeping the product calm as more features are added

## Summary
`samm` should look like a system that absorbs operational chaos and turns it into coordinated flow. The UI should feel composed, legible, and confident. The design should trust typography, spacing, contrast, and image selection more than decorative effects.
