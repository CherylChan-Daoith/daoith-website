import { applyCors, handleOptions } from '../../lib/cors.js';
import { exchangeWeChatCode, fetchWeChatUserInfo } from '../../lib/wechat.js';
import { upsertWeChatUser } from '../../lib/db.js';
import { extractClientIp, lookupIpRegion } from '../../lib/geoip.js';
import { pushUsersToPmBackground } from '../../lib/pm-sync.js';
import { signJwt } from '../../lib/jwt.js';

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim());
}

function publicUser(user) {
  return {
    id: user.id,
    openid: user.openid,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    phone: user.phone || null,
    country: user.country || null,
    province: user.province || null,
    city: user.city || null,
    lastLoginAt: user.lastLoginAt || null,
    loginCount: user.loginCount || 0,
  };
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const code = req.body?.code?.trim();
  if (!code) {
    return res.status(400).json({ error: '缺少微信授权 code' });
  }

  if (!process.env.JWT_SECRET?.trim()) {
    return res.status(503).json({
      error: '未配置 JWT_SECRET',
      hint: '请在 Vercel 环境变量中设置 JWT_SECRET（与阿里云 .env 保持一致更佳）',
    });
  }

  try {
    const tokenData = await exchangeWeChatCode(code);
    const userInfo = await fetchWeChatUserInfo(tokenData.access_token, tokenData.openid);

    const clientIp = extractClientIp(req);
    let region = {
      country: userInfo.country || null,
      province: userInfo.province || null,
      city: userInfo.city || null,
    };
    // WeChat no longer returns reliable region; fill from login IP when possible
    if (!region.province && !region.city) {
      const geo = await lookupIpRegion(clientIp);
      if (geo) {
        region = {
          country: geo.country || region.country,
          province: geo.province || null,
          city: geo.city || null,
        };
      }
    }

    let user;
    if (hasDatabase()) {
      user = await upsertWeChatUser({
        openid: userInfo.openid,
        unionid: userInfo.unionid || tokenData.unionid || null,
        nickname: userInfo.nickname || null,
        avatarUrl: userInfo.headimgurl || null,
        country: region.country,
        province: region.province,
        city: region.city,
        loginIp: clientIp,
        recordLogin: true,
      });
      pushUsersToPmBackground([user], { recordLogin: true });
    } else {
      // Stateless fallback when Vercel cannot reach internal Postgres
      user = {
        id: userInfo.openid,
        openid: userInfo.openid,
        nickname: userInfo.nickname || null,
        avatarUrl: userInfo.headimgurl || null,
        country: region.country,
        province: region.province,
        city: region.city,
        phone: null,
        lastLoginAt: new Date().toISOString(),
        loginCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      pushUsersToPmBackground([user], { recordLogin: true });
    }

    const jwt = signJwt({
      sub: String(user.id),
      openid: user.openid,
      nickname: user.nickname || null,
      avatarUrl: user.avatarUrl || null,
    });

    return res.status(200).json({
      token: jwt,
      user: publicUser(user),
    });
  } catch (err) {
    const status = err.code ? 400 : 502;
    return res.status(status).json({
      error: err.message || '微信登录失败',
    });
  }
}
