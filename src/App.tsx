import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PokemonLibrary from './pages/PokemonLibrary';
import CompletePokemonLibrary from './pages/CompletePokemonLibrary';
import MyPokemon from './pages/MyPokemon';
import Breeding from './pages/Breeding';
import PokemonDetail from './pages/PokemonDetail';
import ShinyLibrary from './pages/ShinyLibrary';
import './index.css';

function App() {
  return (
    <HashRouter>
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<PokemonLibrary />} />
          <Route path="/pets" element={<CompletePokemonLibrary />} />
          <Route path="/shiny" element={<ShinyLibrary />} />
          <Route path="/pokemon/:baseId" element={<PokemonDetail />} />
          <Route path="/my-pokemon" element={<MyPokemon />} />
          <Route path="/breeding" element={<Breeding />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

export default App;
