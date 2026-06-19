import { randomBytes } from 'node:crypto';
import { sendJson } from './http.js';

const SESSION_COOKIE_NAME = 'flippy_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function isProduction() {
    return process.env.NODE_ENV === 'production';
}

function serializeCookie(name, value, options = {}) {
    const parts = [`${name}=${value}`];

    if (options.maxAge !== undefined) {
        parts.push(`Max-Age=${options.maxAge}`);
    }

    if (options.path) {
        parts.push(`Path=${options.path}`);
    }

    if (options.httpOnly) {
        parts.push('HttpOnly');
    }

    if (options.sameSite) {
        parts.push(`SameSite=${options.sameSite}`);
    }

    if (options.secure) {
        parts.push('Secure');
    }

    return parts.join('; ');
}

export function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

export function parseCookies(req) {
    const headerValue = req.headers.cookie || '';

    return headerValue
        .split(';')
        .map((cookie) => cookie.trim())
        .filter(Boolean)
        .reduce((cookies, cookie) => {
            const separatorIndex = cookie.indexOf('=');

            if (separatorIndex === -1) {
                return cookies;
            }

            const key = cookie.slice(0, separatorIndex);
            const value = decodeURIComponent(cookie.slice(separatorIndex + 1));
            return { ...cookies, [key]: value };
        }, {});
}

export async function createSession(sql, res, userId) {
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

    await sql`
        INSERT INTO sessions (id, user_id, expires_at)
        VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()})
    `;

    res.setHeader(
        'Set-Cookie',
        serializeCookie(SESSION_COOKIE_NAME, sessionId, {
            maxAge: SESSION_MAX_AGE_SECONDS,
            path: '/',
            httpOnly: true,
            sameSite: 'Lax',
            secure: isProduction(),
        }),
    );
}

export async function getAuthenticatedSession(req, sql) {
    const sessionId = parseCookies(req)[SESSION_COOKIE_NAME];

    if (!sessionId) {
        return null;
    }

    const rows = await sql`
        SELECT sessions.id, sessions.user_id, sessions.expires_at, users.email
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        WHERE sessions.id = ${sessionId}
        LIMIT 1
    `;

    const session = rows[0];

    if (!session) {
        return null;
    }

    if (new Date(session.expires_at) <= new Date()) {
        await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
        return null;
    }

    return {
        sessionId,
        user: {
            id: session.user_id,
            email: session.email,
        },
    };
}

export async function requireAuthenticatedUser(req, res, sql) {
    const session = await getAuthenticatedSession(req, sql);

    if (!session) {
        sendJson(res, 401, { error: 'You must be logged in to do that.' });
        return null;
    }

    return session.user;
}

export async function clearSession(req, res, sql) {
    const sessionId = parseCookies(req)[SESSION_COOKIE_NAME];

    if (sessionId) {
        await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
    }

    res.setHeader(
        'Set-Cookie',
        serializeCookie(SESSION_COOKIE_NAME, '', {
            maxAge: 0,
            path: '/',
            httpOnly: true,
            sameSite: 'Lax',
            secure: isProduction(),
        }),
    );
}
