const error = () => { throw "css method not provided" }


interface CssUtil {
    css(segs: TemplateStringsArray, ...parts: unknown[] ): Readonly<CssUtilObject>
}

export interface CssUtilObject {
    cssText: string
    styleElement: HTMLStyleElement
}


export const instance : CssUtil = {
    css: error
}

export function provide(impl: Partial<CssUtil>){
    instance.css = typeof impl.css === "function" ? impl.css : instance.css
}