import { applyCors, handleOptions } from '../../lib/cors.js';
import { getBearerToken, verifyJwt } from '../../lib/jwt.js';
import { getUserById } from '../../lib/db.js';

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim());
}

export default async function handler(req, res) {
  applyCors(req, res, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return handleOptions(req, res, 'GET, OPTIONS');
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  let payload;
  try {
    payload = verifyJwt(token);
  } catch {
    return res.status(503).json({ error: '未配置 JWT_SECRET' });
  }

  if (!payload?.sub) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }

  // Prefer JWT profile claims (works without database)
  if (payload.openid || payload.nickname || payload.avatarUrl) {
    return res.status(200).json({
      user: {
        id: payload.sub,
        openid: payload.openid || null,
        nickname: payload.nickname || null,
        avatarUrl: payload.avatarUrl || null,
      },
    });
  }

  if (!hasDatabase()) {
    return res.status(200).json({
      user: {
        id: payload.sub,
        openid: payload.openid || null,
        nickname: null,
        avatarUrl: null,
      },
    });
  }

  try {
    const user = await getUserById(Number(payload.sub));
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || '获取用户信息失败' });
  }
}
