import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://jxmdwltfkxstiwnwwiuf.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bWR3bHRma3hzdGl3bnd3aXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODYxMDIsImV4cCI6MjA5MDU2MjEwMn0.KxhpCmssGVUJKkZvbc0KXCE5cP4SGL4ER8BmCXpi8uo";

function normalizeEnvValue(value: string | undefined, fallback: string) {
  const normalized = value?.trim().replace(/^['"]|['"]$/g, "");
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function resolveSupabaseUrl(value: string | undefined) {
  const candidate = normalizeEnvValue(value, FALLBACK_SUPABASE_URL);

  try {
    return new URL(candidate).toString().replace(/\/$/, "");
  } catch {
    return FALLBACK_SUPABASE_URL;
  }
}

export const SUPABASE_URL = resolveSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
export const SUPABASE_ANON_KEY = normalizeEnvValue(
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  FALLBACK_SUPABASE_ANON_KEY
);

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const DEV_ORG_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

let _orgId: string = DEV_ORG_ID;

function syncOrgId(session: Session | null) {
  _orgId = session?.user?.app_metadata?.org_id ?? DEV_ORG_ID;
}

supabase.auth.onAuthStateChange((_event, session) => {
  syncOrgId(session);
});

export function getOrgId(): string {
  return _orgId;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

async function validateSession(session: Session | null) {
  syncOrgId(session);

  if (!session?.access_token) return null;

  const { error } = await supabase.auth.getUser(session.access_token);
  if (error) {
    await supabase.auth.signOut();
    return null;
  }

  return session;
}

export async function getActiveSession() {
  const sessionResult = await supabase.auth.getSession();

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  const session = sessionResult.data.session;
  const expiresAt = session?.expires_at ?? 0;
  const isExpired = expiresAt > 0 && expiresAt * 1000 <= Date.now();

  if (!session?.access_token || isExpired) {
    const refreshResult = await supabase.auth.refreshSession();

    if (refreshResult.error) {
      await supabase.auth.signOut();
      return null;
    }

    return validateSession(refreshResult.data.session ?? null);
  }

  return validateSession(session);
}

export async function getAccessToken() {
  const session = await getActiveSession();
  return session?.access_token ?? null;
}

