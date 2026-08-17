/**
 * Resolve client IP → country / province / city (best-effort).
 * Prefers Chinese-language sources for mainland CN charts.
 */

const PRIVATE_IP_RE =
  /^(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|::1|fc|fd|fe80)/i;

const MUNICIPALITIES = new Set(['北京', '上海', '天津', '重庆']);
const SPECIAL_PROVINCES = {
  内蒙古: '内蒙古自治区',
  广西: '广西壮族自治区',
  西藏: '西藏自治区',
  宁夏: '宁夏回族自治区',
  新疆: '新疆维吾尔自治区',
  香港: '香港特别行政区',
  澳门: '澳门特别行政区',
};
const EN_PROVINCES = {
  beijing: '北京市',
  tianjin: '天津市',
  shanghai: '上海市',
  chongqing: '重庆市',
  hebei: '河北省',
  shanxi: '山西省',
  liaoning: '辽宁省',
  jilin: '吉林省',
  heilongjiang: '黑龙江省',
  jiangsu: '江苏省',
  zhejiang: '浙江省',
  anhui: '安徽省',
  fujian: '福建省',
  jiangxi: '江西省',
  shandong: '山东省',
  henan: '河南省',
  hubei: '湖北省',
  hunan: '湖南省',
  guangdong: '广东省',
  hainan: '海南省',
  sichuan: '四川省',
  guizhou: '贵州省',
  yunnan: '云南省',
  shaanxi: '陕西省',
  gansu: '甘肃省',
  qinghai: '青海省',
  taiwan: '台湾省',
  'inner mongolia': '内蒙古自治区',
  neimenggu: '内蒙古自治区',
  guangxi: '广西壮族自治区',
  tibet: '西藏自治区',
  xizang: '西藏自治区',
  ningxia: '宁夏回族自治区',
  xinjiang: '新疆维吾尔自治区',
  'hong kong': '香港特别行政区',
  hongkong: '香港特别行政区',
  macao: '澳门特别行政区',
  macau: '澳门特别行政区',
};
const EN_CITIES = {
  shenzhen: '深圳市',
  guangzhou: '广州市',
  dongguan: '东莞市',
  foshan: '佛山市',
  zhuhai: '珠海市',
  zhongshan: '中山市',
  huizhou: '惠州市',
  beijing: '北京市',
  shanghai: '上海市',
  hangzhou: '杭州市',
  ningbo: '宁波市',
  nanjing: '南京市',
  suzhou: '苏州市',
  wuxi: '无锡市',
  chengdu: '成都市',
  chongqing: '重庆市',
  wuhan: '武汉市',
  changsha: '长沙市',
  xian: '西安市',
  "xi'an": '西安市',
  zhengzhou: '郑州市',
  qingdao: '青岛市',
  jinan: '济南市',
  tianjin: '天津市',
  xiamen: '厦门市',
  fuzhou: '福州市',
  hefei: '合肥市',
  nanchang: '南昌市',
  kunming: '昆明市',
  guiyang: '贵阳市',
  nanning: '南宁市',
  haikou: '海口市',
  sanya: '三亚市',
  dalian: '大连市',
  shenyang: '沈阳市',
  changchun: '长春市',
  harbin: '哈尔滨市',
  taiyuan: '太原市',
  shijiazhuang: '石家庄市',
  lanzhou: '兰州市',
  yinchuan: '银川市',
  xining: '西宁市',
  urumqi: '乌鲁木齐市',
  lhasa: '拉萨市',
};

function isPublicIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const cleaned = ip.replace(/^::ffff:/i, '').trim();
  if (!cleaned || cleaned === 'unknown') return false;
  if (PRIVATE_IP_RE.test(cleaned)) return false;
  // bare IPv6 localhost already covered; skip other local-looking hosts
  if (cleaned.includes(':') && !cleaned.includes('.')) {
    // allow public IPv6 roughly (not fe80/fc/fd/::1)
    return !/^(::1|fe80|fc|fd)/i.test(cleaned);
  }
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(cleaned);
}

export function extractClientIp(req) {
  const headers = req.headers || {};
  const candidates = [];

  const forwarded =
    headers['x-forwarded-for'] ||
    headers['X-Forwarded-For'] ||
    headers['x-real-ip'] ||
    headers['X-Real-IP'] ||
    headers['cf-connecting-ip'] ||
    headers['CF-Connecting-IP'] ||
    '';

  if (typeof forwarded === 'string' && forwarded.trim()) {
    for (const part of forwarded.split(',')) {
      candidates.push(part.trim());
    }
  }

  if (req.socket?.remoteAddress) {
    candidates.push(req.socket.remoteAddress);
  }

  for (const raw of candidates) {
    const ip = String(raw || '')
      .replace(/^::ffff:/i, '')
      .trim();
    if (isPublicIp(ip)) return ip;
  }
  return null;
}

