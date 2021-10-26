const error = () => { throw "html method not provided" }


interface HtmlUtil {
    html(segs: TemplateStringsArray, ...parts: unknown[] ): Readonly<HtmlUtilObject>
}


export interface HtmlUtilObject {
    htmlText: string
    template: HTMLTemplateElement
    generateTemplateWithStyles(...styles: (string | HTMLStyleElement)[]): HTMLTemplateElement
}


export const instance : HtmlUtil = {
    html: error
}

export function provide(impl: Partial<HtmlUtil>){
    instance.html = typeof impl.html === "function" ? impl.html : instance.html
}