import type {Graph} from '../../model/graph-text-model.ts'


const attrsTohtmlAttrs = (attrs: Record<string, string>) => Object.entries(attrs).map(([key, val]) => ` ${key}="${val.replaceAll('"', '&quot;')}"`).join("")


const tag = (tag: string) => (attrs: Record<string, string>|string|void, ...html: string[]) => attrs == null ? 
    `<${tag}></${tag}>` : typeof attrs === "string" ? 
        `<${tag}>${attrs}${html.join("")}</${tag}>` :
        `<${tag}${attrsTohtmlAttrs(attrs)}>${html.join("")}</${tag}>`


export function adapt(graph: Graph, {prefix = "x-graph", useMinimap = true} = {}){

    const graphTag = tag(prefix)
    const nodeTag = tag(`${prefix}--node`)
    const nodeInputTag = tag(`${prefix}--node-input`)
    const nodeOutputTag = tag(`${prefix}--node-output`)
    const edgeTag = tag(`${prefix}--edge`)
    const minimapTag = tag(`${prefix}--minimap`)
    const template = tag('template')
    const label = tag('label')
    const span = tag('span')
    const input = tag('input')
    const select = tag('select')
    const option = tag('option')

    const {nodes, edges, nodeTypes} = graph

    const nodeHtml = nodes.map(node => nodeTag({type: node.type, 'node-id': node.id})).join("")
    const edgeHtml = edges.map(edge => {
        const startNode = nodes.find(node => node.id === edge.startNode);
        const type = nodeTypes[startNode?.type || '']
        if(type == null){
            return ""
        }
        const color = type.outputs.find(output => output.name === edge.startOutput)?.color || 'green'

        return edgeTag({'start-node': edge.startNode, 'start-output': edge.startOutput, 'end-node': edge.endNode, 'end-input': edge.endInput, 'edge-color':color}, "")
    }).join("")


    const nodeTemplatesHtml = Object.entries(nodeTypes).map(([typeName, type]) => {
        return template({'data-of-node-type': typeName}, 
            type.inputs.map(input => nodeInputTag({name: input.name, color: input.color})).join(""),
            type.outputs.map(output => nodeOutputTag({name: output.name, color: output.color})).join(""),
            type.configration.map(config => {
                switch(config.configType){
                    case "input": return label(span(config.field) , input({}))
                    case "checkbox": return label(input({type: "checkbox"}), span(config.field))
                    case "select": return label(span(config.field), select({},...config.values.map(val => option({value: val}, val))))
                }
        }).join(""))
    }).join("")

    const minimapHtml = useMinimap ? minimapTag() : ''

    return graphTag({}, nodeHtml, edgeHtml, nodeTemplatesHtml, minimapHtml)
}

export default adapt