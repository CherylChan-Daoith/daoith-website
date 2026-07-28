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
    export_mode: ctx.exportModeLabel,
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

function isAskAgainOrGenericFramework(text) {
  const t = String(text || '');
  return (
    /请您提供|请提供以下信息|请提供具体信息|在您提供信息前|我将为您定制方案/.test(t) ||
    /跨境财税合规通用框架|通用且高发的场景|可套用的方案模板|由于您尚未提供/.test(t)
  );
}

function aiSolutionUsesFormData(text, ctx) {
  const t = String(text || '');
  if (!t || isAskAgainOrGenericFramework(t)) return false;
  const needles = [
    ctx.platformLabel,
    ctx.countryLabel,
    ctx.entityLabel,
    ctx.hsCode,
    ctx.shippingLabel,
  ].filter(Boolean);
  const hits = needles.filter((n) => n && t.includes(n)).length;
  return hits >= 2 && /增值税|所得税|关税|流程图|行动建议/.test(t);
}

function buildBusinessFactsListHtml(ctx) {
  const rows = [
    ['电商平台', ctx.platformLabel],
    ['店铺主体', ctx.entityLabel],
    ['目的国/地区', ctx.countryLabel],
    ['产品HS编码', ctx.hsCode],
    ['年销售额', ctx.revenueLabel],
    ['团队人数', ctx.teamSizeLabel],
    ['供应商发票', ctx.invoiceLabel],
    ['发货模式', ctx.shippingLabel],
    ['目前出口方式', ctx.exportModeLabel],
  ];
  if (ctx.notes) rows.push(['补充说明', ctx.notes]);

  const items = rows
    .map(
      ([k, v]) =>
        `<li><span class="fact-key">${escapeHtml(k)}</span><span class="fact-val">${escapeHtml(v || '—')}</span></li>`
    )
    .join('');
  return `<ul class="result-facts">${items}</ul>`;
}

function buildLocalSolutionMarkdown(ctx) {
  const isCnEntity = ctx.entity === 'cn' || ctx.entity === 'cn_individual';
  const usesOverseasWarehouse =
    ctx.shipping === 'platform_overseas' || ctx.shipping === 'self_overseas';
  const invoiceRisk =
    ctx.invoice === 'none' ||
    ctx.invoice === 'special_none' ||
    ctx.invoice === 'general_none' ||
    ctx.invoice === 'general';

  const flow = [
    `采购备货（供应商 → ${ctx.entityLabel}）：核对合同、装箱单、发票（当前发票情况：${ctx.invoiceLabel}）`,
    usesOverseasWarehouse
      ? `出库报关/跨境调拨：按出口方式「${ctx.exportModeLabel}」、HS「${ctx.hsCode}」归类申报，货值与物流单一致后发往「${ctx.countryLabel}」海外仓/平台仓`
      : `国内直发履约：按出口方式「${ctx.exportModeLabel}」办理通关/放行，跨境小包/专线发往「${ctx.countryLabel}」买家`,
    `平台销售回款：在「${ctx.platformLabel}」完成销售、结算与平台费用核算（年销售额区间：${ctx.revenueLabel}）`,
    `税务申报闭环：国内增值税/企业所得税（如适用）+ 目的国进口/流转税相关义务按期处理`,
  ];

  const vatLines = isCnEntity
    ? [
        `国内增值税：主体为「${ctx.entityLabel}」，出口方式「${ctx.exportModeLabel}」决定免税/退税路径与单证要求；发货模式「${ctx.shippingLabel}」影响报关与进项匹配。`,
        invoiceRisk
          ? `发票风险偏高（${ctx.invoiceLabel}）：无票或普票占比会影响进项抵扣与出口退税资料链，建议优先梳理可取得专票的供应商。`
          : `发票情况「${ctx.invoiceLabel}」相对有利于进项与退税资料齐套，仍需保证票货款一致、HS 与报关一致。`,
      ]
    : [
        `国内增值税：店铺主体为「${ctx.entityLabel}」，中国侧增值税链条可能较弱或仅涉及关联采购；出口方式「${ctx.exportModeLabel}」需与境内采购/报关主体安排对齐。`,
        `关注关联采购定价与发票流是否能支撑目的国进口申报完税价格。`,
      ];

  const citLines = [
    `企业所得税：利润主要归属「${ctx.entityLabel}」所在地税制；团队规模「${ctx.teamSizeLabel}」影响费用归集与核定/查账资料完备度。`,
    usesOverseasWarehouse
      ? `使用「${ctx.shippingLabel}」时，需评估「${ctx.countryLabel}」是否存在常设机构/仓储相关所得税争议，关联仓储服务费宜保留合同与定价依据。`
      : `「${ctx.shippingLabel}」通常常设机构风险低于海外仓模式，但仍需关注目的国远程销售阈值与平台代扣规则。`,
  ];

  const dutyLines = [
    `目的国关税：目的国「${ctx.countryLabel}」、HS「${ctx.hsCode}」决定归类与税率；申报完税价格应与采购/平台成交逻辑一致，避免低报。`,
    `建议先用页面「查询目的国关税税率」核对 ${ctx.hsCode}，再固定商编与品名描述，减少查验与补税风险。`,
  ];

  const actions = [
    `30天内：固化业务档案——平台「${ctx.platformLabel}」、主体「${ctx.entityLabel}」、目的国「${ctx.countryLabel}」、HS「${ctx.hsCode}」、发货模式「${ctx.shippingLabel}」、出口方式「${ctx.exportModeLabel}」一页纸台账`,
    `30天内：按「${ctx.invoiceLabel}」盘点供应商开票缺口，能改专票的优先改；无票采购单独标注风险 SKU`,
    `30天内：在「${ctx.platformLabel}」后台核对税务信息/税号上传与结算报表导出路径`,
    `90天内：完成「${ctx.countryLabel}」进口/流转税义务评估（仓储、阈值、平台代扣代缴边界）并列出注册/申报日历`,
    `90天内：建立月度「销售-物流-发票-申报」对账表，团队「${ctx.teamSizeLabel}」明确财务/运营责任人`,
  ];

  return [
    '### 1）业务流程图',
    ...flow.map((s, i) => `${i + 1}. ${s}`),
    '',
    '### 2）合规税负影响分析',
    '',
    '**国内增值税**',
    ...vatLines.map((s) => `- ${s}`),
    '',
    '**国内企业所得税**',
    ...citLines.map((s) => `- ${s}`),
    '',
    '**目的国关税**',
    ...dutyLines.map((s) => `- ${s}`),
    '',
    '### 3）行动建议',
    ...actions.map((s) => `- ${s}`),
  ].join('\n');
}

