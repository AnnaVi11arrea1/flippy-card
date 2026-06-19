const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const API_TIMEOUT_MS = 15000;

async function request(path, options = {}) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
            credentials: 'include',
            body: options.body ? JSON.stringify(options.body) : undefined,
            signal: controller.signal,
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('The app could not reach its account server in time.');
        }

        throw new Error('The account server could not be reached. If you are running locally, start `npm run dev:api`. If this is deployed, check your Vercel deployment and environment variables.');
    } finally {
        window.clearTimeout(timeoutId);
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    let payload = {};
    let rawText = '';

    if (isJson) {
        try {
            payload = await response.json();
        } catch {
            payload = {};
        }
    } else {
        rawText = (await response.text()).trim();
        payload = { error: rawText };
    }

    if (!response.ok && contentType.includes('text/html')) {
        throw new Error('The account API route is unavailable. If you are running locally, start `npm run dev:api`. If this is deployed, make sure Vercel deployed the `/api` routes and has `DATABASE_URL` set.');
    }

    if (!response.ok) {
        const statusLabel = `${response.status} ${response.statusText}`.trim();
        const detail = typeof payload.error === 'string' && payload.error.trim()
            ? payload.error.trim()
            : rawText;

        throw new Error(detail || `Request failed (${statusLabel}).`);
    }

    return payload;
}

export function getSession() {
    return request('/api/auth/session');
}

export function signUp(email, password) {
    return request('/api/auth/signup', {
        method: 'POST',
        body: { email, password },
    });
}

export function logIn(email, password) {
    return request('/api/auth/login', {
        method: 'POST',
        body: { email, password },
    });
}

export function logOut() {
    return request('/api/auth/logout', { method: 'POST' });
}

export function listSavedFlashcards() {
    return request('/api/flashcards');
}

export function saveFlashcards(body) {
    return request('/api/flashcards', {
        method: 'POST',
        body,
    });
}

export function getSavedFlashcards(id) {
    return request(`/api/flashcards/${id}`);
}

export function deleteSavedFlashcards(id) {
    return request(`/api/flashcards/${id}`, { method: 'DELETE' });
}

export function listSavedTests() {
    return request('/api/tests');
}

export function saveTest(body) {
    return request('/api/tests', {
        method: 'POST',
        body,
    });
}

export function getSavedTest(id) {
    return request(`/api/tests/${id}`);
}

export function deleteSavedTest(id) {
    return request(`/api/tests/${id}`, { method: 'DELETE' });
}
