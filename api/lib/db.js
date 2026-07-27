import pg from 'pg';

const { Pool } = pg;

let pool;
let initPromise;

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    ''
  );
}

function getPool() {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not configured. Point it to the Dify PostgreSQL database (e.g. daoith_users).',
      );
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return pool;
}

async function ensureSchema() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      openid TEXT NOT NULL UNIQUE,
      unionid TEXT,
      nickname TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query('CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid)');
}

export async function initDb() {
  if (!initPromise) {
    initPromise = ensureSchema();
  }
  return initPromise;
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    openid: row.openid,
    unionid: row.unionid,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertWeChatUser({ openid, unionid, nickname, avatarUrl }) {
  await initDb();
  const db = getPool();
  const now = new Date().toISOString();

  const result = await db.query(
    `
      INSERT INTO users (openid, unionid, nickname, avatar_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (openid) DO UPDATE SET
        unionid = EXCLUDED.unionid,
        nickname = EXCLUDED.nickname,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = EXCLUDED.updated_at
      RETURNING id, openid, unionid, nickname, avatar_url, created_at, updated_at
    `,
    [openid, unionid || null, nickname || null, avatarUrl || null, now, now],
  );

  return mapUser(result.rows[0]);
}

export async function getUserById(userId) {
  await initDb();
  const db = getPool();
  const result = await db.query(
    `
      SELECT id, openid, unionid, nickname, avatar_url, created_at, updated_at
      FROM users
      WHERE id = $1
    `,
    [userId],
  );

  return mapUser(result.rows[0]);
}
