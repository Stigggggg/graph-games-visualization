import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Graph } from "../components/graphs/Graph";
import { Button } from "../components/ui/Button";
import { Subtitle } from "../components/ui/Titles";
import { BaseGame } from "../components/ui/BaseGame";
import { EFMove } from "../services/gameSession";

// EF game component, rendering the board and presenting its state
function EFGame() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as any;
    const [status, setStatus] = useState('playing');
    const [serverMessage, setServerMessage] = useState('Waiting for first move');
    const [round, setRound] = useState(1);
    const [turn, setTurn] = useState('spoiler');
    const [movesG1, setMovesG1] = useState<string[]>([]);
    const [movesG2, setMovesG2] = useState<string[]>([]);
    const [playerGraph, setPlayerGraph] = useState<string | null>(null);
    const [winner, setWinner] = useState<string | null>(null);
    const [reason, setReason] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!state) {
        return (
            <div className='flex flex-col items-center gap-4 p-10'>
                <Subtitle className="text-red-500">No game generated!</Subtitle>
                <Button 
                    onClick={() => navigate('/ef-menu')} 
                    className="w-auto"
                >
                    Back to settings
                </Button>
            </div>
        );
    }

    const getTitle = (graphId: string) => {
        const title = graphId.toUpperCase();
        
        if (status === "game_over") {
            return title;
        }

        if (turn === "duplicator") {
            if (playerGraph === graphId) {
                return `${title} (Spoiler)`
            } else {
                return `${title} (Duplicator's target)`
            }
        }

        return title;
    };

    const getMessage = () => {
        if (turn === "spoiler") {
            return "Spoiler: choose a starting node in either G1 or G2";
        }

        let target = "G1"
        if (playerGraph === "g1") {
            target = "G2";
        }

        return `Duplicator: choose a matching node in ${target}`;
    }

    const move = async (graphId: string, nodeId: string) => {
        if (status === "game_over") {
            return false;
        }
        setError(null);

        try {
            const data = await EFMove(state.game_id, graphId, nodeId);
            
            if (data.error) { 
                setError(data.error);
                return false;
            }
            
            setMovesG1(data.moves_g1 || []);
            setMovesG2(data.moves_g2 || []);
            setServerMessage(data.message || "");

            if (data.status === "game_over") {
                setStatus('game_over');
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
                        setRound(prev => prev + 1);
                    }
                } else {
                    setPlayerGraph(null);
                    setRound(prev => prev + 1);
                }
            }

            return true;
        } catch (e: any) {
            setError(e.message || "Invalid move or server error!")
            return false;
        }
    };

    const GameDashboard = (
        <div className="w-full flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <div className="text-lg font-bold text-gray-700">
                    Round: <span className="text-blue-600">{round} / {state.maxRounds}</span>
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
            title="EF Game"
            status={status}
            dashboard={GameDashboard}
            menuRoute="/ef-menu"
            g1Title={getTitle('g1')}
            g2Title={getTitle('g2')}
            g1Graph={<Graph data={state.g1} color='#4a90e2' selectedNodes={movesG1} nodeClick={(id) => move('g1', id)} />}
            g2Graph={<Graph data={state.g2} color='#e24a4a' selectedNodes={movesG2} nodeClick={(id) => move('g2', id)} />}
        />
    );

}

export default EFGame;