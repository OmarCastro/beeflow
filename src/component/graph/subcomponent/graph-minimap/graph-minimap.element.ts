declare type GraphNode = import('../graph-node/graph-node.element.ts').GraphNode;
declare type GraphEdge = import('../graph-edge/graph-edge.element.ts').GraphEdge;
declare type BoundaryTarget<T> = import('../../../../algorithms/boundary.ts').BoundaryTarget<T>;
import { Boundary } from '../../../../algorithms/boundary.ts'
import { debounceAnimationFrame } from '../../../../algorithms/debounce.ts'

let loadTemplate = () => Promise.all([
    import("./graph-minimap.element.css.ts"),
    import("./graph-minimap.element.html.ts")
]).then(([{default: css}, {default: html}]) => {
    const result = html.generateTemplateWithStyles(css.styleElement)
    loadTemplate = () => Promise.resolve(result)
    return result
})

const { GraphNode } = await import('../graph-node/graph-node.element.ts')
const { GraphEdge } = await import('../graph-edge/graph-edge.element.ts')

const getSiblings = (elm: Element) => elm && elm.parentNode && Array.from(elm.parentNode.children).filter(node => node != elm) || []

function toBoundaryTarget (node: GraphNode) : BoundaryTarget<GraphNode>{
    const {x, y} = node.position
    const { width, height } = node.nodeDimensions
    return { left: x, top: y, rigth: x + width, bottom: y + height, data: node }
}

export class GraphMinimap extends HTMLElement {
    private removeParentListener: () => void = () => {};
    private renderMinimap: () => void = () => {};


    constructor(){
        super()
        const shadowRoot = this.attachShadow({mode: "open"})
        loadTemplate().then(template => {
            shadowRoot.append(document.importNode(template.content, true))    

            const minimapSvg = shadowRoot.querySelector(".minimap__svg") as SVGElement
            const minimapNodes = shadowRoot.querySelector(".minimap__nodes") as SVGGElement
            
            this.renderMinimap = debounceAnimationFrame(() => {
                if(!this.isConnected){
                    return
                }

                const siblingElements = getSiblings(this);
                const siblingNodes = siblingElements.filter(elem => elem instanceof GraphNode) as GraphNode[]
                const siblingEdges = siblingElements.filter(elem => elem instanceof GraphEdge) as GraphEdge[]
                const boundaryTargets = siblingNodes.map(toBoundaryTarget)
                const boundary = Boundary.createFromTargets(boundaryTargets)
                const margin = 10
                minimapSvg.setAttribute("viewBox", `${boundary.left - margin} ${boundary.top - margin} ${boundary.rigth + margin} ${boundary.bottom + margin}`)
                minimapNodes.innerHTML = boundaryTargets.map(({left, rigth, top, bottom}) => {
                    const width = rigth - left
                    const height = bottom - top
                    return `<rect x="${left}" y="${top}" width="${width}" height="${height}" rx="15" />`
                }).join("")
            })
            
            this.renderMinimap();
        })
    }

    connectedCallback(){
        this.setAttribute("slot", "tooling")
        const { parentElement } = this
        if(parentElement == null){
            return
        }
        const eventListener = (event: Event) => {
            const {target} = event
            if(target instanceof GraphNode){
                this.renderMinimap()
            }
        }

        parentElement.addEventListener("nodePositionChanged", eventListener)
        this.removeParentListener = () => parentElement.removeEventListener("nodePositionChanged", eventListener)
        this.renderMinimap;
    }

    disconnectedCallback(){
        this.removeParentListener()
        this.removeParentListener = () => {}
    }

}
