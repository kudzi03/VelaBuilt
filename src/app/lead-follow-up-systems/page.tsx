import type { Metadata } from "next";
import { getService } from "@/content/services";
import { pageMetadata } from "@/lib/seo";
import { ServicePage } from "@/components/pages/ServicePage";

const service = getService("lead-follow-up-systems");

export const metadata: Metadata = pageMetadata({
  title: "Follow up with customers and reduce missed enquiries",
  description: service.summary,
  path: `/${service.slug}`,
});

export default function Page() {
  return <ServicePage service={service} focus="follow-up" />;
}
