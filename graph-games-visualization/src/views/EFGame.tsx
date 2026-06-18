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
    const [message, setMessage] = useState('Waiting for first move');
    const [round, setRound] = useState(1);
    const [turn, setTurn] = useState('spoiler');
    const [movesG1, setMovesG1] = useState<string[]>([]);
    const [movesG2, setMovesG2] = useState<string[]>([]);
    const [playerGraph, setPlayerGraph] = useState<string | null>(null);

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
                return `${title} (Duplicator)`
            }
        }

        return title;
    };

    const move = async (graphId: string, nodeId: string) => {
        if (status === "game_over") {
            return false;
        }

        try {
            const data = await EFMove(state.game_id, graphId, nodeId);
            setMovesG1(data.movesG1 || []);
            setMovesG2(data.movesG2 || []);

            if (state.mode === "human") {
                if (turn === "spoiler") {
                    setTurn('duplicator');
                    setPlayerGraph(graphId);
                } else {
                    setTurn('spoiler');
                    setPlayerGraph(null);
                    if (data.status !== "game_over") {
                        setRound(prev => prev + 1);
                    }
                }
            } else {
                setPlayerGraph(null);
                if (data.status !== "game_over") {
                    setRound(prev => prev + 1);
                }
            }

            setMessage(data.message || `Winner: ${data.winner}, Reason: ${data.reason}`);
            if (data.status !== "game_over") {
                setStatus('game_over');
            }

            return true;
        } catch (e: any) {
            alert(e.message);
            return false;
        }
    };

    return (
        <BaseGame
            title="EF Game"
            message={message}
            status={status}
            menuRoute="/ef-menu"
            statusDetail={<div className='text-gray-800'>Round: <span className='text-blue-600'>{round}/{state.maxRounds}</span></div>}
            g1Title={getTitle('g1')}
            g2Title={getTitle('g2')}
            g1Graph={<Graph data={state.g1} color='#4a90e2' selectedNodes={movesG1} nodeClick={(id) => move('g1', id)} />}
            g2Graph={<Graph data={state.g2} color='#e24a4a' selectedNodes={movesG2} nodeClick={(id) => move('g2', id)} />}
        />
    );

}

export default EFGame;