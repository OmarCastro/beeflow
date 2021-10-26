
export interface Graph {
    nodes: Node[]
    edges: Edge[]
    nodeTypes: Record<string, NodeType>
}



export interface Node {
    id: string
    name: string
    values: Record<string, string | number | boolean>
    type: string
}

export interface Edge {
    startNode: string
    startOutput: string
    endNode: string
    endInput: string

}

export interface NodeType {
    name: string
    configration: NodeTypeConfiguration[]
    inputs: NodeTypeInput[]
    outputs: NodeTypeOutput[]
}


export type NodeTypeConfiguration = InputNodeTypeConfiguration | CheckBoxNodeTypeConfiguration | SelectNodeTypeConfiguration

export interface InputNodeTypeConfiguration {
    field: string
    configType: "input"
}

export interface CheckBoxNodeTypeConfiguration {
    field: string
    configType: "checkbox"
}

export interface SelectNodeTypeConfiguration {
    field: string
    configType: "select"
    values: string[]
}



export interface NodeTypeInput {
    name: string
    color: string 
}


export interface NodeTypeOutput {
    name: string
    color: string 
}