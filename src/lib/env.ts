/**
 * ENVIRONMENT VALIDATION — server only.
 *
 * Nothing in this module may be imported from a client component. Every value
 * here is a secret or a server-side switch; the only variable exposed to the
 * browser is NEXT_PUBLIC_SITE_URL, which is public by definition.
 *
 * The site runs correctly with none of these set: the enquiry endpoint falls
 * back to the logging adapter. Adding a credential activates its integration
 * and nothing else.
 */

import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  /** Selects the outbound integration. See src/lib/enquiry/adapter.ts. */
  ENQUIRY_ADAPTER: z.enum(["log", "webhook"]).default("log"),

  /**
   * Server-to-server endpoint for inbound enquiries. This is the *only*
   * outbound target the marketing site is permitted to know about, and it is
   * intentionally separate from any existing production workflow.
   */
  ENQUIRY_WEBHOOK_URL: z.url().optional(),
  ENQUIRY_WEBHOOK_SECRET: z.string().min(24).optional(),

  /** Optional: destination inbox for enquiry notifications. */
  ENQUIRY_NOTIFY_EMAIL: z.email().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    // Fail loudly at the boundary, never silently half-configured.
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment — ${issues}`);
  }

  const env = parsed.data;

  if (env.ENQUIRY_ADAPTER === "webhook" && !env.ENQUIRY_WEBHOOK_URL) {
    throw new Error(
      "ENQUIRY_ADAPTER=webhook requires ENQUIRY_WEBHOOK_URL to be set.",
    );
  }

  cached = env;
  return env;
}
