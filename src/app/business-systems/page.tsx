import type { Metadata } from "next";
import { getService } from "@/content/services";
import { pageMetadata } from "@/lib/seo";
import { ServicePage } from "@/components/pages/ServicePage";

const service = getService("business-systems");

export const metadata: Metadata = pageMetadata({
  title: "Business tools to track customers and work",
  description: service.summary,
  path: `/${service.slug}`,
});

export default function Page() {
  return <ServicePage service={service} focus="systems" />;
}
