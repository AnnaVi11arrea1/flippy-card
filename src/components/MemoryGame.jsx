import { useState, useEffect } from 'react';
import './MemoryGame.css';

const images = [
    "url('/images/duck.jpeg')",
    "url('/images/lexicon.jpeg')", 
    "url('/images/peak.jpeg')", 
    "url('/images/queen.jpeg')", 
    "url('/images/satanic.jpeg')", 
    "url('/images/wolf.jpeg')"
];

const MemoryGame = () => {
    const [tiles, setTiles] = useState([]);
    const [flippedTiles, setFlippedTiles] = useState([]);
    const [score, setScore] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [gameWon, setGameWon] = useState(false);

    // Initialize game
    const startGame = () => {
        // Duplicate and shuffle images
        const pairedImages = [...images, ...images];
        const shuffled = pairedImages.sort(() => Math.random() - 0.5);
        
        // Create tile objects
        const newTiles = shuffled.map((image, index) => ({
            id: index,
            image: image,
            isFlipped: false,
            isMatched: false
        }));
        
        setTiles(newTiles);
        setFlippedTiles([]);
        setScore(0);
        setGameStarted(true);
        setGameWon(false);
    };

    // Handle tile click
    const handleTileClick = (tileId) => {
        if (isChecking || flippedTiles.length >= 2) return;
        
        const tile = tiles.find(t => t.id === tileId);
        if (tile.isFlipped || tile.isMatched) return;

        // Flip the tile
        const updatedTiles = tiles.map(t => 
            t.id === tileId ? { ...t, isFlipped: true } : t
        );
        setTiles(updatedTiles);
        
        const newFlippedTiles = [...flippedTiles, tileId];
        setFlippedTiles(newFlippedTiles);
    };

    // Check for matches when two tiles are flipped
    useEffect(() => {
        if (flippedTiles.length === 2) {
            setIsChecking(true);
            
            const [tile1Id, tile2Id] = flippedTiles;
            const tile1 = tiles.find(t => t.id === tile1Id);
            const tile2 = tiles.find(t => t.id === tile2Id);

            if (tile1.image === tile2.image) {
                // Match found
                setScore(prev => prev + 1);
                const updatedTiles = tiles.map(t => 
                    (t.id === tile1Id || t.id === tile2Id) 
                        ? { ...t, isMatched: true } 
                        : t
                );
                setTiles(updatedTiles);
                setFlippedTiles([]);
                setIsChecking(false);

                // Check for win
                if (updatedTiles.every(t => t.isMatched)) {
                    setTimeout(() => {
                        setGameWon(true);
                    }, 500);
                }
            } else {
                // No match - flip back after delay
                setTimeout(() => {
                    const updatedTiles = tiles.map(t => 
                        (t.id === tile1Id || t.id === tile2Id) 
                            ? { ...t, isFlipped: false } 
                            : t
                    );
                    setTiles(updatedTiles);
                    setFlippedTiles([]);
                    setIsChecking(false);
                }, 1000);
            }
        }
    }, [flippedTiles, tiles]);

    return (
        <div className="memory-game-container">
            <div className="game-header">
                {gameStarted && <div className="score-display">Score: {score}</div>}
            </div>

            {!gameStarted ? (
                <button className="start-btn" onClick={startGame}>
                    Play Demo Game
                </button>
            ) : (
                <>
                    <div className="tiles-grid">
                        {tiles.map(tile => (
                            <div
                                key={tile.id}
                                className={`tile ${tile.isFlipped || tile.isMatched ? 'flipped' : ''}`}
                                onClick={() => handleTileClick(tile.id)}
                            >
                                <div className="tile-front"></div>
                                <div 
                                    className="tile-back"
                                    style={{ backgroundImage: tile.image }}
                                ></div>
                            </div>
                        ))}
                    </div>

                    {gameWon && (
                        <div className="game-over">
                            <h3>You Win! 🎉</h3>
                            <button className="reset-btn" onClick={startGame}>
                                Play Again
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MemoryGame;
