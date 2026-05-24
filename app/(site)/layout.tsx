import type { Metadata } from "next";
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <VercelInsights />
      </body>
    </html>
  );
}
