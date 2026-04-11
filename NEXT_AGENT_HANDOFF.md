# Next Agent Handoff

## Repo
- Root: `C:\Users\Lusa\tsh-marketing-system`
- Main app: `C:\Users\Lusa\tsh-marketing-system\M.A.S UI`
- Supabase project ref: `jxmdwltfkxstiwnwwiuf`
- GitHub repo: `https://github.com/lusa8o8/tsh-marketing-system.git`

## Working Discipline
Carry this forward exactly.

1. Do discovery first.
2. State diagnosis explicitly.
3. State a concrete plan before editing.
4. Keep changes narrow and reversible.
5. Commit every stable slice.
6. Push stable checkpoints to `main` when requested.
7. Avoid speculative cleanup.

This discipline has kept the product clean and lean. Do not regress into broad exploratory edits without a locked plan.

## If The Session Breaks Or Rate Limits Hit
Before touching code again, reread the relevant docs for full context:
- `NEXT_AGENT_HANDOFF.md`
- `SAMM_IMPLEMENTATION_ROADMAP.md`
- `SAMM_FULL_SYSTEM_ARCHITECTURE.md`
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`

Then continue with the same discipline:
- discovery
- diagnosis
- plan
- narrow execution
- verification
- commit

## Product State
Brand and product direction are now centered on `samm`.

Current product stance:
- `samm` is the product anchor.
- Hybrid control-plane model is the intended architecture.
- Full `samm` workspace redesign is deferred until after user feedback.
- Near-term UI changes, if any, should stay narrow and focus on Inbox and Content Registry.
- Optional modules like `Calendar` and `Ambassadors` are planned for onboarding/capability gating later, not implemented yet.

## Key Completed Slices
### Branding and UI
- login rebrand to `samm`
- human-centered login imagery
- dashboard shell rebrand
- `samm` promoted to top-level nav
- `Operations` replaces `Agent Manager`

### Backend / Infra
- auth wired through Supabase
- cron slice completed manually in Supabase dashboard
- `coordinator-chat` edge function implemented, committed, pushed, deployed, and browser-verified
- scheduler extraction completed
- normalized pipeline run status contract introduced in shared runtime code
- agent registry slice completed
- integration registry slice completed, committed, pushed, deployed, and parity-verified
- Pipeline A rebuilt on the shared engine, committed, pushed, deployed, and parity-verified
- Pipeline B and Pipeline C invocation baseline restored and pushed in the Milestone 5A checkpoint
- Milestone 6: Pipeline B resumable human gate complete and browser-verified
- Milestone 7: Pipeline C CEO brief gate complete and browser-verified
- Milestone 7A: two-phase copy generation for Pipeline C complete and browser-verified
- Milestone 7B: copy assets land in Content Registry as drafts, not in Inbox — complete and browser-verified
- Milestone 7C: batch approval in Content Registry — complete and browser-verified
- Milestone 7D: marketer approval gate with inline edit and rejection loop — complete and browser-verified
- Milestone 7E: design brief to Content Registry, image upload on copy cards, share button — complete and browser-verified
- Milestone 8: multi-tenant infrastructure — session-derived org resolution + provision-org — complete, sign-in verified
- Milestone 5B: real LLM classification and reply generation in Pipeline A — deployed, NOT yet browser-verified

### Architecture Docs
Committed and pushed:
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`
- `SAMM_IMPLEMENTATION_ROADMAP.md`
- `SAMM_FULL_SYSTEM_ARCHITECTURE.md`

## Latest Important Commits
- `080fc52 fix: org details save failing — missing full_name column + silent error on save`
- `6a99688 feat: editable calendar + NL calendar commands (Milestone 10)`
- `6d1c9e6 fix: design_brief blocking Pipeline C resume at marketer gate`
- `2791ec3 fix: platform_connections not written on integration toggle (Milestone 8A)`
- `ac0909d fix: replace unresolved react-icons brand imports with lucide equivalents`
- `e91da84 feat: wire Operations overview + settings — manual triggers, connection toggles, full integration list`
- `33477a9 feat: real LLM classification and reply generation in Pipeline A (Milestone 5B)`
- `4c816f7 feat: multi-tenant infrastructure — session-derived org resolution + provision-org (Milestone 8)`

All pushed to `main`.

## Current Status
Stable through Milestone 10. Build passes clean.

### Verification results (2026-04-11 session)
- Test 1 (sign-in, org resolution): PASS — renamed org to "Lusa Works", samm recognized it
- Test 2 (Settings → Integrations toggle): PASS — badge flips, toast fires. Note: Connect/Disconnect button is redundant alongside Switch; fix queued in 8C.
- Test 3 (Run now → toast): PARTIAL — run succeeds, toast does not fire reliably. Root cause: coordinator-chat awaits full pipeline execution before returning; fix queued in 8C.
- Test 4 (Pipeline A result summary): PASS — run starts, summary shows comments/replies/escalations count
- Test 5 (escalation in Inbox): UNVERIFIED — no escalations received. Investigate: run `SELECT result FROM pipeline_runs WHERE pipeline = 'pipeline-a-engagement' ORDER BY started_at DESC LIMIT 3` and check `escalations` field. If 0 → LLM misclassification. If >0 → inbox insert failed (check `human_inbox` for `item_type = 'escalation'`).
- Test 6 (Content Registry Published replies): PASS — replies are natural LLM prose

