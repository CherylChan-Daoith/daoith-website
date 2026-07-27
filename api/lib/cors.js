export function applyCors(req, res, methods = 'GET, POST, OPTIONS') {
  const origin = req.headers.origin;
  const allowed = [
    'https://www.daoith.com',
    'https://daoith.com',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
  ];

  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(req, res, methods = 'GET, POST, OPTIONS') {
  applyCors(req, res, methods);
  return res.status(204).end();
}
