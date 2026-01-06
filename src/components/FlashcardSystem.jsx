import { useState, useCallback } from 'react';
import './FlashcardSystem.css';
import ollama from 'ollama';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Point pdf.js at the correct worker
GlobalWorkerOptions.workerSrc = workerSrc;


const FlashcardSystem = () => {
    const [flashcards, setFlashcards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [reviewMode, setReviewMode] = useState(false);
    const [score, setScore] = useState(0);
    const [totalReviewed, setTotalReviewed] = useState(0);
    const [pdfText, setPdfText] = useState('');
    const [numCards, setNumCards] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

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
                const response = await ollama.generate({
                    model: 'mistral',
                    prompt: prompt,
                    stream: false,
                });

                console.log('Ollama response:', response);
                const content = response.response.trim();
                
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
    const toggleReviewMode = useCallback(() => {
        if (!reviewMode) {
            setScore(0);
            setTotalReviewed(0);
            setCurrentIndex(0);
            setIsFlipped(false);
        }
        setReviewMode(prev => !prev);
    }, [reviewMode]);

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

    const currentFlashcard = flashcards[currentIndex];
    const percentage = totalReviewed > 0 ? Math.round((score / totalReviewed) * 100) : 0;

    return (
        <div className="flashcard-system">
            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="flashcard-setup">
                <h2>Flashcard Generator</h2>

                <div className="input-group">
                    <label htmlFor="pdf-upload">Upload PDF or Text:</label>
                    <input
                        type="file"
                        id="pdf-upload"
                        accept=".pdf,.txt"
                        onChange={handlePdfUpload}
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="pdf-text">Or paste text:</label>
                    <textarea
                        id="pdf-text"
                        value={pdfText}
                        onChange={(e) => setPdfText(e.target.value)}
                        placeholder="Paste your text here..."
                        rows="6"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="num-cards">Number of flashcards:</label>
                    <input
                        type="number"
                        id="num-cards"
                        value={numCards}
                        onChange={(e) => setNumCards(parseInt(e.target.value) || 5)}
                        min="1"
                        max="50"
                    />
                </div>

                <button
                    className="generate-btn"
                    onClick={generateFlashcards}
                    disabled={isGenerating || !pdfText.trim()}
                >
                    {isGenerating ? 'Generating...' : 'Generate Flashcards'}
                </button>
            </div>

            {flashcards.length > 0 && (
                <div className="flashcard-container">
                    <div className="progress">
                        {currentIndex + 1} / {flashcards.length}
                    </div>

                    <div
                        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
                        onClick={toggleFlip}
                    >
                        <div className="flashcard-front">
                            {currentFlashcard?.question}
                        </div>
                        <div className="flashcard-back">
                            {currentFlashcard?.answer}
                        </div>
                    </div>

                    <div className="nav-buttons">
                        <button
                            className="nav-btn"
                            onClick={prevFlashcard}
                            disabled={currentIndex === 0}
                        >
                            ← Previous
                        </button>
                        <button
                            className="nav-btn"
                            onClick={nextFlashcard}
                            disabled={currentIndex === flashcards.length - 1}
                        >
                            Next →
                        </button>
                    </div>

                    {reviewMode && (
                        <div className="flashcard-controls">
                            <button className="correct-btn" onClick={markCorrect}>
                                ✓ Correct
                            </button>
                            <button className="incorrect-btn" onClick={markIncorrect}>
                                ✗ Incorrect
                            </button>
                        </div>
                    )}

                    {reviewMode && (
                        <div className="score-display">
                            {score}/{totalReviewed} ({percentage}%)
                        </div>
                    )}

                    <div className="action-buttons">
                        <button
                            className={`review-btn ${reviewMode ? 'active' : ''}`}
                            onClick={toggleReviewMode}
                        >
                            {reviewMode ? 'Exit Review Mode' : 'Start Review Mode'}
                        </button>
                        <button className="export-btn" onClick={exportFlashcards}>
                            Export
                        </button>
                        <label className="import-btn">
                            Import
                            <input
                                type="file"
                                accept=".json"
                                onChange={importFlashcards}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashcardSystem;
