import { type BaseMenuState, validateRandom, validateFile, validateDraw } from "./gameValidation";

export const buildSettings = async (state: BaseMenuState) => {
    let settings: any = {
        mode: state.mode,
        source: state.source
    };

    if (state.source === "random") {
        settings = validateRandom(state.vertices, state.edges, settings);
    } else if (state.source === "file") {
        settings = await validateFile(state.file, settings);
    } else if (state.source === "draw") {
        settings = validateDraw(state.drawnG1, state.drawnG2, settings);
    }

    return settings;
};

export const EFGameSession = async (state: BaseMenuState, rounds: number) => {
    const settings = await buildSettings(state);
    settings.rounds = rounds;

    const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'
    const response = await fetch(`${apiURL}/generate-ef`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Server error!");
    }

    return data;
}

export const PebblesGameSession = async (state: BaseMenuState, pebbles: number | "") => {
    if (pebbles === "" || pebbles < 2 || pebbles > 4) {
        throw new Error("Number of pebbles must be between 2 and 4!");
    }

    const settings = await buildSettings(state);
    settings.k = pebbles;

    const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'
    const response = await fetch(`${apiURL}/generate-pebbles`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Server error!");
    }

    return data;
}

export const EFMove = async (gameId: string, graphId: string, nodeId: string) => {
    const url = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    const response = await fetch(`${url}/move`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            game_id: gameId, 
            graph_id: graphId, 
            node_id: nodeId 
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Server error");
    }

    return data;
}

export const PebbleMove = async (gameId: string, graphId: string, nodeId: string, pebbleId: number) => {
    const url = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    const response = await fetch(`${url}/move-pebble`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            game_id: gameId, 
            graph_id: graphId, 
            node_id: nodeId,
            pebble_id: pebbleId
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Server error");
    }

    return data;
}