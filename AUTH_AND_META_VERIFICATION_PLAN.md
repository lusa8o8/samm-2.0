# Auth Stability And Meta Verification Plan

## Why This Exists

During first-time onboarding tests, Supabase Auth started returning repeated signup and password-token errors:

- `400` on `/auth/v1/token?grant_type=password`
- `429` on `/auth/v1/signup`
- downstream checkout `500` errors when a new user reached billing before the workspace auth context was fully ready

The short-term fix is to keep first-time onboarding and existing-user login as separate flows. The longer-term recommendation is to move first-time account creation to Firebase Auth so PMF testing is not blocked by Supabase Auth signup rate limits.

## Current Intended Flow

### Existing Users

Existing users should use `/login`.

Expected behavior:

1. User signs in.
2. If the user already has a workspace, route to the workspace.
3. If the user has no workspace yet, route to `/start` to resume onboarding.

### First-Time Users

First-time users should use `/start`.

Expected behavior:

1. User answers the first onboarding question.
2. User creates an account.
3. If email verification is required, the user confirms email.
4. After sign-in, user returns to `/start`.
5. The remaining onboarding questions stay available.
6. Workspace provisioning runs before checkout.
7. Paywall appears only after setup is complete.
8. Successful billing unlocks the workspace.

## Problem With Supabase Auth For PMF Testing

Supabase is still useful as the app database, storage, Edge Functions layer, and billing backend. The issue is first-time auth behavior during repeated PMF testing:

- new-account signup can rate-limit quickly
- password sign-in attempts for users that do not exist create noisy `400` failures
- email confirmation can interrupt onboarding state
- a verified user can re-enter the app without enough context unless `/start` explicitly resumes the first-time flow

## Recommended Auth Direction

Use Firebase Auth for public account creation and sign-in, while keeping Supabase for backend data and functions.

Recommended split:

- Firebase Auth owns user signup, login, email verification, password reset, and first-time session stability.
- Supabase keeps workspace data, content registry, calendar data, billing tables, storage, and Edge Functions.
- A backend bridge maps Firebase user IDs to samm workspace/org records.
- Supabase service-role functions should trust only verified Firebase ID tokens, not client-provided identity.

## Firebase Migration Notes

Do not do this as a broad rewrite. Treat it as an auth adapter replacement.

Suggested steps:

1. Add Firebase Auth client to the packaged app.
2. Create an auth adapter with the same app-level session contract currently expected by routing.
3. Add a server-side token verification endpoint or Edge Function path.
4. Map Firebase `uid` to existing `org_id`.
5. Preserve all grandfathered workspace behavior.
6. Keep the `/start` first-time flow independent from `/login`.
7. Only after this is stable, retire Supabase Auth usage from public onboarding.

## Meta App Verification Work

The user needs help with Meta app verification. This should be handled as a separate workstream because it requires a precise permission-to-feature map, live test flow, policies, and review evidence.

### Likely Meta Review Needs

Prepare these before submission:

- exact permissions/features requested
- why each permission is needed
- where each permission is used in samm
- live reviewer test credentials
- a clean screencast showing the permission being used inside the app
- public Privacy Policy URL
- public Terms URL
- public Data Deletion URL
- business identity and contact details
- a repeatable test account/page setup

### Verification Principle

Meta reviewers should not have to infer how samm uses a permission. Each requested permission needs a visible product action, a written explanation, and a matching screencast moment.

For samm, that likely means showing:

- connecting a Facebook or Instagram business asset
- selecting a workspace channel
- creating or approving content
- using the Meta permission to publish, schedule, read status, or manage comments/messages, depending on the permission requested
- the resulting state in samm and/or Meta

### Meta Documentation Links

- Meta App Review: https://developers.facebook.com/docs/app-review/
- Server-to-server app review guidance: https://developers.facebook.com/docs/apps/review/server-to-server-apps/
- Meta Developer Apps dashboard: https://developers.facebook.com/apps/
- Meta Business Verification entry point: https://business.facebook.com/settings/security

## Open Decisions

- Which Firebase project should own production auth?
- Do we use Firebase email/password only, or also Google sign-in?
- Should the Firebase-to-Supabase bridge run in Supabase Edge Functions or a separate backend service?
- Which Meta integration ships first: Facebook Pages, Instagram, WhatsApp, or comments/messages?
- Which Meta permissions are absolutely required for MVP?
- Do we need Meta app review immediately, or can owner/admin-only development mode support the first PMF tests?

## Current Recommendation

Proceed in this order:

1. Stabilize first-time onboarding state in the current app.
2. Add Firebase Auth as the public auth layer.
3. Keep Supabase as the backend data and function layer.
4. Build a Meta permission map before requesting any advanced access.
5. Record review screencasts only after the integration flow is deterministic and testable.
