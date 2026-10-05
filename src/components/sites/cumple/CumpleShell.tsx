import type { ReactNode } from "react";
import { Montserrat, Caveat } from "next/font/google";
import { AsesorChat } from "@/components/sites/cumple/asesor-chat";
import { CumpleFooter } from "@/components/sites/cumple/CumpleFooter";
import { SiteHeader } from "@/components/sites/cumple/site-header";
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

export function CumpleShell({ contact, children }: Pick<CodedPageViewProps, "contact"> & { children: ReactNode }) {
  return (
    <div
      className={`cumple-site min-h-screen ${montserrat.variable} ${caveat.variable}`}
      data-theme="light"
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <SiteHeader />
      {children}
      <CumpleFooter contact={contact} />
      <AsesorChat />
    </div>
  );
}
