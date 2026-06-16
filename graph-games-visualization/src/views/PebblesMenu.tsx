import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraphEditor } from "../components/graphs/GraphEditor";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Subtitle } from "../components/ui/Titles";
import { Label, Input, Select } from "../components/ui/Wrappers";

// similar to EFMenu
function PebblesMenu() {
    const navigate = useNavigate();
    const [V, setV] = useState<number | "">("");
    const [E, setE] = useState<number | "">("");
    const [k, setK] = useState<number | "">("");
    const [errorMessage, setErrorMessage] = useState("");
    const [mode, setMode] = useState("human");
    const [source, setSource] = useState("random");
    const [file, setFile] = useState<File | null>(null);
    const [drawnG1, setDrawnG1] = useState<any[]>([]);
    const [drawnG2, setDrawnG2] = useState<any[]>([]);

    const handler = async () => {
        try {
            setErrorMessage("");
            
            let settings: any = { 
                k: k, 
                mode: mode, 
                source: source 
            };

            if (source === "random") {
                if (V === "" || E === "") {
                    throw new Error("Please insert the number of vertices and edges!");
                }
                settings.n = V;
                settings.m = E;
            } else if (source === "file") {
                if (!file) {
                    throw new Error("Please upload a file!");
                } 
                try {
                    const text = await file.text();
                    settings.custom = JSON.parse(text);
                } catch (e) {
                    throw new Error("Invalid format, upload a valid JSON.");
                }
            } else if (source === "draw") {
                if (drawnG1.length === 0 || drawnG2.length === 0) {
                    throw new Error("Please draw both graphs!");
                }
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
                settings.custom = {
                    g1: formatGraph(drawnG1),
                    g2: formatGraph(drawnG2)
                };
                settings.source = "file";   
            }

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
            navigate("/pebbles", {
              state: {
                game_id: data.game_id, 
                g1: data.g1, 
                g2: data.g2, 
                k: k, 
                mode: mode
              }
            });
        } catch (e: any) {
          setErrorMessage(e.message);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 box-border bg-gray-50">
           <Subtitle className="text-3xl">Settings</Subtitle>
            
            <Card className="gap-5">
                <Label>
                    Graph source:
                    <Select 
                        value={source} 
                        onChange={(e) => setSource(e.target.value)}
                    >
                        <option value="random">Randomly generated</option>
                        <option value="file">Uploaded from file</option>
                        <option value="draw">Draw</option>
                    </Select>
                </Label>

                {source === "random" && (
                    <div className="flex gap-4 w-full">
                        <Label>
                            Vertices (n):
                            <Input 
                                type="number" 
                                min="1" 
                                max="10" 
                                value={V} 
                                onChange={(e) => setV(e.target.value === "" ? "" : Number(e.target.value))} 
                            />
                        </Label>
                        <Label>
                            Edges (m):
                            <Input 
                                type="number" 
                                min="0" 
                                max={V === "" ? 0 : V * V} 
                                value={E} 
                                onChange={(e) => setE(e.target.value === "" ? "" : Number(e.target.value))} 
                            />
                        </Label>
                    </div>
                )}
                {source === "file" && (
                    <Label>
                        <Input 
                            type="file" 
                            accept=".json"  
                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            className="p-0 border-none shadow-none focus:ring-0 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                        />
                    </Label>
                )}
                {source === "draw" && (
                    <div className="flex flex-col gap-4 w-full">
                        <div className="w-full">
                            <h3 className="font-bold text-center text-blue-600 mb-2">Draw G1</h3>
                            <GraphEditor 
                                prefix="v" 
                                onUpdate={setDrawnG1} 
                            />
                        </div>
                        <div className="w-full mt-4">
                            <h3 className="font-bold text-center text-blue-600 mb-2">Draw G2</h3>
                            <GraphEditor 
                                prefix="u" 
                                onUpdate={setDrawnG2} 
                            />
                        </div>
                    </div>
                )}

                <Label>
                    Number of pebbles (k):
                    <Input 
                        type="number" 
                        min="2" 
                        max="4" 
                        value={k} 
                        onChange={(e) => setK(Number(e.target.value))} 
                    />
                </Label>
        
                <Label>
                    Game mode:
                    <Select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                    >
                        <option value="human">Human vs Human</option>
                        <option value="ai">Human vs AI</option>
                    </Select>
                </Label>

                {errorMessage && <div className="text-red-500 font-bold text-center">{errorMessage}</div>}
                
                <div className="flex flex-col gap-3 w-full mt-2">
                    <Button onClick={handler}>Start game</Button>
                    <Button 
                        onClick={() => navigate("/")}
                        className="bg-gray-200 text-gray-800 hover:bg-gray-300 shadow-none"
                    >
                        Back to menu
                    </Button>
                </div>
            </Card>
        </div> 
    );
}

export default PebblesMenu;
