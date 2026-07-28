/* DAOITH Consulting - Main JavaScript */

const PAGE_SIZE = 10;
const ARTICLES_PAGE_SIZE = 6;
const POLICY_PAGE_SIZE = 4;
const TAX_SYSTEMS_PAGE_SIZE = 6;

document.addEventListener('DOMContentLoaded', () => {
  if (window.DAOITH_initI18n) window.DAOITH_initI18n();
  initHeader();
  initNavigation();
  initMobileMenu();
  initNavDropdown();
  initHeroFeatures();
  initFAQ();
  initAIForm();
  initTaxCalculator();
  initServiceFilters();
  initShowMoreServices();
  initHubTabs();
  initWechatToggle();
  initFeedbackForm();
  initLoadMore();
  initTaxSystemsGrid();
  updateExpertArticles();
  window.DAOITH_CART?.updateCartBadge();
  window.DAOITH_CART?.bindAddButtons();

  window.addEventListener('localechange', () => {
    initTaxSystemsGrid();
    updateExpertArticles();
    refreshPaginationLabels();
    refreshShowMoreServicesLabel();
    syncTaxIncomeOptions();
  });

  window.addEventListener('daoith-auth-pending', (event) => {
    const action = event.detail?.action;
    setTimeout(() => {
      if (action === 'ai-generate') {
        document.getElementById('aiForm')?.requestSubmit();
      } else if (action === 'tax-calc') {
        document.getElementById('calcTax')?.click();
      }
    }, 400);
  });
});

/* Header scroll effect */
function initHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  });
}

/* Active nav link on scroll */
function initNavigation() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav > a[href^="#"], .nav-dropdown-menu a[href^="#"]');
  const policyTrigger = document.querySelector('.nav-dropdown-trigger[data-nav-parent="policy"]');
  const policyIds = new Set(['policy', 'tax-systems', 'policy-expert', 'policy-tax', 'policy-platform']);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
          if (policyTrigger) {
            policyTrigger.classList.toggle('active', policyIds.has(id));
          }
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((section) => observer.observe(section));

  // Also observe in-page policy blocks for submenu highlighting
  ['tax-systems', 'policy-expert', 'policy-tax', 'policy-platform'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

/* Mobile menu */
function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  nav.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      document.querySelectorAll('.nav-dropdown.open').forEach((d) => {
        d.classList.remove('open');
        d.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
      });
    });
  });
}

function initNavDropdown() {
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  if (!dropdowns.length) return;

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector('.nav-dropdown-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const willOpen = !dropdown.classList.contains('open');
      document.querySelectorAll('.nav-dropdown.open').forEach((d) => {
        if (d !== dropdown) {
          d.classList.remove('open');
          d.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });
      dropdown.classList.toggle('open', willOpen);
      trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.nav-dropdown')) return;
    document.querySelectorAll('.nav-dropdown.open').forEach((d) => {
      d.classList.remove('open');
      d.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    });
  });
}

