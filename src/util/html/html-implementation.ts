import { provide } from "./provider.ts"


export function html(strings: TemplateStringsArray, ...placeholders: unknown[]){
    const resultString = strings.reduce((result, string, i) => (result + placeholders[i - 1] + string)).trim()
    let template = () => {
        const result = document.createElement("template")
        result.innerHTML = resultString
        template = () => result
        return result
    }
    return Object.freeze({
        htmlText: resultString,
        get template(){ return template() },
        generateTemplateWithStyles(...styles: (string | HTMLStyleElement)[]){
            const stylesHtml = styles.map(style => {
                if(style instanceof HTMLStyleElement){
                    return style.outerHTML
                } else if(typeof style === "string"){
                    return `<style>${style}</style>`
                } else return ''
            }).join("")
            const result = document.createElement("template")
            result.innerHTML = stylesHtml + resultString
            return result

        }
    })}

provide({html})