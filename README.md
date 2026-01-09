
# Flashcard & Memory Game App

A web application featuring an interactive classic Memory Game and an AI-powered Flashcard Generator. 

<img width="1036" height="838" alt="Screenshot 2026-01-08 203930" src="https://github.com/user-attachments/assets/3ded395d-ce56-421a-b3da-3a5e1bbc2de5" />



## Features

### 🎮 Memory Game
- Classic flip-and-match memory game
- 12 tiles with images
- Score tracking
- Flip animation with 3D perspective

### 📚 AI Flashcard Generator
- Upload PDF files or paste study material on any topic
- Ollama integration to generate Q&A flashcard pairs (Mistral)
- Interactive flashcard review with flip animation
- Review mode with performance tracking
- Export/Import flashcards as JSON
- Previous/Next navigation
- Customizable number of flashcards
- Print test results

## Setup Instructions

### 1. Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Install Ollama locally or use an instance elsewhere


### 3. Configuration
Set your personal environment variables

```javascript
const OLLAMA_API_KEY = "your-actual-api-key-here";
```

### 4. Running the App
1. Simply open `index.html` in your web browser
2. Navigate between "Memory Game" and "Flashcards" tabs

## How to Use

### Memory Game
1. Click "Play Sample Game" button
2. Click tiles to flip and find matching pairs
3. Match all pairs to win
4. Score increases with each successful match

### Flashcard Generator
1. **Add Study Material**: Either
   - Upload a PDF file using the upload button
   - Paste text directly into the text area
2. **Customize**: Set the number of flashcards you want to generate (1-50)
3. **Generate**: Click "Generate Flashcards with ChatGPT"
4. **Study**: 
   - Click flashcards to reveal answers
   - Use Previous/Next buttons to navigate
5. **Review Mode**:
   - Click "Start Review Mode" to test yourself
   - Mark answers as correct/incorrect
   - Track your performance score
6. **Export/Import**: Save your flashcards as JSON for later use

## Technologies Used
- **HTML5** - Structure
- **CSS3** - Styling with 3D transforms and animations
- **Vanilla JavaScript** - All functionality
- **Ollama** - Ollama for question generation

## Flashcard JSON Format
When exporting flashcards, the format is:
```json
[
  {
    "question": "What is X?",
    "answer": "X is..."
  },
  {
    "question": "How does Y work?",
    "answer": "Y works by..."
  }
]
```

You can import this JSON file to reload your flashcards.

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14+)

## Limitations & Future Improvements
- PDF parsing is simplified; complex PDFs may need external library (pdfjs-dist)
- Mobile responsive design can be enhanced
- Could add spaced repetition algorithm
- Could add difficulty levels for memory game
- Could add local storage for automatic save

## Troubleshooting

**PDF upload not working**: Some PDFs may require additional parsing libraries. Try copying text manually instead.

**API errors**: Check your API key is valid and has usage quota remaining on openai.com

## License
Open source - feel free to modify and use!
