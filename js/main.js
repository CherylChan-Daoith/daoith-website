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
  initHsRebateQuery();
  initAiChatbot();
  initTaxCalculator();
  initServicesMarketplace();
  initHubTabs();
  initWechatToggle();
  initFeedbackForm();
  initLoadMore();
  initTaxSystemsGrid();
  bindResultPanelCopyGuard();
  updateExpertArticles();
  window.DAOITH_CART?.updateCartBadge();
  window.DAOITH_CART?.bindAddButtons();

  window.addEventListener('localechange', () => {
    initTaxSystemsGrid();
    updateExpertArticles();
    refreshPaginationLabels();
    refreshShowMoreServicesLabel();
  });

  window.addEventListener('daoith-auth-pending', (event) => {
    const action = event.detail?.action;
    setTimeout(() => {
      if (action === 'tax-calc') {
        document.getElementById('calcTax')?.click();
      } else if (action === 'ai_diagnosis_start') {
        // Resume专属合规诊断 after WeChat login (fast local step-1 inside sendMessage)
        document.getElementById('ai-solution')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
        const form = document.getElementById('aiChatbotForm');
        const input = document.getElementById('aiChatbotInput');
        if (input && form) {
          input.value = '开启专属合规诊断';
          form.requestSubmit();
        }
      } else if (action === 'ai_chat') {
        document.getElementById('aiChatbotInput')?.focus();
      } else if (action === 'ai_plan') {
        document.getElementById('resultContent')?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
        document.getElementById('diagServiceRecs')?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
      }
    }, 0);
  });
});

/* Header scroll effect */
function initHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  });
}

