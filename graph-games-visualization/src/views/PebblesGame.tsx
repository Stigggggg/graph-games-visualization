import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Graph } from "../components/graphs/Graph";
import { BaseGame } from "../components/ui/BaseGame";
import { PebbleMove } from "../services/gameSession";

function PebblesGame() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as any;
    const [status, setStatus] = useState('playing');
    const [serverMessage, setServerMessage] = useState('Waiting for first move');
    const [turn, setTurn] = useState('spoiler');
    const [active, setActive] = useState<number>(1);
    const [p1, setP1] = useState<Record<string, string>>({});
    const [p2, setP2] = useState<Record<string, string>>({});
    const [playerGraph, setPlayerGraph] = useState<string | null>(null);
    const [winner, setWinner] = useState<string | null>(null);
    const [reason, setReason] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!state) {
        return (
            <div className='flex flex-col items-center gap-4 p-10'>
                <h2 className='text-2xl font-bold text-red-500'>No game generated!</h2>
                <button 
                    onClick={() => navigate('/pebbles-menu')} 
                    className='px-4 py-2 bg-blue-500 text-white rounded'
                >
                    Back to settings
                </button>
            </div>
        );
    }

    const getTitle = (graphId: string) => {
        const title = graphId.toUpperCase();

        if (status === 'game_over') {
            return title;
        }
        
        if (turn === 'duplicator') {
            if (playerGraph === graphId) {
                return `${title} (Spoiler)`;
            } else {
                return `${title} (Duplicator's target)`;
            }
        }

        return title;
    }

    const getMessage = () => {
        if (turn === "spoiler") {
            return `Spoiler: place pebble P${active} in either G1 or G2.`;
        }

        let target = "G1"
        if (playerGraph === "g1") {
            target = "G2";
        }

        return `Duplicator: match pebble P${active} in ${target}`;
    }

    const move = async (graphId: string, nodeId: string) => {
        if (status === 'game_over') {
            return false;
            setError(null);
        } 

        try {
           const data = await PebbleMove(state.game_id, graphId, nodeId, active);
           
           if (data.error) {
                setError(data.error);
                return false;
           }
           
           setP1(data.p1 || {});
           setP2(data.p2 || {});
           setServerMessage(data.message || "");

           if (data.status === "game_over") {
                setStatus("game_over");
                setWinner(data.winner);
                setReason(data.reason);
           } else {
                if (state.mode === "human") {
                    if (turn === "spoiler") {
                        setTurn('duplicator');
                        setPlayerGraph(graphId);
                    } else {
                        setTurn('spoiler');
                        setPlayerGraph(null);
                    }
                } else {
                    setPlayerGraph(null);
                }
           }
           
           return true;
        } catch (e: any) {
            setError(e.message || "Invalid move or server error!");
            return false;
        }
    }

    const PebbleSelector = (
        <div className='flex gap-2 items-center bg-white shadow-sm border border-gray-200 p-3 rounded-xl mt-2'>
            <span className='font-bold text-gray-700 mr-2'>Select Pebble:</span>
            {Array.from({length: state.k}, (_, i) => i + 1).map(num => (
                <button 
                    key={num} 
                    onClick={() => setActive(num)} 
                    className={`w-12 h-12 font-bold rounded-full border-2 transition-all duration-200 ${active === num ? 'bg-purple-500 text-white border-purple-700 scale-110 shadow-md' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'}`}
                >
                    {num}
                </button>
            ))}
        </div>
    );

    const GameDashboard = (
        <div className="w-full flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <div className="text-lg font-bold text-gray-700">
                    Pebbles: <span className="text-blue-600">{state.k}</span>
                </div>
                {status === "playing" && (
                    <div className="text-lg font-bold text-gray-700">
                        Turn: <span className={turn === "spoiler" ? "text-red-500" : "text-green-600"}>
                            {turn.toUpperCase()}
                        </span>
                    </div>
                )}
            </div>

            {status === 'playing' ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-center shadow-sm flex flex-col gap-1">
                    <span className="font-bold text-lg">{getMessage()}</span>
                    {serverMessage && <span className="text-sm opacity-80 font-medium">Server: {serverMessage}</span>}
                </div>
            ) : (
                <div className="flex flex-col gap-3 items-center">
                    <div className={`text-2xl font-black uppercase tracking-wide ${winner?.includes("spoiler") ? "text-red-500" : "text-green-600"}`}>
                        WINNER: {winner}
                    </div>
                    <div className="bg-gray-100 border border-gray-300 text-gray-800 px-6 py-2 rounded-lg text-center font-medium w-full md:w-3/4">
                        Reason: {reason}
                    </div>
                </div>
            )}

            {error && (
                <div className="border border-red-300 text-red-600 px-4 py-2 rounded-lg w-full text-center font-medium animate-pulse shadow-sm">
                    ⚠️ {error}
                </div>
            )}
        </div>
    );

    return (
        <BaseGame
            title="Pebble Game"
            status={status}
            dashboard={GameDashboard}
            menuRoute="/pebbles-menu"
            controls={PebbleSelector}
            g1Title={getTitle('g1')}
            g2Title={getTitle('g2')}
            g1Graph={<Graph data={state.g1} color='#4a90e2' pebbles={p1} nodeClick={(id) => move('g1', id)} />}
            g2Graph={<Graph data={state.g2} color='#e24a4a' pebbles={p2} nodeClick={(id) => move('g2', id)} />}
        />
    );
}

export default PebblesGame;