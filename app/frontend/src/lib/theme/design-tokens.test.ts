import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const requireFromTailwind = createRequire(import.meta.resolve("@tailwindcss/postcss"));
const postcss = requireFromTailwind("postcss") as {
  (plugins: unknown[]): { process(css: string, opts: { from: string }): Promise<{ css: string }> };
};
const tailwindcss = (await import("@tailwindcss/postcss")).default;

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const globalsPath = path.join(frontendRoot, "src/app/globals.css");

function colourProbeClasses(): string {
  const globals = readFileSync(globalsPath, "utf8");
  const names = [...globals.matchAll(/--color-([a-z0-9-]+):/g)].map((match) => match[1]);
  return names.flatMap((name) => [`bg-${name}`, `text-${name}`]).join(" ");
}

const probeClasses = [
  "text-display",
  "text-title",
  "text-heading",
  "text-subhead",
  "text-body-md",
  "text-body-strong",
  "text-small",
  "text-label",
  "text-price",
  "text-pos-total",
  "rounded-btn",
  "rounded-input",
  "rounded-card",
  "rounded-card-lg",
  "rounded-sheet",
  "rounded-pill",
  "rounded-ds-xs",
  "rounded-ds-sm",
  "tracking-caps",
  "tracking-display",
  "ease-ds-out",
  "ease-sheet",
  "ease-out",
  "ease-in-out",
  "text-sm",
  "text-base",
  "text-lg",
  "rounded-sm",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "duration-(--dur-fast)",
].join(" ");

const sourceInline = `${probeClasses} ${colourProbeClasses()}`;

async function compileGlobals(): Promise<string> {
  const input = `@import "./src/app/globals.css";\n@source inline("${sourceInline}");\n`;
  const result = await postcss([tailwindcss()]).process(input, {
    from: path.join(frontendRoot, "design-tokens-probe.css"),
  });
  return result.css;
}

function ruleBody(css: string, className: string): string {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`\\.${escaped}(?![\\w-])\\s*\\{([^}]*)\\}`));
  expect(match, `.${className}`).not.toBeNull();
  return match?.[1].replace(/\s+/g, " ").trim() ?? "";
}

test("AC-1 design-token utilities compile to the DS values", async () => {
  const css = await compileGlobals();

  expect(ruleBody(css, "text-display")).toBe(
    "font-size: var(--fs-display); line-height: var(--tw-leading, var(--lh-display)); letter-spacing: var(--tw-tracking, var(--ls-display)); font-weight: var(--tw-font-weight, var(--fw-bold));",
  );
  expect(ruleBody(css, "text-label")).toBe(
    "font-size: var(--fs-micro); line-height: var(--tw-leading, 1.4); font-weight: var(--tw-font-weight, var(--fw-semibold));",
  );
  expect(ruleBody(css, "text-small")).toContain("font-size: var(--fs-small)");
  expect(ruleBody(css, "text-small")).toContain("line-height: var(--tw-leading, 1.5)");
  expect(ruleBody(css, "text-price")).toContain("font-size: var(--fs-price)");
  expect(ruleBody(css, "text-price")).toContain("line-height: var(--tw-leading, 1.3)");
  expect(ruleBody(css, "text-pos-total")).toContain("font-size: var(--fs-pos-total)");
  expect(ruleBody(css, "text-pos-total")).toContain("line-height: var(--tw-leading, 1.1)");
  expect(ruleBody(css, "text-pos-total")).toContain("font-weight: var(--tw-font-weight, var(--fw-bold))");
  expect(ruleBody(css, "rounded-card")).toBe("border-radius: var(--r-card);");
  expect(ruleBody(css, "rounded-ds-sm")).toBe("border-radius: var(--r-sm);");
  expect(ruleBody(css, "tracking-caps")).toContain("letter-spacing: var(--ls-caps)");
  expect(ruleBody(css, "ease-ds-out")).toContain("transition-timing-function: cubic-bezier(.2,0,0,1)");
  expect(ruleBody(css, "ease-sheet")).toContain("transition-timing-function: cubic-bezier(.22,1,.36,1)");
  expect(ruleBody(css, String.raw`duration-\(--dur-fast\)`)).toContain("transition-duration: var(--dur-fast)");

  const globals = readFileSync(globalsPath, "utf8");
  expect(globals).toContain("--fs-micro:11px;");
  expect(globals).toContain("--r-sm:8px;");
  expect(globals).toContain("--r-card:12px;");
  expect(globals).toContain("--ls-caps:0.08em;");
  expect(globals).toContain("--dur-fast:140ms;");
  expect(globals).toContain("--ease-ds-out:cubic-bezier(.2,0,0,1);");
  expect(globals).toContain("--ease-sheet:cubic-bezier(.22,1,.36,1);");
  expect(globals).not.toMatch(/--ease-out\s*:/);
  expect(globals).not.toMatch(/--ease-in-out\s*:/);
});

test("AC-2 HeroUI scale, easing, and colour utilities stay on their previous values", async () => {
  const css = await compileGlobals();

  expect(ruleBody(css, "text-sm")).toBe(
    "font-size: var(--text-sm); line-height: var(--tw-leading, var(--text-sm--line-height));",
  );
  expect(ruleBody(css, "text-base")).toBe(
    "font-size: var(--text-base); line-height: var(--tw-leading, var(--text-base--line-height));",
  );
  expect(ruleBody(css, "text-lg")).toBe(
    "font-size: var(--text-lg); line-height: var(--tw-leading, var(--text-lg--line-height));",
  );
  expect(ruleBody(css, "rounded-sm")).toBe("border-radius: calc(var(--radius) * 0.5);");
  expect(ruleBody(css, "rounded-md")).toBe("border-radius: calc(var(--radius) * 0.75);");
  expect(ruleBody(css, "rounded-lg")).toBe("border-radius: calc(var(--radius) * 1);");
  expect(ruleBody(css, "rounded-xl")).toBe("border-radius: calc(var(--radius) * 1.5);");
  expect(ruleBody(css, "ease-out")).toBe(
    "--tw-ease: var(--ease-out); transition-timing-function: var(--ease-out);",
  );
  expect(ruleBody(css, "ease-in-out")).toBe(
    "--tw-ease: var(--ease-in-out); transition-timing-function: var(--ease-in-out);",
  );

  const easeOut = css.match(/--ease-out:\s*([^;]+)/g) ?? [];
  const easeInOut = css.match(/--ease-in-out:\s*([^;]+)/g) ?? [];
  expect(easeOut.map((item) => item.replace(/\s+/g, " "))).toEqual([
    "--ease-out: cubic-bezier(0, 0, 0.2, 1)",
  ]);
  expect(easeInOut.map((item) => item.replace(/\s+/g, " "))).toEqual([
    "--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)",
  ]);

  const globals = readFileSync(globalsPath, "utf8");
  const colours = [...globals.matchAll(/--color-([a-z0-9-]+):\s*var\((--[a-z0-9-]+)\)/g)];
  expect(colours.length).toBeGreaterThan(0);
  for (const [, utility, primitive] of colours) {
    expect(ruleBody(css, `bg-${utility}`)).toBe(`background-color: var(${primitive});`);
    expect(ruleBody(css, `text-${utility}`)).toBe(`color: var(${primitive});`);
  }
});
