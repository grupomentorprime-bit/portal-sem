"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const markSvg = "<path\n    \n     d=\"m 402.62041,36.517712 c -21.92374,10.782443 -46.65981,19.647552 -68.79422,31.807913 -20.27986,11.141493 -40.33095,20.812456 -56.74285,32.838875 -7.19877,5.27516 -14.44532,12.36303 -20.76276,18.13393 l -3.01465,3.8544 -12.36232,17.81397 -97.8614,167.15834 c 34.22537,-7.06109 58.83529,-17.77352 87.56133,-27.33842 11.21443,-4.60063 22.3033,-8.99598 32.13099,-14.88249 7.54952,-4.52195 14.41851,-11.06571 21.44039,-15.90315 10.74514,-10.9753 20.86589,-21.13668 27.31005,-32.44282 l 13.11505,-21.70474 8.55162,-17.8882 z\" />\n      <path\n    \n     d=\"m 216.69422,137.2553 c -22.1255,5.62791 -29.90921,7.32725 -49.92766,14.80216 -14.39915,5.37666 -35.365,13.2933 -46.50066,20.68588 -4.88445,3.24261 -12.55132,8.09949 -16.83777,11.64683 l -8.29548,7.86928 -8.59687,10.62242 -5.7286,10.64023 -40.96256,93.18883 c 23.2223,-4.34041 39.92041,-10.92529 59.41135,-16.80478 13.45435,-5.00041 25.47217,-11.56321 36.43875,-18.40761 7.2907,-6.74646 14.06778,-13.50876 18.44021,-20.45858 l 14.70109,-24.33757 z\" />";
const logoSvg = "<path\n     style=\"font-variation-settings:'wght' 300;fill:currentColor;stroke-width:0.982059\"\n     d=\"m 398.12041,38.517712 c -21.92374,10.782443 -46.65981,19.647552 -68.79422,31.807913 -20.27986,11.141493 -40.33095,20.812456 -56.74285,32.838875 -7.19877,5.27516 -14.44532,12.36303 -20.76276,18.13393 l -3.01465,3.8544 -12.36232,17.81397 -97.8614,167.15834 c 34.22537,-7.06109 58.83529,-17.77352 87.56133,-27.33842 11.02933,-4.52469 22.50325,-8.87676 32.18679,-14.65202 7.72614,-4.60787 15.10828,-10.23513 21.03104,-15.42651 5.32459,-5.43864 10.58267,-10.85105 15.31681,-16.30348 4.81946,-5.55071 9.09593,-11.14289 12.34679,-16.84645 l 21.66667,-39.59294 z\" />\n        <path\n     style=\"font-variation-settings:'wght' 300;fill:currentColor;stroke-width:0.634229\"\n     d=\"m 212.19422,139.2553 c -22.1255,5.62791 -29.90921,7.32725 -49.92766,14.80216 -14.39915,5.37666 -35.365,13.2933 -46.50066,20.68588 -4.88445,3.24261 -12.55132,8.09949 -16.83777,11.64683 l -8.29548,7.86928 -8.596874,10.62242 -5.728596,10.64023 -40.962559,93.18883 c 23.222299,-4.34041 39.920408,-10.92529 59.41135,-16.80478 13.454349,-5.00041 25.472169,-11.56321 36.438749,-18.40761 7.2907,-6.74646 14.06778,-13.50876 18.44021,-20.45858 l 14.70109,-24.33757 z\" />\n        <text\n       xml:space=\"preserve\"\n       style=\"font-style:normal;font-variant:normal;font-weight:700;font-stretch:normal;font-size:12px;font-family:inherit;-inkscape-font-specification:'Montserrat, @wght=700';font-variant-ligatures:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-east-asian:normal;font-variation-settings:'wght' 700;letter-spacing:1.0255px;writing-mode:lr-tb;direction:ltr;white-space:pre;display:inline;fill:currentColor\"\n       x=\"573.4375\"\n       y=\"90.625\"\n       transform=\"matrix(9.9296634,0,0,10.573885,-5266.7611,-747.56506)\"><tspan\n         x=\"573.4375\"\n         y=\"90.625\">MENT</tspan></text>\n        <text\n       xml:space=\"preserve\"\n       style=\"font-style:normal;font-variant:normal;font-weight:700;font-stretch:normal;font-size:124.182px;font-family:inherit;-inkscape-font-specification:'Montserrat, @wght=700';font-variant-ligatures:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-east-asian:normal;font-variation-settings:'wght' 700;letter-spacing:9.84908px;writing-mode:lr-tb;direction:ltr;fill:currentColor;stroke-width:0.90775\"\n       x=\"955.35529\"\n       y=\"205.79146\"\n       transform=\"scale(0.97560392,1.0250061)\"><tspan\n         x=\"955.35529\"\n         y=\"205.79146\"\n         style=\"stroke-width:0.90775\">R</tspan></text>\n        <path\n       style=\"font-variation-settings:'wght' 700;display:inline;fill:currentColor;stroke-width:1.15151\"\n       d=\"M 876.26953 118.94531 A 46.777344 47.206139 0 0 0 829.49219 166.15234 A 46.777344 47.206139 0 0 0 841.71875 197.97461 L 856.4375 181.44141 A 24.956469 25.18524 0 0 1 851.3125 166.15234 A 24.956469 25.18524 0 0 1 876.26953 140.9668 A 24.956469 25.18524 0 0 1 889.21875 144.62305 L 903.93945 128.08984 A 46.777344 47.206139 0 0 0 876.26953 118.94531 z M 911.01367 134.54297 L 896.27539 151.0957 A 24.956469 25.18524 0 0 1 896.27539 151.09766 A 24.956469 25.18524 0 0 1 901.22656 166.15234 A 24.956469 25.18524 0 0 1 876.26953 191.33594 A 24.956469 25.18524 0 0 1 863.57031 187.83203 L 848.83203 204.38477 A 46.777344 47.206139 0 0 0 876.26953 213.35742 A 46.777344 47.206139 0 0 0 923.04688 166.15234 A 46.777344 47.206139 0 0 0 911.01367 134.54297 z \" />\n        <text\n     xml:space=\"preserve\"\n     style=\"font-style:normal;font-variant:normal;font-weight:700;font-stretch:normal;font-size:12px;font-family:inherit;-inkscape-font-specification:'Montserrat, @wght=700';font-variant-ligatures:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-east-asian:normal;font-variation-settings:'wght' 700;letter-spacing:1.0255px;writing-mode:lr-tb;direction:ltr;white-space:pre;display:inline;fill:currentColor\"\n     x=\"573.4375\"\n     y=\"90.625\"\n     transform=\"matrix(9.4723351,0,0,10.573885,-4363.2409,-746.46021)\"><tspan\n       x=\"573.4375\"\n       y=\"90.625\">PRIME</tspan></text>\n        <text\n     xml:space=\"preserve\"\n     style=\"font-style:normal;font-variant:normal;font-weight:300;font-stretch:normal;font-size:61.5448px;font-family:inherit;-inkscape-font-specification:'Montserrat, @wght=300';font-variant-ligatures:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-east-asian:normal;font-variation-settings:'wght' 300;letter-spacing:33.3643px;writing-mode:lr-tb;direction:ltr;fill:currentColor;stroke-width:0.449882\"\n     x=\"711.91821\"\n     y=\"292.61429\"\n     transform=\"scale(1.0109598,0.98915902)\"><tspan\n       x=\"711.91821\"\n       y=\"292.61429\"\n       style=\"letter-spacing:33.3643px;stroke-width:0.449882\">CUMPLE</tspan></text>";

export function Mark({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 439 346"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      dangerouslySetInnerHTML={{ __html: markSvg }}
    />
  );
}

export function Logo({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      aria-label="Mentor Cumple, volver al inicio"
      className="inline-flex shrink-0 text-current"
      onClick={(event) => {
        onClick?.();
        if (pathname !== "/") return;
        event.preventDefault();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
    >
      <svg
        viewBox="0 0 1527 346"
        fill="currentColor"
        aria-hidden="true"
        className="h-12 w-auto font-cdisplay sm:h-14"
        dangerouslySetInnerHTML={{ __html: logoSvg }}
      />
    </Link>
  );
}
