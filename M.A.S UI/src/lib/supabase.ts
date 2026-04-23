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

function sanitizeHeaderValue(value: string) {
  return value
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

function trySetHeader(headers: Headers, key: string, value: string) {
  if (!key) return;

  try {
    headers.set(key, value);
  } catch {
    // Drop malformed optional headers instead of blocking auth/network calls.
  }
}

function sanitizeHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers();

  if (!initHeaders) return headers;

  if (initHeaders instanceof Headers) {
    initHeaders.forEach((value, key) => {
      const sanitized = sanitizeHeaderValue(value);
      if (sanitized) trySetHeader(headers, key, sanitized);
    });
    return headers;
  }

  if (Array.isArray(initHeaders)) {
    initHeaders.forEach(([key, value]) => {
      if (value == null) return;
      const sanitized = sanitizeHeaderValue(String(value));
      if (sanitized) trySetHeader(headers, key, sanitized);
    });
    return headers;
  }

  Object.entries(initHeaders).forEach(([key, value]) => {
    if (value == null) return;
    const sanitized = sanitizeHeaderValue(String(value));
    if (sanitized) trySetHeader(headers, key, sanitized);
  });

  return headers;
}

async function safeFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url =
    typeof input === "string"
      ? input.trim()
      : input instanceof URL
      ? input.toString()
      : input.url;

  return fetch(url, {
    ...init,
    headers: sanitizeHeaders(init?.headers),
  });
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    global: {
      fetch: safeFetch,
    },
  }
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

function isInvalidFetchValueError(error: unknown) {
  return (
    error instanceof TypeError &&
    /Failed to execute '(fetch|set)' on '(Window|Headers)': Invalid value/i.test(error.message)
  );
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null) {
    const message =
      "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "error_description" in payload && typeof payload.error_description === "string"
        ? payload.error_description
        : "msg" in payload && typeof payload.msg === "string"
        ? payload.msg
        : null;

    if (message) return message;
  }

  return fallback;
}

async function signInViaRest(email: string, password: string) {
  const response = await safeFetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      "x-client-info": "samm-auth-fallback",
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      data: { user: null, session: null },
      error: new Error(extractErrorMessage(payload, "Sign in failed")),
    };
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("access_token" in payload) ||
    !("refresh_token" in payload) ||
    typeof payload.access_token !== "string" ||
    typeof payload.refresh_token !== "string"
  ) {
    return {
      data: { user: null, session: null },
      error: new Error("Supabase auth response was missing session tokens."),
    };
  }

  return supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });
}

export async function signIn(email: string, password: string) {
  try {
    return await supabase.auth.signInWithPassword({ email, password });
  } catch (error) {
    if (isInvalidFetchValueError(error)) {
      return signInViaRest(email, password);
    }

    throw error;
  }
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

