
export interface Graph {
    nodes: Node[]
    edges: Edge[]
}

export interface CalcutatedGraph {
    nodes: ReadonlyArray<Readonly<CalculatedNode>>
    edges: ReadonlyArray<Readonly<Edge>>
}

export interface Node {
    name: string
    width: number
    height: number

}

export interface CalculatedNode extends Node {
    x: number
    y: number
}

export type NodeConnectionMap = Record<string, string[]>
export type NodeMap = Record<string, Node>


const unsortableNodes = Symbol('unsortable')

export interface CalculatingGraph {
  nodes: ReadonlyArray<Readonly<Node>>
  edges: ReadonlyArray<Readonly<Edge>>
  nodeMap?: NodeMap
  nodeOutputMap?: NodeConnectionMap
  nodeInputMap?: NodeConnectionMap
  sortedNodes?: Node[] | typeof unsortableNodes
  nodeRanks?: Record<string, number>
  nodeIslandMap?: Record<string, number>
  rootNodes?: ReadonlyArray<Node>
  leafNodes?: ReadonlyArray<Node>
  ranksWithIslandsNodes?: {
    ranks: Record<string, number>
    islands: ReadonlyArray<ReadonlyArray<Readonly<Node>>>
  }
  leafPaths?: ReadonlyArray<Node[]>
  horizontalLayoutRankWidth?: ReadonlyArray<number>

  isAcyclic?: boolean
}


export interface Edge {
    start: string
    end: string
}




/**
 * Tranforms the node list to a map if 'node name' -> node
 * @returns map of node name to its respective node
 */
const calculateNodeMap = (graph: CalculatingGraph) => graph.nodes.reduce((acc, node) => ({...acc, [node.name]: node}), {})


/**
 * Calculates the outgoing edge targets for each node
 * @returns map of node name to a list of node names of outgoing edge targets  
 */
function calculateNodeOutputMap(graph: CalculatingGraph) {
  const nodeOutputMap = graph.nodes.reduce((acc, node) => ({ ...acc, [node.name]: [] }), {} as NodeConnectionMap);
  return graph.edges.reduce((acc, {start, end}) => {
    if(Array.isArray(acc[start])){
        acc[start].push(end)
    }
    return acc;
  }, nodeOutputMap)
}


/**
 * Calculates the incoming edge sources for each node
 * @returns map of node name to a list of node names of incoming edge sources
 */
function calculateNodeInputMap(graph: CalculatingGraph) {
  const nodeInputMap = graph.nodes.reduce((acc, node) => ({ ...acc, [node.name]: [] }), {} as NodeConnectionMap);
  return graph.edges.reduce((acc, {start, end}) => {
      if(Array.isArray(acc[end])){
          acc[end].push(start)
      }
      return acc;
  }, nodeInputMap)
}


/**
 * Calculates the root nodes, root nodes do not have incoming edges
 * @returns array of root graph nodes
 */
function calculateRootNodes(graph: CalculatingGraph){
  const nodeInputMap = getNodeInputMap(graph);
  return graph.nodes.filter(node => nodeInputMap[node.name].length === 0)
}

/**
 * Calculates the leaf nodes, leaf nodes do not have outgoing edges
 * @returns array of leaf graph nodes
 */
function calculateLeafNodes(graph: CalculatingGraph){
  const nodeOutputMap = getNodeOutputMap(graph);
  return graph.nodes.filter(node => nodeOutputMap[node.name].length === 0)
}

/**
 * Sorts graph nodes topologically using 'Depth first search' algorithm, as described in http://en.wikipedia.org/wiki/Topological_sorting
 * this sorting is not inplace, so the original graph node list is not affected
 * @returns the sorted node array, the graph is not af
 */
