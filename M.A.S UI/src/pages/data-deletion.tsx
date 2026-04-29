import { Link } from "wouter";
import { LegalPageLayout, publicBrand } from "@/components/public/brand-kit";

export default function DataDeletion() {
  return (
    <LegalPageLayout
      title="Data Deletion"
      description="Use this page to request deletion of samm workspace data or connected platform data."
    >
      <section>
        <h2 className="text-xl font-semibold text-[#0b0b0c]">Request deletion by email</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Send an email to {publicBrand.supportEmail} with the subject Data Deletion Request. Include the email address
          used for your samm workspace and the organization or brand name connected to the workspace.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-[#0b0b0c]">Remove Meta access</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
          <li>Go to your Facebook settings.</li>
          <li>Open Apps and Websites.</li>
          <li>Find samm and remove access.</li>
          <li>Email {publicBrand.supportEmail} if you also want stored workspace records deleted from samm.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-[#0b0b0c]">Deletion timeline</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          We process deletion requests as soon as reasonably practical and within 30 days unless we are required to keep
          specific records for security, audit, compliance, or legal reasons.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-[#0b0b0c]">What deletion covers</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Deletion can include account details, workspace configuration, connected channel records, content drafts,
          approvals, stored platform metadata, and related operational records controlled by samm.
        </p>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-black/8 pt-6 text-sm">
        <Link href="/privacy" className="font-medium text-[#0b0b0c] underline underline-offset-4">
          Privacy Policy
        </Link>
        <Link href="/terms" className="font-medium text-[#0b0b0c] underline underline-offset-4">
          Terms of Service
        </Link>
      </div>
    </LegalPageLayout>
  );
}