### Untested slices (require browser verification after 8C deploy):
- Fix A: Settings → Integrations — redundant Connect/Disconnect button removed, Switch-only
- Fix B: Run now toast fires immediately (fire-and-forget pipeline invocation)
- Fix C: Pipeline B drafts land in Content Registry, not Inbox
- Fix D: Content Registry "Comments" tab shows Pipeline A engagement replies

### Locked plan: Milestone 8C — Content Routing Corrections + UX Polish
Locked 2026-04-11. Implement before any new feature work.

**A — Settings Integrations: remove redundant button**
- Remove the Connect/Disconnect `<Button>` from each integration row; keep only the `<Switch>`
- File: `M.A.S UI/src/pages/agent/settings.tsx`

**B — Run now toast: fire-and-forget pipeline invocation**
- `schedulePipelineRun` in `scheduler.ts` currently awaits full pipeline execution, making coordinator-chat hold the HTTP connection open for 20-60s
- Fix: wrap `invokePipeline` call in `EdgeRuntime.waitUntil`, return `running` status immediately
- File: `supabase/functions/coordinator-chat/scheduler.ts`

**C — Pipeline B content routing**
- Pipeline B inserts a `draft_approval` item to `human_inbox` for every draft (lines 229–246 of `pipeline-b-weekly/index.ts`) — this is the pre-Milestone 7B pattern
- Drafts already land in `content_registry`; inbox insert must be removed
- Also: add `pipeline_run_id: runId` to content_registry inserts so the resume gate works
- In `api.ts → useActionContent`: replace inbox-based Pipeline B resume check with pipeline_runs lookup (same pattern as Pipeline C)
- Files: `supabase/functions/pipeline-b-weekly/index.ts`, `M.A.S UI/src/lib/api.ts`

**D — Content Registry "Comments" tab**
- Pipeline A engagement replies (routine + boost + polls) land in `content_registry` with `status: 'published'`, `created_by: 'pipeline-a-engagement'`
- Add a "Comments" tab to Content Registry showing only these items
- Files: `M.A.S UI/src/pages/content.tsx`, `M.A.S UI/src/lib/api.ts`

**E — Test 5 escalation investigation (blocked on DB check)**
- Diagnose via: `SELECT result FROM pipeline_runs WHERE pipeline = 'pipeline-a-engagement' ORDER BY started_at DESC LIMIT 3`
- `escalations: 0` → LLM classification bug (likely "scam" keyword causing spam misclassification despite LLM rewrite)
- `escalations > 0` → inbox insert failure (RLS or missing `status` default on `human_inbox`)
- Fix scoped after root cause is confirmed

### Pipeline C end-to-end verified flow (still valid):
1. `/samm` triggers Pipeline C → `running`
2. Research phase (parallel) + campaign planner → campaign brief created
3. Run pauses at `waiting_human` — campaign brief lands in Inbox
4. CEO approves → approval completes in under 5 seconds (fire-and-forget)
5. Background resume: canonical copy (phase 1) → 6 parallel platform assets (phase 2) → design brief suggestion → pauses
6. 6 copy cards + 1 design brief card land in Content Registry as `draft`, grouped by campaign
7. Design brief: full-width violet card with Edit, Share (WhatsApp/Telegram/Email/clipboard), Approve
8. **Marketer gate**: all copy drafts must be approved before monitor + report phase (design brief approval is independent)
9. Approve all (batch or individual) → pipeline resumes → monitor + report → campaign report in Inbox → `success`
10. Reject a draft → revision request in Inbox → marketer edits and resubmits in Content Registry → approve → resume

## Known Pipeline A Stubs (updated)
- `classifyComment`: NOW uses real LLM (claude-haiku) — returns `{intent, reasoning}` JSON, fallback to routine on parse error
- `draftReply`: NOW uses real LLM — brand-voice-aware, uses tone/audience/always_say/never_say/preferred_cta/good_post_example
- comment source: `getMockComments()` — 7 hardcoded mock comments, no live platform API reads (Milestone 11)
- spam/complaint ordering bug: FIXED — LLM handles intent, no keyword ordering issue

Milestone placement:
- **Milestone 11**: real comment fetching from Facebook, WhatsApp, YouTube APIs

## Multi-Tenancy State (Milestone 8)
### What is live:
- `supabase.ts`: hardcoded `ORG_ID` replaced with reactive `getOrgId()` backed by `onAuthStateChange`
- `api.ts`: all 40+ `org_id` references use `getOrgId()` — live session always used
- `provision-org` edge function: deployed — creates default `org_config` + stamps `org_id` into `app_metadata`
- `login.tsx`: signup toggle — `signUp` → `provision-org` → `refreshSession()` → inbox
- Dev fallback: `DEV_ORG_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"` used when `app_metadata.org_id` is absent

