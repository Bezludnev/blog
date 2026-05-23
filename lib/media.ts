import type { Media } from "../payload-types";

export function isMedia(value: unknown): value is Media {
  return Boolean(value && typeof value === "object" && "url" in value);
}

export function getMediaUrl(value: unknown) {
  if (!isMedia(value)) {
    return null;
  }

  return value.url || null;
}

export function getMediaAlt(value: unknown) {
  if (!isMedia(value)) {
    return "";
  }

  return value.alt || "";
}
