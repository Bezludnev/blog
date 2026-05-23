import type { SiteSetting } from "../payload-types";

const fallbackSiteName = "MConverter.eu";
const fallbackHeadline = "Personal engineering blog";
const fallbackBio =
  "Personal engineering notes on software delivery, systems, and product engineering.";

type SiteSettingsFallbackInput = Partial<
  Pick<SiteSetting, "bio" | "headline" | "name">
>;

function hasValue(value: null | string | undefined): value is string {
  return Boolean(value?.trim());
}

function valueOrFallback(value: null | string | undefined, fallback: string) {
  return hasValue(value) ? value : fallback;
}

export async function getSiteSettings() {
  const { getPayloadClient } = await import("./payload.ts");
  const payload = await getPayloadClient();

  return payload.findGlobal({
    slug: "site-settings",
  }) as Promise<SiteSetting>;
}

export function getSiteName(settings: SiteSettingsFallbackInput) {
  return valueOrFallback(settings.name, fallbackSiteName);
}

export function getSiteHeadline(settings: SiteSettingsFallbackInput) {
  return valueOrFallback(settings.headline, fallbackHeadline);
}

export function getSiteBio(settings: SiteSettingsFallbackInput) {
  return valueOrFallback(settings.bio, fallbackBio);
}
