const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        credentials: 'include',
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
        ? await response.json()
        : { error: await response.text() };

    if (!response.ok) {
        throw new Error(payload.error || 'Request failed.');
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
