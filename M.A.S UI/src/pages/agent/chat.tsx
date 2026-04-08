import { useState, useRef, useEffect } from "react";
import { Bot, Send, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const INITIAL_MESSAGES = [
  {
    id: "1",
    role: "user",
    content: "How did the system perform this week?"
  },
  {
    id: "2",
    role: "coordinator",
    content: "Good week overall. Pipeline A processed 47 comments with 0 errors. Pipeline B drafted 5 posts — 3 approved, 2 pending your review. YouTube engagement is up 12% week-over-week. One urgent escalation in your inbox from an angry student comment on Facebook — worth reviewing today."
  },
  {
    id: "3",
    role: "user",
    content: "Run the engagement pipeline now"
  },
  {
    id: "4",
    role: "coordinator",
    content: "I can run the engagement pipeline for you right now.",
    isConfirmation: true,
    confirmationData: {
      title: "Run Pipeline A — Engagement",
      description: "This will process today's comments and flag any escalations."
    }
  }
];

const SUGGESTIONS = [
  "Run engagement pipeline",
  "How did last week go?",
  "Check ambassador status",
  "What's next on the calendar?"
];

export default function AgentChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text: string = inputValue) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: text
    }]);
    setInputValue("");

    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "coordinator",
        content: "I've noted your request. As a mock interface, I don't process live commands yet, but I'm ready when connected to the live API."
      }]);
    }, 1000);
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
          <p className="mt-1 text-sm text-muted-foreground">Ask samm for summaries, next steps, pipeline actions, and campaign coordination.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-6 pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
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

                  <div className={cn(
                    "rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm",
                    msg.role === "user"
                      ? "rounded-tr-sm bg-[#111] text-white"
                      : "rounded-tl-sm border bg-muted/50 text-foreground"
                  )}>
                    {msg.content}
                  </div>

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
                        <Button variant="outline" className="h-9 flex-1 text-xs" onClick={() => handleSend("Cancel pipeline run")}>Cancel</Button>
                        <Button className="h-9 flex-1 text-xs" onClick={() => handleSend("Confirm run")}>Confirm</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSend(suggestion)}
                className="rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                  handleSend();
                }
              }}
              placeholder="Ask samm anything..."
              className="flex-1 border-0 bg-transparent px-1 py-5 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button size="icon" className="h-8 w-8 shrink-0 rounded-lg transition-transform active:scale-95" disabled={!inputValue.trim()} onClick={() => handleSend()}>
              <Send className="ml-0.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
