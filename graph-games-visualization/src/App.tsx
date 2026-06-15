import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Menu from './views/Menu';
import EFMenu from './views/EFMenu';
import EFGame from './views/EFGame';
import PebblesMenu from './views/PebblesMenu';
import PebblesGame from './views/PebblesGame';

// app component, contains the router that generates a specific view for every endpoint
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Menu />} />
                <Route path="/ef-menu" element={<EFMenu />} />
                <Route path="/ef" element={<EFGame />} />
                <Route path="/pebbles-menu" element={<PebblesMenu />} />
                <Route path="/pebbles" element={<PebblesGame />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App;
