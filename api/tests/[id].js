import { requireAuthenticatedUser } from '../_lib/auth.js';
import { withDatabase } from '../_lib/db.js';
import { allowMethods, sendJson } from '../_lib/http.js';

function parseStoredJson(value, fallback) {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (typeof value === 'object') {
        return value;
    }

    return JSON.parse(value);
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
                sendJson(res, 400, { error: 'Missing test id.' });
                return;
            }

            if (req.method === 'GET') {
                const rows = await sql`
                    SELECT id, title, source_text AS "sourceText", test_json, selected_answers_json, score, created_at AS "createdAt"
                    FROM saved_tests
                    WHERE id = ${id} AND user_id = ${user.id}
                    LIMIT 1
                `;

                const item = rows[0];

                if (!item) {
                    sendJson(res, 404, { error: 'Saved test not found.' });
                    return;
                }

                sendJson(res, 200, {
                    item: {
                        id: item.id,
                        title: item.title,
                        sourceText: item.sourceText,
                        test: parseStoredJson(item.test_json, []),
                        selectedAnswers: parseStoredJson(item.selected_answers_json, {}),
                        score: item.score,
                        createdAt: item.createdAt,
                    },
                });
                return;
            }

            const deletedRows = await sql`
                DELETE FROM saved_tests
                WHERE id = ${id} AND user_id = ${user.id}
                RETURNING id
            `;

            if (deletedRows.length === 0) {
                sendJson(res, 404, { error: 'Saved test not found.' });
                return;
            }

            sendJson(res, 200, { ok: true });
        });
    } catch (error) {
        sendJson(res, 500, { error: error.message || 'Unable to manage saved tests.' });
    }
}
