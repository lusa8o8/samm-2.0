import { FormEvent, useEffect, useState } from "react";
import { Redirect, useLocation } from "wouter";
import { AlertCircle, LockKeyhole, Mail } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getActiveSession, signIn, supabase } from "../../../../src/lib/supabase";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    void getActiveSession()
      .then((nextSession) => {
        setSession(nextSession ?? null);
        setChecked(true);
      })
      .catch(() => {
        setSession(null);
        setChecked(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    setLocation("/");
    setIsSubmitting(false);
  };

  if (checked && session) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f6f7fb_0%,#eef2f8_100%)] px-6 py-10 text-foreground">
      <div className="w-full max-w-md rounded-[28px] border border-border/80 bg-card/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="mb-8">
          <p className="text-[11px] font-semibold lowercase tracking-[0.24em] text-muted-foreground">samm</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">sign in to the workspace</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The packaged UI runs on its own local runtime, so sign in here to inspect it against the live backend.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-xl border-border bg-background pl-10"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ops@company.com"
                required
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Password</span>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-xl border-border bg-background pl-10"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
          </label>

          {error ? (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <Button className="h-11 w-full rounded-xl" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
