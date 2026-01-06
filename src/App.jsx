import { useState } from 'react'
import './App.css'
import MemoryGame from './components/MemoryGame.jsx';
import FlashcardSystem from './components/FlashcardSystem.jsx';



function App() {
  const [showDemo, setShowDemo] = useState(true);

  return (
    <div className="App">
      <div className="demo-toggle">
        <button onClick={() => setShowDemo(!showDemo)} className="hide-demo-btn">
          {showDemo ? '✕ Hide Demo' : '+ Show Demo'}
        </button>
      </div>
      {showDemo && <MemoryGame />}
      <FlashcardSystem />
    </div>
  );
}

export default App;
