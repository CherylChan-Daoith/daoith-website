/* DAOITH Consulting - Main JavaScript */

const PAGE_SIZE = 10;

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initNavigation();
  initMobileMenu();
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
  initPolicyFilters();
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
  const navLinks = document.querySelectorAll('.nav a');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

/* Mobile menu */
function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('nav');

  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => nav.classList.remove('open'));
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
function initLoadMore() {
  setupPagination({
    itemsSelector: '#expert .article-card',
    buttonId: 'loadMoreArticles',
    label: '篇文章',
  });
}

function setupPagination({ itemsSelector, buttonId, label, onUpdate }) {
  const items = Array.from(document.querySelectorAll(itemsSelector));
  const button = document.getElementById(buttonId);
  if (!items.length || !button) return;

  let visibleCount = PAGE_SIZE;

  function updateButton() {
    const shown = items.filter((item) => !item.classList.contains('is-paginated-hidden')).length;
    const matchable = items.filter((item) => item.style.display !== 'none').length;
    button.classList.toggle('is-hidden', shown >= items.length || matchable === 0);
    const remaining = items.length - shown;
    button.textContent = remaining > 0 ? `查看更多（还有 ${Math.min(remaining, PAGE_SIZE)} ${label}）` : '查看更多';
  }

  function applyPagination() {
    let shown = 0;
    items.forEach((item, index) => {
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
    if (index >= PAGE_SIZE) item.classList.add('is-paginated-hidden');
  });

  button.addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    items.forEach((item, index) => {
      if (index < visibleCount) item.classList.remove('is-paginated-hidden');
    });
    updateButton();
    onUpdate?.();
  });

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
    query: `请查询海关编码 ${hsCode} 的出口退税率，仅返回一行：退税率：X%（简要说明，不超过40字）`,
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

function renderAIPlanHtml(text) {
  const lines = text.split('\n');
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

    if (/^#{1,3}\s+/.test(line)) {
      closeList();
      const title = line.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '');
      html += `<h5 class="result-section-title">${escapeHtml(title)}</h5>`;
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      if (!inList) {
        html += '<ul class="result-list">';
        inList = true;
      }
      const item = formatInline(line.replace(/^[-*•]\s+/, ''));
      html += `<li>${item}</li>`;
      continue;
    }

    closeList();
    html += `<p class="result-paragraph">${formatInline(line)}</p>`;
  }

  closeList();
  return html || `<p class="result-paragraph">${formatInline(text)}</p>`;
}

function buildSolutionPrompt(ctx) {
  return `请为以下跨境电商企业撰写一份【详细、可落地】的财税合规方案。

## 客户信息
- 电商平台：${ctx.platformLabel}
- 目的国/地区：${ctx.countryLabel}
- HS编码：${ctx.hsCode || '未提供'}
- 年销售额：${ctx.revenueLabel}
- 团队人数：${ctx.teamSizeLabel}
- 供应商发票：${ctx.invoiceLabel}
- 发货模式：${ctx.shippingLabel}
- 补充说明：${ctx.notes || '无'}

## 输出要求
1. 用中文 Markdown 输出，必须包含以下章节（每节标题用 ## 开头）：
   ## 业务概况与合规诊断
   ## 出口模式与退税安排
   ## 目的国税务合规（VAT/销售税/所得税）
   ## 发票、单证与海关风险
   ## 架构优化与ODI建议（如适用）
   ## 分阶段行动计划

2. 每个章节正文至少 3–5 句话（80–150字），必须包含：
   - 具体政策/监管依据（如公告号、9810/9610、Marketplace Facilitator 等）
   - 可操作步骤（谁先做什么、何时申报）
   - 关键单证或系统名称（报关单、销售清单、Seller Central 税务设置等）
   - 常见风险点及规避建议

3. 禁止只写提纲或一句话带过；禁止空泛表述如"建议合规经营"。
4. 「分阶段行动计划」用条目列表，按 30天/90天/180天 给出具体任务。`;
}

const platformNames = {
  amazon: '亚马逊', walmart: '沃尔玛', shopify: 'Shopify独立站',
  ebay: 'eBay', aliexpress: '速卖通', temu: 'Temu',
  tiktok: 'TikTok Shop', other: '其他平台',
};

