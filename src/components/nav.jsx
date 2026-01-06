import React from 'react';
import '../index.css';

export default function Nav() {
    return (
        <nav>
            <div className="nav-tabs">
                <button className="tab-btn active" data-tab="game">Memory Game</button>
                <button className="tab-btn" data-tab="flashcard">Flashcards</button>
            </div>
        </nav>
    );
}