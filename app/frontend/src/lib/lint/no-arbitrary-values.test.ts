import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { expect, test } from "vitest";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const virtualFile = path.join(frontendRoot, "src/lib/lint/_virtual.tsx");

const eslint = new ESLint({ cwd: frontendRoot });

async function lintSource(source: string): Promise<string[]> {
  const [result] = await eslint.lintText(source, { filePath: virtualFile });
  return result.messages.map((message) => message.message);
}

const denied = "Use a design token utility (see globals.css mapping) — no arbitrary values.";

function sourceWithClass(className: string): string {
  return `export function X(){ return <div className="${className}" />; }`;
}

test("AC-4 rejects an arbitrary px class and allows token and non-numeric arbitrary classes", async () => {
  const bad = sourceWithClass(["text-", "[13px]"].join(""));
  const badTemplate = [
    "export function X(){ return <div className={`text-[",
    "13px]`} />; }",
  ].join("");
  const hash = sourceWithClass(["bg-[", "#fff]"].join(""));
  const numericGrid = sourceWithClass(["grid-cols-", "[1fr_320px]"].join(""));
  const tokenParen = sourceWithClass("duration-(--dur-fast)");

  expect(await lintSource(bad)).toContain(denied);
  expect(await lintSource(badTemplate)).toContain(denied);
  expect(await lintSource(hash)).toContain(denied);
  expect(await lintSource(numericGrid)).toContain(denied);
  expect(await lintSource(sourceWithClass("text-small"))).toEqual([]);
  expect(await lintSource(sourceWithClass("grid-cols-[auto_1fr]"))).toEqual([]);
  expect(await lintSource(sourceWithClass("content-['']"))).toEqual([]);
  expect(await lintSource(tokenParen)).toEqual([]);
}, 30_000);
