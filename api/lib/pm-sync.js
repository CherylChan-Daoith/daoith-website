/**
 * Push website WeChat users to pm.daoith.com.
 * Fire-and-forget; failures are logged and never block login.
 */

function getPmSyncConfig() {
  const base = (process.env.PM_SYNC_URL || 'https://pm.daoith.com').replace(/\/$/, '');
  const secret =
    process.env.PM_SYNC_SECRET?.trim() ||
    process.env.WEBSITE_SYNC_SECRET?.trim() ||
    '';
  return {
    url: `${base}/api/website/users/sync`,
    secret,
  };
}

function toIso(value) {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function toPmUserPayload(user) {
  return {
    externalId: String(user.id),
    openid: user.openid,
    unionid: user.unionid || null,
    nickname: user.nickname || null,
    avatarUrl: user.avatarUrl || null,
    phone: user.phone || null,
    country: user.country || null,
    province: user.province || null,
    city: user.city || null,
    registeredAt: toIso(user.createdAt),
    lastSeenAt: toIso(user.lastLoginAt || user.updatedAt || user.createdAt),
    lastLoginIp: user.lastLoginIp || null,
  };
}

export async function pushUsersToPm(users, options = {}) {
  const { url, secret } = getPmSyncConfig();
  if (!secret) {
    console.warn('[pm-sync] PM_SYNC_SECRET not configured; skip push');
    return { skipped: true };
  }
  if (!users?.length) return { upserted: 0 };

  const recordLogin = options.recordLogin ?? users.length === 1;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-website-sync-secret': secret,
    },
    body: JSON.stringify({
      users: users.map(toPmUserPayload),
      recordLogin,
    }),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(data?.error || `PM sync failed (${response.status})`);
  }
  return data;
}

export function pushUsersToPmBackground(users, options = {}) {
  pushUsersToPm(users, options).catch((err) => {
    console.error('[pm-sync]', err.message || err);
  });
}

export async function pushDiagnosisReportToPm(report) {
  const base = (process.env.PM_SYNC_URL || 'https://pm.daoith.com').replace(/\/$/, '');
  const secret =
    process.env.PM_SYNC_SECRET?.trim() ||
    process.env.WEBSITE_SYNC_SECRET?.trim() ||
    '';
  if (!secret) {
    console.warn('[pm-sync] PM_SYNC_SECRET not configured; skip diagnosis push');
    return { skipped: true };
  }
  const url = `${base}/api/website/diagnosis/sync`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-website-sync-secret': secret,
    },
    body: JSON.stringify(report),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    throw new Error(data?.error || `PM diagnosis sync failed (${response.status})`);
  }
  return data;
}

export function pushDiagnosisReportToPmBackground(report) {
  pushDiagnosisReportToPm(report).catch((err) => {
    console.error('[pm-sync:diagnosis]', err.message || err);
  });
}