/* Active nav: section view switching (one page area at a time) */
function initNavigation() {
  const viewSections = document.querySelectorAll('[data-view]');
  const navLinks = document.querySelectorAll('.nav > a[href^="#"], .nav-dropdown-menu a[href^="#"]');
  const policyTrigger = document.querySelector('.nav-dropdown-trigger[data-nav-parent="policy"]');
  const policyIds = new Set(['policy', 'tax-systems', 'policy-expert', 'policy-tax', 'policy-platform']);

  const hashToView = {
    '': 'home',
    hero: 'home',
    home: 'home',
    'ai-solution': 'ai-solution',
    services: 'services',
    policy: 'policy',
    'tax-systems': 'policy',
    'policy-tax': 'policy',
    'policy-platform': 'policy',
    'policy-expert': 'policy',
    about: 'about',
    team: 'about',
    hub: 'hub',
  };

  const viewToNavHref = {
    home: '#hero',
    'ai-solution': '#ai-solution',
    services: '#services',
    policy: '#policy',
    about: '#about',
    hub: '#hub',
  };

  function resolveView(hash) {
    const id = String(hash || '').replace(/^#/, '');
    return hashToView[id] || 'home';
  }

  function setActiveNav(hashId, view) {
    const id = String(hashId || '').replace(/^#/, '') || 'hero';
    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const linkId = href.replace(/^#/, '');
      let active = false;
      if (link.closest('.nav-dropdown-menu')) {
        active =
          view === 'policy' &&
          (linkId === id || (id === 'policy' && linkId === 'tax-systems'));
      } else {
        active = href === viewToNavHref[view];
      }
      link.classList.toggle('active', active);
    });
    if (policyTrigger) {
      policyTrigger.classList.toggle('active', view === 'policy');
    }
  }

  function showView(hash, { updateHash = true, scrollTop = true } = {}) {
    const raw = String(hash || 'hero').replace(/^#/, '') || 'hero';
    const view = resolveView(raw);

    document.body.dataset.activeView = view;
    viewSections.forEach((el) => {
      const match = el.getAttribute('data-view') === view;
      el.classList.toggle('is-active-view', match);
      el.hidden = !match;
    });

    setActiveNav(raw, view);

    if (updateHash) {
      const nextHash = `#${raw === 'home' ? 'hero' : raw}`;
      if (location.hash !== nextHash) {
        history.pushState({ view, hash: raw }, '', nextHash);
      }
    }

    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    // Within policy view, scroll to the specific block
    if (view === 'policy' && policyIds.has(raw) && raw !== 'policy') {
      requestAnimationFrame(() => {
        const target = document.getElementById(raw);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    document.getElementById('nav')?.classList.remove('open');
    document.querySelectorAll('.nav-dropdown.open').forEach((d) => {
      d.classList.remove('open');
      d.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }

  function onNavigateClick(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') {
      e.preventDefault();
      showView('hero');
      return;
    }
    const id = href.slice(1);
    if (!(id in hashToView) && id !== '') return;
    e.preventDefault();
    showView(id || 'hero');
  }

  document.addEventListener('click', onNavigateClick);
  window.addEventListener('popstate', () => {
    showView(location.hash.slice(1) || 'hero', { updateHash: false });
  });

  // Open quote modal / cart deep-links may land on home; honor pending view (e.g. after inquiry submit)
  let initialHash = location.hash.slice(1) || 'hero';
  try {
    const pending = sessionStorage.getItem('daoith_open_view');
    if (pending) {
      sessionStorage.removeItem('daoith_open_view');
      initialHash = pending;
    }
  } catch { /* ignore */ }
  showView(initialHash, { updateHash: initialHash !== (location.hash.slice(1) || 'hero') });

  window.DAOITH_showView = showView;
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
  if (!btn || btn.hidden) return;
  const expanded = btn.dataset.expanded === 'true';
  const total = Number(btn.dataset.total || 0);
  btn.textContent = expanded
    ? window.DAOITH_t('services.collapse')
    : window.DAOITH_t('services.showAll').replace('{n}', String(total));
}

function escapeArticleHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function oaArticlesApiBase() {
  const cfg = window.DAOITH_CONFIG || {};
  return (cfg.notifyApiBase || cfg.difyApiBase || 'https://api.daoith.com').replace(/\/$/, '');
}

function localArticlesAsCards() {
  const locale = window.DAOITH_getLocale?.() || 'zh';
  const enMap = window.DAOITH_I18N_EN?.articleTexts || {};
  return (window.DAOITH_ARTICLES || []).map((article) => {
    const en = enMap[article.id];
    return {
      id: article.id,
      title: locale === 'en' && en?.title ? en.title : article.title,
      digest: locale === 'en' && en?.excerpt ? en.excerpt : article.excerpt,
      author: article.author,
      date: article.date,
      url: `/article.html?id=${encodeURIComponent(article.id)}`,
      external: false,
    };
  });
}

function renderExpertArticleCards(articles) {
  const grid = document.getElementById('expertArticlesGrid');
  if (!grid) return;
  const readLabel = window.DAOITH_t('article.readMore');

  grid.innerHTML = articles
    .map((a) => {
      const href = escapeArticleHtml(a.url);
      const external = a.external !== false;
      const rel = external ? 'noopener noreferrer' : '';
      const target = external ? '_blank' : '_self';
      return `
      <article class="article-card" data-article-id="${escapeArticleHtml(a.id)}">
        <div class="article-date">${escapeArticleHtml(a.date || '')}</div>
        <h4><a href="${href}" class="article-title-link" target="${target}" rel="${rel}">${escapeArticleHtml(a.title)}</a></h4>
        <p>${escapeArticleHtml(a.digest || '')}</p>
        <div class="article-meta">
          <span>${escapeArticleHtml(a.author || '')}</span>
          <a href="${href}" class="article-link" target="${target}" rel="${rel}">${escapeArticleHtml(readLabel)}</a>
        </div>
      </article>`;
    })
    .join('');
}

let _expertArticlesPager = null;

function initExpertArticlesPager() {
  const button = document.getElementById('loadMoreArticles');
  if (button) {
    button.classList.add('is-hidden');
    button.onclick = null;
  }
  _expertArticlesPager = setupPagination({
    itemsSelector: '#policy-expert .article-card',
    buttonId: 'loadMoreArticles',
    labelKey: 'loadMore.articles',
    pageSize: ARTICLES_PAGE_SIZE,
  });
}

async function loadExpertArticlesFromWeChat() {
  const hint = document.getElementById('expertArticlesHint');
  const locale = window.DAOITH_getLocale?.() || 'zh';

  const setHint = (text, isError) => {
    if (!hint) return;
    hint.hidden = !text;
    hint.textContent = text || '';
    hint.classList.toggle('is-error', !!isError);
  };

  try {
    const manual = (window.DAOITH_OA_MANUAL_ARTICLES || [])
      .filter((a) => a && a.url && a.title)
      .map((a) => ({ ...a, external: true }));

    // Prefer curated OA links when present (WeChat API cannot list mass-notified posts).
    if (manual.length) {
      renderExpertArticleCards(manual);
      setHint(
        locale === 'en'
          ? 'Articles from the DAOITH WeChat Official Account.'
          : '来自「道一跨境咨询DAOITH」公众号原创文章。'
      );
      initExpertArticlesPager();
      return;
    }

    const res = await fetch(`${oaArticlesApiBase()}/api/wechat-oa/articles?offset=0&count=20`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    const articles = (data.articles || []).map((a) => ({ ...a, external: true }));
    if (articles.length) {
      renderExpertArticleCards(articles);
      setHint(
        locale === 'en'
          ? 'Synced from WeChat Official Account.'
          : '列表已同步公众号文章。'
      );
      initExpertArticlesPager();
      return;
    }

    renderExpertArticleCards(localArticlesAsCards());
    setHint(
      locale === 'en'
        ? (data.hint || 'No published WeChat articles yet. Showing on-site articles.')
        : (data.hint || '暂未拉到公众号已发布图文，先展示站内文章。'),
      false
    );
    initExpertArticlesPager();
  } catch (err) {
    const manual = (window.DAOITH_OA_MANUAL_ARTICLES || [])
      .filter((a) => a && a.url && a.title)
      .map((a) => ({ ...a, external: true }));
    if (manual.length) {
      renderExpertArticleCards(manual);
      setHint(
        locale === 'en'
          ? 'Articles from the DAOITH WeChat Official Account.'
          : '来自「道一跨境咨询DAOITH」公众号原创文章，点击跳转微信原文。'
      );
      initExpertArticlesPager();
      return;
    }
    renderExpertArticleCards(localArticlesAsCards());
    setHint(
      locale === 'en'
        ? `WeChat sync unavailable (${err.message}). Showing on-site articles.`
        : `公众号同步暂不可用（${err.message}），已展示站内文章。`,
      true
    );
    initExpertArticlesPager();
  }
}

function updateExpertArticles() {
  /* Titles/links are re-rendered by loadExpertArticlesFromWeChat on localechange. */
  loadExpertArticlesFromWeChat();
}

function initLoadMore() {
  // Expert articles pager is initialized after async OA fetch in loadExpertArticlesFromWeChat.
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

/* FAQ accordion (supports dynamically generated plan FAQs) */
function initFAQ() {
  const root = document.getElementById('planFaqList') || document;
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-question');
    if (!btn) return;
    const item = btn.closest('.faq-item');
    if (!item) return;
    const isOpen = item.classList.contains('open');
    root.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
}

function buildPlanRelatedFaqs(ctx) {
  const countryText = ctx.countryLabel || '目标销售市场';
  const hsText = ctx.hsCode || '待定 HS';
  const exportText = ctx.exportModeLabel || '出口方式（未填写）';
  const invoiceText = ctx.invoiceLabel || '发票情况（未填写）';
  const faqs = [
    {
      q: '这份AI方案有法律效力吗？',
      a: `方案基于您填写的「${ctx.platformLabel} / ${ctx.shippingLabel}${ctx.entityLabel ? ` / ${ctx.entityLabel}` : ''}${ctx.countryLabel ? ` / ${ctx.countryLabel}` : ''}」等信息生成，仅供一般性参考。正式落地前建议预约专家1v1，结合单证与账套出具可执行方案。`,
    },
    {
      q: ctx.exportMode
        ? `出口方式「${exportText}」对退税有何影响？`
        : '尚未填写出口方式时，退税一般看什么？',
      a: !ctx.exportMode
        ? `可先按「${ctx.platformLabel}」+「${ctx.shippingLabel}」梳理货权、报关与回款路径；在左侧补充出口方式后，方案可进一步区分 0110/9610/9810 等退税与单证要求。`
        : ctx.exportMode === 'cbec_9610' || ctx.exportMode === 'cbec_9810' || ctx.exportMode === 'cbec_9710'
          ? `跨境电商监管方式「${exportText}」通常有特定申报与单证要求，退税/免税路径需与综试区、报关及销售清单匹配，请按本方案行动建议逐项核对。`
          : ctx.exportMode === 'trade_0110'
            ? `一般贸易（0110）更强调报关单、增值税专用发票与货物流一致；结合您的发票情况「${invoiceText}」评估退税资料齐套度。`
            : `您选择的「${exportText}」决定通关与税务处理路径不同，请以方案中的流程图与税负分析为准，并保留完整物流与结算凭证。`,
    },
    {
      q: ctx.country
        ? `在「${countryText}」销售需要关注哪些税？`
        : `「${ctx.shippingLabel}」模式下一般要关注哪些税？`,
      a: `结合发货模式「${ctx.shippingLabel}」，通常需关注目的国进口关税（HS「${hsText}」）、当地VAT/销售税，以及仓储是否触发注册义务。可用下方「合规税负计算」做粗算；补充目的国与 HS 后会更准确。`,
    },
    {
      q: `平台「${ctx.platformLabel}」代扣代缴后还要自行申报吗？`,
      a: `部分国家/地区由平台代扣销售税或VAT，但卖家仍可能需完成税号注册、零申报或对未代扣交易自行处理。请对照方案中的行动建议核对「${ctx.platformLabel}」后台税务设置。`,
    },
    {
      q: '供应商发票不齐怎么办？',
      a: ctx.invoice
        ? `当前发票情况为「${invoiceText}」。无票/普票占比高时，出口退税与进项抵扣风险上升，建议优先梳理可取得专票的供应商，并对无票 SKU 单独台账管理。`
        : `您尚未填写发票情况。一般建议尽快盘点专票/普票/无票占比；无票占比高时退税与成本核算风险上升，可在左侧补充后重新生成方案。`,
    },
    {
      q: '接下来最优先做什么？',
      a: hasSparseAiContext(ctx)
        ? `建议先按方案「行动建议」落实「${ctx.platformLabel}」与「${ctx.shippingLabel}」相关合规动作，并在左侧补充主体、目的国、HS、发票与出口方式后重新生成细化方案。需要人工落地可点击「专家1v1」加入询价单。`
        : `建议先按方案「行动建议」完成：固化平台/主体/目的国/HS/出口方式台账，核对「${exportText}」申报路径，并评估「${countryText}」税务注册与申报日历。需要人工落地可点击「专家1v1」加入询价单。`,
    },
  ];
  return faqs;
}

function renderPlanFaqs(ctx) {
  const panel = document.getElementById('planFaqPanel');
  const list = document.getElementById('planFaqList');
  if (!panel || !list) return;

  const faqs = buildPlanRelatedFaqs(ctx);
  list.innerHTML = faqs
    .map(
      (f) => `
    <div class="faq-item" data-plan-faq="1">
      <button type="button" class="faq-question">${escapeHtml(f.q)}<span class="faq-arrow">▼</span></button>
      <div class="faq-answer"><div class="faq-answer-inner">${escapeHtml(f.a)}</div></div>
    </div>`
    )
    .join('');

  panel.hidden = false;
  window.DAOITH_CART?.bindAddButtons?.(panel);
}

function sanitizeAiAnswer(text) {
  const raw = String(text || '');
  let t = raw;

  // Build tag names at runtime so tooling cannot rewrite DeepSeek's "think" token
  const think = String.fromCharCode(116, 104, 105, 110, 107); // think
  const tagNames = [think, 'thinking', 'reason', 'reasoning', 'redacted_reasoning'];

  // Decode common escaped forms first
  t = t
    .replace(/&lt;\s*(\/?)\s*(think|thinking|reason|reasoning)\b[^&]*&gt;/gi, '<$1$2>')
    .replace(/＜\s*(\/?)\s*(think|thinking|reason|reasoning)[^＞]*＞/gi, '<$1$2>');

  // Prefer text after the last closed think block (formal answer usually follows)
  for (const name of tagNames) {
    const afterClose = new RegExp(`<\\s*\\/\\s*${name}\\s*>\\s*([\\s\\S]*)$`, 'i');
    const m = t.match(afterClose);
    if (m && m[1] && m[1].trim().length >= 8 && !new RegExp(`<\\s*${name}\\b`, 'i').test(m[1])) {
      t = m[1];
      break;
    }
  }

  // Iteratively drop all think / reasoning blocks (including nested / consecutive)
  let prev = '';
  let guard = 0;
  while (t !== prev && guard < 12) {
    prev = t;
    guard += 1;
    for (const name of tagNames) {
      t = t.replace(new RegExp(`<\\s*${name}\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*${name}\\s*>`, 'gi'), '\n');
      t = t.replace(new RegExp(`<\\s*${name}\\b[^>]*>[\\s\\S]*$`, 'i'), '\n');
      t = t.replace(new RegExp(`<\\s*\\/?\\s*${name}\\b[^>]*>`, 'gi'), '');
    }
  }

  const clean = (s) =>
    String(s || '')
      .replace(/^\s*thinking[:：].*$/gim, '')
      .replace(/^\s*思考过程[:：].*$/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const looksLikeCot = (s) =>
    /我们被要求|我回想|根据我训练数据|需要准确查询|所以可直接回答|按照回答要求|必须严格按|假设知识库|思考过程|逐步分析|我先思考|正在检索知识库|调用工具|Action:|Observation:|让我回顾一下|用户已经完成了第|缺少第二步|我需要汇总信息|让我检索知识库|让我再尝试|知识库返回为空|需要检索的知识库|属于路径[ABC]|路径A·|路径B·|路径C·/.test(
      s || ''
    );

  t = clean(t);

  // Drop leading CoT if it ends with a short final refusal / conclusion
  if (
    /我们被要求回答|根据上下文|按照回答要求|必须严格按|所以回答[:：]/.test(t) &&
    /关于该问题，我目前的知识库尚未收录|建议查阅官方/.test(t)
  ) {
    const m = t.match(/关于该问题，我目前的知识库尚未收录[\s\S]*$/);
    if (m) t = m[0];
  }

  if (t.length > 280 && /我们被要求回答|根据上下文|所以回答[:：]|核心答案如下|我回想|让我回顾一下/.test(t)) {
    const parts = t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && parts[parts.length - 1].length < 220) {
      t = parts[parts.length - 1];
    }
  }

  t = clean(t);

  // Strip visible “思考过程” / agent planning sections (with or without XML tags)
  t = t
    .replace(/```(?:thinking|thought|reason|reasoning)[\s\S]*?```/gi, '\n')
    .replace(/(?:^|\n)#{0,3}\s*思考过程[:：]?[\s\S]*?(?=\n#{1,3}\s|\n\*\*|【|$)/g, '\n')
    .replace(/(?:^|\n)思考过程[:：][\s\S]*?(?=\n{2,}|$)/g, '\n')
    .replace(/(?:^|\n)(?:Thought|Action|Observation)\s*[:：][^\n]*/gi, '\n')
    .replace(
      /(?:^|\n)(?:我先|让我|首先|接下来|现在)?(?:需要|正在|开始)?(?:检索|思考|分析|调用|查阅).{0,80}(?:知识库|工具|资料)[^\n]*/g,
      '\n'
    )
    .replace(/(?:^|\n)需要检索的知识库[：:][\s\S]*?(?=\n【|\n#{1,3}\s|$)/g, '\n')
    .replace(/(?:^|\n)知识库返回为空[^\n]*/g, '\n')
    .replace(/(?:^|\n)让我再尝试[^\n]*/g, '\n')
    .replace(/(?:^|\n)根据发货方式[^\n]{0,40}属于路径[ABC][^\n]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // If only a “诊断档案 / 路径判断 / 检索中” draft remains (no formal report), drop it
  if (
    t &&
    !/(【核心风险诊断】|【合规方案】|【行动建议】|好的[，,]|请问|第[一二三四五六七1-7]步)/.test(t) &&
    /(诊断档案|销售平台[：:]|让我检索|知识库返回|属于路径[ABC]|需要检索的知识库)/.test(t)
  ) {
    t = '';
  }

  // If the whole bubble is still CoT-like or still contains think tags, drop it
  if (
    !t ||
    looksLikeCot(t) ||
    new RegExp(`<\\s*${think}\\b`, 'i').test(t) ||
    (/知识库检索|让我回顾|缺少第[二三四五]步/.test(t) &&
      !/(【核心风险诊断】|【合规方案】|好的|请问|第[一二三四五六]步：)/.test(t))
  ) {
    // Prefer any trailing formal section after last think-ish paragraph
    if (/(【核心风险诊断】|【合规方案】)/.test(raw)) {
      const m = raw.match(/【核心风险诊断】[\s\S]*$/);
      if (m) t = clean(m[0]);
      else t = '';
    } else if (
      t &&
      /(好的|请问|第[一二三四五六七1-7]步|【核心风险|【合规方案|您在哪个|发货方式)/.test(t) &&
      !looksLikeCot(t)
    ) {
      /* keep */
    } else {
      t = '';
    }
  }

  // Opening welcome belongs in the first bubble only — strip if the model repeats it mid-chat
  t = t
    .replace(
      /您好[，,]?\s*欢迎使用道一合规诊断助手[！!]?\s*(?:我们)?为跨境电商企业提供合规解决方案[，,]?\s*我将根据您的情况提供针对性的合规方案[。.]?\s*/g,
      ''
    )
    .replace(
      /您好[，,]?\s*我是\*{0,2}道一(?:财税|合规)?诊断助手\*{0,2}[。.]?\s*/g,
      ''
    )
    .replace(/^\s*\n+/, '')
    .trim();

  return t;
}

/** Drop Dify re-intros; welcome already shown in the embedded chat opening. */
function stripDiagnosisIntroBoilerplate(text) {
  return String(text || '')
    .replace(
      /您好[，,]?\s*欢迎使用道一合规诊断助手[！!]?\s*(?:我们)?为跨境电商企业提供合规解决方案[，,]?\s*我将根据您的情况提供针对性的合规方案[。.]?\s*/g,
      ''
    )
    .replace(
      /您好[，,]?\s*我是\*{0,2}道一合规诊断助手\*{0,2}[。.]?\s*/g,
      ''
    )
    .replace(
      /您好[，,]?\s*我是\*{0,2}道一财税诊断助手\*{0,2}[。.]?\s*/g,
      ''
    )
    .replace(
      /我会一步一步了解您的跨境业务[^\n]*生成合规方案[^\n]*\n*/g,
      ''
    )
    // Slow/redundant platform re-confirm before asking shipping
    .replace(/我看到您提到了[^\n]*[！!。.]?\s*/g, '')
    .replace(/让我确认一下[：:]?[^\n]*对吗[？?]?\s*/g, '')
    .replace(/您是在[^？?]*平台上销售商品[，,]?对吗[？?]?\s*/g, '')
    .replace(/确认后[，,]?我们继续下一步[：:]?\s*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 轻度排版：已有列表/加粗则原样渲染，避免改写 Dify 完整答复 */
function enhanceChatMarkdown(text) {
  let t = String(text || '').trim();
  if (!t) return t;

  // 已有结构：只做标题行加粗，不拆句重写
  if (/^#{1,4}\s|^\s*[-*•]\s|^\s*\d+[.)、]\s|\*\*[^*\n]{2,}\*\*/m.test(t)) {
    t = t.replace(/^(【?[^】\n]{2,20}】?)[:：]\s*$/gm, '**$1**');
    return t;
  }

  // 短散文才整理；长文保持原样，防止丢内容
  if (t.length > 220 || t.split('\n').length > 4) return t;

  const parts = t
    .split(/(?<=[。！？；])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  if (parts.length >= 2 && parts.length <= 6) {
    const lead = parts[0].replace(/\*\*/g, '');
    const rest = parts.slice(1).map((p) => `- ${p.replace(/\*\*/g, '')}`);
    return `**${lead}**\n\n${rest.join('\n')}`;
  }
  return t;
}

/**
 * Display diagnosis asks as「1. …」「2. …」instead of「第一步 / 第二步».
 */
function normalizeDiagStepLabels(text) {
  const map = { 一: '1', 二: '2', 三: '3', 四: '4', 五: '5', 六: '6', 七: '7', 八: '8' };
  return String(text || '').replace(/第\s*([一二三四五六七八1-8])\s*步[：:\s]*/g, (_, raw) => {
    const n = map[raw] || raw;
    return `${n}. `;
  });
}

/** Drop meta lines like「4. 了解目前出口方式」; keep the real numbered question. */
function stripDiagMetaHeadings(text) {
  return String(text || '')
    .replace(
      /(^|\n)\s*\*{0,2}\d+\.\s*了解(?:目前)?(?:出口方式|供应商发票情况|年销售额|产品类别|发货方式|注册主体|销售平台|店铺主体)[^\n？?]*\*{0,2}\s*(?=\n|$)/g,
      '$1'
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Options are shown as chips — remove「选项/可选」dumps and duplicate bullet lists from chat text. */
function stripDiagChoiceDump(text) {
  let t = String(text || '');
  // Same-line dumps: 「……？可选：…」「……？选项：…」
  t = t.replace(/([？?])\s*(?:\*\*)?\s*(?:选项|可选)[：:][^\n]*/g, '$1');
  // Whole option-dump lines
  t = t.replace(/^\s*(?:选项|可选)[：:].*$/gm, '');

  const lines = t.split('\n');
  const out = [];
  let afterAsk = false;
  for (const line of lines) {
    const tr = line.trim();
    if (/^\*{0,2}\d+\.\s+/.test(tr) && /[？?]/.test(tr)) {
      afterAsk = true;
      out.push(line);
      continue;
    }
    if (afterAsk) {
      if (!tr) {
        out.push(line);
        continue;
      }
      // Drop bullet choices / long comma option lists after the ask
      if (/^[-*•]/.test(tr)) continue;
      if (/(?:选项|可选)[：:]/.test(tr)) continue;
      if (
        /正式报关出口|小包快递出口|市场采购出口|委托货代出口|由平台安排出口/.test(tr) &&
        /(、|,|\/)/.test(tr)
      ) {
        continue;
      }
      afterAsk = false;
    }
    out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Bold only the active diagnosis step question (e.g.「3. 请问您的发货方式是以下哪一种？」).
 * Confirmation lines and option lists stay unbolded.
 */
function emphasizeDiagStepQuestion(text) {
  let t = stripDiagChoiceDump(
    stripDiagMetaHeadings(normalizeDiagStepLabels(String(text || '').replace(/\r/g, '')))
  );
  if (!t.trim() || looksLikeFullDiagnosisPlan(t)) return t;

  // Prefer number from a stripped meta heading, else current wizard step
  let stepHint = 0;
  const raw = String(text || '');
  const metaNum = raw.match(/(?:^|\n)\s*\*{0,2}(\d+)\.\s*了解/);
  if (metaNum) stepHint = parseInt(metaNum[1], 10) || 0;

  try {
    const mode = localStorage.getItem('daoith_diagnosis_ui_mode') || '';
    const step = parseInt(localStorage.getItem('daoith_diagnosis_ui_step') || '0', 10);
    const useStep =
      stepHint >= 1 && stepHint <= 7
        ? stepHint
        : mode === 'diagnosis' && step >= 1 && step <= 7
          ? step
          : 0;
    if (useStep && !/(?:^|\n)\s*\*{0,2}\d+\.\s+\S*[？?]/.test(t)) {
      const lines = t.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const tr = lines[i].trim().replace(/^\*\*|\*\*$/g, '');
        if (
          /[？?]/.test(tr) &&
          /(平台|主体|发货|出口|发票|产品|类别|销售额|请问|哪一种|怎样|多少)/.test(tr) &&
          !/^\d+\./.test(tr) &&
          !/^了解/.test(tr)
        ) {
          const indent = lines[i].match(/^\s*/)[0];
          lines[i] = `${indent}${useStep}. ${tr}`;
          break;
        }
      }
      t = lines.join('\n');
    }
  } catch {
    /* ignore */
  }

  const lines = t.split('\n');
  let hit = false;
  const mapped = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || /^[-*•]/.test(trimmed) || /^选项[：:]/.test(trimmed)) return line;
    if (/^\d+\.\s*了解/.test(trimmed.replace(/^\*\*|\*\*$/g, ''))) return '';
    const indent = line.match(/^\s*/)[0];
    // 「3. ……？」——只加粗问句；选项已在下方 chips，正文不再带出
    const stepMatch = trimmed.match(/^(?:\*\*)?(\d+\.\s+[^？?\n]*[？?])(?:\*\*)?(.*)$/);
    if (stepMatch && !/了解/.test(stepMatch[1])) {
      hit = true;
      const tail = String(stepMatch[2] || '').trim();
      // Keep short parenthetical hints like（例如：…）；drop 选项/可选 dumps
      if (tail && !/^(?:选项|可选)[：:]/.test(tail) && /^[（(]/.test(tail) && tail.length <= 80) {
        return `${indent}**${stepMatch[1].replace(/\*\*/g, '')}**${stepMatch[2]}`;
      }
      return `${indent}**${stepMatch[1].replace(/\*\*/g, '')}**`;
    }
    // 「……？ 选项：A、B…」只保留问句
    const withOpts = trimmed.match(/^(?:\*\*)?(.+?[？?])(?:\*\*)?\s*(?:选项|可选)[：:].+$/);
    if (
      withOpts &&
      ( /^\d+\.\s+/.test(withOpts[1]) ||
        /(请问|发货方式|出口方式|注册主体|发票|产品类别|销售额|平台|怎样|多少|属于以下)/.test(withOpts[1]) )
    ) {
      hit = true;
      return `${indent}**${withOpts[1].replace(/\*\*/g, '').trim()}**`;
    }
    return line;
  });
  t = mapped.filter((ln, i, arr) => !(ln === '' && (i === 0 || arr[i - 1] === ''))).join('\n');
  if (hit) return t;

  const q = extractDiagActiveQuestion(t);
  const plainQ = String(q || '')
    .replace(/\*\*/g, '')
    .trim();
  if (
    plainQ &&
    !plainQ.includes('\n') &&
    plainQ.length >= 6 &&
    plainQ.length <= 180 &&
    /[？?]/.test(plainQ) &&
    /(平台|主体|发货|出口|发票|产品|类别|销售额|请选择|哪一种|怎样|多少|属于以下)/.test(plainQ)
  ) {
    const idx = t.indexOf(plainQ);
    if (idx >= 0) {
      return `${t.slice(0, idx)}**${plainQ}**${t.slice(idx + plainQ.length)}`;
    }
  }
  return t;
}

function renderChatBubbleHtml(text) {
  let md = enhanceChatMarkdown(sanitizeAiAnswer(emphasizeDiagStepQuestion(text)));
  // Keep「1. 问题？」as prose in chat (avoid ordered-list rendering)
  md = md.replace(/(^|\n)(\*\*)?(\d+)\.(?=\s)/gm, '$1$2@@N$3@@');
  let html = renderAIPlanHtml(md);
  html = String(html || '').replace(/@@N(\d+)@@/g, '$1.');
  return html || `<p class="result-paragraph">${formatInline(String(text || ''))}</p>`;
}

function isKnowledgeMissRefusal(text) {
  const t = String(text || '');
  return /知识库尚未收录|目前的知识库尚未|未在知识库|建议查阅官方税务局|信息还需补充，或者预约专家/.test(t);
}

function buildLocalChatReply(message, ctx) {
  const q = String(message || '').trim();

  // Product → HS classification (common references; final check with Customs)
  if (/海关编码|HS\s*编码|税号|归类/.test(q) || (/编码/.test(q) && /(手机|电脑|耳机|服装|玩具)/.test(q))) {
    if (/手机|智能手机|iPhone|安卓/.test(q)) {
      return [
        '**智能手机常见归类参考**',
        '',
        '- 税号参考：多归入 **8517.13**（中国税则常见 85171300）',
        '- 注意：型号、通信功能、是否成套等会影响归类',
        '- 正式报关请以海关归类决定 / 预裁定为准',
        '- 可用左侧「HS 查询」核对退税率',
      ].join('\n');
    }
    if (/笔记本|电脑|平板/.test(q)) {
      return [
        '**便携式电脑常见归类参考**',
        '',
        '- 税号参考：多归入 **8471.30**',
        '- 正式报关请以海关归类决定为准',
        '- 可用左侧「HS 查询」核对退税率',
      ].join('\n');
    }
    return [
      '**海关编码（HS）归类提示**',
      '',
      '- 需按商品材质、功能、用途归类',
      '- 可在左侧填写大致编码后查询出口退税率',
      '- 拿不准时可预约专家1v1，或申请海关预裁定',
    ].join('\n');
  }

  if (!ctx?.platform) {
    return [
      '**我可以协助的实务方向**',
      '',
      '- 海关编码与出口退税',
      '- 出口方式与税负路径',
      '- 结合店铺情况：请先在左侧填写业务信息并生成方案',
      '- 复杂事项建议预约**专家1v1**',
    ].join('\n');
  }
  if (/铝/.test(q) && /退税/.test(q)) {
    const aluminum = buildAluminumProductsRefundReply(q);
    if (aluminum) return aluminum;
    return [
      '**铝材出口退税政策要点**',
      '',
      '- 依据：财政部、税务总局公告2024年第15号',
      '- 内容：铝材等产品**取消出口退税**（文库口径多为 **0%**，勿与增值税税率13%混淆）',
      '- 实施：自 **2024年12月1日** 起（以公告原文及附件清单为准）',
      '- 建议：核对附件清单是否覆盖您的具体税号，并以税局 / 海关最新公告终核',
    ].join('\n');
  }
  if (/退税|出口退税/.test(q)) {
    return [
      '**出口退税关注点**',
      '',
      `- 出口方式：${ctx.exportModeLabel || '未填写'}`,
      `- 发票情况：${ctx.invoiceLabel || '未填写'}`,
      '- 关键：票货款一致、监管方式匹配',
      `- 建议：用「查询出口退税率」核对 HS「${ctx.hsCode || '未填写'}」，并按方案行动建议补齐单证`,
    ].join('\n');
  }
  if (/关税|VAT|销售税|税负/.test(q)) {
    return [
      '**税负与关税提示**',
      '',
      `- 目的国：${ctx.countryLabel || '未填写'}`,
      `- 发货模式：${ctx.shippingLabel || '未填写'}`,
      '- 建议先看方案中的税负影响分析，并用下方税负计算器粗算',
      `- 关税终核：参考该国海关官方税则对 HS「${ctx.hsCode || '未填写'}」`,
    ].join('\n');
  }
  if (/9610|9810|9710|0110|出口方式/.test(q)) {
    return [
      '**出口方式说明**',
      '',
      `- 当前选择：${ctx.exportModeLabel || '未填写'}`,
      '- 不同监管方式的报关、清单与退税路径不同',
      '- 详情见方案业务流程图与行动建议',
    ].join('\n');
  }
  return [
    '**已结合您的业务背景**',
    '',
    `- 平台：${ctx.platformLabel || '未填写'}`,
    `- 主体：${ctx.entityLabel || '未填写'}`,
    `- 目的国：${ctx.countryLabel || '未填写'}`,
    `- 出口方式：${ctx.exportModeLabel || '未填写'}`,
    '',
    '更复杂的落地路径建议点击**专家1v1**加入询价单，由顾问结合账套与单证给出定制方案。',
  ].join('\n');
}

const DIAG_QUICK_REPLY_SETS = {
  modeSelect: [
    '开启专属合规诊断',
    '我有特定问题想直接提问',
  ],
  platform: [
    '亚马逊 Amazon',
    'Temu',
    'TikTok Shop',
    '速卖通',
    'SHEIN',
    '阿里国际站',
    'Shopee',
    'Lazada',
    'eBay',
    'Shopify独立站',
    '美客多',
    '其他平台',
  ],
  shippingAmazon: [
    '亚马逊FBA',
    '自发货（国内直发）',
    '自发货（海外仓发货）',
  ],
  shippingAlibaba: [
    '自营出口',
    '一达通代理出口3+N',
    '一达通代理出口2+N',
    '市场采购出口',
    '便捷发货出口',
  ],
  shippingShein: [
    '供货 SHEIN（国内仓）',
    '供货 SHEIN（保税仓）',
    'SHEIN平台入驻商家（国内直发）',
    'SHEIN平台入驻商家（海外仓发货）',
  ],
  shippingAliExpress: [
    '全托管（国内仓）',
    '半托管（国内仓）',
    '半托管（海外仓）',
    'POP（国内直发）',
    'POP（海外仓发货）',
  ],
  shippingTemu: [
    '全托管（国内仓）',
    '半托管（国内仓）',
    '半托管（海外仓）',
    'POP（国内直发）',
    'POP（海外仓发货）',
  ],
  shippingShopee: [
    '全托管（国内仓）',
    'Shopee海外仓',
    '自发货（国内直发）',
    '自发货（海外仓发货）',
  ],
  shippingLazada: [
    '全托管（国内仓）',
    'FBL海外仓',
    '自发货（国内直发）',
    '自发货（海外仓发货）',
  ],
  shipping: [
    '发货到平台海外仓',
    '发货到平台国内仓',
    '自发货（国内直发）',
    '自发货（海外仓发货）',
  ],
  entity: [
    '中国大陆公司',
    '中国个人',
    '个体户',
    '中国香港公司',
    '外籍个人',
    '其他境外公司',
  ],
  invoice: [
    '能提供增值税专用发票',
    '只能提供增值税普通发票',
    '无法提供发票',
    '部分专票+部分普票',
    '部分专票+部分无票',
  ],
  exportMode: [
    '正式报关出口（0110/9710）',
    '正式报关出口（9810）',
    '小包快递出口（9610/1210）',
    '小包快递出口（未报关）',
    '市场采购出口（1039）',
    '委托货代出口',
    '由平台安排出口',
    '其他',
  ],
  productCategory: [
    '普货，能正常报关出口和退税',
    '0退税率产品（如贵重金属、珠宝玉石、钢材、铝材、木材）',
    '产品涉及商检（如食品、化妆品、危险化学品、木制品）',
    '产品涉及海关备案商标或者专利但暂未获得授权',
    '其他（不在以上分类）',
  ],
  revenue: [
    '500万以下',
    '500-2000万',
    '2000-5000万',
    '5000万-1亿',
    '1-4亿',
    '4-10亿',
    '10亿以上',
  ],
  yesNo: ['是', '否', '不确定'],
  consultFollowup: [
    '需要，想预约专家1v1',
    '先不用，我再看看方案',
    '想了解服务报价',
  ],
};

/** Split bot text into question sentences (handles multiple ？ in one line). */
function extractQuestionSentences(botText) {
  const t = String(botText || '').replace(/\r/g, '').trim();
  if (!t) return [];
  const parts = [];
  for (const line of t.split(/\n+/)) {
    const s = line.trim();
    if (!s) continue;
    s.split(/(?<=[？?])/).map((x) => x.trim()).filter(Boolean).forEach((c) => {
      if (/[？?]/.test(c)) parts.push(c);
    });
  }
  return parts;
}

function isMereConfirmQuestion(q) {
  const t = String(q || '').trim();
  if (!t) return false;
  // e.g. 「您是在亚马逊平台上销售商品，对吗？」
  if (!/(对吗|是吗|对不对|可以吗|确认一下)/.test(t)) return false;
  // Still a real slot ask if it also asks shipping / invoice / etc.
  if (/(发货|FBA|海外仓|国内直发|自发货|主体|发票|目的国|主销|出口方式|痛点)/.test(t)) return false;
  return true;
}

function isShippingQuestionText(t) {
  const s = String(t || '');
  // Match the ask itself — not “明白了，FBA发货” acknowledgments before the next step.
  // Do NOT match bare brand names (SHEIN/Temu often appear in platform-question examples).
  const asksShipping =
    /(发货方式|发货模式|仓储模式|履约模式|怎么发货|如何发货|发货是|还是自发货|亚马逊\s*FBA|FBA还是|自发货|发货到平台海外仓|发货到平台国内仓|平台海外仓|平台国内仓|平台仓|全托管|半托管|POP商家|POP（|一达通|便捷发货|市场采购出口|保税仓|供货\s*SHEIN|供货给\s*SHEIN|国内直发还是|先发到海外仓|海外仓发货)/.test(
      s
    );
  // Bare “FBA/海外仓” alone is too weak (echoed in confirmations).
  return asksShipping && /(请问|哪|模式|是|还是|[？?])/.test(s);
}

function isPlatformQuestionText(t) {
  const s = String(t || '');
  // Later-step asks / acknowledgments mentioning「销售平台」must not map to platform chips
  if (/(发货方式|注册主体|店铺主体|第三步|第四步|年销售额|产品类别|供应商.*发票)/.test(s)) return false;
  if (/(记录为|已将|已记录).{0,24}(销售平台|电商平台)/.test(s) && !/(哪个|什么)平台/.test(s)) {
    return false;
  }
  if (/(哪个平台|什么平台|在哪个电商平台|在哪个平台上销售|哪个电商平台)/.test(s)) return true;
  if (
    /(销售平台|电商平台)/.test(s) &&
    /(请问|哪|什么|选择|[？?])/.test(s) &&
    !/(记录为|已将|已记录)/.test(s)
  ) {
    return true;
  }
  return false;
}

/** Active ask text for quick-reply matching (avoid earlier-slot recap keywords). */
function extractDiagActiveQuestion(botText) {
  const t = String(botText || '').replace(/\r/g, '').trim();
  if (!t) return '';
  const withQ = extractQuestionSentences(t);
  if (withQ.length) {
    const substantive = withQ.filter((q) => !isMereConfirmQuestion(q));
    const pool = substantive.length ? substantive : withQ;
    const start = Math.max(0, pool.length - 2);
    return pool.slice(start).join(' ');
  }
  return t.length > 240 ? t.slice(-240) : t;
}

function detectDiagQuickReplySet(botText) {
  const full = String(botText || '');
  if (looksLikeFullDiagnosisPlan(full)) return null;
  const t = extractDiagActiveQuestion(full);
  if (!t) return null;
  const zone = `${t}\n${full.slice(-500)}`;

  // Mode selection after welcome
  if (
    /(开启专属合规诊断|特定问题想直接提问|专属合规诊断|直接提问)/.test(zone) &&
    /(请选择|还是|或者|两种|模式)/.test(zone)
  ) {
    return 'modeSelect';
  }
  if (/请选择/.test(zone) && /(合规诊断|直接提问|特定问题)/.test(zone)) return 'modeSelect';

  // Platform question — only when actively asking; do not use zone (often echoes prior platform)
  if (isPlatformQuestionText(t)) return 'platform';

  // Later-slot asks on the active question beat shipping (bot often echoes “FBA发货” before 第三步)
  if (/注册主体|店铺主体|中国个人|中国大陆公司|个体户|中国香港公司|外籍个人|其他境外公司|东南亚本土公司|南美洲本土公司|大陆公司|香港公司|主体是/.test(t)) {
    return 'entity';
  }
  if (
    /(增值税专用发票|增值税普通发票|专用发票|普通发票|专票|普票|无法提供发票|不能提供发票|无票)/.test(t) ||
    (/(发票)/.test(t) && /(供应商|配合|提供|情况|类型|请问|能否|有无)/.test(t))
  ) {
    return 'invoice';
  }
  // Step-4 出口方式 — avoid matching step-2 Alibaba options that end with「…出口」
  if (
    /(目前.*出口方式|货物的出口方式|出口方式是怎么样|正式报关|一般贸易|委托货代|小包快递|市场采购|未报关|0110|9610|9710|9810|1039|1210|报关方式|由平台安排出口)/.test(
      t
    ) &&
    !/(发货方式|一达通|便捷发货出口|自营出口)/.test(t)
  ) {
    return 'exportMode';
  }
  if (/(销售额|营收|年销售|大概多少)/.test(t)) return 'revenue';
  if (
    /(产品属于|产品类别|哪种类别|普货|0退税率|退税率产品|涉及商检|海关备案(?:品牌|商标|专利)|能正常报关出口和退税)/.test(t)
  ) {
    return 'productCategory';
  }

  // Platform-specific step-2 questions — match the active ask only (not prior-step echoes)
  if (/(亚马逊\s*FBA|FBA还是自发货|发货方式是亚马逊)/.test(t)) return 'shippingAmazon';
  // 阿里国际站：选项清单即可识别（不必再要求正文出现「国际站」）
  if (
    (/(一达通|便捷发货|自营出口|市场采购出口)/.test(t) && /(国际站|阿里国际)/.test(zone)) ||
    (/(自营出口)/.test(t) && /(一达通)/.test(t) && /(市场采购|便捷发货)/.test(t))
  ) {
    return 'shippingAlibaba';
  }
  if (
    (/SHEIN|希音/.test(t) && /(供货|国内仓|保税仓|入驻)/.test(t) && !isPlatformQuestionText(t)) ||
    /供货\s*SHEIN|SHEIN平台入驻/.test(t)
  ) {
    return 'shippingShein';
  }
  if (
    (/(速卖通|AliExpress)/.test(t) && /(全托管|半托管|POP)/.test(t) && !isPlatformQuestionText(t)) ||
    (/(全托管（国内仓）|半托管（国内仓）|半托管（海外仓）|POP（国内直发）|POP（海外仓发货）)/.test(t) &&
      /(速卖通|AliExpress)/.test(zone))
  ) {
    return 'shippingAliExpress';
  }
  if (
    (/Temu|TEMU/.test(t) && /(全托管|国内仓|半托管|POP)/.test(t) && !isPlatformQuestionText(t)) ||
    (/Temu|TEMU/.test(zone) &&
      /(全托管（国内仓）|半托管（国内仓）|半托管（海外仓）|POP（国内直发）|POP（海外仓发货）)/.test(t))
  ) {
    return 'shippingTemu';
  }
  if (
    (/Shopee/i.test(t) && /(全托管|海外仓|自发货)/.test(t) && !isPlatformQuestionText(t)) ||
    /Shopee海外仓/.test(t)
  ) {
    return 'shippingShopee';
  }
  if (
    (/Lazada/i.test(t) && /(全托管|FBL|自发货)/.test(t) && !isPlatformQuestionText(t)) ||
    /FBL海外仓/.test(t)
  ) {
    return 'shippingLazada';
  }
  if (isShippingQuestionText(t)) return 'shipping';

  // Only offer consult chips when the bot actually asks a yes/no consult question
  if (
    /(是否需要|要不要|需不需要|是否想要)[^\n]*?(?:付费咨询|预约专家|专家\s*1\s*[vV]\s*1|深度咨询)/.test(t) &&
    /[？?]/.test(t)
  ) {
    return 'consultFollowup';
  }
  if (/(是否|要不要|有没有做过|需要我|对吗|是吗)/.test(t) && /[？?]/.test(t)) return 'yesNo';
  if (isMereConfirmQuestion(t)) return 'yesNo';
  return null;
}

function shippingQuickReplySetForPlatform(platformLabel) {
  const t = String(platformLabel || '');
  if (/亚马逊|Amazon/i.test(t)) return 'shippingAmazon';
  if (/国际站|阿里国际|Alibaba\.com/i.test(t)) return 'shippingAlibaba';
  if (/SHEIN|希音/i.test(t)) return 'shippingShein';
  if (/速卖通|AliExpress/i.test(t)) return 'shippingAliExpress';
  if (/Temu|TEMU/i.test(t)) return 'shippingTemu';
  if (/Shopee/i.test(t)) return 'shippingShopee';
  if (/Lazada/i.test(t)) return 'shippingLazada';
  return 'shipping';
}

/** Extra regional entity option by marketplace, if any. */
function regionalEntityOptionForPlatform(platformLabel) {
  const t = String(platformLabel || '');
  if (/Shopee|Lazada/i.test(t)) return '东南亚本土公司';
  if (/美客多|Mercado/i.test(t)) return '南美洲本土公司';
  return '';
}

/** Entity chips for step 2 — base list + optional local-overseas company by platform. */
function entityOptionsForPlatform(platformLabel) {
  const base = DIAG_QUICK_REPLY_SETS.entity || [];
  const regional = regionalEntityOptionForPlatform(platformLabel);
  if (!regional) return base.slice();
  const out = base.slice();
  const idx = out.indexOf('外籍个人');
  if (idx >= 0) out.splice(idx, 0, regional);
  else out.splice(Math.max(0, out.length - 1), 0, regional);
  return out;
}

/** Rewrite mode-select clicks into explicit instructions for the Agent API. */
function normalizeDiagnosisModeQuery(text) {
  const t = String(text || '').trim();
  if (/开启专属合规诊断/.test(t)) {
    return (
      '【模式选择】用户选择：开启专属合规诊断。' +
      '请立即进入模式A专属合规诊断，执行第一步：只提问销售平台（可列举亚马逊、TikTok Shop、eBay、速卖通、Temu、阿里国际站、SHEIN、Shopee、Lazada、美客多等）。' +
      '禁止说“这不是自动命令”，禁止要求用户改提其他具体问题，禁止输出欢迎语。'
    );
  }
  if (/我有特定问题想直接提问|特定问题想直接提问/.test(t)) {
    return (
      '【模式选择】用户选择：我有特定问题想直接提问。' +
      '请进入模式B：用一两句邀请用户描述具体问题；不要展开7步诊断问卷。'
    );
  }
  return t;
}

function localDiagnosisPlatformAsk() {
  return (
    '好的，已为您开启专属合规诊断。\n\n' +
    '1. 您在哪个电商平台上销售商品？（例如：亚马逊、TikTok Shop、eBay、速卖通、Temu、阿里国际站、SHEIN、Shopee、Lazada）'
  );
}

function localDiagnosisEntityAsk(platformLabel) {
  const platform = String(platformLabel || '').trim();
  const opts = entityOptionsForPlatform(platform);
  return (
    (platform ? `好的，已将「${platform}」记录为您的销售平台。\n\n` : '好的。\n\n') +
    `2. 您平台店铺的注册主体是${opts.join('、')}？`
  );
}

function localDiagnosisShippingAsk(platformLabel) {
  return '3. 请问您的发货方式是以下哪一种？';
}

function localDiagnosisExportAsk() {
  return '4. 您目前货物的出口方式是怎么样的？';
}

function localDiagnosisInvoiceAsk(preface) {
  const head = String(preface || '').trim();
  return (
    (head ? `${head}\n\n` : '') +
    '5. 您目前供应商是否能够配合提供增值税专用发票？还是只能提供增值税普通发票，或者无法提供发票？'
  );
}

function localDiagnosisProductCategoryAsk(preface) {
  const head = String(preface || '').trim();
  return (head ? `${head}\n\n` : '') + '6. 您的产品属于以下哪种类别？';
}

function localDiagnosisRevenueAsk(preface) {
  const head = String(preface || '').trim();
  return (head ? `${head}\n\n` : '') + '7. 您目前年销售额约多少人民币？';
}

/** 平台国内仓类发货 → 出口通常由平台安排 */
function isPlatformDomesticWarehouseShipping(text) {
  const t = String(text || '');
  return /(全托管（国内仓）|半托管（国内仓）|发货到平台国内仓|平台国内仓|供货\s*SHEIN（国内仓）|平台商家·发国内仓)/.test(
    t
  );
}

const DIAG_SLOTS_KEY = 'daoith_diagnosis_ui_slots';

function getDiagSlots() {
  try {
    const raw = localStorage.getItem(DIAG_SLOTS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

function setDiagSlot(key, value) {
  const slots = getDiagSlots();
  slots[key] = String(value || '').trim();
  localStorage.setItem(DIAG_SLOTS_KEY, JSON.stringify(slots));
  return slots;
}

function clearDiagSlots() {
  localStorage.removeItem(DIAG_SLOTS_KEY);
}

function formatDiagSlotsForApi() {
  const s = getDiagSlots();
  const exportMode =
    s.exportMode ||
    (isPlatformDomesticWarehouseShipping(s.shipping) ? '由平台安排出口' : '') ||
    '未填写';
  const lines = [
    `销售平台：${s.platform || '未填写'}`,
    `注册主体：${s.entity || '未填写'}`,
    `发货方式：${s.shipping || '未填写'}`,
    `出口方式：${exportMode}`,
    `供应商发票：${s.invoice || '未填写'}`,
    `产品类别：${s.productCategory || '未填写'}`,
    `年销售额：${s.revenue || '未填写'}`,
  ];
  let hard = '';
  if (exportMode === '由平台安排出口') {
    hard =
      '【硬约束】出口方式已确定为「由平台安排出口」。禁止写“未提供出口信息/出口方式未知”；' +
      '【合规方案】只围绕平台统一安排出口撰写，禁止罗列其他出口方式分支情形。';
  }
  return `【诊断档案·必须采信】\n${lines.join('\n')}\n${hard}`;
}

/** Short labels for the fixed「诊断档案确认」line in the plan panel. */
function formatDiagArchiveConfirmParts() {
  const s = getDiagSlots();
  const exportMode =
    s.exportMode ||
    (isPlatformDomesticWarehouseShipping(s.shipping) ? '由平台安排出口' : '');
  const product = String(s.productCategory || '').trim();
  let productLabel = product;
  if (/^普货/.test(product)) productLabel = '普货';
  else if (/^0退税率/.test(product)) productLabel = '0退税率产品';
  else if (/商检/.test(product)) productLabel = '涉及商检';
  else if (/商标|专利/.test(product)) productLabel = '海关备案商标／专利未授权';
  else if (/^其他/.test(product)) productLabel = '其他产品类别';

  const revenue = String(s.revenue || '').trim();
  const revenueLabel = revenue
    ? /^年销售额/.test(revenue)
      ? revenue
      : `年销售额${revenue}`
    : '';

  return [
    s.platform,
    s.entity,
    s.shipping,
    exportMode,
    s.invoice,
    productLabel,
    revenueLabel,
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean);
}

function buildDiagnosisArchiveConfirmHtml() {
  const parts = formatDiagArchiveConfirmParts();
  if (!parts.length) return '';
  return (
    `<p class="result-paragraph result-archive-confirm">` +
    `<strong>诊断档案确认：</strong>` +
    `<span class="result-archive-confirm-values">${escapeHtml(parts.join(' / '))}</span>` +
    `</p>`
  );
}

/** Drop model-written archive/confirm preambles — frontend owns this block. */
function stripDiagnosisArchivePreamble(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let skipping = true;
  for (const raw of lines) {
    const plain = raw
      .replace(/\*/g, '')
      .replace(/^[-*•]\s+/, '')
      .trim();
    if (skipping) {
      if (!plain) continue;
      if (
        /^(诊断档案确认|业务档案确认|诊断信息确认|档案确认)[:：]/.test(plain) ||
        /^以下方案由左侧/.test(plain) ||
        /^您好[，,]?\s*我是您的道一合规小助手/.test(plain)
      ) {
        continue;
      }
      // Skip a compact archive dump line that lists options with /
      if (
        /(阿里|亚马逊|Temu|Shopee|速卖通|美客多|TikTok)/.test(plain) &&
        /年销售额|专票|无票|普货|报关|发货/.test(plain) &&
        (plain.match(/\//g) || []).length >= 3 &&
        plain.length < 220 &&
        !/^【/.test(plain)
      ) {
        continue;
      }
      skipping = false;
    }
    out.push(raw);
  }
  return out.join('\n').replace(/^\n+/, '');
}

function looksLikeModeSelectReply(text) {
  const t = String(text || '');
  return (
    /(开启专属合规诊断|特定问题想直接提问)/.test(t) &&
    /(请选择|还是|无法判断|仅凭)/.test(t)
  );
}

/** Enrich diagnosis-step user replies so Dify never restarts mode selection. */
function buildDiagnosisApiQuery(text, uiMode, uiStep, platformLabel) {
  const normalized = normalizeDiagnosisModeQuery(text);
  if (normalized !== String(text || '').trim()) return normalized;
  if (uiMode !== 'diagnosis' || uiStep < 1) return String(text || '').trim();
  const platform = String(platformLabel || getDiagSlots().platform || '').trim();
  const stepHints = {
    2: '请执行第二步：只提问店铺注册主体一句；官网会按平台显示按钮（含对应海外本土公司选项，如 Shopee/Lazada→东南亚本土公司，美客多→南美洲本土公司）。不要在正文罗列全部选项。',
    3: '请执行第三步：只提问一句「3. 请问您的发货方式是以下哪一种？」不要在正文罗列选项；官网会按平台显示按钮。',
    4: '请执行第四步：只提问出口方式一句「4. 您目前货物的出口方式是怎么样的？」不要在正文列出选项；官网会提供按钮：正式报关出口（0110/9710）/正式报关出口（9810）/小包快递出口（9610/1210）/小包快递出口（未报关）/市场采购出口（1039）/委托货代出口/由平台安排出口/其他。若发货为平台国内仓类，可直接记为「由平台安排出口」并进入第五步。',
    5: '请执行第五步：只询问供应商发票情况。',
    6: '请执行第六步：只提问一句「6. 您的产品属于以下哪种类别？」不要在正文罗列选项；官网会提供按钮：普货，能正常报关出口和退税 / 0退税率产品… / 产品涉及商检… / 产品涉及海关备案商标或者专利但暂未获得授权 / 其他（不在以上分类）。',
    7: '请执行第七步：只提问一句「7. 您目前年销售额约多少人民币？」不要在正文罗列选项；官网会提供按钮。',
    8: '第1-7步已齐，请基于【诊断档案】检索知识库并输出诊断报告，不要再提问，不要声称信息缺失。',
  };
  const hint = stepHints[uiStep] || `请继续第${uiStep}步，一次只问一个问题。`;
  const archive = formatDiagSlotsForApi();
  return (
    `【专属合规诊断进行中·模式A】用户本轮答复：${String(text || '').trim()}。` +
    (platform ? `已确认销售平台：${platform}。` : '') +
    `${hint}` +
    '禁止重新询问模式选择，禁止输出欢迎语，禁止说“仅凭…无法判断需求”；步号必须正确（2=主体，3=发货）。' +
    `\n${archive}`
  );
}

function looksLikeRejectedDiagnosisStart(text) {
  const t = String(text || '');
  return /不是.*自动命令|不是一个自动命令|具体想了解什么|告诉我具体|需要您告诉我具体/.test(t);
}

/** Fallback chips by diagnosis wizard step when bot wording is atypical.
 *  Order: 1平台 → 2主体 → 3发货 → 4出口 → 5发票 → 6产品类别 → 7销售额
 */
function diagQuickReplySetForStep(step, platformLabel) {
  switch (step) {
    case 1:
      return 'platform';
    case 2:
      return 'entity';
    case 3:
      return shippingQuickReplySetForPlatform(platformLabel);
    case 4:
      return 'exportMode';
    case 5:
      return 'invoice';
    case 6:
      return 'productCategory';
    case 7:
      return 'revenue';
    default:
      return null;
  }
}

/** Vague answers that need free-text clarification before advancing the wizard. */
function isVagueDiagnosisAnswer(text, step) {
  const t = String(text || '').trim();
  if (!t) return false;
  if (/^(不清楚|不知道|暂不清楚|不太清楚|不确定)$/.test(t)) return true;
  // 3=发货其他, 4=出口其他, 6=产品类别其他（主体已改为「其他境外公司」完整选项，不再视为模糊）
  if (/^(其他|其它|其他发货方式|其他（不在以上分类）)$/.test(t)) {
    return step === 3 || step === 4 || step === 6;
  }
  return false;
}

/** Agent is clarifying a prior vague answer — no chips, free-text only. */
function looksLikeDiagnosisClarificationAsk(botText) {
  const t = String(botText || '');
  if (!t) return false;
  if (/(回到第|先回到|先确认一下|再确认一下|能否具体说明|请具体说明|可以具体说明|请补充说明|补充一下)/.test(t)) {
    return true;
  }
  if (/(提到|您说|选择了).{0,12}(其他|其它)/.test(t) && /(具体|说明|哪一种|还是)/.test(t)) {
    return true;
  }
  return false;
}

function inferClarificationStepFromBotText(botText) {
  const t = String(botText || '');
  const m = t.match(/第\s*([一二三四五六七1-7])\s*步/);
  if (!m) {
    if (/出口方式/.test(t)) return 4;
    if (/注册主体|店铺主体/.test(t)) return 2;
    if (/发货方式|发货模式/.test(t)) return 3;
    if (/产品属于|产品类别/.test(t)) return 6;
    if (/年销售额|销售额/.test(t)) return 7;
    return 0;
  }
  const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7 };
  const raw = m[1];
  if (map[raw]) return map[raw];
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 && n <= 7 ? n : 0;
}

/** Infer step number from bot copy like「第三步」or「3.」when present. */
function inferDiagStepFromBotText(botText) {
  const t = String(botText || '');
  const mNum = t.match(/(?:^|\n)\s*(\d+)\.\s+\S/);
  if (mNum) {
    const n = parseInt(mNum[1], 10);
    if (Number.isFinite(n) && n >= 1 && n <= 8) return n;
  }
  const m = t.match(/第\s*([一二三四五六七八1-8])\s*步/);
  if (!m) return 0;
  const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8 };
  const raw = m[1];
  if (map[raw]) return map[raw];
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 && n <= 8 ? n : 0;
}

/**
 * Resolve quick-reply chip set for the current bot message.
 * Wizard chips (平台/主体/发货/出口/发票/产品类别/销售额) ONLY in Mode A steps 1–7.
 * Mode-select chips only for the welcome choice. Never show wizard chips in 特定问题直答.
 */
function resolveDiagQuickReplySet(botText, uiMode, uiStep, platformLabel) {
  const detected = detectDiagQuickReplySet(botText);

  // Welcome / mode choice — allowed outside the 7-step wizard
  if (detected === 'modeSelect') return 'modeSelect';

  // Hard gate: no diagnosis option chips unless exclusive diagnosis is collecting answers
  if (uiMode !== 'diagnosis' || uiStep < 1 || uiStep > 7) {
    return null;
  }

  // Do not show yes/no or consult chips during the 7-step collection
  if (detected === 'consultFollowup' || detected === 'yesNo') {
    return null;
  }

  const inferred = inferDiagStepFromBotText(botText);
  const step =
    inferred >= 1 && inferred <= 7
      ? inferred
      : uiStep;
  const stepKey = diagQuickReplySetForStep(step, platformLabel);

  // If wizard/bot step is known, never let prior-slot keyword echoes override the step chips
  // Order: 1平台 → 2主体 → 3发货 → 4出口 → 5发票 → 6产品类别 → 7销售额
  const slotStep = {
    platform: 1,
    entity: 2,
    exportMode: 4,
    invoice: 5,
    productCategory: 6,
    revenue: 7,
  };
  if (detected && slotStep[detected] && step >= 1 && step <= 7 && stepKey) {
    if (slotStep[detected] !== step) return stepKey;
  }

  // Strong slot matches from the active question (aligned with current step)
  if (
    detected === 'platform' ||
    detected === 'entity' ||
    detected === 'invoice' ||
    detected === 'exportMode' ||
    detected === 'productCategory' ||
    detected === 'revenue'
  ) {
    return detected;
  }

  // Shipping: only on step 3; otherwise prefer wizard step (acks often echo 全托管/FBA)
  if (detected && /^shipping/.test(detected)) {
    if (step !== 3 && stepKey) return stepKey;
    if (step === 3 && stepKey && /^shipping/.test(stepKey)) return stepKey;
    return detected;
  }

  if (!detected && stepKey) return stepKey;
  return detected;
}

function initAiChatbot() {
  const root = document.getElementById('aiChatbot');
  const newBtn = document.getElementById('aiChatbotNew');
  const form = document.getElementById('aiChatbotForm');
  const input = document.getElementById('aiChatbotInput');
  const messages = document.getElementById('aiChatbotMessages');
  const quickEl = document.getElementById('diagQuickReplies');
  if (!root || !form || !input || !messages) return;

  const CONV_KEY = 'daoith_diagnosis_conversation_id';
  const COUNT_KEY = 'daoith_diagnosis_ask_count';
  const BOUND_KEY = 'daoith_diagnosis_conversation_bound';
  const MODE_KEY = 'daoith_diagnosis_ui_mode';
  const STEP_KEY = 'daoith_diagnosis_ui_step';
  const PLATFORM_KEY = 'daoith_diagnosis_ui_platform';
  const FREE_ASK_LIMIT = 10;
  let busy = false;

  try {
    ['daoith_ai_answer_cache_v1', 'daoith_ai_answer_cache_v2', 'daoith_ai_answer_cache_v3', 'daoith_ai_answer_cache_v4'].forEach(
      (k) => localStorage.removeItem(k)
    );
  } catch {
    /* ignore */
  }

  const newUuid = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `c-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const getAskCount = () => {
    const n = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const setAskCount = (n) => {
    localStorage.setItem(COUNT_KEY, String(Math.max(0, n | 0)));
  };

  const getUiMode = () => localStorage.getItem(MODE_KEY) || '';
  const getUiStep = () => {
    const n = parseInt(localStorage.getItem(STEP_KEY) || '0', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const getUiPlatform = () => localStorage.getItem(PLATFORM_KEY) || '';

  const setUiWizard = (mode, step, platform) => {
    if (mode != null) localStorage.setItem(MODE_KEY, mode);
    if (step != null) localStorage.setItem(STEP_KEY, String(Math.max(0, step | 0)));
    if (platform != null) localStorage.setItem(PLATFORM_KEY, platform);
  };

  const resetUiWizard = () => {
    localStorage.setItem(MODE_KEY, '');
    localStorage.setItem(STEP_KEY, '0');
    localStorage.setItem(PLATFORM_KEY, '');
    clearDiagSlots();
  };

  /** Track mode/step so diagnosis keeps clickable answer chips each turn. */
  const trackUserWizardAnswer = (text) => {
    const t = String(text || '').trim();
    if (/开启专属合规诊断/.test(t)) {
      clearDiagSlots();
      setUiWizard('diagnosis', 1, '');
      return;
    }
    if (/我有特定问题想直接提问|特定问题想直接提问/.test(t)) {
      setUiWizard('qa', 0, '');
      return;
    }
    if (/重新诊断|换个模式|我要逐步诊断/.test(t)) {
      clearDiagSlots();
      setUiWizard('diagnosis', 1, '');
      return;
    }
    if (getUiMode() !== 'diagnosis') return;
    const step = getUiStep();
    // 「其他」等模糊答复先不跳步，等 Agent/用户补全后再前进
    if (isVagueDiagnosisAnswer(t, step)) return;
    if (step === 1) {
      setDiagSlot('platform', t);
      setUiWizard('diagnosis', 2, t);
    } else if (step === 2) {
      setDiagSlot('entity', t);
      setUiWizard('diagnosis', 3, getUiPlatform());
    } else if (step === 3) {
      setDiagSlot('shipping', t);
      if (isPlatformDomesticWarehouseShipping(t)) {
        setDiagSlot('exportMode', '由平台安排出口');
      }
      setUiWizard('diagnosis', 4, getUiPlatform());
    } else if (step === 4) {
      setDiagSlot('exportMode', t);
      setUiWizard('diagnosis', 5, getUiPlatform());
    } else if (step === 5) {
      setDiagSlot('invoice', t);
      setUiWizard('diagnosis', 6, getUiPlatform());
    } else if (step === 6) {
      setDiagSlot('productCategory', t);
      setUiWizard('diagnosis', 7, getUiPlatform());
    } else if (step === 7) {
      setDiagSlot('revenue', t);
      setUiWizard('diagnosis', 8, getUiPlatform());
    }
  };

  const scrollDiagChatToBottom = () => {
    // Only scroll the messages pane — never scrollIntoView (that jumps the whole page to top).
    const run = () => {
      try {
        const pageX = window.scrollX;
        const pageY = window.scrollY;
        messages.scrollTop = messages.scrollHeight;
        if (quickEl && !quickEl.hidden && quickEl.scrollHeight > quickEl.clientHeight) {
          quickEl.scrollTop = 0;
        }
        if (window.scrollX !== pageX || window.scrollY !== pageY) {
          window.scrollTo(pageX, pageY);
        }
      } catch {
        /* ignore */
      }
    };
    run();
    requestAnimationFrame(() => {
      run();
      requestAnimationFrame(run);
    });
    // Chips / rich HTML can settle after paint
    setTimeout(run, 50);
  };

  const ensureConversationId = () => {
    let id = localStorage.getItem(CONV_KEY);
    if (!id) {
      id = newUuid();
      localStorage.setItem(CONV_KEY, id);
      localStorage.setItem(BOUND_KEY, '0');
      setAskCount(0);
      resetUiWizard();
    }
    return id;
  };

  const resetConversation = () => {
    const id = newUuid();
    localStorage.setItem(CONV_KEY, id);
    localStorage.setItem(BOUND_KEY, '0');
    setAskCount(0);
    resetUiWizard();
    return id;
  };

  const isConversationBound = () => localStorage.getItem(BOUND_KEY) === '1';

  const persistConversationId = (id, bound) => {
    if (!id) return;
    localStorage.setItem(CONV_KEY, id);
    localStorage.setItem(BOUND_KEY, bound ? '1' : '0');
  };

  const clearQuickReplies = () => {
    if (!quickEl) return;
    quickEl.classList.remove('is-stacked');
    quickEl.innerHTML = '';
    quickEl.hidden = true;
  };

  const renderQuickReplyButtons = (options, layout) => {
    if (!quickEl || !options?.length) return;
    clearQuickReplies();
    if (layout === 'stacked') quickEl.classList.add('is-stacked');
    const label = document.createElement('div');
    label.className = 'diag-quick-replies-label';
    label.textContent = '请选择下方选项继续';
    quickEl.appendChild(label);
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'diag-quick-reply-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (busy) return;
        input.value = opt;
        form.requestSubmit();
      });
      quickEl.appendChild(btn);
    });
    quickEl.hidden = false;
  };

  const showQuickReplies = (botText) => {
    if (!quickEl) return;
    if (looksLikeFullDiagnosisPlan(botText) || looksLikeDiagnosisPlanStreaming(botText)) {
      clearQuickReplies();
      return;
    }

    // 澄清追问：只让用户打字，不展示快捷选项
    if (looksLikeDiagnosisClarificationAsk(botText)) {
      const clarifyStep = inferClarificationStepFromBotText(botText);
      if (getUiMode() === 'diagnosis' && clarifyStep >= 1 && clarifyStep <= 7) {
        setUiWizard('diagnosis', clarifyStep, getUiPlatform());
      }
      clearQuickReplies();
      return;
    }

    const uiMode = getUiMode();
    const uiStep = getUiStep();
    const setKey = resolveDiagQuickReplySet(botText, uiMode, uiStep, getUiPlatform());
    if (!setKey) {
      clearQuickReplies();
      return;
    }

    // Double gate: wizard option chips only while Mode A is collecting steps 1–7
    const isWizardChip =
      setKey === 'platform' ||
      setKey === 'entity' ||
      setKey === 'exportMode' ||
      setKey === 'invoice' ||
      setKey === 'productCategory' ||
      setKey === 'revenue' ||
      /^shipping/.test(setKey);
    if (isWizardChip && (uiMode !== 'diagnosis' || uiStep < 1 || uiStep > 7)) {
      clearQuickReplies();
      return;
    }

    const options =
      setKey === 'entity'
        ? entityOptionsForPlatform(getUiPlatform())
        : DIAG_QUICK_REPLY_SETS[setKey] || [];
    if (!options.length) {
      clearQuickReplies();
      return;
    }
    renderQuickReplyButtons(options, setKey === 'productCategory' ? 'stacked' : 'wrap');
    scrollDiagChatToBottom();
  };

  ensureConversationId();

  const appendBubble = (text, who) => {
    const div = document.createElement('div');
    div.className = `ai-chatbot-bubble ${who === 'user' ? 'is-user' : 'is-bot'}`;
    if (who === 'bot') {
      div.classList.add('is-rich');
      div.innerHTML = renderChatBubbleHtml(text);
    } else {
      div.textContent = text;
    }
    messages.appendChild(div);
    scrollDiagChatToBottom();
    return div;
  };

  const setBotBubble = (el, text) => {
    if (!el) return;
    el.classList.add('is-bot', 'is-rich');
    el.innerHTML = renderChatBubbleHtml(text);
    scrollDiagChatToBottom();
  };

  const clearMessages = () => {
    messages.innerHTML = '';
  };

  const showWelcome = () => {
    // Welcome always restarts mode choice — clear stale diagnosis step chips from prior sessions
    resetUiWizard();

    // Rich welcome card — controlled HTML only
    const greetEl = document.createElement('div');
    greetEl.className = 'ai-chatbot-bubble is-bot is-welcome';
    greetEl.innerHTML =
      `<p class="welcome-lead">您好，欢迎使用道一合规诊断助手！</p>` +
      `<p class="welcome-ask">请选择：` +
      `<strong>开启专属合规诊断</strong>（需微信登录，按步骤生成诊断报告），或 ` +
      `<strong>我有特定问题想直接提问</strong>（基于知识库即时解答）。</p>`;
    messages.appendChild(greetEl);

    showQuickReplies('请选择：开启专属合规诊断，还是我有特定问题想直接提问？');
    scrollDiagChatToBottom();
  };

  const startNewConversation = () => {
    resetConversation();
    clearMessages();
    clearQuickReplies();
    showWelcome();
    input.value = '';
    input.focus();
  };

  newBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    startNewConversation();
  });

  // Embedded panel: show welcome immediately
  if (!messages.childElementCount) showWelcome();

  /** Background Dify warm-up / step sync after instant local wizard UI. */
  let diagnosisWarmPromise = null;

  const sendMessage = async (text) => {
    if (!text || busy) return;

    const loggedIn = Boolean(window.DAOITH_AUTH?.isLoggedIn?.());
    const returnToAi = `${window.location.pathname}${window.location.search}#ai-solution`;
    const wantsExclusiveDiagnosis =
      /开启专属合规诊断/.test(text) || /重新诊断|换个模式|我要逐步诊断/.test(text);

    // 专属合规诊断：选模式时即要求微信登录（不要等到出方案才拦）
    if (wantsExclusiveDiagnosis && !loggedIn) {
      window.DAOITH_AUTH?.requireLogin?.('ai_diagnosis_start', returnToAi, { silent: true });
      return;
    }

    // 专属方案生成次数上限（按登录用户）
    if (wantsExclusiveDiagnosis && loggedIn && isDiagnosisPlanLimitReached()) {
      clearQuickReplies();
      input.value = '';
      appendBubble(text, 'user');
      appendBubble(DIAG_PLAN_LIMIT_MSG, 'bot');
      renderQuickReplyButtons(DIAG_QUICK_REPLY_SETS.consultFollowup);
      return;
    }

    // 预约专家 1v1：本地引导 + 展示服务卡片（不走 Dify）
    if (wantsExpertBooking(text)) {
      clearQuickReplies();
      input.value = '';
      appendBubble(text, 'user');
      appendBubble(EXPERT_BOOKING_MSG, 'bot');
      showExpertConsultServiceRecs();
      return;
    }

    const askCount = getAskCount();
    if (!loggedIn && askCount >= FREE_ASK_LIMIT) {
      appendBubble(
        '免费体验已达 10 次。请微信登录后继续咨询，登录后可保留当前会话记忆。',
        'bot'
      );
      window.DAOITH_AUTH?.requireLogin?.('ai_chat', returnToAi);
      return;
    }

    clearQuickReplies();
    input.value = '';
    appendBubble(text, 'user');

    // Mode switch: always start a fresh Dify conversation (avoid stale上下文跑偏)
    const isModeSelect =
      /开启专属合规诊断/.test(text) || /我有特定问题想直接提问|特定问题想直接提问/.test(text);
    if (isModeSelect || wantsExclusiveDiagnosis) {
      resetConversation();
    }

    const prevMode = getUiMode();
    const prevStep = getUiStep();
    trackUserWizardAnswer(text);

    // Fast path: show step-1 locally immediately (don't block on Dify after login)
    if (wantsExclusiveDiagnosis && loggedIn) {
      const localAsk = localDiagnosisPlatformAsk();
      appendBubble(localAsk, 'bot');
      showQuickReplies(localAsk);

      const { difyChatEndpoint } = getDifyConfig();
      const endpoint = difyChatEndpoint || '/v1/diagnosis/chat-messages';
      const warmQuery = normalizeDiagnosisModeQuery('开启专属合规诊断');
      diagnosisWarmPromise = (async () => {
        try {
          const result = await callDify({
            endpoint,
            query: warmQuery,
            inputs: {},
            conversationId: '',
            returnMeta: true,
          });
          const nextId = result?.conversationId;
          if (nextId) persistConversationId(nextId, true);
          return result;
        } catch (err) {
          console.warn('[diagnosis] warm start failed', err);
          return null;
        }
      })();
      return;
    }

    // Fast path: after platform → step-2 注册主体
    if (prevMode === 'diagnosis' && prevStep === 1 && getUiStep() === 2) {
      const platform = getUiPlatform() || String(text || '').trim();
      const localAsk = localDiagnosisEntityAsk(platform);
      appendBubble(localAsk, 'bot');
      showQuickReplies(localAsk);

      const prevWarm = diagnosisWarmPromise;
      const { difyChatEndpoint } = getDifyConfig();
      const endpoint = difyChatEndpoint || '/v1/diagnosis/chat-messages';
      diagnosisWarmPromise = (async () => {
        try {
          if (prevWarm) await prevWarm;
          const convId = isConversationBound() ? localStorage.getItem(CONV_KEY) || '' : '';
          const query = buildDiagnosisApiQuery(text, 'diagnosis', 2, platform);
          const result = await callDify({
            endpoint,
            query,
            inputs: {},
            conversationId: convId,
            returnMeta: true,
          });
          if (result?.conversationId) persistConversationId(result.conversationId, true);
          return result;
        } catch (err) {
          console.warn('[diagnosis] step2 entity sync failed', err);
          return null;
        }
      })();
      return;
    }

    // Fast path: after entity → step-3 发货方式
    if (prevMode === 'diagnosis' && prevStep === 2 && getUiStep() === 3) {
      const platform = getUiPlatform();
      const localAsk = localDiagnosisShippingAsk(platform);
      appendBubble(`好的，已记录注册主体。\n\n${localAsk}`, 'bot');
      showQuickReplies(localAsk);

      const prevWarm = diagnosisWarmPromise;
      const { difyChatEndpoint } = getDifyConfig();
      const endpoint = difyChatEndpoint || '/v1/diagnosis/chat-messages';
      diagnosisWarmPromise = (async () => {
        try {
          if (prevWarm) await prevWarm;
          const convId = isConversationBound() ? localStorage.getItem(CONV_KEY) || '' : '';
          const query = buildDiagnosisApiQuery(text, 'diagnosis', 3, platform);
          const result = await callDify({
            endpoint,
            query,
            inputs: {},
            conversationId: convId,
            returnMeta: true,
          });
          if (result?.conversationId) persistConversationId(result.conversationId, true);
          return result;
        } catch (err) {
          console.warn('[diagnosis] step3 shipping sync failed', err);
          return null;
        }
      })();
      return;
    }

    // Fast path: 平台国内仓发货 → 自动记「由平台安排出口」，跳到第五步发票
    if (
      prevMode === 'diagnosis' &&
      prevStep === 3 &&
      getUiStep() === 4 &&
      isPlatformDomesticWarehouseShipping(text)
    ) {
      setUiWizard('diagnosis', 5, getUiPlatform());
      setDiagSlot('shipping', String(text).trim());
      setDiagSlot('exportMode', '由平台安排出口');
      const note =
        `好的，已记录发货方式为「${String(text).trim()}」。` +
        `该情形通常由平台统一安排出口，已记为「由平台安排出口」。`;
      const localAsk = localDiagnosisInvoiceAsk(note);
      appendBubble(localAsk, 'bot');
      showQuickReplies(localAsk);

      const prevWarm = diagnosisWarmPromise;
      const { difyChatEndpoint } = getDifyConfig();
      const endpoint = difyChatEndpoint || '/v1/diagnosis/chat-messages';
      diagnosisWarmPromise = (async () => {
        try {
          if (prevWarm) await prevWarm;
          const convId = isConversationBound() ? localStorage.getItem(CONV_KEY) || '' : '';
          const query =
            buildDiagnosisApiQuery(text, 'diagnosis', 5, getUiPlatform()) +
            '发货为平台国内仓类，出口已记为「由平台安排出口」，请直接问第五步发票，不要再问第四步，后续报告必须采信该出口方式。';
          const result = await callDify({
            endpoint,
            query,
            inputs: {},
            conversationId: convId,
            returnMeta: true,
          });
          if (result?.conversationId) persistConversationId(result.conversationId, true);
          return result;
        } catch (err) {
          console.warn('[diagnosis] auto platform-export sync failed', err);
          return null;
        }
      })();
      return;
    }

    // Fast path: after shipping → step-4 出口方式
    if (prevMode === 'diagnosis' && prevStep === 3 && getUiStep() === 4) {
      const platform = getUiPlatform();
      const localAsk = localDiagnosisExportAsk();
      appendBubble(`好的，已记录发货方式。\n\n${localAsk}`, 'bot');
      showQuickReplies(localAsk);

      const prevWarm = diagnosisWarmPromise;
      const { difyChatEndpoint } = getDifyConfig();
      const endpoint = difyChatEndpoint || '/v1/diagnosis/chat-messages';
      diagnosisWarmPromise = (async () => {
        try {
          if (prevWarm) await prevWarm;
          const convId = isConversationBound() ? localStorage.getItem(CONV_KEY) || '' : '';
          const query = buildDiagnosisApiQuery(text, 'diagnosis', 4, platform);
          const result = await callDify({
            endpoint,
            query,
            inputs: {},
            conversationId: convId,
            returnMeta: true,
          });
          if (result?.conversationId) persistConversationId(result.conversationId, true);
          return result;
        } catch (err) {
          console.warn('[diagnosis] step4 export sync failed', err);
          return null;
        }
      })();
      return;
    }

    // Fast path: after export → step-5 发票
    if (prevMode === 'diagnosis' && prevStep === 4 && getUiStep() === 5) {
      const platform = getUiPlatform();
      const localAsk = localDiagnosisInvoiceAsk('好的，已记录出口方式。');
      appendBubble(localAsk, 'bot');
      showQuickReplies(localAsk);

      const prevWarm = diagnosisWarmPromise;
      const { difyChatEndpoint } = getDifyConfig();
      const endpoint = difyChatEndpoint || '/v1/diagnosis/chat-messages';
      diagnosisWarmPromise = (async () => {
        try {
          if (prevWarm) await prevWarm;
          const convId = isConversationBound() ? localStorage.getItem(CONV_KEY) || '' : '';
          const query = buildDiagnosisApiQuery(text, 'diagnosis', 5, platform);
          const result = await callDify({
            endpoint,
            query,
            inputs: {},
            conversationId: convId,
            returnMeta: true,
          });
          if (result?.conversationId) persistConversationId(result.conversationId, true);
          return result;
        } catch (err) {
          console.warn('[diagnosis] step5 invoice sync failed', err);
          return null;
        }
      })();
      return;
    }

    // Fast path: after invoice → step-6 产品类别
    if (prevMode === 'diagnosis' && prevStep === 5 && getUiStep() === 6) {
      const platform = getUiPlatform();
      const localAsk = localDiagnosisProductCategoryAsk('好的，已记录发票情况。');
      appendBubble(localAsk, 'bot');
      showQuickReplies(localAsk);

      const prevWarm = diagnosisWarmPromise;
      const { difyChatEndpoint } = getDifyConfig();
      const endpoint = difyChatEndpoint || '/v1/diagnosis/chat-messages';
      diagnosisWarmPromise = (async () => {
        try {
          if (prevWarm) await prevWarm;
          const convId = isConversationBound() ? localStorage.getItem(CONV_KEY) || '' : '';
          const query = buildDiagnosisApiQuery(text, 'diagnosis', 6, platform);
          const result = await callDify({
            endpoint,
            query,
            inputs: {},
            conversationId: convId,
            returnMeta: true,
          });
          if (result?.conversationId) persistConversationId(result.conversationId, true);
          return result;
        } catch (err) {
          console.warn('[diagnosis] step6 productCategory sync failed', err);
          return null;
        }
      })();
      return;
    }

    // Fast path: after product category → step-7 销售额
    if (prevMode === 'diagnosis' && prevStep === 6 && getUiStep() === 7) {
      const platform = getUiPlatform();
      const localAsk = localDiagnosisRevenueAsk('好的，已记录产品类别。');
      appendBubble(localAsk, 'bot');
      showQuickReplies(localAsk);

      const prevWarm = diagnosisWarmPromise;
      const { difyChatEndpoint } = getDifyConfig();
      const endpoint = difyChatEndpoint || '/v1/diagnosis/chat-messages';
      diagnosisWarmPromise = (async () => {
        try {
          if (prevWarm) await prevWarm;
          const convId = isConversationBound() ? localStorage.getItem(CONV_KEY) || '' : '';
          const query = buildDiagnosisApiQuery(text, 'diagnosis', 7, platform);
          const result = await callDify({
            endpoint,
            query,
            inputs: {},
            conversationId: convId,
            returnMeta: true,
          });
          if (result?.conversationId) persistConversationId(result.conversationId, true);
          return result;
        } catch (err) {
          console.warn('[diagnosis] step7 revenue sync failed', err);
          return null;
        }
      })();
      return;
    }

    busy = true;

    const typing = document.createElement('div');
    typing.className = 'ai-chatbot-bubble is-bot';
    typing.textContent = '正在诊断…';
    messages.appendChild(typing);
    scrollDiagChatToBottom();

    // Q7 answered → immediately show plan-generating status + right-panel working scene
    const shouldGeneratePlanNow =
      prevMode === 'diagnosis' && prevStep === 7 && getUiStep() >= 8;
    if (shouldGeneratePlanNow) {
      showResultWorking();
      typing.classList.add('is-plan-status');
      const loggedInNow = Boolean(window.DAOITH_AUTH?.isLoggedIn?.());
      typing.textContent = loggedInNow
        ? DIAG_PLAN_STATUS_MSG
        : `${DIAG_PLAN_STATUS_MSG}。请先微信登录以保存方案并继续`;
      if (!loggedInNow) {
        window.DAOITH_AUTH?.requireLogin?.(
          'ai_plan',
          `${window.location.pathname}${window.location.search}#ai-solution`
        );
      }
    }

    const ctx = window.__daoithLastPlanCtx || null;
    try {
      if (diagnosisWarmPromise) {
        await diagnosisWarmPromise;
        diagnosisWarmPromise = null;
      }

      // Re-read after warm — do not use a stale id from before warm finished
      const sessionId = ensureConversationId();
      const apiQuery = buildDiagnosisApiQuery(text, getUiMode(), getUiStep(), getUiPlatform());

      const hsForRefund = extractHsFromRefundQuestion(text);
      if (hsForRefund) {
        const resolved = await resolveExportRefundRate(hsForRefund);
        if (resolved?.ok && resolved.rate != null) {
          const reply = formatStructuredRefundReply(resolved, hsForRefund);
          setAskCount(askCount + 1);
          setBotBubble(typing, reply);
          showQuickReplies(reply);
          return;
        }
        setAskCount(askCount + 1);
        const miss = `未查到海关编码 ${hsForRefund} 的出口退税率，请核对编码后重试，或以国家税务总局出口退税率文库为准。`;
        setBotBubble(typing, miss);
        showQuickReplies(miss);
        return;
      }

      const aluminumReply = buildAluminumProductsRefundReply(text);
      if (aluminumReply) {
        setAskCount(askCount + 1);
        if (shouldRouteLongAnswerToPlanPanel(aluminumReply)) {
          publishDiagnosisPlanToResultPanel(aluminumReply, { kind: 'qa' });
          typing.classList.add('is-plan-status');
          typing.textContent = QA_LONG_ANSWER_CHAT_TIP;
          clearQuickReplies();
        } else {
          setBotBubble(typing, aluminumReply);
          showQuickReplies(aluminumReply);
        }
        return;
      }

      const { difyChatEndpoint } = getDifyConfig();
      const endpoint = difyChatEndpoint || '/v1/diagnosis/chat-messages';

      let streamingPlan = false;
      let streamingLongQa = false;
      let loginPromptedForPlan = shouldGeneratePlanNow && !loggedIn;
      let planCountedThisTurn = false;
      const beginPlanRouting = () => {
        if (streamingPlan) {
          typing.classList.add('is-plan-status');
          const loggedInNow = Boolean(window.DAOITH_AUTH?.isLoggedIn?.());
          typing.textContent = loggedInNow
            ? DIAG_PLAN_STATUS_MSG
            : `${DIAG_PLAN_STATUS_MSG}。请先微信登录以保存方案并继续`;
          if (!document.getElementById('resultWorking')) showResultWorking();
          return;
        }
        streamingPlan = true;
        showResultWorking();
        typing.classList.add('is-plan-status');
        const loggedInNow = Boolean(window.DAOITH_AUTH?.isLoggedIn?.());
        typing.textContent = loggedInNow
          ? DIAG_PLAN_STATUS_MSG
          : `${DIAG_PLAN_STATUS_MSG}。请先微信登录以保存方案并继续`;
        if (!loginPromptedForPlan && !loggedInNow) {
          loginPromptedForPlan = true;
          window.DAOITH_AUTH?.requireLogin?.(
            'ai_plan',
            `${window.location.pathname}${window.location.search}#ai-solution`
          );
        }
      };
      if (shouldGeneratePlanNow) beginPlanRouting();

      const beginLongQaRouting = () => {
        if (streamingLongQa) return;
        streamingLongQa = true;
        typing.classList.add('is-plan-status');
        typing.textContent = QA_LONG_ANSWER_CHAT_TIP;
      };

      const paintStream = (partial) => {
        // Never fall back to raw partial — that re-exposes <think> / CoT in the chat bubble
        const cleaned = sanitizeAiAnswer(partial);
        if (!cleaned) {
          // While model is still thinking / retrieving, keep status text only
          if (getUiMode() === 'diagnosis' && getUiStep() >= 6) {
            beginPlanRouting();
          }
          return;
        }
        const clean = stripDiagnosisIntroBoilerplate(cleaned);
        if (!clean) {
          if (getUiMode() === 'diagnosis' && getUiStep() >= 6) beginPlanRouting();
          return;
        }
        // Full diagnosis → right-hand plan panel
        if (streamingPlan || shouldRouteDiagnosisToPlanPanel(clean)) {
          beginPlanRouting();
          // Keep typing animation until enough plan content arrives
          if (
            looksLikeDiagnosisPlanStreaming(clean) ||
            looksLikeFullDiagnosisPlan(clean) ||
            clean.length >= 280
          ) {
            publishDiagnosisPlanToResultPanel(clean, { kind: 'diagnosis' });
          }
          return;
        }
        // Mid-report CoT that slipped past sanitize: still never show in chat
        if (
          getUiMode() === 'diagnosis' &&
          getUiStep() >= 6 &&
          /(让我检索|知识库返回|属于路径[ABC]|需要检索的知识库|诊断档案)/.test(clean) &&
          !/(【核心风险诊断】|【合规方案】)/.test(clean)
        ) {
          beginPlanRouting();
          return;
        }
        // Specific Q&A (and other non-plan replies) longer than 100 chars → right panel
        if (streamingLongQa || shouldRouteLongAnswerToPlanPanel(clean)) {
          beginLongQaRouting();
          publishDiagnosisPlanToResultPanel(clean, { kind: 'qa' });
          return;
        }
        setBotBubble(typing, clean);
        scrollDiagChatToBottom();
      };

      const callChat = (conversationId) => callDifyStream({
        endpoint,
        query: apiQuery,
        inputs: {},
        conversationId,
        onChunk: paintStream,
      });

      let result;
      let conversationId = isModeSelect ? '' : (isConversationBound() ? sessionId : '');
      try {
        result = await callChat(conversationId);
      } catch (firstErr) {
        const msg = String(firstErr?.message || '');
        // Streaming/CORS失败时回退 blocking
        if (/无法连接|Failed to fetch|NetworkError/i.test(msg)) {
          typing.textContent = '正在诊断…';
          result = await callDify({
            endpoint,
            query: apiQuery,
            inputs: {},
            conversationId,
            returnMeta: true,
          });
        } else if (conversationId && /conversation|not exist|not_found|无效|Conversation/i.test(msg)) {
          conversationId = '';
          persistConversationId(sessionId, false);
          typing.textContent = '正在诊断…';
          result = await callChat('');
        } else {
          throw firstErr;
        }
      }

      const nextId = result.conversationId || sessionId;
      persistConversationId(nextId, true);
      setAskCount(askCount + 1);

      let answer = sanitizeAiAnswer(result.text);
      if (!answer || answer.length < 8) {
        // Do NOT fall back to raw result.text (often still contains think / CoT)
        const retry = sanitizeAiAnswer(result.text);
        answer = retry || buildLocalChatReply(text, ctx) || '';
      }
      answer = sanitizeAiAnswer(answer);
      answer = stripDiagnosisIntroBoilerplate(answer || '');
      answer = correctAluminumRefundHallucinations(answer);
      if (!answer || answer.length < 4) {
        if (streamingPlan || (getUiMode() === 'diagnosis' && getUiStep() >= 6)) {
          beginPlanRouting();
          typing.classList.add('is-plan-status');
          typing.textContent =
            '方案仍在生成中；若右侧暂无内容，请稍后重试或点击「新建对话」。思考过程不会显示在对话框中。';
          clearQuickReplies();
          return;
        }
        persistConversationId(newUuid(), false);
        throw new Error('AI 返回内容为空，请点击「新建对话」后重试');
      }

      // If API app ignores mode-A start, fall back to local step-1 so官网仍可点选继续
      if (
        getUiMode() === 'diagnosis' &&
        getUiStep() === 1 &&
        (looksLikeRejectedDiagnosisStart(answer) || !/电商平台|哪个平台|什么平台|在哪个平台/.test(answer))
      ) {
        answer = localDiagnosisPlatformAsk();
      }

      // If Agent restarts mode-select mid-diagnosis, keep wizard on track locally
      if (getUiMode() === 'diagnosis' && getUiStep() >= 2 && looksLikeModeSelectReply(answer)) {
        if (getUiStep() === 2) answer = localDiagnosisEntityAsk(getUiPlatform());
        else if (getUiStep() === 3) answer = localDiagnosisShippingAsk(getUiPlatform());
        else answer = `好的，已记录。请继续回答 ${getUiStep()}. 相关问题。`;
      }

      if (streamingPlan || shouldRouteDiagnosisToPlanPanel(answer)) {
        beginPlanRouting();
        publishDiagnosisPlanToResultPanel(answer, { kind: 'diagnosis' });
        if (!planCountedThisTurn) {
          planCountedThisTurn = true;
          bumpDiagnosisPlanCount();
        }
        typing.classList.add('is-plan-status');
        const loggedInNow = Boolean(window.DAOITH_AUTH?.isLoggedIn?.());
        typing.textContent = loggedInNow
          ? DIAG_PLAN_DONE_MSG
          : `${DIAG_PLAN_DONE_MSG}。请先微信登录以保存方案并继续`;
        clearQuickReplies();
      } else if (streamingLongQa || shouldRouteLongAnswerToPlanPanel(answer)) {
        beginLongQaRouting();
        publishDiagnosisPlanToResultPanel(answer, { kind: 'qa' });
        typing.classList.add('is-plan-status');
        typing.textContent = QA_LONG_ANSWER_CHAT_TIP;
        clearQuickReplies();
      } else {
        setBotBubble(typing, answer);
        showQuickReplies(answer);
      }
    } catch (err) {
      const msg = String(err?.message || '');
      if (/HTTP|无法连接|Failed to fetch/i.test(msg)) {
        setBotBubble(typing, `**暂时无法连接**\n\n- ${msg}\n- 请稍后重试`);
      } else {
        setBotBubble(
          typing,
          `**暂时未能完成回答**\n\n- ${msg || '未知错误'}\n- 请点击「新建对话」后重试`
        );
      }
    } finally {
      busy = false;
      scrollDiagChatToBottom();
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    await sendMessage(text);
  });
}

/** Detect structured full diagnosis / solution replies from the diagnosis Agent. */
function looksLikeFullDiagnosisPlan(text) {
  const t = String(text || '');
  if (t.length < 160) return false;
  const markers = [
    /核心风险诊断|风险诊断|合规风险/,
    /合规方案|解决方案|行动建议/,
    /注意事项|业务流程图|流程图/,
    /问题理解|业务画像|业务背景/,
    /【核心风险诊断】|【合规方案】|【行动建议】/,
    /###?\s*1[）).、]|情形一|情形二|情形三/,
  ];
  if (markers.filter((re) => re.test(t)).length >= 2) return true;
  if (t.length >= 500 && /【核心风险诊断】|【合规方案】/.test(t)) return true;
  if (t.length >= 650 && /#{1,3}\s+/.test(t) && /(风险|方案|建议)/.test(t)) return true;
  return false;
}

/** Earlier mid-stream hint that the Agent started a formal plan (before all sections arrive). */
function looksLikeDiagnosisPlanStreaming(text) {
  const t = String(text || '');
  if (t.length < 80) return false;
  if (/【核心风险诊断】|【合规方案】/.test(t)) return true;
  if (/#{1,3}\s*1[）).、]/.test(t) && /(问题理解|业务画像|风险诊断|解决方案)/.test(t)) return true;
  if (t.length >= 220 && /#{1,3}\s+/.test(t) && /(业务画像|风险诊断|解决方案|行动建议|核心风险)/.test(t)) {
    return true;
  }
  return false;
}

/** Wizard steps 1–7 are collecting answers — keep asks in chat, never in the plan panel. */
function isDiagnosisWizardCollecting() {
  try {
    const mode = localStorage.getItem('daoith_diagnosis_ui_mode') || '';
    const step = parseInt(localStorage.getItem('daoith_diagnosis_ui_step') || '0', 10);
    return mode === 'diagnosis' && Number.isFinite(step) && step >= 1 && step <= 7;
  } catch {
    return false;
  }
}

/** Step questions / option lists during the 7-step diagnosis (not a final report). */
function looksLikeDiagnosisWizardAsk(text) {
  const t = String(text || '').trim();
  if (!t || looksLikeFullDiagnosisPlan(t) || looksLikeDiagnosisPlanStreaming(t)) return false;
  if (
    (/第\s*[一二三四五六七1-7]\s*步/.test(t) || /(?:^|\n)\s*\d+\.\s+\S/.test(t)) &&
    /[？?]/.test(t)
  ) {
    return true;
  }
  if (
    t.length < 900 &&
    /[？?]/.test(t) &&
    /(请问您|请选择|是以下哪一种|是哪一种|还是|属于以下)/.test(t) &&
    /(发货方式|注册主体|出口方式|电商平台|发票|产品类别|销售额|哪个平台|什么平台)/.test(t) &&
    !/(【核心风险诊断】|【合规方案】|【行动建议】)/.test(t)
  ) {
    return true;
  }
  return false;
}

/** Route long formal plans to the right panel; keep short Q&A in chat. */
function shouldRouteDiagnosisToPlanPanel(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  // Never park diagnostic process questions in the solution panel
  if (isDiagnosisWizardCollecting() || looksLikeDiagnosisWizardAsk(t)) return false;
  if (looksLikeFullDiagnosisPlan(t) || looksLikeDiagnosisPlanStreaming(t)) return true;

  const activeQ = extractDiagActiveQuestion(t);
  const looksLikeShortAsk =
    t.length < 420 &&
    /[？?]/.test(t) &&
    !/#{1,3}\s/.test(t) &&
    activeQ &&
    activeQ.length < 160 &&
    t.length < activeQ.length + 220;
  if (looksLikeShortAsk) return false;

  if (t.length >= 380 && /(?:^|\n)\s*#{1,3}\s+/.test(t) && /(风险|方案|建议|画像|流程)/.test(t)) return true;
  if (t.length >= 700 && /(风险诊断|解决方案|行动建议|业务画像|问题理解)/.test(t)) return true;
  if (t.length >= 1100 && /(合规|退税|VAT|税负)/.test(t) && /(建议|方案|路径|风险)/.test(t)) return true;
  return false;
}

/** Mode B / general replies longer than 100 characters → right panel. */
function shouldRouteLongAnswerToPlanPanel(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  // Diagnosis wizard Q&A must stay in the left chat
  if (isDiagnosisWizardCollecting() || looksLikeDiagnosisWizardAsk(t)) return false;
  return t.length > 100;
}

const DIAG_PLAN_STATUS_MSG = '道一合规诊断助手正在为您生成专属合规方案，请查看右侧方案生成区';
const DIAG_PLAN_DONE_MSG = '道一合规诊断助手已为您生成专属合规方案，请查看右侧方案生成区';
const QA_LONG_ANSWER_CHAT_TIP =
  '由于内容较多，道一合规诊断助手已将回复展示在右侧方案生成区，请查看。';
const DIAG_PLAN_LIMIT = 5;
const DIAG_PLAN_LIMIT_MSG =
  '您诊断的次数较多，如果您的业务场景比较复杂，建议咨询财税专家获取更准确的解决方案。';
const EXPERT_BOOKING_MSG = '请提交询价并完成预约。';

function wantsExpertBooking(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  if (/^需要，想预约专家\s*1\s*[vV]\s*1$/.test(t)) return true;
  if (/想预约专家\s*1\s*[vV]\s*1|预约专家\s*1\s*[vV]\s*1/.test(t)) return true;
  if (/需要.*(?:预约)?专家\s*1\s*[vV]\s*1/.test(t) && /预约|咨询|需要/.test(t)) return true;
  return false;
}

function showExpertConsultServiceRecs() {
  const serviceHost = document.getElementById('diagServiceRecs');
  if (!serviceHost) return;
  const html = buildDiagnosisServiceRecsHtml('', {
    ids: ['consult-1v1'],
    lead: '',
  });
  if (!html) {
    serviceHost.innerHTML = '';
    serviceHost.hidden = true;
    return;
  }
  serviceHost.innerHTML = html;
  serviceHost.hidden = false;
  window.DAOITH_CART?.bindAddButtons?.(serviceHost);
  serviceHost.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
}

function diagnosisPlanCountStorageKey() {
  const openid = String(window.DAOITH_AUTH?.getUser?.()?.openid || '').trim();
  if (openid) return `daoith_diagnosis_plan_count:${openid}`;
  return `daoith_diagnosis_plan_count:${getDifyUserId()}`;
}

function getDiagnosisPlanCount() {
  const n = parseInt(localStorage.getItem(diagnosisPlanCountStorageKey()) || '0', 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Test / internal accounts: unlimited exclusive diagnosis plans. */
function isDiagnosisPlanLimitBypassed() {
  const openid = String(window.DAOITH_AUTH?.getUser?.()?.openid || '').trim();
  if (!openid) return false;
  const list = window.DAOITH_CONFIG?.diagnosisPlanLimitBypassOpenids;
  if (!Array.isArray(list) || !list.length) return false;
  return list.some((id) => String(id || '').trim() === openid);
}

function bumpDiagnosisPlanCount() {
  if (isDiagnosisPlanLimitBypassed()) return getDiagnosisPlanCount();
  const next = Math.min(DIAG_PLAN_LIMIT, getDiagnosisPlanCount() + 1);
  localStorage.setItem(diagnosisPlanCountStorageKey(), String(next));
  return next;
}

function isDiagnosisPlanLimitReached() {
  if (isDiagnosisPlanLimitBypassed()) return false;
  return getDiagnosisPlanCount() >= DIAG_PLAN_LIMIT;
}

function extractDiagnosisActionAdvice(markdown) {
  const t = String(markdown || '');
  const m = t.match(
    /#{1,3}\s*[三3][）).、]?\s*(解决方案|行动建议|落地建议)[\s\S]*?(?=#{1,3}\s*[四五4-9]|$)/i
  );
  if (m) return m[0];
  const m2 = t.match(/(立刻可做|30\s*天内|需要专家介入)[\s\S]{80,}/);
  return m2 ? m2[0] : t;
}

function pickDiagnosisServiceIds(text) {
  const full = String(text || '');
  const action = extractDiagnosisActionAdvice(full);
  const t = `${action}\n${full}`;
  const ids = [];
  const add = (id) => {
    if (id && !ids.includes(id)) ids.push(id);
  };
  // Prefer path-specific compliance packages first
  if (/0110/.test(t) && /香港/.test(t)) add('domestic-arch-0110-hk');
  if (/1039/.test(t) && /香港/.test(t)) add('domestic-arch-1039-hk');
  if (/9810/.test(t) && /退税|免抵退|出口退|海外仓|陪跑/.test(t)) add('domestic-rebate-9810');
  if (/1210|9610/.test(t) && /退税|免抵退|出口退|陪跑|分送集报|保税/.test(t)) {
    add('domestic-rebate-1210-9610');
  }
  if (/1039|市场采购/.test(t) && /个体户|核定/.test(t) && !ids.includes('domestic-arch-1039-hk')) {
    add('domestic-1039-sole');
  }
  if (/退税|免抵退|出口退|征退差|报关退税/.test(t)) add('domestic-rebate');
  if (/VAT|Oss|IOSS|增值税注册|远程销售|欧盟.*税/.test(t)) add('overseas-vat');
  if (/销售税|Sales\s*Tax|Wayfair|经济关联/.test(t)) add('overseas-us-sales-tax');
  if (/ODI|境外投资|境外直接/.test(t)) add('overseas-odi');
  if (/香港公司|香港主体|香港审计|双层架构/.test(t)) add('hk-company');
  if (/记账|账务|做账|汇算清缴|账册/.test(t)) add('domestic-bookkeeping');
  if (/合规体检|全面诊断|架构诊断|风险排查/.test(t)) add('domestic-diagnosis');
  if (/全年陪跑|持续跟进|常年顾问|财税合规陪跑/.test(t)) add('consult-annual');
  // Always include expert consult; keep action matches first
  if (!ids.includes('consult-1v1')) ids.push('consult-1v1');
  return ids.slice(0, 4);
}

function buildDiagnosisServiceRecsHtml(markdown, options = {}) {
  const ids = Array.isArray(options.ids) && options.ids.length
    ? options.ids
    : pickDiagnosisServiceIds(markdown);
  const lead =
    options.lead != null
      ? options.lead
      : '根据方案中的行动建议为您匹配，可加入询价单由顾问继续落地。';
  const cards = ids
    .map((id) => {
      const s = (window.DAOITH_SERVICES || []).find((x) => x.id === id);
      if (!s) return '';
      return (
        `<div class="diag-service-card">` +
        `<div class="diag-service-card-body">` +
        `<strong>${escapeHtml(s.title)}</strong>` +
        `<span class="diag-service-card-desc">${escapeHtml(s.desc || '')}</span>` +
        `<span class="diag-service-card-price">${escapeHtml(s.priceLabel || '')}${escapeHtml(s.unit || '')}</span>` +
        `</div>` +
        `<button type="button" class="btn btn-outline btn-sm tax-cart-btn" data-action="add" data-service-id="${escapeHtml(s.id)}">加入询价单</button>` +
        `</div>`
      );
    })
    .filter(Boolean)
    .join('');
  if (!cards) return '';
  return (
    `<h3 class="diag-services-heading">您可能需要的服务</h3>` +
    (lead ? `<p class="diag-services-lead">${escapeHtml(lead)}</p>` : '') +
    `<div class="diag-services-grid">${cards}</div>`
  );
}

/** Soft copy guard for the right-hand compliance plan panel (deterrent only). */
function bindResultPanelCopyGuard() {
  const panel = document.getElementById('resultPanel');
  if (!panel || panel.dataset.copyGuard === '1') return;
  panel.dataset.copyGuard = '1';
  const block = (e) => {
    e.preventDefault();
  };
  panel.addEventListener('copy', block);
  panel.addEventListener('cut', block);
  panel.addEventListener('contextmenu', block);
  panel.addEventListener('dragstart', block);
  panel.addEventListener('selectstart', block);
}

function buildResultWorkingHtml() {
  return (
    `<div class="result-working" id="resultWorking" role="status" aria-live="polite">` +
    `<div class="result-working-scene" aria-hidden="true">` +
    `<svg class="result-working-svg" viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">` +
    `<rect class="rw-desk" x="28" y="118" width="164" height="10" rx="3"/>` +
    `<rect class="rw-screen" x="58" y="48" width="104" height="68" rx="6"/>` +
    `<rect class="rw-screen-inner" x="66" y="56" width="88" height="46" rx="3"/>` +
    `<g class="rw-code-lines">` +
    `<rect x="72" y="62" width="52" height="4" rx="2"/>` +
    `<rect x="72" y="72" width="70" height="4" rx="2"/>` +
    `<rect x="72" y="82" width="40" height="4" rx="2"/>` +
    `<rect class="rw-cursor" x="72" y="92" width="18" height="4" rx="2"/>` +
    `</g>` +
    `<rect class="rw-base" x="78" y="116" width="64" height="6" rx="2"/>` +
    `<circle class="rw-head" cx="110" cy="36" r="12"/>` +
    `<path class="rw-body" d="M88 118c4-22 14-32 22-32s18 10 22 32"/>` +
    `<g class="rw-arms">` +
    `<path d="M96 88c6 8 12 14 18 16"/>` +
    `<path class="rw-arm-r" d="M124 88c-6 8-12 14-18 16"/>` +
    `</g>` +
    `</svg>` +
    `</div>` +
    `<p class="result-working-title">道一 AI 正在生成专属合规方案</p>` +
    `<p class="result-working-sub">正在检索知识库并整理诊断报告<span class="result-working-dots" aria-hidden="true"></span></p>` +
    `</div>`
  );
}

function showResultWorking() {
  const placeholder = document.getElementById('resultPlaceholder');
  const content = document.getElementById('resultContent');
  const items = document.getElementById('resultItems');
  if (!items || !content) return;
  if (placeholder) placeholder.style.display = 'none';
  content.classList.add('active');
  items.innerHTML = buildResultWorkingHtml();
  try {
    items.scrollTop = 0;
  } catch {
    /* ignore */
  }
}

function publishDiagnosisPlanToResultPanel(markdown, options = {}) {
  const placeholder = document.getElementById('resultPlaceholder');
  const content = document.getElementById('resultContent');
  const items = document.getElementById('resultItems');
  const serviceHost = document.getElementById('diagServiceRecs');
  if (!items || !content) return;

  if (placeholder) placeholder.style.display = 'none';
  content.classList.add('active');

  const clean = stripDiagnosisArchivePreamble(sanitizeAiAnswer(markdown));
  // Never fall back to raw model text that still contains think / CoT
  if (!clean) return;
  const kind = options.kind === 'qa' ? 'qa' : 'diagnosis';
  const body = renderAIPlanHtml(clean) || `<p class="result-paragraph">${escapeHtml(clean)}</p>`;
  const fromChat =
    kind === 'qa'
      ? `以下回复由左侧<strong>道一合规诊断助手</strong>生成：`
      : `以下方案由左侧<strong>道一合规诊断助手</strong>生成：`;
  const archiveHtml = kind === 'diagnosis' ? buildDiagnosisArchiveConfirmHtml() : '';
  items.innerHTML =
    `<div class="result-body result-body-scroll">` +
    `<p class="result-paragraph result-greeting">${escapeHtml(SOLUTION_GREETING)}</p>` +
    `<p class="result-paragraph result-from-chat">${fromChat}</p>` +
    archiveHtml +
    body +
    `</div>`;

  if (serviceHost) {
    // Service cards mainly for full diagnosis plans
    if (kind === 'diagnosis') {
      const html = buildDiagnosisServiceRecsHtml(clean);
      if (html) {
        serviceHost.innerHTML = html;
        serviceHost.hidden = false;
        window.DAOITH_CART?.bindAddButtons?.(serviceHost);
      } else {
        serviceHost.innerHTML = '';
        serviceHost.hidden = true;
      }
    } else {
      serviceHost.innerHTML = '';
      serviceHost.hidden = true;
    }
  }

  try {
    // Keep page position; only reset the right-hand plan panel scroll
    items.scrollTop = 0;
  } catch {
    /* ignore */
  }
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

/** Reset chatbot conversation when WeChat login identity changes (Dify ties chats to user). */
function syncDifyUserConversation() {
  const USER_MARK = 'daoith_dify_user_mark';
  const current = getDifyUserId();
  const prev = localStorage.getItem(USER_MARK) || '';
  if (prev && prev !== current) {
    localStorage.removeItem('daoith_ai_conversation_id');
    localStorage.setItem('daoith_ai_conversation_bound', '0');
    localStorage.removeItem('daoith_diagnosis_conversation_id');
    localStorage.setItem('daoith_diagnosis_conversation_bound', '0');
    localStorage.setItem('daoith_diagnosis_ask_count', '0');
  }
  localStorage.setItem(USER_MARK, current);
}

window.addEventListener('daoith-auth-change', () => {
  try {
    syncDifyUserConversation();
  } catch {
    /* ignore */
  }
});
try {
  syncDifyUserConversation();
} catch {
  /* ignore */
}

function getDifyConfig() {
  return window.DAOITH_CONFIG || {
    difyApiBase: 'https://api.daoith.com',
    notifyApiBase: 'https://api.daoith.com',
    difyEndpoint: '/v1/chat-messages',
    difyDiagnosisEndpoint: '/v1/chat-messages',
    difyHsRateEndpoint: '/v1/chat-messages',
    difyTaxCalcEndpoint: '/v1/chat-messages',
    difyChatEndpoint: '/v1/diagnosis/chat-messages',
    hsRefundApiPath: '/api/hs-refund-rate',
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
  if (!data || typeof data !== 'object') return '';

  const candidates = [];
  if (typeof data.answer === 'string') candidates.push(data.answer);
  if (Array.isArray(data.answer)) {
    candidates.push(
      data.answer
        .map((x) => (typeof x === 'string' ? x : x?.text || x?.content || ''))
        .join('\n')
    );
  }
  if (typeof data.answer === 'object' && data.answer) {
    for (const key of ['text', 'content', 'answer', 'output']) {
      if (typeof data.answer[key] === 'string') candidates.push(data.answer[key]);
    }
  }

  const outputs = data.data?.outputs;
  if (outputs) {
    if (typeof outputs === 'string') candidates.push(outputs);
    else if (typeof outputs === 'object') {
      for (const key of ['text', 'result', 'answer', 'output', 'report']) {
        if (typeof outputs[key] === 'string') candidates.push(outputs[key]);
      }
    }
  }

  if (typeof data.message === 'string') candidates.push(data.message);
  if (typeof data.text === 'string') candidates.push(data.text);

  // Some builds put usable text only under metadata / reasoning payloads
  // Never prefer raw reasoning/thinking as the user-visible answer
  const meta = data.metadata;
  if (meta && typeof meta === 'object') {
    if (typeof meta.annotation_reply === 'string') candidates.push(meta.annotation_reply);
  }

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
}

/**
 * Dify SSE streaming chat. Calls onChunk(accumulatedAnswer) as tokens arrive.
 * Returns { text, conversationId }.
 */
async function callDifyStream({ endpoint, inputs, query, conversationId, onChunk }) {
  const cfg = getDifyConfig();
  const path = endpoint || cfg.difyEndpoint || '/v1/chat-messages';
  const url = `${cfg.difyApiBase}${path}`;

  const payload = {
    inputs: inputs || {},
    query,
    response_mode: 'streaming',
    user: getDifyUserId(),
  };
  if (conversationId) payload.conversation_id = conversationId;

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('无法连接道一 AI 服务（api.daoith.com），请检查网络或稍后重试');
  }

  const contentType = String(res.headers.get('content-type') || '');

  // Non-SSE error body (e.g. classifier 400 JSON)
  if (!res.ok) {
    let msg = `请求失败（HTTP ${res.status}）`;
    try {
      const errData = await res.json();
      msg = errData.message || errData.error || errData.code || msg;
    } catch {
      try {
        const raw = await res.text();
        if (raw) msg = raw.slice(0, 240);
      } catch {
        /* ignore */
      }
    }
    throw new Error(msg);
  }

  // Some proxies may fall back to a single JSON body even when streaming was requested
  if (contentType.includes('application/json') && !contentType.includes('text/event-stream')) {
    const data = await res.json();
    const text = extractDifyAnswer(data);
    if (!text) throw new Error('AI 返回内容为空，请点击「新建对话」后重试');
    if (typeof onChunk === 'function') onChunk(text);
    return {
      text,
      conversationId: data.conversation_id || conversationId || '',
    };
  }

  if (!res.body || typeof res.body.getReader !== 'function') {
    throw new Error('当前浏览器不支持流式响应，请升级浏览器后重试');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let answer = '';
  let nextConversationId = conversationId || '';
  let streamError = '';
  let lastPaint = 0;

  const emit = (force) => {
    if (typeof onChunk !== 'function' || !answer) return;
    const now = Date.now();
    if (!force && now - lastPaint < 40) return;
    lastPaint = now;
    onChunk(answer);
  };

  const handleEvent = (raw) => {
    const line = String(raw || '').trim();
    if (!line || line === '[DONE]') return;
    let data;
    try {
      data = JSON.parse(line);
    } catch {
      return;
    }

    if (data.conversation_id) nextConversationId = data.conversation_id;

    const event = String(data.event || '');
    if (event === 'error') {
      streamError = data.message || data.code || data.error || '流式响应出错';
      return;
    }

    // Never surface agent thinking / tool traces in the chat UI
    if (
      event === 'agent_thought' ||
      event === 'thought' ||
      event === 'agent_log' ||
      event === 'message_file' ||
      event === 'tts_message' ||
      event === 'tts_message_end' ||
      event === 'node_started' ||
      event === 'node_finished' ||
      event === 'parallel_branch_started' ||
      event === 'parallel_branch_finished' ||
      /thought|tool|retriev|log/i.test(event)
    ) {
      return;
    }

    // Token deltas (chat / agent / Chatflow LLM nodes)
    if (
      event === 'message' ||
      event === 'agent_message' ||
      event === 'text_chunk'
    ) {
      const delta =
        (typeof data.answer === 'string' && data.answer) ||
        (typeof data.text === 'string' && data.text) ||
        (typeof data.data?.text === 'string' && data.data.text) ||
        '';
      // Skip pure thought payloads some Agent builds put in answer
      if (delta && typeof data.thought === 'string' && data.thought === delta) return;
      if (delta) {
        answer += delta;
        emit(false);
      }
      return;
    }

    if (event === 'message_end' || event === 'workflow_finished') {
      // Prefer accumulated message tokens; only fill from final payload answer field
      const finalAnswer =
        (typeof data.answer === 'string' && data.answer) ||
        (typeof data.data?.answer === 'string' && data.data.answer) ||
        '';
      if (finalAnswer && finalAnswer.length > answer.length) {
        answer = finalAnswer;
      }
      emit(true);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames separated by blank line; each data line may be "data: {...}"
    let splitAt;
    while ((splitAt = buffer.indexOf('\n')) >= 0) {
      let line = buffer.slice(0, splitAt);
      buffer = buffer.slice(splitAt + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line) continue;
      if (line.startsWith(':')) continue; // comment / keepalive
      if (line.startsWith('data:')) {
        handleEvent(line.slice(5).trim());
        if (streamError) throw new Error(streamError);
      }
    }
  }

  // Flush trailing buffer
  if (buffer.trim()) {
    const trailing = buffer.trim();
    if (trailing.startsWith('data:')) handleEvent(trailing.slice(5).trim());
    else handleEvent(trailing);
  }
  if (streamError) throw new Error(streamError);

  emit(true);

  if (!answer) {
    throw new Error('AI 返回内容为空，请点击「新建对话」后重试');
  }

  return {
    text: answer,
    conversationId: nextConversationId || conversationId || '',
  };
}

async function callDify({ endpoint, inputs, query, conversationId, returnMeta }) {
  const cfg = getDifyConfig();
  const path = endpoint || cfg.difyEndpoint || '/v1/chat-messages';
  const url = `${cfg.difyApiBase}${path}`;

  const postOnce = async (cid) => {
    const payload = {
      inputs: inputs || {},
      query,
      response_mode: 'blocking',
      user: getDifyUserId(),
    };
    if (cid) payload.conversation_id = cid;

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

    return { res, data, cid };
  };

  let { res, data, cid } = await postOnce(conversationId || '');

  if (!res.ok) {
    const msg = data.message || data.error || data.code || `请求失败（HTTP ${res.status}）`;
    // Stale conversation / user mismatch → retry as a fresh chat once
    if (
      conversationId &&
      /conversation|not exist|not_found|无效|Conversation|user/i.test(String(msg))
    ) {
      ({ res, data, cid } = await postOnce(''));
      if (!res.ok) {
        const msg2 = data.message || data.error || data.code || `请求失败（HTTP ${res.status}）`;
        throw new Error(msg2);
      }
    } else {
      throw new Error(msg);
    }
  }

  let text = extractDifyAnswer(data);
  // Empty answer with an old conversation_id is a common Chatflow glitch — retry fresh once
  if (!text && conversationId) {
    ({ res, data, cid } = await postOnce(''));
    if (!res.ok) {
      const msg = data.message || data.error || data.code || `请求失败（HTTP ${res.status}）`;
      throw new Error(msg);
    }
    text = extractDifyAnswer(data);
  }

  if (!text) {
    throw new Error('AI 返回内容为空，请点击「新建对话」后重试');
  }

  if (returnMeta) {
    return {
      text,
      conversationId: data.conversation_id || cid || conversationId || '',
    };
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
    query: `你是中国出口退税政策助手。请优先依据已挂载的海关编码知识库查询海关编码 ${hsCode} 的现行出口退税率；知识库无精确匹配时再说明需核对官方文库。

硬规则：只输出知识库中的「出口退税率」字段；严禁把「增值税税率」当作出口退税率。例如镶钻银饰71131110常见增值税13%、出口退税0%。

输出要求（中文，简洁）：
1. 第一行：出口退税率：X%
2. 第二行：数据来源：知识库 / 国家税务总局出口退税率文库（注明依据）
3. 第三行：简要说明（不超过40字；可同时注明增值税税率但不得与退税率混用）
不要编造无法核实的税率；不确定时明确写「需人工核对官方税则」。`,
  });
}

/** Left-side HS refund lookup: Dataset Retrieve API (structured), not Chat LLM. */
async function lookupRefundRateFromKnowledgeBase(hsCode) {
  const cfg = getDifyConfig();
  const base = (cfg.notifyApiBase || cfg.difyApiBase || 'https://api.daoith.com').replace(/\/$/, '');
  const path = cfg.hsRefundApiPath || '/api/hs-refund-rate';
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hs_code: hsCode }),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`退税率知识库返回异常（HTTP ${res.status}）`);
  }
  if (!res.ok) {
    throw new Error(data.message || data.error || `知识库查询失败（HTTP ${res.status}）`);
  }
  return data;
}

/** Extract HS digits from a refund-rate style chat question. */
function extractHsFromRefundQuestion(message) {
  const q = String(message || '').trim();
  const hasRefundIntent =
    /(出口退税|退税率|退税多少|退税是多少|退税率为|退税率是|退税|rebate)/i.test(q) ||
    // 「76081000税率/是多少」也视为查退税（左侧同款场景）
    (/(税率|是多少)/.test(q) && /\d{8,12}/.test(q));
  // 纯税号提问（8～10 位数字，可带空格/点）也走结构化退税查询
  const pureHs = q.replace(/[\s.\-]/g, '');
  const isPureHsCode = /^\d{8,10}$/.test(pureHs);
  if (!hasRefundIntent && !isPureHsCode) return '';

  const labeled = q.match(
    /(?:海关编码|商品编码|HS\s*Code|HS|税号|编码)\s*[:：]?\s*([0-9][0-9.\s]{6,16})/i
  );
  const loose = q.match(/(\d{8,12})/);
  const raw = labeled?.[1] || loose?.[1] || (isPureHsCode ? pureHs : '');
  const digits = String(raw).replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(0, 10) : '';
}

/** 常见铝制品品名 → HS8（归类参考；正式报关以海关为准） */
const ALUMINUM_PRODUCT_HS = [
  { re: /铝管|非合金铝管/, hs: '76081000', name: '非合金铝管' },
  { re: /门窗|窗框|门框|框架/, hs: '76101000', name: '铝制门窗框架' },
  { re: /易拉罐|铝罐|饮料罐/, hs: '76129010', name: '铝制易拉罐（≤300L）' },
  { re: /烹煮|餐桌用具|厨具|锅具|餐具/, hs: '76151900', name: '铝制烹煮及餐桌用具' },
  { re: /铝条|铝杆|条杆/, hs: '76041010', name: '铝条/杆（非合金）' },
  { re: /铝箔|铝薄板|箔/, hs: '76071100', name: '铝箔（非合金，轧制未进一步加工）' },
  { re: /铝板|铝片|板材/, hs: '76061190', name: '铝板/片（非合金）' },
];

function lookupLocalRefundDisplay(hsCode) {
  const api = window.DAOITH_HS_RATES;
  if (api?.lookupRefundRate) {
    const r = api.lookupRefundRate(hsCode);
    if (r?.ok && r.rate != null) return r.display || `${r.rate}%`;
  }
  // 第76章铝材：2024-12-01 起多数取消退税
  if (String(hsCode || '').replace(/\D/g, '').startsWith('76')) return '0%';
  return null;
}

/**
 * 铝制品品名/退税问题：本地回答，避免模型把增值税13%写成出口退税13%。
 * 触发：含「铝」且（退税|编码|税号|归类|HS）
 */
function buildAluminumProductsRefundReply(message) {
  const q = String(message || '').trim();
  if (!/铝/.test(q)) return '';
  if (!/(退税|海关编码|商品编码|税号|归类|HS\b|编码)/i.test(q)) return '';

  const matched = ALUMINUM_PRODUCT_HS.filter((row) => row.re.test(q));
  const rows = matched.length ? matched : ALUMINUM_PRODUCT_HS.slice(0, 5);
  const lines = rows.map((row) => {
    const rate = lookupLocalRefundDisplay(row.hs) || '0%';
    return `- ${row.name} → HS ${row.hs}，出口退税 ${rate}`;
  });

  const lead =
    matched.length === 0
      ? '铝制品范围较广，没有单一税号。常见品类出口退税参考如下（财政部税务总局公告2024年第15号：自2024年12月1日起铝材等取消出口退税）：'
      : '按您提到的铝制品，出口退税参考如下（2024年第15号公告口径，铝材等多为0%；请勿与增值税税率13%混淆）：';

  return [
    lead,
    '',
    ...lines,
    '',
    '请补充更具体品名或完整海关编码以便精确核对。实际操作以海关归类及国家税务总局出口退税率文库为准。',
  ].join('\n');
}

/**
 * 纠偏：模型答复中「76开头税号 + 出口退税13%」按本地表改为实际退税率（多为0%）。
 * 不改写「增值税税率13%」。
 */
function correctAluminumRefundHallucinations(text) {
  let t = String(text || '');
  if (!t || !/76\d{6}/.test(t)) return t;

  // 形如：76081000…出口退税13% / 出口退税率为13%
  t = t.replace(
    /(76\d{6,10})([^%\n]{0,80}?)((?:出口)?退税率?(?:为|是|:|：)?\s*)(13)\s*%/gi,
    (full, hs, mid, label, rate) => {
      if (/增值税|征税率|销项/.test(mid + label)) return full;
      const corrected = lookupLocalRefundDisplay(hs);
      if (!corrected || corrected === `${rate}%`) return full;
      return `${hs}${mid}${label}${corrected.replace(/%$/, '')}%`;
    }
  );

  // 形如：→参考76081000，出口退税13%
  t = t.replace(
    /((?:出口)?退税(?:率)?\s*(?:为|是|:|：)?\s*)(13)\s*%([^%\n]{0,40}?)(76\d{6,10})/gi,
    (full, label, rate, mid, hs) => {
      if (/增值税|征税率|销项/.test(label + mid)) return full;
      const corrected = lookupLocalRefundDisplay(hs);
      if (!corrected || corrected === `${rate}%`) return full;
      return `${label}${corrected.replace(/%$/, '')}%${mid}${hs}`;
    }
  );

  return t;
}

/** Same resolution path as left-side HS query: KB first, then local table. */
async function resolveExportRefundRate(hsCode) {
  try {
    const kb = await lookupRefundRateFromKnowledgeBase(hsCode);
    if (kb?.ok && kb.rate != null) return kb;
  } catch {
    // continue to local table
  }
  const api = window.DAOITH_HS_RATES;
  if (api?.lookupRefundRate) {
    return api.lookupRefundRate(hsCode);
  }
  return { ok: false, rate: null, display: '—' };
}

function formatStructuredRefundReply(kb, hsCode) {
  const matched = kb.hs_code || hsCode;
  const rate = kb.display || `${kb.rate}%`;
  // Prefer 8-digit matched code in reply when input was 10-digit
  const show = String(matched).replace(/\D/g, '').slice(0, 10) || hsCode;
  return `${show} 的出口退税率为 ${rate}。`;
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
  let s = escapeHtml(String(text || ''));
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong class="result-em">$1</strong>');
  // Drop leftover markdown asterisks (avoid showing raw **)
  s = s.replace(/\*{1,2}/g, '');
  // Auto-emphasize common high-risk tax phrases
  const emphasis = ['视同内销征税', '视同内销', '三流不一致', '金税四期', '无法申请出口退税', '无法出口退税'];
  for (const phrase of emphasis) {
    const esc = escapeHtml(phrase);
    if (!esc || s.includes(`>${esc}<`)) continue;
    s = s.split(esc).join(`<strong class="result-em">${esc}</strong>`);
  }
  // Highlight common customs / regime codes
  s = s.replace(
    /\b(0110|9610|9810|9710|1210|1039|FBA|FBT|VOEC|IOSS|HS)\b/g,
    '<span class="result-code">$1</span>'
  );
  return s;
}

/** Bold a short lead title before 。/： when the rest is a longer explanation. */
function formatRiskOrBulletContent(content) {
  const raw = String(content || '').trim();
  const lead = raw.match(/^(.{4,36}?)([。：:])([\s\S]{20,})$/);
  if (lead && !/^\*\*/.test(raw) && !lead[1].includes('→')) {
    return (
      `<strong class="result-em">${escapeHtml(lead[1])}</strong>` +
      escapeHtml(lead[2]) +
      formatInline(lead[3])
    );
  }
  return formatInline(raw);
}

function matchBoldKvContent(content) {
  return String(content || '').match(/^\*\*([^*]+)\*\*\s*[:：]\s*(.+)$/);
}

/**
 * Dify 批注回复常为无 Markdown 的纯文本。将其整理为可嵌套渲染的标题 + 多级列表。
 * 已有较多 `-` / `1.` / `#` 结构时不改写，避免破坏正常 Agent 输出。
 */
function structureAnnotationPlainText(text) {
  let t = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!t) return t;

  // Keep existing hard newlines.
  const lines = t.split('\n').map((ln) => ln.trim());

  const nonEmpty = lines.filter(Boolean);
  if (nonEmpty.length < 3) return t;

  const structuredCount = nonEmpty.filter((ln) =>
    /^#{1,4}\s/.test(ln) ||
    /^[-*•]\s+/.test(ln) ||
    /^\d+[.)、．]\s+/.test(ln) ||
    /^【[^】]+】/.test(ln)
  ).length;
  if (structuredCount / nonEmpty.length >= 0.35) return t;

  const isMajorTitle = (ln) => {
    const s = ln.replace(/\*/g, '').trim();
    if (/^方式[一二三四五六七八九十\d]+[：:]/.test(s)) return true;
    if (/^(?:路径|方案|情形)[一二三四五六七八九十ABC\d]+[：:]/.test(s)) return true;
    if (/^[一二三四五六七八九十]+[、.．]\s*\S/.test(s) && s.length <= 40) return true;
    if (/^【[^】]{2,40}】$/.test(s)) return true;
    if (/^#{1,4}\s+\S/.test(ln)) return true;
    return false;
  };

  const isSubIntro = (ln) => {
    const s = ln.replace(/\*/g, '').trim();
    return /[：:]$/.test(s) && s.length >= 4 && s.length <= 48 && !/[。！？]/.test(s);
  };

  const isStepTitle = (ln) => {
    const s = ln.replace(/\*/g, '').trim();
    if (!s || s.length > 28) return false;
    if (isMajorTitle(s) || isSubIntro(s)) return false;
    if (/^[-*•\d#]/.test(s)) return false;
    if (/[。！？；;]/.test(s)) return false;
    if (/^[「『“"]/.test(s)) return false;
    if (/^以下|如上|综上|注意|说明|备注/.test(s)) return false;
    // Short noun-like step labels: 货物出口报关 / 核算期（关键步骤）
    return s.length >= 2;
  };

  const isFieldDetail = (ln) => {
    const s = ln.replace(/\*/g, '').trim();
    if (/^[「『]/.test(s)) return true;
    if (/^[“"].+[”"]/.test(s) && s.length <= 60) return true;
    if (/」（|」选择|」勾选|」填写|」栏/.test(s)) return true;
    if (/[；;]$/.test(s) && s.length <= 80) return true;
    return false;
  };

  const out = [];
  let mode = 'root'; // root | major | step | sub

  for (const raw of lines) {
    const ln = raw.trim();
    if (!ln) {
      if (out.length && out[out.length - 1] !== '') out.push('');
      continue;
    }

    if (isMajorTitle(ln)) {
      const title = ln.replace(/^#{1,4}\s+/, '').replace(/\*/g, '').trim();
      if (out.length && out[out.length - 1] !== '') out.push('');
      out.push(`## ${title}`);
      mode = 'major';
      continue;
    }

    if (isStepTitle(ln)) {
      const title = ln.replace(/\*/g, '').trim();
      out.push(`- **${title}**`);
      mode = 'step';
      continue;
    }

    if (isSubIntro(ln)) {
      const title = ln.replace(/\*/g, '').replace(/[：:]\s*$/, '').trim();
      out.push(`  - **${title}**`);
      mode = 'sub';
      continue;
    }

    // Details
    const content = ln.replace(/\*/g, '').trim();
    if (mode === 'sub') {
      if (isFieldDetail(ln)) {
        out.push(`    - ${content}`);
      } else {
        // Leave the 「字段」子列表，回到步骤细则
        mode = 'step';
        out.push(`  - ${content}`);
      }
      continue;
    }
    if (mode === 'step' && isFieldDetail(ln)) {
      out.push(`    - ${content}`);
      mode = 'sub';
      continue;
    }
    if (mode === 'step') {
      out.push(`  - ${content}`);
      continue;
    }
    if (mode === 'major') {
      // Lead sentence under major title — keep as paragraph
      out.push(content);
      continue;
    }
    out.push(content);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Same hierarchy text as numbered actions — never the blue key-value card. */
function formatPlanListItem(content) {
  const kv = matchBoldKvContent(content);
  if (kv) {
    return `<strong class="result-em">${escapeHtml(kv[1])}</strong>：${formatInline(kv[2])}`;
  }
  return formatRiskOrBulletContent(content);
}

/** Parse leading indent + list marker. depth 0–3 → display levels 2–5 under section titles. */
function parsePlanListMarker(rawLine) {
  const m = String(rawLine || '').match(/^([ \t]*)([-*•]|\d+[.)、．]|[a-zA-Z][.)、．])\s+(.*)$/);
  if (!m) return null;
  const spaces = m[1].replace(/\t/g, '  ').length;
  let depth = Math.min(3, Math.floor(spaces / 2));
  const marker = m[2];
  const isLetter = /^[a-zA-Z][.)、．]$/.test(marker);
  // Letter sub-points (a./b.) are always nested under the current parent item
  if (isLetter && depth < 1) depth = 1;
  return {
    depth,
    ordered: /^\d+[.)、．]$/.test(marker),
    content: m[3],
  };
}

/** Bold-only titles (e.g. **前期备案**) act as parents for following flat detail bullets. */
function isBoldNestParentBullet(content) {
  return /^\*\*[^*]{1,40}\*\*\s*[:：]?\s*$/.test(String(content || '').trim());
}

/** Intro bullets that open a nested list, e.g. **…风险**：……存在以下问题： */
function isNestIntroParentBullet(content) {
  const t = String(content || '').trim();
  if (!t) return false;
  if (isBoldNestParentBullet(t)) return true;
  if (!/[：:]\s*$/.test(t)) return false;
  return /(存在以下(?:问题|风险|情形)|如下|包括以下|具体(?:包括|如下)|主要(?:包括|有))/.test(t);
}

/** New bold-titled peer while currently nested under an intro parent. */
function isBoldTitledBullet(content) {
  return /^\*\*[^*]{1,48}\*\*/.test(String(content || '').trim());
}

/**
 * If the model emits a flat list of bold step titles + detail bullets,
 * indent details under each bold title so the renderer can nest 二/三/四级.
 * Preserve existing markdown indentation when already nested.
 */
function nestPlanBulletHierarchy(text) {
  const lines = String(text || '').split('\n');
  const alreadyNested = lines.some((ln) => /^[ \t]{2,}[-*•]\s+/.test(ln));
  if (alreadyNested) return text;

  const out = [];
  let underParent = false;
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      out.push(raw);
      continue;
    }
    const bm = trimmed.match(/^[-*•]\s+(.*)$/);
    if (!bm) {
      underParent = false;
      out.push(raw);
      continue;
    }
    const content = String(bm[1] || '').trim();
    if (isNestIntroParentBullet(content)) {
      underParent = true;
      out.push(`- ${content}`);
    } else if (underParent && isBoldTitledBullet(content)) {
      underParent = isNestIntroParentBullet(content) || isBoldNestParentBullet(content);
      out.push(`- ${content}`);
    } else if (underParent) {
      out.push(`  - ${content}`);
    } else {
      out.push(`- ${content}`);
    }
  }
  return out.join('\n');
}

/**
 * If the model emits flat numbered peers that restart at 1 under a prior item,
 * indent the restart block so the renderer can nest 二/三级列表。
 */
function nestPlanNumberedHierarchy(text) {
  const lines = String(text || '').split('\n');
  const alreadyNested = lines.some((ln) => /^[ \t]{2,}\d+[.)、．]\s+/.test(ln));
  if (alreadyNested) return text;

  const out = [];
  let lastTop = 0;
  let nestSeq = 0;
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      out.push(raw);
      continue;
    }
    const om = trimmed.match(/^(\d+)[.)、．]\s+(.*)$/);
    if (!om) {
      // Section headers reset numbering context; never auto-indent plain bullets
      // (that created empty ● parents wrapping ○ children).
      if (
        /^【/.test(trimmed) ||
        /^#{1,4}\s/.test(trimmed) ||
        /^[一二三四五六七八九十]+[、.．]/.test(trimmed) ||
        /^(业务流程图|主要风险|核心风险|行动建议|注意事项|合规方案)/.test(trimmed)
      ) {
        lastTop = 0;
        nestSeq = 0;
      } else if (!/^[-*•]\s+/.test(trimmed)) {
        nestSeq = 0;
      }
      out.push(raw);
      continue;
    }
    const n = parseInt(om[1], 10);
    const content = om[2] || '';
    if (!Number.isFinite(n) || n < 1) {
      out.push(raw);
      continue;
    }
    // Continue top-level sequence: 1,2,3…
    if (n === lastTop + 1 || (n === 1 && lastTop === 0)) {
      lastTop = n;
      nestSeq = 0;
      out.push(`${n}. ${content}`);
      continue;
    }
    // Restart at 1 (or continue 1,2,3…) under current top-level item
    if (lastTop >= 1 && (n === 1 || (nestSeq > 0 && n === nestSeq + 1))) {
      nestSeq = n;
      out.push(`  ${n}. ${content}`);
      continue;
    }
    lastTop = n;
    nestSeq = 0;
    out.push(`${n}. ${content}`);
  }
  return out.join('\n');
}

/**
 * Fix「a. 非定制…」后误升为「2. 定制类…」→ 缩进为同级子项（CSS lower-alpha 显示为 b.），
 * 并顺延后续一级序号。
 */
function nestCustomAfterNonCustomPeers(text) {
  const lines = String(text || '').split('\n');
  const out = [];
  let sawNonCustomSub = false;
  let demoteAfter = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) {
      out.push(raw);
      continue;
    }
    if (
      /^【/.test(trimmed) ||
      /^#{1,4}\s/.test(trimmed) ||
      /^(业务流程图|主要风险|核心风险|行动建议|注意事项|合规方案)/.test(trimmed)
    ) {
      sawNonCustomSub = false;
      demoteAfter = 0;
      out.push(raw);
      continue;
    }

    if (
      /^([aA][.、．)]|\(?[aA]\))\s*\*{0,2}非定制/.test(trimmed) ||
      /^[-*•]\s*\*{0,2}(?:[aA][.、．)]\s*)?\*{0,2}非定制/.test(trimmed) ||
      /^\d+[.)、．]\s*\*{0,2}非定制/.test(trimmed)
    ) {
      sawNonCustomSub = true;
      out.push(raw);
      continue;
    }

    const customNum = trimmed.match(/^(\d+)[.)、．]\s+(\*{0,2}定制类.*)$/);
    if (sawNonCustomSub && customNum) {
      demoteAfter = parseInt(customNum[1], 10);
      // Indented bullet → nests under current ol item; CSS lower-alpha renders as b.
      let content = customNum[2].replace(/^[bB][.、．)]\s*/, '');
      out.push(`  - ${content}`);
      sawNonCustomSub = false;
      continue;
    }

    const om = trimmed.match(/^(\d+)[.)、．]\s+(.*)$/);
    if (om && demoteAfter > 0) {
      const n = parseInt(om[1], 10);
      if (Number.isFinite(n) && n > demoteAfter) {
        out.push(`${n - 1}. ${om[2]}`);
        continue;
      }
    }

    if (/^\d+[.)、．]\s+/.test(trimmed)) {
      sawNonCustomSub = false;
    }
    out.push(raw);
  }
  return out.join('\n');
}

/** `- **留存全流程资料**：……` should continue as peer action #6, not a nested card. */
function looksLikePeerActionItem(content) {
  const kv = matchBoldKvContent(content);
  if (kv && kv[1].length <= 28 && String(kv[2] || '').trim().length >= 6) return true;
  const plain = String(content || '').match(/^([^：:＊*]{2,28})[:：]\s*(.{6,})$/);
  return Boolean(plain);
}

/** Clean diagnosis/plan markdown for display (no URLs, no 情形 labels, no bullet+number mix). */
function sanitizeDiagnosisPlanText(text) {
  let t = String(text || '');

  // Strip agent-only「情形X」labels from section titles
  t = t.replace(
    /(\*{0,2}【[^】]+】\*{0,2})\s*[（(]\s*情形[一二三四五六七八九十\d]+[：:][^）)]*[）)]/g,
    '$1'
  );
  t = t.replace(
    /(\*{0,2}(?:合规方案|核心风险诊断|行动建议|注意事项)\*{0,2})\s*[（(]\s*情形[一二三四五六七八九十\d]+[：:][^）)]*[）)]/g,
    '$1'
  );

  // Export-rebate links → point to left-side HS query box
  t = t.replace(
    /可至\s*\[[^\]]*(?:出口退税|退税率)[^\]]*\]\([^)]+\)\s*核实/gi,
    '可在本页左侧「查询出口退税率」核实'
  );
  t = t.replace(
    /\[[^\]]*(?:出口退税|退税率|退税查询)[^\]]*\]\([^)]+\)/gi,
    '本页左侧「查询出口退税率」'
  );
  // Other markdown links: keep label, drop URL
  t = t.replace(/\[([^\]]+)\]\(\s*https?:\/\/[^)]+\)/gi, '$1');
  // Bare URLs / domains in parentheses
  t = t.replace(/https?:\/\/[^\s)\]>（）<>"']+/gi, '');
  t = t.replace(/[（(]\s*(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s)）]*)?\s*[）)]/gi, '');
  // Tidy phrases left after URL removal
  t = t.replace(/可至\s*核实/g, '可核实');
  t = t.replace(/可至\s{2,}核实/g, '可核实');
  t = t.replace(/详见\s*[。．]?/g, '');
  t = t.replace(/[ \t]{2,}/g, ' ');
  // Drop lines that became empty after URL cleanup
  t = t
    .split('\n')
    .map((ln) => ln.replace(/\s+$/g, ''))
    .filter((ln) => !/^[-*•]\s*$/.test(ln))
    .join('\n');

  // Bullet + number mix: "- **1** 内容" / "- 1. 内容" → "- 内容" (CSS bullet only)
  t = t.replace(/^(\s*[-*•]\s+)\*\*\s*\d+\s*[.、)）]?\s*\*\*\s*/gm, '$1');
  t = t.replace(/^(\s*[-*•]\s+)\*\*\d+\*\*\s*[.、)）]?\s*/gm, '$1');
  t = t.replace(/^(\s*[-*•]\s+)\d+\s*[.、)）]\s+/gm, '$1');
  // Ordered list with redundant bold number already in marker: "1. **1** 内容"
  t = t.replace(/^(\s*\d+[.)、]\s+)\*\*\s*\d+\s*[.、)）]?\s*\*\*\s*/gm, '$1');
  t = t.replace(/^(\s*\d+[.)、]\s+)\*\*\d+\*\*\s*[.、)）]?\s*/gm, '$1');

  // Replace closing consult questions with a fixed tip (no 问句)
  const expertTip = '可以选择页面下方「专家1v1财税咨询服务」进行深度沟通。';
  t = t.replace(
    /(?:是否需要|要不要|需不需要)[^\n？?]*?(?:预约|付费)?[^\n？?]*(?:专家|1\s*[vV]\s*1|深度咨询|付费咨询)[^\n]*[？?]/g,
    expertTip
  );
  t = t.replace(
    /如需进一步[^\n]*?(?:专家|1\s*[vV]\s*1|咨询)[^\n]*[。．]?/g,
    expertTip
  );
  // Ensure tip appears once at end of a full diagnosis report
  if (/【行动建议】|【合规方案】|【注意事项】/.test(t) && !/专家1v1财税咨询服务/.test(t)) {
    t = `${t.replace(/\s+$/, '')}\n\n${expertTip}`;
  }

  return t;
}

