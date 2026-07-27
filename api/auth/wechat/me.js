import { applyCors, handleOptions } from '../../lib/cors.js';
import { getBearerToken, verifyJwt } from '../../lib/jwt.js';
import { getUserById } from '../../lib/db.js';

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

  const payload = verifyJwt(token);
  if (!payload?.sub) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
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
