import { requireAuthenticatedUser } from '../_lib/auth.js';
import { withDatabase } from '../_lib/db.js';
import { allowMethods, sendJson } from '../_lib/http.js';

function normalizeFlashcards(value) {
    if (Array.isArray(value)) {
        return value;
    }

    return JSON.parse(value || '[]');
}

export default async function handler(req, res) {
    if (!allowMethods(req, res, ['GET', 'DELETE'])) {
        return;
    }

    try {
        await withDatabase(async (sql) => {
            const user = await requireAuthenticatedUser(req, res, sql);

            if (!user) {
                return;
            }

            const id = String(req.query.id || '').trim();

            if (!id) {
                sendJson(res, 400, { error: 'Missing flashcard set id.' });
                return;
            }

            if (req.method === 'GET') {
                const rows = await sql`
                    SELECT id, title, source_text AS "sourceText", flashcards_json, num_cards AS "numCards", created_at AS "createdAt"
                    FROM saved_flashcard_sets
                    WHERE id = ${id} AND user_id = ${user.id}
                    LIMIT 1
                `;

                const item = rows[0];

                if (!item) {
                    sendJson(res, 404, { error: 'Saved flashcards not found.' });
                    return;
                }

                sendJson(res, 200, {
                    item: {
                        id: item.id,
                        title: item.title,
                        sourceText: item.sourceText,
                        flashcards: normalizeFlashcards(item.flashcards_json),
                        numCards: item.numCards,
                        createdAt: item.createdAt,
                    },
                });
                return;
            }

            const deletedRows = await sql`
                DELETE FROM saved_flashcard_sets
                WHERE id = ${id} AND user_id = ${user.id}
                RETURNING id
            `;

            if (deletedRows.length === 0) {
                sendJson(res, 404, { error: 'Saved flashcards not found.' });
                return;
            }

            sendJson(res, 200, { ok: true });
        });
    } catch (error) {
        sendJson(res, 500, { error: error.message || 'Unable to manage saved flashcards.' });
    }
}
