import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation} from 'react-router-dom';
import { Graph } from './Graph';

function Home() {
    const navigate = useNavigate();

    return (
      <div className="flex flex-col items-center gap-4 mt-10 p-4 h-screen box-border">
        <h1 className="text-3xl font-bold mb-4">Which game do you want to play?</h1>
        <button 
            onClick={() => navigate('/menu-ef')}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
        >
            EF Game
        </button>
        <button 
            onClick={() => navigate('/menu-pebbles')}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
        >
            Pebbles
        </button>
      </div>
    );
}

function MenuEF() {
    const navigate = useNavigate();
    const [V, setV] = useState<number | ''>('');
    const [E, setE] = useState<number | ''>('');
    const [rounds, setRounds] = useState<number>(3);
    const [errorMessage, setErrorMessage] = useState('');
    const [mode, setMode] = useState('human');
    const [source, setSource] = useState('random');
    const [file, setFile] = useState<File | null>(null);

    const handler = async () => {
        try {
            setErrorMessage('');
            let settings: any = { rounds: rounds, mode: mode, source: source };

            if (source === 'random') {
                if (V === '' || E === '') throw new Error('Please insert the number of vertices and edges!');
                settings.n = V;
                settings.m = E;
            } else if (source === 'file') {
                if (!file) throw new Error('Please upload a file!');
                try {
                    const fileText = await file.text();
                    settings.custom = JSON.parse(fileText);
                } catch (e) {
                    throw new Error('Invalid format, upload a valid JSON.');
                }
            }

            const response = await fetch('http://127.0.0.1:5000/generate-ef', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Server error!');

            navigate('/ef', {
              state: {
                game_id: data.game_id, 
                g1: data.g1, g2: data.g2, 
                maxRounds: rounds, mode: mode
              }
            });
        } catch (e: any) {
          setErrorMessage(e.message);
        }
    };

    const inputClass = "p-2 border border-gray-300 rounded-md text-base mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full";
    const labelClass = "font-semibold text-gray-700 flex flex-col items-center w-full";

    return (
        <div className="flex flex-col items-center gap-4 mt-6 p-4">
            <h1 className="text-3xl font-bold">Settings</h1>
            
            <div className="flex flex-col items-center gap-5 bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                
                <div className="w-full">
                    <label className={labelClass}>Graph source:
                        <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
                            <option value='random'>Randomly generated</option>
                            <option value='file'>Uploaded from file</option>
                            <option value='draw' disabled>Draw</option>
                        </select>
                    </label>
                </div>

                {source === 'random' && (
                    <div className="flex gap-4 w-full">
                        <label className={labelClass}>Vertices (n):
                            <input type='number' min='1' max='10' value={V} onChange={(e) => setV(e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} />
                        </label>
                        <label className={labelClass}>Edges (m):
                            <input type='number' min='0' max={V === '' ? 0 : V * V} value={E} onChange={(e) => setE(e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} />
                        </label>
                    </div>
                )}

                {source === 'file' && (
                    <div className="w-full">
                        <label className={labelClass}>Upload JSON:
                            <input type='file' accept='.json' onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        </label>
                    </div>
                )}

                <div className="w-full">
                    <label className={labelClass}>Number of rounds:
                        <input type='number' min='3' max='10' value={rounds} onChange={(e) => setRounds(Number(e.target.value))} className={inputClass} />
                    </label>
                </div>

                <div className="w-full">
                    <label className={labelClass}>Game mode:
                        <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
                            <option value='human'>Human vs Human</option>
                            <option value='ai'>Human vs AI</option>
                        </select>
                    </label>
                </div>

                {errorMessage && <div className="text-red-500 font-bold text-center">{errorMessage}</div>}

                <div className="flex flex-col gap-3 w-full mt-2">
                    <button onClick={handler} className="py-3 bg-blue-500 text-white font-bold rounded-lg shadow hover:bg-blue-600 transition">
                        Start game
                    </button>
                    <button onClick={() => navigate('/')} className="py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition">
                        Back to menu
                    </button>
                </div>
            </div>
        </div>
    );
}

function GameEF() {
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
            <div className="flex flex-col items-center gap-4 p-10">
                <h2 className="text-2xl font-bold text-red-500">No game generated!</h2>
                <button onClick={() => navigate('/menu-ef')} className="px-4 py-2 bg-blue-500 text-white rounded">Back to settings</button>
            </div>
        );
    }

    const move = async (graphId: string, nodeId: string) => {
        if (status == 'game_over') return false;

        try {
            const response = await fetch('http://127.0.0.1:5000/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_id: state.game_id, graph_id: graphId, node_id: nodeId })
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.error);
                return false;
            }

            setMovesG1(data.moves_g1 || []);
            setMovesG2(data.moves_g2 || []);

            if (state.mode === 'human') {
                if (turn === 'spoiler') setTurn('duplicator');
                else {
                    setTurn('spoiler');
                    if (data.status !== 'game_over') setRound(prev => prev + 1);
                }
            } else {
                if (data.status !== 'game_over') setRound(prev => prev + 1);
            }
            
            setMessage(data.message || `Winner: ${data.winner}, Reason: ${data.reason}`);
            if (data.status == 'game_over') setStatus('game_over');
            
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    return (
        <div className="flex flex-col items-center gap-4 mt-6 p-4">
           <h1 className="text-3xl font-bold">EF Game</h1>
           
           <div className="flex flex-col items-center gap-2 bg-white py-4 px-8 rounded-xl font-bold text-lg w-full max-w-4xl shadow-md border-t-4 border-blue-500">
               <div className="text-gray-800">Status: <span className="text-blue-600 font-normal">{message}</span></div>
               <div className="text-gray-800">Round: <span className="text-blue-600">{round}/{state.maxRounds}</span></div>
           </div>
           
           <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl justify-center mt-4">
              <div className="text-center w-full flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-2">G1</h2>
                  <Graph data={state.g1} color='#4a90e2' selectedNodes={movesG1} nodeClick={(id) => move('g1', id)} />
              </div>
              <div className="text-center w-full flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-2 text-red-500">G2</h2>
                  <Graph data={state.g2} color='#e24a4a' selectedNodes={movesG2} nodeClick={(id) => move('g2', id)} />
              </div>
           </div>
           
           {status === 'game_over' ? (
              <button onClick={() => navigate('/menu-ef')} className="mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg transition">
                  Back to menu / Play again
              </button>
            ) : (
                <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg transition">
                    Exit Game
                </button> 
            )}
        </div>
    );
}

function MenuPebbles() {
    const navigate = useNavigate();
    const [V, setV] = useState<number | ''>('');
    const [E, setE] = useState<number | ''>('');
    const [k, setK] = useState<number>(3);
    const [errorMessage, setErrorMessage] = useState('');
    const [mode, setMode] = useState('human');
    const [source, setSource] = useState('random');
    const [file, setFile] = useState<File | null>(null);

    const handler = async () => {
        try {
            setErrorMessage('');
            let settings: any = {
                k: k,
                mode: mode,
                source: source
            };
            if (source === 'random') {
                if (V === '' || E === '') {
                    throw new Error('Please insert the number of vertices and edges!');
                }
                settings.n = V;
                settings.m = E;
            } else if (source === 'file') {
                if (!file) {
                    throw new Error('Please upload a file!');
                }
                settings.custom = JSON.parse(await file.text());
            }

            const response = await fetch('http://127.0.0.1:5000/generate-pebbles', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error);
            }
            navigate('/pebbles', {
                state: {
                  game_id: data.game_id, 
                  g1: data.g1,
                  g2: data.g2, 
                  k: k,
                  mode: mode
                }
              });
        } catch(e: any) {
            setErrorMessage(e.message);
        }
    };

    const inputClass = "p-2 border border-gray-300 rounded-md mt-1 w-full";
    return (
        <div className="flex flex-col items-center gap-4 mt-6 p-4">
            <h1 className="text-3xl font-bold">Settings</h1>
            <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                <label className='w-full font-semibold'>Graph source:
                    <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
                        <option value='random'>Randomly generated</option>
                        <option value='file'>Uploaded from file</option>
                        <option value='draw' disabled>Draw</option>
                    </select>
                </label>
                {source === 'random' && (
                    <div className="flex gap-4 w-full">
                        <label className='w-full font-semibold'>Vertices (n):
                            <input type='number' min='1' max='10' value={V} onChange={(e) => setV(e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} />
                        </label>
                        <label className='w-full font-semibold'>Edges (m):
                            <input type='number' min='0' max={V === '' ? 0 : V * V} value={E} onChange={(e) => setE(e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} />
                        </label>
                    </div>
                )}
                {source === 'file' && (
                    <div className="w-full">
                        <label className='w-full font-semibold'>Upload JSON:
                            <input type='file' accept='.json' onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        </label>
                    </div>
                )}
                <div className="w-full">
                    <label className='w-full font-semibold'>Number of pebbles(k):
                        <input type='number' min='2' max='4' value={k} onChange={(e) => setK(Number(e.target.value))} className={inputClass} />
                    </label>
                </div>
                <div className="w-full">
                    <label className='w-full font-semibold'>Game mode:
                        <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
                            <option value='human'>Human vs Human</option>
                            <option value='ai'>Human vs AI</option>
                        </select>
                    </label>
                </div>

                {errorMessage && <div className="text-red-500 font-bold text-center">{errorMessage}</div>}
                <div className="flex flex-col gap-3 w-full mt-2">
                    <button onClick={handler} className="py-3 bg-blue-500 text-white font-bold rounded-lg shadow hover:bg-blue-600 transition">
                        Start game
                    </button>
                    <button onClick={() => navigate('/')} className="py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition">
                        Back to menu
                    </button>
                </div>
            </div>
        </div>
    );
}

function GamePebbles() {
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
            <div className="flex flex-col items-center gap-4 p-10">
                <h2 className="text-2xl font-bold text-red-500">No game generated!</h2>
                <button onClick={() => navigate('/menu-ef')} className="px-4 py-2 bg-blue-500 text-white rounded">Back to settings</button>
            </div>
        );
    }

    const move = async (graphId: string, nodeId: string) => {
        if (status === 'game_over') {
            return false;
        } 

        try {
            const response = await fetch('http://127.0.0.1:5000/move-pebble', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_id: state.game_id, graph_id: graphId, node_id: nodeId, pebble_id: active })
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
        <div className="flex flex-col items-center gap-4 mt-6 p-4">
           <h1 className="text-3xl font-bold">Pebble Game</h1>
           <div className="flex flex-col items-center gap-2 bg-white py-4 px-8 rounded-xl font-bold text-lg w-full max-w-4xl shadow-md border-t-4 border-blue-500">
               <div className="text-gray-800">Status: <span className="text-blue-600 font-normal">{message}</span></div>
               <div className="text-gray-800">Round: <span className="text-blue-600">{state.k}</span></div>
           </div>

           <div className="flex gap-2 items-center bg-gray-200 p-3 rounded-lg">
               <span className="font-bold">Select Pebble:</span>
               {Array.from({length: state.k}, (_, i) => i + 1).map(num => (
                   <button 
                       key={num} 
                       onClick={() => setActive(num)}
                       className={`w-10 h-10 font-bold rounded-full border-2 ${active === num ? 'bg-purple-500 text-white border-purple-700' : 'bg-white border-gray-400'}`}
                   >
                       {num}
                   </button>
               ))}
           </div>
           
           <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl justify-center mt-2">
              <div className="text-center w-full flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-2">G1</h2>
                  <Graph data={state.g1} color='#4a90e2' pebbles={p1} nodeClick={(id) => move('g1', id)} />
              </div>
              <div className="text-center w-full flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-2 text-red-500">G2</h2>
                  <Graph data={state.g2} color='#e24a4a' pebbles={p2} nodeClick={(id) => move('g2', id)} />
              </div>
           </div>
           
           {status === 'game_over' ? (
              <button onClick={() => navigate('/menu-ef')} className="mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg transition">
                  Back to menu / Play again
              </button>
            ) : (
                <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg transition">
                    Exit Game
                </button> 
            )}
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/menu-ef' element={<MenuEF />} />
            <Route path='/ef' element={<GameEF />} />
            <Route path='/menu-pebbles' element={<MenuPebbles />} />
            <Route path='/pebbles' element={<GamePebbles />} />
          </Routes>
        </BrowserRouter>
    );
}

export default App;
