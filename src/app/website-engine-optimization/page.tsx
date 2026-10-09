import type { Metadata } from "next";
import { getService } from "@/content/services";
import { pageMetadata } from "@/lib/seo";
import { ServicePage } from "@/components/pages/ServicePage";

const service = getService("website-engine-optimization");

export const metadata: Metadata = pageMetadata({
  title: "Get found online | SEO and clear business information",
  description: service.summary,
  path: `/${service.slug}`,
});

export default function Page() {
  return <ServicePage service={service} focus="discoverability" />;
}
