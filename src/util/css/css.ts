import { instance } from "./provider.ts"

export const css = (segs: TemplateStringsArray, ...parts: unknown[]) => instance.css(segs, ...parts)