/* Hero process cards reveal feature blocks */
function initHeroFeatures() {
  const grid = document.getElementById('heroFeatures');
  const cards = document.querySelectorAll('.process-card[data-step]');
  if (!grid || !cards.length) return;

  function revealStep(step) {
    const feature = grid.querySelector(`.feature-card[data-step="${step}"]`);
    if (!feature) return;

    grid.classList.remove('is-collapsed');
    feature.classList.remove('is-hidden');

    cards.forEach((card) => {
      card.classList.toggle('is-active', card.dataset.step === step);
    });

    if (feature.classList.contains('is-hidden') === false) {
      feature.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  cards.forEach((card) => {
    const step = card.dataset.step;
    const activate = () => revealStep(step);

    card.addEventListener('click', activate);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });
}

/* Paginated lists */
function refreshPaginationLabels() {
  document.querySelectorAll('.btn-load-more').forEach((btn) => {
    if (btn.id === 'loadMoreArticles' && !btn.classList.contains('is-hidden')) {
      btn.textContent = window.DAOITH_t('loadMore.articles');
    }
    if (btn.id === 'loadMoreTaxSystems' && !btn.classList.contains('is-hidden')) {
      btn.textContent = window.DAOITH_t('loadMore.taxSystems');
    }
    if (btn.id === 'loadMoreTaxPolicies' && !btn.classList.contains('is-hidden')) {
      btn.textContent = window.DAOITH_t('loadMore.taxPolicies');
    }
    if (btn.id === 'loadMorePlatformPolicies' && !btn.classList.contains('is-hidden')) {
      btn.textContent = window.DAOITH_t('loadMore.platformPolicies');
    }
  });
}

function refreshShowMoreServicesLabel() {
  const btn = document.getElementById('showMoreServices');
  if (!btn) return;
  const expanded = btn.dataset.expanded === 'true';
  btn.textContent = expanded ? window.DAOITH_t('services.collapse') : window.DAOITH_t('services.showAll');
}

function updateExpertArticles() {
  const locale = window.DAOITH_getLocale?.() || 'zh';
  const enMap = window.DAOITH_I18N_EN?.articleTexts || {};
  document.querySelectorAll('.article-card[data-article-id]').forEach((card) => {
    const id = card.dataset.articleId;
    const article = typeof window.getArticleById === 'function' ? window.getArticleById(id) : null;
    const en = enMap[id];
    const titleLink = card.querySelector('.article-title-link');
    const excerpt = card.querySelector('p');
    const readLink = card.querySelector('.article-link');
    if (titleLink) {
      titleLink.textContent = locale === 'en' && en?.title ? en.title : (article?.title || titleLink.textContent);
    }
    if (excerpt) {
      excerpt.textContent = locale === 'en' && en?.excerpt ? en.excerpt : (article?.excerpt || excerpt.textContent);
    }
    if (readLink) readLink.textContent = window.DAOITH_t('article.readMore');
  });
}

function initLoadMore() {
  setupPagination({
    itemsSelector: '#policy-expert .article-card',
    buttonId: 'loadMoreArticles',
    labelKey: 'loadMore.articles',
    pageSize: ARTICLES_PAGE_SIZE,
  });
  setupPagination({
    itemsSelector: '#policyTaxList .policy-item',
    buttonId: 'loadMoreTaxPolicies',
    labelKey: 'loadMore.taxPolicies',
    pageSize: POLICY_PAGE_SIZE,
  });
  setupPagination({
    itemsSelector: '#policyPlatformList .policy-item',
    buttonId: 'loadMorePlatformPolicies',
    labelKey: 'loadMore.platformPolicies',
    pageSize: POLICY_PAGE_SIZE,
  });
}

function setupPagination({ itemsSelector, buttonId, labelKey, label, onUpdate, pageSize = PAGE_SIZE }) {
  const items = Array.from(document.querySelectorAll(itemsSelector));
  const button = document.getElementById(buttonId);
  if (!items.length || !button) return;

  let visibleCount = pageSize;

  function updateButton() {
    const shown = items.filter((item) => !item.classList.contains('is-paginated-hidden')).length;
    const matchable = items.filter((item) => item.style.display !== 'none').length;
    button.classList.toggle('is-hidden', shown >= items.length || matchable === 0);
    const remaining = items.length - shown;
    if (labelKey === 'loadMore.articles' || labelKey === 'loadMore.taxSystems' || labelKey === 'loadMore.taxPolicies' || labelKey === 'loadMore.platformPolicies') {
      button.textContent = window.DAOITH_t(labelKey);
    } else if (labelKey) {
      button.textContent = remaining > 0
        ? window.DAOITH_t('loadMore.policiesRemaining').replace('{n}', String(Math.min(remaining, pageSize)))
        : window.DAOITH_t('loadMore.policies');
    } else {
      button.textContent = remaining > 0
        ? `查看更多（还有 ${Math.min(remaining, pageSize)} ${label}）`
        : '查看更多';
    }
  }

  function applyPagination() {
    let shown = 0;
    items.forEach((item) => {
      const filteredOut = item.style.display === 'none';
      if (filteredOut) return;
      shown += 1;
      item.classList.toggle('is-paginated-hidden', shown > visibleCount);
    });
    updateButton();
    onUpdate?.();
  }

  items.forEach((item, index) => {
    item.dataset.index = String(index);
    if (index >= pageSize) item.classList.add('is-paginated-hidden');
  });

  button.onclick = () => {
    visibleCount += pageSize;
    items.forEach((item, index) => {
      if (index < visibleCount) item.classList.remove('is-paginated-hidden');
    });
    updateButton();
    onUpdate?.();
  };

  updateButton();
  return { applyPagination, items, getVisibleCount: () => visibleCount };
}

/* FAQ accordion */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* Dify API (api.daoith.com) — no API keys in frontend */
function getDifyUserId() {
  const authUser = window.DAOITH_AUTH?.getUser?.();
  if (authUser?.openid) return `wx-${authUser.openid}`;

  const key = 'daoith_dify_user_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `web-${crypto.randomUUID()}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function getDifyConfig() {
  return window.DAOITH_CONFIG || {
    difyApiBase: 'https://api.daoith.com',
    difyEndpoint: '/v1/chat-messages',
    difyDiagnosisEndpoint: '/v1/chat-messages',
    difyHsRateEndpoint: '/v1/chat-messages',
    difyTaxCalcEndpoint: '/v1/chat-messages',
  };
}

function buildDifyInputs(ctx) {
  return {
    task: 'compliance_diagnosis',
    platform: ctx.platformLabel,
    entity: ctx.entityLabel,
    country: ctx.countryLabel,
    hs_code: ctx.hsCode || '',
    revenue: ctx.revenueLabel,
    team_size: ctx.teamSizeLabel,
    invoice: ctx.invoiceLabel,
    shipping_mode: ctx.shippingLabel,
    notes: ctx.notes || '',
  };
}

function extractDifyAnswer(data) {
  if (typeof data.answer === 'string' && data.answer.trim()) {
    return data.answer.trim();
  }

  const outputs = data.data?.outputs;
  if (outputs) {
    if (typeof outputs === 'string' && outputs.trim()) return outputs.trim();
    const keys = ['text', 'result', 'answer', 'output', 'report'];
    for (const key of keys) {
      if (typeof outputs[key] === 'string' && outputs[key].trim()) {
        return outputs[key].trim();
      }
    }
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }

  return '';
}

async function callDify({ endpoint, inputs, query }) {
  const cfg = getDifyConfig();
  const path = endpoint || cfg.difyEndpoint || '/v1/chat-messages';
  const url = `${cfg.difyApiBase}${path}`;

  const payload = {
    inputs,
    query,
    response_mode: 'blocking',
    user: getDifyUserId(),
  };

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('无法连接道一 AI 服务（api.daoith.com），请检查网络或稍后重试');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`AI 服务返回异常（HTTP ${res.status}）`);
  }

  if (!res.ok) {
    const msg = data.message || data.error || data.code || `请求失败（HTTP ${res.status}）`;
    throw new Error(msg);
  }

  const text = extractDifyAnswer(data);
  if (!text) {
    throw new Error('AI 返回内容为空，请检查 Dify 应用输出配置');
  }

  return text;
}

