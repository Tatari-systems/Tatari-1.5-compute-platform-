import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default function QuotesIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <PageHeader
        kicker="Internal"
        title="Quote review"
        description="Open a quote from a requirement confirmation."
      />
    </div>
  );
}
