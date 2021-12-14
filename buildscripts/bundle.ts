import { Bundler } from "https://deno.land/x/bundler/mod.ts";
import {ensureFile} from "https://deno.land/std@0.100.0/fs/mod.ts";
import { defaultPlugins } from './plugins.ts'
import { inputFileList, outputMapForDir } from './entrypoints.ts'



const plugins = defaultPlugins(); // default plugins
const bundler = new Bundler(plugins);
bundler.logger.logLevel = bundler.logger.logLevels.debug
const outputMap = outputMapForDir("dist")
const { bundles } = await bundler.bundle(inputFileList, { outputMap });

for (const [output, source] of Object.entries(bundles)) {
  await ensureFile(output);
  if (typeof source === "string") {
    await Deno.writeTextFile(output, source);
  } else {
    await Deno.writeFile(output, source as Uint8Array);
  }
}