const countryNames = {
  us: '美国', uk: '英国', de: '德国', fr: '法国',
  jp: '日本', ca: '加拿大', au: '澳大利亚',
  sea: '东南亚', me: '中东', other: '其他',
};

const revenueNames = {
  under500: '500万以下', '500-2000': '500-2000万', '2000-5000': '2000-5000万',
  '5000-10000': '5000-10000万', above10000: '10000万以上',
};

const invoiceNames = {
  special: '增值税专用发票', general: '增值税普通发票',
  mixed: '部分专票+部分普票', none: '无法提供发票',
};

const teamSizeNames = {
  under10: '10人以下', '10-50': '10-50人', '50-200': '50-200人', above200: '200人以上',
};

const shippingModes = {
  fba: '9810 海运备货FBA仓模式',
  overseas: '9810 海运备货海外仓模式',
  direct: '9610 快递小包直邮模式',
};

function getFormContext() {
  const platform = document.getElementById('platform').value;
  const country = document.getElementById('country').value;
  const shipping = document.querySelector('input[name="shipping"]:checked')?.value;

  return {
    platform,
    country,
    shipping,
    hsCode: document.getElementById('hsCode').value.trim(),
    revenue: document.getElementById('revenue').value,
    teamSize: document.getElementById('teamSize').value,
    invoice: document.getElementById('invoice').value,
    notes: document.getElementById('notes').value.trim(),
    platformLabel: platformNames[platform] || platform,
    countryLabel: countryNames[country] || country,
    shippingLabel: shippingModes[shipping] || shipping,
    revenueLabel: revenueNames[document.getElementById('revenue').value] || '未填写',
    teamSizeLabel: teamSizeNames[document.getElementById('teamSize').value] || '未填写',
    invoiceLabel: invoiceNames[document.getElementById('invoice').value] || '未填写',
  };
}

function initAIForm() {
  const form = document.getElementById('aiForm');
  const queryBtn = document.getElementById('queryTax');
  const submitBtn = form.querySelector('button[type="submit"]');

  queryBtn.addEventListener('click', async () => {
    const hsCode = document.getElementById('hsCode').value.trim();
    if (!hsCode) {
      alert('请先输入HS编码');
      return;
    }

    setButtonLoading(queryBtn, true, '查询中…');
    try {
      const text = await callDifyHsRate(hsCode);

      const rateMatch = text.match(/([\d.]+)\s*%/);
      if (rateMatch) {
        document.getElementById('taxRefund').value = rateMatch[1];
      }
      alert(text);
    } catch (err) {
      alert(err.message);
    } finally {
      setButtonLoading(queryBtn, false);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ctx = getFormContext();
    if (!ctx.platform || !ctx.country) {
      alert('请至少选择电商平台和目的国/地区');
      return;
    }

    const placeholder = document.getElementById('resultPlaceholder');
    const content = document.getElementById('resultContent');
    const items = document.getElementById('resultItems');

    placeholder.style.display = 'none';
    content.classList.add('active');
    items.innerHTML = '<div class="result-loading">道一 AI 正在生成专属合规方案…</div>';

    setButtonLoading(submitBtn, true, '生成中…');

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

  calcBtn.addEventListener('click', async () => {
    const revenue = parseFloat(document.getElementById('taxRevenue').value) || 0;
    const refundRate = parseFloat(document.getElementById('taxRefund').value) || 0;
    const vatRate = parseFloat(document.getElementById('taxVat').value) || 0;
    const incomeRate = parseFloat(document.getElementById('taxIncome').value) || 0;
    const inputTax = parseFloat(document.getElementById('taxInput').value) || 0;
    const resultEl = document.getElementById('taxResult');

    resultEl.textContent = '计算中…';
    setButtonLoading(calcBtn, true, '计算中…');

    const params = { revenue, refundRate, vatRate, incomeRate, inputTax };

    try {
      const text = await callDifyTaxCalc(params);

      const totalMatch = text.match(/年度合规税负总额[：:]\s*([¥￥]?[\d,.]+)\s*万元/);
      resultEl.textContent = totalMatch ? `¥${totalMatch[1].replace(/[¥￥]/g, '')} 万元/年` : text.split('\n')[0];

      let note = document.getElementById('taxResultNote');
      if (!note) {
        note = document.createElement('div');
        note.id = 'taxResultNote';
        note.className = 'tax-result-note';
        resultEl.parentElement.appendChild(note);
      }
      note.textContent = text;
      note.style.cssText = 'margin-top:16px;font-size:0.85rem;color:var(--text-muted);text-align:left;line-height:1.7;white-space:pre-wrap;';
    } catch (err) {
      const outputVAT = revenue * 0.13;
      const refundAmount = revenue * (refundRate / 100);
      const netVAT = Math.max(0, outputVAT - inputTax - refundAmount);
      const foreignVAT = revenue * (vatRate / 100) * 0.3;
      const taxableIncome = revenue - inputTax - netVAT;
      const incomeTax = Math.max(0, taxableIncome * (incomeRate / 100));
      const total = netVAT + foreignVAT + incomeTax;

      resultEl.textContent = `¥${total.toFixed(2)} 万元/年`;
      alert(`道一 AI 暂不可用，已使用本地公式估算：${err.message}`);
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

    btn.textContent = expanded ? '收起服务列表 ↑' : '查看全部 12 个服务 ↓';
  });
}

/* Hub Tabs */
function initHubTabs() {
  const tabs = document.querySelectorAll('.hub-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      document.getElementById('ordersTab').style.display = tab.dataset.tab === 'orders' ? '' : 'none';
      document.getElementById('feedbackTab').style.display = tab.dataset.tab === 'feedback' ? '' : 'none';
    });
  });
}

/* WeChat Toggle */
function initWechatToggle() {
  const toggle = document.getElementById('wechatToggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    const on = toggle.classList.contains('active');
    if (on) alert('微信通知已开启（演示模式）');
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
      alert('请输入内容');
      return;
    }
    alert('感谢您的反馈，我们会尽快处理！');
    document.getElementById('feedbackText').value = '';
  });
}

