// basic menu attributes, both EF and Pebbles games should have them
export interface BaseMenuState {
    source: string,
    vertices: number | "";
    edges: number | "";
    file: File | null;
    drawnG1: any[];
    drawnG2: any[];
    mode: string;
}

// simple random graph validation, if no vertices or edges are given, it throws an error
export const validateRandom = (vertices: number | "", edges: number | "", settings: any) => {
    if (vertices === "" || edges === "") {
        throw new Error("Please insert the number of vertices and edges!");
    }

    settings.n = vertices;
    settings.m = edges;

    return settings;
};

// similar file validation, uses file.text() to extract file content
export const validateFile = async(file: File | null, settings: any) => {
    if (!file) {
        throw new Error("Please upload a file!");
    }

    try {
        const text = await file.text();
        settings.custom = JSON.parse(text);
    } catch (e) {
        throw new Error("Invalid format, upload a valid JSON!");
    }

    return settings;
};

// helper function created to format Cytoscape elements into backend schema
const formatGraph = (elements: any[]) => ({
    nodes: elements.filter(e => e.group === "nodes").map(e => ({
        data: e.data,
        position: e.position
    })),
    edges: elements.filter(e => e.group === "edges").map(e => ({
        data: e.data,
        position: e.position
    }))
});

// draw validation formats drawn graphs to a file format, because it will behave the same in backend
export const validateDraw = (drawnG1: any[], drawnG2: any[], settings: any) => {
    if (drawnG1.length === 0 || drawnG2.length === 0) {
        throw new Error("Please draw both graphs!");
    }

    settings.custom = {
        g1: formatGraph(drawnG1),
        g2: formatGraph(drawnG2)
    };
    settings.source = "file";

    return settings;
}