import type { ReactNode } from "react";
import { headers } from "next/headers";
import { Montserrat, Caveat } from "next/font/google";
import { EscritorioReturn } from "@/components/desktop/EscritorioReturn";
import { AsesorChat } from "@/components/sites/cumple/asesor-chat";
import { CumpleFooter } from "@/components/sites/cumple/CumpleFooter";
import { SiteHeader } from "@/components/sites/cumple/site-header";
import { escritorioReturnHref } from "@/lib/connect/policy";
import { deskOriginFromEnv } from "@/lib/connect/desk";
import { publicOriginFromHost } from "@/core/tenant/hosts";
import type { CodedPageViewProps } from "@/sites/page-views";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "700"],
  variable: "--font-montserrat",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
});

/** Por defecto siempre día; noche solo si el visitante la eligió antes. */
const themeScript = `(function(){try{var t=localStorage.getItem("cumple-theme");var root=document.currentScript&&document.currentScript.parentElement;if(root)root.setAttribute("data-theme",t==="dark"?"dark":"light")}catch(e){}})();`;

export async function CumpleShell({ contact, children }: Pick<CodedPageViewProps, "contact"> & { children: ReactNode }) {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const deskOrigin = deskOriginFromEnv();
  const href = escritorioReturnHref(publicOriginFromHost(host) ?? "", deskOrigin);
  return (
    <div
      className={`cumple-site min-h-screen ${montserrat.variable} ${caveat.variable}`}
      data-theme="light"
      suppressHydrationWarning
    >
      <EscritorioReturn href={href} deskOrigin={deskOrigin} />
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <SiteHeader />
      {children}
      <CumpleFooter contact={contact} />
      <AsesorChat />
    </div>
  );
}
