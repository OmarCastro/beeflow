declare type GraphNodeInput = import('../graph-node-input/graph-node-input.element.ts').GraphNodeInput;
declare type GraphNodeOutput = import('../graph-node-output/graph-node-output.element.ts').GraphNodeOutput;
import { throttleAnimationFrame, throttleTrailingAnimationFrame } from '../../../../algorithms/throttle.ts'

let loadTemplate = () => Promise.all([
    import("./graph-node.element.css.ts"),
    import("./graph-node.element.html.ts")
]).then(([{default: css}, {default: html}]) => {
    const result = html.generateTemplateWithStyles(css.styleElement)
    loadTemplate = () => Promise.resolve(result)
    return result
})

const { GraphNodeInput } = await import('../graph-node-input/graph-node-input.element.ts')
const { GraphNodeOutput } = await import('../graph-node-output/graph-node-output.element.ts')

export class GraphNode extends HTMLElement {
    private reflectPosition: () => void = () => {};

    constructor(){
        super()
        const shadowRoot = this.attachShadow({mode: "open"})
        loadTemplate().then(template => {
            shadowRoot.append(document.importNode(template.content, true))    

            const node = shadowRoot.querySelector(".node") as HTMLElement        
            node.addEventListener("pointerdown", (pointerEvent: PointerEvent) => {

                const { screenX, screenY, target } = pointerEvent


                if(target instanceof HTMLElement && target.matches("select")){
                    return
                }

                const style = window.getComputedStyle(this);
                const scale = parseFloat(style.getPropertyValue('--scale')); 
          
                const { x, y } = this.position

                const moveEvent = (pointerEvent: PointerEvent) => {
                    const screenDx = pointerEvent.screenX - screenX
                    const screenDy = pointerEvent.screenY - screenY
                    this.setAttribute('x', String(x + screenDx/scale))
                    this.setAttribute('y', String(y + screenDy/scale))
                }

                const throttledMoveEvent = throttleAnimationFrame(moveEvent);

                self.addEventListener('pointermove', throttledMoveEvent)

                self.addEventListener('pointerup', (pointer) => {
                    moveEvent(pointer)
                    self.removeEventListener('pointermove', throttledMoveEvent)
                }, {once: true})
            })


            node.addEventListener("inputconnectorpointerdown", (event: Event) => {
                event.stopImmediatePropagation()
                const { detail, target } = event as CustomEvent
                const {left, top, height} = detail.connectorOffset
                const { x, y } = this.position
                const edgePoint = {
                    x: x + left,
                    y: y + top + height/2
                }
                const customEvent = new CustomEvent("nodeinputconnectorpointerdown", {detail: {...detail, edgePoint, connectorTarget: target}, bubbles: true})
                this.dispatchEvent(customEvent)
            })

            node.addEventListener("outputconnectorpointerdown", (event: Event) => {
                event.stopImmediatePropagation()
                const { detail, target } = event as CustomEvent
                const {left, width, top, height} = detail.connectorOffset
                const { x, y } = this.position
                const edgePoint = {
                    x: x + left + width,
                    y: y + top + height/2
                }
                const customEvent = new CustomEvent("nodeoutputconnectorpointerdown", {detail: {...detail, edgePoint, connectorTarget: target}, bubbles: true})
                this.dispatchEvent(customEvent)
            })

            this.reflectPosition = throttleTrailingAnimationFrame(() => {
                const {x, y} = this.position
                const oldTransform = node.style.transform;
                const newTransform = `translate(${x}px, ${y}px)`;
                if(oldTransform != newTransform){
                    node.style.transform = newTransform
                    this.dispatchEvent(new CustomEvent("nodePositionChanged", {bubbles: true}));     
                }
            })

            shadowRoot.querySelectorAll('.node__title')?.forEach((title) => title.textContent = this.getAttribute('type'))
        })
    }

    get position(){
        const x = parseInt(this.getAttribute('x') || "0");
        const y = parseInt(this.getAttribute('y') || "0");
        return { x, y }
    }

    get nodeId(){
        return this.getAttribute('node-id')
    }

    getInputConnectorCenterPoint(input: string){
        const element = Array.from(this.children)
            .flatMap(elem => elem instanceof GraphNodeInput ? [elem as GraphNodeInput] : [])
            .find(elem => elem.inputName === input)
        if(!element){
            return {x: NaN, y: NaN}
        }
        const {x, y} = this.position
        const {left, width, top, height} = element.connectorOffset
        return {
            x: x + left + width/2,
            y: y + top + height/2
        }
    }

    getInputConnectorEdgePoint(input: string){
        const element = Array.from(this.children)
            .flatMap(elem => elem instanceof GraphNodeInput ? [elem as GraphNodeInput] : [])
            .find(elem => elem.inputName === input)
        if(!element){
            return {x: NaN, y: NaN}
        }
        const {x, y} = this.position
        const {left, top, height} = element.connectorOffset
        return {
            x: x + left,
            y: y + top + height/2
        }
    }

    getOutputConnectorCenterPoint(output: string){
        const element = Array.from(this.children)
            .flatMap(elem => elem instanceof GraphNodeOutput ? [elem as GraphNodeOutput] : [])
            .find(elem => elem.outputName === output)
        if(!element){
            return {x: NaN, y: NaN}
        }
        const {x, y} = this.position
        const {left, width, top, height} = element.connectorOffset
        return {
            x: x + left + width/2,
            y: y + top + height/2
        }
    }

    getOutputConnectorEdgePoint(output: string){
        const element = Array.from(this.children)
            .flatMap(elem => elem instanceof GraphNodeOutput ? [elem as GraphNodeOutput] : [])
            .find(elem => elem.outputName === output)
        if(!element){
            return {x: NaN, y: NaN}
        }
        const {x, y} = this.position
        const {left, width, top, height} = element.connectorOffset
        return {
            x: x + left + width,
            y: y + top + height/2
        }
    }

    static get observedAttributes() { return ['x', 'y', 'type']; }

    attributeChangedCallback(name: string, _oldvalue: string, newValue: string) {
        switch(name){
            case 'x':
            case 'y':
                this.reflectPosition()
                break
            case 'type': this.shadowRoot?.querySelectorAll('.node__title')?.forEach((title) => title.textContent = newValue)
        }
      }
}