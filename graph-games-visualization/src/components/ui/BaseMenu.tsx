import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { GraphEditor } from "../graphs/GraphEditor";
import { Button } from "./Button";
import { Card } from "./Card";
import { Subtitle } from "./Titles";
import { Label, Input, Select } from "./Wrappers";
import { type BaseMenuState } from "../../services/gameValidation";

interface BaseMenuProps {
    title: string;
    children: ReactNode;
    onStart: (baseState: BaseMenuState) => Promise<void>;
}

export function BaseMenu({ title, children, onStart }: BaseMenuProps) {
    const navigate = useNavigate();
    const [vertices, setVertices] = useState<number | "">("");
    const [edges, setEdges] = useState<number | "">("");
    const [errorMessage, setErrorMessage] = useState("");
    const [mode, setMode] = useState("human");
    const [source, setSource] = useState("random");
    const [file, setFile] = useState<File | null>(null);
    const [drawnG1, setDrawnG1] = useState<any[]>([]);
    const [drawnG2, setDrawnG2] = useState<any[]>([]);

    const handler = async () => {
        try {
            setErrorMessage("");
            const currentState: BaseMenuState = {
                source, vertices, edges, file, drawnG1, drawnG2, mode
            };
            await onStart(currentState);
        } catch (e: any) {
            setErrorMessage(e.message);
        }
    };

    const downloadSample = () => {
        const link = document.createElement("a");
        link.href = "/example.json";
        link.download = "example.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 box-border bg-gray-50">
           <Subtitle className="text-3xl">{title}</Subtitle>
            
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
                                value={vertices} 
                                onChange={(e) => setVertices(e.target.value === "" ? "" : Number(e.target.value))} 
                            />
                        </Label>
                        <Label>
                            Edges (m):
                            <Input 
                                type="number" 
                                min="0" 
                                max={vertices === "" ? 0 : vertices * vertices} 
                                value={edges} 
                                onChange={(e) => setEdges(e.target.value === "" ? "" : Number(e.target.value))} 
                            />
                        </Label>
                    </div>
                )}

                {source === "random" && children}

                {source === "file" && (
                    <div className="flex flex-col gap-2">
                        <Label>
                            Upload JSON file:
                            <Input 
                                type="file" 
                                accept=".json"  
                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                className="p-0 border-none shadow-none focus:ring-0 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                            />
                        </Label>
                        <Button
                            onClick={downloadSample}
                            className="bg-green-600 hover:bg-green-700 text-sm py-1"
                        >
                            Download sample JSON:
                        </Button>
                    </div>
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