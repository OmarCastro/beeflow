declare type GraphEdge = import('./subcomponent/graph-edge/graph-edge.element.ts').GraphEdge;
declare type GraphNode = import('./subcomponent/graph-node/graph-node.element.ts').GraphNode;
import { throttleAnimationFrame } from '../../algorithms/throttle.ts'


let loadTemplate = () => Promise.all([
    import("./graph.element.css.ts"),
    import("./graph.element.html.ts")
]).then(([{default: css}, {default: html}]) => {
    const result = html.generateTemplateWithStyles(css.styleElement)
    loadTemplate = () => Promise.resolve(result)
    return result
})


const {GraphEdge} = await import('./subcomponent/graph-edge/graph-edge.element.ts')
const {GraphNode} = await import('./subcomponent/graph-node/graph-node.element.ts')

function getNodeMap(graph:Graph): Record<string, GraphNode> {
    return Array.from(graph.children)
        .filter(el => el instanceof GraphNode)
        .reduce((acc, el) => {
            const node = el as GraphNode
            const id = el.getAttribute("node-id")
            if(id == null){
                return acc
            }
            return {...acc, [id]: node};
        }, {})
}

function createEdges(edgeElements: GraphEdge[], shadowRoot: ShadowRoot, graph: Graph){

    const nodes = getNodeMap(graph)

    shadowRoot.querySelectorAll('.graph__edges').forEach(svg => {
        const svgElems = edgeElements.map((edgeElement) => {
            const {startNode, startOutput, endNode, endInput} = edgeElement
            const startNodeEl = (startNode && nodes[startNode]) || null
            const endNodeEl = (endNode && nodes[endNode]) || null
            const {x: x1, y: y1} = startNodeEl?.getOutputConnectorEdgePoint(startOutput || "") || {x: 0, y: 0}
            const {x: x2, y: y2} = endNodeEl?.getInputConnectorEdgePoint(endInput || "") || {x: 0, y: 0}

            return [
                `<path data-edge="${startNode}::${startOutput}->${endNode}::${endInput}" class="bg-edge" d="M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}"/>`,
                `<path data-edge="${startNode}::${startOutput}->${endNode}::${endInput}" stroke="${edgeElement.color}" class="fg-edge" d="M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}"/>`
            ]
        }).reduce(([prevBg, prevFg], [currBg, currFg]) => [prevBg + currBg, prevFg + currFg]).join("")
        svg.insertAdjacentHTML("beforeend", svgElems)
    })
}

function updateEdges(edgeElements: GraphEdge[], shadowRoot: ShadowRoot, graph: Graph){

    const nodes = getNodeMap(graph)

    shadowRoot.querySelectorAll('.graph__edges').forEach(svg => {
        edgeElements.forEach(edgeElement => {
            const {startNode, startOutput, endNode, endInput} = edgeElement
            const startNodeEl = (startNode && nodes[startNode]) || null
            const endNodeEl = (endNode && nodes[endNode]) || null
            const {x: x1, y: y1} = startNodeEl?.getOutputConnectorEdgePoint(startOutput || "") || {x: 0, y: 0}
            const {x: x2, y: y2} = endNodeEl?.getInputConnectorEdgePoint(endInput || "") || {x: 0, y: 0}

            svg.querySelectorAll(`[data-edge="${startNode}::${startOutput}->${endNode}::${endInput}"]`).forEach(edgeSvg => {
                edgeSvg.setAttribute('d', `M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`)
            })
        })
    })
}

function updateEdgesOfNode(node: GraphNode, shadowRoot: ShadowRoot, graph: Graph){
    const {  nodeId } = node
    const allEdges = Array.from(graph.children).filter(el => el instanceof GraphEdge).map(el => el as GraphEdge)
    const inputEdges = allEdges.filter(edge => edge.endNode === nodeId)
    const outputEdges = allEdges.filter(edge => edge.startNode === nodeId)
    updateEdges([...inputEdges, ...outputEdges], shadowRoot, graph)
}

export class Graph extends HTMLElement {

    private reflecViewPort: () => void = () => {};

