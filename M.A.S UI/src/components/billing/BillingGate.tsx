import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateStripeCheckoutSession, useCreateStripePortalSession, useGetOrgBilling } from "@/lib/api";
import { signOut } from "@/lib/supabase";

type BillingGateProps = {
  children: ReactNode;
};

const ACCESS_STATUSES = new Set(["active", "trialing", "grandfathered"]);

function PaywallScreen({
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
    <div className="min-h-screen bg-[linear-gradient(160deg,#f0f4fb_0%,#f7f8fc_52%,#eef3fb_100%)] px-5 py-8 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center gap-7 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-[11px] font-semibold lowercase tracking-[0.24em] text-muted-foreground">samm</span>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">founding access</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0b0b0c] sm:text-4xl">
            Start founding access
          </h1>
        </div>

        <div className="w-full max-w-md rounded-[1.5rem] border border-slate-200 bg-white/90 p-6 text-left shadow-xl shadow-slate-200/50">
          <div className="flex items-end gap-1">
            <span className="text-5xl font-bold tracking-tight text-[#0b0b0c]">$29</span>
            <span className="mb-1 text-2xl font-medium text-slate-400">.99</span>
            <span className="mb-2 text-sm text-muted-foreground">/month</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Plan the month, create drafts, review approvals, and keep the workflow visible in one workspace.
          </p>

          {currentPeriodEnd ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Current period ends on {new Date(currentPeriodEnd).toLocaleDateString()}.
            </p>
          ) : null}

          <div className="mt-5 space-y-2">
            {["Monthly planning workflow", "Content calendar", "Draft creation", "Review flow", "Guided setup"].map(
              (feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {feature}
                </div>
              ),
            )}
          </div>

          {isSyncingAfterCheckout ? (
            <div className="mt-5 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-primary">
              Confirming your subscription. This will unlock automatically once Stripe finishes syncing.
            </div>
          ) : null}

          {actionError ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          ) : null}

          <Button className="mt-6 h-11 w-full rounded-xl" disabled={isCheckingOut} onClick={onSubscribe}>
            <ArrowRight className="mr-2 h-4 w-4" />
            {isCheckingOut ? "Redirecting to Stripe..." : "Start founding access"}
          </Button>

          {hasCustomer ? (
            <Button
              className="mt-2 h-11 w-full rounded-xl"
              disabled={isOpeningPortal}
              onClick={onManageBilling}
              variant="outline"
            >
              {isOpeningPortal ? "Opening portal..." : "Manage billing"}
            </Button>
          ) : null}
        </div>

        <Button className="h-10 rounded-xl" onClick={onSignOut} variant="ghost">
          <LockKeyhole className="mr-2 h-4 w-4" />
          Sign out
        </Button>
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
        await signOut();
      }}
      onSubscribe={() => {
        setActionError(null);
        checkoutMutation.mutate({ origin: window.location.origin });
      }}
    />
  );
}
