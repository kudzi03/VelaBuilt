import { site, disclosures } from "@/content/site";
import { services } from "@/content/services";
import { faqsFor } from "@/content/faq";
import { workItems } from "@/content/work";

/**
 * /llms.txt — a plain-text summary for machine readers, generated from the
 * same content the pages render, so it cannot say anything the site does not.
 */
export const dynamic = "force-static";

export function GET() {
  const lines: string[] = [
    `# ${site.name}`,
    "",
    `> ${site.shortDescription}`,
    "",
    site.longDescription,
    "",
    "Every statement here is also stated in semantic HTML and structured data on the pages linked below.",
    "",
    "## What VelaBuilt builds",
    "",
    ...services.map(
      (s) =>
        `- [${s.name}](${site.url}/${s.slug}): ${s.summary} Includes: ${s.items.map((i) => i.name).join(", ")}.`,
    ),
    "",
    "## Work",
    "",
    ...workItems
      .filter((w) => w.category === "client-work")
      .map((w) => `- [${w.title}](${site.url}${w.href ?? "/work"}) (${w.context}): ${w.response}`),
    "- Only work listed here as client work is delivered client work. System demos run on sample data.",
    "",
    "## Plain answers",
    "",
    ...faqsFor("home").flatMap((f) => [`### ${f.question}`, f.answer, ""]),
    "## What VelaBuilt does not claim",
    "",
    ...disclosures.map((d) => `- ${d}`),
    "",
    "## Contact",
    "",
    `- Email: ${site.email}`,
    `- Enquiry: ${site.url}/start`,
    `- Voice guide: Vela, on ${site.url} (AI, runs on ElevenLabs)`,
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
