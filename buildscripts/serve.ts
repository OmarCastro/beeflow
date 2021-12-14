import { Server, Bundler } from "https://deno.land/x/bundler/mod.ts";
import { defaultPlugins } from './plugins.ts'
import { inputFileList, outputMapForDir } from './entrypoints.ts'


const plugins = defaultPlugins(); // default plugins
const bundler = new Bundler(plugins);
bundler.logger.logLevel = bundler.logger.logLevels.debug

const outputMap = outputMapForDir("")
const server = new Server({bundler});
await server.bundle(inputFileList, { outputMap });
await server.listen({ port: 8000 });