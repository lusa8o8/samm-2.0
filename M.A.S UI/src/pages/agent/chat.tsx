import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, PlayCircle, Send, Sparkles, XCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaceInspector } from "@/components/layout";
import { useCoordinatorChat } from "@/lib/api";
import {
  createInspectorPayload,
  type WorkspaceInspectorPayload,
  type WorkspaceMessagePart,
} from "@/lib/workspace-adapter";
import { cn } from "@/lib/utils";

type ChatStatus = "running" | "waiting_human" | "failed" | "success" | "scheduled" | "queued";

type ChatMessage = {
  id: string;
  role: "user" | "coordinator";
  content: string;
  parts: WorkspaceMessagePart[];
  isConfirmation?: boolean;
  confirmationData?: {
    title: string;
    description: string;
    action: string;
  };
  inspectorPayload?: WorkspaceInspectorPayload;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "coordinator",
    content:
      "I'm watching runs, approvals, calendar triggers, and recent performance. Ask for a summary, the next priority, or tell me to prepare or run a pipeline.",
    parts: [
      {
        type: "text",
        text: "I'm watching runs, approvals, calendar triggers, and recent performance. Ask for a summary, the next priority, or tell me to prepare or run a pipeline.",
      },
    ],
  },
];

const DEFAULT_SUGGESTIONS = [
  "Summarize this week",
  "What needs my approval?",
  "What is next on the calendar?",
  "Run the engagement pipeline",
];

function getStatusTone(status: ChatStatus) {
  switch (status) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "failed":
      return "border-red-200 bg-red-50 text-red-700";
    case "waiting_human":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "scheduled":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "queued":
      return "border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border-muted-foreground/20 bg-muted/40 text-muted-foreground";
  }
}

function getStatusIcon(status: ChatStatus) {
  switch (status) {
    case "success":
      return CheckCircle2;
    case "failed":
      return XCircle;
    case "waiting_human":
      return AlertTriangle;
    case "scheduled":
      return Clock3;
    case "queued":
      return PlayCircle;
    default:
      return Clock3;
  }
}

