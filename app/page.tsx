import type { Metadata } from "next";
import { LeadSourcesPageClient } from "./lead-sources-client";

export const metadata: Metadata = {
  title: "Lead Sources — GrowEasy",
  description:
    "Import leads from any CSV using AI-powered semantic mapping. Facebook, Google Ads, real estate CRMs, and more.",
};

export default function Page() {
  return <LeadSourcesPageClient />;
}