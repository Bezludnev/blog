import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { isAnalyticsEnabled } from "@/lib/analytics";

export function VercelInsights() {
  if (!isAnalyticsEnabled(process.env.ANALYTICS_ENABLED)) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
