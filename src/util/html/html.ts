import { instance } from "./provider.ts"

export const html = (segs: TemplateStringsArray, ...parts: unknown[]) => instance.html(segs, ...parts)
