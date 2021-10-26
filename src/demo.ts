const mod = import ("./component/graph/define-x-graph-components.ts")

await import( "./util/css/html-implementation.ts")
await import( "./util/html/html-implementation.ts")
const {adapt} = await import('./adapter/text-graph-to-visual/graph-text-to-visual.adapter.ts')

import {Graph} from './model/graph-text-model.ts'

const graph: Graph = {
    nodes: [{
        id: "1",
        name: "grep",
        type: "grep",
        values: {
            'ignore case': true
        }
    }, {
        id: "2",
        name: "sed",
        type: "sed",
        values: {}
    }, {
        id: "3",
        name: "grep",
        type: "grep",
        values: {}
    }, {
        id: "4",
        name: "sed",
        type: "sed",
        values: {}
    }, {
        id: "5",
        name: "sed",
        type: "sed",
        values: {}
    }],
    edges:[{
        startNode: "1",
        startOutput: "output",
        endNode: "2",
        endInput: "input"
    }, {
        startNode: "3",
        startOutput: "output",
        endNode: "4",
        endInput: "input"
    }, {
        startNode: "3",
        startOutput: "error",
        endNode: "5",
        endInput: "input"
    }],
    nodeTypes: {
        "grep": {
            name: "grep",
            configration: [{
                field: "pattern",
                configType: "input"
            }, {
                field: "ignore case",
                configType: "checkbox"

            }, {
                field: 'syntax',
                configType: 'select',
                values: ['extended regexp', 'fixed strings', 'basic-regexp', 'perl-regexp']

            }],
            inputs: [{
                color: "green",
                name: "input"
            }],
            outputs: [{
                color: "green",
                name: "output"
            },{
                color: "red",
                name: "error"
            }]
        },

        "sed": {
            name: "sed",
            configration: [],
            inputs: [{
                color: "green",
                name: "input"
            }],
            outputs: [{
                color: "green",
                name: "output"
            },{
                color: "red",
                name: "error"
            }]
        }
    }
} 

console.log(graph);
console.log(adapt(graph));

await mod
document.body.insertAdjacentHTML("beforeend", adapt(graph))
