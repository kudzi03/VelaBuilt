"use client";

import Script from "next/script";
import { useEffect } from "react";
import { GA_MEASUREMENT_ID, analyticsEnabled, track } from "@/lib/analytics";

const BOOKING_HOSTS = /(^|\.)(calendly\.com|cal\.com|savvycal\.com|tidycal\.com)$|calendar\.app\.google|calendar\.google\.com\/calendar\/appointments/;

/**
 * Loads GA4 (storage off — see src/lib/analytics.ts) and reports the clicks
 * that matter for leads through one delegated listener, so individual
 * components do not each need wiring.
 */
export function Analytics() {
  useEffect(() => {
    if (!analyticsEnabled) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest) return;

      // Demo / System Lab interactions — anything inside a marked demo region.
      const demo = target.closest<HTMLElement>("[data-demo]");
      if (demo && target.closest("button, a, [role=button], [role=tab]")) {
        track("demo_interaction", { demo: demo.dataset.demo || window.location.pathname });
      }

      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      const location = link.closest("[data-chapter]")?.getAttribute("data-chapter") ?? link.closest("header, footer")?.tagName.toLowerCase() ?? "page";
      const label = (link.textContent ?? "").trim().slice(0, 60);

      if (href.startsWith("mailto:")) return track("email_click", { link_location: location });
      if (href.startsWith("tel:")) return track("phone_click", { link_location: location });
      if (/wa\.me|whatsapp\.com/.test(href)) return track("whatsapp_click", { link_location: location });

      let url: URL | null = null;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (BOOKING_HOSTS.test(url.hostname + url.pathname)) return track("book_call_click", { link_location: location });
      if (url.origin === window.location.origin && url.pathname === "/start") {
        return track("start_project_click", {
          link_location: location,
          link_text: label,
          enquiry_focus: url.searchParams.get("focus") ?? undefined,
        });
      }
    };

    const onTalk = () => track("vela_talk_click", { page_path: window.location.pathname });

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("vela:talk", onTalk);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("vela:talk", onTalk);
    };
  }, []);

  if (!analyticsEnabled) return null;

  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});
var a=new Uint32Array(1);crypto.getRandomValues(a);var cid=a[0]+'.'+Math.floor(Date.now()/1000);
gtag('js',new Date());
gtag('config','${GA_MEASUREMENT_ID}',{client_storage:'none',client_id:cid,allow_google_signals:false,allow_ad_personalization_signals:false});`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
    </>
  );
}
