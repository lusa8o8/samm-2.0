import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const publicBrand = {
  productName: "samm",
  domain: "getsamm.app",
  productUrl: "https://getsamm.app",
  supportEmail: "hello@getsamm.app",
  legalName: "EIGHT ZERO EIGHT DIGITAL SYSTEMS",
  legalDisplayName: "808 Digital Systems",
  registrationNumber: "320261068691",
  location: "Lusaka, Zambia",
  disclosure:
    "samm is a product owned and operated by EIGHT ZERO EIGHT DIGITAL SYSTEMS, also referred to as 808 Digital Systems.",
} as const;

export function PublicWordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <p className={inverted ? "text-[11px] font-semibold lowercase tracking-[0.24em] text-white/70" : "text-[11px] font-semibold lowercase tracking-[0.24em] text-foreground/62"}>
      {publicBrand.productName}
    </p>
  );
}

export function PublicPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(37,130,235,0.12),transparent_30%),linear-gradient(180deg,#f7f9fc_0%,#f3f6fb_100%)] text-foreground">
      {children}
    </div>
  );
}

export function PublicNav() {
  return (
    <header className="border-b border-black/6 bg-white/74 backdrop-blur-[14px]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <PublicWordmark />
          <p className="mt-1 text-sm font-medium text-muted-foreground">marketing workflow and approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" className="rounded-full px-4">
              Sign in
            </Button>
          </Link>
          <Link href="/waitlist">
            <Button className="rounded-full px-5">Request access</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-black/6 bg-[#0b0b0c] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div>
          <PublicWordmark inverted />
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
            {publicBrand.disclosure} Registered in Zambia. Registration No. {publicBrand.registrationNumber}.
          </p>
          <p className="mt-3 text-sm text-white/58">
            Contact: {publicBrand.supportEmail} - {publicBrand.location}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">Access</p>
            <div className="mt-4 flex flex-col gap-3 text-white/72">
              <Link href="/login" className="transition-opacity hover:opacity-70">
                Sign in
              </Link>
              <Link href="/waitlist" className="transition-opacity hover:opacity-70">
                Request access
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">Legal</p>
            <div className="mt-4 flex flex-col gap-3 text-white/72">
              <Link href="/privacy" className="transition-opacity hover:opacity-70">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition-opacity hover:opacity-70">
                Terms of Service
              </Link>
              <Link href="/data-deletion" className="transition-opacity hover:opacity-70">
                Data Deletion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LegalPageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <PublicPageFrame>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground underline underline-offset-4">
          <ArrowLeft className="h-4 w-4" />
          Back to homepage
        </Link>

        <div className="mt-8 rounded-[2rem] border border-black/8 bg-white px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
          <PublicWordmark />
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#0b0b0c]">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{description}</p>

          <div className="mt-8 rounded-[1.2rem] border border-primary/15 bg-primary/5 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-6 text-foreground/78">
                {publicBrand.disclosure}
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-8">{children}</div>
        </div>
      </main>
    </PublicPageFrame>
  );
}
