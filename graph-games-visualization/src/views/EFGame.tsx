import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Graph } from "../components/graphs/Graph";
import { Button } from "../components/ui/Button";
import { Subtitle } from "../components/ui/Titles";

// EF game component, rendering the board and presenting its state
function EFGame() {
    // local game state initialization
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as any;
    const [status, setStatus] = useState('playing');
    const [message, setMessage] = useState('Waiting for first move');
    const [round, setRound] = useState(1);
    const [turn, setTurn] = useState('spoiler');
    const [movesG1, setMovesG1] = useState<string[]>([]);
    const [movesG2, setMovesG2] = useState<string[]>([]);

    if (!state) {
        return (
            <div className='flex flex-col items-center gap-4 p-10'>
                <Subtitle className="text-red-500">No game generated!</Subtitle>
                <Button 
                    onClick={() => navigate('/ef-menu')} 
                    className='w-auto'
                >
                    Back to settings
                </Button>
            </div>
        );
    }

    // async handler for player moves, sending selected node to the backend
    const move = async (graphId: string, nodeId: string) => {
        if (status == 'game_over') {
            return false;
        }

        try {
            const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'
            const response = await fetch(`${apiURL}/move`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ 
                    game_id: state.game_id, 
                    graph_id: graphId, 
                    node_id: nodeId 
                })
            });
            
            // based on response, game state is updated
            // if the move is legal, it is added to the move list
            // round number is incremented and player turn changes
            const data = await response.json();
            if (!response.ok) {
                alert(data.error);
                return false;
            }
            
            setMovesG1(data.moves_g1 || []);
            setMovesG2(data.moves_g2 || []);

            if (state.mode === 'human') {
                if (turn === 'spoiler') {
                    setTurn('duplicator');
                } else {
                    setTurn('spoiler');
                    if (data.status !== 'game_over') {
                        setRound(prev => prev + 1);
                    } 
                }
            } else {
                if (data.status !== 'game_over') {
                    setRound(prev => prev + 1);
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

    // both graphs and an information about the game state and round number are visible during the whole game
    return (
        <div className="flex flex-col items-center gap-4 mt-6 p-4 min-h-screen">
            <Subtitle className="text-4xl">EF Game</Subtitle>

            <div className='flex flex-col items-center gap-2 bg-white py-4 px-8 rounded-xl font-bold text-lg w-full max-w-4xl shadow-md border-t-4 border-blue-500'>
               <div className='text-gray-800'>Status: <span className='text-blue-600 font-normal'>{message}</span></div>
               <div className='text-gray-800'>Round: <span className='text-blue-600'>{round}/{state.maxRounds}</span></div>
           </div>

           <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl justify-center mt-4">
                <div className="text-center w-full flex flex-col items-center">
                    <Subtitle className="mb-2">G1</Subtitle>
                    <Graph 
                        data={state.g1} 
                        color='#4a90e2' 
                        selectedNodes={movesG1} 
                        nodeClick={(id) => move('g1', id)} 
                    />
                </div>
                <div className="text-center w-full flex flex-col items-center">
                    <Subtitle className="mb-2">G2</Subtitle>
                    <Graph 
                        data={state.g2} 
                        color='#e24a4a'
                        selectedNodes={movesG2} 
                        nodeClick={(id) => move('g2', id)} 
                    />
                </div>
           </div>

           <div className="w-full max-w-md mt-6">
                {status === 'game_over' ? (
                    <Button
                        onClick={() => navigate("/ef-menu")}
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

export default EFGame;