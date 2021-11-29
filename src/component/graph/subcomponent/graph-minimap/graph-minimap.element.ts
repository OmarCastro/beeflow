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
type MaybeGraphElement = HTMLElement & {readonly viewPortRect?: DOMRect}


const getSiblings = (elm: Element) => elm && elm.parentNode && Array.from(elm.parentNode.children).filter(node => node != elm) || []

function toBoundaryTarget (node: GraphNode) : BoundaryTarget<GraphNode>{
    const {x, y} = node.position
    const { width, height } = node.nodeDimensions
    return { left: x, top: y, right: x + width, bottom: y + height, data: node }
}

function rectToBoundaryTarget (domRect: DOMRect) : BoundaryTarget<DOMRect>{
    const {left, top, right, bottom} = domRect
    return {left, top, right, bottom, data: domRect}
}


const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
        Array.from(entry.target.children).forEach(element => {
            if(element instanceof GraphMinimap){
                (element as GraphMinimap).updateViewPort()
            }
        });
    }
});


export class GraphMinimap extends HTMLElement {
    private removeParentListeners: () => void = () => {};
    private renderMinimap: () => void = () => {};
    private updateNodePosition: (node: GraphNode) => void = () => {};
    public updateViewPort: () => void = () => {};


    constructor(){
        super()
        const shadowRoot = this.attachShadow({mode: "open"})
        loadTemplate().then(template => {
            shadowRoot.append(document.importNode(template.content, true))    

            const minimapSvg = shadowRoot.querySelector(".minimap__svg") as SVGSVGElement
            const svgPt = minimapSvg.createSVGPoint();  // Created once for document
            const minimapNodes = shadowRoot.querySelector(".minimap__nodes") as SVGGElement
            const minimapEdges = shadowRoot.querySelector(".minimap__edges") as SVGGElement
            const minimapViewPort = shadowRoot.querySelector(".minimap__viewPort") as SVGGElement
            const minimapCoordinates = shadowRoot.querySelector(".minimap__coordinates") as HTMLElement
            
            const getViewPort = () => {
                const parentElement = this.parentElement as MaybeGraphElement
                if(!parentElement){
                    return new DOMRect()
                }
                const { viewPortRect } = parentElement
                return viewPortRect instanceof DOMRect ? viewPortRect : new DOMRect()

            }

            const getGraphInfo = () => {
                const siblingElements = getSiblings(this);
                const viewPort = getViewPort();
                const siblingNodes = siblingElements.filter(elem => elem instanceof GraphNode) as GraphNode[]
                const siblingNodesMap = siblingNodes.reduce((acc, node) => {
                    const {nodeId} = node
                    if(nodeId){
                        acc[nodeId] = node
                    } 
                    return acc
                }, {} as Record<string, GraphNode>)
                const siblingEdges = siblingElements.filter(elem => elem instanceof GraphEdge) as GraphEdge[]
                const boundaryTargets = siblingNodes.map(toBoundaryTarget)
                const boundaryTargetMap = boundaryTargets.reduce((acc, target) => {
                    const {nodeId} = target.data
                    if(nodeId){
                        acc[nodeId] = target
                    } 
                    return acc
                }, {} as Record<string, BoundaryTarget<GraphNode>>)
                const boundary = Boundary.createFromTargets<GraphNode|DOMRect>([...boundaryTargets, rectToBoundaryTarget(viewPort)])
                return {siblingNodes, siblingNodesMap, siblingEdges, boundaryTargets, boundaryTargetMap, boundary, viewPort}

            }

            const updateBoundaries = (graphInfo: ReturnType<typeof getGraphInfo>) => {
                const {left, top, right, bottom} = graphInfo.boundary
                const margin = 10
                minimapSvg.setAttribute("viewBox", `${left - margin} ${top - margin} ${right - left + margin * 2} ${bottom - top + margin * 2}`)
            }

            this.updateViewPort = debounceAnimationFrame(() => {
                const graphInfo = getGraphInfo();
                updateBoundaries(graphInfo)
                const {x, y, width, height} = graphInfo.viewPort
                minimapViewPort.querySelectorAll('rect').forEach(rect => {
                    rect.setAttribute("x", String(x))
                    rect.setAttribute("y", String(y))
                    rect.setAttribute("width", String(width))
                    rect.setAttribute("height", String(height))
                })
            })

            this.renderMinimap = debounceAnimationFrame(() => {
                if(!this.isConnected){
                    return
                }

                const graphInfo = getGraphInfo();
                updateBoundaries(graphInfo)
                const {siblingNodesMap, siblingEdges, boundaryTargets, viewPort} = graphInfo;
                minimapNodes.innerHTML = boundaryTargets.map(({left, right, top, bottom, data}) => {
                    const width = right - left
                    const height = bottom - top
                    return `<rect x="${left}" y="${top}" width="${width}" height="${height}" data-node-id="${data.nodeId}" rx="15" />`
                }).join("")

                minimapEdges.innerHTML = siblingEdges.map((edge) => {
                    

                    const {startNode, startOutput, endNode, endInput, color} = edge
                    if(startNode && startOutput && endNode && endInput){
                        const startNodeEl = siblingNodesMap[startNode]
                        const endNodeEl = siblingNodesMap[endNode]
                        const {x: x1, y:y1} = startNodeEl.getOutputConnectorEdgePoint(startOutput)
                        const {x: x2, y:y2} = endNodeEl.getInputConnectorEdgePoint(endInput)
                        return `<path data-edge="${startNode}::${startOutput}->${endNode}::${endInput}" data-start-node="${startNode}" data-start-output="${startOutput}" data-start-pos="${x1},${y1}" data-end-node="${endNode}" data-end-pos="${x2},${y2}" data-end-input="${endInput}" class="bg-edge" stroke="${color}" d="M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}"/>`
                    }
                    return ""


                }).join("")

                minimapViewPort.innerHTML = `<rect stroke="red" vector-effect="non-scaling-stroke" stroke-width="1" x="${viewPort.x}" y="${viewPort.y}" width="${viewPort.width}" height="${viewPort.height}" />`
            })


            this.updateNodePosition = (node: GraphNode) => {
                const {nodeId} = node;
                if(!nodeId) { return }
                const rect = minimapNodes.querySelector(`rect[data-node-id="${nodeId}"]`)
                if(!rect){ return }
                const graphInfo = getGraphInfo();
                updateBoundaries(graphInfo)

                const {left, right, top, bottom} = graphInfo.boundaryTargetMap[nodeId]
                const width = right - left
                const height = bottom - top
                rect.setAttribute("x", left.toString())
                rect.setAttribute("y", top.toString())
                rect.setAttribute("width", width.toString())
                rect.setAttribute("height", height.toString())

                minimapEdges.querySelectorAll(`[data-start-node="${nodeId}"]`).forEach(path => {
                    const {x: x1, y:y1} = node.getOutputConnectorEdgePoint(path.getAttribute("data-start-output") as string)
                    const [x2, y2] = path.getAttribute("data-end-pos")?.split(",").map(val => parseFloat(val)) || [0,0]
                    path.setAttribute("data-start-pos", `${x1},${y1}`)
                    path.setAttribute("d", `M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`)
                })
                minimapEdges.querySelectorAll(`[data-end-node="${nodeId}"]`).forEach(path => {
                    const [x1, y1] = path.getAttribute("data-start-pos")?.split(",").map(val => parseFloat(val)) || [0,0]
                    const {x: x2, y:y2} = node.getInputConnectorEdgePoint(path.getAttribute("data-end-input") as string)
                    path.setAttribute("data-end-pos", `${x2},${y2}`)
                    path.setAttribute("d", `M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`)
                })
                

                
            }

            
            minimapSvg.addEventListener("pointermove", (pointerEvent: PointerEvent) => {
                const { clientX, clientY } = pointerEvent
                pointerEvent.preventDefault()
          
                    // The cursor point, translated into svg coordinates
                const matrix = minimapSvg.getScreenCTM()
                if(matrix == null){
                    return
                }
                svgPt.x = clientX
                svgPt.y = clientY
                
                const {x, y} =  svgPt.matrixTransform(matrix.inverse());
                minimapCoordinates.innerText = `x:${x.toFixed(2)}; y:${y.toFixed(2)}`
            })

            minimapSvg.addEventListener("click", (pointerEvent: MouseEvent) => {
                const { clientX, clientY } = pointerEvent
                pointerEvent.preventDefault()
          
                    // The cursor point, translated into svg coordinates
                const matrix = minimapSvg.getScreenCTM()
                if(matrix == null){
                    return
                }
                svgPt.x = clientX
                svgPt.y = clientY
                
                const cursorpt =  svgPt.matrixTransform(matrix.inverse());
                const parent = this.parentElement as MaybeGraphElement

                const rect = parent.viewPortRect
                if(!rect){
                    return
                }

                const clientDx = pointerEvent.clientX - clientX
                const clientDy = pointerEvent.clientY - clientY
                parent.setAttribute("x", String(-(cursorpt.x - clientDx - rect.width/2)))
                parent.setAttribute("y", String(-(cursorpt.y - clientDy - rect.height/2)))

                requestAnimationFrame(() => {
                    const matrix = minimapSvg.getScreenCTM()
                    if(matrix == null){
                        return
                    }
                    const {x, y} =  svgPt.matrixTransform(matrix.inverse());
                    minimapCoordinates.innerText = `x:${x.toFixed(2)}; y:${y.toFixed(2)}`
                })            
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
        const nodePositionChangedCallback = (event: Event) => {
            const {target} = event
            if(target instanceof GraphNode){
                this.updateNodePosition(target)
            }
        }

        const viewportUpdatedCallback = () => this.updateViewPort()

        parentElement.addEventListener("nodePositionChanged", nodePositionChangedCallback)
        parentElement.addEventListener("viewportChange", viewportUpdatedCallback)
        resizeObserver.observe(parentElement)
        this.removeParentListeners = () => {
            parentElement.removeEventListener("nodePositionChanged", nodePositionChangedCallback)
            parentElement.removeEventListener("viewportChange", viewportUpdatedCallback)
            resizeObserver.unobserve(parentElement)
        }
        this.renderMinimap();
    }

    disconnectedCallback(){
        this.removeParentListeners()
        this.removeParentListeners = () => {}
    }

}
