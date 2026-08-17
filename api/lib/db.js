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
      country TEXT,
      province TEXT,
      city TEXT,
      phone TEXT,
      last_login_at TIMESTAMPTZ,
      login_count INTEGER NOT NULL DEFAULT 0,
      last_login_ip TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query('CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid)');
  // Migrate older installs that only had the base columns
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS province TEXT`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`);
  await db.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0`,
  );
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip TEXT`);
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
    country: row.country || null,
    province: row.province || null,
    city: row.city || null,
    phone: row.phone || null,
    lastLoginAt: row.last_login_at || null,
    loginCount: Number(row.login_count || 0),
    lastLoginIp: row.last_login_ip || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const USER_COLUMNS = `
  id, openid, unionid, nickname, avatar_url,
  country, province, city, phone,
  last_login_at, login_count, last_login_ip,
  created_at, updated_at
`;

export async function upsertWeChatUser({
  openid,
  unionid,
  nickname,
  avatarUrl,
  country,
  province,
  city,
  phone,
  loginIp,
  recordLogin = true,
}) {
  await initDb();
  const db = getPool();
  const now = new Date().toISOString();

  const result = await db.query(
    `
      INSERT INTO users (
        openid, unionid, nickname, avatar_url,
        country, province, city, phone,
        last_login_at, login_count, last_login_ip,
        created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13
      )
      ON CONFLICT (openid) DO UPDATE SET
        unionid = COALESCE(EXCLUDED.unionid, users.unionid),
        nickname = COALESCE(EXCLUDED.nickname, users.nickname),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        country = COALESCE(EXCLUDED.country, users.country),
        province = COALESCE(EXCLUDED.province, users.province),
        city = COALESCE(EXCLUDED.city, users.city),
        phone = COALESCE(EXCLUDED.phone, users.phone),
        last_login_at = CASE
          WHEN $14 THEN EXCLUDED.last_login_at
          ELSE COALESCE(users.last_login_at, EXCLUDED.last_login_at)
        END,
        login_count = CASE
          WHEN $14 THEN users.login_count + 1
          ELSE users.login_count
        END,
        last_login_ip = COALESCE(EXCLUDED.last_login_ip, users.last_login_ip),
        updated_at = EXCLUDED.updated_at
      RETURNING ${USER_COLUMNS}
    `,
    [
      openid,
      unionid || null,
      nickname || null,
      avatarUrl || null,
      country || null,
      province || null,
      city || null,
      phone || null,
      now,
      recordLogin ? 1 : 0,
      loginIp || null,
      now,
      now,
      recordLogin,
    ],
  );

  return mapUser(result.rows[0]);
}

export async function updateUserPhoneByOpenid(openid, phone) {
  if (!openid || !phone) return null;
  await initDb();
  const db = getPool();
  const result = await db.query(
    `
      UPDATE users
      SET phone = $2, updated_at = NOW()
      WHERE openid = $1
      RETURNING ${USER_COLUMNS}
    `,
    [openid, phone],
  );
  return mapUser(result.rows[0]);
}

export async function getUserById(userId) {
  await initDb();
  const db = getPool();
  const result = await db.query(
    `
      SELECT ${USER_COLUMNS}
      FROM users
      WHERE id = $1
    `,
    [userId],
  );

  return mapUser(result.rows[0]);
}

export async function getUserByOpenid(openid) {
  await initDb();
  const db = getPool();
  const result = await db.query(
    `
      SELECT ${USER_COLUMNS}
      FROM users
      WHERE openid = $1
    `,
    [openid],
  );
  return mapUser(result.rows[0]);
}

export async function listUsersForPmSync({ limit = 500, offset = 0 } = {}) {
  await initDb();
  const db = getPool();
  const result = await db.query(
    `
      SELECT ${USER_COLUMNS}
      FROM users
      ORDER BY id ASC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );
  return result.rows.map(mapUser);
}
