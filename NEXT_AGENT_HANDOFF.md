# Next Agent Handoff

## Repo
- Root: `C:\Users\Lusa\tsh-marketing-system`
- Main app: `C:\Users\Lusa\tsh-marketing-system\M.A.S UI`
- Supabase project ref: `jxmdwltfkxstiwnwwiuf`
- GitHub repo: `https://github.com/lusa8o8/tsh-marketing-system.git`

## Working Discipline
Carry this forward exactly. This is not optional — it is the reason the build is clean.

1. Do discovery first. Read before editing.
2. State diagnosis explicitly before proposing a fix.
3. Lock a plan in the docs before writing any code.
4. Keep changes narrow and reversible.
5. Commit every stable slice with a descriptive message.
6. Push stable checkpoints to `main` when requested.
7. Avoid speculative cleanup or scope creep.

The product has stayed clean because every session followed: **discovery → diagnosis → plan → narrow execution → verification → commit**. Do not deviate.

## If The Session Breaks Or Rate Limits Hit
Before touching code, reread the relevant docs for full context:
- `NEXT_AGENT_HANDOFF.md` (this file)
- `SAMM_IMPLEMENTATION_ROADMAP.md`
- `SAMM_FULL_SYSTEM_ARCHITECTURE.md`
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`

Then continue with the same discipline.

---

## Product State
`samm` is the product anchor. Hybrid control-plane model is the intended architecture.

Current stance:
- Full workspace redesign is deferred until after user feedback.
- Near-term UI changes stay narrow: Inbox and Content Registry only.
- Optional modules (Calendar, Ambassadors) planned for onboarding/capability gating later.

---

## Current Build Status
**Stable through Milestone 10 + Milestone 8C (all fixes deployed, browser verification in progress as of 2026-04-11).**

### Latest Commits (most recent first)
- `4de7bda` — fix(8C-E): strip markdown fences from classifier output before JSON.parse
- `bc868d2` — fix(8C-E): simplify classifier prompt + force JSON via assistant prefill (superseded by 4de7bda)
- `3e36f74` — fix(8C-F): show routine intent tag on comments cards too
- `07f799d` — fix(8C-F/G/H): intent tags, batch grouping, inbox escalation display + insert fix
- `4fa1984` — fix(8C-E): correct classifier disambiguation and fix name extraction in draftReply
- `652ada9` — fix(8C-E): sharpen spam classifier to prevent misclassification on scam-URL links
- `67c6b2c` — docs: 2026-04-11 verification session results + Milestone 8C lock
- `6a99688` — feat: editable calendar + NL calendar commands (Milestone 10)
- `080fc52` — fix: org details save failing — missing full_name column + silent error on save
- `6d1c9e6` — fix: design_brief blocking Pipeline C resume at marketer gate

All pushed to `main`.

---

## Milestone 8C: Content Routing Corrections + UX Polish
**Status: All fixes deployed. Browser verification in progress.**

### What was fixed and why (full institutional memory — do not re-investigate these)

**A — Settings Integrations button** ✓
- Removed redundant Connect/Disconnect `<Button>` from each integration row; Switch-only now.
- File: `M.A.S UI/src/pages/agent/settings.tsx`

**B — Run now toast timing** ✓
- `schedulePipelineRun` was awaiting full pipeline execution synchronously (20-60s before returning).
- Fix: wrapped `invokePipeline` in `EdgeRuntime.waitUntil`, returns `running` status immediately.
- File: `supabase/functions/coordinator-chat/scheduler.ts`

**C — Pipeline B content routing** ✓
- Pipeline B had a pre-M7B `human_inbox.insert` block for every draft — removed.
- Added `pipeline_run_id: runId` to `content_registry` inserts in pipeline-b-weekly.
- Updated `useActionContent` in `api.ts`: Pipeline B resume now uses `pipeline_runs` table lookup (same pattern as Pipeline C), not inbox ref_id lookup.
- Files: `supabase/functions/pipeline-b-weekly/index.ts`, `M.A.S UI/src/lib/api.ts`

**D — Content Registry "Comments" tab** ✓
- Added "Comments" tab to Content Registry showing `created_by = 'pipeline-a-engagement'` published items.
- Added `created_by` filter to `ContentFilter` type and `useListContent` query.
- Files: `M.A.S UI/src/pages/content.tsx`, `M.A.S UI/src/lib/api.ts`

**E — Classifier: all comments falling to `routine`** ✓ (deployed, pending verification run)
- Root cause 1: classifier prompt too complex for Haiku → model returned valid JSON wrapped in ` ```json ... ``` ` code fences → `JSON.parse` failed → all fell to `routine` fallback (no errors, just silent fallback).
- Root cause 2 (earlier): `ref_table: 'content_registry'` in the `human_inbox` insert does not exist as a column → Supabase JS client returned `{error}` silently → counter incremented after failed insert because there was no error check.
- Fix E-1: removed `ref_table` from complaint insert; added destructured error checks to ALL `human_inbox` and `content_registry` inserts so failures surface in `results.errors`.
- Fix E-2: rewrote classifier prompt to compact, directive format Haiku follows reliably.
- Fix E-3: stripped markdown code fences from raw LLM output before `JSON.parse` (model always wraps in fences despite instructions; strip with regex, not prefill trick — assistant prefill via messages array does NOT reliably suppress fences in this SDK version).
- Fix E-4: removed mechanical `author.split(' ')[0]` first-name extraction; LLM now receives full author name and decides greeting naturally.
- File: `supabase/functions/pipeline-a-engagement/index.ts`

**F — Intent tags on Comments cards** ✓
- Added `metadata jsonb` column to `content_registry` (migration `20260411110000_content_registry_metadata.sql`).
- Pipeline A now stores `metadata: { intent: 'routine' | 'boost' }` on every `content_registry` insert.
- Comments cards show amber **Boost** badge for boost intent; quiet **Reply** badge for routine.
- File: `M.A.S UI/src/pages/content.tsx`

**G — Batch freshness in Comments tab** ✓
- Date display now includes time (`toLocaleString` with hour:minute instead of `toLocaleDateString`).
- Comments tab groups items by `published_at` day (Today / Yesterday / date label).
- Items published within last 2 hours get a pulsing green **Fresh batch** pill on the group header.
- File: `M.A.S UI/src/pages/content.tsx`

**H — Inbox escalation display** ✓
- `inbox.tsx` was reading `item.payload.original_comment` but pipeline-a inserts as `comment_text`. Fixed to `comment_text ?? original_comment`.
- Author name now shown in escalation card header.
- File: `M.A.S UI/src/pages/inbox.tsx`

### Verification checklist (run after 8C deploy)
- [ ] Run Pipeline A → DB result: `escalations: 1, spam_ignored: 1, boosts_suggested: 2, errors: []`
- [ ] Inbox → one Escalation card for "Angry Student"; original comment text visible; suggested response visible
- [ ] Content Registry Comments tab → Natasha K and Chanda Mwale cards show amber **Boost** badge; Brian Mwanza, Mutale Banda, Lombe Phiri show quiet **Reply** badge
- [ ] Comments tab → items grouped by day; "Fresh batch" pill appears on today's group; time visible on each card
- [ ] Settings → Integrations: Switch-only, no redundant button
- [ ] Run now via samm chat: toast fires in under 2 seconds

---

## Institutional Memory: Bugs Found This Session (Do Not Re-Investigate)

### Supabase JS insert error pattern
`supabase.from(...).insert({...})` does NOT throw on failure — it returns `{ data, error }`.
If you `await` it without destructuring, the call silently fails and any counter/state below it still runs.
**Rule: always destructure `const { error } = await supabase.from(...).insert(...)` and throw/log if `error` exists.**

### Claude Haiku markdown fence behaviour
Haiku wraps JSON responses in ` ```json ... ``` ` code fences regardless of instructions like "no markdown".
**Rule: always strip fences before `JSON.parse`: `raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/m, '').trim()`**
The assistant prefill trick (`{ role: 'assistant', content: '{' }`) does NOT reliably suppress this in `@anthropic-ai/sdk@0.27.0` — the model outputs ` ```json\n{...}` after the prefill `{`, making parse worse.

