export function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
}

export function allowMethods(req, res, methods) {
    if (methods.includes(req.method)) {
        return true;
    }

    res.setHeader('Allow', methods.join(', '));
    sendJson(res, 405, { error: `Method ${req.method} not allowed.` });
    return false;
}

export async function readJson(req) {
    if (req.body && typeof req.body === 'object') {
        return req.body;
    }

    const chunks = [];

    for await (const chunk of req) {
        chunks.push(chunk);
    }

    const rawBody = Buffer.concat(chunks).toString('utf8').trim();

    if (!rawBody) {
        return {};
    }

    try {
        return JSON.parse(rawBody);
    } catch {
        throw new Error('Invalid JSON body.');
    }
}
