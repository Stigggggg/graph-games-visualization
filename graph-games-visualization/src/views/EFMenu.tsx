import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BaseMenu } from "../components/ui/BaseMenu";
import { Label, Input } from "../components/ui/Wrappers";
import { EFGameSession } from "../services/gameSession";
import { type BaseMenuState } from "../services/gameValidation";
import { GraphSelector } from "../components/ui/GraphSelector";
import { generateTemplate, type GraphTemplate } from "../services/graphGenerating";

// EF menu component, extending BaseMenu
function EFMenu() {
    const navigate = useNavigate();
    // additional state parts
    const [rounds, setRounds] = useState<number>(3); // rounds unique to EF
    // graph types for selecting template
    const [g1Type, setG1Type] = useState<GraphTemplate>("random");
    const [g2Type, setG2Type] = useState<GraphTemplate>("random");

    const handleStart = async (baseState: BaseMenuState) => {
        const n = Number(baseState.vertices) || 5;
        const m = Number(baseState.edges) || 0;
        // if there is a template, edges are not random
        const g1Edges = g1Type !== "random" ? generateTemplate(g1Type, n) : undefined;
        const g2Edges = g1Type !== "random" ? generateTemplate(g2Type, n) : undefined;
        // extending type with graph types and edfges lists
        const enhancedState = {
            ...baseState,
            g1: { type: g1Type, n: n, m: m, edges: g1Edges },
            g2: { type: g2Type, n: n, m: m, edges: g2Edges },
        };
        const data = await EFGameSession(enhancedState, rounds);

        // going to /ef endpoint with state data
        navigate("/ef", {
            state: {
                game_id: data.game_id,
                g1: data.g1,
                g2: data.g2,
                maxRounds: rounds,
                mode: baseState.mode
            }
        });
    };

    return (
        <BaseMenu title="EF Settings" onStart={handleStart}>
            <div className="flex flex-col sm:flex-row gap-4 mb-4 mt-2 w-full justify-center">
                <GraphSelector title="Graph 1 type:" value={g1Type} onChange={setG1Type} />
                <GraphSelector title="Graph 2 type:" value={g2Type} onChange={setG2Type} />
            </div>

            <Label>
                Number of rounds:
                <Input
                    type="number"
                    min="3"
                    max="10"
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                />
            </Label>
        </BaseMenu>
    );
}

export default EFMenu;
