# samm Workspace Wireframe Spec

## Purpose
This document defines the future structure of the `/samm` page so it becomes more than a basic chat screen. It should act as the product's main coordination workspace.

This should now be read together with:
- `SAMM_UI_ADOPTION_PLAN.md`

Because the new shared-workspace UI exists in packaged prototype form and will be adopted incrementally into the live app.

## Core Role
`/samm` should be the place where users:
- ask for work to be done
- receive recommendations and summaries
- understand what is blocked
- approve or delegate next actions
- move between conversation and structured operational context
- interact with structured tool outputs inside the same shared workspace

It is not just a chat box.
It is the coordination workspace.

## Core Layout
Recommended layout:
- top context header
- main conversation/work area
- right-side or lower companion panels for operational context

## Page Sections
### 1. Header
Purpose:
- orient the user
- reinforce `samm` as the product center
- provide quick context about the current workspace state

Contents:
- page title: `samm`
- short descriptor: e.g. `coordinate the work across your workspace`
- optional status chip: e.g. `3 approvals pending`
- optional quick action buttons

### 2. Input Composer
Purpose:
- primary action entry point

Contents:
- message input
- quick prompt suggestions
- command-like starting points

Example prompts:
- `summarize what needs my attention`
- `draft next week's campaign`
- `show blockers in the pipeline`
- `prepare content for approval`

### 3. Conversation Thread
Purpose:
- display the main interaction history with `samm`

Should support:
- summaries
- recommendations
- structured responses
- widget/card rendering for tool outputs
- action suggestions
- links into operational surfaces such as Inbox, Content, or Metrics

Tone:
- calm, concise, operational
- not overly chatty
- not assistant-gimmicky

### 4. Suggested Actions Panel
Purpose:
- reduce prompt burden
- surface the most useful next moves

Examples:
- approve 3 pending content items
- review a failed pipeline run
- schedule campaign assets for next week
- summarize performance drop on YouTube

This panel helps users act even if they do not know what to type.

### 5. Context Strip Or Context Cards
Purpose:
- provide live operational awareness without leaving `samm`

Examples:
- inbox pending count
- failed runs count
- next calendar trigger
- latest campaign status
- current weekly metric movement

These should be small, readable, and link outward.

Future implementation note:
- these context cards can evolve into native widgets rendered inside the shared workspace shell
- they should not be treated as decorative dashboard fragments

### 6. Recent Threads Or Saved Coordination Sessions
Purpose:
- make `samm` feel like a workspace, not a stateless chatbot

Examples:
- `weekly planning`
- `exam campaign rollout`
- `content approvals`
- `pipeline failure review`

## Relationship To The Dashboard
The `samm` page should not replace the structured pages immediately.
Instead it should orchestrate them.

Expected interaction loop:
1. user asks `samm` for help
2. `samm` summarizes and recommends
3. user jumps to inbox/content/metrics/calendar when deeper review is needed
4. user returns to `samm` to continue coordination

## Design Rules
The `samm` workspace should feel:
- central
- calm
- readable
- operational
- lightly intelligent, not theatrical

Avoid:
- giant empty chat canvas with no guidance
- overly chatbot-like greeting screens
- gimmicky assistant visuals
- cluttered dashboard panels fighting with the conversation
- losing the lowercase `samm` brand treatment in the new shell

## MVP Version
The first improved version of `/samm` can be simple:
- header
- chat thread
- quick prompts
- small context cards for inbox / metrics / operations

That is enough to establish `samm` as a coordination workspace before deeper capabilities are built.

## Long-Term Direction
Long-term, `/samm` should become the front door of the product.
The surrounding modules remain essential, but they behave as supporting operational views rather than the main identity of the system.

## Summary
The future `samm` page should be a coordination workspace, not just a hidden chat screen. It should connect conversation, decision support, and structured operational context in one surface.
