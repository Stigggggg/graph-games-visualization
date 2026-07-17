import { Button } from "./Button";

interface AnalysisProps {
    data: any;
    onClose: () => void;
}

export function Analysis({ data, onClose }: AnalysisProps) {
    if (!data) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-200 bg-gray-100 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">📊 Post-Game Analysis</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-bold text-2xl leading-none">&times;</button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
                        <h3 className="font-bold text-lg text-blue-800 mb-2">Game Summary</h3>
                        <p className="text-gray-700">
                            <strong>Structure:</strong> The graphs are <b>{data.is_isomorphic ? "Isomorphic" : "Non-Isomorphic"}</b>.
                        </p>
                        <p className="text-gray-700">
                            <strong>Winning Strategy:</strong> The theoretical advantage belongs to the <span className="font-bold text-purple-700 uppercase">{data.winning}</span>.
                        </p>
                    </div>

                    <h3 className="font-bold text-lg text-gray-800 mb-3">Round-by-Round Timeline</h3>
                    <div className="space-y-3">
                        {data.history.map((round: any, index: number) => (
                            <div key={index} className={`p-4 rounded-lg border ${round.is_simulated ? 'bg-gray-50 border-dashed border-gray-300' : 'bg-white border-gray-200 shadow-sm'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-700">Round {round.round}</span>
                                    {round.is_simulated ? (
                                        <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">🤖 AI Simulated</span>
                                    ) : (
                                        <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full">👤 Played</span>
                                    )}
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <div><strong>G1 Choice:</strong> {round.g1_node}</div>
                                    <div><strong>G2 Choice:</strong> {round.g2_node}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <Button onClick={onClose}>Close Analysis</Button>
                </div>
            </div>
        </div>
    );
}