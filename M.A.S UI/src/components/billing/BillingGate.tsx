import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, ArrowRight, CreditCard, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateStripeCheckoutSession, useCreateStripePortalSession, useGetOrgBilling } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type BillingGateProps = {
  children: ReactNode;
};

const ACCESS_STATUSES = new Set(["active", "trialing"]);

function toStatusCopy(status: string) {
  switch (status) {
    case "active":
      return "Subscription active";
    case "trialing":
      return "Trial active";
    case "past_due":
      return "Payment update needed";
    case "canceled":
      return "Subscription canceled";
    case "unpaid":
      return "Payment required";
    case "incomplete":
      return "Checkout incomplete";
    default:
      return "Subscription required";
  }
}

function PaywallScreen({
  status,
  currentPeriodEnd,
  hasCustomer,
  isCheckingOut,
  isOpeningPortal,
  isSyncingAfterCheckout,
  actionError,
  onSubscribe,
  onManageBilling,
  onSignOut,
}: {
  status: string;
  currentPeriodEnd: string | null;
  hasCustomer: boolean;
  isCheckingOut: boolean;
  isOpeningPortal: boolean;
  isSyncingAfterCheckout: boolean;
  actionError: string | null;
  onSubscribe: () => void;
  onManageBilling: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_28%),linear-gradient(180deg,#f7f4ee_0%,#f2efe8_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-black/8 bg-white/[0.86] shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur-[6px] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden bg-[#0b0b0c] px-8 py-8 text-white lg:flex lg:flex-col lg:justify-between xl:px-10 xl:py-10">
            <div>
              <p className="text-[11px] font-semibold lowercase tracking-[0.24em] text-white/55">samm</p>
              <h1 className="mt-4 max-w-md text-[2.45rem] font-semibold tracking-tight text-[#f5f3ef]">
                unlock the full workspace
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/68">
                Calendar, approvals, content, and execution stay in one operating layer once billing is active.
              </p>
            </div>

            <div className="space-y-4">
              {[
                "Plan and commit the month without switching tools.",
                "Review approvals, drafts, and visual briefs in one workspace.",
                "Run one-time posts and campaigns with shared brand grounding.",
              ].map((point) => (
                <div
                  key={point}
                  className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-white/74"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center bg-[#fcfbf8] px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
            <div className="w-full max-w-md">
              <div className="flex items-center gap-2 text-[11px] font-semibold lowercase tracking-[0.24em] text-foreground/72">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>samm billing</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h2 className="text-[2.05rem] font-semibold tracking-tight text-[#0b0b0c]">
                  subscribe to continue
                </h2>
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-muted-foreground">
                  {toStatusCopy(status)}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                This workspace is signed in, but billing needs to be active before the execution surfaces stay available.
              </p>

              {currentPeriodEnd ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Current period ends on {new Date(currentPeriodEnd).toLocaleDateString()}.
                </p>
              ) : null}

              {isSyncingAfterCheckout ? (
                <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
                  We are confirming your subscription now. This screen will unlock automatically once Stripe finishes syncing.
                </div>
              ) : null}

              {actionError ? (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              ) : null}

              <div className="mt-6 space-y-3 rounded-[1.4rem] border border-black/8 bg-white/80 p-4 shadow-[0_12px_26px_rgba(15,23,42,0.04)]">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-[#0b0b0c] p-2 text-white">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Workspace billing controls access</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Billing is attached to the workspace, not individual users, so the whole team stays on the same plan.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="h-11 flex-1 rounded-xl" disabled={isCheckingOut} onClick={onSubscribe}>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    {isCheckingOut ? "Redirecting to Stripe..." : "Start subscription"}
                  </Button>
                  {hasCustomer ? (
                    <Button
                      className="h-11 rounded-xl"
                      disabled={isOpeningPortal}
                      onClick={onManageBilling}
                      variant="outline"
                    >
                      {isOpeningPortal ? "Opening portal..." : "Manage billing"}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button className="h-10 rounded-xl" onClick={onSignOut} variant="ghost">
                  <LockKeyhole className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BillingGate({ children }: BillingGateProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSyncingAfterCheckout, setIsSyncingAfterCheckout] = useState(false);

  const billingStatusParam = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("billing");
  }, []);

  const { data: billing, isLoading } = useGetOrgBilling({
    query: {
      refetchInterval: isSyncingAfterCheckout ? 2500 : false,
    },
  });

  useEffect(() => {
    if (billingStatusParam === "success") {
      setIsSyncingAfterCheckout(true);
    }
  }, [billingStatusParam]);

  useEffect(() => {
    if (billing?.has_access && isSyncingAfterCheckout) {
      setIsSyncingAfterCheckout(false);
    }
  }, [billing?.has_access, isSyncingAfterCheckout]);

  const checkoutMutation = useCreateStripeCheckoutSession({
    mutation: {
      onSuccess: ({ url }: { url: string }) => {
        window.location.assign(url);
      },
      onError: (error: Error) => {
        setActionError(error.message);
      },
    },
  });

  const portalMutation = useCreateStripePortalSession({
    mutation: {
      onSuccess: ({ url }: { url: string }) => {
        window.location.assign(url);
      },
      onError: (error: Error) => {
        setActionError(error.message);
      },
    },
  });

  const hasAccess = Boolean(billing?.has_access || (billing?.status && ACCESS_STATUSES.has(billing.status)));

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="rounded-2xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-sm">
          Checking workspace billing...
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <PaywallScreen
      actionError={actionError}
      currentPeriodEnd={billing?.current_period_end ?? null}
      hasCustomer={Boolean(billing?.stripe_customer_id)}
      isCheckingOut={checkoutMutation.isPending}
      isOpeningPortal={portalMutation.isPending}
      isSyncingAfterCheckout={isSyncingAfterCheckout}
      onManageBilling={() => {
        setActionError(null);
        portalMutation.mutate({ origin: window.location.origin });
      }}
      onSignOut={async () => {
        await supabase.auth.signOut();
      }}
      onSubscribe={() => {
        setActionError(null);
        checkoutMutation.mutate({ origin: window.location.origin });
      }}
      status={billing?.status ?? "inactive"}
    />
  );
}
