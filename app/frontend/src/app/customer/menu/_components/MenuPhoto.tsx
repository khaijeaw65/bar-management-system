import type { CustomerMenuItem } from "@bar/contracts";
import { ImageIcon } from "lucide-react";

export function MenuPhoto({ item, count }: Readonly<{ item: CustomerMenuItem; count: number }>) {
  return (
    <div className="relative aspect-4/3 w-full bg-surface-raised">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL (DR-020)
        <img src={item.imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-text-faint">
          <ImageIcon aria-hidden className="size-8" />
        </div>
      )}
      {count > 0 ? (
        <span
          aria-label={`ในตะกร้า ${count}`}
          className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-pill bg-accent text-small text-text-on-accent"
        >
          {count}
        </span>
      ) : null}
    </div>
  );
}
