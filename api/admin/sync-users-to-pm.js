import { applyCors, handleOptions } from '../lib/cors.js';
import { listUsersForPmSync } from '../lib/db.js';
import { pushUsersToPm } from '../lib/pm-sync.js';

/**
 * POST /api/admin/sync-users-to-pm
 * Bulk push website users to pm.daoith.com.
 * Auth: x-admin-sync-secret === ADMIN_SYNC_SECRET || PM_SYNC_SECRET
 */
export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected =
    process.env.ADMIN_SYNC_SECRET?.trim() ||
    process.env.PM_SYNC_SECRET?.trim() ||
    '';
  const provided = req.headers['x-admin-sync-secret'];
  if (!expected || provided !== expected) {
    return res.status(401).json({ error: '无效的同步密钥' });
  }

  try {
    const limit = Math.min(Number(req.body?.limit) || 500, 500);
    const offset = Math.max(Number(req.body?.offset) || 0, 0);
    const users = await listUsersForPmSync({ limit, offset });
    const result = await pushUsersToPm(users, { recordLogin: false });
    return res.status(200).json({
      ok: true,
      fetched: users.length,
      offset,
      limit,
      ...result,
    });
  } catch (err) {
    return res.status(502).json({
      error: err.message || '同步到 PM 失败',
    });
  }
}
