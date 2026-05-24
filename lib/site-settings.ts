import type { Media, SiteSetting } from "../payload-types";

const fallbackSiteName = "Personal Engineering Blog";
const fallbackHeadline = "Personal engineering blog";
const fallbackBio =
  "Personal engineering notes on software delivery, systems, and product engineering.";
const fallbackNavigation: SiteNavigationItem[] = [
  { label: "About", newTab: false, url: "/about" },
  { label: "Projects", newTab: false, url: "/projects" },
  { label: "Feed", newTab: false, url: "/feed" },
  { label: "Blog", newTab: false, url: "/blog" },
  { label: "Contact", newTab: false, url: "/contact" },
  { label: "Admin", newTab: false, url: "/admin" },
];

type OpenGraphImage = Media | string;

type SeoDefaultsInput = {
  description?: null | string;
  openGraphImage?: OpenGraphImage | null;
  title?: null | string;
};

type NavigationInput = {
  label?: null | string;
  newTab?: boolean | null;
  url?: null | string;
};

type ProfileSectionInput = {
  body?: null | string;
  title?: null | string;
};

export type SiteNavigationItem = {
  label: string;
  newTab: boolean;
  url: string;
};

export type SiteSeoDefaults = {
  description: string;
  openGraphImage?: OpenGraphImage;
  title: string;
};

export type ProfileSection = {
  body: string;
  title: string;
};

type SiteSettingsFallbackInput = Partial<
  Pick<SiteSetting, "bio" | "headline" | "name" | "seoDescription" | "seoTitle">
> & {
  navigation?: NavigationInput[] | null;
  profileSections?: ProfileSectionInput[] | null;
  seoDefaults?: SeoDefaultsInput | null;
};

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

export function getSiteNavigation(
  settings: SiteSettingsFallbackInput,
): SiteNavigationItem[] {
  const navigation = (settings.navigation || [])
    .map((item) => {
      const label = item.label?.trim();
      const url = item.url?.trim();

      if (!label || !url) {
        return null;
      }

      return {
        label,
        newTab: item.newTab === true,
        url,
      };
    })
    .filter((item): item is SiteNavigationItem => item !== null);

  return navigation.length > 0 ? navigation : fallbackNavigation;
}

export function getSiteSeoDefaults(
  settings: SiteSettingsFallbackInput,
): SiteSeoDefaults {
  return {
    description: valueOrFallback(
      settings.seoDefaults?.description ?? settings.seoDescription,
      getSiteBio(settings),
    ),
    openGraphImage: settings.seoDefaults?.openGraphImage ?? undefined,
    title: valueOrFallback(
      settings.seoDefaults?.title ?? settings.seoTitle,
      getSiteName(settings),
    ),
  };
}

export function getProfileSections(
  settings: SiteSettingsFallbackInput,
): ProfileSection[] {
  return (settings.profileSections || [])
    .map((section) => {
      const title = section.title?.trim();
      const body = section.body?.trim();

      if (!title || !body) {
        return null;
      }

      return { body, title };
    })
    .filter((section): section is ProfileSection => section !== null);
}
