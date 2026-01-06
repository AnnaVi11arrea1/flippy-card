import { useState } from 'react'
import './App.css'
import MemoryGame from './components/MemoryGame.jsx';
import FlashcardSystem from './components/FlashcardSystem.jsx';



function App() {

  return (
    <div className="App">
      <MemoryGame />
      <FlashcardSystem />
    </div>
  );
}

export default App;
