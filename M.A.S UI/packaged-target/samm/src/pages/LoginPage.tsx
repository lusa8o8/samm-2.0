import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AlertCircle, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicPageFrame, PublicWordmark } from "@/components/public/brand-kit";
import { getActiveSession, signIn, signOut, supabase } from "../../../../src/lib/supabase";

function getPostLoginPath(session: Session | null) {
  if (!session?.user.app_metadata?.org_id) return "/start";
  return "/";
}

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

    setLocation(getPostLoginPath(await getActiveSession()));
    setIsSubmitting(false);
  };

  const signedInPath = getPostLoginPath(session);

  return (
    <PublicPageFrame>
      <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_28px_100px_rgba(15,23,42,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="hidden bg-[#0b0b0c] p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <PublicWordmark inverted />
              <h1 className="mt-12 max-w-md text-5xl font-semibold leading-[1.04] tracking-tight text-[#f5f3ef]">
                access your marketing workspace
              </h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/72">
                Sign in if your workspace already exists. New teams can start founding access or request a demo.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 text-sm leading-6 text-white/72">
              Human approval stays in the workflow. samm helps coordinate the work; your team keeps control.
            </div>
          </aside>

          <section className="bg-[#fcfbf8] px-6 py-8 sm:px-10 lg:px-12">
            <div className="mx-auto max-w-md">
              <div className="mb-8 flex items-center justify-between">
                <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4 hover:opacity-70">
                  Homepage
                </Link>
                <PublicWordmark />
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-[#0b0b0c]">sign in to the workspace</h1>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {checked && session
                  ? "You are already signed in. Continue to the workspace or sign out to use another account."
                  : "Sign in if your workspace has already been activated."}
              </p>

              {checked && session ? (
                <div className="mt-8 space-y-3">
                  <Button className="h-11 w-full rounded-xl" type="button" onClick={() => setLocation(signedInPath)}>
                    {signedInPath === "/start" ? "Continue setup" : "Enter workspace"}
                  </Button>
                  <Button className="h-11 w-full rounded-xl" type="button" variant="outline" onClick={() => void signOut()}>
                    Sign out
                  </Button>
                </div>
              ) : (
              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-11 rounded-xl border-black/10 bg-white pl-10"
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
                      className="h-11 rounded-xl border-black/10 bg-white pl-10"
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
              )}

              <div className="mt-5 rounded-[1.2rem] border border-black/8 bg-white px-4 py-4 text-sm text-muted-foreground">
                New to samm?{" "}
                <Link href="/start" className="font-medium text-[#0b0b0c] underline underline-offset-4 hover:opacity-70">
                  Start founding access
                </Link>
                <span className="mx-1 text-muted-foreground">or</span>
                <Link href="/waitlist" className="font-medium text-[#0b0b0c] underline underline-offset-4 hover:opacity-70">
                  request a demo
                </Link>
                <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
              </div>

              <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                <Link href="/privacy" className="underline underline-offset-4 transition-opacity hover:opacity-70">
                  Privacy
                </Link>
                <Link href="/terms" className="underline underline-offset-4 transition-opacity hover:opacity-70">
                  Terms
                </Link>
                <Link href="/data-deletion" className="underline underline-offset-4 transition-opacity hover:opacity-70">
                  Data deletion
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </PublicPageFrame>
  );
}
