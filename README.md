
# Flashcard Matching Game App

A Vite + React study app with Ollama-powered flashcards, practice tests, a matching-card game, and Neon/Vercel-backed user accounts with saved history.

<img width="1036" height="838" alt="Screenshot 2026-01-08 203930" src="https://github.com/user-attachments/assets/3ded395d-ce56-421a-b3da-3a5e1bbc2de5" />



## Features

### 📚 AI Flashcard Generator
- Upload PDF files or paste study material on any topic
- Ollama integration to generate Q&A flashcard pairs (Mistral)
- Interactive flashcard review with flip animation
- Matching game generated from your flashcards
- Email/password login backed by Neon + Vercel
- Save and reload up to 10 flashcard sets per user
- Save and reload up to 10 tests per user
- Delete older saved items before creating more once you reach the cap
- Review mode with performance tracking
- Export/Import flashcards as JSON
- Previous/Next navigation
- Customizable number of flashcards
- Print test results

## Setup Instructions

### 1. Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Install Ollama locally or use an instance elsewhere
 - A Neon Postgres database
 - A Vercel project connected to this repository for deployment


### 2. Configuration
Create a `.env` file from `.env.example` and set:

```bash
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
VITE_OLLAMA_BASE_URL=http://127.0.0.1:11434
VITE_OLLAMA_MODEL=mistral
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://127.0.0.1:3000
```

Then make sure the model is installed locally:

```bash
ollama pull mistral
ollama serve
```

### 3. Running the App Locally
1. Start the Vercel API layer in one terminal:

```bash
npm run dev:api
```

2. Start the Vite frontend in a second terminal:

```bash
npm run dev
```

3. Open the Vite URL, create an account, then generate/save flashcards and tests.

### 4. Database
The app auto-creates its tables on first API request. The schema is also included in `db/schema.sql` if you want to review or run it manually.

Tables:
- `users`
- `sessions`
- `saved_flashcard_sets`
- `saved_tests`

### 5. Vercel Deployment
1. Create a Neon database and copy its connection string into `DATABASE_URL`
2. In Vercel, add the same environment variables from `.env.example`
3. Deploy the repository to Vercel
4. Make sure Ollama is reachable from wherever you want generation to run, or point `VITE_OLLAMA_BASE_URL` at your Ollama host

## How to Use

### Flashcard Generator
1. **Add Study Material**: Either
   - Upload a PDF file using the upload button
   - Paste text directly into the text area
2. **Customize**: Set the number of flashcards you want to generate (1-50)
3. **Generate**: Click "Generate Flashcards with ChatGPT"
4. **Study**: 
   - Click flashcards to reveal answers
   - Use Previous/Next buttons to navigate
5. **Save or Reload**:
   - Create an account or log in from the uploader screen
   - Save up to 10 flashcard sets and 10 tests
   - Load or delete previous saves from the account panel
6. **Review Mode**:
   - Click "Start Review Mode" to test yourself
   - Mark answers as correct/incorrect
   - Track your performance score
7. **Export/Import**: Save your flashcards as JSON for later use

## Technologies Used
- **React + Vite** - Frontend
- **CSS3** - Styling with 3D transforms and animations
- **Vercel Serverless Functions** - API and auth endpoints
- **Neon Postgres** - User accounts and saved history
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

**Ollama connection errors**:
1. Confirm Ollama is running at `http://127.0.0.1:11434`
2. Confirm your selected model is installed with `ollama list`
3. If you changed the Ollama URL, update `VITE_OLLAMA_BASE_URL` in `.env`

**Login or save errors**:
1. Confirm `DATABASE_URL` is set for both local Vercel dev and Vercel production
2. Start the API layer with `npm run dev:api`
3. Make sure the frontend can reach `/api` through the Vite proxy or `VITE_API_BASE_URL`

## License
Open source - feel free to modify and use!
