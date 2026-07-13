import { type GraphTemplate } from "../../services/graphGenerating";

interface GraphSelectorProps {
    title: string;
    value: GraphTemplate;
    onChange: (type: GraphTemplate) => void;
}

export function GraphSelector({ title, value, onChange }: GraphSelectorProps) {
    return (
        <div className="flex flex-col w-full">
            <label className="text-sm font-bold text-gray-700 mb-1">{title}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as GraphTemplate)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
                <option value="random">🎲 Randomly generated</option>
                <option value="clique">🛑 Clique (Full)</option>
                <option value="star">✨ Star</option>
                <option value="path">📏 Path</option>
                <option value="cycle">🔄 Cycle</option>
            </select>
        </div>
    );
}

