import 'dotenv/config';
import http from 'node:http';
import { URL } from 'node:url';
import loginHandler from '../api/auth/login.js';
import logoutHandler from '../api/auth/logout.js';
import sessionHandler from '../api/auth/session.js';
import signupHandler from '../api/auth/signup.js';
import flashcardDetailHandler from '../api/flashcards/[id].js';
import flashcardsHandler from '../api/flashcards/index.js';
import testDetailHandler from '../api/tests/[id].js';
import testsHandler from '../api/tests/index.js';

const port = Number(process.env.PORT || 3000);

const routes = [
    { method: null, pattern: /^\/api\/auth\/signup\/?$/, handler: signupHandler },
    { method: null, pattern: /^\/api\/auth\/login\/?$/, handler: loginHandler },
    { method: null, pattern: /^\/api\/auth\/logout\/?$/, handler: logoutHandler },
    { method: null, pattern: /^\/api\/auth\/session\/?$/, handler: sessionHandler },
    { method: null, pattern: /^\/api\/flashcards\/?$/, handler: flashcardsHandler },
    { method: null, pattern: /^\/api\/flashcards\/([^/]+)\/?$/, handler: flashcardDetailHandler, queryKey: 'id' },
    { method: null, pattern: /^\/api\/tests\/?$/, handler: testsHandler },
    { method: null, pattern: /^\/api\/tests\/([^/]+)\/?$/, handler: testDetailHandler, queryKey: 'id' },
];

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
}

function sendNotFound(res) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Route not found.' }));
}

const server = http.createServer(async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    const route = routes.find((entry) => entry.pattern.test(url.pathname));

    if (!route) {
        sendNotFound(res);
        return;
    }

    const match = url.pathname.match(route.pattern);
    const query = Object.fromEntries(url.searchParams.entries());

    if (route.queryKey && match?.[1]) {
        query[route.queryKey] = decodeURIComponent(match[1]);
    }

    req.query = query;

    try {
        await route.handler(req, res);
    } catch (error) {
        if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message || 'Internal server error.' }));
        }
    }
});

server.listen(port, () => {
    console.log(`Local API server running on http://127.0.0.1:${port}`);
});
