import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BaseMenu } from "../components/ui/BaseMenu";
import { Label, Input } from "../components/ui/Wrappers";
import { EFGameSession } from "../services/gameSession";
import { type BaseMenuState } from "../services/gameValidation";

function EFMenu() {
    const navigate = useNavigate();
    const [rounds, setRounds] = useState<number>(3);

    const handleStart = async (baseState: BaseMenuState) => {
        const data = await EFGameSession(baseState, rounds);
        
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
