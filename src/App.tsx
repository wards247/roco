import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PokemonLibrary from './pages/PokemonLibrary';
import MyPokemon from './pages/MyPokemon';
import Breeding from './pages/Breeding';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<PokemonLibrary />} />
          <Route path="/my-pokemon" element={<MyPokemon />} />
          <Route path="/breeding" element={<Breeding />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;