import { useState } from 'react'
import './App.css'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Nav from './components/nav.jsx';
import MemoryGame from './components/MemoryGame.jsx';
import FlashcardSystem from './components/FlashcardSystem.jsx';
import ollama from 'ollama';

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
