import { Link } from "wouter";
import { ArrowRight, CalendarDays, CheckCircle2, FileText, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFooter, PublicNav, PublicPageFrame } from "@/components/public/brand-kit";

const workflowCards = [
  {
    title: "Plan the month",
    description: "Turn launches, deadlines, campaigns, and one-time posts into a visible calendar before work goes live.",
    icon: CalendarDays,
  },
  {
    title: "Create drafts and briefs",
    description: "Generate channel-ready copy and external design briefs while keeping the user in control of approvals.",
    icon: FileText,
  },
  {
    title: "Review decisions",
    description: "Keep approvals, pending drafts, and operational status in one place instead of chasing separate tools.",
    icon: Inbox,
  },
] as const;

const integrationLabels = ["Facebook", "Instagram", "LinkedIn", "WhatsApp", "YouTube", "Email"] as const;

export default function LandingPage() {
  return (
    <PublicPageFrame>
      <PublicNav />

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Less marketing chaos</p>
            <h1 className="mt-5 max-w-3xl text-[3.2rem] font-semibold leading-[1.02] tracking-tight text-[#0b0b0c] sm:text-[4.7rem]">
              Know what to post before the month starts.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              samm helps lean teams plan campaigns, create drafts, review approvals, and keep execution moving from one calm workspace.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/waitlist">
                <Button className="h-11 rounded-full px-6">
                  Request access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="h-11 rounded-full border-black/10 bg-white/78 px-6">
                  Sign in
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-foreground/76">
              {[
                "Built for founders, operators, and small teams",
                "Human approval stays in the workflow",
                "Content planning, drafts, approvals, and status in one place",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-6 top-8 h-32 w-32 rounded-full bg-primary/18 blur-3xl" />
            <div className="absolute bottom-8 left-4 h-32 w-32 rounded-full bg-[#bda7ff]/22 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-black/8 bg-white p-4 shadow-[0_28px_100px_rgba(15,23,42,0.12)]">
              <div className="rounded-[1.5rem] border border-black/8 bg-[#f7f9fc] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Calendar Studio</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0b0b0c]">April 2026</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Plan the month. Commit it. samm keeps the workflow visible.</p>
                  </div>
                  <div className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-[0_12px_24px_rgba(37,130,235,0.22)]">
                    Plan this month
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-7 gap-2">
                  {Array.from({ length: 28 }).map((_, index) => (
                    <div
                      key={index}
                      className="min-h-20 rounded-2xl border border-black/8 bg-white p-2 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                    >
                      <p className="text-xs font-semibold text-[#0b0b0c]">{index + 1}</p>
                      {[6, 13, 21].includes(index) ? (
                        <div className="mt-5 space-y-1">
                          <div className="h-2 rounded-full bg-primary/20" />
                          <div className="h-2 w-2/3 rounded-full bg-[#bda7ff]/45" />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {workflowCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="rounded-[1.3rem] border border-black/8 bg-white p-4">
                      <div className="w-fit rounded-full bg-primary/10 p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="mt-4 font-semibold text-[#0b0b0c]">{card.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/6 bg-white/62">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Connect the channels you already use</p>
            <div className="flex flex-wrap gap-3">
              {integrationLabels.map((label) => (
                <div key={label} className="rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-medium text-foreground/78 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicPageFrame>
  );
}