### Existing TSH user:
- `ops@tsh.com` does NOT have `org_id` in `app_metadata` — falls back to `DEV_ORG_ID` automatically
- All their data is already scoped to that UUID — fallback is correct
- Optional: stamp it manually via Supabase SQL editor if you want JWT parity:
  ```sql
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{org_id}', '"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"')
  WHERE email = 'ops@tsh.com';
  ```

## Exact Next Slice
### Complete Milestone 8C fixes (locked above) and resolve Test 5 (escalation investigation)
After 8C is browser-verified and Test 5 is resolved, proceed to Milestone 11.

### Remaining milestone queue (8B and 9 deferred):
- **M8C**: Content Routing Corrections + UX Polish — IN PROGRESS (locked 2026-04-11)
- **M10**: Editable Calendar + NL Commands — COMPLETE (deployed, browser verification pending)
- **M11**: Live Platform Publishing (Facebook, WhatsApp, YouTube, Email real API calls)
- **M12**: Multi-Channel samm Access (Slack, Teams, WhatsApp, Telegram, email inbound)
- **M13**: Voice Interface
- **M14**: Dashless Operation (Google Sheets, Docs, Excel)
- **M15**: Visual Plugin Builder
- **M16**: Sales and CRM Integration

### Deferred (revisit after broad integration coverage):
- **M8B**: Onboarding Flow UI (4-5 screen wizard)
- **M9**: Copy Quality Check (Pipeline C phase 3 critic)

## Relevant Files
### Frontend
- `M.A.S UI/src/pages/content.tsx` — Content Registry UI
- `M.A.S UI/src/pages/inbox.tsx` — Inbox UI
- `M.A.S UI/src/pages/agent/overview.tsx` — Operations Overview, pipeline status cards + run table + Run now buttons
- `M.A.S UI/src/pages/agent/settings.tsx` — Org config, brand voice, integrations (wired), pipeline automation (with Run now)
- `M.A.S UI/src/lib/api.ts` — all mutations including `useTriggerPipeline`, `useActionContent`, `useUploadContentImage`
- `M.A.S UI/src/lib/supabase.ts` — `getOrgId()` reactive function, `signUp()`, dev fallback constant

### Supabase
- `supabase/functions/pipeline-a-engagement/index.ts` — Pipeline A; classifyComment and draftReply now use real LLM
- `supabase/functions/pipeline-b-weekly/index.ts`
- `supabase/functions/pipeline-c-campaign/index.ts`
- `supabase/functions/coordinator-chat/index.ts`
- `supabase/functions/coordinator-chat/scheduler.ts`
- `supabase/functions/_shared/pipeline-engine.ts`
- `supabase/functions/_shared/agent-registry.ts`
- `supabase/functions/_shared/integration-registry.ts`
- `supabase/functions/_shared/pipeline-run-status.ts`
- `supabase/functions/provision-org/index.ts` — new: org provisioning on signup

### Architecture Source Of Truth
- `SAMM_RUNTIME_SPEC.md`
- `SAMM_SCHEDULER_CONTRACT.md`
- `SAMM_CODEBASE_MAPPING.md`
- `SAMM_IMPLEMENTATION_ROADMAP.md`
- `SAMM_FULL_SYSTEM_ARCHITECTURE.md`

## Important Operational Notes
- `ANTHROPIC_API_KEY` already exists in hosted Supabase Edge Function secrets
- supabase CLI is at `C:/Users/Lusa/.scoop/shims/supabase.exe` (not in the bash PATH; use that path directly)
- git is at `/c/Program\ Files/Git/cmd/git.exe` (not in bash PATH) — use `"C:/Program Files/Git/cmd/git.exe"`
- npm is at `"/c/Program Files/nodejs/npm.cmd"` — use full path, run from `M.A.S UI` directory
- Python is at `/c/Python314/python.exe`
- `cat`, `ls`, `head`, `grep`, `find`, `dir` are not available in bash — use Read, Glob, Grep tools instead
- local environment does not have `deno` installed — no local `deno check` available
- the schema slice for Milestone 6 exists in `supabase/migrations/20260409161000_pipeline_runs_status_states.sql`
- content_registry status lifecycle: `draft` → `scheduled` (on approval) or `rejected`; `published` is written directly by Pipeline B mock publisher
- pipeline_runs status lifecycle: `running` → `waiting_human` → `resumed` → `success` / `failed` / `cancelled`
- the 54-second Pipeline C resume runs in background via `EdgeRuntime.waitUntil` — coordinator-chat returns immediately
- build command: `cd "C:/Users/Lusa/tsh-marketing-system/M.A.S UI" && "/c/Program Files/nodejs/npm.cmd" run build`

## Constraints To Preserve
- Do not do a broad `samm` workspace redesign yet.
- Do not widen scope into optional-module implementation yet.
- Do not add external API work before the engine-backed execution core is stable.
- Keep the product professional and restrained; avoid overdesigned UI changes.
- Inbox = workflow decisions only. Content Registry = content review only. Do not blur this boundary.

## Last Known Good Principle
The work has gone well because every slice followed:
- discovery
- diagnosis
- plan
- narrow execution
- verification
- commit

That is the method to continue with.
