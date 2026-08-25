import { Graph } from "../graphs/Graph";
import { Button } from "./Button";

interface AnalysisProps {
    data: any; // object containing the post-game analysis data, graphs, verdict and strategies
    onClose: () => void; // callback function to close
}

// Analysis component, displaying graphs and winning strategies in 2 columns with round by round comparison
export function Analysis({ data, onClose }: AnalysisProps) {
    if (!data) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 md:p-8">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden">

                {/* left column - player graph visualization */}
                <div className="w-full md:w-1/2 p-6 flex flex-col gap-6 h-1/2 md:h-full bg-gray-50/50 border-r border-gray-200">
                   {/* G1 container */}
                   <div className="flex-1 relative rounded-xl border border-gray-300 bg-white shadow-sm overflow-hidden ring-1 ring-black/5">
                        <div className="absolute top-4 left-4 z-20 text-xs font-black text-gray-500 tracking-widest uppercase bg-white/95 px-3 py-1.5 rounded shadow-sm border border-gray-100">
                            G1
                        </div>
                        <div className="absolute inset-0 z-10 w-full h-full [&>div]:!border-0 [&>div]:!rounded-none [&>div]:!shadow-none [&>div]:!m-0 [&>div]:!outline-none">
                            <Graph
                                data={data.g1_elements || data.g1}
                                color="#4a90e2"
                            />
                        </div>
                   </div>

                    {/* G2 container */}
                   <div className="flex-1 relative rounded-xl border border-gray-300 bg-white shadow-sm overflow-hidden ring-1 ring-black/5">
                        <div className="absolute top-4 left-4 z-20 text-xs font-black text-gray-500 tracking-widest uppercase bg-white/95 px-3 py-1.5 rounded shadow-sm border border-gray-100">
                            G2
                        </div>
                        <div className="absolute inset-0 z-10 w-full h-full [&>div]:!border-0 [&>div]:!rounded-none [&>div]:!shadow-none [&>div]:!m-0 [&>div]:!outline-none">
                            <Graph
                                data={data.g2_elements || data.g2}
                                color="#e24a4a"
                            />
                        </div>
                   </div>
                </div>

                {/* right column - verdict and round-by-round game analysis, player and AI moves in every turn */}
                <div className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full bg-white">
                    {/* header with title and close button */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-2xl font-black text-gray-800">Post-Game Analysis</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-black transition-colors font-bold text-3xl leading-none"
                        >
                            &times;
                        </button>
                    </div>

                    {/* scrollable area for verdict and analysis */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {/* verdict section, winning role and structure */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Verdict</h3>
                            <p className="text-gray-800 text-lg mb-1">
                                Structure: <span className="font-medium">{data.is_isomorphic ? "Isomorphic" : "Non-Isomorphic"}</span>
                            </p>
                            <p className="text-gray-800 text-lg">
                                Winning Strategy: <span className="font-bold text-purple-600 uppercase">{data.winning}</span>
                            </p>
                        </div>

                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Round-by-Round Comparison</h3>

                        {/* round-by-round analysis timeline */}
                        <div className="space-y-6">
                            {data.history && data.history.length > 0 ? data.history.map((round: any, index: number) => (
                                <div key={index} className="border-b border-gray-100 pb-6 last:border-0">
                                    <h4 className="font-bold text-lg text-gray-800 mb-3">Round {round.round}</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* user moves */}
                                        <div>
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                <span>👤</span> You
                                            </div>
                                            {round.played_by_user ? (
                                                <div className="text-sm text-gray-700 space-y-1">
                                                    <div>G1: <span className="font-bold">{round.g1_node}</span></div>
                                                    <div>G2: <span className="font-bold">{round.g2_node}</span></div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400 italic mt-2">
                                                    Game ended early
                                                </div>
                                            )}
                                        </div>
                                        {/* AI moves */}
                                        <div>
                                            <div className="text-xs font-bold text-purple-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                <span>🤖</span> AI Optimal
                                            </div>
                                            {round.optimal_g1 !== "-" ? (
                                                <div className="text-sm text-gray-700 space-y-1">
                                                    <div>G1: <span className="font-bold text-blue-600">{round.optimal_g1}</span></div>
                                                    <div>G2: <span className="font-bold text-red-500">{round.optimal_g2}</span></div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400 italic mt-2">
                                                    Game ended early
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-gray-400 italic">Timeline is not available.</div>
                            )}
                        </div>
                    </div>

                    {/* closing the section on the bottom */}
                    <div className="p-4 border-t border-gray-100 flex justify-end">
                        <Button
                            onClick={onClose}
                            className="px-6 py-2"
                        >
                            Close
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}