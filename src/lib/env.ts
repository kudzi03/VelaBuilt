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

/**
 * Hosting dashboards commonly store a cleared variable as an empty string.
 * Treat that as unset, or an emptied field fails validation as "invalid".
 */
const unsetIfEmpty = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  /** Set by Vercel. Used only to refuse a non-delivering adapter in production. */
  VERCEL_ENV: unsetIfEmpty(z.enum(["production", "preview", "development"])),

  /**
   * Selects the outbound integration. See src/lib/enquiry/adapter.ts.
   * Unset: "email" when SMTP_HOST is configured, otherwise "log".
   */
  ENQUIRY_ADAPTER: unsetIfEmpty(z.enum(["log", "webhook", "email"])),

  /**
   * Server-to-server endpoint for inbound enquiries. This is the *only*
   * outbound target the marketing site is permitted to know about, and it is
   * intentionally separate from any existing production workflow.
   */
  ENQUIRY_WEBHOOK_URL: unsetIfEmpty(z.url()),
  ENQUIRY_WEBHOOK_SECRET: unsetIfEmpty(z.string().min(24)),

  /** Destination inbox for enquiries. Defaults to the site's public address. */
  ENQUIRY_NOTIFY_EMAIL: unsetIfEmpty(z.email()),

  /**
   * SMTP submission for the email adapter — the studio's own mailbox provider
   * (Google Workspace: smtp.gmail.com, 465, the mailbox address, an app
   * password). No form service sits in between.
   */
  /**
   * Durable capture. Injected automatically by Vercel when a Blob store is
   * connected to the project; never set by hand, never sent to the client.
   */
  BLOB_READ_WRITE_TOKEN: unsetIfEmpty(z.string().min(1)),

  SMTP_HOST: unsetIfEmpty(z.string().min(1)),
  SMTP_PORT: unsetIfEmpty(z.coerce.number().int().min(1).max(65535)),
  SMTP_USER: unsetIfEmpty(z.string().min(1)),
  SMTP_PASS: unsetIfEmpty(z.string().min(1)),
  /** Envelope sender. Defaults to SMTP_USER, which most providers require. */
  ENQUIRY_FROM_EMAIL: unsetIfEmpty(z.email()),
});

type ParsedEnv = z.infer<typeof serverEnvSchema>;

export type EnquiryAdapterName = "log" | "webhook" | "email";

export type ServerEnv = Omit<ParsedEnv, "ENQUIRY_ADAPTER"> & {
  readonly ENQUIRY_ADAPTER: EnquiryAdapterName;
};

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

  const env: ServerEnv = {
    ...parsed.data,
    ENQUIRY_ADAPTER:
      parsed.data.ENQUIRY_ADAPTER ?? (parsed.data.SMTP_HOST ? "email" : "log"),
  };

  if (env.ENQUIRY_ADAPTER === "webhook" && !env.ENQUIRY_WEBHOOK_URL) {
    throw new Error(
      "ENQUIRY_ADAPTER=webhook requires ENQUIRY_WEBHOOK_URL to be set.",
    );
  }

  // Deliberately NOT validated here any more.
  //
  // Throwing for a half-configured mail adapter meant serverEnv() threw, and
  // serverEnv() is read by the durable store as well — so one missing SMTP
  // variable disabled capture too, and an inquiry that could have been
  // written to the store was lost instead. Observed in production: a missing
  // SMTP_PASS produced "store unavailable" and "notification failed" from the
  // same root cause.
  //
  // The email adapter validates its own credentials at delivery time and
  // throws there, which the route turns into a logged notification failure
  // against an inquiry that is already safely stored.

  cached = env;
  return env;
}
