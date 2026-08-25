import { type GraphTemplate } from "../../services/graphGenerating";
import { Label, Select } from "./Wrappers";

// Component designed for a possibility to choose the graph types before the game

interface GraphSelectorProps {
    title: string; // label over the type list
    value: GraphTemplate; // currently selected type
    onChange: (type: GraphTemplate) => void; // callback function triggered when a different option is selected
}

// The component renders a dropdown menu allowing the user to select one of the specific graph structures
// For consistent styling, Label and Select components are used
// The possible structures are clique, star, path and a cycle
export function GraphSelector({ title, value, onChange }: GraphSelectorProps) {
    return (
        <div className="flex flex-col w-full">
            <Label className="items-start text-sm mb-1">
                {title}
                <Select
                    value={value}
                    onChange={(e) => onChange(e.target.value as GraphTemplate)}
                    className="shadow-sm bg-white"
                >
                    <option value="random">🎲 Randomly generated</option>
                    <option value="clique">🛑 Clique (Full)</option>
                    <option value="star">✨ Star</option>
                    <option value="path">📏 Path</option>
                    <option value="cycle">🔄 Cycle</option>
                </Select>
            </Label>
        </div>
    );
}