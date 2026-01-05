// Flashcard System - Uses ChatGPT to generate Q&A pairs from PDF text
import ollama from 'ollama';
// const OPENAI_API_KEY = config.OPENAI_API_KEY;

class FlashcardSystem {
    constructor() {
        this.flashcards = [];
        this.currentIndex = 0;
        this.isFlipped = false;
        this.reviewMode = false;
        this.score = 0;
        this.totalReviewed = 0;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById("pdf-upload").addEventListener("change", (e) => this.handlePdfUpload(e));
        document.getElementById("generate-btn").addEventListener("click", () => this.generateFlashcards());
        document.getElementById("flashcard").addEventListener("click", () => this.toggleFlip());
        document.getElementById("next-btn").addEventListener("click", () => this.nextFlashcard());
        document.getElementById("prev-btn").addEventListener("click", () => this.prevFlashcard());
        document.getElementById("correct-btn").addEventListener("click", () => this.markCorrect());
        document.getElementById("incorrect-btn").addEventListener("click", () => this.markIncorrect());
        document.getElementById("review-btn").addEventListener("click", () => this.toggleReviewMode());
    }

    async handlePdfUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await this.extractTextFromPdf(file);
            document.getElementById("pdf-text").value = text;
            document.getElementById("generate-btn").disabled = false;
            this.showMessage("PDF uploaded successfully! Click 'Generate Flashcards' to create Q&A pairs.", "success");
        } catch (error) {
            this.showMessage("Error reading PDF: " + error.message, "error");
        }
    }

    async extractTextFromPdf(file) {
        // Using a simple approach with FileReader
        // For production, consider using pdf-parse or similar library
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    // Basic PDF text extraction - may need enhancement for complex PDFs
                    const text = await this.parsePdfData(e.target.result);
                    resolve(text);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsArrayBuffer(file);
        });
    }

    async parsePdfData(arrayBuffer) {
        // Simple implementation - extracts text from PDF
        // For better results, use a library like pdfjs-dist
        const text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
        // This is a simplified version; real PDF parsing is more complex
        return text.split(/[\n\r]+/).filter(line => line.trim().length > 0).join(" ");
    }

    async generateFlashcards() {
        const pdfText = document.getElementById("pdf-text").value.trim();
        const numCards = parseInt(document.getElementById("num-cards").value) || 5;

        if (!pdfText) {
            this.showMessage("Please upload a PDF or enter text first.", "error");
            return;
        }

        if (!OPENAI_API_KEY) {
            this.showMessage("Please set your OpenAI API key in flashcard.js", "error");
            return;
        }

        document.getElementById("generate-btn").disabled = true;
        this.showMessage("Generating flashcards with ChatGPT...", "info");

        try {
            const prompt = `You are an expert educator. Based on the following text, generate exactly ${numCards} flashcard questions and answers. 
            
Format your response as a valid JSON array with no additional text, like this:
[
    {"question": "What is X?", "answer": "X is..."},
    {"question": "How does Y work?", "answer": "Y works by..."}
]

Text to analyze:
${pdfText.substring(0, 2000)}`;

            const response = await ollama.chat({
                model: 'llama3.1',
                messages: [{ role: 'user', content: 'Why is the sky blue?' }],
            })
            console.log(response.message.content)


            // const response = await fetch("https://api.openai.com/v1/chat/completions", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json",
            //         "Authorization": `Bearer ${OPENAI_API_KEY}`
            //     },
            //     body: JSON.stringify({
            //         model: "gpt-3.5-turbo",
            //         messages: [
            //             {
            //                 role: "system",
            //                 content: "You are a helpful educator who creates flashcard questions. Always respond with valid JSON only, no additional text."
            //             },
            //             {
            //                 role: "user",
            //                 content: prompt
            //             }
            //         ],
            //         temperature: 0.7,
            //         max_tokens: 2000
            //     })
            // });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Failed to generate flashcards");
            }

            const data = await response.json();
            const content = data.choices[0].message.content.trim();

            // Extract JSON from response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error("Invalid response format from ChatGPT");
            }

            this.flashcards = JSON.parse(jsonMatch[0]);
            this.currentIndex = 0;
            this.score = 0;
            this.totalReviewed = 0;
            this.isFlipped = false;
            this.reviewMode = false;

            this.showMessage(`Generated ${this.flashcards.length} flashcards!`, "success");
            this.displayFlashcard();
            document.getElementById("flashcard-container").style.display = "block";
            document.getElementById("generate-btn").disabled = false;

        } catch (error) {
            this.showMessage("Error: " + error.message, "error");
            document.getElementById("generate-btn").disabled = false;
        }
    }

    displayFlashcard() {
        if (this.flashcards.length === 0) return;

        const flashcard = this.flashcards[this.currentIndex];
        const flashcardEl = document.getElementById("flashcard");
        const frontEl = flashcardEl.querySelector(".flashcard-front");
        const backEl = flashcardEl.querySelector(".flashcard-back");
        const progressEl = document.getElementById("progress");

        frontEl.textContent = flashcard.question;
        backEl.textContent = flashcard.answer;
        progressEl.textContent = `${this.currentIndex + 1} / ${this.flashcards.length}`;

        this.isFlipped = false;
        flashcardEl.classList.remove("flipped");

        // Update review mode display
        if (this.reviewMode) {
            document.getElementById("flashcard-controls").style.display = "flex";
            document.getElementById("nav-buttons").style.display = "flex";
        } else {
            document.getElementById("flashcard-controls").style.display = "none";
            document.getElementById("nav-buttons").style.display = "flex";
        }
    }

    toggleFlip() {
        const flashcard = document.getElementById("flashcard");
        this.isFlipped = !this.isFlipped;
        flashcard.classList.toggle("flipped");
    }

    nextFlashcard() {
        if (this.currentIndex < this.flashcards.length - 1) {
            this.currentIndex++;
            this.displayFlashcard();
        }
    }

    prevFlashcard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayFlashcard();
        }
    }

    markCorrect() {
        this.score++;
        this.totalReviewed++;
        this.updateScore();
        this.nextFlashcard();
    }

    markIncorrect() {
        this.totalReviewed++;
        this.updateScore();
        this.nextFlashcard();
    }

    updateScore() {
        const percentage = this.totalReviewed > 0 ? Math.round((this.score / this.totalReviewed) * 100) : 0;
        document.getElementById("score-display").textContent = `${this.score}/${this.totalReviewed} (${percentage}%)`;
    }

    toggleReviewMode() {
        this.reviewMode = !this.reviewMode;
        const reviewBtn = document.getElementById("review-btn");

        if (this.reviewMode) {
            this.score = 0;
            this.totalReviewed = 0;
            this.currentIndex = 0;
            this.isFlipped = false;
            reviewBtn.textContent = "Exit Review Mode";
            reviewBtn.classList.add("active");
            document.getElementById("score-display").style.display = "block";
            this.updateScore();
        } else {
            reviewBtn.textContent = "Start Review Mode";
            reviewBtn.classList.remove("active");
            document.getElementById("score-display").style.display = "none";
        }

        this.displayFlashcard();
    }

    showMessage(message, type) {
        const messageEl = document.getElementById("message");
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.display = "block";

        if (type !== "error") {
            setTimeout(() => {
                messageEl.style.display = "none";
            }, 3000);
        }
    }

    // Export flashcards for backup/sharing
    exportFlashcards() {
        const dataStr = JSON.stringify(this.flashcards, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "flashcards.json";
        link.click();
        URL.revokeObjectURL(url);
    }

    // Import flashcards from JSON file
    importFlashcards(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.flashcards = JSON.parse(e.target.result);
                this.currentIndex = 0;
                this.score = 0;
                this.totalReviewed = 0;
                this.isFlipped = false;
                this.reviewMode = false;
                this.showMessage(`Imported ${this.flashcards.length} flashcards!`, "success");
                this.displayFlashcard();
                document.getElementById("flashcard-container").style.display = "block";
            } catch (error) {
                this.showMessage("Error importing flashcards: " + error.message, "error");
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the flashcard system when the page loads
document.addEventListener("DOMContentLoaded", () => {
    window.flashcardSystem = new FlashcardSystem();
});
