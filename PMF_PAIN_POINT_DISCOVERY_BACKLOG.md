# PMF Pain Point Discovery Backlog

Purpose: track strong ICP pain patterns before any build work. Each item should go through discovery and report approval before implementation.

Rule: no product code writes for these items until the discovery report for that item is approved.

## 1. Platform-Specific Variation

Pain pattern: users can create the original idea, but adapting it for each platform takes too much time and often feels wrong for the platform.

Status: implemented backend foundation. Pipeline C and Pipeline D now use a shared platform derivative matrix for deterministic platform rules. First copy-quality smoke test showed WhatsApp/email over-reuse, so prompt-level platform-native tuning was added. Design brief quality still needs human/product review later before public release.

Existing direction to inspect:
- Pipeline C and Pipeline D platform adapters.
- Platform copy instructions for Facebook, Instagram, LinkedIn, WhatsApp, YouTube, email, and blog.
- Integration/channel capability registry.

Discovery questions:
- Are platform outputs meaningfully different, or mostly light rewrites?
- Does each platform get native structure, length, tone, and content shape?
- Are TikTok, Pinterest, and X missing from any important flows?
- Are platform requirements deterministic enough, or mostly prompt text?

Possible outcome:
- Strengthen adapters with a deterministic platform derivative matrix.
- Avoid building a new repurposing system if existing adapters can be tightened.

## 2. Workflow Compression For Repurposing

Pain pattern: repurposing takes longer than creating because users must review, resize, rewrite, and track each variant manually.

Status: implemented. The current bundle/grouping UI stays as-is because it already communicates the draft set without extra labels. Added a scoped regeneration path for one one-time platform draft so a weak Facebook/WhatsApp/YouTube/email variant can be rewritten without changing the other variants in the set.

Existing direction to inspect:
- Content Registry draft grouping.
- Draft group metadata.
- Approval/rejection flows.
- Per-platform image attachment and expanded card rail.

Discovery questions:
- Can a user review one idea across all variants quickly?
- Can a user approve/reject individual platforms without losing context?
- Can a user regenerate only one weak platform variant?
- Are missing assets obvious without adding duplicate UI?

Possible outcome:
- Improve variant comparison and platform-level actions.
- Keep current grouping if it already communicates the bundle well.

## 3. Brand Voice Enforcement

Pain pattern: AI repurposing tools create generic rewrites that do not match platform behavior or brand voice.

Status: backend prompt consistency cleanup implemented. Pipeline C and Pipeline D now share a safer brand voice prompt helper with fallbacks and explicit style-anchor language. No deterministic brand QA gate yet.

Existing direction to inspect:
- Brand voice settings/config.
- Prompt context passed into Pipeline C/D.
- Review/QA skill behavior.
- Any brand governance skill or shared prompt module.

Discovery questions:
- Is brand voice treated as a hard constraint or just background context?
- Does adaptation preserve brand voice while changing format?
- Is there a QA pass that catches generic AI phrasing?
- Can users see or adjust brand voice without terminal/config work?

Possible outcome:
- Add or strengthen a brand voice QA step.
- Reuse existing brand config rather than creating a new brand system.

## 4. Deterministic Repost And Duplicate Guard

Pain pattern: posting everywhere causes users to forget what was shared, repost randomly, and feel busy but not productive.

Status: implemented for one-time posts at the coordinator layer. Before creating a new Pipeline D draft batch, samm now checks recent one-time content history for same-date or high-similarity topic/title/copy overlap and returns a no-create warning instead of producing another duplicate batch. Explicit follow-up/new-angle language bypasses the guard so valid sequels are still allowed.

Existing direction to inspect:
- `content_registry`.
- Calendar Studio scheduled/published context.
- Memory/coordinator context.
- Review/QA skill duplicate checks.

Discovery questions:
- Does samm already detect repeated topics, angles, or posts?
- Does it distinguish duplicate reposts from valid follow-ups?
- Does the guard work per platform and per time window?
- Is this deterministic, or just LLM judgment?

Possible outcome:
- Build a deterministic repost guard using existing content history.
- Surface warnings only where they help decisions.

## 5. Asset Requirement Clarity

Pain pattern: users jump between Canva, CapCut, ChatGPT, Claude, and other tools because media requirements are unclear or scattered.

Status: graphic/design-brief audit completed. Added shared visual intent policy so briefs can distinguish value, trust, reminder, announcement, and conversion graphics instead of applying one global conversion rule or overloading every asset with the full config.

Existing direction to inspect:
- Asset brief contract.
- `asset_need`, `asset_spec`, placement, and dimensions metadata.
- Content Registry media upload/rendering.
- External asset status fields.

Discovery questions:
- Does every generated item know whether it needs static, carousel, video, or no media?
- Are platform dimensions and placements available deterministically?
- Are missing images/videos clearly visible without adding noise?
- Can the media return flow support external tools cleanly?

Possible outcome:
- Tighten asset requirement display and media status.
- Reuse existing asset brief contract rather than building a new asset tracker.

## 6. No-Terminal Setup And Configuration

Pain pattern: users reject workflows that require terminal commands, config files, custom skill upkeep, or manual setup.

Existing direction to inspect:
- Legacy settings UI.
- Structured config tables.
- Universal config guide skill.
- Packaged app settings and onboarding surfaces.

Discovery questions:
- Which important configs still live only in legacy UI or backend tables?
- Can a non-technical user configure brand voice, platforms, offers, ICP, and approvals?
- Are skills centrally managed, or does the user need custom files?
- Is the packaged app missing a setup path for existing backend capability?

Possible outcome:
- Build guided packaged setup screens only where backend support already exists.
- Avoid duplicating legacy settings logic.

## 7. Long-Running Task Resumability

Pain pattern: Claude/MCP-style workflows stop mid-task, burn usage, and force users to manually continue.

Existing direction to inspect:
- Pipeline runs.
- Coordinator tasks.
- Inbox/escalation flow.
- Registry records and retry behavior.

Discovery questions:
- Can samm resume work after interruption without user re-prompting?
- Does the UI show what is running, blocked, failed, or waiting?
- Can users retry only the failed part?
- Are partial outputs preserved safely?

Possible outcome:
- Improve progress/resume UX.
- Avoid rebuilding orchestration if pipeline state already supports this.

## Working Process

For each item:

1. Run discovery against the current codebase and data model.
2. Report what already exists, what overlaps, and what is missing.
3. Recommend whether to leave it, simplify it, improve it, or build something new.
4. Wait for approval.
5. Only then implement scoped changes.