function sortGraphNodes(graph: CalculatingGraph): NonNullable<CalculatingGraph['sortedNodes']> {
  if(graph.sortedNodes != null){
    return graph.sortedNodes;
  }

  const { nodes } = graph;
  const nodeMap = getNodeMap(graph)
  const nodeOutputMap = getNodeOutputMap(graph)
  const sorted = [] as Node[];
  const marks = {} as Record<string, string>;

    // DFS in an iterative way
    type Action = [(node: Node) => void, Node]
    const actions = nodes.map(node => [visitUnmarked, node] as Action)  
    while(isNonEmptyArray(actions)){
      const [method, node] = actions.pop()
      try { method(node) }
      catch { return graph.sortedNodes = unsortableNodes }  
    }

  
  return graph.sortedNodes = sorted;
  
  function visitUnmarked(node: Node){
    if(!marks[node.name]){
      visit(node)
    }
  }

  function visit(node: Node) {
    const {name} = node
    if (marks[name] === 'temp')
      throw new Error("There is a cycle in the graph. It is not possible to derive a topological sort.");
    else if (marks[name])
      return;
    marks[name] = 'temp';
    actions.push([afterChildVisit, node], ...nodeOutputMap[name].map((end) => [visit, nodeMap[end]] as Action))
  }

  function afterChildVisit(node: Node){
    marks[node.name] = 'perm';
    sorted.push(node);
  }
}


/**
 * Ranks the nodes topologically and detect islands.
 * This method was created because ranking nodes and island detection
 * uses the same algorithm, and for layout, it is used both result.
 * The overhead is minimal compared to traversing the graph twice.
 * @returns a 2d array of nodes, one array for each island, and a map of node name with its following rank number
 */
function calculateRankswithIslandsNodes(graph: CalculatingGraph){
  const { nodes } = graph;
  const nodeMap = getNodeMap(graph)
  const nodeOutputMap = getNodeOutputMap(graph)
  const ranks = {} as Record<string, number>;
  const marks = {} as Record<string, string>;
  const sets = new Set() as Set<Set<string>>;

  type VisitData = {set: Set<string>, rank: number}

  // DFS in an iterative way
  type Action = [(node: Node, data: VisitData) => void, Node, VisitData]
  const actions = nodes.map(node => [visitUnmarked, node, {set: new Set(), rank: 0 }] as Action)
                       // in descending order, to visit nodes with least number of outgoing edges first
                       .sort((a, b) => nodeOutputMap[b[1].name].length - nodeOutputMap[a[1].name].length)
  while(isNonEmptyArray(actions)){
    const [method, node, data] = actions.pop()
    method(node, data)
  }
  
  return {
    ranks, 
    islands: Array.from(sets).map(set => Array.from(set).map(name => nodeMap[name]))
  };

  function visitUnmarked(node: Node, data: VisitData){
    if(!marks[node.name]){
      visit(node, data)
    }
  }

  function visit(node: Node, data: VisitData) {
    const {name} = node

    if(marks[name] === 'temp'){
      return
    }

    const otherSets = Array.from(sets).filter(set => set.has(name) && data.set != set)
    if(otherSets.length > 0){
      const diffRank = data.rank - ranks[name]
      const merged = new Set(otherSets.flatMap(set => Array.from(set)))
      if(diffRank > 0){
        merged.forEach(name => {
          ranks[name] += diffRank
        })
      } else {
        data.rank -= diffRank
        data.set.forEach(name => {
          ranks[name] -= diffRank
        })
      }
      data.set.forEach(name => merged.add(name)) 
      sets.delete(data.set)
      otherSets.forEach(set => sets.delete(set))
      data.set = merged
      return
    }

    ranks[name] = data.rank;
    marks[name] = 'temp'
    data.set.add(name)
    data.rank += 1
    actions.push([afterChildVisit, node, data], ...nodeOutputMap[name].map((end) => [visit, nodeMap[end], data] as Action))
  }

  function afterChildVisit(node: Node, data: VisitData){
    marks[node.name] = 'perm';
    sets.add(data.set);
  }
}

/**
 * Ranks the nodes topologically
 * @returns map of node name with its following rank number
 */
function calculateNodeRanks(graph: CalculatingGraph){
  return getRankswithIslandsNodes(graph).ranks
}


/**
 * Detect islands and shows which island each node is
 * @returns map of node name with its following island
 */
