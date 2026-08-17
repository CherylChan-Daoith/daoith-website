import { applyCors, handleOptions } from '../lib/cors.js';
import { getBearerToken, verifyJwt } from '../lib/jwt.js';
import { getUserById, getUserByOpenid } from '../lib/db.js';
import { pushDiagnosisReportToPmBackground } from '../lib/pm-sync.js';

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim());
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

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: '请先微信登录后再保存方案' });
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

  const body = req.body || {};
  const reportMarkdown = String(body.reportMarkdown || body.markdown || '').trim();
  if (reportMarkdown.length < 80) {
    return res.status(400).json({ error: '报告内容过短，未保存' });
  }

  const slots = asSlots(body.slots);
  const reportId =
    String(body.reportId || '').trim() ||
    `diag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  let user = null;
  if (hasDatabase()) {
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

  const openid = user?.openid || payload.openid || null;
  const nickname =
    user?.nickname || payload.nickname || body.nickname || null;
  const externalUserId = user?.id != null ? String(user.id) : String(payload.sub);
  const summary = businessSummary(slots) || String(body.businessSummary || '').trim();

  const report = {
    reportId,
    websiteOpenid: openid,
    externalUserId,
    nickname,
    slots,
    businessSummary: summary,
    reportMarkdown,
    conversationId: body.conversationId ? String(body.conversationId) : null,
    kind: body.kind === 'qa' ? 'qa' : 'diagnosis',
    recommendedServiceIds: Array.isArray(body.recommendedServiceIds)
      ? body.recommendedServiceIds.map(String)
      : [],
    createdAt: new Date().toISOString(),
  };

  pushDiagnosisReportToPmBackground(report);

  return res.status(200).json({
    ok: true,
    reportId,
    synced: 'pending',
  });
}
