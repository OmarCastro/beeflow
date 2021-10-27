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
    private updateNodePosition: (node: GraphNode) => void = () => {};


    constructor(){
        super()
        const shadowRoot = this.attachShadow({mode: "open"})
        loadTemplate().then(template => {
            shadowRoot.append(document.importNode(template.content, true))    

            const minimapSvg = shadowRoot.querySelector(".minimap__svg") as SVGElement
            const minimapNodes = shadowRoot.querySelector(".minimap__nodes") as SVGGElement
            const minimapEdges = shadowRoot.querySelector(".minimap__edges") as SVGGElement
            


            const getGraphInfo = () => {
                const siblingElements = getSiblings(this);
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
                const boundary = Boundary.createFromTargets(boundaryTargets)
                return {siblingNodes, siblingNodesMap, siblingEdges, boundaryTargets, boundaryTargetMap, boundary}

            }

            const updateBoundaries = (graphInfo: ReturnType<typeof getGraphInfo>) => {
                const {left, top, rigth, bottom} = graphInfo.boundary
                const margin = 10
                minimapSvg.setAttribute("viewBox", `${left - margin} ${top - margin} ${rigth - left + margin * 2} ${bottom - top + margin * 2}`)

            }

            this.renderMinimap = debounceAnimationFrame(() => {
                if(!this.isConnected){
                    return
                }

                const graphInfo = getGraphInfo();
                updateBoundaries(graphInfo)
                const {siblingNodesMap, siblingEdges, boundaryTargets} = graphInfo;
                minimapNodes.innerHTML = boundaryTargets.map(({left, rigth, top, bottom, data}) => {
                    const width = rigth - left
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

            })

            this.updateNodePosition = (node: GraphNode) => {
                const {nodeId} = node;
                if(!nodeId) { return }
                const rect = minimapNodes.querySelector(`rect[data-node-id="${nodeId}"]`)
                if(!rect){ return }
                const graphInfo = getGraphInfo();
                updateBoundaries(graphInfo)

                const {left, rigth, top, bottom} = graphInfo.boundaryTargetMap[nodeId]
                const width = rigth - left
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
                this.updateNodePosition(target)
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
