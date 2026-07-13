export type GraphTemplate = "random" | "clique" | "star" | "path" | "cycle";

export function generateTemplate(type: GraphTemplate, n: number): [number, number][] {
    const edges: [number, number][] = [];

    switch (type) {
        case "clique":
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    edges.push([i, j]);
                }
            }
            break;
        case "star": 
            for (let i = 1; i < n; i++) {
                edges.push([0, i]);
            }
            break;
        case "path":
            for (let i = 0; i < n - 1; i++) {
                edges.push([i, i + 1]);
            }
            break;
        case "cycle":
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