import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, CheckCircle2, LockKeyhole, MailCheck } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCreateStripeCheckoutSession, useGetOrgBilling } from "@/lib/api";
import { getActiveSession, signUp, supabase } from "../../../../src/lib/supabase";

type Phase = "challenge" | "auth" | "verifyEmail" | "setup" | "summary" | "paywall";

type OnboardingAnswers = {
  challenge?: string;
  managing?: string;
  channels?: string[];
  goal?: string;
  brandName?: string;
  role?: string;
};

const challengeOptions = [
  "I do not know what to post",
  "I post inconsistently",
  "I manage too many platforms",
  "My tools are scattered",
  "Turning ideas into drafts takes too long",
  "I lose track of approvals or decisions",
];

const managingOptions = ["My own business", "Client accounts", "Creator content", "School or tuition business", "Service business", "Other"];
const channelOptions = ["Facebook", "Instagram", "WhatsApp", "LinkedIn", "YouTube", "Email", "Other"];
const goalOptions = ["Plan a month of content", "Build a campaign calendar", "Create draft posts", "Organize approvals", "Stay consistent", "I am not sure yet"];
const accessStatuses = new Set(["active", "trialing", "grandfathered"]);
const onboardingDraftKey = "samm:onboarding-draft";

function readOnboardingDraft(): OnboardingAnswers {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(onboardingDraftKey) ?? window.localStorage.getItem(onboardingDraftKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<OnboardingAnswers>;
    return {
      challenge: typeof parsed.challenge === "string" ? parsed.challenge : undefined,
      managing: typeof parsed.managing === "string" ? parsed.managing : undefined,
      channels: Array.isArray(parsed.channels) ? parsed.channels.filter((item): item is string => typeof item === "string") : undefined,
      goal: typeof parsed.goal === "string" ? parsed.goal : undefined,
      brandName: typeof parsed.brandName === "string" ? parsed.brandName : undefined,
      role: typeof parsed.role === "string" ? parsed.role : undefined,
    };
  } catch {
    return {};
  }
}

function writeOnboardingDraft(answers: OnboardingAnswers) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(onboardingDraftKey, JSON.stringify(answers));
  window.localStorage.setItem(onboardingDraftKey, JSON.stringify(answers));
}

function getNextSetupIndex(answers: OnboardingAnswers) {
  if (!answers.managing) return 0;
  if (!answers.channels?.length) return 1;
  if (!answers.goal) return 2;
  return 3;
}

function hasInProgressOnboardingDraft(answers = readOnboardingDraft()) {
  return Boolean(
    answers.challenge &&
      (!answers.managing || !answers.channels?.length || !answers.goal || !answers.brandName?.trim()),
  );
}

function hasCompletedOnboardingDraft(answers: OnboardingAnswers) {
  return Boolean(
    answers.challenge &&
      answers.managing &&
      answers.channels?.length &&
      answers.goal &&
      answers.brandName?.trim(),
  );
}

async function readInvokeError(error: unknown) {
  const context = typeof error === "object" && error !== null ? (error as { context?: Response }).context : null;
  if (context) {
    try {
      const payload = await context.clone().json();
      if (typeof payload?.error === "string") return payload.error;
      if (typeof payload?.message === "string") return payload.message;
    } catch {
      try {
        const text = await context.clone().text();
        if (text) return text;
      } catch {
        // Fall through.
      }
    }
  }

  if (error instanceof Error) return error.message;
  return "Could not complete the request.";
}

function StepShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-7 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="text-[11px] font-semibold lowercase tracking-[0.24em] text-muted-foreground">samm</span>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0b0b0c] sm:text-4xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