/* Policy Filters */
function initPolicyFilters() {
  let activeRegion = 'all';
  let activeSource = 'all';
  let searchTerm = '';

  const items = Array.from(document.querySelectorAll('.policy-item'));
  const loadBtn = document.getElementById('loadMorePolicies');
  let visibleCount = PAGE_SIZE;

  function filterPolicies() {
    const matched = items.filter((item) => {
      const matchRegion = activeRegion === 'all' || item.dataset.region === activeRegion;
      const matchSource = activeSource === 'all' || item.dataset.source === activeSource;
      const matchSearch = !searchTerm || item.textContent.toLowerCase().includes(searchTerm.toLowerCase());
      return matchRegion && matchSource && matchSearch;
    });

    items.forEach((item) => {
      item.style.display = 'none';
      item.classList.add('is-paginated-hidden');
    });

    matched.forEach((item, index) => {
      if (index < visibleCount) {
        item.style.display = '';
        item.classList.remove('is-paginated-hidden');
      }
    });

    if (loadBtn) {
      const remaining = matched.length - Math.min(visibleCount, matched.length);
      loadBtn.classList.toggle('is-hidden', remaining <= 0 || matched.length === 0);
      loadBtn.textContent = remaining > 0
        ? `查看更多（还有 ${Math.min(remaining, PAGE_SIZE)} 条政策）`
        : '查看更多';
    }
  }

  document.querySelectorAll('#regionChips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#regionChips .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeRegion = chip.dataset.region;
      visibleCount = PAGE_SIZE;
      filterPolicies();
    });
  });

  document.querySelectorAll('#sourceChips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#sourceChips .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeSource = chip.dataset.source;
      visibleCount = PAGE_SIZE;
      filterPolicies();
    });
  });

  document.getElementById('policySearch').addEventListener('input', (e) => {
    searchTerm = e.target.value;
    visibleCount = PAGE_SIZE;
    filterPolicies();
  });

  if (loadBtn) {
    loadBtn.addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      filterPolicies();
    });
  }

  filterPolicies();
}