/** Strip leading list index from item text (avoid ● + 1 / **1** / duplicate glyphs). */
function stripLeadingListIndex(content) {
  return String(content || '')
    .replace(/^\*\*\s*\d+\s*[.、)）．]?\s*\*\*\s*/, '')
    .replace(/^\*\*\d+\*\*\s*[.、)）．]?\s*/, '')
    .replace(/^\d+\s*[.、)）．]\s*/, '')
    .replace(/^[●○◆▪•·◦▪️◉]+\s*/, '')
    .trim();
}

/** Turn markdown pipe-tables into bullet lines (tables break layout in the plan panel). */
function splitMarkdownTableRow(line) {
  return String(line || '')
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim());
}

function convertMarkdownTablesToBullets(text) {
  const lines = String(text || '').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1] || '';
    const isHeader = /^\s*\|/.test(line) && /\|/.test(line);
    const isSep = /^\s*\|?\s*:?-{3,}/.test(next);
    if (isHeader && isSep) {
      const headers = splitMarkdownTableRow(line).filter((c) => c && !/^[-:]+$/.test(c));
      i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const cells = splitMarkdownTableRow(lines[i]).filter((c) => c && !/^[-:]+$/.test(c));
        if (cells.length >= 2) {
          out.push(`- **${cells[0]}**：${cells.slice(1).join('；')}`);
        } else if (cells.length === 1 && headers[0]) {
          out.push(`- **${headers[0]}**：${cells[0]}`);
        } else if (cells.length === 1) {
          out.push(`- ${cells[0]}`);
        }
        i += 1;
      }
      continue;
    }
    // Lone separator or broken table row
    if (/^\s*\|?\s*[-:|]+\s*$/.test(line)) {
      i += 1;
      continue;
    }
    if (/^\s*\|/.test(line) && /\|/.test(line)) {
      const cells = splitMarkdownTableRow(line).filter((c) => c && !/^[-:]+$/.test(c));
      if (cells.length >= 2) {
        out.push(`- **${cells[0]}**：${cells.slice(1).join('；')}`);
        i += 1;
        continue;
      }
    }
    out.push(line);
    i += 1;
  }
  return out.join('\n');
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
  const hasPlatform = ctx.platformLabel && t.includes(ctx.platformLabel);
  const hasShipping = ctx.shippingLabel && t.includes(ctx.shippingLabel);
  return hasPlatform && hasShipping && /增值税|所得税|关税|流程图|行动建议|合规/.test(t);
}

