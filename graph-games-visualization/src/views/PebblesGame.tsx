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
    const [message, setMessage] = useState('Waiting for first move');
    const [turn, setTurn] = useState('spoiler');
    const [active, setActive] = useState<number>(1);
    const [p1, setP1] = useState<Record<string, string>>({});
    const [p2, setP2] = useState<Record<string, string>>({});
    const [playerGraph, setPlayerGraph] = useState<string | null>(null);

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
                return `${title} (Duplicator)`;
            }
        }

        return title;
    }

    const move = async (graphId: string, nodeId: string) => {
        if (status === 'game_over') {
            return false;
        } 

        try {
           const data = await PebbleMove(state.game_id, graphId, nodeId, active);
           setP1(data.p1 || {});
           setP2(data.p2 || {});

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

            setMessage(data.message || `Winner: ${data.winner}, Reason: ${data.reason}`);
            if (data.status === "game_over") {
                setStatus('game_over');
            }

            return true;
        } catch (e: any) {
            alert(e.message);
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

    return (
        <BaseGame
            title="Pebble Game"
            message={message}
            status={status}
            menuRoute="/pebbles-menu"
            statusDetail={<div className='text-gray-800'>Number of pebbles: <span className='text-blue-600'>{state.k}</span></div>}
            controls={PebbleSelector}
            g1Title={getTitle('g1')}
            g2Title={getTitle('g2')}
            g1Graph={<Graph data={state.g1} color='#4a90e2' pebbles={p1} nodeClick={(id) => move('g1', id)} />}
            g2Graph={<Graph data={state.g2} color='#e24a4a' pebbles={p2} nodeClick={(id) => move('g2', id)} />}
        />
    );
}

export default PebblesGame;