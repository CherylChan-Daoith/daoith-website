import { applyCors, handleOptions } from '../lib/cors.js';
import { getBearerToken, verifyJwt } from '../lib/jwt.js';
import { getUserById, getUserByOpenid } from '../lib/db.js';
import { pushDiagnosisReportToPmBackground } from '../lib/pm-sync.js';
import { extractClientIp, lookupIpRegion } from '../lib/geoip.js';

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim());
}

function normalizeSource(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase();
  if (
    s === 'miniprogram' ||
    s === 'mp' ||
    s === 'mini' ||
    s.includes('miniprogram') ||
    s.includes('小程序')
  ) {
    return 'miniprogram';
  }
  return 'website';
}

function asSlots(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const keys = [
    'platform',
    'entity',
    'shipping',
    'exportMode',
    'invoice',
    'productCategory',
    'revenue',
  ];
  const out = {};
  for (const key of keys) {
    const val = raw[key];
    if (val != null && String(val).trim()) out[key] = String(val).trim();
  }
  return out;
}

function businessSummary(slots) {
  const labels = [
    ['platform', '销售平台'],
    ['entity', '注册主体'],
    ['shipping', '发货方式'],
    ['exportMode', '出口方式'],
    ['invoice', '供应商发票'],
    ['productCategory', '产品类别'],
    ['revenue', '年销售额'],
  ];
  return labels
    .map(([k, label]) => (slots[k] ? `${label}：${slots[k]}` : null))
    .filter(Boolean)
    .join('\n');
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const source = normalizeSource(body.source);
  const kind = body.kind === 'qa' ? 'qa' : 'diagnosis';
  if (kind === 'qa') {
    return res.status(200).json({ ok: true, skipped: true, reason: 'qa_not_stored' });
  }
  const token = getBearerToken(req);

  let payload = null;
  let user = null;

  if (token) {
    try {
      payload = verifyJwt(token);
    } catch {
      if (source !== 'miniprogram' && kind !== 'qa') {
        return res.status(503).json({ error: '未配置 JWT_SECRET' });
      }
    }
    if (payload?.sub && hasDatabase()) {
      try {
        if (/^\d+$/.test(String(payload.sub))) {
          user = await getUserById(Number(payload.sub));
        }
        if (!user && payload.openid) {
          user = await getUserByOpenid(payload.openid);
        }
      } catch (err) {
        console.error('[diagnosis/reports] db lookup', err.message || err);
      }
    }
  } else if (source !== 'miniprogram' && kind !== 'qa') {
    return res.status(401).json({ error: '请先微信登录后再保存方案' });
  }

  if (token && !payload?.sub && source !== 'miniprogram' && kind !== 'qa') {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }

  const reportMarkdown = String(body.reportMarkdown || body.markdown || '').trim();
  const minLen = kind === 'qa' ? 40 : 80;
  if (reportMarkdown.length < minLen) {
    return res.status(400).json({ error: '报告内容过短，未保存' });
  }

  const slots = asSlots(body.slots);
  const reportId =
    String(body.reportId || '').trim() ||
    `diag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  const openid = user?.openid || payload?.openid || null;
  const nickname =
    user?.nickname ||
    payload?.nickname ||
    body.nickname ||
    (source === 'miniprogram' ? '小程序访客' : null);
  const deviceId = String(body.deviceId || '').trim();
  const clientIp = extractClientIp(req);
  let geo = null;
  if (clientIp) {
    try {
      geo = await lookupIpRegion(clientIp);
    } catch {
      geo = null;
    }
  }
  const externalUserId =
    user?.id != null
      ? String(user.id)
      : payload?.sub
        ? String(payload.sub)
        : deviceId || (clientIp ? `ip:${clientIp}` : reportId);
  const summarySlots = businessSummary(slots) || String(body.businessSummary || '').trim();
  const question = String(body.question || '').trim();
  const summary =
    kind === 'qa' && question
      ? `提问：${question}${summarySlots ? `\n${summarySlots}` : ''}`
      : summarySlots;

  const report = {
    reportId,
    websiteOpenid: openid,
    externalUserId,
    nickname,
    slots,
    businessSummary: summary,
    reportMarkdown,
    conversationId: body.conversationId ? String(body.conversationId) : null,
    kind,
    recommendedServiceIds: Array.isArray(body.recommendedServiceIds)
      ? body.recommendedServiceIds.map(String)
      : [],
    source,
    clientIp,
    country: geo?.country || user?.country || null,
    province: geo?.province || user?.province || null,
    city: geo?.city || user?.city || null,
    createdAt: new Date().toISOString(),
  };

  pushDiagnosisReportToPmBackground(report);

  return res.status(200).json({
    ok: true,
    reportId,
    source,
    synced: 'pending',
  });
}