function hasSparseAiContext(ctx) {
  return !(
    ctx.entity &&
    ctx.country &&
    ctx.hsCode &&
    ctx.revenue &&
    ctx.teamSize &&
    ctx.invoice &&
    ctx.exportMode
  );
}

function buildRefineHintHtml(ctx) {
  if (!hasSparseAiContext(ctx)) return '';
  return (
    `<p class="result-paragraph result-refine-hint">` +
    `${escapeHtml(window.DAOITH_t('ai.refineHint'))}` +
    `</p>`
  );
}

function buildBusinessFactsListHtml(ctx) {
  const rows = [
    ['电商平台', ctx.platformLabel],
    ['发货模式', ctx.shippingLabel],
    ['店铺主体', ctx.entityLabel],
    ['目的国/地区', ctx.countryLabel],
    ['产品HS编码', ctx.hsCode],
    ['年销售额', ctx.revenueLabel],
    ['团队人数', ctx.teamSizeLabel],
    ['供应商发票', ctx.invoiceLabel],
    ['目前出口方式', ctx.exportModeLabel],
  ];
  if (ctx.notes) rows.push(['补充说明', ctx.notes]);

  const items = rows
    .map(
      ([k, v]) =>
        `<li><span class="fact-key">${escapeHtml(k)}</span><span class="fact-val">${escapeHtml(v || '未填写')}</span></li>`
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
  const entityText = ctx.entityLabel || '店铺主体（未填写）';
  const countryText = ctx.countryLabel || '目标销售市场';
  const hsText = ctx.hsCode || '待定 HS 编码';
  const exportText = ctx.exportModeLabel || '出口方式（未填写）';
  const invoiceText = ctx.invoiceLabel || '发票情况（未填写）';
  const revenueText = ctx.revenueLabel || '销售额（未填写）';
  const teamText = ctx.teamSizeLabel || '团队规模（未填写）';
  const sparse = hasSparseAiContext(ctx);

  const flow = [
    `采购备货：按「${ctx.platformLabel}」常见备货节奏准备货源与单证；主体为「${entityText}」时核对合同、装箱与发票（${invoiceText}）`,
    usesOverseasWarehouse
      ? `履约发货：采用「${ctx.shippingLabel}」，货物通常先入海外仓/平台仓再配送至「${countryText}」买家；出口申报与 HS「${hsText}」、货值、物流单宜保持一致`
      : `履约发货：采用「${ctx.shippingLabel}」，多从国内仓直发「${countryText}」买家；关注通关时效、平台物流规则与包裹申报一致性`,
    `平台销售回款：在「${ctx.platformLabel}」完成销售、结算与费用核算${ctx.revenue ? `（年销售额区间：${revenueText}）` : ''}`,
    `税务申报闭环：梳理国内增值税/企业所得税（如适用）与目的国进口/流转税义务；细节随主体、市场与出口方式补全后可再细化`,
  ];

  const vatLines = !ctx.entity
    ? [
        `当前未填写店铺主体，以下为「${ctx.platformLabel}」+「${ctx.shippingLabel}」场景下的一般性增值税关注点。`,
        `若境内主体出口：出口方式与进项发票齐套程度决定免税/退税路径；发货模式「${ctx.shippingLabel}」会影响报关主体、货权转移时点与进项匹配。`,
        `若境外主体销售：需同步看清境内采购/报关安排与关联交易定价，避免票货不一致。`,
      ]
    : isCnEntity
      ? [
          `国内增值税：主体为「${entityText}」，出口方式「${exportText}」影响免税/退税路径；发货模式「${ctx.shippingLabel}」影响报关与进项匹配。`,
          ctx.invoice
            ? (invoiceRisk
              ? `发票风险偏高（${invoiceText}）：无票或普票占比会影响进项与退税资料链，建议优先梳理可取得专票的供应商。`
              : `发票情况「${invoiceText}」相对有利于进项与退税资料齐套，仍需保证票货款一致。`)
            : `尚未填写发票情况：建议尽快盘点专票/普票/无票占比，这是出口退税与成本核算的关键变量。`,
        ]
      : [
          `国内增值税：店铺主体为「${entityText}」，中国侧增值税链条可能较弱或仅涉及关联采购；出口方式「${exportText}」需与境内采购/报关主体对齐。`,
          `关注关联采购定价与发票流是否能支撑目的国进口申报完税价格。`,
        ];

  const citLines = [
    ctx.entity
      ? `企业所得税：利润主要归属「${entityText}」所在地税制${ctx.teamSize ? `；团队规模「${teamText}」影响费用归集与资料完备度` : ''}。`
      : `企业所得税：尚未填写主体时，先按「${ctx.platformLabel}」经营利润归属地原则预留合规空间，后续按实际注册地税制细化。`,
    usesOverseasWarehouse
      ? `使用「${ctx.shippingLabel}」时，需评估销售市场是否存在仓储/常设机构相关所得税争议，关联仓储服务费宜保留合同与定价依据。`
      : `「${ctx.shippingLabel}」通常常设机构风险低于海外仓模式，但仍需关注目的国远程销售阈值与「${ctx.platformLabel}」平台代扣规则。`,
  ];

  const dutyLines = [
    ctx.country || ctx.hsCode
      ? `目的国关税：目的国「${countryText}」、HS「${hsText}」共同决定归类与税率；申报完税价格应与采购/平台成交逻辑一致。`
      : `目的国关税：尚未填写市场与 HS 时，先按「${ctx.platformLabel}」主要站点常见归类合规要求处理——固定品名描述、保留成交与物流凭证，避免低报。`,
    ctx.hsCode
      ? `建议用页面「查询目的国关税税率」核对 ${ctx.hsCode}，再固定商编与品名描述。`
      : `补充 HS 编码与目的国后，可使用页面税率查询工具做更精确的关税粗算。`,
  ];

  const actions = [
    `30天内：固化业务档案——至少写明平台「${ctx.platformLabel}」与发货模式「${ctx.shippingLabel}」，并逐步补齐主体、目的国、HS、出口方式等`,
    `30天内：在「${ctx.platformLabel}」后台核对税务信息/税号上传与结算报表导出路径`,
    ctx.invoice
      ? `30天内：按「${invoiceText}」盘点供应商开票缺口，能改专票的优先改`
      : `30天内：盘点供应商开票能力（专票/普票/无票），识别影响退税与成本核算的缺口`,
    usesOverseasWarehouse
      ? `90天内：评估「${ctx.shippingLabel}」对应仓储地的进口/流转税与仓储合规边界，列出注册/申报日历`
      : `90天内：梳理「${ctx.platformLabel}」直发场景下的远程销售阈值、平台代扣与自行申报边界`,
    sparse
      ? `如需更细化的合规建议：请在左侧业务信息栏补充店铺主体、目的国、HS、发票与出口方式等信息后重新生成`
      : `90天内：建立月度「销售-物流-发票-申报」对账表，明确财务/运营责任人`,
  ];

  return [
    sparse
      ? '（说明：当前主要依据电商平台与发货模式生成一般性方案；补充左侧更多业务信息后可进一步细化。）'
      : '',
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
  ].filter(Boolean).join('\n');
}

function renderAIPlanHtml(text) {
  const lines = nestCustomAfterNonCustomPeers(
    nestPlanNumberedHierarchy(
      nestPlanBulletHierarchy(
        structureAnnotationPlainText(
          convertMarkdownTablesToBullets(sanitizeDiagnosisPlanText(text))
        )
      )
    )
  ).split('\n');
  let html = '';
  let listMode = null; // 'flow' | 'ol' | 'ul' | null
  let nestedUl = false;
  let liOpen = false;
  let flowMode = false;
  let sectionKind = 'default'; // 'flow' | 'risk' | 'plan' | 'default'
  /** Open nested <ul> depths under the current top-level ul (1 = first nest / 三级). */
  let ulNestDepth = 0;
  let ulLiOpenAt = []; // bool per nest depth whether <li> is open

  const closeNestedUl = () => {
    if (nestedUl) {
      html += '</ul>';
      nestedUl = false;
    }
  };

  const closeUlNestsTo = (targetDepth) => {
    while (ulNestDepth > targetDepth) {
      if (ulLiOpenAt[ulNestDepth]) {
        html += '</li>';
        ulLiOpenAt[ulNestDepth] = false;
      }
      html += '</ul>';
      ulNestDepth -= 1;
    }
  };

  const closeLi = () => {
    closeUlNestsTo(0);
    closeNestedUl();
    if (liOpen) {
      html += '</li>';
      liOpen = false;
    }
    ulLiOpenAt = [];
  };

  const closeList = () => {
    closeLi();
    if (listMode === 'flow' || listMode === 'ol') {
      html += '</ol>';
      if (listMode === 'flow') flowMode = false;
    } else if (listMode === 'ul') {
      html += '</ul>';
    }
    listMode = null;
    ulNestDepth = 0;
    ulLiOpenAt = [];
  };

  const openList = (mode) => {
    if (listMode === mode) return;
    closeList();
    if (mode === 'flow') {
      html += `<ol class="result-flow">`;
      flowMode = true;
    } else if (mode === 'ol') {
      html += `<ol class="result-list result-list-ordered">`;
    } else {
      html += `<ul class="result-list result-list-l2">`;
    }
    listMode = mode;
  };

  /** Emit a ul item at indent depth (0=二级, 1=三级, 2=四级, 3=五级). */
  const appendUlItem = (depth, contentHtml, asKv = false) => {
    let d = Math.max(0, Math.min(3, depth | 0));
    if (listMode !== 'ul') openList('ul');

    // No parent list item with content yet — never create an empty ● wrapper around ○
    if (d > 0 && !liOpen) d = 0;

    if (d === 0) {
      closeUlNestsTo(0);
      if (liOpen) {
        html += '</li>';
        liOpen = false;
      }
      if (asKv) {
        html += `<li class="result-kv">${contentHtml}</li>`;
        liOpen = false;
      } else {
        html += `<li>${contentHtml}`;
        liOpen = true;
      }
      return;
    }

    // Nested levels need an open parent <li>
    if (!liOpen) {
      html += `<li>`;
      liOpen = true;
    }
    closeUlNestsTo(d - 1);
    while (ulNestDepth < d) {
      const next = ulNestDepth + 1;
      const levelClass = next === 1 ? 'result-list-l3' : next === 2 ? 'result-list-l4' : 'result-list-l5';
      html += `<ul class="result-list ${levelClass}">`;
      ulNestDepth = next;
      ulLiOpenAt[ulNestDepth] = false;
    }
    if (ulLiOpenAt[d]) {
      html += '</li>';
    }
    html += `<li>${contentHtml}`;
    ulLiOpenAt[d] = true;
  };

  const isFlowchartTitle = (title) =>
    /业务流程图|业务流程现状|流程图/.test(String(title || '')) && !/主要风险|核心风险诊断/.test(String(title || ''));

  const cleanSectionTitle = (title) =>
    String(title || '')
      .replace(/\*\*/g, '')
      .replace(/[（(]\s*情形[一二三四五六七八九十\d]+[：:][^）)]*[）)]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    // Keep list open across blank lines so 1/2/3/4 numbering does not reset
    if (!line) continue;

    // Drop raw table junk that slipped through
    if (/^\|?\s*[-:|]+\s*$/.test(line) || (/^\|/.test(line) && /\|/.test(line) && !/[^\s|\-:]/.test(line))) {
      continue;
    }

    if (/道一（Daoith）/.test(line) && /合规专家/.test(line)) continue;
    if (/道一合规小助手/.test(line)) continue;
    if (/请您提供|请提供以下信息|请提供具体信息/.test(line)) continue;
    if (/通用框架|在您提供信息前|由于您尚未提供/.test(line)) continue;

    // Sub-labels「业务流程／主要风险」never render as bullets (even if model wrote `- **…**`)
    const subLabelPlain = line
      .replace(/\*/g, '')
      .replace(/^[-*•]\s+/, '')
      .replace(/^\d+[.)、．]\s+/, '')
      .trim();
    const subLabelMatch = subLabelPlain.match(
      /^(业务流程图|业务流程现状|业务流程|主要风险|核心风险)[:：]\s*(.*)$/
    );
    if (subLabelMatch) {
      closeList();
      const label = subLabelMatch[1] === '业务流程' ? '业务流程' : subLabelMatch[1];
      const rest = String(subLabelMatch[2] || '').trim();
      const isRiskLabel = /风险/.test(label);
      flowMode = isFlowchartTitle(label) || label === '业务流程';
      sectionKind = isRiskLabel ? 'risk' : flowMode ? 'flow' : sectionKind;
      html += `<h5 class="result-section-subtitle${flowMode ? ' result-flow-heading' : ''}">${escapeHtml(label)}：</h5>`;
      if (rest) {
        if (flowMode) {
          html += `<p class="result-paragraph">${formatInline(rest)}</p>`;
        } else {
          html += `<ul class="result-list result-list-l2"><li>${formatRiskOrBulletContent(rest)}</li></ul>`;
        }
      }
      continue;
    }

    // Chinese chapter headings: 一、基本流程
    if (
      /^[一二三四五六七八九十]+[、.．]\s*\S/.test(line.replace(/\*/g, '')) &&
      line.replace(/\*/g, '').length <= 36 &&
      !/^[-*•]/.test(line) &&
      !/^\d+[.)、．]/.test(line)
    ) {
      closeList();
      const title = cleanSectionTitle(line);
      flowMode = isFlowchartTitle(title);
      if (flowMode) sectionKind = 'flow';
      else if (/风险/.test(title)) sectionKind = 'risk';
      else if (/行动建议/.test(title)) sectionKind = 'actions';
      else if (/注意事项/.test(title)) sectionKind = 'notes';
      else if (/合规方案|流程|资料/.test(title)) sectionKind = 'plan';
      html += `<h5 class="result-section-subtitle${flowMode ? ' result-flow-heading' : ''}">${escapeHtml(title)}</h5>`;
      continue;
    }

    if (/^#{1,4}\s+/.test(line)) {
      closeList();
      const level = (line.match(/^#+/) || ['##'])[0].length;
      const title = cleanSectionTitle(line.replace(/^#{1,4}\s+/, ''));
      flowMode = isFlowchartTitle(title);
      if (flowMode) sectionKind = 'flow';
      else if (/风险/.test(title)) sectionKind = 'risk';
      else if (/行动建议/.test(title)) sectionKind = 'actions';
      else if (/注意事项/.test(title)) sectionKind = 'notes';
      else if (/合规方案/.test(title)) sectionKind = 'plan';
      const cls =
        level >= 3 ? 'result-section-subtitle' : 'result-section-title';
      const flowCls = flowMode ? ' result-flow-heading' : '';
      html += `<h5 class="${cls}${flowCls}">${escapeHtml(title)}</h5>`;
      continue;
    }

    // Diagnosis report section headers like 【核心风险诊断】 / 【合规方案】
    const cleanedBracketLine = cleanSectionTitle(line.replace(/\*/g, ''));
    const bracketTitle = cleanedBracketLine.match(/^【([^】]+)】\s*$/);
    if (bracketTitle) {
      closeList();
      const title = `【${bracketTitle[1]}】`;
      flowMode = false;
      if (/核心风险/.test(title)) sectionKind = 'risk';
      else if (/行动建议/.test(title)) sectionKind = 'actions';
      else if (/注意事项/.test(title)) sectionKind = 'notes';
      else if (/合规方案/.test(title)) sectionKind = 'plan';
      else sectionKind = 'default';
      html += `<h5 class="result-section-title">${escapeHtml(title)}</h5>`;
      continue;
    }

    const listInfo = parsePlanListMarker(rawLine);
    const orderedMatch = listInfo?.ordered ? [null, listInfo.content] : line.match(/^\d+[.)、．]\s*(.*)$/);
    const bulletMatch = listInfo && !listInfo.ordered ? [null, listInfo.content] : (!listInfo ? line.match(/^[-*•]\s+(.*)$/) : null);
    if (orderedMatch || bulletMatch) {
      let content = (orderedMatch ? orderedMatch[1] : bulletMatch[1]) || '';
      content = stripLeadingListIndex(content);
      const depth = listInfo ? listInfo.depth : 0;
      const looksLikeFlowStep =
        (flowMode || sectionKind === 'flow') &&
        content.length <= 36 &&
        !/[。；;]/.test(content);

      if (looksLikeFlowStep) {
        closeLi();
        openList('flow');
        html +=
          `<li class="result-flow-step">` +
          `<span class="result-flow-badge" aria-hidden="true"></span>` +
          `<span class="result-flow-card">${formatInline(content)}</span>`;
        liOpen = true;
        continue;
      }

      // Under 行动建议 / numbered plan: promote `- **标题**：说明` to next numbered peer
      // Never switch mid-section from bullets → numbers (avoids ○ then 1. mix).
      if (
        bulletMatch &&
        depth === 0 &&
        listMode === 'ol' &&
        liOpen &&
        looksLikePeerActionItem(content) &&
        (sectionKind === 'actions' || sectionKind === 'plan')
      ) {
        closeLi();
        openList('ol');
        html += `<li>${formatPlanListItem(content)}`;
        liOpen = true;
        continue;
      }

      // Nested detail under a numbered item (bullets or indented numbered sub-points)
      if (listMode === 'ol' && liOpen && (bulletMatch || (orderedMatch && depth > 0))) {
        if (!nestedUl) {
          html += `<ul class="result-list result-list-l3">`;
          nestedUl = true;
        }
        html += `<li>${formatPlanListItem(content)}</li>`;
        continue;
      }

      // notes/risk: flat bullets only. plan/actions: ordered only if section not already in ul.
      const useOrdered =
        depth === 0 &&
        listMode !== 'ul' &&
        content.length <= 220 &&
        (sectionKind === 'plan' || sectionKind === 'actions') &&
        (Boolean(orderedMatch) ||
          (sectionKind === 'actions' && looksLikePeerActionItem(content) && listMode !== 'ul'));

      // notes: keep flat discs. risk/plan/actions: honor markdown indent nesting.
      const effectiveDepth = sectionKind === 'notes' ? 0 : depth;

      if (useOrdered) {
        closeLi();
        openList('ol');
        html += `<li>${formatPlanListItem(content)}`;
        liOpen = true;
      } else {
        if (listMode === 'ol' || listMode === 'flow') closeList();
        const kv = matchBoldKvContent(content);
        // kv cards only for 合规方案对照（非定制/定制等）
        if (kv && sectionKind === 'plan' && effectiveDepth === 0) {
          appendUlItem(
            0,
            `<span class="result-kv-key">${escapeHtml(kv[1])}</span>` +
              `<span class="result-kv-val">${formatInline(kv[2])}</span>`,
            true
          );
        } else {
          appendUlItem(effectiveDepth, formatPlanListItem(content), false);
        }
      }
      continue;
    }

    // Single-line arrow flow: 采购 → 报关 → 履约
    if ((flowMode || sectionKind === 'flow') && /→|⟶|->|➜|➔/.test(line) && !/^#{1,4}\s+/.test(line)) {
      const parts = line
        .split(/\s*(?:→|⟶|->|➜|➔)\s*/)
        .map((s) => s.replace(/^[\d]+[.)、．]\s*/, '').trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        closeList();
        const inline = parts.length <= 4;
        html += `<ol class="result-flow${inline ? ' result-flow-inline' : ''}">`;
        parts.forEach((part) => {
          html +=
            `<li class="result-flow-step">` +
            `<span class="result-flow-badge" aria-hidden="true"></span>` +
            `<span class="result-flow-card">${formatInline(part)}</span>` +
            `</li>`;
        });
        html += `</ol>`;
        flowMode = false;
        continue;
      }
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
  const summaryLead = hasSparseAiContext(ctx)
    ? '以下为您已填写的业务信息。当前方案主要依据电商平台与发货模式给出一般性建议：'
    : '以下信息来自您在左侧表单的选择，方案据此生成：';

  return (
    `<p class="result-paragraph result-greeting">${escapeHtml(SOLUTION_GREETING)}</p>` +
    `<h5 class="result-section-title">一、业务背景信息总结</h5>` +
    `<p class="result-paragraph">${escapeHtml(summaryLead)}</p>` +
    buildBusinessFactsListHtml(ctx) +
    buildRefineHintHtml(ctx) +
    `<h5 class="result-section-title">二、解决方案</h5>` +
    (body || `<p class="result-paragraph">方案生成失败，请重试。</p>`)
  );
}

/** Speak in the chat app’s expected format; allow sparse optional fields. */
function buildSolutionPrompt(ctx) {
  const sparse = hasSparseAiContext(ctx);
  const val = (v) => v || '未填写';
  return `必填信息（已提供）：
电商平台：${ctx.platformLabel}
发货/仓储模式：${ctx.shippingLabel}

其他业务信息（未填写请按一般性处理，禁止追问）：
目的国/地区：${val(ctx.countryLabel)}
预计年销售额：${val(ctx.revenueLabel)}（人民币）
主要产品HS编码：${val(ctx.hsCode)}
企业主体所在地：${val(ctx.entityLabel)}
目前出口方式：${val(ctx.exportModeLabel)}
供应商发票情况：${val(ctx.invoiceLabel)}
团队人数：${val(ctx.teamSizeLabel)}
补充说明：${ctx.notes || '无'}

请不要再询问任何信息。请立即输出${sparse ? '一般性' : '定制'}合规方案，正文必须点名电商平台「${ctx.platformLabel}」与发货模式「${ctx.shippingLabel}」。
${sparse ? '若多项信息未填写：方案应明确这是基于平台与发货模式的一般性框架，并在行动建议中提示用户可在左侧业务信息栏补充店铺主体、目的国、HS、发票与出口方式等以获得更细化建议。' : '请尽量结合已填写的主体、目的国、HS 等信息做针对性分析。'}
输出结构：
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
  '5000-10000': '5000万-1亿人民币',
  '1-4yi': '1-4亿人民币',
  '4-10yi': '4-10亿人民币',
  above10yi: '10亿以上人民币',
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
  self_overseas: '自发货（海外仓发货）',
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
  bonded_1210: '1210保税出口',
  freight_forwarder: '委托货代出口',
  other: '其他',
};

function getFormContext() {
  const val = (id) => document.getElementById(id)?.value || '';
  const platform = val('platform');
  const entity = val('entity');
  const country = val('country');
  const shipping = val('shipping');
  const exportMode = val('exportMode');
  const revenue = val('revenue');
  const teamSize = val('teamSize');
  const invoice = val('invoice');

  return {
    platform,
    entity,
    country,
    shipping,
    exportMode,
    hsCode: val('hsCode').trim(),
    revenue,
    teamSize,
    invoice,
    notes: val('notes').trim(),
    platformLabel: platformNames[platform] || platform,
    entityLabel: entity ? (entityNames[entity] || entity) : '',
    countryLabel: country ? (countryNames[country] || country) : '',
    shippingLabel: shippingModes[shipping] || shipping,
    exportModeLabel: exportMode ? (exportModeNames[exportMode] || exportMode) : '',
    revenueLabel: revenueNames[revenue] || '',
    teamSizeLabel: teamSizeNames[teamSize] || '',
    invoiceLabel: invoiceNames[invoice] || '',
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
  // 出口退税：只展示税率框，不展示来源/说明文案
  if (kind === 'refund' || !result) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  const title = '目的国关税';
  const link = result.sourceUrl
    ? ` <a href="${escapeHtml(result.sourceUrl)}" target="_blank" rel="noopener noreferrer">官方查询</a>`
    : '';
  el.hidden = false;
  el.innerHTML =
    `<strong>${escapeHtml(title)}</strong>：${escapeHtml(result.display)}` +
    (result.message ? `｜${escapeHtml(result.message)}` : '') +
    link;
}

function formatWan(value) {
  return `${(Number(value) || 0).toFixed(2)} 万元`;
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
  { id: 'shipping', empty: (el) => !el.value },
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

function initHsRebateQuery() {
  const queryBtn = document.getElementById('queryTax');
  if (!queryBtn) return;

  queryBtn.addEventListener('click', async () => {
    const hsCode = document.getElementById('hsCode')?.value.trim();
    if (!hsCode) {
      alert(window.DAOITH_t('alert.hsCode'));
      return;
    }
    const hsDigits = hsCode.replace(/\D/g, '');
    if (hsDigits.length < 8) {
      alert('请填写10位海关编码以获得准确退税率（至少需8位数字）');
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

      let result = null;
      try {
        const kb = await lookupRefundRateFromKnowledgeBase(hsCode);
        if (kb && kb.ok && kb.rate != null) {
          result = kb;
        }
      } catch {
        // Fall back to local table when API/KB unavailable.
      }

      if (!result) {
        result = api.lookupRefundRate(hsCode);
      }

      if (rateBox) rateBox.value = result.display || '—';
      setHsRateSource('refund', null);

      if (result.ok && result.rate != null) {
        const refundInput = document.getElementById('taxRefund');
        if (refundInput) refundInput.value = String(result.rate);
      }

      if (!result.ok) {
        alert('未查到参考退税率，请核对海关编码后重试');
      }
    } catch (err) {
      if (rateBox) rateBox.value = '';
      setHsRateSource('refund', null);
      alert(err.message);
    } finally {
      setButtonLoading(queryBtn, false);
    }
  });
}

/* Legacy alias — form-based plan generator removed in favor of diagnosis chat */
function initAIForm() {
  initHsRebateQuery();
}

/* Tax Calculator */
function initTaxCalculator() {
  const calcBtn = document.getElementById('calcTax');
  const resultEl = document.getElementById('taxResult');
  if (!calcBtn || !resultEl) return;

  calcBtn.addEventListener('click', async () => {
    if (!ensureWeChatLogin('tax-calc')) return;

    const revenue = parseFloat(document.getElementById('taxRevenue').value) || 0;
    const refundRate = parseFloat(document.getElementById('taxRefund').value) || 0;
    const refundEligible = (document.getElementById('taxRefundEligible')?.value || 'yes') === 'yes';
    const productCostRate = parseFloat(document.getElementById('taxProductCostRate').value) || 0;
    const marketingRate = parseFloat(document.getElementById('taxMarketingRate').value) || 0;
    const shippingRate = parseFloat(document.getElementById('taxShippingRate').value) || 0;
    const staffRate = parseFloat(document.getElementById('taxStaffRate').value) || 0;
    const otherRate = parseFloat(document.getElementById('taxOtherRate').value) || 0;
    const incomeRate = parseFloat(document.getElementById('taxIncome').value) || 0;
    const vatLevyRate = 13; // 国内货物增值税征税率（简化）

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
      const profitRate = 1
        - (productCostRate / 100)
        - (marketingRate / 100)
        - (shippingRate / 100)
        - (staffRate / 100)
        - (otherRate / 100);
      const incomeTax = Math.max(0, revenue * profitRate * (incomeRate / 100));
      // 满足退免税：出口退税 = 销售额 × 产品成本率 × 出口退税率
      // 不满足：按内销增值税 = 销售额 × (1 − 产品成本率) × 13%
      const exportRebate = revenue * (productCostRate / 100) * (refundRate / 100);
      const domesticVat = revenue * (1 - productCostRate / 100) * (vatLevyRate / 100);
      const vatOrRebate = refundEligible ? exportRebate : domesticVat;
      const total = refundEligible ? incomeTax - exportRebate : incomeTax + domesticVat;
      const locale = window.DAOITH_getLocale?.() || 'zh';
      const copy = locale === 'en'
        ? {
            income: '1) Corporate income tax',
            incomeFormula: 'Sales × (1 − product − marketing − shipping − staff − other) × CIT rate',
            vatYes: '2) Export rebate',
            vatYesFormula: 'Export sales × product cost ratio × export rebate rate',
            vatNo: '2) Domestic sales VAT',
            vatNoFormula: 'Sales × (1 − product cost ratio) × 13%',
            total: 'Net domestic tax burden',
            disclaimer: 'Note: this calculation is based on simplified assumptions and should not be used directly for business decisions. For a precise tax-burden analysis, please consult a tax expert.',
          }
        : {
            income: '1）企业所得税',
            incomeFormula: '销售额 × (1 − 产品成本率 − 营销费率 − 运输费率 − 员工成本率 − 其他费用率) × 适用所得税税率',
            vatYes: '2）出口退税',
            vatYesFormula: '出口销售额 × 产品成本率 × 出口退税率',
            vatNo: '2）内销增值税',
            vatNoFormula: '销售额 × (1 − 产品成本率) × 13%',
            total: '国内税负合计（净额）',
            disclaimer: '注意说明：以上计算基于一定的假设，不能直接作为企业决策依据，如需精准的税负分析，可咨询财税专家。',
          };
      const vatLabel = refundEligible ? copy.vatYes : copy.vatNo;
      const vatFormula = refundEligible ? copy.vatYesFormula : copy.vatNoFormula;

      resultEl.textContent = formatWan(total);
      note.innerHTML = `
        <div class="tax-breakdown">
          <div class="tax-breakdown-section">
            <div><strong>${copy.income}</strong>：${formatWan(incomeTax)}</div>
            <div class="tax-breakdown-formula">${copy.incomeFormula}</div>
          </div>
          <div class="tax-breakdown-section">
            <div><strong>${vatLabel}</strong>：${formatWan(vatOrRebate)}</div>
            <div class="tax-breakdown-formula">${vatFormula}</div>
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

/* Services marketplace — render from DAOITH_SERVICES */
const SERVICES_PREVIEW_COUNT = 6;

function escapeServiceHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getLocalizedService(service) {
  const locale = window.DAOITH_getLocale?.() || 'zh';
  if (locale !== 'en') return service;
  const en = (window.DAOITH_I18N_EN?.servicesCatalog || []).find((s) => s.id === service.id);
  if (!en) return service;
  return {
    ...service,
    title: en.title || service.title,
    desc: en.desc || service.desc,
    unit: en.unit || service.unit,
  };
}

function initServicesMarketplace() {
  const filtersEl = document.getElementById('serviceFilters');
  const grid = document.getElementById('servicesGrid');
  const moreBtn = document.getElementById('showMoreServices');
  if (!filtersEl || !grid) return;

  const categories = window.DAOITH_SERVICE_CATEGORIES || [
    { id: 'all', label: '全部' },
  ];
  const services = window.DAOITH_SERVICES || [];
  let activeFilter = 'all';
  let expanded = false;

  const enCategoryLabels = {
    all: 'All',
    consult: 'Advisory',
    mainland: 'Mainland China',
    hongkong: 'Hong Kong',
    asia: 'Asia',
    europe: 'Europe',
    americas: 'Americas',
    'africa-oceania': 'Africa & Oceania',
  };

  function categoryLabel(cat) {
    const locale = window.DAOITH_getLocale?.() || 'zh';
    if (locale === 'en') return enCategoryLabels[cat.id] || cat.label;
    return cat.label;
  }

  function filteredServices() {
    if (activeFilter === 'all') return services;
    return services.filter((s) => s.category === activeFilter);
  }

  function renderFilters() {
    filtersEl.innerHTML = categories
      .map(
        (cat) => `
      <button type="button" class="filter-btn${cat.id === activeFilter ? ' active' : ''}" data-filter="${escapeServiceHtml(cat.id)}">
        ${escapeServiceHtml(categoryLabel(cat))}
      </button>`
      )
      .join('');

    filtersEl.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.filter || 'all';
        expanded = activeFilter !== 'all';
        renderFilters();
        renderCards();
      });
    });
  }

  function renderCards() {
    const locale = window.DAOITH_getLocale?.() || 'zh';
    const detailLabel = locale === 'en' ? 'Service details' : '服务详情';
    const cartLabel = locale === 'en' ? 'Add to inquiry list' : '加入询价单';
    const list = filteredServices();
    const limit = activeFilter === 'all' && !expanded ? SERVICES_PREVIEW_COUNT : list.length;
    const visible = list.slice(0, limit);

    grid.innerHTML = visible
      .map((raw) => {
        const s = getLocalizedService(raw);
        return `
      <div class="service-card" data-category="${escapeServiceHtml(s.category)}" data-service-id="${escapeServiceHtml(s.id)}">
        <h4>${escapeServiceHtml(s.title)}</h4>
        <p>${escapeServiceHtml(s.desc)}</p>
        <div class="service-price">${escapeServiceHtml(s.priceLabel)} <span>${escapeServiceHtml(s.unit)}</span></div>
        <div class="service-card-actions">
          <a class="btn btn-outline btn-sm" href="/service.html?id=${encodeURIComponent(s.id)}" data-action="detail">${escapeServiceHtml(detailLabel)}</a>
          <button type="button" class="btn btn-primary btn-sm" data-action="add" data-service-id="${escapeServiceHtml(s.id)}">${escapeServiceHtml(cartLabel)}</button>
        </div>
      </div>`;
      })
      .join('');

    if (moreBtn) {
      const needMore = activeFilter === 'all' && list.length > SERVICES_PREVIEW_COUNT;
      moreBtn.hidden = !needMore;
      moreBtn.dataset.expanded = expanded ? 'true' : 'false';
      moreBtn.dataset.total = String(list.length);
      if (needMore) {
        moreBtn.textContent = expanded
          ? window.DAOITH_t('services.collapse')
          : window.DAOITH_t('services.showAll').replace('{n}', String(list.length));
      }
    }

    window.DAOITH_CART?.bindAddButtons?.(grid);
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      if (activeFilter !== 'all') return;
      expanded = !expanded;
      renderCards();
    });
  }

  renderFilters();
  renderCards();

  window.addEventListener('localechange', () => {
    renderFilters();
    renderCards();
  });
}

