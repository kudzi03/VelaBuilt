import type { Metadata } from "next";
import { pageMetadata, absoluteUrl } from "@/lib/seo";
import { graph, webPageSchema } from "@/lib/schema";
import { RestaurantDemo } from "@/components/demo/RestaurantDemo";

const title = "Ember & Grain — Interactive restaurant concept";
const description = "An original VelaBuilt restaurant website concept. Explore an immersive interior, seasonal menu and a simulated reservation-to-follow-up journey. Fictional business; no real bookings.";
const base = pageMetadata({ title, description, path: "/demo/ember-and-grain" });
export const metadata: Metadata = {
  ...base,
  openGraph: { ...base.openGraph, images: [{ url: absoluteUrl("/demo/ember/interior.webp"), width: 1536, height: 1024, alt: "Ember & Grain fictional restaurant concept by VelaBuilt" }] },
  twitter: { ...base.twitter, images: [absoluteUrl("/demo/ember/interior.webp")] },
};

export default function RestaurantConceptPage() {
  return <>
    <RestaurantDemo />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: graph([webPageSchema({ path: "/demo/ember-and-grain", name: title, description })]) }} />
  </>;
}
