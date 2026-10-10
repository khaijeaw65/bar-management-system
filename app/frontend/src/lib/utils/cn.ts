import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const dsFontSize = [
  "display",
  "title",
  "heading",
  "subhead",
  "body-md",
  "body-strong",
  "small",
  "label",
  "price",
  "pos-total",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...dsFontSize] }],
      rounded: [{ rounded: ["btn", "input", "card", "card-lg", "sheet", "pill", "ds-xs", "ds-sm"] }],
      tracking: [{ tracking: ["caps", "display"] }],
      ease: [{ ease: ["ds-out", "sheet"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
