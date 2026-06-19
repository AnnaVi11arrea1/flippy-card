import bcrypt from 'bcryptjs';
import { createSession, normalizeEmail } from '../_lib/auth.js';
import { withDatabase } from '../_lib/db.js';
import { allowMethods, readJson, sendJson } from '../_lib/http.js';

export default async function handler(req, res) {
    if (!allowMethods(req, res, ['POST'])) {
        return;
    }

    try {
        const body = await readJson(req);
        const email = normalizeEmail(body.email);
        const password = String(body.password || '');

        if (!email || !password) {
            sendJson(res, 400, { error: 'Email and password are required.' });
            return;
        }

        await withDatabase(async (sql) => {
            const users = await sql`
                SELECT id, email, password_hash
                FROM users
                WHERE email = ${email}
                LIMIT 1
            `;

            const user = users[0];

            if (!user) {
                sendJson(res, 401, { error: 'Invalid email or password.' });
                return;
            }

            const passwordMatches = await bcrypt.compare(password, user.password_hash);

            if (!passwordMatches) {
                sendJson(res, 401, { error: 'Invalid email or password.' });
                return;
            }

            await createSession(sql, res, user.id);
            sendJson(res, 200, { user: { id: user.id, email: user.email } });
        });
    } catch (error) {
        sendJson(res, 500, { error: error.message || 'Unable to log in.' });
    }
}
