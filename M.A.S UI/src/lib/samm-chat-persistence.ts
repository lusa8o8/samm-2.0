import { getOrgId, supabase } from "./supabase";

export type SammChatRole = "user" | "coordinator";
export type SammConversationMode = "planning" | "execution";

export type PersistedSammChatMessage = {
  id: string;
  org_id: string;
  thread_key: string;
  role: SammChatRole;
  mode: SammConversationMode;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export const SAMM_PRIMARY_THREAD_KEY = "web:samm:primary";

function isMissingPersistenceTable(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  return code === "42P01" || /samm_chat_messages/i.test(message);
}

function warnPersistenceFailure(action: string, error: unknown) {
  if (isMissingPersistenceTable(error)) {
    console.warn(`samm chat persistence skipped: migration has not been applied for ${action}.`);
    return;
  }
  console.warn(`samm chat persistence failed while trying to ${action}.`, error);
}

export async function loadSammChatMessages({
  threadKey = SAMM_PRIMARY_THREAD_KEY,
  limit = 80,
}: {
  threadKey?: string;
  limit?: number;
} = {}) {
  const { data, error } = await supabase
    .from("samm_chat_messages")
    .select("id,org_id,thread_key,role,mode,content,metadata,created_at")
    .eq("org_id", getOrgId())
    .eq("thread_key", threadKey)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    warnPersistenceFailure("load messages", error);
    return [];
  }

  return ((data ?? []) as PersistedSammChatMessage[]).reverse();
}

export async function appendSammChatMessage({
  role,
  content,
  mode,
  metadata = {},
  threadKey = SAMM_PRIMARY_THREAD_KEY,
  createdAt = new Date().toISOString(),
}: {
  role: SammChatRole;
  content: string;
  mode: SammConversationMode;
  metadata?: Record<string, unknown>;
  threadKey?: string;
  createdAt?: string;
}) {
  const { data, error } = await supabase
    .from("samm_chat_messages")
    .insert({
      org_id: getOrgId(),
      thread_key: threadKey,
      role,
      mode,
      content,
      metadata,
      created_at: createdAt,
    })
    .select("id,org_id,thread_key,role,mode,content,metadata,created_at")
    .single();

  if (error) {
    warnPersistenceFailure("save message", error);
    return null;
  }

  return data as PersistedSammChatMessage;
}
