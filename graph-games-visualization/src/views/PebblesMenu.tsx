import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BaseMenu } from "../components/ui/BaseMenu";
import { Label, Input } from "../components/ui/Wrappers";
import { PebblesGameSession } from "../services/gameSession";
import { type BaseMenuState } from "../services/gameValidation";

function EFMenu() {
    const navigate = useNavigate();
    const [pebbles, setPebbles] = useState<number | "">("");

    const handleStart = async (baseState: BaseMenuState) => {
        const data = await PebblesGameSession(baseState, pebbles);
        
        navigate("/pebbles", {
            state: {
                game_id: data.game_id,
                g1: data.g1,
                g2: data.g2,
                k: pebbles,
                mode: baseState.mode
            }
        }); 
    };

    return (
        <BaseMenu title="Pebbles Settings" onStart={handleStart}>
            <Label>
                Number of pebbles (k):
                <Input
                    type="number"
                    min="2"
                    max="4"
                    value={pebbles}
                    onChange={(e) => setPebbles(Number(e.target.value))}
                />
            </Label>
        </BaseMenu>
    );
}

export default EFMenu;
