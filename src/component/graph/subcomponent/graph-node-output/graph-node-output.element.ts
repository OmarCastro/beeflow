let loadTemplate = () => Promise.all([
    import("./graph-node-output.element.css.ts"),
    import("./graph-node-output.element.html.ts")
]).then(([{default: css}, {default: html}]) => {
    const result = html.generateTemplateWithStyles(css.styleElement)
    loadTemplate = () => Promise.resolve(result)
    return result
})

export class GraphNodeOutput extends HTMLElement {
    private connectorOffsetFn: () => {top: number, left: number, width:number, height: number} = () => ({top: 0, left: 0, width:0, height: 0});

    constructor(){
        super()
        const shadowRoot = this.attachShadow({mode: "open"})
        loadTemplate().then(template => {
            shadowRoot.append(document.importNode(template.content, true))  
            const name = shadowRoot.querySelector(".output__name") as HTMLElement
            const connector = shadowRoot.querySelector('.output__connector') as HTMLElement
            name.textContent = this.getAttribute('name')
            const input = shadowRoot.querySelector(".output") as HTMLElement
            input.style.setProperty("--color", this.getAttribute('color') || "inheirt")

            connector.addEventListener("pointerdown", (pointerEvent: PointerEvent) => {
                const { screenX, screenY, clientX, clientY } = pointerEvent
                pointerEvent.stopImmediatePropagation()
                pointerEvent.preventDefault()
                const event = new CustomEvent("outputconnectorpointerdown", {detail: {screenX, screenY, clientX, clientY, connectorOffset: this.connectorOffset}, bubbles: true})
                this.dispatchEvent(event)
            })


            this.connectorOffsetFn = () => {
                return {
                    get top(){ return connector.offsetTop },
                    get left(){ return connector.offsetLeft },
                    get width(){ return connector.offsetWidth },
                    get height(){ return connector.offsetHeight }
                }
             
            }

        })
    }

    get outputName(){
        return this.getAttribute("name") || ""
    }

    static get observedAttributes() { return ['name']; }

    attributeChangedCallback(name: string, _oldvalue: string, newValue: string) {
        switch(name){
            case 'color':
                this.shadowRoot?.querySelectorAll('.output')?.forEach((name) => (name as HTMLElement).style.setProperty("color", newValue || "inheirt"))
                break
            case 'name': this.shadowRoot?.querySelectorAll('.output__name')?.forEach((name) => name.textContent = newValue)
        }
      }

    connectedCallback(){
        this.setAttribute("slot", "outputs")
    }

    get connectorOffset(){
        return this.connectorOffsetFn()
    }
}
