import { Link } from "wouter";
import { LegalPageLayout, publicBrand } from "@/components/public/brand-kit";

const sections = [
  {
    title: "Information we collect",
    body:
      "We collect the information needed to create and operate a samm workspace, including account details, workspace configuration, connected channel details, calendar items, content drafts, approvals, and operational status.",
  },
  {
    title: "Meta Platform Data",
    body:
      "If you connect Facebook, Instagram, WhatsApp, or another Meta product, we may collect only the platform data needed to provide the connected feature. This can include account or Page identifiers, selected Page details, access tokens, post metadata, content status, and performance metrics or insights that you authorize.",
  },
  {
    title: "How we use information",
    body:
      "We use information to provide the product, coordinate approvals, generate and store drafts, prepare external design briefs, display metrics, improve reliability, and support workspace operations. We do not sell workspace data or Meta Platform Data.",
  },
  {
    title: "Human approval",
    body:
      "samm is designed as a human-approved workflow. AI-generated content, design briefs, and recommendations are prepared for review. We do not publish content or take platform actions on your behalf unless an authorized user approves the action.",
  },
  {
    title: "Data sharing",
    body:
      "We share data only with service providers required to operate the product, such as hosting, authentication, database, analytics, and communication providers. We do not share your data with third-party marketing agencies or unrelated developers without your consent.",
  },
  {
    title: "Data retention",
    body:
      "We retain workspace data while your account or workspace is active, unless a shorter period is required by law, platform policy, or a deletion request. Some records may be retained where needed for security, audit, compliance, or legal obligations.",
  },
  {
    title: "Data deletion",
    body:
      "You can request deletion by contacting hello@getsamm.app with the subject Data Deletion Request. If you connected a Meta account, you can also remove samm from your Meta Apps and Websites settings. We will process deletion requests as soon as reasonably practical and within 30 days unless we are required to retain specific records.",
  },
  {
    title: "Contact",
    body:
      `Privacy questions and deletion requests can be sent to ${publicBrand.supportEmail}.`,
  },
] as const;

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="This is how samm handles account, workspace, content, approval, and connected platform information."
    >
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-xl font-semibold text-[#0b0b0c]">{section.title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
        </section>
      ))}

      <div className="flex flex-wrap gap-4 border-t border-black/8 pt-6 text-sm">
        <Link href="/terms" className="font-medium text-[#0b0b0c] underline underline-offset-4">
          Terms of Service
        </Link>
        <Link href="/data-deletion" className="font-medium text-[#0b0b0c] underline underline-offset-4">
          Data Deletion
        </Link>
      </div>
    </LegalPageLayout>
  );
}
