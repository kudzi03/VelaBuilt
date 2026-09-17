# Pointing velabuilt.com at this Vercel project

The site is deployed on Vercel as project **`vela-built`** (team
`pagiwakudzayi-8828s-projects`) and serves at `https://vela-built.vercel.app`.
`velabuilt.com` is registered at Porkbun, but its web records don't point at
Vercel yet. This document takes it from parked to canonical without breaking
email.

The order matters. Canonical tags must never name a host that does not serve
the site. That is how the site became unindexable in the first place.

---

## 0. Current state (measured 2026-09-14)

Nameservers are Porkbun's (`curitiba`, `fortaleza`, `maceio`, `salvador`
`.ns.porkbun.com`), so every record below is edited in the Porkbun dashboard.

| Host | Type | Value | Status |
| --- | --- | --- | --- |
| `velabuilt.com` | A | `207.207.210.23` | **Replace.** Porkbun forwarding, not Vercel |
| `velabuilt.com` | A | `207.207.210.36` | **Replace.** Porkbun forwarding, not Vercel |
| `velabuilt.com` | A | `207.207.210.50` | **Replace.** Porkbun forwarding, not Vercel |
| `www.velabuilt.com` | CNAME | `uixie.porkbun.com` | **Replace.** Porkbun URL forwarding |
| `velabuilt.com` | MX | `1 smtp.google.com` | **Keep.** Google Workspace mail |
| `velabuilt.com` | TXT | `v=spf1 include:_spf.google.com ~all` | **Keep.** SPF |
| `velabuilt.com` | TXT | `google-site-verification=…` | **Keep** |
| `_dmarc.velabuilt.com` | TXT | `v=DMARC1; p=none; …` | **Keep** |
| `google._domainkey.velabuilt.com` | TXT | `v=DKIM1; …` | **Keep.** Mail signing |

No AAAA and no CAA records exist, so nothing will block Vercel's certificate.

