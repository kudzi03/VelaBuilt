import type { Metadata } from "next";
import { getService } from "@/content/services";
import { pageMetadata } from "@/lib/seo";
import { ServicePage } from "@/components/pages/ServicePage";

const service = getService("website-engine-optimization");

export const metadata: Metadata = pageMetadata({
  title: "Discoverability: technical SEO and structured data",
  description: service.summary,
  path: `/${service.slug}`,
});

export default function Page() {
  return <ServicePage service={service} focus="discoverability" />;
}
