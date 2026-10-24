import { createRequire } from "node:module";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ file: string }> }): Promise<Response> {
  const { file } = await context.params;
  if (file !== "zxing_reader.wasm") return new Response(null, { status: 404 });
  const bytes = await readFile(readerWasmPath());
  return new Response(bytes, {
    headers: {
      "content-type": "application/wasm",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

function readerWasmPath(): string {
  const require = createRequire(join(process.cwd(), "package.json"));
  let dir = dirname(realpathSync(require.resolve("barcode-detector")));
  for (let hop = 0; hop < 6; hop += 1) {
    const manifest = join(dir, "package.json");
    if (existsSync(manifest)) {
      const pkg = JSON.parse(readFileSync(manifest, "utf8")) as { name?: string };
      if (pkg.name === "barcode-detector") return join(dirname(dir), "zxing-wasm/dist/reader/zxing_reader.wasm");
    }
    dir = dirname(dir);
  }
  throw new Error("zxing reader wasm was not installed with barcode-detector");
}