### `ref_table` is not a column on `human_inbox`
The insert had `ref_table: 'content_registry'` — this column does not exist. Removed. Do not add it back.

---

## Milestone Queue (Next Agent Starts Here)

### Immediate (after 8C verification passes)
Proceed to **Milestone 11: Live Platform Publishing**
- Replace `getMockComments()` in `pipeline-a-engagement/index.ts` with real API reads from Facebook, WhatsApp, YouTube
- No schema changes needed — the content pipeline and intent classification are already in place
- Milestone 11 scope is in `SAMM_IMPLEMENTATION_ROADMAP.md`

### Queue after Milestone 11
- **M12**: Multi-Channel samm Access (Slack, Teams, WhatsApp, Telegram, email inbound)
- **M13**: Voice Interface
- **M14**: Dashless Operation (Google Sheets, Docs, Excel)
- **M15**: Visual Plugin Builder
- **M16**: Sales and CRM Integration

### Deferred (revisit after broad integration coverage)
- **M8B**: Onboarding Flow UI (4-5 screen wizard)
- **M9**: Copy Quality Check (Pipeline C phase 3 critic pass)

---

## Pipeline A: Full Classification Flow (as of 2026-04-11)

Mock comments (7, hardcoded in `getMockComments()`):
| Comment ID | Author | Expected intent | Expected action |
|---|---|---|---|
| fb_001 | Chanda Mwale | boost | Suggestion to Inbox + reply to Content Registry |
| fb_002 | Mutale Banda | routine | Reply to Content Registry |
| fb_003 | Angry Student | complaint | Escalation to Inbox (no content_registry row) |
| yt_001 | Lombe Phiri | routine | Reply to Content Registry |
| yt_002 | Natasha K | boost | Suggestion to Inbox + reply to Content Registry |
| wa_001 | Brian Mwanza | routine | Reply to Content Registry |
| wa_002 | Spam Account | spam | Silently ignored — no DB insert |

