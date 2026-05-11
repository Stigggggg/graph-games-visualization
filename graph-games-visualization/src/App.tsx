import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation} from 'react-router-dom';
import { Graph } from './Graph';

function Home() {
    const navigate = useNavigate();

    return (
      <div className='app-container'>
        <h1>Which game do you want to play?</h1>
        <button onClick={() => navigate('/menu-ef')}>EF Game</button>
        <button disabled>Pebbles</button>
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
            let settings: any = {
                rounds: rounds,
                mode: mode,
                source: source
            };

            if (source === 'random') {
                if (V == '' || E == '') {
                    throw new Error('Please insert the number of vertices and edges!');
                }
                settings.n = V;
                settings.m = E;
            } else if (source === 'file') {
                if (!file) {
                    throw new Error('Please upload a file!');
                }
                try {
                    const fileText = await file.text();
                    const parsed = JSON.parse(fileText);
                    settings.custom = parsed;
                } catch (e) {
                    throw new Error ('Invalid format, upload a valid JSON.')
                }
            }

            const response = await fetch('http://127.0.0.1:5000/generate-ef', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Server error!');
            }

            navigate('/ef', {
              state: {
                game_id: data.game_id, 
                g1: data.g1, 
                g2: data.g2, 
                maxRounds: rounds,
                mode: mode
              }
            });
        } catch (e: any) {
          setErrorMessage(e.message);
        }
    };

    return (
        <div className='app-container'>
            <h1>Settings</h1>
            <div className='menu-ef'>
                <div className='mode'>
                    <label>Graph source: </label>
                    <select value={source} onChange={(e) => setSource(e.target.value)}>
                        <option value='random'>Randomly generated</option>
                        <option value='file'>Uploaded from file</option>
                        <option value='draw' disabled>Draw</option>
                    </select>
                </div>
                {source === 'random' && (
                    <>
                        <div className='nodes-number'>
                            <label>
                            Number of vertices (n): 
                            <input type='number' min='1' max='10' value={V} onChange={(e) => setV(e.target.value === '' ? '' : Number(e.target.value))}/>
                            </label>
                        </div>

                        <div className='edges-number'>
                            <label>
                            Number of edges (m): 
                            <input type='number' min='0' max={V === '' ? 0 : V * V} value={E} onChange={(e) => setE(e.target.value === '' ? '' : Number(e.target.value))}/>
                            </label>
                        </div>
                    </>
                )}
                {source === 'file' && (
                    <div>
                        <label>Upload JSON: </label>
                        <input type='file' accept='.json' onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}/>
                    </div>
                )}

                <div className='rounds-number'>
                    <label>
                    Number of rounds: 
                    <input type='number' min='3' max='10' value={rounds} onChange={(e) => setRounds(Number(e.target.value))}/>
                    </label>
                </div>

                <div className='mode'>
                    <label>Game mode: </label>
                    <select value={mode} onChange={(e) => setMode(e.target.value)}>
                        <option value='human'>Human vs Human</option>
                        <option value='ai'>Human vs AI</option>
                    </select>
                </div>

                <div className='error-message'>{errorMessage}</div>

                <button onClick={handler}>Start game</button>
                <button onClick={() => navigate('/')}>Back to menu</button>
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
            <div className='app-container'>
                <h2>No game generated!</h2>
                <button onClick={() => navigate('/menu-ef')}>Back to settings</button>
            </div>
        );
    }

    const move = async (graphId: string, nodeId: string) => {
        if (status == 'game_over') {
            return false;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_id: state.game_id,
                    graph_id: graphId,
                    node_id: nodeId
                })
            });
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

    return (
        <div className='app-container'>
           <h1>EF Game</h1>
           <div className='status-bar'>
               <div>Status: {message}</div>
               <div>Round: {round}/{state.maxRounds}</div>
           </div>
           <div className='boards-container'>
              <div className='player'>
                  <h2>G1</h2>
                  <Graph data={state.g1} color='#4a90e2' selectedNodes={movesG1} nodeClick={(id) => move('g1', id)} />
              </div>
              <div className='player'>
                  <h2>G2</h2>
                  <Graph data={state.g2} color='#e24a4a' selectedNodes={movesG2} nodeClick={(id) => move('g2', id)} />
              </div>
           </div>
           {status === 'game_over' && (
              <button onClick={() => navigate('/menu-ef')} className='back-button'>Back to menu</button>
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
          </Routes>
        </BrowserRouter>
    );
}

export default App;