    constructor(){
        super()
        const shadowRoot = this.attachShadow({mode: "open"})

        loadTemplate().then(template => {
            shadowRoot.append(document.importNode(template.content, true))
            const slots = shadowRoot.querySelectorAll('slot');
            const graph = shadowRoot.querySelector('.graph') as HTMLElement;
            const edges = shadowRoot.querySelector('.graph__edges') as SVGElement;
            const graphStyle = graph.style
            slots.forEach(slot => {
                slot.addEventListener('slotchange', (event) => {
                    console.log(event.target)
                    console.log(event)
                    createEdges([...slot.assignedElements()].filter(el => el instanceof GraphEdge).map(el => el as GraphEdge), shadowRoot, this)
                })
            })

            graph.addEventListener("wheel", (event) => {
                const {target, deltaY} = event as WheelEvent
                if(target === graph){
                    this.scale = Math.min(Math.max(this.scale + (deltaY > 0 ? 0.1 : -0.1), 0.1), 5);
                }
            })

            graph.addEventListener("pointerdown", (pointerEvent: PointerEvent) => {
                const { screenX, screenY, target } = pointerEvent
                if(target !== graph){
                    return
                }
                const { x, y } = this

                const moveEvent = (pointerEvent: PointerEvent) => {
                    const screenDx = pointerEvent.screenX - screenX
                    const screenDy = pointerEvent.screenY - screenY
                    this.setAttribute('x', String(x + screenDx))
                    this.setAttribute('y', String(y + screenDy))
                }

                const throttledMoveEvent = throttleAnimationFrame(moveEvent);
                self.addEventListener('pointermove', throttledMoveEvent)
                self.addEventListener('pointerup', (pointer) => {
                    moveEvent(pointer)
                    self.removeEventListener('pointermove', throttledMoveEvent)
                }, {once: true})
            })

            const handleConnectorPointerdown = () => (event: Event) => {
                event.stopImmediatePropagation()
                const clientRect = graph.getBoundingClientRect()
                const { detail } = event as CustomEvent
                const { edgePoint, connectorTarget } = detail
                const { scale, x: posX, y: posY } = this
                const { x, y } = edgePoint

                const getRelativePosition = ({clientX, clientY}: {clientX: number, clientY: number}) => ({
                    x: (clientX - posX) / scale - clientRect.left,
                    y: (clientY - posY) / scale - clientRect.top,
                    
                })

                edges.insertAdjacentHTML("afterbegin", `<path class="bg-edge menu-edge" d="M${x},${y} C${x},${y} ${x},${y} ${x},${y}"/>`)
                edges.insertAdjacentHTML("beforeend", `<path stroke="${connectorTarget.getAttribute("color")}" class="fg-edge menu-edge" d="M${x},${y} C${x},${y} ${x},${y} ${x},${y}"/>`)
                const paths = edges.querySelectorAll('.menu-edge')
                const moveEvent = (pointerEvent: PointerEvent) => {
                    const { x: newX, y: newY } = getRelativePosition({ clientX: pointerEvent.clientX, clientY: pointerEvent.clientY })
                    paths.forEach(path => path.setAttribute("d", `M${x},${y} C${(x + newX)/2},${y} ${(x + newX)/2},${newY} ${newX},${newY}`))
                }

                const throttledMoveEvent = throttleAnimationFrame(moveEvent);
                self.addEventListener('pointermove', throttledMoveEvent)
                self.addEventListener('pointerup', () => {
                    paths.forEach(path => edges.removeChild(path))
                    self.removeEventListener('pointermove', throttledMoveEvent)
                }, {once: true})

            }

            graph.addEventListener("nodeinputconnectorpointerdown", handleConnectorPointerdown())
            graph.addEventListener("nodeoutputconnectorpointerdown", handleConnectorPointerdown())

            this.reflecViewPort = throttleAnimationFrame(() => {
                graphStyle.setProperty("--x", this.x.toString() + "px")
                graphStyle.setProperty("--y", this.y.toString() + "px")
                graphStyle.setProperty("--scale", this.scale.toString())
            })
        })

        this.addEventListener("nodePositionChanged", (event) => {
            const {target} = event
            if(target instanceof GraphNode){
                updateEdgesOfNode(target, shadowRoot, this)
            }
        })
    }

    get scale(): number {
        return parseFloat(this.getAttribute("scale") || "1")
    }

    set scale(num: number) {
        this.setAttribute("scale", String(num))
    }

    get x(): number {
        return parseFloat(this.getAttribute("x") || "0")
    }

    set x(num: number) {
        this.setAttribute("x", String(num))
    }

    get y(): number {
        return parseFloat(this.getAttribute("y") || "0")
    }

    set y(num: number) {
        this.setAttribute("y", String(num))
    }

    static get observedAttributes() { return ['x','y','scale']; }

    attributeChangedCallback(name: string, _oldvalue: string, _newValue: string) {
        switch(name){
            case 'scale':
            case 'x':
            case 'y':
                this.reflecViewPort()
                break
        }
    }
}