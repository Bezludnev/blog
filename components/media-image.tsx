import Image from "next/image";

import { getMediaAlt, getMediaUrl } from "@/lib/media";

type Props = {
  className?: string;
  media: unknown;
  priority?: boolean;
  sizes: string;
};

export function MediaImage({ className, media, priority = false, sizes }: Props) {
  const url = getMediaUrl(media);

  if (!url) {
    return null;
  }

  return (
    <div className={className}>
      <Image
        alt={getMediaAlt(media)}
        className="object-cover"
        fill
        priority={priority}
        sizes={sizes}
        src={url}
      />
    </div>
  );
}