export default function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const coordinatorChat = useCoordinatorChat();
  const { openInspector } = useWorkspaceInspector();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, coordinatorChat.isPending]);

  const submitMessage = async (text: string, confirmationAction?: string | null) => {
    const trimmed = text.trim();
    if (!trimmed || coordinatorChat.isPending) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}`,
      role: "user",
      content: trimmed,
      parts: [{ type: "text", text: trimmed }],
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputValue("");

    try {
      const response = await coordinatorChat.mutateAsync({
        message: trimmed,
        confirmationAction: confirmationAction ?? null,
        history: nextMessages.map(({ role, content }) => ({ role, content })),
      });

      const nextSuggestions =
        Array.isArray(response.suggestions) && response.suggestions.length > 0
          ? response.suggestions.slice(0, 4)
          : DEFAULT_SUGGESTIONS;
      setSuggestions(nextSuggestions);

      const nextContent =
        response.message ||
        "I reviewed the current workspace state and prepared the next step.";
      const nextParts: WorkspaceMessagePart[] = [{ type: "text", text: nextContent }];

      if (response.invoked_action) {
        nextParts.push({
          type: "status",
          label: `${response.invoked_action.pipeline.toUpperCase()} ${response.invoked_action.status}`,
          status: response.invoked_action.status,
        });
      }

      if (response.confirmation) {
        nextParts.push({
          type: "action",
          label: `Awaiting confirmation: ${response.confirmation.title}`,
          action: response.confirmation.action,
          variant: "secondary",
        });
      }

      const inspectorPayload = createInspectorPayload(
        "Coordinator decision",
        {
          type: response.confirmation ? "decision_log" : "custom",
          title: response.confirmation ? response.confirmation.title : "Coordinator response",
          data: {
            message: nextContent,
            confirmation: response.confirmation ?? null,
            invoked_action: response.invoked_action ?? null,
            suggestions: nextSuggestions,
          },
        },
        response.confirmation
          ? "Review the pending confirmation or runtime action details."
          : "Inspect the structured action/output attached to this coordinator response."
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-reply`,
          role: "coordinator",
          content: nextContent,
          parts: nextParts,
          isConfirmation: Boolean(response.confirmation),
          confirmationData: response.confirmation
            ? {
                title: response.confirmation.title,
                description: response.confirmation.description,
                action: response.confirmation.action,
              }
            : undefined,
          inspectorPayload,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The request failed.";
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: "coordinator",
          content: `I couldn't complete that request: ${message}`,
          parts: [
            { type: "text", text: `I couldn't complete that request: ${message}` },
            { type: "status", label: "Coordinator request failed", status: "failed" },
          ],
          inspectorPayload: createInspectorPayload(
            "Coordinator failure",
            {
              type: "decision_log",
              title: "Request failed",
              data: {
                error: message,
                latest_user_message: trimmed,
              },
            },
            "This is the raw failure context returned to the workspace."
          ),
        },
      ]);
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(244,241,235,0.45)_0%,rgba(244,241,235,0)_28%)]">
      <header className="shrink-0 border-b border-border/80 bg-background/95 px-4 py-4 backdrop-blur md:px-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="lowercase text-foreground">samm</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">Coordinate the work</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask samm for summaries, next steps, pipeline actions, and campaign coordination.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-6 pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div className={cn("flex max-w-[80%] gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                {msg.role === "coordinator" && (
                  <Avatar className="mt-1 h-8 w-8 shrink-0 border bg-muted">
                    <AvatarFallback className="bg-transparent">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="flex flex-col gap-1">
                  {msg.role === "coordinator" && (
                    <span className="ml-1 text-[11px] font-medium lowercase text-muted-foreground">samm</span>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm",
                      msg.role === "user"
                        ? "rounded-tr-sm bg-[#111] text-white"
                        : "rounded-tl-sm border bg-muted/50 text-foreground"
                    )}
                  >
                    {msg.content}
                  </div>

                  {msg.role === "coordinator" ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {msg.parts
                        .filter((part): part is Extract<WorkspaceMessagePart, { type: "status" }> => part.type === "status")
                        .map((part, index) => {
                          const StatusIcon = getStatusIcon(part.status);
                          return (
                            <button
                              key={`${msg.id}-status-${index}`}
                              type="button"
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors hover:opacity-90",
                                getStatusTone(part.status)
                              )}
                              onClick={() => msg.inspectorPayload && openInspector(msg.inspectorPayload)}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                              <span>{part.label}</span>
                            </button>
                          );
                        })}

                      {msg.inspectorPayload ? (
                        <button
                          type="button"
                          className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          onClick={() => openInspector(msg.inspectorPayload!)}
                        >
                          Inspect details
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {msg.isConfirmation && msg.confirmationData && (
                    <div className="mt-2 w-full rounded-xl border bg-card p-4 shadow-sm md:w-[350px]">
                      <div className="mb-4 flex items-start gap-3">
                        <div className="shrink-0 rounded-lg bg-amber-100 p-2 text-amber-600">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{msg.confirmationData.title}</h4>
                          <p className="mt-1 text-xs leading-snug text-muted-foreground">{msg.confirmationData.description}</p>
                        </div>
                      </div>
                      <div className="flex w-full gap-2">
                        <Button
                          variant="outline"
                          className="h-9 flex-1 text-xs"
                          disabled={coordinatorChat.isPending}
                          onClick={() => submitMessage(`Cancel ${msg.confirmationData?.title}`)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="h-9 flex-1 text-xs"
                          disabled={coordinatorChat.isPending}
                          onClick={() => submitMessage(`Confirm ${msg.confirmationData?.title}`, msg.confirmationData?.action)}
                        >
                          Confirm
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {coordinatorChat.isPending && (
            <div className="flex w-full justify-start">
              <div className="flex max-w-[80%] gap-3">
                <Avatar className="mt-1 h-8 w-8 shrink-0 border bg-muted">
                  <AvatarFallback className="bg-transparent">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <span className="ml-1 text-[11px] font-medium lowercase text-muted-foreground">samm</span>
                  <div className="rounded-2xl rounded-tl-sm border bg-muted/50 px-4 py-3 text-[14px] text-muted-foreground shadow-sm">
                    Reviewing the latest workspace state...
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => submitMessage(suggestion)}
                disabled={coordinatorChat.isPending}
                className="rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-muted-foreground/20 bg-muted/30 px-3 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitMessage(inputValue);
                }
              }}
              placeholder="Ask samm anything..."
              className="flex-1 border-0 bg-transparent px-1 py-5 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg transition-transform active:scale-95"
              disabled={!inputValue.trim() || coordinatorChat.isPending}
              onClick={() => submitMessage(inputValue)}
            >
              <Send className="ml-0.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
