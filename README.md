# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# Flashcard & Memory Game App

A web application featuring two interactive learning games: a classic Memory Game and an AI-powered Flashcard Generator.

## Features

### 🎮 Memory Game
- Classic flip-and-match memory game
- 12 tiles with images
- Score tracking
- Flip animation with 3D perspective

### 📚 AI Flashcard Generator
- Upload PDF files or paste study material
- ChatGPT integration to generate Q&A flashcard pairs
- Interactive flashcard review with flip animation
- Review mode with performance tracking
- Export/Import flashcards as JSON
- Previous/Next navigation
- Customizable number of flashcards

## Setup Instructions

### 1. Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API key (for ChatGPT integration)

### 2. Getting Your OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to API keys section
4. Create a new API key
5. Copy your API key

### 3. Configuration
Edit `flashcard.js` and replace the placeholder with your actual OpenAI API key:

```javascript
const OPENAI_API_KEY = "your-actual-api-key-here";
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
- **OpenAI API** - ChatGPT for question generation

## File Structure
```
├── index.html       # Main HTML file with both game and flashcard sections
├── index.css        # All styling for both games
├── index.js         # Memory game logic and tab navigation
├── flashcard.js     # Flashcard system with ChatGPT integration
└── images/          # Memory game images
```

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

## API Usage Notes
- Each flashcard generation uses OpenAI API tokens
- Approximate cost depends on text length and number of cards
- API calls are made from the client-side (your browser)
- Keep your API key private and secure

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

**"API key not set" error**: Make sure you've added your OpenAI API key to `flashcard.js`

**PDF upload not working**: Some PDFs may require additional parsing libraries. Try copying text manually instead.

**API errors**: Check your API key is valid and has usage quota remaining on openai.com

## License
Open source - feel free to modify and use!
