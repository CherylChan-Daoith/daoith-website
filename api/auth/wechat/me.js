import { applyCors, handleOptions } from '../../lib/cors.js';
import { getBearerToken, verifyJwt } from '../../lib/jwt.js';
import { getUserById } from '../../lib/db.js';

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim());
}

function publicUser(user) {
  return {
    id: user.id,
    openid: user.openid || null,
    nickname: user.nickname || null,
    avatarUrl: user.avatarUrl || null,
    phone: user.phone || null,
    country: user.country || null,
    province: user.province || null,
    city: user.city || null,
    lastLoginAt: user.lastLoginAt || null,
    loginCount: user.loginCount || 0,
  };
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

  if (hasDatabase() && /^\d+$/.test(String(payload.sub))) {
    try {
      const user = await getUserById(Number(payload.sub));
      if (user) {
        return res.status(200).json({ user: publicUser(user) });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message || '获取用户信息失败' });
    }
  }

  return res.status(200).json({
    user: publicUser({
      id: payload.sub,
      openid: payload.openid || null,
      nickname: payload.nickname || null,
      avatarUrl: payload.avatarUrl || null,
    }),
  });
}
