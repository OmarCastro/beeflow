export async function define(tagName: string) {
    const { Graph } = await import('./graph.element.ts')
    const { GraphNode } = await import('./subcomponent/graph-node/graph-node.element.ts')
    const { GraphNodeInput } = await import('./subcomponent/graph-node-input/graph-node-input.element.ts')
    const { GraphNodeOutput } = await import('./subcomponent/graph-node-output/graph-node-output.element.ts')
    const { GraphEdge } = await import('./subcomponent/graph-edge/graph-edge.element.ts')
    customElements.define(tagName, Graph)
    customElements.define(`${tagName}--node`, GraphNode)
    customElements.define(`${tagName}--node-input`, GraphNodeInput)
    customElements.define(`${tagName}--node-output`, GraphNodeOutput)
    customElements.define(`${tagName}--edge`, GraphEdge)
}

