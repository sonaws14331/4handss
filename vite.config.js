import { defineConfig } from "vite";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  build: { target: "es2022" },
  plugins: [
    {
      name: "version-amber-service-worker",
      async writeBundle(options, bundle) {
        const hash = createHash("sha256");
        for (const filename of Object.keys(bundle).sort()) {
          const item = bundle[filename];
          hash
            .update(filename)
            .update(item.type === "chunk" ? item.code : item.source);
        }
        const output = path.join(options.dir, "sw.js");
        const source = await readFile(output, "utf8");
        await writeFile(
          output,
          source.replace("__BUILD_VERSION__", hash.digest("hex").slice(0, 16)),
        );
      },
    },
  ],
});
