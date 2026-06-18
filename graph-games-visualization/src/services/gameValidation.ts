export interface BaseMenuState {
    source: string,
    vertices: number | "";
    edges: number | "";
    file: File | null;
    drawnG1: any[];
    drawnG2: any[];
    mode: string;
}

export const validateRandom = (vertices: number | "", edges: number | "", settings: any) => {
    if (vertices === "" || edges === "") {
        throw new Error("Please insert the number of vertices and edges!");
    }

    settings.n = vertices;
    settings.m = edges;

    return settings;
};

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