import { type BaseMenuState, validateRandom, validateFile, validateDraw } from "./gameValidation";

type EnhancedState = BaseMenuState & { g1?: any, g2?: any };

// adjusting game settings based on chosen source
// also choosing the proper validation
export const buildSettings = async (state: EnhancedState) => {
    let settings: any = {
        mode: state.mode,
        source: state.source
    };

    if (state.source === "random") {
        if (state.g1 && state.g2) { // if templates are given
            settings.g1 = state.g1;
            settings.g2 = state.g2;
        } else {
            settings = validateRandom(state.vertices, state.edges, settings);
        }
    } else if (state.source === "file") {
        settings = await validateFile(state.file, settings);
    } else if (state.source === "draw") {
        settings = validateDraw(state.drawnG1, state.drawnG2, settings);
    }

    return settings;
};

// creating EF game session
export const EFGameSession = async (state: EnhancedState, rounds: number) => {
    const settings = await buildSettings(state);
    settings.rounds = rounds;

    // env variable for API_URL for production, localhost for local playing
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

// similar creating Pebbles session
export const PebblesGameSession = async (state: EnhancedState, pebbles: number | "") => {
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

// the move and analysis functions behave in the same way as above

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

export const getEFAnalysis = async (gameId: string) => {
    const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
    const response = await fetch(`${url}/analyze-ef`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ game_id: gameId })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Server error during analysis");
    }

    return data;
}

export const getPebblesAnalysis = async (gameId: string) => {
    const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
    const response = await fetch(`${url}/analyze-pebbles`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ game_id: gameId })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Server error during analysis");
    }

    return data;
}