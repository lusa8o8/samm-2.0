import { Link } from "wouter";
import { ArrowRight, CalendarDays, CheckCircle2, FileText, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFooter, PublicNav, PublicPageFrame } from "@/components/public/brand-kit";

const problemCards = [
  ["You post when there is time", "Ideas stay scattered until the day you need them."],
  ["Your product is under-explained", "People see content but still do not understand what you sell or how it helps."],
  ["Drafts and assets get separated", "Captions, images, notes, approvals, and status updates live in different places."],
  ["You do not know what is ready", "Some posts need assets, some need edits, and some can go live, but it is hard to see quickly."],
] as const;

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

const contentMix = [
  ["Value", "Teach something useful."],
  ["Product", "Explain what you sell and how it works."],
  ["Trust", "Prove it works or make the brand feel credible."],
  ["Offer", "Ask people to take action at the right time."],
  ["Repost", "Reuse content that already worked."],
] as const;

export default function LandingPage() {
  return (
    <PublicPageFrame>
      <PublicNav
        primaryHref="/start"
        primaryLabel="Start founding access"
        secondaryHref="/waitlist"
        secondaryLabel="Request demo"
        tertiaryHref="/login"
        tertiaryLabel="Sign in"
      />

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Founding access</p>
            <h1 className="mt-5 max-w-3xl text-[3.05rem] font-semibold leading-[1.02] tracking-tight text-[#0b0b0c] sm:text-[4.35rem]">
              Stop starting every content week from scratch.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              samm turns goals, offers, customer questions, and product notes into a clear monthly content plan with drafts, assets, approvals, and next steps.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/start">
                <Button className="h-11 rounded-full px-6">
                  Start founding access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/waitlist">
                <Button variant="outline" className="h-11 rounded-full border-black/10 bg-white/78 px-6">
                  Request demo
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-foreground/76">
              {[
                "Built for founders, operators, and small teams",
                "Manual publishing is supported while direct integrations mature",
                "Content planning, drafts, approvals, and status in one place",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-black/8 bg-white p-4 shadow-[0_28px_100px_rgba(15,23,42,0.12)]">
            <div className="rounded-[1.5rem] border border-black/8 bg-[#f7f9fc] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Calendar Studio</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0b0b0c]">May 2026</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Plan the month. Commit it. samm keeps the workflow visible.</p>
                </div>
                <div className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-[0_12px_24px_rgba(37,130,235,0.22)]">
                  Plan this month
                </div>
              </div>

              <div className="mt-6 grid grid-cols-7 gap-2">
                {Array.from({ length: 28 }).map((_, index) => (
                  <div key={index} className="min-h-20 rounded-2xl border border-black/8 bg-white p-2 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                    <p className="text-xs font-semibold text-[#0b0b0c]">{index + 1}</p>
                    {[4, 5, 13, 21].includes(index) ? (
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
        </section>

        <section className="border-t border-black/6 bg-white/70">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">The problem</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#0b0b0c]">Content gets messy when one person owns everything.</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Planning, writing, approvals, assets, comments, offers, and publishing decisions all compete for attention without a clear operating layer.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {problemCards.map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-black/8 bg-white px-5 py-4 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black/6">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Content mix</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-[#0b0b0c]">A good month should educate, explain, build trust, and sell at the right time.</h2>
            <div className="mt-8 grid gap-3 md:grid-cols-5">
              {contentMix.map(([label, desc]) => (
                <div key={label} className="rounded-2xl border border-black/8 bg-white px-4 py-4 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-black/6 bg-[#0b0b0c] text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">Founding access</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#f5f3ef]">$29.99/month</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/68">
                For solo operators and small teams who want a calmer way to plan content, create drafts, and stay consistent. Price locked for 12 months for founding workspaces.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {["Guided setup", "Monthly content planning", "Draft generation", "Calendar view", "Content registry", "Image upload previews", "Manual publishing workflow", "Approval review flow"].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-white/78">
                    <CheckCircle2 className="h-4 w-4 text-[#bda7ff]" />
                    {feature}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/start">
                  <Button className="h-11 rounded-xl px-6">Start founding access</Button>
                </Link>
                <Link href="/waitlist">
                  <Button variant="outline" className="h-11 rounded-xl border-white/15 bg-white/5 px-6 text-white hover:bg-white/10">
                    Request demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </PublicPageFrame>
  );
}
