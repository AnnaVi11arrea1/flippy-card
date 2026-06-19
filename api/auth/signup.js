import { randomUUID } from 'node:crypto';
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

        if (!email || !email.includes('@')) {
            sendJson(res, 400, { error: 'Enter a valid email address.' });
            return;
        }

        if (password.length < 8) {
            sendJson(res, 400, { error: 'Password must be at least 8 characters.' });
            return;
        }

        await withDatabase(async (sql) => {
            const existingUsers = await sql`
                SELECT id
                FROM users
                WHERE email = ${email}
                LIMIT 1
            `;

            if (existingUsers.length > 0) {
                sendJson(res, 409, { error: 'An account with that email already exists.' });
                return;
            }

            const userId = randomUUID();
            const passwordHash = await bcrypt.hash(password, 10);

            await sql`
                INSERT INTO users (id, email, password_hash)
                VALUES (${userId}, ${email}, ${passwordHash})
            `;

            await createSession(sql, res, userId);
            sendJson(res, 201, { user: { id: userId, email } });
        });
    } catch (error) {
        sendJson(res, 500, { error: error.message || 'Unable to create account.' });
    }
}
