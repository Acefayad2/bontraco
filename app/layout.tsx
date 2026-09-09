import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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

/* Runs in <head> before first paint. Two jobs:
 *
 *  1. Apply the stored theme so there is no flash of the wrong one.
 *  2. Remove the comment and meta tags the host injects at the top of <head>.
 *     React hydrates the whole document, so nodes it did not render break
 *     reconciliation (error #418) and the app re-renders client-side instead
 *     of hydrating the prerendered HTML. Stripping them before hydration keeps
 *     the DOM matching what the server produced. A no-op if nothing injected. */
const bootScript = `(function(){
try{var t=localStorage.getItem('bontraco-theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}
try{var h=document.head,n=h.firstChild,dead=[];while(n){if(n.nodeType===8&&n.nodeValue.indexOf('Netlify')>-1){dead.push(n);}n=n.nextSibling;}
h.querySelectorAll('meta[name="hosting-provider"],meta[name="netlify-deploy"]').forEach(function(m){dead.push(m);});
dead.forEach(function(d){d.parentNode&&d.parentNode.removeChild(d);});}catch(e){}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className={`${inter.variable} ${serif.variable} ${mono.variable}`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100
            focus:rounded-md focus:bg-[var(--accent)] focus:px-4 focus:py-2
            focus:text-sm focus:font-medium focus:text-[var(--accent-fg)]"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
