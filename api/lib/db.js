import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

let client;
let initPromise;

function getClient() {
  if (!client) {
    const url = process.env.LIBSQL_URL?.trim() || 'file:data/daoith-auth.db';
    const authToken = process.env.LIBSQL_AUTH_TOKEN?.trim();

    if (url.startsWith('file:')) {
      const filePath = url.replace(/^file:/, '');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    client = createClient({
      url,
      authToken: authToken || undefined,
    });
  }
  return client;
}

async function ensureSchema() {
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT NOT NULL UNIQUE,
      unionid TEXT,
      nickname TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await db.execute('CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid)');
}

export async function initDb() {
  if (!initPromise) {
    initPromise = ensureSchema();
  }
  return initPromise;
}

export async function upsertWeChatUser({ openid, unionid, nickname, avatarUrl }) {
  await initDb();
  const db = getClient();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO users (openid, unionid, nickname, avatar_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(openid) DO UPDATE SET
        unionid = excluded.unionid,
        nickname = excluded.nickname,
        avatar_url = excluded.avatar_url,
        updated_at = excluded.updated_at
    `,
    args: [openid, unionid || null, nickname || null, avatarUrl || null, now, now],
  });

  const result = await db.execute({
    sql: 'SELECT id, openid, unionid, nickname, avatar_url, created_at, updated_at FROM users WHERE openid = ?',
    args: [openid],
  });

  const row = result.rows[0];
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

export async function getUserById(userId) {
  await initDb();
  const db = getClient();
  const result = await db.execute({
    sql: 'SELECT id, openid, unionid, nickname, avatar_url, created_at, updated_at FROM users WHERE id = ?',
    args: [userId],
  });

  const row = result.rows[0];
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