function callDifyDiagnosis(ctx) {
  const { difyDiagnosisEndpoint } = getDifyConfig();
  return callDify({
    endpoint: difyDiagnosisEndpoint,
    inputs: buildDifyInputs(ctx),
    query: buildSolutionPrompt(ctx),
  });
}

function callDifyHsRate(hsCode) {
  const { difyHsRateEndpoint } = getDifyConfig();
  return callDify({
    endpoint: difyHsRateEndpoint,
    inputs: {
      task: 'hs_refund_rate',
      hs_code: hsCode,
    },
    query: `你是中国出口退税政策助手。请依据国家税务总局、海关总署公开发布的出口退税税则/商品编码退税率信息，查询海关编码 ${hsCode} 的现行出口退税率。

输出要求（中文，简洁）：
1. 第一行：出口退税率：X%
2. 第二行：数据来源：国家税务总局 / 海关总署（注明依据类型，如出口退税率文库或税则公告）
3. 第三行：简要说明（不超过40字；若编码不完整或无法精确匹配，说明需核对完整编码）
不要编造无法核实的税率；不确定时明确写「需人工核对官方税则」。`,
  });
}

function callDifyDutyRate(hsCode, countryLabel) {
  const { difyHsRateEndpoint } = getDifyConfig();
  return callDify({
    endpoint: difyHsRateEndpoint,
    inputs: {
      task: 'hs_import_duty',
      hs_code: hsCode,
      country: countryLabel,
    },
    query: `你是跨境关税政策助手。请依据【${countryLabel}】海关/关税主管部门官方税则（如海关官网、关税委员会、WTO绑定税率公开信息），查询海关编码 ${hsCode}（或其对应本国税号）在【${countryLabel}】的进口关税税率。

输出要求（中文，简洁）：
1. 第一行：目的国关税税率：X%（若有优惠税率/普通税率，分行注明）
2. 第二行：数据来源：${countryLabel}海关官方税则（尽量写出可核对的官网类型或税则名称）
3. 第三行：适用说明（不超过50字；注明是否可能另有反倾销税、附加税、增值税/消费税，不计入关税时请说明）
不要编造无法核实的税率；不确定时明确写「需登录该国海关官网人工核对」。`,
  });
}

function buildTaxCalcPrompt(params) {
  return `你是跨境财税专家。根据以下参数估算年度合规税负（单位：万元人民币），给出总额和分项。

年出口销售额：${params.revenue} 万元
出口退税率：${params.refundRate}%
目的国VAT税率：${params.vatRate}%
企业所得税率：${params.incomeRate}%
进项税额：${params.inputTax} 万元

请按以下格式回复（数字保留两位小数）：
年度合规税负总额：X 万元/年
国内增值税净额：X 万元
海外VAT预估：X 万元
企业所得税：X 万元
测算说明：（2-3句简要说明假设）`;
}

function callDifyTaxCalc(params) {
  const { difyTaxCalcEndpoint } = getDifyConfig();
  return callDify({
    endpoint: difyTaxCalcEndpoint,
    inputs: {
      task: 'tax_calculation',
      annual_revenue: String(params.revenue),
      refund_rate: String(params.refundRate),
      vat_rate: String(params.vatRate),
      income_tax_rate: String(params.incomeRate),
      input_tax: String(params.inputTax),
    },
    query: buildTaxCalcPrompt(params),
  });
}

