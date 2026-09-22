import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeSync } from "@/components/ui/theme-sync";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bontraco — AI contract intelligence",
    template: "%s · Bontraco",
  },
  description:
    "Bontraco reads every contract you sign, scores it against your own playbook, and tells you what to change before you sign it.",
};

/* Applies the stored theme before first paint so there is no flash of the
 * wrong one. ThemeSync re-applies it after hydration — see that component. */
const bootScript = `(function(){try{var t=localStorage.getItem('bontraco-theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${serif.variable} ${mono.variable}`}>
        <Script
          id="bontraco-theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: bootScript }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100
            focus:rounded-md focus:bg-[var(--accent)] focus:px-4 focus:py-2
            focus:text-sm focus:font-medium focus:text-[var(--accent-fg)]"
        >
          Skip to content
        </a>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
