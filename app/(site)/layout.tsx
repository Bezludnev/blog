import type { Metadata } from "next";
import Script from "next/script";
import { VercelInsights } from "@/components/vercel-insights";
import { getThemeBootstrapScript } from "@/lib/theme";
import "../globals.css";

export const metadata: Metadata = {
  title: "Personal Engineering Blog",
  description: "Personal engineering blog and portfolio.",
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
        {children}
        <VercelInsights />
      </body>
    </html>
  );
}