function renderAIPlanHtml(text) {
  const lines = String(text || '').split('\n');
  let html = '';
  let inList = false;
  let listTag = 'ul';
  let listClass = 'result-list';

  const closeList = () => {
    if (inList) {
      html += `</${listTag}>`;
      inList = false;
    }
  };

  const openList = (ordered) => {
    listTag = ordered ? 'ol' : 'ul';
    listClass = ordered ? 'result-list result-list-ordered' : 'result-list';
    html += `<${listTag} class="${listClass}">`;
    inList = true;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }

    if (/道一（Daoith）/.test(line) && /合规专家/.test(line)) continue;
    if (/道一合规小助手/.test(line)) continue;
    if (/请您提供|请提供以下信息|请提供具体信息/.test(line)) continue;
    if (/通用框架|在您提供信息前|由于您尚未提供/.test(line)) continue;

    if (/^#{1,4}\s+/.test(line)) {
      closeList();
      const level = (line.match(/^#+/) || ['##'])[0].length;
      const title = line.replace(/^#{1,4}\s+/, '').replace(/\*\*/g, '');
      const cls =
        level >= 3 ? 'result-section-subtitle' : 'result-section-title';
      html += `<h5 class="${cls}">${escapeHtml(title)}</h5>`;
      continue;
    }

    const orderedMatch = line.match(/^\d+[.)、]\s+(.*)$/);
    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
    if (orderedMatch || bulletMatch) {
      const ordered = Boolean(orderedMatch);
      const content = ordered ? orderedMatch[1] : bulletMatch[1];
      if (!inList || (ordered && listTag !== 'ol') || (!ordered && listTag !== 'ul')) {
        closeList();
        openList(ordered);
      }
      html += `<li>${formatInline(content)}</li>`;
      continue;
    }

    closeList();
    html += `<p class="result-paragraph">${formatInline(line)}</p>`;
  }

  closeList();
  return html;
}

/** Greeting + form facts are fixed; solution body prefers AI only when it uses form data. */
function assembleSolutionHtml(ctx, aiText) {
  const useAi = aiSolutionUsesFormData(aiText, ctx);
  const bodyMd = useAi ? String(aiText) : buildLocalSolutionMarkdown(ctx);
  const body = renderAIPlanHtml(bodyMd);

  return (
    `<p class="result-paragraph result-greeting">${escapeHtml(SOLUTION_GREETING)}</p>` +
    `<h5 class="result-section-title">一、业务背景信息总结</h5>` +
    `<p class="result-paragraph">以下信息来自您在左侧表单的选择，方案据此生成：</p>` +
    buildBusinessFactsListHtml(ctx) +
    `<h5 class="result-section-title">二、解决方案</h5>` +
    (body || `<p class="result-paragraph">方案生成失败，请重试。</p>`)
  );
}

/** Speak in the chat app’s expected “user already filled the fields” format. */
function buildSolutionPrompt(ctx) {
  return `电商平台：${ctx.platformLabel}
目的国/地区：${ctx.countryLabel}
预计年/月销售额：年销售额 ${ctx.revenueLabel}（人民币）
主要产品HS编码：${ctx.hsCode}
企业主体所在地：${ctx.entityLabel}
仓储模式：${ctx.shippingLabel}
目前出口方式：${ctx.exportModeLabel}
供应商发票情况：${ctx.invoiceLabel}
团队人数：${ctx.teamSizeLabel}
补充说明：${ctx.notes || '无'}

以上信息已完整提供。请不要再询问任何信息，也不要输出通用框架。请立即基于上述信息输出定制方案，且正文必须点名上述平台、主体、目的国、HS与仓储模式。输出结构：
### 1）业务流程图
### 2）合规税负影响分析（国内增值税、国内企业所得税、目的国关税）
### 3）行动建议`;
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

const exportModeNames = {
  trade_0110: '0110一般贸易',
  market_1039: '1039市场采购出口',
  cbec_9610: '9610跨境电商零售出口',
  cbec_9710: '9710跨境电商B2B出口',
  cbec_9810: '9810出口海外仓',
  bonded_1210: '1210报税出口',
  freight_forwarder: '委托货代出口',
  other: '其他',
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
  const exportMode = document.getElementById('exportMode')?.value;

  return {
    platform,
    entity,
    country,
    shipping,
    exportMode,
    hsCode: document.getElementById('hsCode').value.trim(),
    revenue: document.getElementById('revenue').value,
    teamSize: document.getElementById('teamSize').value,
    invoice: document.getElementById('invoice').value,
    notes: document.getElementById('notes').value.trim(),
    platformLabel: platformNames[platform] || platform,
    entityLabel: entityNames[entity] || entity,
    countryLabel: countryNames[country] || country,
    shippingLabel: shippingModes[shipping] || shipping,
    exportModeLabel: exportModeNames[exportMode] || exportMode || '未填写',
    revenueLabel: revenueNames[document.getElementById('revenue').value] || '未填写',
    teamSizeLabel: teamSizeNames[document.getElementById('teamSize').value] || '未填写',
    invoiceLabel: invoiceNames[document.getElementById('invoice').value] || '未填写',
  };
}

function extractRatePercent(text) {
  const preferred = String(text || '').match(
    /(?:出口退税率|目的国关税税率|关税税率|退税率)\s*[:：]?\s*([\d.]+)\s*%/
  );
  if (preferred) return `${preferred[1]}%`;
  const match = String(text || '').match(/([\d.]+)\s*%/);
  return match ? `${match[1]}%` : '';
}

function setHsRateSource(kind, result) {
  const el = document.getElementById('hsRateSource');
  if (!el) return;
  if (!result) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  const title = kind === 'refund' ? '出口退税率' : '目的国关税';
  const link = result.sourceUrl
    ? ` <a href="${escapeHtml(result.sourceUrl)}" target="_blank" rel="noopener noreferrer">官方查询</a>`
    : '';
  el.hidden = false;
  el.innerHTML =
    `<strong>${escapeHtml(title)}</strong>：${escapeHtml(result.display)}` +
    `｜${escapeHtml(result.message || '')}` +
    `｜来源：${escapeHtml(result.source || '')}` +
    link;
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

const AI_REQUIRED_FIELDS = [
  { id: 'platform', empty: (el) => !el.value },
  { id: 'entity', empty: (el) => !el.value },
  { id: 'country', empty: (el) => !el.value },
  { id: 'hsCode', empty: (el) => !el.value.trim() },
  { id: 'revenue', empty: (el) => !el.value },
  { id: 'teamSize', empty: (el) => !el.value },
  { id: 'invoice', empty: (el) => !el.value },
  { id: 'shipping', empty: (el) => !el.value },
  { id: 'exportMode', empty: (el) => !el.value },
];

function clearAiFieldInvalid(el) {
  const group = el?.closest?.('.form-group');
  if (!group) return;
  group.classList.remove('is-invalid');
  group.querySelector('.field-error')?.remove();
}

function markAiFieldInvalid(el, message) {
  const group = el?.closest?.('.form-group');
  if (!group) return;
  group.classList.add('is-invalid');
  if (!group.querySelector('.field-error')) {
    const tip = document.createElement('p');
    tip.className = 'field-error';
    tip.textContent = message || window.DAOITH_t('alert.fieldRequired');
    group.appendChild(tip);
  }
}

function validateAiFormRequired() {
  let firstInvalid = null;
  for (const field of AI_REQUIRED_FIELDS) {
    const el = document.getElementById(field.id);
    if (!el) continue;
    clearAiFieldInvalid(el);
    if (field.empty(el)) {
      markAiFieldInvalid(el);
      if (!firstInvalid) firstInvalid = el;
    }
  }
  if (firstInvalid) {
    firstInvalid.focus();
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
  return true;
}

function initAIForm() {
  const form = document.getElementById('aiForm');
  const queryBtn = document.getElementById('queryTax');
  const dutyBtn = document.getElementById('queryDuty');
  if (!form) return;
  const submitBtn = form.querySelector('button[type="submit"]');

  for (const field of AI_REQUIRED_FIELDS) {
    const el = document.getElementById(field.id);
    if (!el) continue;
    const clear = () => {
      if (!field.empty(el)) clearAiFieldInvalid(el);
    };
    el.addEventListener('change', clear);
    el.addEventListener('input', clear);
  }

  queryBtn.addEventListener('click', async () => {
    const hsCode = document.getElementById('hsCode').value.trim();
    if (!hsCode) {
      alert(window.DAOITH_t('alert.hsCode'));
      return;
    }

    const rateBox = document.getElementById('refundRateBox');
    if (rateBox) rateBox.value = '';
    setHsRateSource('refund', null);

    setButtonLoading(queryBtn, true, window.DAOITH_t('ai.querying'));
    try {
      const api = window.DAOITH_HS_RATES;
      if (!api?.lookupRefundRate) {
        throw new Error('税率查询组件未加载，请刷新页面后重试');
      }
      const result = api.lookupRefundRate(hsCode);
      if (rateBox) rateBox.value = result.display || '—';
      setHsRateSource('refund', result);

      if (result.ok && result.rate != null) {
        const refundInput = document.getElementById('taxRefund');
        if (refundInput) refundInput.value = String(result.rate);
      }

      if (!result.ok) {
        alert(result.message || '未查到参考退税率，请核对 HS 编码后重试');
      }
    } catch (err) {
      if (rateBox) rateBox.value = '';
      setHsRateSource('refund', null);
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
    setHsRateSource('duty', null);

    setButtonLoading(dutyBtn, true, window.DAOITH_t('ai.querying'));
    try {
      const api = window.DAOITH_HS_RATES;
      if (!api?.lookupDutyRate) {
        throw new Error('税率查询组件未加载，请刷新页面后重试');
      }
      const result = api.lookupDutyRate(hsCode, country);
      if (rateBox) rateBox.value = result.display || '—';
      setHsRateSource('duty', result);

      if (result.ok && result.rate != null) {
        const dutyInput = document.getElementById('taxDutyRate');
        if (dutyInput) dutyInput.value = String(result.rate);
      }

      if (!result.ok) {
        alert(result.message || '未查到参考关税税率，请核对 HS 与目的国后重试');
      }
    } catch (err) {
      if (rateBox) rateBox.value = '';
      setHsRateSource('duty', null);
      alert(err.message);
    } finally {
      setButtonLoading(dutyBtn, false);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateAiFormRequired()) return;
    if (!ensureWeChatLogin('ai-generate')) return;

    const ctx = getFormContext();

    const placeholder = document.getElementById('resultPlaceholder');
    const content = document.getElementById('resultContent');
    const items = document.getElementById('resultItems');

    placeholder.style.display = 'none';
    content.classList.add('active');
    items.innerHTML = `<div class="result-loading">${window.DAOITH_t('ai.loading')}</div>`;

    setButtonLoading(submitBtn, true, window.DAOITH_t('ai.generating'));

    try {
      let text = '';
      try {
        text = await callDifyDiagnosis(ctx);
      } catch {
        text = '';
      }
      items.innerHTML = `<div class="result-body">${assembleSolutionHtml(ctx, text)}</div>`;
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
