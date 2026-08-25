// graph types available for users
export type GraphTemplate = "random" | "clique" | "star" | "path" | "cycle";

// generates an array of edges, based on a specific graph
// n is the given number vertices
export function generateTemplate(type: GraphTemplate, n: number): [number, number][] {
    const edges: [number, number][] = [];

    switch (type) {
        case "clique":
            // full graph - there has to be an edge between every 2 nodes
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    edges.push([i, j]);
                }
            }
            break;
        case "star":
            // star - 0 is a center node, the rest is connected with it
            for (let i = 1; i < n; i++) {
                edges.push([0, i]);
            }
            break;
        case "path":
            // path - linear sequence
            for (let i = 0; i < n - 1; i++) {
                edges.push([i, i + 1]);
            }
            break;
        case "cycle":
            // cycle - path closed into a loop
            if (n >= 3) {
                for (let i = 0; i < n - 1; i++) {
                    edges.push([i, i + 1]);
                }
                edges.push([n - 1, 0]);
            } else if (n == 2) {
                edges.push([0, 1]);
            }
            break;
        case "random":
        default:
            break;
    }

    return edges;
}