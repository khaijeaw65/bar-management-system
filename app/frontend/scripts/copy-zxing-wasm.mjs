import { createRequire } from "node:module";
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const destDir = join(appRoot, "public/zxing");
mkdirSync(destDir, { recursive: true });
copyFileSync(readerWasmPath(), join(destDir, "zxing_reader.wasm"));

function readerWasmPath() {
  const require = createRequire(join(appRoot, "package.json"));
  let dir = dirname(realpathSync(require.resolve("barcode-detector")));
  for (let hop = 0; hop < 6; hop += 1) {
    const manifest = join(dir, "package.json");
    if (existsSync(manifest)) {
      const pkg = JSON.parse(readFileSync(manifest, "utf8"));
      if (pkg.name === "barcode-detector") return join(dirname(dir), "zxing-wasm/dist/reader/zxing_reader.wasm");
    }
    dir = dirname(dir);
  }
  throw new Error("zxing reader wasm was not installed with barcode-detector");
}
