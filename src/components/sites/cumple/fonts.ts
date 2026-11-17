import localFont from "next/font/local";

export const montserrat = localFont({
  src: [
    {
      path: "./fonts/montserrat-latin-300.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/montserrat-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

export const caveat = localFont({
  src: [
    {
      path: "./fonts/caveat-latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/caveat-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-caveat",
  display: "swap",
});
