import { Link } from "wouter";
import { LegalPageLayout, publicBrand } from "@/components/public/brand-kit";

const sections = [
  {
    title: "Using samm",
    body:
      "samm is provided as a marketing workspace for planning campaigns, reviewing approvals, coordinating content, creating drafts, preparing external design briefs, and managing workflow activity.",
  },
  {
    title: "Accounts and workspace access",
    body:
      "Access is currently onboarding-only. You are responsible for maintaining the security of your account and for controlling who can access your workspace.",
  },
  {
    title: "Content responsibility",
    body:
      "You retain responsibility for the content, approvals, and publishing decisions made in your workspace. AI-generated drafts and recommendations are for review and support only.",
  },
  {
    title: "Connected platforms",
    body:
      "Connected third-party platforms remain subject to their own terms, policies, permissions, and compliance requirements. You may only connect accounts, Pages, profiles, or channels that you are authorized to manage.",
  },
  {
    title: "Prohibited use",
    body:
      "You may not use samm for spam, deceptive behavior, unauthorized scraping, harassment, impersonation, or the exchange, purchase, or manipulation of likes, shares, followers, messages, comments, or other platform engagement.",
  },
  {
    title: "Human approval",
    body:
      "samm is designed to keep humans in the loop. You are responsible for reviewing and approving content before it is published or used on any connected channel.",
  },
  {
    title: "Contact",
    body:
      `Questions about these terms can be sent to ${publicBrand.supportEmail}.`,
  },
] as const;

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="These are the general rules for using samm as a marketing workflow product."
    >
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-xl font-semibold text-[#0b0b0c]">{section.title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
        </section>
      ))}

      <div className="flex flex-wrap gap-4 border-t border-black/8 pt-6 text-sm">
        <Link href="/privacy" className="font-medium text-[#0b0b0c] underline underline-offset-4">
          Privacy Policy
        </Link>
        <Link href="/data-deletion" className="font-medium text-[#0b0b0c] underline underline-offset-4">
          Data Deletion
        </Link>
      </div>
    </LegalPageLayout>
  );
}