function setButtonLoading(btn, loading, loadingText) {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText;
    btn.classList.add('is-loading');
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.classList.remove('is-loading');
    btn.disabled = false;
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatInline(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

const SOLUTION_GREETING =
  '您好，我是您的道一合规小助手，我将基于AI知识库给您提供合规方案，供您一般性参考，如您需要更准确和更有针对性的解决方案，可以咨询我们的财税合规专家！';

function ensureSolutionGreeting(text) {
  const raw = String(text || '').trim();
  if (!raw) return SOLUTION_GREETING;
  if (raw.includes('道一合规小助手')) return raw;
  return `${SOLUTION_GREETING}\n\n${raw}`;
}

function renderAIPlanHtml(text) {
  const lines = ensureSolutionGreeting(text).split('\n');
  let html = '';
  let inList = false;

  const closeList = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }

    if (/^#{1,4}\s+/.test(line)) {
      closeList();
      const level = (line.match(/^#+/) || ['##'])[0].length;
      const title = line.replace(/^#{1,4}\s+/, '').replace(/\*\*/g, '');
      const cls =
        level >= 3 ? 'result-section-subtitle' : 'result-section-title';
      html += `<h5 class="${cls}">${escapeHtml(title)}</h5>`;
      continue;
    }

    if (/^[-*•]\s+/.test(line) || /^\d+[.)、]\s+/.test(line)) {
      if (!inList) {
        html += '<ul class="result-list">';
        inList = true;
      }
      const item = formatInline(
        line.replace(/^[-*•]\s+/, '').replace(/^\d+[.)、]\s+/, '')
      );
      html += `<li>${item}</li>`;
      continue;
    }

    closeList();
    const isGreeting = line.includes('道一合规小助手');
    html += `<p class="result-paragraph${isGreeting ? ' result-greeting' : ''}">${formatInline(line)}</p>`;
  }

  closeList();
  return html || `<p class="result-paragraph">${formatInline(text)}</p>`;
}

function buildSolutionPrompt(ctx) {
  const greeting =
    '您好，我是您的道一合规小助手，我将基于AI知识库给您提供合规方案，供您一般性参考，如您需要更准确和更有针对性的解决方案，可以咨询我们的财税合规专家！';

  return `请为以下跨境电商企业撰写一份【详细、可落地】的财税合规方案。

## 客户信息
- 电商平台：${ctx.platformLabel}
- 店铺主体：${ctx.entityLabel}
- 目的国/地区：${ctx.countryLabel}
- HS编码：${ctx.hsCode || '未提供'}
- 年销售额：${ctx.revenueLabel}
- 团队人数：${ctx.teamSizeLabel}
- 供应商发票：${ctx.invoiceLabel}
- 发货模式：${ctx.shippingLabel}
- 补充说明：${ctx.notes || '无'}

## 输出结构（必须严格按此顺序，用中文 Markdown；章节标题用 ## ）

正文开头必须原样输出下面这段开场白（单独成段，不要改写、不要翻译、不要加引号）：
${greeting}

然后按下列章节输出：

## 一、业务背景信息总结
用 1 段话复述并归纳客户填写的业务背景（平台、主体、目的国、销售额区间、发票与发货模式、补充说明等），突出与合规相关的关键事实。不要遗漏已填写字段。

## 二、解决方案
本节下必须包含三个小节（用 ### 标题）：

### 1）业务流程图
用清晰的分步流程描述从采购/备货 → 出库/报关（如适用）→ 跨境物流 → 目的国入仓/履约 → 销售回款 → 税务申报的链路。
可用有序列表或「步骤A → 步骤B → 步骤C」形式；标明关键责任主体（店铺主体、货代、平台、税务机关）。

### 2）合规税负影响分析
重点分析（结合客户平台、主体、目的国与发货模式）：
- 国内增值税（进项、销项、出口退税/免税不退、无法退税风险等）
- 国内企业所得税（利润归属、核定/查账、关联交易等注意点）
- 目的国关税（HS 对应关税逻辑、完税价格、优惠税率/豁免可能性，信息不足时说明假设）
可补充目的国 VAT/销售税若与履约直接相关，但三大税负以上三项为必写。

### 3）行动建议
给出可执行清单（条目列表），按优先级或时间顺序（如 30天内 / 90天内），写明「谁做什么、准备哪些单证、在哪个系统操作」。

## 写作要求
1. 禁止只写提纲或一句话带过；禁止空泛表述如「建议合规经营」。
2. 尽量引用具体政策/模式表述（如 9810/9610、报关单与销售清单、Marketplace Facilitator 等），信息不足时明确写出假设。
3. 全文面向跨境卖家，表述专业、简洁、可落地。`;
}

const platformNames = {
  amazon: '亚马逊', walmart: '沃尔玛', shopify: 'Shopify独立站',
  ebay: 'eBay', aliexpress: '速卖通', temu: 'Temu',
  tiktok: 'TikTok Shop', mercadolibre: '美客多 Mercado Libre',
  alibaba: '阿里国际站 Alibaba.com', other: '其他平台',
};

const entityNames = {
  cn: '中国公司',
  cn_individual: '中国个人',
  hk: '香港公司',
  us: '美国公司',
  uk: '英国公司',
  de: '德国公司',
  nl: '荷兰公司',
  mx: '墨西哥公司',
  sg: '新加坡公司',
  ru: '俄罗斯公司',
  br: '巴西公司',
  jp: '日本公司',
  vn: '越南公司',
  in: '印度公司',
  sa: '沙特阿拉伯公司',
  other_overseas: '其他海外公司',
};

const countryNames = {
  us: '美国', uk: '英国', de: '德国', fr: '法国',
  jp: '日本', ca: '加拿大', au: '澳大利亚',
  it: '意大利', es: '西班牙', kr: '韩国', mx: '墨西哥', ru: '俄罗斯',
  sea: '东南亚', me: '中东', other: '其他',
};

const revenueNames = {
  under500: '500万人民币以下',
  '500-2000': '500-2000万人民币',
  '2000-5000': '2000-5000万人民币',
  '5000-10000': '5000-10000万人民币',
  above10000: '10000万人民币以上',
};

const invoiceNames = {
  special: '增值税专票',
  general: '增值税普票',
  none: '无法提供发票',
  mixed: '部分专票+部分普票',
  special_none: '部分专票+部分无票',
  general_none: '部分普票+部分无票',
};

const teamSizeNames = {
  under10: '10人以下', '10-50': '10-50人', '50-200': '50-200人', above200: '200人以上',
};

const shippingModes = {
  self_overseas: '自发货（海外仓）',
  self_domestic: '自发货（国内直发）',
  platform_domestic: '平台国内仓',
  platform_overseas: '平台海外仓（如FBA）',
};

/** User-specified income-tax tiers; other jurisdictions use 各地区税制介绍 */
const taxEntityRateOptions = {
  cn: [5, 15, 25],
  cn_individual: [5, 10, 20, 30, 35],
  hk: [8.25, 16.5],
  us: [21],
  uk: [19, 25],
};

/** Entity keys that already have a dedicated shop-entity option */
const taxDedicatedEntityCountries = new Set([
  'us', 'uk', 'de', 'nl', 'mx', 'sg', 'ru', 'br', 'jp', 'vn', 'in', 'sa', 'hk',
]);

function getFormContext() {
  const platform = document.getElementById('platform').value;
  const entity = document.getElementById('entity').value;
  const country = document.getElementById('country').value;
  const shipping = document.getElementById('shipping')?.value;

  return {
    platform,
    entity,
    country,
    shipping,
    hsCode: document.getElementById('hsCode').value.trim(),
    revenue: document.getElementById('revenue').value,
    teamSize: document.getElementById('teamSize').value,
    invoice: document.getElementById('invoice').value,
    notes: document.getElementById('notes').value.trim(),
    platformLabel: platformNames[platform] || platform,
    entityLabel: entityNames[entity] || entity,
    countryLabel: countryNames[country] || country,
    shippingLabel: shippingModes[shipping] || shipping,
    revenueLabel: revenueNames[document.getElementById('revenue').value] || '未填写',
    teamSizeLabel: teamSizeNames[document.getElementById('teamSize').value] || '未填写',
    invoiceLabel: invoiceNames[document.getElementById('invoice').value] || '未填写',
  };
}

function extractRatePercent(text) {
  const match = text.match(/([\d.]+)\s*%/);
  return match ? `${match[1]}%` : '';
}

function formatWan(value) {
  return `${(Number(value) || 0).toFixed(2)} 万元`;
}

function resolveTaxSystemRates(countryId) {
  if (!countryId) return [];
  if (taxEntityRateOptions[countryId]) return taxEntityRateOptions[countryId].slice();
  if (typeof window.getTaxSystemIncomeRates === 'function') {
    return window.getTaxSystemIncomeRates(countryId);
  }
  const aliases = { uk: 'gb' };
  const system = window.getTaxSystemById?.(aliases[countryId] || countryId);
  return system?.incomeTaxRates ? system.incomeTaxRates.slice() : [];
}

function buildTaxRateOptions(entity, entityCountry) {
  if (!entity) return [];
  if (entity === 'other_overseas') {
    return resolveTaxSystemRates(entityCountry);
  }
  if (taxEntityRateOptions[entity]) {
    return taxEntityRateOptions[entity].slice();
  }
  return resolveTaxSystemRates(entity);
}

function syncTaxEntityCountryOptions() {
  const countrySelect = document.getElementById('taxEntityCountry');
  if (!countrySelect) return;

  const locale = window.DAOITH_getLocale?.() || 'zh';
  const systems = window.DAOITH_TAX_SYSTEMS || [];
  const current = countrySelect.value;
  const placeholder = locale === 'en' ? 'Select…' : '请选择';

  const options = systems
    .filter((c) => {
      const entityKey = c.id === 'gb' ? 'uk' : c.id;
      return !taxDedicatedEntityCountries.has(entityKey);
    })
    .map((c) => {
      const value = c.id === 'gb' ? 'uk' : c.id;
      const label = locale === 'en' ? (c.nameEn || c.name) : c.name;
      return { value, label };
    });

  countrySelect.innerHTML = [
    `<option value="">${placeholder}</option>`,
    ...options.map((o) => `<option value="${o.value}">${o.label}</option>`),
  ].join('');

  if (options.some((o) => o.value === current)) {
    countrySelect.value = current;
  }
}

function syncTaxEntityCountryVisibility() {
  const entitySelect = document.getElementById('taxEntity');
  const countryGroup = document.getElementById('taxEntityCountryGroup');
  if (!entitySelect || !countryGroup) return;
  const show = entitySelect.value === 'other_overseas';
  countryGroup.classList.toggle('is-hidden', !show);
  if (show) syncTaxEntityCountryOptions();
}

function syncTaxIncomeOptions() {
  const entitySelect = document.getElementById('taxEntity');
  const countrySelect = document.getElementById('taxEntityCountry');
  const incomeSelect = document.getElementById('taxIncome');
  if (!entitySelect || !incomeSelect) return;

  syncTaxEntityCountryVisibility();

  const entity = entitySelect.value || '';
  const entityCountry = countrySelect?.value || '';
  const current = incomeSelect.value;
  const options = buildTaxRateOptions(entity, entityCountry);
  const locale = window.DAOITH_getLocale?.() || 'zh';

  if (!entity) {
    incomeSelect.innerHTML = `<option value="">${locale === 'en' ? 'Select entity first' : '请先选择店铺主体'}</option>`;
    return;
  }

  if (!options.length) {
    const msg = entity === 'other_overseas'
      ? (locale === 'en' ? 'Select country/region first' : '请先选择店铺主体国家/地区')
      : (locale === 'en' ? 'No rate found in regional tax guide' : '未在各地区税制介绍中找到税率');
    incomeSelect.innerHTML = `<option value="">${msg}</option>`;
    return;
  }

  incomeSelect.innerHTML = options
    .map((rate) => `<option value="${rate}">${rate}%</option>`)
    .join('');

  if (options.map(String).includes(current)) {
    incomeSelect.value = current;
  }
}

function ensureWeChatLogin(action) {
  const auth = window.DAOITH_AUTH;
  if (!auth || typeof auth.requireLogin !== 'function') {
    alert('登录组件尚未加载，请刷新页面后重试');
    return false;
  }
  if (auth.isLoggedIn?.()) return true;
  return auth.requireLogin(action, '/#ai-solution');
}

function initAIForm() {
  const form = document.getElementById('aiForm');
  const queryBtn = document.getElementById('queryTax');
  const dutyBtn = document.getElementById('queryDuty');
  if (!form) return;
  const submitBtn = form.querySelector('button[type="submit"]');

  queryBtn.addEventListener('click', async () => {
    const hsCode = document.getElementById('hsCode').value.trim();
    if (!hsCode) {
      alert(window.DAOITH_t('alert.hsCode'));
      return;
    }

    const rateBox = document.getElementById('refundRateBox');
    if (rateBox) rateBox.value = '';

    setButtonLoading(queryBtn, true, window.DAOITH_t('ai.querying'));
    try {
      const text = await callDifyHsRate(hsCode);
      const rate = extractRatePercent(text);
      if (rateBox) rateBox.value = rate || '—';

      const rateMatch = text.match(/([\d.]+)\s*%/);
      if (rateMatch) {
        const refundInput = document.getElementById('taxRefund');
        if (refundInput) refundInput.value = rateMatch[1];
      }
    } catch (err) {
      if (rateBox) rateBox.value = '';
      alert(err.message);
    } finally {
      setButtonLoading(queryBtn, false);
    }
  });

  dutyBtn.addEventListener('click', async () => {
    const hsCode = document.getElementById('hsCode').value.trim();
    const country = document.getElementById('country').value;
    if (!hsCode) {
      alert(window.DAOITH_t('alert.hsCode'));
      return;
    }
    if (!country) {
      alert(window.DAOITH_t('alert.countryForDuty'));
      return;
    }

    const rateBox = document.getElementById('dutyRateBox');
    if (rateBox) rateBox.value = '';

    const countryLabel = countryNames[country] || country;
    setButtonLoading(dutyBtn, true, window.DAOITH_t('ai.querying'));
    try {
      const text = await callDifyDutyRate(hsCode, countryLabel);
      const rate = extractRatePercent(text);
      if (rateBox) rateBox.value = rate || '—';
    } catch (err) {
      if (rateBox) rateBox.value = '';
      alert(err.message);
    } finally {
      setButtonLoading(dutyBtn, false);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!ensureWeChatLogin('ai-generate')) return;

    const ctx = getFormContext();
    if (!ctx.platform || !ctx.entity || !ctx.country) {
      alert(window.DAOITH_t('alert.platformCountry'));
      return;
    }

    const placeholder = document.getElementById('resultPlaceholder');
    const content = document.getElementById('resultContent');
    const items = document.getElementById('resultItems');

    placeholder.style.display = 'none';
    content.classList.add('active');
    items.innerHTML = `<div class="result-loading">${window.DAOITH_t('ai.loading')}</div>`;

    setButtonLoading(submitBtn, true, window.DAOITH_t('ai.generating'));

    try {
      const text = await callDifyDiagnosis(ctx);
      items.innerHTML = `<div class="result-body">${renderAIPlanHtml(text)}</div>`;
    } catch (err) {
      items.innerHTML = `<div class="result-error"><strong>生成失败：</strong>${err.message}</div>`;
    } finally {
      setButtonLoading(submitBtn, false);
      content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

/* Tax Calculator */
function initTaxCalculator() {
  const calcBtn = document.getElementById('calcTax');
  const entitySelect = document.getElementById('taxEntity');
  const aiEntitySelect = document.getElementById('entity');
  const resultEl = document.getElementById('taxResult');
  if (!calcBtn || !entitySelect || !resultEl) return;

  const countrySelect = document.getElementById('taxEntityCountry');

  entitySelect.value = aiEntitySelect?.value || entitySelect.value || 'cn';
  syncTaxIncomeOptions();
  entitySelect.addEventListener('change', syncTaxIncomeOptions);
  countrySelect?.addEventListener('change', syncTaxIncomeOptions);
  aiEntitySelect?.addEventListener('change', () => {
    entitySelect.value = aiEntitySelect.value || 'cn';
    syncTaxIncomeOptions();
  });

  calcBtn.addEventListener('click', async () => {
    if (!ensureWeChatLogin('tax-calc')) return;

    const revenue = parseFloat(document.getElementById('taxRevenue').value) || 0;
    const refundRate = parseFloat(document.getElementById('taxRefund').value) || 0;
    const productCostRate = parseFloat(document.getElementById('taxProductCostRate').value) || 0;
    const marketingRate = parseFloat(document.getElementById('taxMarketingRate').value) || 0;
    const shippingRate = parseFloat(document.getElementById('taxShippingRate').value) || 0;
    const staffRate = parseFloat(document.getElementById('taxStaffRate').value) || 0;
    const otherRate = parseFloat(document.getElementById('taxOtherRate').value) || 0;
    const cifPrice = parseFloat(document.getElementById('taxCifPrice').value) || 0;
    const dutyRate = parseFloat(document.getElementById('taxDutyRate').value) || 0;
    const vatRate = parseFloat(document.getElementById('taxVat').value) || 0;
    const incomeRate = parseFloat(document.getElementById('taxIncome').value) || 0;

    resultEl.textContent = window.DAOITH_t('tax.calcLoading');
    setButtonLoading(calcBtn, true, window.DAOITH_t('tax.calcLoading'));

    try {
      let note = document.getElementById('taxResultNote');
      if (!note) {
        note = document.createElement('div');
        note.id = 'taxResultNote';
        note.className = 'tax-result-note';
        resultEl.parentElement.appendChild(note);
      }
      const exportRebate = revenue * (productCostRate / 100) * (refundRate / 100);
      const dutyCost = cifPrice * (dutyRate / 100);
      const destinationVat = revenue * (vatRate / 100);
      const profitRate = 1
        - (productCostRate / 100)
        - (marketingRate / 100)
        - (shippingRate / 100)
        - (staffRate / 100)
        - (otherRate / 100);
      const incomeTax = revenue * profitRate * (incomeRate / 100);
      const total = dutyCost + destinationVat + incomeTax;
      const locale = window.DAOITH_getLocale?.() || 'zh';
      const copy = locale === 'en'
        ? {
            circulation: 'I. Turnover-tax related costs',
            duty: '1) Destination duty cost',
            vat: '2) Destination VAT',
            income: 'II. Corporate income tax burden',
            rebateNote: 'Export rebate (reference only, not counted as tax cost)',
            total: 'Total',
            disclaimer: 'Note: this calculation is based on simplified assumptions and should not be used directly for business decisions. For a precise tax-burden analysis, please consult a tax expert.',
          }
        : {
            circulation: '（一）流转税成本',
            duty: '1）目的国关税成本',
            vat: '2）目的国VAT',
            income: '（二）企业所得税税负',
            rebateNote: '出口退税（参考，不计入税负成本）',
            total: '合计',
            disclaimer: '注意说明：以上计算基于一定的假设，不能直接作为企业决策依据，如需精准的税负分析，可咨询财税专家。',
          };

      resultEl.textContent = formatWan(total);
      note.innerHTML = `
        <div class="tax-breakdown">
          <div class="tax-breakdown-section">
            <strong>${copy.circulation}</strong>
            <div>${copy.duty}：${formatWan(dutyCost)}（目的国进口CIF价 × 关税税率）</div>
            <div>${copy.vat}：${formatWan(destinationVat)}（销售额 × 目的国VAT税率）</div>
          </div>
          <div class="tax-breakdown-section">
            <strong>${copy.income}</strong>
            <div>${formatWan(incomeTax)}（销售额 × (1 - 产品成本率 - 营销费率 - 运输费率 - 员工成本率 - 其他费用率) × 适用税率）</div>
          </div>
          <div class="tax-breakdown-section tax-breakdown-ref">
            <div>${copy.rebateNote}：${formatWan(exportRebate)}（销售额 × 产品成本率 × 出口退税率）</div>
          </div>
          <div class="tax-breakdown-summary">
            <strong>${copy.total}：${formatWan(total)}</strong>
          </div>
          <div class="tax-breakdown-disclaimer">
            ${copy.disclaimer}
          </div>
        </div>
      `;
    } finally {
      setButtonLoading(calcBtn, false);
    }
  });
}

/* Service Filters */
function initServiceFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.service-card');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        if (!card.classList.contains('hidden-service') || card.style.display !== 'none') {
          card.style.display = show ? '' : 'none';
        } else if (show && card.classList.contains('hidden-service')) {
          card.style.display = '';
        } else if (!show) {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* Show More Services */
function initShowMoreServices() {
  const btn = document.getElementById('showMoreServices');
  if (!btn) return;
  let expanded = false;

  btn.addEventListener('click', () => {
    expanded = !expanded;
    document.querySelectorAll('.hidden-service').forEach((card) => {
      const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
      const match = activeFilter === 'all' || card.dataset.category === activeFilter;
      card.style.display = expanded && match ? '' : expanded ? 'none' : 'none';
    });

    if (!expanded) {
      document.querySelectorAll('.service-card:not(.hidden-service)').forEach((card) => {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        const match = activeFilter === 'all' || card.dataset.category === activeFilter;
        card.style.display = match ? '' : 'none';
      });
    }

    btn.textContent = expanded ? window.DAOITH_t('services.collapse') : window.DAOITH_t('services.showAll');
    btn.dataset.expanded = expanded ? 'true' : 'false';
  });
}

/* Hub Tabs */
function initHubTabs() {
  const tabs = document.querySelectorAll('.hub-tab');
  const tabPanes = {
    orders: document.getElementById('ordersTab'),
    quotes: document.getElementById('quotesTab'),
    feedback: document.getElementById('feedbackTab'),
  };

  function showTab(name) {
    Object.entries(tabPanes).forEach(([k, el]) => {
      if (el) el.style.display = k === name ? '' : 'none';
    });
    if (name === 'quotes') renderQuotesList();
  if (name === 'orders') renderHubProgress();
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      showTab(tab.dataset.tab);
    });
  });

  renderHubProgress();
}

function getQuotes() {
  try {
    const raw = localStorage.getItem('daoith_quotes');
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatWanHub(v) {
  return `¥${(Number(v) || 0).toFixed(2)} 万元`;
}

function renderQuotesList() {
  const wrap = document.getElementById('quotesListWrap');
  if (!wrap) return;
  const quotes = getQuotes();
  if (!quotes.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="icon">📬</div><h4>暂无询价记录</h4><p>在购物车提交询价后，记录将显示在这里</p></div>`;
    return;
  }
  wrap.innerHTML = quotes.map((q, i) => {
    const services = (q.items || []).map((it) => `${it.title} × ${it.qty}`).join('、');
    return `
      <div class="quote-record">
        <div class="quote-record-head">
          <span class="quote-record-no">询价 #${quotes.length - i}</span>
          <span class="quote-record-date">${formatDate(q.createdAt)}</span>
          <span class="quote-record-status">待跟进</span>
        </div>
        <div class="quote-record-body">
          <div><strong>公司：</strong>${q.company || '—'} &nbsp; <strong>联系人：</strong>${q.contact || '—'} &nbsp; <strong>电话：</strong>${q.phone || '—'}</div>
          <div class="quote-record-services">${services || '—'}</div>
          <div class="quote-record-total">预计总价：${formatWanHub(q.total)}</div>
        </div>
      </div>`;
  }).join('');
}

function renderHubProgress() {
  const wrap = document.getElementById('hubProgressWrap') || document.getElementById('quoteProgressWrap');
  if (!wrap) return;
  const quotes = getQuotes();
  if (!quotes.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="icon icon-muted">—</div><h4>暂未提交询价</h4><p>在购物车提交询价后，顾问会跟进并在此更新进度</p><a href="/cart.html" class="btn btn-primary btn-sm" style="margin-top:12px">前往购物车</a></div>`;
    return;
  }
  const latest = quotes[0];
  const services = (latest.items || []).map((it) => it.title).join('、');
  wrap.innerHTML = `
    <div class="quote-progress">
      <div class="quote-progress-step done">
        <div class="step-dot"></div>
        <div class="step-body">
          <strong>询价已提交</strong>
          <span>${formatDate(latest.createdAt)}</span>
        </div>
      </div>
      <div class="quote-progress-step">
        <div class="step-dot"></div>
        <div class="step-body">
          <strong>顾问跟进中</strong>
          <span>顾问将在1-2个工作日内联系您</span>
        </div>
      </div>
      <div class="quote-progress-step">
        <div class="step-dot"></div>
        <div class="step-body">
          <strong>方案确认</strong>
          <span>—</span>
        </div>
      </div>
      <div class="quote-progress-step">
        <div class="step-dot"></div>
        <div class="step-body">
          <strong>服务进行中</strong>
          <span>—</span>
        </div>
      </div>
    </div>
    <div class="quote-progress-meta">
      <span>最新询价：${services}</span>
      &nbsp;·&nbsp;
      <a href="#" class="hub-tab-link" data-tab="quotes">查看全部询价记录 →</a>
    </div>
  `;
  wrap.querySelector('.hub-tab-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = document.querySelector('.hub-tab[data-tab="quotes"]');
    tab?.click();
  });
}

/* WeChat Toggle */
function initWechatToggle() {
  const toggle = document.getElementById('wechatToggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    const on = toggle.classList.contains('active');
    if (on) alert(window.DAOITH_t('alert.wechatOn'));
  });
}

/* Feedback Form */
function initFeedbackForm() {
  document.querySelectorAll('.type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const submitBtn = document.getElementById('submitFeedback');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', () => {
    const text = document.getElementById('feedbackText').value.trim();
    if (!text) {
      alert(window.DAOITH_t('alert.feedbackEmpty'));
      return;
    }
    alert(window.DAOITH_t('alert.feedbackThanks'));
    document.getElementById('feedbackText').value = '';
  });
}

/* Tax Systems Grid */
function initTaxSystemsGrid() {
  const grid = document.getElementById('taxSystemsGrid');
  const systems = window.DAOITH_TAX_SYSTEMS;
  if (!grid || !Array.isArray(systems)) return;

  const locale = window.DAOITH_getLocale?.() || 'zh';
  const tradeUnit = locale === 'en' ? 'USD bn' : '亿美元';
  const tradePrefix = window.DAOITH_t('tax.trade');

  grid.innerHTML = systems.map((c) => {
    const name = locale === 'en' ? (c.nameEn || c.name) : c.name;
    const summary = locale === 'en'
      ? (window.DAOITH_I18N_EN?.taxSummaries?.[c.id] || c.summary)
      : c.summary;
    const mainTax = c.taxes?.[0];
    const mainTaxLabel = mainTax
      ? `${locale === 'en' ? (mainTax.labelEn || mainTax.label) : mainTax.label} ${mainTax.value.split('（')[0].split('(')[0]}`
      : '';
    return `
      <article class="tax-system-card">
        <div class="tax-system-card-head">
          <span class="tax-system-rank">#${c.rank}</span>
          <span class="tax-system-flag" aria-hidden="true">${c.flag}</span>
        </div>
        <h4><a href="/tax-system.html?id=${encodeURIComponent(c.id)}" class="tax-system-title-link">${name}</a></h4>
        <p class="tax-system-trade">${tradePrefix} ${c.trade2025} ${tradeUnit}</p>
        <p class="tax-system-summary">${summary}</p>
        ${mainTaxLabel ? `<p class="tax-system-highlight">${mainTaxLabel}</p>` : ''}
        <a href="/tax-system.html?id=${encodeURIComponent(c.id)}" class="article-link">${window.DAOITH_t('tax.viewDetail')}</a>
      </article>
    `;
  }).join('');

  setupPagination({
    itemsSelector: '#tax-systems .tax-system-card',
    buttonId: 'loadMoreTaxSystems',
    labelKey: 'loadMore.taxSystems',
    pageSize: TAX_SYSTEMS_PAGE_SIZE,
  });
}

/* Policy Filters - removed; policy section uses three static blocks */
