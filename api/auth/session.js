import { getAuthenticatedSession } from '../_lib/auth.js';
import { withDatabase } from '../_lib/db.js';
import { allowMethods, sendJson } from '../_lib/http.js';

export default async function handler(req, res) {
    if (!allowMethods(req, res, ['GET'])) {
        return;
    }

    try {
        await withDatabase(async (sql) => {
            const session = await getAuthenticatedSession(req, sql);
            sendJson(res, 200, { user: session?.user ?? null });
        });
    } catch (error) {
        sendJson(res, 500, { error: error.message || 'Unable to load session.' });
    }
}
