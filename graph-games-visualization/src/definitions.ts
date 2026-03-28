export interface Vertex {
    id: string;
    color: string;
}

export interface Edge {
    source: string;
    target: string;
    color: string;
}

export interface Graph {
    V: Map<string, Vertex>;
    adjacencyList: Map<string, Edge[]>;
}

export function newVertice(id: string, color: string): Vertex {
    return { id: id, color: color };
}

export function newEdge(sourceId: string, targetId: string, color: string): Edge {
    return { source: sourceId, target: targetId, color: color};
}

export function generateRandomGraph(n: number, m: number): Graph { //n - number of vertices, m - number of edges
    // checking if given m doesn't exceed the maximum number of edges
    const maxEdges = n * n; // should be n * (n - 1) but we allow a->a edges
    if (m > maxEdges) {
        throw new Error(`Error: for ${n} vertices maximum number of edges is ${maxEdges}`);
    }
    
    // creating an object that will store our generated graph
    const graph: Graph = {
        V: new Map<string, Vertex>(),
        adjacencyList: new Map<string, Edge[]>()
    };
    const colors: string[] = ['a', 'b', 'c', 'd', 'e', 'f'];

    // generating n vertices with their ids and colors
    for (let i = 1; i <= n; i++) {
        const v_id = `v${i}`;
        const color = colors[Math.floor(Math.random() * colors.length)];
        graph.V.set(v_id, newVertice(v_id, color));
        graph.adjacencyList.set(v_id, []);
    }

    // generating m edges with their ids (source -> target) and colors
    const currentEdges = new Set<string>();
    let addedEdges = 0;
    const ids = Array.from(graph.V.keys());
    while (addedEdges < m) {
        const sourceId = ids[Math.floor(Math.random() * ids.length)];
        const targetId = ids[Math.floor(Math.random() * ids.length)];
        const key = `${sourceId} -> ${targetId}`;
        if (currentEdges.has(key)) {
            continue;
        }
        const color = colors[Math.floor(Math.random() * colors.length)];
        const e = newEdge(sourceId, targetId, color);
        graph.adjacencyList.get(sourceId)!.push(e); // ! - never null
        currentEdges.add(key);
        addedEdges++;
    }

    return graph;
}

// cytoscape can read only simple objects, not maps, dictionaries or classes
// so we create a simple parser
export function parseToCytoscope(graph: Graph): any[] {
    const parsed_graph: any[] = [];
    for (const [id, data] of graph.V.entries()) {
        parsed_graph.push({ data: { id: id, color: data.color } });
    }
    for (const [sourceId, edges] of graph.adjacencyList.entries()) {
        for (const e of edges) {
            parsed_graph.push({ data: {id: `${e.source}->${e.target}`, source: e.source, target: e.target, color: e.color } });
        }
    }
    return parsed_graph;
}