import { useState } from 'react'
import './App.css'
import Nav from './components/nav.jsx';
import MemoryGame from './components/MemoryGame.jsx';
import FlashcardSystem from './components/FlashcardSystem.jsx';



function App() {

  return (
    <div className="App">
      <Nav />
      <MemoryGame />
      <FlashcardSystem />
    </div>
  );
}

export default App;
