import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Graph } from "../components/graphs/Graph";
import { Button } from "../components/ui/Button";
import { Subtitle } from "../components/ui/Titles";

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

    const move = async (graphId: string, nodeId: string) => {
        if (status === 'game_over') {
            return false;
        } 

        try {
            const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'
            const response = await fetch(`${apiURL}/move-pebble`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    game_id: state.game_id, 
                    graph_id: graphId, 
                    node_id: nodeId, 
                    pebble_id: active 
                })
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.error);
                return false;
            }

            setP1(data.p1 || {});
            setP2(data.p2 || {});

            if (state.mode === 'human') {
                if (turn === 'spoiler') {
                    setTurn('duplicator');
                }
                else {
                    setTurn('spoiler');
                }
            }

            setMessage(data.message || `Winner: ${data.winner}, Reason: ${data.reason}`);
            
            if (data.status == 'game_over') {
                setStatus('game_over');
            } 
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    return (
        <div className="flex flex-col items-center gap-4 mt-6 p-4 min-h-screen">
            <Subtitle className="text-4xl">Pebble Game</Subtitle>

            <div className='flex flex-col items-center gap-2 bg-white py-4 px-8 rounded-xl font-bold text-lg w-full max-w-4xl shadow-md border-t-4 border-blue-500'>
               <div className='text-gray-800'>Status: <span className='text-blue-600 font-normal'>{message}</span></div>
               <div className='text-gray-800'>Number of pebbles: <span className='text-blue-600'>{state.k}</span></div>
           </div>

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

           <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl justify-center mt-2">
                <div className="text-center w-full flex flex-col items-center">
                    <Subtitle className="mb-2">G1</Subtitle>
                    <Graph 
                        data={state.g1} 
                        color='#4a90e2' 
                        pebbles={p1} 
                        nodeClick={(id) => move('g1', id)} 
                    />
                </div>
                <div className="text-center w-full flex flex-col items-center">
                    <Subtitle className="mb-2">G2</Subtitle>
                    <Graph 
                        data={state.g2} 
                        color='#e24a4a'
                        pebbles={p2} 
                        nodeClick={(id) => move('g2', id)} 
                    />
                </div>
           </div>

           <div className="w-full max-w-md mt-6">
                {status === 'game_over' ? (
                    <Button
                        onClick={() => navigate("/pebbles-menu")}
                        className="bg-gray-500 hover:bg-gray-600"
                    >
                        Back to menu / Play again
                    </Button>
                ): (
                    <Button
                        onClick={() => navigate("/")}
                        className="bg-gray-500 hover:bg-gray-600"
                    >
                       Exit game
                    </Button>  
                )}
           </div>
        </div>
    );
}

export default PebblesGame;