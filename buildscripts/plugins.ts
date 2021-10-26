import {HtmlPlugin} from 'https://deno.land/x/bundler@0.8.1/plugins/html/html.ts'
import { postcss } from 'https://deno.land/x/bundler@0.8.1/deps.ts'
import {Item} from 'https://deno.land/x/bundler@0.8.1/plugins/plugin.ts'
import { defaultPlugins as origDefaultPlugins } from "https://deno.land/x/bundler@0.8.1/mod.ts";
import { FilePlugin } from "https://deno.land/x/bundler@0.8.1/plugins/file.ts";
import { readTextFile } from "https://deno.land/x/bundler@0.8.1/_util.ts";

export class ComponentHtmlPlugin extends FilePlugin {
    constructor() {
        super();
      }

      test(item: Item) {
        const input = item.history[0];
        return input.endsWith(".component.html") || input.endsWith(".element.html")
    }

    async readSource(input: string) {
      return await readTextFile(input);
    }

}


export class NonComponentHtmlPlugin extends HtmlPlugin {
  constructor(
    { use = [] }: {
      use?: postcss.AcceptedPlugin[];
    } = {},
  ) {
    super({use});
  }

    test(item: Item) {
      const input = item.history[0];
      return input.endsWith(".html") && !input.endsWith(".component.html") && !input.endsWith(".element.html")
  }

}

export function defaultPlugins(){
  return origDefaultPlugins().map((plugin) => {
    if(plugin instanceof HtmlPlugin){
      return [new ComponentHtmlPlugin(), new NonComponentHtmlPlugin({use: plugin.use})]
    } else {
      return [plugin]
    }
  }).flat()
}