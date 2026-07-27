export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    ok: true,
    deepseek_configured: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
    wechat_configured: Boolean(
      process.env.WECHAT_APP_ID?.trim() && process.env.WECHAT_APP_SECRET?.trim(),
    ),
    jwt_configured: Boolean(process.env.JWT_SECRET?.trim()),
  });
}
