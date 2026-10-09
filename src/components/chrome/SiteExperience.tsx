"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { VelaStage } from "@/vela/VelaStage";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { Hud } from "./Hud";

/** The concept has its own navigation; the studio keeps its existing chrome. */
export function SiteExperience({ children, still }: { children: ReactNode; still: ReactNode }) {
  const demo = usePathname() === "/demo/ember-and-grain";
  if (demo) return <main id="main">{children}</main>;
  return <>
    <VelaStage still={still} />
    <div className="site">
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
    <Hud />
  </>;
}