Expected result: `comments_processed:7, replies_sent:5, escalations:1, spam_ignored:1, boosts_suggested:2, errors:[]`

---

## Pipeline C End-to-End Verified Flow (still valid)
1. `/samm` triggers Pipeline C → `running`
2. Research phase (parallel) + campaign planner → campaign brief in Inbox (`waiting_human`)
3. CEO approves → fire-and-forget resume, returns in <5s
4. Canonical copy (phase 1) → 6 parallel platform assets (phase 2) → design brief → pauses
5. 6 copy cards + 1 design brief card in Content Registry as `draft`, grouped by campaign
6. Design brief is excluded from marketer gate (approval independent)
7. Approve all copy → pipeline resumes → monitor + report → campaign report in Inbox → `success`
8. Reject a draft → revision request in Inbox → edit + resubmit → approve → resume

---

## Multi-Tenancy State
- `getOrgId()` in `supabase.ts` — reactive, backed by `onAuthStateChange`, `app_metadata.org_id`
- Dev fallback: `DEV_ORG_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"` when `app_metadata.org_id` absent
- `provision-org` edge function creates `org_config` row on signup
- `ops@tsh.com` uses `DEV_ORG_ID` fallback (no `app_metadata.org_id`) — all data already scoped correctly

---

## Key Files

### Frontend
- `M.A.S UI/src/pages/content.tsx` — Content Registry: Comments tab, batch grouping, intent tags, date/time display
- `M.A.S UI/src/pages/inbox.tsx` — Inbox: escalation card display (comment_text field)
- `M.A.S UI/src/pages/agent/overview.tsx` — Operations Overview: pipeline status, run table, Run now buttons
- `M.A.S UI/src/pages/agent/settings.tsx` — Org config, brand voice, integrations (Switch-only), pipeline automation
- `M.A.S UI/src/lib/api.ts` — all mutations: `useTriggerPipeline`, `useActionContent`, `useListContent` (created_by filter), `useUpdateOrgConfig`, `useUpdateCalendarEvent`, `useDeleteCalendarEvent`
- `M.A.S UI/src/lib/supabase.ts` — `getOrgId()`, `signUp()`, `DEV_ORG_ID`

### Supabase Edge Functions
- `supabase/functions/pipeline-a-engagement/index.ts` — classifier (Haiku, fence-stripped JSON parse), draftReply (full author name), metadata on content_registry inserts, error-checked inbox inserts
- `supabase/functions/pipeline-b-weekly/index.ts` — content_registry with pipeline_run_id, no human_inbox inserts for drafts
- `supabase/functions/pipeline-c-campaign/index.ts` — design_brief excluded from marketer gate filter
- `supabase/functions/coordinator-chat/index.ts` — create_calendar_event action handler
- `supabase/functions/coordinator-chat/scheduler.ts` — fire-and-forget via EdgeRuntime.waitUntil
- `supabase/functions/_shared/pipeline-engine.ts`
- `supabase/functions/_shared/agent-registry.ts`
- `supabase/functions/_shared/integration-registry.ts`
- `supabase/functions/_shared/pipeline-run-status.ts`
- `supabase/functions/provision-org/index.ts`

### Migrations
- `20260409161000_pipeline_runs_status_states.sql`
- `20260410120000_content_registry_campaign_fields.sql`
- `20260410130000_content_registry_rejection_note.sql`
- `20260410140000_content_registry_media_url.sql`
- `20260410150000_content_registry_design_brief_platform.sql`
- `20260411100000_org_config_extended_fields.sql` — full_name, country, contact_email
- `20260411110000_content_registry_metadata.sql` — metadata jsonb column

### Architecture Source Of Truth
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`
- `SAMM_IMPLEMENTATION_ROADMAP.md`
- `SAMM_FULL_SYSTEM_ARCHITECTURE.md`

---

## Operational Notes
- `ANTHROPIC_API_KEY` already set in hosted Supabase Edge Function secrets
- supabase CLI: `C:/Users/Lusa/.scoop/shims/supabase.exe`
- git: `/c/Program\ Files/Git/cmd/git.exe` (not in bash PATH)
- npm: `"/c/Program Files/nodejs/npm.cmd"` — run from `M.A.S UI` directory
- Python: `/c/Python314/python.exe`
- `cat`, `ls`, `head`, `grep`, `find`, `dir` — not available in bash; use Read, Glob, Grep tools
- Local `deno` not installed — no local `deno check`; deploy to verify Deno-side changes
- content_registry status lifecycle: `draft` → `scheduled` (approval) or `rejected`; `published` written directly by pipeline
- pipeline_runs status lifecycle: `running` → `waiting_human` → `resumed` → `success` / `failed` / `cancelled`
- Pipeline C resume runs in background via `EdgeRuntime.waitUntil` — coordinator-chat returns immediately

---

## Constraints To Preserve
- Do not do a broad `samm` workspace redesign yet.
- Do not widen scope into optional modules yet.
- Do not add external API work before 8C is browser-verified.
- Keep the product professional and restrained.
- **Inbox = workflow decisions only. Content Registry = content review only. Do not blur this boundary.**
