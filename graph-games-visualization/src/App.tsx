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
    const [errorMessage, setErrorMessage] = useState('');

    const handler = async () => {
        try {
            setErrorMessage('');
            if (V == '' || E == '') {
                throw new Error('Please insert the number of vertices and edges!');
            }

            const response = await fetch('http://127.0.0.1:5000/generate-ef', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ n: V, m: E })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Server error!');
            }

            navigate('/ef', {
              state: { g1: data.g1, g2: data.g2, vertices: V, edges: E }
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

              <div className='error-message'>{errorMessage}</div>

              <button onClick={handler}>Start game</button>
            </div>
        </div>
    );
}

function GameEF() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { g1: any[], g2: any[], vertices: number, edges: number } | null;

    if (!state) {
        return (
            <div className='app-container'>
                <h2>No game generated!</h2>
                <button onClick={() => navigate('/menu-ef')}>Back to settings</button>
            </div>
        );
    }

    return (
        <div className='app-container'>
           <h1>EF Game</h1>
           <div className='boards-container'>
              <div className='player'>
                    <h2>Spoiler</h2>
                    <Graph data={state.g1} color='#4a90e2' />
              </div>
              <div className='player'>
                    <h2>Duplicator</h2>
                    <Graph data={state.g2} color='#e24a4a' />
              </div>
           </div>
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
