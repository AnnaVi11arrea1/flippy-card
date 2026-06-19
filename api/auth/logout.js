import { clearSession } from '../_lib/auth.js';
import { withDatabase } from '../_lib/db.js';
import { allowMethods, sendJson } from '../_lib/http.js';

export default async function handler(req, res) {
    if (!allowMethods(req, res, ['POST'])) {
        return;
    }

    try {
        await withDatabase(async (sql) => {
            await clearSession(req, res, sql);
            sendJson(res, 200, { ok: true });
        });
    } catch (error) {
        sendJson(res, 500, { error: error.message || 'Unable to log out.' });
    }
}
