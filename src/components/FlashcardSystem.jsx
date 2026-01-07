import { useState, useCallback, useEffect } from 'react';
import './FlashcardSystem.css';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Point pdf.js at the correct worker
GlobalWorkerOptions.workerSrc = workerSrc;

// Radio button options for flashcard count
const FLASHCARD_OPTIONS = [2, 4, 6, 8, 10, 12];


const FlashcardSystem = () => {
    const [flashcards, setFlashcards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [reviewMode, setReviewMode] = useState(false);
    const [score, setScore] = useState(0);
    const [totalReviewed, setTotalReviewed] = useState(0);
    const [pdfText, setPdfText] = useState('');
    const [numCards, setNumCards] = useState(4);
    const [isGenerating, setIsGenerating] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Test state
    const [test, setTest] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isCreatingTest, setIsCreatingTest] = useState(false);
    const [showReview, setShowReview] = useState(false);

    // Matching game state
        const isTestComplete = test.length > 0 && Object.keys(selectedAnswers).length === test.length;
    const [matchingTiles, setMatchingTiles] = useState([]);
    const [flippedTiles, setFlippedTiles] = useState([]);
    const [matchingScore, setMatchingScore] = useState(0);
    const [isCheckingMatch, setIsCheckingMatch] = useState(false);
    const [matchingGameWon, setMatchingGameWon] = useState(false);
    const [showMatchingGame, setShowMatchingGame] = useState(false);

    // Show message notification
    const showMessage = useCallback((text, type) => {
        setMessage({ text, type });
        if (type !== 'error') {
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    }, []);

    // Handle PDF upload
    const handlePdfUpload = useCallback(async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await extractTextFromPdf(file);
            setPdfText(text);
            showMessage('PDF uploaded successfully! Click "Generate Flashcards" to create Q&A pairs.', 'success');
        } catch (error) {
            showMessage(`Error reading PDF: ${error.message}`, 'error');
        }
    }, [showMessage]);

    // Extract text from PDF
    const extractTextFromPdf = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        const pages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items
                .map((item) => item.str)
                .filter(Boolean);
            pages.push(strings.join(' '));
        }

        return pages.join('\n\n');
    };

    // Generate flashcards
    const generateFlashcards = useCallback(async () => {
        const textToAnalyze = pdfText.trim();

        if (!textToAnalyze) {
            showMessage('Please upload a PDF or enter text first.', 'error');
            return;
        }

        setIsGenerating(true);
        showMessage('Generating flashcards...', 'info');

        const prompt = `You are an expert educator. Based on the following text, generate exactly ${numCards} flashcard questions and answers. 
        
        Format your response as a valid JSON array with no additional text, like this:
        [
            {"question": "What is X?", "answer": "X is..."},
            {"question": "How does Y work?", "answer": "Y works by..."}
            ]
            
            Text to analyze:
            ${textToAnalyze.substring(0, 2000)}`;

        setTimeout(async () => {
            try {
                // Call local Ollama API
                const response = await fetch('https://senary-hydrothermally-susan.ngrok-free.dev',{
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                    model: 'mistral',
                    prompt,
                    stream: false,
                })
                });

                const content = (response?.response || '').trim();

                // Extract JSON from response
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                    throw new Error('Invalid response format - could not extract JSON from Ollama response');
                }

                const parsedFlashcards = JSON.parse(jsonMatch[0]);
                setFlashcards(parsedFlashcards);
                setCurrentIndex(0);
                setScore(0);
                setTotalReviewed(0);
                setIsFlipped(false);
                setReviewMode(false);

                showMessage(`Generated ${parsedFlashcards.length} flashcards!`, 'success');
            } catch (error) {
                console.error('Flashcard generation error:', error);
                showMessage(`Error: ${error.message}`, 'error');
            } finally {
                setIsGenerating(false);
            }
        }, 10000);
    }, [pdfText, numCards, showMessage]);

    // Toggle flip
    const toggleFlip = useCallback(() => {
        setIsFlipped(prev => !prev);
    }, []);

    // Next flashcard
    const nextFlashcard = useCallback(() => {
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        }
    }, [currentIndex, flashcards.length]);

    // Previous flashcard
    const prevFlashcard = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsFlipped(false);
        }
    }, [currentIndex]);

    // Mark correct
    const markCorrect = useCallback(() => {
        setScore(prev => prev + 1);
        setTotalReviewed(prev => prev + 1);
        nextFlashcard();
    }, [nextFlashcard]);

    // Mark incorrect
    const markIncorrect = useCallback(() => {
        setTotalReviewed(prev => prev + 1);
        nextFlashcard();
    }, [nextFlashcard]);

    // Toggle review mode
    const toggleReviewMode = () => {
        if (!reviewMode) {
            setScore(0);
            setTotalReviewed(0);
            setCurrentIndex(0);
            setIsFlipped(false);
        }
        setReviewMode(prev => !prev);
    };

    // Export flashcards
    const exportFlashcards = useCallback(() => {
        const dataStr = JSON.stringify(flashcards, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'flashcards.json';
        link.click();
        URL.revokeObjectURL(url);
    }, [flashcards]);

    // Import flashcards
    const importFlashcards = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                setFlashcards(imported);
                setCurrentIndex(0);
                setScore(0);
                setTotalReviewed(0);
                setIsFlipped(false);
                setReviewMode(false);
                showMessage(`Imported ${imported.length} flashcards!`, 'success');
            } catch (error) {
                showMessage(`Error importing flashcards: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }, [showMessage]);

    // Handle answer selection
    const handleAnswerSelect = useCallback((answer) => {
        const currentQ = test[currentQuestion];
        const isCorrect = answer === currentQ.correctAnswer;

        setSelectedAnswers(prev => ({
            ...prev,
            [currentQuestion]: answer
        }));

        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        // Auto move to next question after 1 second
        setTimeout(() => {
            if (currentQuestion < test.length - 1) {
                setCurrentQuestion(prev => prev + 1);
            }
        }, 1000);
    }, [currentQuestion, test]);

    const handleClearTest = useCallback(() => {
        setTest([]);
        setCurrentQuestion(0);
        setSelectedAnswers({});
        setScore(0);
        setShowReview(false);
    }, []);

    // Start matching game
    const startMatchingGame = useCallback(() => {
        if (flashcards.length < numCards) {
            showMessage(`Generate at least ${numCards} flashcards first!`, 'error');
            return;
        }

        // Use the selected number of flashcards
        const cardsToUse = flashcards.slice(0, numCards);
        
        // Create tiles: questions and answers as separate tiles
        const tiles = [];
        cardsToUse.forEach((card, idx) => {
            tiles.push({
                id: `q-${idx}`,
                content: card.question,
                matchId: idx,
                type: 'question',
                isFlipped: false,
                isMatched: false
            });
            tiles.push({
                id: `a-${idx}`,
                content: card.answer,
                matchId: idx,
                type: 'answer',
                isFlipped: false,
                isMatched: false
            });
        });

        // Shuffle tiles
        const shuffled = tiles.sort(() => Math.random() - 0.5);
        
        setMatchingTiles(shuffled);
        setFlippedTiles([]);
        setMatchingScore(0);
        setMatchingGameWon(false);
        setShowMatchingGame(true);
    }, [flashcards, numCards, showMessage]);

    // Handle matching tile click
    const handleMatchingTileClick = useCallback((tileId) => {
        if (isCheckingMatch || flippedTiles.length >= 2) return;
        
        const tile = matchingTiles.find(t => t.id === tileId);
        if (tile.isFlipped || tile.isMatched) return;

        // Flip the tile
        const updatedTiles = matchingTiles.map(t => 
            t.id === tileId ? { ...t, isFlipped: true } : t
        );
        setMatchingTiles(updatedTiles);
        
        const newFlippedTiles = [...flippedTiles, tileId];
        setFlippedTiles(newFlippedTiles);
    }, [isCheckingMatch, flippedTiles, matchingTiles]);

    // Check for matches when two tiles are flipped
    useEffect(() => {
        if (flippedTiles.length === 2) {
            setIsCheckingMatch(true);
            
            const [tile1Id, tile2Id] = flippedTiles;
            const tile1 = matchingTiles.find(t => t.id === tile1Id);
            const tile2 = matchingTiles.find(t => t.id === tile2Id);

            if (tile1.matchId === tile2.matchId) {
                // Match found
                setMatchingScore(prev => prev + 1);
                const updatedTiles = matchingTiles.map(t => 
                    (t.id === tile1Id || t.id === tile2Id) 
                        ? { ...t, isMatched: true } 
                        : t
                );
                setMatchingTiles(updatedTiles);
                setFlippedTiles([]);
                setIsCheckingMatch(false);

                // Check for win
                if (updatedTiles.every(t => t.isMatched)) {
                    setTimeout(() => {
                        setMatchingGameWon(true);
                    }, 500);
                }
            } else {
                // No match - flip back after delay
                setTimeout(() => {
                    const updatedTiles = matchingTiles.map(t => 
                        (t.id === tile1Id || t.id === tile2Id) 
                            ? { ...t, isFlipped: false } 
                            : t
                    );
                    setMatchingTiles(updatedTiles);
                    setFlippedTiles([]);
                    setIsCheckingMatch(false);
                }, 1000);
            }
        }
    }, [flippedTiles, matchingTiles]);

    const handleExitMatchingGame = useCallback(() => {
        setShowMatchingGame(false);
        setMatchingTiles([]);
        setFlippedTiles([]);
        setMatchingScore(0);
        setMatchingGameWon(false);
    }, []);

    const currentFlashcard = flashcards[currentIndex];
    const percentage = totalReviewed > 0 ? Math.round((score / totalReviewed) * 100) : 0;

    // Generate practice test
    const generateTest = useCallback(async () => {
        const textToAnalyze = pdfText.trim();

        if (!textToAnalyze) {
            showMessage('Please upload a PDF or enter text first.', 'error');
            return;
        }

        setIsCreatingTest(true);
        showMessage('Generating test...', 'info');

        const prompt = `You are an expert educator. Based on the following text, generate exactly 10 multiple choice questions with exactly 4 possible answers each. Only one answer is correct.
        
        Format your response as a valid JSON array with no additional text, like this:
        [
            {"question": "What is X?", "answers": ["X is correct", "Wrong answer 1", "Wrong answer 2", "Wrong answer 3"], "correctAnswer": "X is correct"},
            {"question": "How does Y work?", "answers": ["Y works correctly", "Wrong answer 1", "Wrong answer 2", "Wrong answer 3"], "correctAnswer": "Y works correctly"}
        ]
        
        Text to analyze:
        ${textToAnalyze.substring(0, 2000)}`;

        setTimeout(async () => {
            try {
                const response = await fetch('https://senary-hydrothermally-susan.ngrok-free.dev',{
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                    model: 'mistral',
                    prompt,
                    stream: false,
                })
                });

                console.log('Test Ollama response:', response);
                const content = response.response.trim();

                // Extract JSON from response
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                    throw new Error('Invalid response format - could not extract JSON from Ollama response');
                }

                const parsedTest = JSON.parse(jsonMatch[0]);
                setTest(parsedTest);
                setCurrentQuestion(0);
                setSelectedAnswers({});
                setScore(0);

                showMessage(`Generated test with ${parsedTest.length} questions!`, 'success');
            } catch (error) {
                console.error('Test generation error:', error);
                showMessage(`Error: ${error.message}`, 'error');
            } finally {
                setIsCreatingTest(false);
            }
        }, 10000);
    }, [pdfText, showMessage]);

    return (
        <div className="flashcard-system">
            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {test.length > 0 ? (
                <div className="test-container">
                    <div className="test-header">
                        <h2>Practice Test</h2>
                        <button className="exit-test-btn" onClick={handleClearTest}>← Back to Main</button>
                    </div>
                    <div className="question-section">
                        <div className="question-count">Question {currentQuestion + 1}/{test.length}</div>
                        <div className="question-text">{test[currentQuestion].question}</div>
                    </div>
                    <div className="answer-section">
                        {test[currentQuestion].answers.map((answer, index) => (
                            <button
                                key={index}
                                className={`answer-btn ${selectedAnswers[currentQuestion] === answer ? 'selected' : ''} ${selectedAnswers[currentQuestion] && answer === test[currentQuestion].correctAnswer ? 'correct' : ''}`}
                                onClick={() => handleAnswerSelect(answer)}
                                disabled={selectedAnswers[currentQuestion] !== undefined}
                            >
                                {answer}
                            </button>
                        ))}
                    </div>
                    <div className="test-results">Score: {score}/{test.length}</div>
                    <div className="test-actions">
                        {isTestComplete && (
                            <>
                                <button className="print-results-btn" onClick={() => window.print()}>🖨️ Print Results</button>
                                <button className="review-results-btn" onClick={() => setShowReview(v => !v)}>
                                    {showReview ? 'Hide Review' : 'Review Results'}
                                </button>
                                <button className="clear-test-btn" onClick={handleClearTest}>Take Another Test</button>
                            </>
                        )}
                    </div>
                </div>
            ) : showMatchingGame ? (
                <div className="matching-game-container">
                    <div className="game-header">
                        <h2>Matching Game</h2>
                        <button className="exit-game-btn" onClick={handleExitMatchingGame}>← Back to Main</button>
                    </div>
                    <div className="score-display">Matches: {matchingScore}/{matchingTiles.length / 2}</div>
                    <div className="tiles-grid">
                        {matchingTiles.map(tile => (
                            <div
                                key={tile.id}
                                className={`tile ${tile.type} ${tile.isFlipped || tile.isMatched ? 'flipped' : ''}`}
                                onClick={() => handleMatchingTileClick(tile.id)}
                            >
                                <div className="tile-front">?</div>
                                <div className="tile-back">{tile.content}</div>
                            </div>
                        ))}
                    </div>
                    {matchingGameWon && (
                        <div className="game-over">
                            <h3>You Win! 🎉</h3>
                            <button className="reset-btn" onClick={startMatchingGame}>Play Again</button>
                            <button className="exit-btn" onClick={handleExitMatchingGame}>Back to Flashcards</button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flashcard-setup">
                    <h1>Flashcard Memory Game</h1>
                    <p><strong>Directions:</strong> Upload a PDF or paste text to generate flashcards for your study session. Choose the number of flashcards and start learning. You can also play a matching game or create a practice test.</p>

                    <div className="input-group">
                        <label htmlFor="pdf-upload">Upload PDF:</label>
                        <input type="file" id="pdf-upload" accept=".pdf,.txt" onChange={handlePdfUpload} className="generate-btn" />
                    </div>

                    <div className="input-group">
                        <label htmlFor="pdf-text">Or Paste Text:</label>
                        <textarea id="pdf-text" value={pdfText} onChange={(e) => setPdfText(e.target.value)} placeholder="Paste your text here..." rows="6" />
                    </div>

                    <div className="input-group">
                        <label>How many flashcards do you want?</label>
                        <div className="radio-options">
                            {FLASHCARD_OPTIONS.map(option => (
                                <label key={option} className="radio-label">
                                    <input type="radio" name="num-cards" value={option} checked={numCards === option} onChange={(e) => setNumCards(parseInt(e.target.value))} />
                                    <span>{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button className="generate-btn" onClick={generateFlashcards} disabled={isGenerating || !pdfText.trim()}>
                        {isGenerating ? 'Generating...' : 'Generate Flashcards'}
                    </button>

                    <button className="generate-test" onClick={generateTest} disabled={isCreatingTest || !pdfText.trim()}>
                        {isCreatingTest ? 'Creating Test...' : 'Generate Test'}
                    </button>
                </div>
            )}

            {flashcards.length > 0 && !test.length && !showMatchingGame && (
                <div className="flashcard-container">
                    <div className="progress">{currentIndex + 1} / {flashcards.length}</div>

                    <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={toggleFlip}>
                        <div className="flashcard-front">{currentFlashcard?.question}</div>
                        <div className="flashcard-back">{currentFlashcard?.answer}</div>
                    </div>

                    <div className="nav-buttons">
                        <button className="nav-btn" onClick={prevFlashcard} disabled={currentIndex === 0}>← Previous</button>
                        <button className="nav-btn" onClick={nextFlashcard} disabled={currentIndex === flashcards.length - 1}>Next →</button>
                    </div>

                    {reviewMode && (
                        <div className="flashcard-controls">
                            <button className="correct-btn" onClick={markCorrect}>✓ Correct</button>
                            <button className="incorrect-btn" onClick={markIncorrect}>✗ Incorrect</button>
                        </div>
                    )}

                    {reviewMode && (
                        <div className="score-display">{score}/{totalReviewed} ({percentage}%)</div>
                    )}

                    <div className="action-buttons">
                        <button className={`review-btn ${reviewMode ? 'active' : ''}`} onClick={toggleReviewMode}>
                            {reviewMode ? 'Exit Review Mode' : 'Start Review Mode'}
                        </button>
                        <button className="matching-game-btn" onClick={startMatchingGame}>🎮 Play Matching Game</button>
                        <button className="export-btn" onClick={exportFlashcards}>Export</button>
                        <button className="import-btn">
                            Import
                            <input type="file" accept=".json" onChange={importFlashcards} style={{ display: 'none' }} />
                        </button>
                    </div>
                </div>
            )}

            {isTestComplete && (
                <div className="print-area">
                    <h1>Practice Test Results</h1>
                    <div className="print-meta">
                        <div>Date: {new Date().toLocaleString()}</div>
                        <div>Score: {score}/{test.length}</div>
                    </div>
                    <ol className="print-questions">
                        {test.map((q, idx) => {
                            const userAns = selectedAnswers[idx];
                            return (
                                <li key={idx} className="print-question">
                                    <div className="q-text">{q.question}</div>
                                    <ul className="print-answers">
                                        {q.answers.map((ans, i) => {
                                            const isCorrect = ans === q.correctAnswer;
                                            const isSelected = ans === userAns;
                                            const cls = isCorrect && isSelected
                                                ? 'answer selected-correct'
                                                : isCorrect
                                                    ? 'answer correct'
                                                    : isSelected
                                                        ? 'answer selected-wrong'
                                                        : 'answer';
                                            return (
                                                <li key={i} className={cls}>
                                                    <span className="answer-text">{ans}</span>
                                                    {isCorrect && <span className="badge correct">Correct</span>}
                                                    {isSelected && !isCorrect && <span className="badge chosen">Your Answer</span>}
                                                    {isSelected && isCorrect && <span className="badge chosen-correct">Your Answer ✓</span>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            )}

            {isTestComplete && showReview && (
                <div className="review-results">
                    <div className="review-header">
                        <h2>Review Results</h2>
                        <div className="review-score">Score: {score}/{test.length}</div>
                    </div>
                    <ol className="review-questions">
                        {test.map((q, idx) => {
                            const userAns = selectedAnswers[idx];
                            return (
                                <li key={idx} className="review-question">
                                    <div className="q-text">{q.question}</div>
                                    <ul className="review-answers">
                                        {q.answers.map((ans, i) => {
                                            const isCorrect = ans === q.correctAnswer;
                                            const isSelected = ans === userAns;
                                            const cls = isCorrect && isSelected
                                                ? 'review-answer selected-correct'
                                                : isCorrect
                                                    ? 'review-answer correct'
                                                    : isSelected
                                                        ? 'review-answer selected-wrong'
                                                        : 'review-answer';
                                            return (
                                                <li key={i} className={cls}>
                                                    <span className="answer-text">{ans}</span>
                                                    {isCorrect && <span className="badge correct">Correct</span>}
                                                    {isSelected && !isCorrect && <span className="badge chosen">Your Answer</span>}
                                                    {isSelected && isCorrect && <span className="badge chosen-correct">Your Answer ✓</span>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            )}
        </div>
    );
};

export default FlashcardSystem;
