import { randomUUID } from 'node:crypto';
import { requireAuthenticatedUser } from '../_lib/auth.js';
import { withDatabase } from '../_lib/db.js';
import { allowMethods, readJson, sendJson } from '../_lib/http.js';

function isValidFlashcard(card) {
    return card
        && typeof card.question === 'string'
        && card.question.trim()
        && typeof card.answer === 'string'
        && card.answer.trim();
}

export default async function handler(req, res) {
    if (!allowMethods(req, res, ['GET', 'POST'])) {
        return;
    }

    try {
        await withDatabase(async (sql) => {
            const user = await requireAuthenticatedUser(req, res, sql);

            if (!user) {
                return;
            }

            if (req.method === 'GET') {
                const items = await sql`
                    SELECT id, title, num_cards AS "numCards", created_at AS "createdAt"
                    FROM saved_flashcard_sets
                    WHERE user_id = ${user.id}
                    ORDER BY created_at DESC
                `;

                sendJson(res, 200, { items });
                return;
            }

            const body = await readJson(req);
            const title = String(body.title || '').trim() || 'Saved flashcards';
            const flashcards = Array.isArray(body.flashcards) ? body.flashcards : [];
            const sourceText = typeof body.sourceText === 'string' ? body.sourceText.trim() : null;
            const numCards = Number.isInteger(body.numCards) ? body.numCards : flashcards.length;

            if (flashcards.length === 0 || !flashcards.every(isValidFlashcard)) {
                sendJson(res, 400, { error: 'Flashcards must include question/answer pairs.' });
                return;
            }

            const itemId = randomUUID();
            const insertedRows = await sql`
                WITH current_count AS (
                    SELECT COUNT(*)::int AS count
                    FROM saved_flashcard_sets
                    WHERE user_id = ${user.id}
                ),
                inserted AS (
                    INSERT INTO saved_flashcard_sets (id, user_id, title, source_text, flashcards_json, num_cards)
                    SELECT
                        ${itemId},
                        ${user.id},
                        ${title},
                        ${sourceText},
                        ${JSON.stringify(flashcards)}::jsonb,
                        ${numCards}
                    FROM current_count
                    WHERE current_count.count < 10
                    RETURNING id, title, num_cards AS "numCards", created_at AS "createdAt"
                )
                SELECT * FROM inserted
            `;

            if (insertedRows.length === 0) {
                sendJson(res, 409, { error: 'You already have 10 saved flashcard sets. Delete one before saving another.' });
                return;
            }

            sendJson(res, 201, { item: insertedRows[0] });
        });
    } catch (error) {
        sendJson(res, 500, { error: error.message || 'Unable to save flashcards.' });
    }
}