function initServiceFilters() {
  /* replaced by initServicesMarketplace */
}

function initShowMoreServices() {
  /* replaced by initServicesMarketplace */
}

/* Hub Tabs */
function initHubTabs() {
  const tabs = document.querySelectorAll('.hub-tab');
  const tabPanes = {
    orders: document.getElementById('ordersTab'),
    quotes: document.getElementById('quotesTab'),
    feedback: document.getElementById('feedbackTab'),
  };

  async function refreshHubQuotes() {
    const quotes = await loadQuotesForHub();
    renderQuotesList(quotes);
    renderHubProgress(quotes);
    return quotes;
  }

  function showTab(name) {
    Object.entries(tabPanes).forEach(([k, el]) => {
      if (el) el.style.display = k === name ? '' : 'none';
    });
    if (name === 'quotes' || name === 'orders') refreshHubQuotes();
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      showTab(tab.dataset.tab);
    });
  });

  refreshHubQuotes();
  window.addEventListener('daoith-auth-change', () => {
    refreshHubQuotes();
  });
}

function getQuotes(openid) {
  if (window.DAOITH_CART?.getQuotes) return window.DAOITH_CART.getQuotes(openid);
  try {
    const oid = openid != null
      ? String(openid).trim()
      : String(window.DAOITH_AUTH?.getUser?.()?.openid || '').trim();
    const key = oid ? `daoith_quotes:${oid}` : 'daoith_quotes:anon';
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function setQuotesCache(list) {
  if (window.DAOITH_CART?.setQuotes) {
    window.DAOITH_CART.setQuotes(list);
    return;
  }
  try {
    const openid = String(window.DAOITH_AUTH?.getUser?.()?.openid || '').trim();
    const key = openid ? `daoith_quotes:${openid}` : 'daoith_quotes:anon';
    localStorage.setItem(key, JSON.stringify((list || []).slice(0, 50)));
    localStorage.removeItem('daoith_quotes');
  } catch { /* ignore */ }
}

function normalizeRemoteQuote(q) {
  const status = q.status || '已提交';
  const createdAt = q.createdAt;
  let statusHistory = q.statusHistory && typeof q.statusHistory === 'object' ? { ...q.statusHistory } : {};
  // Client-side backfill if API/cache missing intermediate times
  const order = ['已提交', '处理中', '已报价'];
  const path = (status === '已成交' || status === '已关闭')
    ? [...order, status]
    : (order.includes(status) ? order.slice(0, order.indexOf(status) + 1) : ['已提交']);
  const fallbackAt = statusHistory['已提交'] || createdAt;
  path.forEach((key) => {
    if (!statusHistory[key] && fallbackAt) statusHistory[key] = fallbackAt;
  });
  return {
    inquiryId: q.inquiryId,
    company: q.company,
    contact: q.contact,
    phone: q.phone,
    total: q.total,
    items: q.items || [],
    status,
    statusHistory,
    createdAt,
    openid: q.websiteOpenid || null,
  };
}

async function fetchRemoteQuotes() {
  const token = window.DAOITH_AUTH?.getToken?.();
  if (!token) return null;
  try {
    const res = await fetch(`${notifyApiBase()}/api/inquiry?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    return Array.isArray(data.inquiries) ? data.inquiries.map(normalizeRemoteQuote) : [];
  } catch {
    return null;
  }
}

async function loadQuotesForHub() {
  const openid = String(window.DAOITH_AUTH?.getUser?.()?.openid || '').trim();
  // Always drop the legacy shared key that mixed accounts on one browser
  try { localStorage.removeItem('daoith_quotes'); } catch { /* ignore */ }

  if (!openid) {
    // Hub quote history is account-scoped; guests see empty
    return [];
  }

  const remote = await fetchRemoteQuotes();
  if (remote) {
    // Server list for this openid is the source of truth — never merge other accounts' local cache
    setQuotesCache(remote);
    return remote;
  }
  return getQuotes(openid);
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatWanHub(v) {
  return `¥${(Number(v) || 0).toFixed(2)} 万元`;
}

function quoteStatusLabel(status) {
  const s = status || '已提交';
  return s;
}

function renderQuotesList(quotes) {
  const wrap = document.getElementById('quotesListWrap');
  if (!wrap) return;
  const list = Array.isArray(quotes) ? quotes : getQuotes();
  if (!list.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="icon">📬</div><h4>暂无询价记录</h4><p>在购物车提交询价后，记录将显示在这里</p></div>`;
    return;
  }
  wrap.innerHTML = list.map((q, i) => {
    const services = (q.items || []).map((it) => `${it.title} × ${it.qty}`).join('、');
    const status = quoteStatusLabel(q.status);
    return `
      <div class="quote-record">
        <div class="quote-record-head">
          <span class="quote-record-no">${q.inquiryId || `询价 #${list.length - i}`}</span>
          <span class="quote-record-date">${formatDate(q.createdAt)}</span>
          <span class="quote-record-status">${status}</span>
        </div>
        <div class="quote-record-body">
          <div><strong>公司：</strong>${q.company || '—'} &nbsp; <strong>联系人：</strong>${q.contact || '—'} &nbsp; <strong>电话：</strong>${q.phone || '—'}</div>
          <div class="quote-record-services">${services || '—'}</div>
          <div class="quote-record-total">预计总价：${formatWanHub(q.total)}</div>
        </div>
      </div>`;
  }).join('');
}

function renderHubProgress(quotes) {
  const wrap = document.getElementById('hubProgressWrap') || document.getElementById('quoteProgressWrap');
  if (!wrap) return;
  const list = Array.isArray(quotes) ? quotes : getQuotes();
  if (!list.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="icon icon-muted">—</div><h4>暂未提交询价</h4><p>在购物车提交询价后，顾问会跟进并在此更新进度</p><a href="/cart.html" class="btn btn-primary btn-sm" style="margin-top:12px">前往购物车</a></div>`;
    return;
  }
  const latest = list[0];
  const status = latest.status || '已提交';
  const history = latest.statusHistory && typeof latest.statusHistory === 'object' ? latest.statusHistory : {};
  const services = (latest.items || []).map((it) => it.title).join('、');
  const pathDone = {
    '已提交': ['已提交', '处理中', '已报价', '已成交', '已关闭'],
    '处理中': ['处理中', '已报价', '已成交', '已关闭'],
    '已报价': ['已报价', '已成交', '已关闭'],
    '已成交': ['已成交'],
    '已关闭': ['已关闭'],
  };
  // 已成交 / 已关闭 终态二选一：两个节点都展示，仅选中的算完成
  const steps = [
    { key: '已提交', title: '询价已提交', pendingText: '—' },
    { key: '处理中', title: '处理中', pendingText: '待处理' },
    { key: '已报价', title: '已报价', pendingText: '待报价' },
    { key: '已成交', title: '已成交', pendingText: status === '已关闭' ? '未选' : '—' },
    { key: '已关闭', title: '已关闭', pendingText: status === '已成交' ? '未选' : '—' },
  ];
  wrap.innerHTML = `
    <div class="quote-progress">
      ${steps.map((step) => {
        const done = (pathDone[step.key] || []).includes(status);
        const skipped = (step.key === '已成交' && status === '已关闭')
          || (step.key === '已关闭' && status === '已成交');
        const cls = [
          done ? 'done' : '',
          skipped ? 'skipped' : '',
        ].filter(Boolean).join(' ');
        const at = history[step.key]
          || (done && step.key === '已提交' ? latest.createdAt : '')
          || (done ? history['已提交'] || latest.createdAt : '');
        const sub = done
          ? (at ? formatDate(at) : '—')
          : (step.pendingText || '—');
        return `
          <div class="quote-progress-step ${cls}">
            <div class="step-dot"></div>
            <div class="step-body">
              <strong>${step.title}</strong>
              <span>${sub}</span>
            </div>
          </div>`;
      }).join('')}
    </div>
    <div class="quote-progress-meta">
      <span>最新询价：${services || '—'}（${status}）</span>
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
function notifyApiBase() {
  const cfg = window.DAOITH_CONFIG || {};
  return (cfg.notifyApiBase || 'https://api.daoith.com').replace(/\/$/, '');
}

function setWechatToggleUi(on) {
  const toggle = document.getElementById('wechatToggle');
  if (!toggle) return;
  toggle.classList.toggle('active', !!on);
  toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
}

async function fetchNotifyStatus() {
  const token = window.DAOITH_AUTH?.getToken?.();
  if (!token) return { enabled: false, bound: false };
  const res = await fetch(`${notifyApiBase()}/api/auth/wechat/notify/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function postNotify(path, body) {
  const token = window.DAOITH_AUTH?.getToken?.();
  if (!token) throw new Error(window.DAOITH_t('auth.loginRequired'));
  const res = await fetch(`${notifyApiBase()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : '{}',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.needBind = !!data.needBind;
    err.data = data;
    throw err;
  }
  return data;
}

function initWechatBindModal() {
  const modal = document.getElementById('wechatBindModal');
  if (!modal) return { open() {}, close() {} };

  let pollTimer = null;
  let currentBindUrl = '';

  function close() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function refreshAfterBind() {
    try {
      const status = await fetchNotifyStatus();
      if (status.enabled && status.bound) {
        setWechatToggleUi(true);
        const hint = document.getElementById('wechatBindHint');
        if (hint) hint.textContent = window.DAOITH_t('alert.wechatBoundOk');
        close();
        alert(window.DAOITH_t('alert.wechatOn'));
      }
    } catch {
      /* keep polling */
    }
  }

  async function open(bindUrl) {
    currentBindUrl = bindUrl;
    const qr = document.getElementById('wechatBindQr');
    const urlText = document.getElementById('wechatBindUrlText');
    const hint = document.getElementById('wechatBindHint');
    if (qr) {
      qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(bindUrl)}`;
    }
    if (urlText) urlText.textContent = bindUrl;
    if (hint) hint.textContent = window.DAOITH_t('alert.wechatBindWaiting');
    modal.hidden = false;
    document.body.classList.add('modal-open');
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(refreshAfterBind, 2500);
  }

  modal.querySelectorAll('[data-close-wechat-bind]').forEach((el) => {
    el.addEventListener('click', async () => {
      close();
      try {
        const status = await fetchNotifyStatus();
        setWechatToggleUi(!!status.enabled);
      } catch {
        setWechatToggleUi(false);
      }
    });
  });

  document.getElementById('wechatBindCopy')?.addEventListener('click', async () => {
    if (!currentBindUrl) return;
    try {
      await navigator.clipboard.writeText(currentBindUrl);
      const btn = document.getElementById('wechatBindCopy');
      if (btn) btn.textContent = window.DAOITH_t('alert.wechatLinkCopied');
    } catch {
      alert(currentBindUrl);
    }
  });

  return { open, close };
}

function initWechatToggle() {
  const toggle = document.getElementById('wechatToggle');
  if (!toggle) return;
  const bindModal = initWechatBindModal();
  let busy = false;

  async function syncFromServer() {
    if (!window.DAOITH_AUTH?.isLoggedIn?.()) {
      setWechatToggleUi(false);
      return;
    }
    try {
      const status = await fetchNotifyStatus();
      setWechatToggleUi(!!status.enabled);
    } catch (err) {
      setWechatToggleUi(false);
      // Surface auth mismatch once (Vercel JWT vs Aliyun) instead of silent fail
      if (err && /登录|过期|401/.test(String(err.message || ''))) {
        console.warn('[wechat-notify]', err.message);
      }
    }
  }

  syncFromServer();
  window.addEventListener('daoith-auth-change', syncFromServer);

  toggle.addEventListener('click', async () => {
    if (busy) return;
    if (!window.DAOITH_AUTH?.requireLogin?.('wechat_notify', window.location.href.split('#')[0] + '#hub')) {
      return;
    }

    const turningOn = !toggle.classList.contains('active');
    busy = true;
    toggle.disabled = true;
    try {
      if (!turningOn) {
        await postNotify('/api/auth/wechat/notify/disable');
        setWechatToggleUi(false);
        alert(window.DAOITH_t('alert.wechatOff'));
        return;
      }

      let status = await fetchNotifyStatus();
      if (status.bound) {
        await postNotify('/api/auth/wechat/notify/enable');
        setWechatToggleUi(true);
        alert(window.DAOITH_t('alert.wechatOn'));
        return;
      }

      const ticketData = await postNotify('/api/auth/wechat/notify/ticket');
      const bindUrl = ticketData.bindUrl || `https://www.daoith.com/auth/wechat-oa-bind.html?ticket=${encodeURIComponent(ticketData.ticket)}`;
      await bindModal.open(bindUrl);
    } catch (err) {
      if (err.needBind) {
        try {
          const ticketData = await postNotify('/api/auth/wechat/notify/ticket');
          const bindUrl = ticketData.bindUrl || `https://www.daoith.com/auth/wechat-oa-bind.html?ticket=${encodeURIComponent(ticketData.ticket)}`;
          await bindModal.open(bindUrl);
        } catch (e2) {
          alert(e2.message || window.DAOITH_t('alert.wechatBindFail'));
        }
      } else {
        alert(err.message || window.DAOITH_t('alert.wechatBindFail'));
      }
      setWechatToggleUi(false);
    } finally {
      busy = false;
      toggle.disabled = false;
    }
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