function OptionButton({
  active = false,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-colors",
        active
          ? "border-primary bg-primary text-white shadow-primary/20"
          : "border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const billingStatusParam = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("billing");
  }, []);
  const [phase, setPhase] = useState<Phase>(() => {
    if (billingStatusParam === "success" || billingStatusParam === "cancelled") return "paywall";
    return readOnboardingDraft().challenge ? "auth" : "challenge";
  });
  const [setupIndex, setSetupIndex] = useState(() => getNextSetupIndex(readOnboardingDraft()));
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => readOnboardingDraft());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthPending, setIsAuthPending] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [isWorkspacePending, setIsWorkspacePending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSyncingAfterCheckout, setIsSyncingAfterCheckout] = useState(billingStatusParam === "success");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResendPending, setIsResendPending] = useState(false);

  const { data: billing } = useGetOrgBilling({
    query: {
      enabled: phase === "paywall",
      refetchInterval: isSyncingAfterCheckout ? 2500 : false,
    },
  });
  const checkoutMutation = useCreateStripeCheckoutSession({
    mutation: {
      onSuccess: ({ url }: { url: string }) => window.location.assign(url),
      onError: (error: Error) => setCheckoutError(error.message),
    },
  });

  useEffect(() => {
    writeOnboardingDraft(answers);
  }, [answers]);

  useEffect(() => {
    if (billingStatusParam === "success") {
      setIsSyncingAfterCheckout(true);
      setPhase("paywall");
    }
    if (billingStatusParam === "cancelled") {
      setCheckoutError("Checkout was cancelled. You can start again when you are ready.");
      setPhase("paywall");
    }
  }, [billingStatusParam]);

  useEffect(() => {
    if (billing?.has_access && isSyncingAfterCheckout) {
      setIsSyncingAfterCheckout(false);
    }
  }, [billing?.has_access, isSyncingAfterCheckout]);

  async function resumeOnboardingSession() {
    const session = await getActiveSession();
    if (!session) return false;

    setHasActiveSession(true);
    let nextSession = session;
    if (!nextSession.user.app_metadata?.org_id) {
      setIsWorkspacePending(true);
      try {
        nextSession = await ensureWorkspaceProvisioned(nextSession);
      } finally {
        setIsWorkspacePending(false);
      }
    }

    const draft = readOnboardingDraft();
    setAnswers(draft);
    setSetupIndex(draft.challenge ? getNextSetupIndex(draft) : 0);
    setPhase(hasCompletedOnboardingDraft(draft) ? "paywall" : draft.challenge ? "setup" : "challenge");
    return true;
  }

  useEffect(() => {
    let isMounted = true;

    resumeOnboardingSession()
      .then((resumed) => {
        if (!isMounted || !resumed || billingStatusParam) return;
      })
      .catch((error) => {
        if (!isMounted) return;
        setAuthError(error instanceof Error ? error.message : "Could not prepare your workspace.");
        setPhase("auth");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function ensureWorkspaceProvisioned(session: Session, emailOverride?: string) {
    if (session.user.app_metadata?.org_id) return session;

    const normalizedEmail = (emailOverride || session.user.email || "").trim().toLowerCase();
    const { error: provisionError } = await supabase.functions.invoke("provision-org", {
      body: { userId: session.user.id, email: normalizedEmail },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (provisionError) {
      throw new Error(await readInvokeError(provisionError));
    }

    const { data, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw refreshError;
    return data.session ?? (await getActiveSession()) ?? session;
  }

  const setupSteps = useMemo(
    () => [
      {
        key: "managing",
        title: "What are you managing?",
        options: managingOptions,
        onChoose: (value: string) => {
          setAnswers((current) => ({ ...current, managing: value }));
          setSetupIndex(1);
        },
      },
      {
        key: "channels",
        title: "Where do you post or plan to post?",
        options: channelOptions,
        onChoose: (value: string) => {
          setAnswers((current) => {
            const channels = current.channels ?? [];
            return {
              ...current,
              channels: channels.includes(value) ? channels.filter((item) => item !== value) : [...channels, value],
            };
          });
        },
      },
      {
        key: "goal",
        title: "What should samm help with first?",
        options: goalOptions,
        onChoose: (value: string) => {
          setAnswers((current) => ({ ...current, goal: value }));
          setSetupIndex(3);
        },
      },
    ],
    [],
  );

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    setIsAuthPending(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const authResult = await signUp(normalizedEmail, password);

      if (authResult.error) {
        const message = authResult.error.message;
        if (/already registered|already exists|user already/i.test(message)) {
          throw new Error("This email already has an account. Use Sign in to continue.");
        }
        if (/rate limit|too many|over_email_send_rate_limit|429/i.test(message)) {
          throw new Error("Too many signup attempts. Wait a minute, then try again.");
        }
        throw authResult.error;
      }

      if (!authResult.data.session) {
        setEmail(normalizedEmail);
        setPhase("verifyEmail");
        return;
      }

      setHasActiveSession(true);
      setIsWorkspacePending(true);
      await ensureWorkspaceProvisioned(authResult.data.session, normalizedEmail);
      setSetupIndex(getNextSetupIndex(answers));
      setPhase("setup");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not create your workspace.");
    } finally {
      setIsWorkspacePending(false);
      setIsAuthPending(false);
    }
  }

  async function handleRefreshAfterVerification() {
    setAuthError(null);
    setResendStatus(null);
    setIsAuthPending(true);

    try {
      const resumed = await resumeOnboardingSession();
      if (!resumed) {
        setPhase("auth");
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not continue setup.");
      setPhase("auth");
    } finally {
      setIsAuthPending(false);
    }
  }

  async function handleResendVerification() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setResendStatus("Enter your email again to resend the confirmation link.");
      setPhase("auth");
      return;
    }

    setIsResendPending(true);
    setResendStatus(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
      });

      if (error) throw error;
      setResendStatus("Confirmation email sent. Check your inbox and spam folder.");
    } catch (error) {
      setResendStatus(error instanceof Error ? error.message : "Could not resend the confirmation email.");
    } finally {
      setIsResendPending(false);
    }
  }

  const currentSetup = setupSteps[setupIndex];
  const hasBillingAccess = Boolean(billing?.has_access || (billing?.status && accessStatuses.has(billing.status)));

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#f0f4fb_0%,#f7f8fc_52%,#eef3fb_100%)] px-5 py-8 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Homepage
          </Link>
          <Link href="/login" className="text-sm font-medium text-foreground hover:opacity-70">
            Sign in
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          {phase === "challenge" && (
            <StepShell eyebrow="guided setup" title="What feels hardest right now?">
              <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                {challengeOptions.map((option) => (
                  <OptionButton
                    key={option}
                    onClick={() => {
                      setAnswers((current) => {
                        const next = { ...current, challenge: option };
                        writeOnboardingDraft(next);
                        return next;
                      });
                      setPhase(hasActiveSession ? "setup" : "auth");
                    }}
                  >
                    {option}
                  </OptionButton>
                ))}
              </div>
            </StepShell>
          )}

          {phase === "auth" && (
            <StepShell eyebrow="save your setup" title="Create your workspace">
              <form className="w-full max-w-sm space-y-3 rounded-[1.5rem] border border-slate-200 bg-white/88 p-5 text-left shadow-xl shadow-slate-200/50" onSubmit={handleAuth}>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-foreground">Work email</span>
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@company.com" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-foreground">Password</span>
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} placeholder="At least 8 characters" />
                </label>
                {authError ? <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{authError}</div> : null}
                <Button className="h-11 w-full rounded-xl" disabled={isAuthPending} type="submit">
                  {isAuthPending ? "Creating workspace..." : "Continue"}
                </Button>
                <p className="text-center text-[11px] leading-5 text-muted-foreground">Your first answer is saved into this setup flow.</p>
              </form>
            </StepShell>
          )}

          {phase === "verifyEmail" && (
            <StepShell eyebrow="confirm your email" title="Check your inbox.">
              <div className="w-full max-w-sm rounded-[1.5rem] border border-slate-200 bg-white/88 p-5 text-left shadow-xl shadow-slate-200/50">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MailCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Your setup is saved.</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Confirm {email || "your email"}, then sign in to finish opening your workspace.
                    </p>
                  </div>
                </div>
                {resendStatus ? <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-muted-foreground">{resendStatus}</div> : null}
                <div className="mt-5 grid gap-2">
                  <Button className="h-11 rounded-xl" disabled={isAuthPending} onClick={handleRefreshAfterVerification}>
                    {isAuthPending ? "Checking..." : "Refresh and continue"}
                  </Button>
                  <Button className="h-11 rounded-xl" variant="outline" disabled={isResendPending} onClick={handleResendVerification}>
                    {isResendPending ? "Sending..." : "Resend confirmation email"}
                  </Button>
                </div>
              </div>
            </StepShell>
          )}

          {phase === "setup" && currentSetup && setupIndex < 3 && (
            <StepShell eyebrow={`step ${setupIndex + 2} of 5`} title={currentSetup.title}>
              <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                {currentSetup.options.map((option) => (
                  <OptionButton
                    key={option}
                    active={currentSetup.key === "channels" && (answers.channels ?? []).includes(option)}
                    onClick={() => currentSetup.onChoose(option)}
                  >
                    {option}
                  </OptionButton>
                ))}
              </div>
              {currentSetup.key === "channels" ? (
                <Button className="rounded-full px-6" disabled={(answers.channels ?? []).length === 0} onClick={() => setSetupIndex(2)}>
                  Continue with {(answers.channels ?? []).length} selected
                </Button>
              ) : null}
            </StepShell>
          )}

          {phase === "setup" && setupIndex === 3 && (
            <StepShell eyebrow="step 5 of 5" title="Who is this workspace for?">
              <div className="w-full max-w-md space-y-3 rounded-[1.5rem] border border-slate-200 bg-white/88 p-5 text-left shadow-xl shadow-slate-200/50">
                <Input placeholder="Brand or business name" value={answers.brandName ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, brandName: event.target.value }))} />
                <Input placeholder="Your role" value={answers.role ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, role: event.target.value }))} />
                <Button className="h-11 w-full rounded-xl" onClick={() => setPhase("summary")} disabled={!answers.brandName?.trim()}>
                  Review setup
                </Button>
              </div>
            </StepShell>
          )}

          {phase === "summary" && (
            <StepShell eyebrow="your samm setup" title="Looks good.">
              <div className="w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/90 text-left shadow-xl shadow-slate-200/50">
                {[
                  ["Main challenge", answers.challenge],
                  ["Managing", answers.managing],
                  ["Channels", answers.channels?.join(", ")],
                  ["First goal", answers.goal],
                  ["Workspace", [answers.brandName, answers.role].filter(Boolean).join(" - ")],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[8rem_1fr] gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium leading-6 text-foreground">{value || "-"}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="h-11 rounded-xl px-6" onClick={() => setPhase("paywall")}>
                  Unlock workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button className="h-11 rounded-xl px-6" variant="outline" onClick={() => setLocation("/waitlist")}>
                  Request demo
                </Button>
              </div>
            </StepShell>
          )}

          {phase === "paywall" && (
            <StepShell eyebrow={hasBillingAccess ? "workspace access" : "founding access"} title={hasBillingAccess ? "Your workspace is unlocked." : "Start founding access"}>
              <div className="w-full max-w-md rounded-[1.5rem] border border-slate-200 bg-white/90 p-6 text-left shadow-xl shadow-slate-200/50">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-bold tracking-tight text-[#0b0b0c]">$29</span>
                  <span className="mb-1 text-2xl font-medium text-slate-400">.99</span>
                  <span className="mb-2 text-sm text-muted-foreground">/month</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Plan the month, create drafts, review approvals, and keep the workflow visible in one workspace.
                </p>
                <div className="mt-5 space-y-2">
                  {["Monthly planning workflow", "Content calendar", "Draft creation", "Review flow", "Guided setup"].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>
                {checkoutError ? <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{checkoutError}</div> : null}
                {isSyncingAfterCheckout ? (
                  <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-primary">
                    Confirming your subscription. This will unlock automatically once Stripe finishes syncing.
                  </div>
                ) : null}
                <Button
                  className="mt-6 h-11 w-full rounded-xl"
                  disabled={checkoutMutation.isPending || isWorkspacePending}
                  onClick={() => {
                    if (hasBillingAccess) {
                      setLocation("/");
                      return;
                    }
                    if (!hasActiveSession) {
                      setPhase("auth");
                      return;
                    }
                    setCheckoutError(null);
                    checkoutMutation.mutate({ origin: window.location.origin });
                  }}
                >
                  {hasBillingAccess
                    ? "Enter workspace"
                    : isWorkspacePending
                      ? "Preparing workspace..."
                      : checkoutMutation.isPending
                        ? "Redirecting to Stripe..."
                        : "Start founding access"}
                </Button>
              </div>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <LockKeyhole className="h-3.5 w-3.5" />
                Your setup is saved and ready when you enter the workspace.
              </p>
            </StepShell>
          )}
        </div>
      </div>
    </div>
  );
}
