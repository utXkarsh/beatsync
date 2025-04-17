import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const suisseIntl = localFont({
  display: "swap",
  variable: "--font-suisse-intl",
  // Kinda dumb but this src is relative to the directory where the font loader function is called.
  // https://nextjs.org/docs/pages/api-reference/components/font#src
  src: [
    {
      path: "../fonts/SuisseIntl/SuisseIntl-Ultralight.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-Thin.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-Book.otf",
      weight: "300", // Lol
      style: "normal",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-Black.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-UltralightItalic.otf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-ThinItalic.otf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-RegularItalic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-SemiBoldItalic.otf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../fonts/SuisseIntl/SuisseIntl-BlackItalic.otf",
      weight: "800",
      style: "italic",
    },
  ],
});

// Optimize font loading by defining fonts outside the component
const circularStd = localFont({
  src: [
    {
      path: "../fonts/CircularStd/CircularStd-Book.woff2",
      weight: "400",
    },
  ],
  variable: "--font-circular-std",
  preload: true,
});

const sofiaPro = localFont({
  src: [
    {
      path: "../fonts/SofiaPro/Sofia Pro UltraLight Az.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../fonts/SofiaPro/Sofia Pro Light Az.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/SofiaPro/Sofia Pro Regular Az.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/SofiaPro/Sofia Pro Medium Az.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/SofiaPro/Sofia Pro Semi Bold Az.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/SofiaPro/Sofia Pro Bold Az.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/SofiaPro/Sofia Pro Black Az.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-sofia-pro",
  preload: true,
});

const proximaNova = localFont({
  src: [
    {
      path: "../fonts/ProximaNova/Mark Simonson - Proxima Nova Black.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../fonts/ProximaNova/Mark Simonson - Proxima Nova Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/ProximaNova/Mark Simonson - Proxima Nova Extrabold.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../fonts/ProximaNova/Mark Simonson - Proxima Nova Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/ProximaNova/Mark Simonson - Proxima Nova Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/ProximaNova/Mark Simonson - Proxima Nova Semibold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/ProximaNova/Mark Simonson - Proxima Nova Thin.otf",
      weight: "100",
      style: "normal",
    },
  ],
  variable: "--font-proxima-nova",
  preload: true,
});

export const metadata: Metadata = {
  title: "Beatsync",
  description:
    "Synchronize music playback across multiple devices in real-time",
  keywords: ["music", "sync", "audio", "collaboration", "real-time"],
  authors: [{ name: "BeatSync Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          circularStd.variable,
          suisseIntl.variable,
          sofiaPro.variable,
          proximaNova.variable,
          inter.variable,
          "antialiased font-sans dark"
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
