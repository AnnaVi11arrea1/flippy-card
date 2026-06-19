import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

let sqlClient;
let schemaPromise;

function getDatabaseUrl() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set.');
    }

    return databaseUrl;
}

function getSql() {
    if (!sqlClient) {
        sqlClient = neon(getDatabaseUrl());
    }

    return sqlClient;
}

export async function ensureSchema() {
    if (!schemaPromise) {
        const sql = getSql();

        schemaPromise = (async () => {
            await sql`
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    expires_at TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS saved_flashcard_sets (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    source_text TEXT,
                    flashcards_json JSONB NOT NULL,
                    num_cards INTEGER NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS saved_tests (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    source_text TEXT,
                    test_json JSONB NOT NULL,
                    selected_answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                    score INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `;

            await sql`
                CREATE INDEX IF NOT EXISTS sessions_user_id_idx
                ON sessions (user_id)
            `;

            await sql`
                CREATE INDEX IF NOT EXISTS saved_flashcard_sets_user_id_created_at_idx
                ON saved_flashcard_sets (user_id, created_at DESC)
            `;

            await sql`
                CREATE INDEX IF NOT EXISTS saved_tests_user_id_created_at_idx
                ON saved_tests (user_id, created_at DESC)
            `;
        })();
    }

    return schemaPromise;
}

export async function withDatabase(work) {
    const sql = getSql();
    await ensureSchema();
    return work(sql);
}
