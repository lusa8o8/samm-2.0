import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Users2, Zap } from "lucide-react";
import { useSubmitWaitlist } from "../../lib/api";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

const channelOptions = ["WhatsApp", "Facebook", "Email", "YouTube", "Other"] as const;

type WaitlistScreenProps = {
  loginHref: string;
  homeHref?: string;
  title?: string;
  subtitle?: string;
};

export default function WaitlistScreen({
  loginHref,
  homeHref,
  title = "Request access",
  subtitle = "Tell us about your current setup  we will review and onboard the right teams.",
}: WaitlistScreenProps) {
  const submitWaitlist = useSubmitWaitlist();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [primaryUseCase, setPrimaryUseCase] = useState("");
  const [biggestWorkflowPain, setBiggestWorkflowPain] = useState("");
  const [channels, setChannels] = useState<string[]>([]);

  function toggleChannel(channel: string) {
    setChannels((current) =>
      current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await submitWaitlist.mutateAsync({
      fullName,
      email,
      organizationName,
      role,
      teamSize,
      channels,
      primaryUseCase,
      biggestWorkflowPain,
    });
  }

  if (submitWaitlist.isSuccess) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(116,152,214,0.18),transparent_28%),linear-gradient(180deg,#f7f4ee_0%,#f2efe8_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-black/10 bg-[rgba(255,255,255,0.82)] p-6 shadow-[0_28px_110px_rgba(15,23,42,0.12)] backdrop-blur-[6px] sm:p-8 lg:p-10">
            <div className="w-fit rounded-full border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="mt-6 text-[11px] font-semibold lowercase tracking-[0.24em] text-foreground/65">samm</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0b0b0c]">Request received</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              We've captured your request and will review it manually. If your team is a good fit for the current PMF
              stage, we'll reach out with onboarding details and access.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={loginHref}>
                <Button className="h-10 rounded-xl px-5">
                  Go to sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              {homeHref ? (
                <Link href={homeHref}>
                  <Button variant="outline" className="h-10 rounded-xl border-black/10 bg-white/70 px-5">
                    Back to homepage
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(116,152,214,0.18),transparent_28%),linear-gradient(180deg,#f7f4ee_0%,#f2efe8_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-[78rem] overflow-hidden rounded-[2.2rem] border border-black/10 bg-[rgba(255,255,255,0.78)] shadow-[0_28px_110px_rgba(15,23,42,0.12)] backdrop-blur-[6px] lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="hidden bg-[#0b0b0c] px-8 py-8 text-white lg:flex lg:flex-col lg:justify-between xl:px-10 xl:py-10">
            <div>
              <p className="text-[11px] font-semibold lowercase tracking-[0.24em] text-white/70">samm</p>
              <h1 className="mt-12 max-w-md text-[3.4rem] font-semibold leading-[1.04] tracking-tight text-[#f5f3ef] xl:text-[3.9rem]">
                Stop guessing what to post <span className="text-[#bda7ff]">every day.</span>
              </h1>
              <p className="mt-7 max-w-md text-lg leading-8 text-white/82">
                Plan your entire month in one sitting.
                <br />
                No more scattered tools, messy AI workflows, or inconsistent posting.
              </p>
            </div>

            <div className="mt-8 space-y-4 border-t border-white/10 pt-7">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.18)]">
                <div className="flex items-start gap-3">
                  <div className="rounded-full border border-[#bda7ff]/20 bg-[#bda7ff]/18 p-3 text-[#bda7ff]">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#cbbdff]">Early access</p>
                    <p className="mt-3 text-sm leading-6 text-white/84">
                      Built for founders and teams tired of:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-white/72">
                      <li>not knowing what to post</li>
                      <li>juggling multiple platforms</li>
                      <li>stitching together ChatGPT + docs + calendars</li>
                    </ul>
                    <p className="mt-3 text-sm leading-6 text-white/84">If thats you, youre in the right place.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.18)]">
                <div className="flex items-start gap-3">
                  <div className="rounded-full border border-[#bda7ff]/20 bg-[#bda7ff]/18 p-3 text-[#bda7ff]">
                    <Users2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#cbbdff]">Manual onboarding</p>
                    <p className="mt-3 text-sm leading-6 text-white/84">samm will help you</p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-white/78">
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#bda7ff]" />
                        structure your content system
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#bda7ff]" />
                        set up your calendar
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#bda7ff]" />
                        get you to a point where you dont think about posting daily
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 max-w-sm text-sm font-medium leading-6 text-[#bda7ff]">
              early access is limited
            </p>
          </aside>

          <main className="bg-[#fcfbf8] px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
            <div className="mx-auto w-full max-w-2xl">
              <div className="mb-7 flex items-center justify-between gap-4">
                <Link
                  href={loginHref}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
                <p className="text-[11px] font-semibold lowercase tracking-[0.24em] text-foreground/70">samm</p>
              </div>

              <div className="rounded-[1.6rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(249,247,242,0.92))] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <Users2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-[2rem] font-semibold tracking-tight text-[#0b0b0c]">{title}</h1>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{subtitle}</p>
                  </div>
                </div>
                {homeHref ? (
                  <Link href={homeHref} className="mt-4 inline-flex text-sm font-medium text-[#0b0b0c] underline underline-offset-4 transition-opacity hover:opacity-70">
                    Homepage
                  </Link>
                ) : null}
              </div>

              <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-foreground">Full name</span>
                    <Input
                      className="h-11 rounded-xl border-black/10 bg-white shadow-[0_1px_0_rgba(255,255,255,0.35)]"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-foreground">Work email</span>
                    <Input
                      className="h-11 rounded-xl border-black/10 bg-white shadow-[0_1px_0_rgba(255,255,255,0.35)]"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-foreground">Organization / Brand</span>
                    <Input
                      className="h-11 rounded-xl border-black/10 bg-white shadow-[0_1px_0_rgba(255,255,255,0.35)]"
                      value={organizationName}
                      onChange={(event) => setOrganizationName(event.target.value)}
                      placeholder="e.g. Acme Co."
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-foreground">Your role</span>
                    <Input
                      className="h-11 rounded-xl border-black/10 bg-white shadow-[0_1px_0_rgba(255,255,255,0.35)]"
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                      placeholder="Founder, marketer, operator"
                    />
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Team size</span>
                  <Input
                    className="h-11 rounded-xl border-black/10 bg-white shadow-[0_1px_0_rgba(255,255,255,0.35)]"
                    value={teamSize}
                    onChange={(event) => setTeamSize(event.target.value)}
                    placeholder="e.g. 1, 35, 10+"
                  />
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Where do you primarily share content?</span>
                  <div className="flex flex-wrap gap-2">
                    {channelOptions.map((channel) => {
                      const active = channels.includes(channel);
                      return (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => toggleChannel(channel)}
                          className={cn(
                            "inline-flex h-9 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors",
                            active
                              ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                              : "border-black/10 bg-white text-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
                          )}
                        >
                          {channel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">What are you trying to achieve with your content?</span>
                  <Textarea
                    value={primaryUseCase}
                    onChange={(event) => setPrimaryUseCase(event.target.value)}
                    placeholder="e.g. stay consistent, grow audience, drive sales, educate"
                    className="min-h-24 resize-none rounded-xl border-black/10 bg-white shadow-[0_1px_0_rgba(255,255,255,0.35)]"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Whats the hardest part about staying consistent?</span>
                  <Textarea
                    value={biggestWorkflowPain}
                    onChange={(event) => setBiggestWorkflowPain(event.target.value)}
                    placeholder="e.g. finding ideas, planning, time, posting across platforms"
                    className="min-h-24 resize-none rounded-xl border-black/10 bg-white shadow-[0_1px_0_rgba(255,255,255,0.35)]"
                    required
                  />
                </label>

                {submitWaitlist.error ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {submitWaitlist.error instanceof Error ? submitWaitlist.error.message : "Could not join the waitlist."}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    className="h-11 rounded-xl px-6 disabled:opacity-60"
                    type="submit"
                    disabled={submitWaitlist.isPending}
                  >
                    {submitWaitlist.isPending ? "Submitting..." : "Request access"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Link href={loginHref}>
                    <Button variant="outline" className="h-11 rounded-xl border-black/10 bg-white/70 px-6 text-[#0b0b0c]">
                      I already have access
                    </Button>
                  </Link>
                </div>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  We will only use this information to review your request and onboard you.
                </p>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