function normalizeProvince(raw) {
  if (!raw) return null;
  let p = String(raw).trim().replace(/\s+/g, '');
  if (!p || p === 'XX' || p === '内网IP') return null;
  if (p.endsWith('省') && /[A-Za-z]/.test(p)) p = p.slice(0, -1);
  const key = p.toLowerCase().replace(/省|市/g, '');
  if (EN_PROVINCES[key]) return EN_PROVINCES[key];
  const spaced = String(raw).trim().toLowerCase();
  if (EN_PROVINCES[spaced]) return EN_PROVINCES[spaced];

  for (const [short, full] of Object.entries(SPECIAL_PROVINCES)) {
    if (p === short || p.startsWith(short)) return full;
  }
  if (MUNICIPALITIES.has(p) || [...MUNICIPALITIES].some((m) => p.startsWith(m))) {
    const base = [...MUNICIPALITIES].find((m) => p.startsWith(m)) || p;
    return `${base}市`;
  }
  if (/(省|市|自治区|特别行政区)$/.test(p)) return p;
  if (/^[\x00-\x7F]+$/.test(p)) return null;
  return `${p}省`;
}

function normalizeCity(raw) {
  if (!raw) return null;
  let c = String(raw).trim().replace(/\s+/g, '');
  if (!c || c === 'XX') return null;
  if (c.endsWith('市') && /[A-Za-z]/.test(c)) c = c.slice(0, -1);
  const key = c.toLowerCase().replace(/市/g, '');
  if (EN_CITIES[key]) return EN_CITIES[key];
  if (/(市|州|盟|地区|县|区)$/.test(c)) return c;
  if (/^[\x00-\x7F]+$/.test(c)) return null;
  return `${c}市`;
}

function normalizeCountry(raw) {
  if (!raw) return null;
  const c = String(raw).trim();
  if (!c) return null;
  if (c === 'China' || c === 'CN' || c === '中国') return '中国';
  return c;
}

export { normalizeProvince, normalizeCity, normalizeCountry };

async function fetchJson(url, { encoding } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'daoith-website/geoip' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (encoding === 'gbk') {
      const buf = Buffer.from(await res.arrayBuffer());
      try {
        const text = new TextDecoder('gbk').decode(buf);
        return JSON.parse(text);
      } catch {
        // Some runtimes lack GBK; fall back to latin1 then hope JSON ascii keys survive
        const text = buf.toString('utf8');
        return JSON.parse(text);
      }
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function lookupPconline(ip) {
  const data = await fetchJson(
    `https://whois.pconline.com.cn/ipJson.jsp?ip=${encodeURIComponent(ip)}&json=true`,
    { encoding: 'gbk' },
  );
  if (!data || data.err) return null;
  const province = normalizeProvince(data.pro);
  const city = normalizeCity(data.city);
  if (!province && !city) return null;
  return {
    country: '中国',
    province,
    city,
  };
}

async function lookupIpApi(ip) {
  const data = await fetchJson(
    `http://ip-api.com/json/${encodeURIComponent(ip)}?lang=zh-CN&fields=status,message,country,regionName,city`,
  );
  if (!data || data.status !== 'success') return null;
  return {
    country: normalizeCountry(data.country),
    province: normalizeProvince(data.regionName),
    city: normalizeCity(data.city),
  };
}

async function lookupIpSb(ip) {
  const data = await fetchJson(`https://api.ip.sb/geoip/${encodeURIComponent(ip)}`);
  if (!data) return null;
  return {
    country: normalizeCountry(data.country),
    province: normalizeProvince(data.region),
    city: normalizeCity(data.city),
  };
}

export async function lookupIpRegion(ip) {
  if (!isPublicIp(ip)) return null;

  // ip-api 返回 UTF-8 中文，最稳；pconline 需 GBK
  const sources = [lookupIpApi, lookupPconline, lookupIpSb];
  for (const fn of sources) {
    try {
      const hit = await fn(ip);
      if (hit && (hit.province || hit.city || hit.country)) {
        return {
          country: hit.country || null,
          province: hit.province || null,
          city: hit.city || null,
          ip,
        };
      }
    } catch {
      // try next source
    }
  }
  return null;
}
