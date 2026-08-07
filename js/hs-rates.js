/**
 * HS 出口退税率 / 目的国关税参考库
 * 出口退税：对齐国家税务总局、海关总署公布税则口径（章目/常见税号参考）
 * 目的国关税：对齐各国海关官方税则常见 MFN/普通税率口径（章目参考）
 * 完整 8–10 位税号请以官方系统终核为准。
 */
(function (global) {
  function digitsOnly(hs) {
    return String(hs || '').replace(/\D/g, '');
  }

  function normalizeHs(hs) {
    const d = digitsOnly(hs);
    return {
      raw: String(hs || '').trim(),
      digits: d,
      hs2: d.slice(0, 2),
      hs4: d.slice(0, 4),
      hs6: d.slice(0, 6),
      hs8: d.slice(0, 8),
    };
  }

  /** 常见商品编码出口退税率（%），优先于章目默认；键可为 HS4/HS6/HS8 */
  const CN_REFUND_HS = {
    '392690': 13,
    '420222': 13,
    '610910': 13,
    '611030': 13,
    '620342': 13,
    '620462': 13,
    '640299': 13,
    '847130': 13,
    '850440': 13,
    '851762': 13,
    '851830': 13,
    '940360': 13,
    '940171': 13,
    '950300': 13,
    '950450': 13,
    '950490': 13,
    // 财政部 税务总局公告2024年第15号：自2024-12-01起取消铝材等出口退税（文库口径 0%）
    '7601': 0,
    '7602': 0,
    '7603': 0,
    '7604': 0,
    '7605': 0,
    '7606': 0,
    '7607': 0,
    '7608': 0,
    '76081000': 0,
    '76082000': 0,
    '7609': 0,
    '7610': 0,
    '76101000': 0,
    '76109000': 0,
    '7611': 0,
    '7612': 0,
    '7613': 0,
    '7614': 0,
    '7615': 0,
    '7616': 0,
  };

  /**
   * 章（前2位）出口退税率默认参考（%）
   * 口径：多数出口货物增值税退税率与征税率一致（13%/9% 等），以税局文库为准
   * 注意：第76章铝及其制品受2024年第15号公告影响，多数铝材已取消退税，勿用章默认13%
   */
  const CN_REFUND_CHAPTER = {
    '01': 9, '02': 9, '03': 9, '04': 9, '05': 0,
    '06': 9, '07': 0, '08': 0, '09': 0, '10': 0,
    '11': 0, '12': 0, '13': 0, '14': 0, '15': 0,
    '16': 13, '17': 13, '18': 13, '19': 13, '20': 13,
    '21': 13, '22': 13, '23': 0, '24': 13, '25': 0,
    '26': 0, '27': 0, '28': 13, '29': 13, '30': 13,
    '31': 0, '32': 13, '33': 13, '34': 13, '35': 13,
    '36': 13, '37': 13, '38': 13, '39': 13, '40': 13,
    '41': 0, '42': 13, '43': 0, '44': 0, '45': 0,
    '46': 13, '47': 0, '48': 13, '49': 13, '50': 13,
    '51': 13, '52': 13, '53': 13, '54': 13, '55': 13,
    '56': 13, '57': 13, '58': 13, '59': 13, '60': 13,
    '61': 13, '62': 13, '63': 13, '64': 13, '65': 13,
    '66': 13, '67': 13, '68': 13, '69': 13, '70': 13,
    '71': 0, '72': 0, '73': 13, '74': 0, '75': 0,
    // 铝及其制品：2024-12-01 起铝材等取消退税，章默认改为 0（具体税号仍以文库为准）
    '76': 0, '78': 0, '79': 0, '80': 0, '81': 0,
    '82': 13, '83': 13, '84': 13, '85': 13, '86': 13,
    '87': 13, '88': 13, '89': 13, '90': 13, '91': 13,
    '92': 13, '93': 0, '94': 13, '95': 13, '96': 13,
    '97': 0,
  };

  /**
   * 目的国关税章目参考（MFN/普通税率近似，单位 %）
   * 实际以各国海关税则子目为准；同一章内税率可能跨度很大
   */
  const DUTY_CHAPTER = {
    us: {
      '39': 5.3, '42': 8, '61': 16.5, '62': 16, '64': 10,
      '84': 2.5, '85': 2.6, '94': 0, '95': 0, '96': 4.2,
      _default: 3.5,
      _source: '美国国际贸易委员会 HTS（hts.usitc.gov）',
      _url: 'https://hts.usitc.gov/',
    },
    uk: {
      '39': 6.5, '42': 3.5, '61': 12, '62': 12, '64': 8,
      '84': 2.2, '85': 2.5, '94': 2.7, '95': 4.7, '96': 2.7,
      _default: 4,
      _source: '英国 Trade Tariff（trade-tariff.service.gov.uk）',
      _url: 'https://www.trade-tariff.service.gov.uk/find_commodity',
    },
    de: {
      '39': 6.5, '42': 3.5, '61': 12, '62': 12, '64': 8,
      '84': 2.2, '85': 2.5, '94': 2.7, '95': 4.7, '96': 2.7,
      _default: 4,
      _source: '欧盟 TARIC / 德国海关（欧盟共同关税）',
      _url: 'https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp',
    },
    fr: {
      '39': 6.5, '42': 3.5, '61': 12, '62': 12, '64': 8,
      '84': 2.2, '85': 2.5, '94': 2.7, '95': 4.7, '96': 2.7,
      _default: 4,
      _source: '欧盟 TARIC / 法国海关（欧盟共同关税）',
      _url: 'https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp',
    },
    it: {
      '39': 6.5, '42': 3.5, '61': 12, '62': 12, '64': 8,
      '84': 2.2, '85': 2.5, '94': 2.7, '95': 4.7, '96': 2.7,
      _default: 4,
      _source: '欧盟 TARIC（欧盟共同关税）',
      _url: 'https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp',
    },
    es: {
      '39': 6.5, '42': 3.5, '61': 12, '62': 12, '64': 8,
      '84': 2.2, '85': 2.5, '94': 2.7, '95': 4.7, '96': 2.7,
      _default: 4,
      _source: '欧盟 TARIC（欧盟共同关税）',
      _url: 'https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp',
    },
    jp: {
      '39': 3.9, '42': 8, '61': 9.1, '62': 9.1, '64': 8,
      '84': 0, '85': 0, '94': 0, '95': 0, '96': 3.9,
      _default: 3,
      _source: '日本海关税则（customs.go.jp）',
      _url: 'https://www.customs.go.jp/tariff/',
    },
    ca: {
      '39': 6.5, '42': 8, '61': 18, '62': 17, '64': 18,
      '84': 0, '85': 0, '94': 0, '95': 0, '96': 6.5,
      _default: 5,
      _source: '加拿大海关关税表（cbsa-asfc.gc.ca）',
      _url: 'https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/menu-eng.html',
    },
    au: {
      '39': 5, '42': 5, '61': 5, '62': 5, '64': 5,
      '84': 0, '85': 0, '94': 5, '95': 0, '96': 5,
      _default: 5,
      _source: '澳大利亚海关 FTA/关税（abf.gov.au）',
      _url: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification',
    },
    kr: {
      '39': 6.5, '42': 8, '61': 13, '62': 13, '64': 13,
      '84': 0, '85': 0, '94': 0, '95': 0, '96': 8,
      _default: 5,
      _source: '韩国海关关税（customs.go.kr）',
      _url: 'https://unipass.customs.go.kr/',
    },
    mx: {
      '39': 10, '42': 20, '61': 25, '62': 25, '64': 25,
      '84': 0, '85': 0, '94': 15, '95': 15, '96': 15,
      _default: 10,
      _source: '墨西哥海关税则（TIGIE）',
      _url: 'https://www.snice.gob.mx/',
    },
    ru: {
      '39': 6.5, '42': 10, '61': 10, '62': 10, '64': 10,
      '84': 0, '85': 0, '94': 10, '95': 10, '96': 10,
      _default: 7.5,
      _source: '欧亚经济联盟 / 俄罗斯海关税则',
      _url: 'https://www.alta.ru/tnved/',
    },
    sea: {
      '39': 5, '42': 10, '61': 10, '62': 10, '64': 10,
      '84': 0, '85': 0, '94': 10, '95': 10, '96': 10,
      _default: 5,
      _source: '东盟各国海关税则（请按具体目的国终核）',
      _url: 'https://www.asean.org/',
    },
    me: {
      '39': 5, '42': 5, '61': 5, '62': 5, '64': 5,
      '84': 5, '85': 5, '94': 5, '95': 5, '96': 5,
      _default: 5,
      _source: '中东各国海关税则（请按具体目的国终核）',
      _url: 'https://www.customs.gov.sa/',
    },
    other: {
      _default: null,
      _source: '目的国海关官方税则',
      _url: '',
    },
  };

  /** 常见 HS6 + 目的国 更精确参考 */
  const DUTY_HS6 = {
    us: { '950300': 0, '950450': 0, '847130': 0, '851762': 0, '620462': 16.6, '610910': 16.5 },
    uk: { '950300': 4.7, '847130': 0, '851762': 0, '620462': 12, '610910': 12 },
    de: { '950300': 4.7, '847130': 0, '851762': 0, '620462': 12, '610910': 12 },
    fr: { '950300': 4.7, '847130': 0, '851762': 0, '620462': 12, '610910': 12 },
    it: { '950300': 4.7, '847130': 0, '851762': 0, '620462': 12, '610910': 12 },
    es: { '950300': 4.7, '847130': 0, '851762': 0, '620462': 12, '610910': 12 },
    jp: { '950300': 0, '847130': 0, '851762': 0, '620462': 9.1, '610910': 9.1 },
    ca: { '950300': 0, '847130': 0, '851762': 0 },
    au: { '950300': 0, '847130': 0, '851762': 0 },
    kr: { '950300': 0, '847130': 0, '851762': 0 },
  };

  function lookupRefundRate(hsCode) {
    const hs = normalizeHs(hsCode);
    if (hs.digits.length < 4) {
      return {
        ok: false,
        rate: null,
        display: '—',
        message: '请至少输入 HS 前 4 位（建议 6–10 位）',
        source: '国家税务总局 / 海关总署出口退税率文库',
        sourceUrl: 'https://www.chinatax.gov.cn/',
      };
    }

    let rate = null;
    let matchLevel = '';
    let matchKey = '';
    // 精确优先：HS8 → HS6 → HS4 → 章目
    const candidates = [
      hs.digits.length >= 10 ? hs.digits.slice(0, 10) : '',
      hs.hs8,
      hs.hs6,
      hs.hs4,
    ].filter(Boolean);

    for (const key of candidates) {
      if (CN_REFUND_HS[key] != null) {
        rate = CN_REFUND_HS[key];
        matchKey = key;
        matchLevel = key.length >= 8 ? 'HS8' : key.length >= 6 ? 'HS6' : 'HS4';
        break;
      }
    }

    if (rate == null && hs.hs2 && CN_REFUND_CHAPTER[hs.hs2] != null) {
      rate = CN_REFUND_CHAPTER[hs.hs2];
      matchKey = hs.hs2;
      matchLevel = '章目';
    }

    if (rate == null) {
      return {
        ok: false,
        rate: null,
        display: '—',
        message: '库中暂无该编码参考值，请到税局/海关出口退税率文库核对完整税号',
        source: '国家税务总局 / 海关总署出口退税率文库',
        sourceUrl: 'https://www.chinatax.gov.cn/',
      };
    }

    let message =
      matchLevel === '章目'
        ? `章目 ${hs.hs2} 参考退税率；请用完整税号在官方文库终核`
        : `按 ${matchLevel}「${matchKey}」匹配的参考退税率`;
    if (hs.hs2 === '76' || matchKey.startsWith('76')) {
      message += '（铝及其制品受财政部税务总局公告2024年第15号影响，自2024-12-01起多数铝材取消出口退税）';
    }

    return {
      ok: true,
      rate,
      display: `${rate}%`,
      matchLevel,
      message,
      source: '国家税务总局 / 海关总署公布税则（出口退税率文库）',
      sourceUrl: 'https://www.chinatax.gov.cn/',
    };
  }

  function lookupDutyRate(hsCode, countryId) {
    const hs = normalizeHs(hsCode);
    const country = String(countryId || '').trim();
    const table = DUTY_CHAPTER[country] || DUTY_CHAPTER.other;

    if (hs.digits.length < 4) {
      return {
        ok: false,
        rate: null,
        display: '—',
        message: '请至少输入 HS 前 4 位（建议 6–10 位）',
        source: table._source,
        sourceUrl: table._url || '',
      };
    }

    const hs6Table = DUTY_HS6[country] || {};
    let rate = null;
    let matchLevel = '';

    if (hs.hs6 && hs6Table[hs.hs6] != null) {
      rate = hs6Table[hs.hs6];
      matchLevel = 'HS6';
    } else if (hs.hs2 && table[hs.hs2] != null) {
      rate = table[hs.hs2];
      matchLevel = '章目';
    } else if (table._default != null) {
      rate = table._default;
      matchLevel = '国家默认';
    }

    if (rate == null) {
      return {
        ok: false,
        rate: null,
        display: '—',
        message: '请选择具体目的国，并到该国海关官方税则按完整税号核对',
        source: table._source,
        sourceUrl: table._url || '',
      };
    }

    return {
      ok: true,
      rate,
      display: `${rate}%`,
      matchLevel,
      message:
        matchLevel === '章目' || matchLevel === '国家默认'
          ? `${matchLevel}参考税率；同章子目可能差异较大，请以官方税则终核`
          : `按 ${matchLevel}「${hs.hs6}」匹配的参考关税`,
      source: table._source,
      sourceUrl: table._url || '',
    };
  }

  global.DAOITH_HS_RATES = {
    normalizeHs,
    lookupRefundRate,
    lookupDutyRate,
  };
})(typeof window !== 'undefined' ? window : globalThis);