function calculateNodeIslandMap(graph: CalculatingGraph){
  const islands = getRankswithIslandsNodes(graph).islands
  return islands.reduce((acc, island, index) => {
    island.forEach(node => acc[node.name] = index);
    return acc
  }, {} as Record<string, number>)
}


/**
 * Detects if the graph is acyclic
 * @param graph 
 * @returns map of node name with its following island
 */
function calculateIsGraphAcyclic(graph: CalculatingGraph) {
  const sortedNodes = sortGraphNodes(graph)
  return sortedNodes === unsortableNodes
}


/**
 * Ranks the nodes topologically and get the max width of each rank
 * @returns map of node name with its following rank number
 */
function calculateHorizontalLayoutRankWidths(graph: CalculatingGraph) {
  const nodeRanks = getNodeRanks(graph)
  return graph.nodes.reduce((acc, node) => {
    const nodeRank = nodeRanks[node.name]
    acc[nodeRank] = acc[nodeRank] ? Math.max(node.width, acc[nodeRank]) : node.width
    return acc
  }, [] as number[]);
}


export const getNodeMap = (graph: CalculatingGraph) => graph.nodeMap ??= calculateNodeMap(graph)
export const getNodeOutputMap = (graph: CalculatingGraph) => graph.nodeOutputMap ??= calculateNodeOutputMap(graph)
export const getNodeInputMap = (graph: CalculatingGraph) => graph.nodeInputMap ??= calculateNodeInputMap(graph)
export const getRootNodes = (graph: CalculatingGraph) => graph.rootNodes ??= calculateRootNodes(graph)
export const getLeafNodes = (graph: CalculatingGraph) => graph.leafNodes ??= calculateLeafNodes(graph)
export const isGraphAcyclic = (graph: CalculatingGraph) => graph.isAcyclic ?? calculateIsGraphAcyclic(graph)
export const getNodeIslandMap = (graph: CalculatingGraph) => graph.nodeIslandMap ??= calculateNodeIslandMap(graph)
export const getHorizontalLayoutRankWidths = (graph: CalculatingGraph) => graph.horizontalLayoutRankWidth ?? calculateHorizontalLayoutRankWidths(graph)
export const getRankswithIslandsNodes = (graph: CalculatingGraph) => graph.ranksWithIslandsNodes ??= calculateRankswithIslandsNodes(graph)
export const getNodeRanks = (graph: CalculatingGraph) => graph.nodeRanks ??= calculateNodeRanks(graph)



export function calculateLayout(graph: Graph): CalcutatedGraph{
  const nodeRanks = getNodeRanks(graph)
  const nodeIslandMap = getNodeIslandMap(graph)
  const rankWidth = getHorizontalLayoutRankWidths(graph);
  const rankSeaprator = 100
  const marginX = 100
  const marginY = 100
  const nodeSeaprator = 100
  const rankXPosition = rankWidth.reduce(({result, nextPosition}, width) => ({
    result: [...result, nextPosition],
    nextPosition: nextPosition + width + rankSeaprator
  }), {
    result: [] as number[],
    nextPosition: 0
  }).result;

  const nodesYPositions = [...graph.nodes]
    .sort((a, b) => nodeIslandMap[a.name] - nodeIslandMap[b.name])
    .reduce((acc, node) => {
      const {name, height} = node
      const {rankYPositions, positions} = acc
      const nodeRank = nodeRanks[name]
      rankYPositions[nodeRank] ??= 0 
      positions[name] = rankYPositions[nodeRank]
      rankYPositions[nodeRank] += height + nodeSeaprator
      return acc
    }, {positions: {} as Record<string, number>, rankYPositions: {} as Record<number, number>} ).positions

  const calculatedNodes: CalculatedNode[] = graph.nodes.map(node => ({
    ...node,
    x: (rankXPosition[nodeRanks[node.name]] || 0) + marginX,
    y: nodesYPositions[node.name] + marginY
  }));

  return {
    ...graph,
    nodes: calculatedNodes
  }
}


interface NonEmptyArray<T> extends Array<T>{
  0: T
  shift(): T
  pop(): T
}


function isNonEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0;
}