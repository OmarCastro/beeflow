import { provide } from "./provider.ts"


export function css(strings: TemplateStringsArray, ...placeholders: unknown[]){
    const resultString = strings.reduce((result, string, i) => (result + placeholders[i - 1] + string)).trim()
    
    let getStyleElement = () => {
        const result = document.createElement("style")
        result.innerHTML = resultString
        getStyleElement = () => result
        return result
    }


    return Object.freeze({
        cssText: resultString,
        get styleElement(){ return getStyleElement() }
    })

}

provide({css})