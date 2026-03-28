import { useState } from 'react';
import { generateRandomGraph, parseToCytoscope } from './definitions';
import { Graph } from './Graph'

function App() {
    const [g1, setG1] = useState(parseToCytoscope(generateRandomGraph(6, 8)));
    const [g2, setG2] = useState(parseToCytoscope(generateRandomGraph(6, 8)));
    const [V, setV] = useState(6);
    const [E, setE] = useState(8);
    const [gameStarted, setGameStarted] = useState(false);

    return (
      <div className='app-container'>
        <h1>EF Game</h1>
        
        {gameStarted ? (
          <div className='boards-container'>
            <div className='player'>
              <h2>Player 1</h2>
              <Graph data={g1} color='#4a90e2' />
            </div>
            
            <div className='player'>
              <h2>Player 2</h2>
              <Graph data={g2} color='#e24a4a' />
            </div>
          </div>
        ) : (
          <div className='menu'>
              <div className='nodes-number'>
                <label>
                  Number of vertices (n): 
                  <input type='number' min='1' max='10' value={V} onChange={(e) => setV(Number(e.target.value))}/>
                </label>
              </div>
              <div className='edges-number'>
                <label>
                  Number of edges (m): 
                  <input type='number' min='0' max={V * V} value={E} onChange={(e) => setE(Number(e.target.value))}/>
                </label>
              </div>
              <button onClick={() => {
                setG1(parseToCytoscope(generateRandomGraph(V, E)));
                setG2(parseToCytoscope(generateRandomGraph(V, E)));
                setGameStarted(true);
              }}>Start Game</button>
          </div>
        )}

      </div>
    );
}

export default App;
