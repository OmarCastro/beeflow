import { Bundler } from "https://deno.land/x/bundler/mod.ts";
import { defaultPlugins } from './plugins.ts'
import {ensureFile} from "https://deno.land/std@0.100.0/fs/mod.ts";

const plugins = defaultPlugins(); // default plugins
const bundler = new Bundler(plugins);
bundler.logger.logLevel = bundler.logger.logLevels.debug

const input = "src/demo.html";
const outputMap = { [input]: "dist/demo.html" };

const { bundles } = await bundler.bundle([input], { outputMap });

for (const [output, source] of Object.entries(bundles)) {
  await ensureFile(output);
  if (typeof source === "string") {
    await Deno.writeTextFile(output, source);
  } else {
    await Deno.writeFile(output, source as Uint8Array);
  }
}