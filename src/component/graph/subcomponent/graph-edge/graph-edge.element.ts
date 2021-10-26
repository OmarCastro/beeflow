
import { debounceAnimationFrame } from '../../../../algorithms/debounce.ts'


export class GraphEdge extends HTMLElement {
    private triggerEvent: () => void = () => {};

    constructor(){
        super()
        this.triggerEvent = debounceAnimationFrame(() => {
            const event = new CustomEvent("edgeChanged", {bubbles: true})
            this.dispatchEvent(event)
        })

    }

    get startNode() { return this.getAttribute('start-node') }
    get startOutput() { return this.getAttribute('start-output') }
    get endNode() { return this.getAttribute('end-node') }
    get endInput() { return this.getAttribute('end-input') }
    get color() { return this.getAttribute('edge-color') }

    static get observedAttributes() { return ['start-node', 'end-node', 'start-output', 'end-input']; }

    attributeChangedCallback() {
        this.triggerEvent()
    }
}