import { randomUUID } from 'node:crypto';
import { requireAuthenticatedUser } from '../_lib/auth.js';
import { withDatabase } from '../_lib/db.js';
import { allowMethods, readJson, sendJson } from '../_lib/http.js';

function isValidQuestion(question) {
    return question
        && typeof question.question === 'string'
        && question.question.trim()
        && Array.isArray(question.answers)
        && question.answers.length === 4
        && question.answers.every((answer) => typeof answer === 'string' && answer.trim())
        && typeof question.correctAnswer === 'string'
        && question.correctAnswer.trim();
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
                    SELECT id, title, score, created_at AS "createdAt"
                    FROM saved_tests
                    WHERE user_id = ${user.id}
                    ORDER BY created_at DESC
                `;

                sendJson(res, 200, { items });
                return;
            }

            const body = await readJson(req);
            const title = String(body.title || '').trim() || 'Saved test';
            const test = Array.isArray(body.test) ? body.test : [];
            const selectedAnswers = body.selectedAnswers && typeof body.selectedAnswers === 'object' ? body.selectedAnswers : {};
            const score = Number.isInteger(body.score) ? body.score : 0;
            const sourceText = typeof body.sourceText === 'string' ? body.sourceText.trim() : null;

            if (test.length === 0 || !test.every(isValidQuestion)) {
                sendJson(res, 400, { error: 'Tests must include valid questions and answers.' });
                return;
            }

            const itemId = randomUUID();
            const insertedRows = await sql`
                WITH current_count AS (
                    SELECT COUNT(*)::int AS count
                    FROM saved_tests
                    WHERE user_id = ${user.id}
                ),
                inserted AS (
                    INSERT INTO saved_tests (id, user_id, title, source_text, test_json, selected_answers_json, score)
                    SELECT
                        ${itemId},
                        ${user.id},
                        ${title},
                        ${sourceText},
                        ${JSON.stringify(test)}::jsonb,
                        ${JSON.stringify(selectedAnswers)}::jsonb,
                        ${score}
                    FROM current_count
                    WHERE current_count.count < 10
                    RETURNING id, title, score, created_at AS "createdAt"
                )
                SELECT * FROM inserted
            `;

            if (insertedRows.length === 0) {
                sendJson(res, 409, { error: 'You already have 10 saved tests. Delete one before saving another.' });
                return;
            }

            sendJson(res, 201, { item: insertedRows[0] });
        });
    } catch (error) {
        sendJson(res, 500, { error: error.message || 'Unable to save test.' });
    }
}
