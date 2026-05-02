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

    const handler = async () => {
        try {
            setErrorMessage('');
            if (V == '' || E == '') {
                throw new Error('Please insert the number of vertices and edges!');
            }

            const response = await fetch('http://127.0.0.1:5000/generate-ef', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    n: V, 
                    m: E, 
                    rounds: rounds,
                    mode: mode,
                })
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
                maxRounds: rounds ,
                mode: mode
              }
            });
        } catch (e: any) {
          setErrorMessage(e.message);
        }
    };

    return (
        <div className='app-container'>
            <button onClick={() => navigate('/')}>Back to menu</button>
            <h1>Settings</h1>
            <div className='menu-ef'>
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
            return;
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
                return;
            }

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
        } catch (e) {
            console.error(e);
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
                  <Graph data={state.g1} color='#4a90e2' nodeClick={(id) => move('g1', id)} />
              </div>
              <div className='player'>
                  <h2>G2</h2>
                  <Graph data={state.g2} color='#e24a4a' nodeClick={(id) => move('g2', id)} />
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
