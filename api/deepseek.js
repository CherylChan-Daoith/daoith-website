const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    return res.status(503).json({
      error: '未配置 DeepSeek API Key',
      hint: '请在 Vercel 项目 Settings → Environment Variables 中添加 DEEPSEEK_API_KEY',
    });
  }

  const body = req.body || {};
  const payload = {
    model: body.model || 'deepseek-chat',
    messages: body.messages || [],
    temperature: body.temperature ?? 0.3,
    max_tokens: body.max_tokens ?? 2000,
  };

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'DeepSeek API 错误',
        detail: data,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: err.message || 'Upstream request failed' });
  }
}
