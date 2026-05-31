import type { Metadata } from "next";
import Script from "next/script";
import { SiteFooter } from "@/components/site-footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VercelInsights } from "@/components/vercel-insights";
import { canonicalUrl, getSiteUrl } from "@/lib/seo";
import { getThemeBootstrapScript } from "@/lib/theme";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Personal Engineering Blog",
  description: "Personal engineering blog and portfolio.",
  openGraph: {
    title: "Personal Engineering Blog",
    description: "Personal engineering blog and portfolio.",
    siteName: "Personal Engineering Blog",
    type: "website",
    url: canonicalUrl("/"),
  },
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script
          dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }}
          id="theme-bootstrap"
          strategy="beforeInteractive"
        />
        <TooltipProvider>{children}</TooltipProvider>
        <SiteFooter />
        <VercelInsights />
      </body>
    </html>
  );
}