Today `http://velabuilt.com/`, `https://velabuilt.com/` and
`https://www.velabuilt.com/` all return `302` → `https://velabuilt-com.l.ink/`
(served by `openresty`, Porkbun's forwarding service).

> **Do not touch the MX or TXT records.** `jace@velabuilt.com` receives mail
> through Google Workspace. Deleting them stops enquiry email arriving.

---

## 1. Add the domains in Vercel

1. Vercel dashboard → project **vela-built** → **Settings** → **Domains**.
2. **Add** `velabuilt.com`. Choose the option that redirects `www.velabuilt.com`
   to `velabuilt.com`. Vercel adds both and marks `www` as a 308 redirect to
   the apex.
3. Both show **Invalid Configuration** until DNS changes. Leave the page open,
   because it shows the exact record values Vercel wants for this project.

> **Do not deploy between this step and step 4.** Once a custom domain is
> attached, the build refuses to run without `NEXT_PUBLIC_SITE_URL`. This is
> deliberate, see `src/lib/site-origin.ts`. A failed build leaves the current
> deployment live, so nothing breaks, but the deploy won't go out.

## 2. Remove Porkbun's forwarding

The 302 comes from Porkbun's forwarding service, not from the A records
alone. If only the records change, Porkbun can re-create them.

1. Porkbun → **Domain Management** → `velabuilt.com`.
2. **URL Forwarding**: delete every forward for `velabuilt.com` and
   `www.velabuilt.com`.
3. If the domain is connected to a Porkbun **Link in Bio** (`l.ink`) page,
   disconnect it.
4. **DNS Records**: delete the three `A` records (`207.207.210.23`, `.36`,
   `.50`) and the `www` `CNAME` to `uixie.porkbun.com`.

## 3. Add Vercel's records at Porkbun

Porkbun → `velabuilt.com` → **DNS Records** → add:

| Type | Host | Answer | TTL |
| --- | --- | --- | --- |
| `A` | *(blank, the apex)* | `76.76.21.21` | 600 |
| `CNAME` | `www` | `cname.vercel-dns-0.com` | 600 |

**If the Vercel Domains page from step 1 shows different values, use those.**
Vercel sometimes gives a project its own IP or CNAME target, such as
`xxxx.vercel-dns-0NN.com`. The values above are Vercel's published defaults.
The dashboard is authoritative.

Add exactly one apex A record. Don't keep any `207.207.210.x` record
alongside it, because mixed answers send some visitors to the parking page.

## 4. Verify DNS and TLS, then set the canonical origin

Wait for propagation. The old records had TTLs of 40–600s, so this usually
takes minutes. Then check:

```bash
nslookup velabuilt.com 1.1.1.1
```

Expect only Vercel's A record, with no `207.207.210.x` address.

```bash
nslookup www.velabuilt.com 1.1.1.1
```

Expect the Vercel CNAME target, not `uixie.porkbun.com`.

```bash
nslookup -type=MX velabuilt.com 1.1.1.1
```

Expect `smtp.google.com` still present.

```bash
curl -sSI https://velabuilt.com/
```

Expect `HTTP/2 200`, a `server: Vercel` header, and no `location:` to `l.ink`.

```bash
curl -sSI https://www.velabuilt.com/
```

Expect a `308` whose `location:` is `https://velabuilt.com/`.

In Vercel → Domains, both entries should now show **Valid Configuration**, and
the certificate should be issued. **Only when all of that is true:**

1. Vercel → **Settings** → **Environment Variables** → add
   `NEXT_PUBLIC_SITE_URL` = `https://velabuilt.com` for **Production** (and
   Preview, if preview builds should share the canonical).
2. **Redeploy** production. `NEXT_PUBLIC_*` values are inlined at build time,
   so the variable has no effect on an existing deployment.

Then confirm the site now names itself correctly:

```bash
curl -sS https://velabuilt.com/robots.txt
```

Expect `Host: https://velabuilt.com` and `Sitemap: https://velabuilt.com/sitemap.xml`.

```bash
curl -sS https://velabuilt.com/sitemap.xml
```

Every `<loc>` should start with `https://velabuilt.com/`.

```bash
curl -sS https://velabuilt.com/ | grep -oE '<link rel="canonical"[^>]*>|<meta property="og:url"[^>]*>'
```

Both should name `https://velabuilt.com`.

## 5. Redirect the old Vercel host (optional, recommended)

Once step 4 passes, stop `vela-built.vercel.app` competing with the real
domain for indexing:

1. Vercel → Environment Variables → add `CANONICAL_HOST_REDIRECT` = `1` for
   **Production**.
2. Redeploy.

```bash
curl -sSI https://vela-built.vercel.app/work
```

Expect `HTTP/2 301` with `location: https://velabuilt.com/work`.

```bash
curl -sSI https://velabuilt.com/work
```

Expect `HTTP/2 200` with no redirect loop.

The redirect lives in `next.config.ts`. It won't turn on unless
`NEXT_PUBLIC_SITE_URL` is set explicitly, it never redirects a host to itself,
and it leaves `/api/*` alone: a 301 turns a POST into a GET, which would drop
an enquiry sent from a tab still open on the old host. To redirect other hosts
too, set `CANONICAL_REDIRECT_FROM` to a comma-separated host list. That
replaces the default `vela-built.vercel.app`.

## 6. Tell search engines

1. Google Search Console: the domain already carries a
   `google-site-verification` TXT record. Add or open the `velabuilt.com`
   **Domain** property and submit `https://velabuilt.com/sitemap.xml`.
2. Use **URL Inspection** on `https://velabuilt.com/` and request indexing.
3. Bing Webmaster Tools: import from Search Console, or submit the sitemap
   directly.

---

## How the canonical host is chosen

There is one resolver: `src/lib/site-origin.ts`. `next.config.ts` calls it
once per build and inlines the result into every bundle, so server and client
code see the same host. metadataBase, canonical links, og:url, robots.txt,
sitemap.xml and every JSON-LD `@id` / `url` come from it.

| Situation | Canonical origin |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` set | That value (origin only; a path or trailing slash is stripped) |
| On Vercel, unset, no custom domain | `https://vela-built.vercel.app` |
| On Vercel, unset, custom domain attached | **Build fails** with instructions. It won't guess |
| Local build, unset | `http://localhost:3000` |
| `NEXT_PUBLIC_SITE_URL` malformed | **Build fails** with the bad value in the message |

## Rollback

If `velabuilt.com` misbehaves after cutover:

1. Delete `CANONICAL_HOST_REDIRECT` in Vercel.
2. Set `NEXT_PUBLIC_SITE_URL` = `https://vela-built.vercel.app`.
3. Redeploy. The site canonicalises back to the Vercel host.

Leave `velabuilt.com` attached to the project while DNS points at Vercel.
Detaching it while the records still point at Vercel leaves a dangling
record that another Vercel account could try to claim. If you do detach it,
restore the Porkbun records first.
