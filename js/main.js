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
  initAiSolutionGuide();
  initAiChatbot();
  initTaxCalculator();
  initServicesMarketplace();
  initServiceHub();
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
    if (typeof window.DAOITH_refreshHub === 'function') window.DAOITH_refreshHub();
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
    const prevView = document.body.dataset.activeView;

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

    if (view === 'hub' && prevView !== 'hub') {
      requestAnimationFrame(() => window.DAOITH_playHubJourney?.());
    }
    if (view === 'ai-solution' && prevView !== 'ai-solution') {
      requestAnimationFrame(() => window.DAOITH_playAiSolutionJourney?.());
    }
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
  const cards = document.querySelectorAll('#hero .process-card[data-step]');
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
  // Preserve Workflow / Agent JSON report before CoT & draft stripping
  // (JSON often contains 销售平台： etc. and would otherwise be wiped as a draft)
  const preservedJson = extractDiagnosisReportJson(raw);
  if (preservedJson && isDiagnosisReportJsonReady(preservedJson)) {
    try {
      return JSON.stringify(preservedJson);
    } catch {
      /* fall through */
    }
  }

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
    /我们被要求|我回想|根据我训练数据|需要准确查询|所以可直接回答|按照回答要求|必须严格按|假设知识库|思考过程|逐步分析|我先思考|正在检索知识库|调用工具|Action:|Observation:|让我回顾一下|用户已经完成了第|缺少第二步|我需要汇总信息|让我检索知识库|让我再尝试|知识库返回为空|需要检索的知识库|Wait,\s*I need|Let me re-read|Hmm,?\s*actually/.test(
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
    // Internal path labels leaked into answer → keep Chinese body as 合规方案
    .replace(
      /(?:^|\n)\s*\*{0,2}【?\s*路径[ABC][·.．][^】\n]*】?\*{0,2}\s*/g,
      '\n【合规方案】\n'
    )
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

  // Drop English writing outlines that reuse Chinese report headers
  if (t && looksLikeDiagnosisPlanScaffold(t)) {
    t = '';
  }

  // Normalize section titles + strip English prompt-meta before salvage
  if (t) {
    t = prepareDiagnosisPlanMarkdown(t);
  }

  // Last resort: salvage formal Chinese report sections from the raw model text
  if (!t || looksLikeDiagnosisPlanScaffold(t) || !isDiagnosisPlanReadyToShow(t)) {
    const salvaged = prepareDiagnosisPlanMarkdown(salvageDiagnosisPlanFromRaw(raw) || '');
    if (salvaged && isDiagnosisPlanReadyToShow(salvaged)) t = salvaged;
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
      if (m) t = prepareDiagnosisPlanMarkdown(clean(m[0]));
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
      /您好[，,]?\s*欢迎使用道一合规(?:诊断)?助手[！!]?\s*(?:我们)?为跨境电商企业提供合规解决方案[，,]?\s*我将根据您的情况提供针对性的合规方案[。.]?\s*/g,
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
      /您好[，,]?\s*欢迎使用道一合规(?:诊断)?助手[！!]?\s*(?:我们)?为跨境电商企业提供合规解决方案[，,]?\s*我将根据您的情况提供针对性的合规方案[。.]?\s*/g,
      ''
    )
    .replace(
      /您好[，,]?\s*我是\*{0,2}道一合规(?:诊断)?助手\*{0,2}[。.]?\s*/g,
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

const DIAG_PICK_HINT = '（可在下方点选）';

/** Force diagnosis asks to tip chips below — never keep option lists in the question text. */
function normalizeDiagAskHint(text) {
  let t = String(text || '');
  // Known verbose templates → short ask + tip
  t = t.replace(
    /(^\s*(?:\*\*)?1\.\s*)您在哪个电商平台上销售商品[？?][^\n]*/gm,
    `$1您在哪个电商平台上销售商品？${DIAG_PICK_HINT}`
  );
  t = t.replace(
    /(^\s*(?:\*\*)?2\.\s*)您平台店铺的注册主体是[^？?\n]*[？?][^\n]*/gm,
    `$1您平台店铺的注册主体是哪一种？${DIAG_PICK_HINT}`
  );
  t = t.replace(
    /(^\s*(?:\*\*)?3\.\s*)请问您的发货方式是以下哪一种[？?][^\n]*/gm,
    `$1请问您的发货方式是以下哪一种？${DIAG_PICK_HINT}`
  );
  t = t.replace(
    /(^\s*(?:\*\*)?4\.\s*)您目前货物的出口方式是怎么样的[？?][^\n]*/gm,
    `$1您目前货物的出口方式是怎么样的？${DIAG_PICK_HINT}`
  );
  t = t.replace(
    /(^\s*(?:\*\*)?5\.\s*)您目前供应商[^？?\n]*[？?][^\n]*/gm,
    `$1您目前供应商发票情况如何？${DIAG_PICK_HINT}`
  );
  t = t.replace(
    /(^\s*(?:\*\*)?6\.\s*)您的产品属于以下哪种类别[？?][^\n]*/gm,
    `$1您的产品属于以下哪种类别？${DIAG_PICK_HINT}`
  );
  t = t.replace(
    /(^\s*(?:\*\*)?7\.\s*)您目前年销售额约多少人民币[？?][^\n]*/gm,
    `$1您目前年销售额约多少人民币？${DIAG_PICK_HINT}`
  );
  // Unnumbered platform ask (model sometimes omits「1.」)
  t = t.replace(
    /(^|\n)(\s*)(?:\*\*)?您在哪个电商平台上销售商品[？?]\s*[（(][^）\n]*[）)](?:\*\*)?/g,
    `$1$2您在哪个电商平台上销售商品？${DIAG_PICK_HINT}`
  );
  // Any remaining「（例如：…）」after a question → tip
  t = t.replace(/([？?])\s*[（(]例如[：:][^）\n]*[）)]/g, `$1${DIAG_PICK_HINT}`);
  // Step 1–7 lines that still have a long parenthetical after ？
  t = t.replace(
    /(^\s*(?:\*\*)?[1-7]\.\s+[^\n？?]*[？?])(?:\*\*)?\s*[（(](?!可在下方点选)[^）\n]{2,}[）)]/gm,
    `$1${DIAG_PICK_HINT}`
  );
  // Step 1–7 asks missing the tip
  t = t.replace(
    /(^\s*(?:\*\*)?([1-7])\.\s+(?:您|请问)[^\n？?]*[？?])(?!\s*（可在下方点选）)/gm,
    `$1${DIAG_PICK_HINT}`
  );
  return t;
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
  let t = normalizeDiagAskHint(
    stripDiagChoiceDump(
      stripDiagMetaHeadings(normalizeDiagStepLabels(String(text || '').replace(/\r/g, '')))
    )
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
    // 「3. ……？」——只加粗问句；统一附「（可在下方点选）」，选项在下方 chips
    const stepMatch = trimmed.match(/^(?:\*\*)?(\d+\.\s+[^？?\n]*[？?])(?:\*\*)?(.*)$/);
    if (stepMatch && !/了解/.test(stepMatch[1])) {
      hit = true;
      const q = stepMatch[1].replace(/\*\*/g, '');
      if (/^[1-7]\./.test(q)) {
        return `${indent}**${q}**${DIAG_PICK_HINT}`;
      }
      const tail = String(stepMatch[2] || '').trim();
      if (tail && !/^(?:选项|可选)[：:]/.test(tail) && /^[（(]/.test(tail) && tail.length <= 40) {
        return `${indent}**${q}**${stepMatch[2]}`;
      }
      return `${indent}**${q}**`;
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
  // Tip on its own line under the question (chips are below the bubble)
  html = String(html || '').replace(
    /\s*（可在下方点选）/g,
    '<span class="diag-ask-hint">（可在下方点选）</span>'
  );
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
    '特定问题直接咨询',
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
    '产品涉及海关备案商标但暂未获得授权',
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
    /(开启专属合规诊断|特定问题想直接提问|特定问题直接咨询|专属合规诊断|直接提问)/.test(zone) &&
    /(请选择|请在下方选择|还是|或者|两种|模式)/.test(zone)
  ) {
    return 'modeSelect';
  }
  if (/(请选择|请在下方选择)/.test(zone) && /(合规诊断|直接提问|特定问题)/.test(zone)) {
    return 'modeSelect';
  }

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
      '请立即进入模式A专属合规诊断，执行第一步：只提问「1. 您在哪个电商平台上销售商品？（可在下方点选）」；不要在正文罗列平台名称，官网底部会显示按钮。' +
      '禁止说“这不是自动命令”，禁止要求用户改提其他具体问题，禁止输出欢迎语。'
    );
  }
  if (/我有特定问题想直接提问|特定问题想直接提问|特定问题直接咨询/.test(t)) {
    return (
      '【模式选择】用户选择：特定问题直接咨询。' +
      '请进入模式B：用一两句邀请用户描述具体问题；不要展开7步诊断问卷。'
    );
  }
  return t;
}

function localDiagnosisPlatformAsk() {
  return (
    '好的，已为您开启专属合规诊断。\n\n' +
    '1. 您在哪个电商平台上销售商品？（可在下方点选）'
  );
}

function localDiagnosisEntityAsk(platformLabel) {
  const platform = String(platformLabel || '').trim();
  return (
    (platform ? `好的，已将「${platform}」记录为您的销售平台。\n\n` : '好的。\n\n') +
    '2. 您平台店铺的注册主体是哪一种？（可在下方点选）'
  );
}

function localDiagnosisShippingAsk(platformLabel) {
  return '3. 请问您的发货方式是以下哪一种？（可在下方点选）';
}

function localDiagnosisExportAsk() {
  return '4. 您目前货物的出口方式是怎么样的？（可在下方点选）';
}

function localDiagnosisInvoiceAsk(preface) {
  const head = String(preface || '').trim();
  return (
    (head ? `${head}\n\n` : '') +
    '5. 您目前供应商发票情况如何？（可在下方点选）'
  );
}

function localDiagnosisProductCategoryAsk(preface) {
  const head = String(preface || '').trim();
  return (head ? `${head}\n\n` : '') + '6. 您的产品属于以下哪种类别？（可在下方点选）';
}

function localDiagnosisRevenueAsk(preface) {
  const head = String(preface || '').trim();
  return (head ? `${head}\n\n` : '') + '7. 您目前年销售额约多少人民币？（可在下方点选）';
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

/** --- diag-followup-helpers start --- */
const DIAG_SLOT_LABELS = {
  platform: '销售平台',
  entity: '注册主体',
  shipping: '发货方式',
  exportMode: '出口方式',
  invoice: '供应商发票',
  productCategory: '产品类别',
  revenue: '年销售额',
};

function resolveDiagExportMode(slots) {
  const s = slots && typeof slots === 'object' ? slots : {};
  return (
    s.exportMode ||
    (isPlatformDomesticWarehouseShipping(s.shipping) ? '由平台安排出口' : '') ||
    ''
  );
}

function formatDiagSlotsSnapshot(slots) {
  const s = slots && typeof slots === 'object' ? slots : {};
  const exportMode = resolveDiagExportMode(s) || '未填写';
  return [
    `销售平台：${s.platform || '未填写'}`,
    `注册主体：${s.entity || '未填写'}`,
    `发货方式：${s.shipping || '未填写'}`,
    `出口方式：${exportMode}`,
    `供应商发票：${s.invoice || '未填写'}`,
    `产品类别：${s.productCategory || '未填写'}`,
    `年销售额：${s.revenue || '未填写'}`,
  ].join('\n');
}

/** Personalized 业务流程 arrow chain from diagnosis archive slots. */
function buildDiagnosisProcessFlowFromSlots(slots) {
  const s = slots && typeof slots === 'object' ? slots : getDiagSlots();
  const invoice = String(s.invoice || '').trim() || '供应商发票';
  const entity = String(s.entity || '').trim() || '店铺主体';
  const exportMode = resolveDiagExportMode(s) || String(s.exportMode || '').trim() || '出口方式';
  const shipping = String(s.shipping || '').trim() || '发货方式';
  const platform = String(s.platform || '').trim() || '平台';
  return `${invoice} → ${entity} → ${exportMode} → ${shipping} → ${platform} → 境外消费者`;
}

/** Internal path A/B/C/D from diagnosis slots (matches Workflow 路径判定). */
function detectDiagnosisReportPath(slots) {
  const s = slots && typeof slots === 'object' ? slots : getDiagSlots();
  const shipping = String(s.shipping || '');
  const exportMode = resolveDiagExportMode(s) || String(s.exportMode || '');
  const product = String(s.productCategory || '');

  if (/^0退税率/.test(product) || /商标.*暂未获得授权|暂未获得授权/.test(product)) {
    return 'D';
  }
  if (isPlatformDomesticWarehouseShipping(shipping) || /由平台安排出口/.test(exportMode)) {
    return 'C';
  }
  if (
    /小包快递出口|9610|1210|未报关/.test(exportMode) ||
    (/国内直发|POP（国内直发）|自发货（国内直发）|便捷发货/.test(shipping) &&
      /9610|1210|小包|未报关/.test(`${exportMode}${shipping}`))
  ) {
    return 'B';
  }
  if (
    /亚马逊\s*FBA|FBA|FBL|Shopee海外仓|海外仓发货|半托管（海外仓）|POP（海外仓|自发货（海外仓|发货到平台海外仓|供货\s*SHEIN（保税仓）/.test(
      shipping
    ) ||
    /正式报关|9810|1039|委托货代|市场采购|9710|0110/.test(exportMode)
  ) {
    return 'A';
  }
  return 'A';
}

function isMainlandDiagEntity(entity) {
  return /中国大陆公司|中国个人|个体户/.test(String(entity || ''));
}

function hasDiagSpecialInvoice(invoice) {
  return /专用发票|专票|增值税专票/.test(String(invoice || ''));
}

function hasDiagNoInvoice(invoice) {
  return /无法提供|无票|不能提供/.test(String(invoice || ''));
}

function isDiagRebateEligibleProduct(product) {
  return /^普货/.test(String(product || '')) || /能正常报关出口和退税/.test(String(product || ''));
}

function planDetailsText(details) {
  return (Array.isArray(details) ? details : [])
    .map((d) => `${d?.title || ''} ${d?.body || ''}`)
    .join('\n');
}

function planDetailsAlreadyCovers(details, title) {
  const blob = planDetailsText(details);
  if ((Array.isArray(details) ? details : []).some((d) => String(d?.title || '').includes(title))) {
    return true;
  }
  if (title.includes('0110出口+香港公司')) {
    return /0110出口\s*\+\s*香港|0110.*香港公司|香港公司.*0110/.test(blob);
  }
  if (title.includes('1039出口+香港公司')) {
    return /1039出口\s*\+\s*香港|1039.*香港公司/.test(blob);
  }
  if (title.includes('1210出口备货至保税区')) {
    return /1210出口备货|1210.*保税|保税.*1210/.test(blob);
  }
  if (title.includes('1210保税区一日游或9610')) {
    return /1210.*一日游|9610跨境电商零售|9610.*1210/.test(blob);
  }
  if (title.includes('平台信息报送')) {
    return /信息报送|采购后再销售|店铺主体.*不一致|香港公司.*店铺公司/.test(blob);
  }
  return false;
}

/** Mandatory plan.details rows when Workflow LLM omits named architectures. */
function buildMandatoryPlanDetails(slots, path) {
  const s = slots && typeof slots === 'object' ? slots : getDiagSlots();
  const exportMode = resolveDiagExportMode(s) || String(s.exportMode || '');
  const entity = String(s.entity || '');
  const invoice = String(s.invoice || '');
  const product = String(s.productCategory || '');
  const freightForwarder = /委托货代|买单/.test(exportMode);
  const rows = [];

  if (path === 'A') {
    if (isDiagRebateEligibleProduct(product) && hasDiagSpecialInvoice(invoice)) {
      rows.push({
        title: '0110出口+香港公司',
        body:
          '建议搭建「0110出口+香港公司」合规架构：国内供应商 → 进出口公司 → 香港公司 → 店铺公司 → 境外消费者。' +
          '进出口公司以自有抬头 0110 一般贸易报关出口给香港公司（香港公司为报关单境外买家）；供应商增值税专用发票开给进出口公司，满足条件后可申请出口退免税。' +
          (freightForwarder
            ? '当前为委托货代出口（买单出口），须以自有抬头 0110 替代货代抬头报关，否则难以支撑退免税且存在三流不一致风险。'
            : '') +
          '关联公司之间须注意转让定价，勿将大部分利润留存于无实质经营的香港公司。',
      });
    } else if (hasDiagNoInvoice(invoice)) {
      rows.push({
        title: '1039出口+香港公司',
        body:
          '无票货源可评估「1039出口+香港公司」：国内供应商 → 个体户 → 香港公司 → 店铺公司 → 境外消费者。' +
          '个体户在市场采购区（常建议东莞/义乌）以 1039 出口给香港公司，可享无票免征增值税与个税核定；' +
          '单个个体户连续12个月销售额一般不超过500万，须合理安排规模。须核禁限类、知识产权备案及商检要求。',
      });
    }
    if (isMainlandDiagEntity(entity)) {
      rows.push({
        title: '平台信息报送与主体一致性',
        body:
          '依据《互联网平台企业信息报送规定》，平台会向税务机关推送店铺身份与交易信息；税务机关一般要求店铺公司作为平台销售收入与所得税申报主体，收入口径为平台订单销售额（不是回款，不得扣除平台费用）。' +
          '架构落地后须核对境外销售主体（如香港公司）与平台店铺主体是否一致；不一致时须增加「香港公司从出口主体采购后再销售给店铺公司」链路（出口主体 → 香港公司 → 店铺公司），使平台报送与店铺申报匹配。各地税局审核要点有差异，搭建前可咨询专家。',
      });
    }
  } else if (path === 'B' && isDiagRebateEligibleProduct(product)) {
    rows.push({
      title: '1210出口备货至保税区',
      body:
        '非定制类普货可优先评估「1210出口备货至保税区」：国内供应商 → 进出口公司 → 备货保税区（货主香港公司）→ 店铺公司 → 境外消费者。' +
        '先以 0110 报关进保税区给香港公司，再按平台订单 1210 一件代发离境，争取取得报关单后申报退税。' +
        '转为1210/9610会改变物流链路，须测算物流成本与退税收益。',
    });
  } else if (path === 'B') {
    rows.push({
      title: '1210保税区一日游或9610跨境电商零售出口',
      body:
        '定制类普货可通过「1210保税区一日游或9610跨境电商零售出口」：国内供应商 → 进出口公司（常即店铺公司）→ 境外消费者，订单驱动 1210/9610 报关，取得清单或报关单后申请退免税（以实际通关及税务机关要求为准）。',
    });
  }

  return rows;
}

function ensureDiagnosisReportArchitectures(report, slots) {
  if (!report || typeof report !== 'object') return report;
  const s = slots && typeof slots === 'object' ? slots : getDiagSlots();
  const path = detectDiagnosisReportPath(s);
  const mandatory = buildMandatoryPlanDetails(s, path);
  if (!mandatory.length) return report;

  const details = Array.isArray(report.plan?.details) ? report.plan.details.slice() : [];
  mandatory.forEach((item) => {
    if (!planDetailsAlreadyCovers(details, item.title)) {
      details.unshift(item);
    }
  });

  if (details.length === (report.plan?.details || []).length) return report;
  return {
    ...report,
    plan: {
      ...(report.plan || {}),
      details,
    },
  };
}

function isGenericDiagnosisProcessFlow(text) {
  const t = String(text || '')
    .replace(/\s+/g, '')
    .replace(/→|⟶|->|➜|➔/g, '→');
  return (
    /供应商发票→店铺主体→出口方式→发货方式→平台→境外消费者/.test(t) ||
    (/供应商发票/.test(t) &&
      /店铺主体/.test(t) &&
      /出口方式/.test(t) &&
      /发货方式/.test(t) &&
      !/(专票|普票|全托管|半托管|FBA|速卖通|亚马逊|Shopee|Temu|大陆|香港|个体)/.test(t))
  );
}

function stripDiagnosisActionStepPrefix(text) {
  return String(text || '')
    .replace(/^\s*(?:第[一二三四五六七八九十百零\d]+步|[1-9]\d*)[.、．:：)\s]+/, '')
    .replace(/^\s*(?:第一步|第二步|第三步|第四步|第五步|第六步|第七步|第八步|第九步|第十步)[：:.\s]*/, '')
    .trim();
}

function formatDiagSlotsForApi(slots) {
  const s = slots && typeof slots === 'object' ? slots : getDiagSlots();
  const exportMode = resolveDiagExportMode(s) || '未填写';
  const shipping = String(s.shipping || '未填写').trim();
  const revenue = String(s.revenue || '未填写').trim();
  const platform = String(s.platform || '未填写').trim();
  let hard = '';
  if (exportMode === '由平台安排出口') {
    hard +=
      '【硬约束·出口】出口方式已确定为「由平台安排出口」。禁止写“未提供出口信息/出口方式未知”；' +
      '【合规方案】只围绕平台统一安排出口撰写，禁止罗列一般贸易/小包/海外仓等其它出口分支。\n';
  }
  if (/国内仓/.test(shipping) && !/保税仓/.test(shipping)) {
    hard +=
      `【硬约束·发货】发货方式必须写「${shipping}」。禁止写成「保税仓」「供货SHEIN（保税仓）」或其它发货方式；业务流程与方案卡片须与此一致。\n`;
  }
  if (/保税仓/.test(shipping)) {
    hard += `【硬约束·发货】发货方式必须写「${shipping}」，禁止改写成国内仓。\n`;
  }
  if (revenue && revenue !== '未填写') {
    hard +=
      `【硬约束·销售额】年销售额必须写「${revenue}」。禁止改用其它档位（例如档案是「500万以下」时禁止写「500-2000万」）。销售额分层建议仅在档案达到对应门槛时才写。\n`;
  }
  const reportPath = detectDiagnosisReportPath(s);
  if (reportPath === 'A') {
    if (isDiagRebateEligibleProduct(s.productCategory) && hasDiagSpecialInvoice(s.invoice)) {
      hard +=
        '【硬约束·架构】plan.details 必须含 title「0110出口+香港公司」及全链路（供应商→进出口公司→香港公司→店铺公司→境外消费者）；' +
        '委托货代/买单出口须写以自有抬头0110替代货代报关。\n';
    } else if (hasDiagNoInvoice(s.invoice)) {
      hard += '【硬约束·架构】plan.details 必须含 title「1039出口+香港公司」及全链路。\n';
    }
    if (isMainlandDiagEntity(s.entity)) {
      hard +=
        '【硬约束·报送】大陆店铺主体：risk.stages 03 须写平台信息报送风险；plan.details 须写「平台信息报送与主体一致性」及香港公司采购后再销售给店铺公司链路。\n';
    }
  } else if (reportPath === 'B' && isDiagRebateEligibleProduct(s.productCategory)) {
    hard += '【硬约束·架构】plan.details 必须含 title「1210出口备货至保税区」及 0110进区+1210离境说明。\n';
  } else if (reportPath === 'C') {
    hard += '【硬约束·架构】路径C禁止写「0110出口+香港公司」「1039出口+香港公司」及采购再销售链路。\n';
  }
  hard +=
    `【硬约束·样本】知识库方案样本仅供结构参考；禁止照抄样本里的示例平台/发货/出口/发票/销售额。` +
    `本单业务画像必须以档案为准：${platform} / ${shipping} / ${exportMode} / ${revenue}。`;
  return `【诊断档案·必须逐字采信】\n${formatDiagSlotsSnapshot(s)}\n${hard}`;
}

/** Dedicated query when generating the first full diagnosis report (step 7 → 8). */
function buildDiagnosisPlanApiQuery(userText) {
  const archive = formatDiagSlotsForApi();
  const reply = String(userText || '').trim();
  return (
    '【专属合规诊断·生成报告】第1-7步已齐。请调用工具 `generate_diagnosis_report`，传入下方【诊断档案】；' +
    '工具返回 JSON 后，**只向用户输出该 JSON**（version=1），不要自行写 Markdown 四章，禁止再提问。\n' +
    `${archive}\n` +
    (reply ? `【用户本轮最后答复】${reply}\n` : '') +
    '【铁律】档案字段必须与 JSON 内容一致；不得照抄方案样本示例数据；' +
    '若工具不可用，才 fallback 写 Markdown 四章（【核心风险诊断】【合规方案】【行动建议】【注意事项】）。' +
    '先通读知识库15与00，再按档案检索问题X注意事项，判定路径后生成报告。'
  );
}

/** Last follow-up field diffs for the right-hand plan panel. */
let lastDiagFollowUpChanges = [];

function setLastDiagFollowUpChanges(changes) {
  lastDiagFollowUpChanges = Array.isArray(changes) ? changes.slice() : [];
}

function getLastDiagFollowUpChanges() {
  return lastDiagFollowUpChanges.slice();
}

function diffDiagSlots(before, after) {
  const prev = before && typeof before === 'object' ? before : {};
  const next = after && typeof after === 'object' ? after : {};
  const mergedNext = {
    ...next,
    exportMode: resolveDiagExportMode(next) || next.exportMode || '',
  };
  const mergedPrev = {
    ...prev,
    exportMode: resolveDiagExportMode(prev) || prev.exportMode || '',
  };
  const changes = [];
  Object.keys(DIAG_SLOT_LABELS).forEach((key) => {
    const from = String(mergedPrev[key] || '').trim();
    const to = String(mergedNext[key] || '').trim();
    if (to && from !== to) {
      changes.push({
        key,
        label: DIAG_SLOT_LABELS[key],
        from: from || '未填写',
        to,
      });
    }
  });
  return changes;
}

function looksLikeVatRateNotRebate(text) {
  const t = String(text || '');
  return /增值税/.test(t) && /13\s*%/.test(t) && !/(?:出口)?退税率?/.test(t);
}

/** Feasibility / clarification questions must not rewrite diagnosis slots. */
function looksLikeDiagnosisFactQuestion(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  if (/[？?]/.test(t)) return true;
  if (/(?:吗|么)\s*$/.test(t)) return true;
  if (/^(?:能不能|可不可以|是否可以|是否能|能否|可以(?:走|用|做)|我能|我想问|请问)/.test(t)) {
    return true;
  }
  if (/(?:能不能|可不可以|是否可以|是否能|能否).{0,12}(?:走|用|做|改|切换)/.test(t)) return true;
  return false;
}

/**
 * Pull diagnosis-slot overrides from a free-text follow-up.
 * Conservative: only set a field when the wording is explicit (not a question).
 */
function extractDiagnosisFactOverrides(text) {
  const t = String(text || '');
  const out = {};
  if (!t.trim()) return out;
  // Asking "can I use 1039?" must not silently rewrite exportMode / slots
  if (looksLikeDiagnosisFactQuestion(t)) return out;

  const platformRules = [
    [/亚马逊|Amazon/i, '亚马逊 Amazon'],
    [/\bTemu\b/i, 'Temu'],
    [/TikTok(?:\s*Shop)?/i, 'TikTok Shop'],
    [/速卖通|AliExpress/i, '速卖通'],
    [/\bSHEIN\b/i, 'SHEIN'],
    [/阿里国际站|国际站/, '阿里国际站'],
    [/\bShopee\b/i, 'Shopee'],
    [/\bLazada\b/i, 'Lazada'],
    [/\beBay\b/i, 'eBay'],
    [/Shopify|独立站/i, 'Shopify独立站'],
    [/美客多|Mercado\s*Libre/i, '美客多'],
  ];
  for (const [re, label] of platformRules) {
    if (re.test(t)) {
      out.platform = label;
      break;
    }
  }

  if (/中国香港公司|香港公司/.test(t)) out.entity = '中国香港公司';
  else if (/个体户/.test(t)) out.entity = '个体户';
  else if (/中国个人|境内个人/.test(t)) out.entity = '中国个人';
  else if (/外籍个人/.test(t)) out.entity = '外籍个人';
  else if (/其他境外公司|海外公司/.test(t)) out.entity = '其他境外公司';
  else if (/中国境内|中国大陆公司|国内公司|境内公司/.test(t)) out.entity = '中国大陆公司';

  if (/亚马逊\s*FBA|\bFBA\b/i.test(t)) out.shipping = '亚马逊FBA';
  else if (/全托管（国内仓）|全托管.*国内仓/.test(t)) out.shipping = '全托管（国内仓）';
  else if (/半托管（海外仓）|半托管.*海外仓/.test(t)) out.shipping = '半托管（海外仓）';
  else if (/半托管（国内仓）|半托管.*国内仓/.test(t)) out.shipping = '半托管（国内仓）';
  else if (/海外仓/.test(t)) out.shipping = '自发货（海外仓发货）';
  else if (/国内直发|自发货（国内直发）/.test(t)) out.shipping = '自发货（国内直发）';

  if (/9810/.test(t)) out.exportMode = '正式报关出口（9810）';
  else if (/1039|市场采购/.test(t)) out.exportMode = '市场采购出口（1039）';
  else if (/未报关/.test(t)) out.exportMode = '小包快递出口（未报关）';
  else if (/9610|1210|小包快递/.test(t)) out.exportMode = '小包快递出口（9610/1210）';
  else if (/由平台安排出口/.test(t)) out.exportMode = '由平台安排出口';
  else if (/委托货代/.test(t)) out.exportMode = '委托货代出口';
  else if (/正式报关/.test(t)) out.exportMode = '正式报关出口（0110/9710）';

  if (/无法提供发票|不能.*发票|无票/.test(t)) out.invoice = '无法提供发票';
  else if (/部分专票.{0,8}部分普票|专票.*普票/.test(t)) out.invoice = '部分专票+部分普票';
  else if (/普通发票|普票/.test(t) && !/专用发票|专票/.test(t)) {
    out.invoice = '只能提供增值税普通发票';
  } else if (/专用发票|专票/.test(t)) {
    out.invoice = '能提供增值税专用发票';
  }

  const rebateZero =
    /(?:出口)?退税率?\s*(?:为|是|属于|:|：)?\s*0\s*%|[零0]退税率?产品|0\s*%\s*(?:出口)?退税/.test(t);
  const rebatePositive = /(?:出口)?退税率?\s*(?:为|是|属于|:|：)?\s*(\d+(?:\.\d+)?)\s*%/.exec(t);
  const rebatePositiveFlip = /(\d+(?:\.\d+)?)\s*%\s*(?:的)?\s*(?:出口)?退税率?/.exec(t);
  const statedRate = rebatePositive
    ? Number(rebatePositive[1])
    : rebatePositiveFlip
      ? Number(rebatePositiveFlip[1])
      : NaN;
  if (rebateZero && !(Number.isFinite(statedRate) && statedRate > 0)) {
    out.productCategory = '0退税率产品（如贵重金属、珠宝玉石、钢材、铝材、木材）';
  } else if (Number.isFinite(statedRate) && statedRate > 0 && !looksLikeVatRateNotRebate(t)) {
    out.productCategory = '普货，能正常报关出口和退税';
    out.productCategoryNote = `用户声明退税率${statedRate}%`;
  } else if (/能正常报关出口和退税|普货/.test(t) && !rebateZero) {
    out.productCategory = '普货，能正常报关出口和退税';
  } else if (/商检/.test(t)) {
    out.productCategory = '产品涉及商检（如食品、化妆品、危险化学品、木制品）';
  } else if (/备案商标|未获得授权|未授权/.test(t)) {
    out.productCategory = '产品涉及海关备案商标但暂未获得授权';
  }

  if (/10亿以上/.test(t)) out.revenue = '10亿以上';
  else if (/4\s*[-~～到至]\s*10亿/.test(t)) out.revenue = '4-10亿';
  else if (/1\s*[-~～到至]\s*4亿/.test(t)) out.revenue = '1-4亿';
  else if (/5000万\s*[-~～到至]\s*1亿|5000万以上/.test(t)) out.revenue = '5000万-1亿';
  else if (/年销售[额]?约?5000\s*万/.test(t)) out.revenue = '5000万-1亿';
  else if (/2000\s*[-~～到至]\s*5000万/.test(t)) out.revenue = '2000-5000万';
  else if (/500\s*[-~～到至]\s*2000万/.test(t)) out.revenue = '500-2000万';
  else if (/500万以下|不到500万|不足500万/.test(t)) out.revenue = '500万以下';

  return out;
}

function applyDiagSlotOverrides(overrides) {
  const next = { ...getDiagSlots() };
  if (!overrides || typeof overrides !== 'object') return next;
  Object.keys(DIAG_SLOT_LABELS).forEach((key) => {
    const value = String(overrides[key] || '').trim();
    if (value) setDiagSlot(key, value);
  });
  return getDiagSlots();
}

function formatDiagChangeLines(changes) {
  if (!Array.isArray(changes) || !changes.length) {
    return '（前端未抽出明确字段变化；请以用户本轮原话为准自行对照，用户新陈述覆盖旧档案。）';
  }
  return changes
    .map((c) => {
      const note = c.note ? `（${c.note}）` : '';
      return `- ${c.label}：${c.from} → ${c.to}${note}`;
    })
    .join('\n');
}

function looksLikeDiagnosisScenarioRestate(text) {
  const t = String(text || '');
  if (!t.trim()) return false;
  let n = 0;
  if (/亚马逊|Amazon|Temu|Shopee|Lazada|速卖通|SHEIN|TikTok|美客多|eBay|Shopify|阿里|平台/i.test(t)) n += 1;
  if (/注册主体|大陆公司|境内公司|香港公司|个体户/.test(t)) n += 1;
  if (/发货|直发|FBA|海外仓|全托管|半托管/.test(t)) n += 1;
  if (/报关|出口|9610|0110|9810|1039|1210/.test(t)) n += 1;
  if (/发票|专票|普票|无票/.test(t)) n += 1;
  if (/退税|普货|商检|产品属于|产品类别/.test(t)) n += 1;
  if (/年销售|销售额|\d+\s*万|\d+\s*亿/.test(t)) n += 1;
  return n >= 3;
}

function buildDiagnosisFollowUpQuery(userText, baselineSlots, changes) {
  const baseline = formatDiagSlotsSnapshot(baselineSlots);
  const changeBlock = formatDiagChangeLines(changes);
  return (
    '【诊断已完成·后续追问】\n' +
    '【上一轮诊断档案】\n' +
    `${baseline}\n` +
    '【本轮用户原话】\n' +
    `${String(userText || '').trim()}\n` +
    '【前端识别的变化点·仅供参考】\n' +
    `${changeBlock}\n` +
    '【作答要求】\n' +
    '- 禁止复述本段指令、禁止输出英文思考过程或自我提醒（如 Actually / Let me / 实际上我应该注意）。\n' +
    '- 若用户在问可行性/政策点（如「我能走1039吗」）：先直接用中文回答该问题（结论+2～4点依据），再说明若要改出口方式对现有发货模式的影响；不要假装用户已改档，不要空列【核心风险诊断】等标题。\n' +
    '- 若用户明确改了业务条件（陈述句）：先写【变化点】（旧→新），再写【影响与注意事项】，然后输出完整四章报告；新事实覆盖旧档案。\n' +
    '- 若为全新无关问题：按模式B作答，勿套用旧报告。'
  );
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
  else if (/商标|专利/.test(product)) productLabel = '海关备案商标未授权';
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

function buildDiagnosisChangePointsHtml(changes) {
  const list = Array.isArray(changes) ? changes : [];
  if (!list.length) return '';
  const items = list
    .map((c) => {
      const note = c.note ? `（${c.note}）` : '';
      return `${escapeHtml(c.label)}：${escapeHtml(c.from)} → ${escapeHtml(c.to)}${escapeHtml(note)}`;
    })
    .join('；');
  return (
    `<p class="result-paragraph result-change-points">` +
    `<strong>相对上一轮的变化：</strong>` +
    `<span class="result-change-points-values">${items}</span>` +
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
        /^您好[，,]?\s*我是您的(道一合规小助手|AI合规助手)/.test(plain)
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
    /(开启专属合规诊断|特定问题想直接提问|特定问题直接咨询)/.test(t) &&
    /(请选择|还是|无法判断|仅凭)/.test(t)
  );
}

/** Enrich diagnosis-step user replies so Dify never restarts mode selection. */
function buildDiagnosisApiQuery(text, uiMode, uiStep, platformLabel, options = {}) {
  const normalized = normalizeDiagnosisModeQuery(text);
  if (normalized !== String(text || '').trim()) return normalized;
  if (uiMode !== 'diagnosis' || uiStep < 1) return String(text || '').trim();
  if (options.isPostReportFollowUp) {
    return buildDiagnosisFollowUpQuery(
      text,
      options.baselineSlots || getDiagSlots(),
      options.changes || getLastDiagFollowUpChanges()
    );
  }
  const platform = String(platformLabel || getDiagSlots().platform || '').trim();
  const stepHints = {
    2: '请执行第二步：只提问「2. 您平台店铺的注册主体是哪一种？（可在下方点选）」；不要在正文罗列主体选项，官网会显示按钮。',
    3: '请执行第三步：只提问「3. 请问您的发货方式是以下哪一种？（可在下方点选）」；不要在正文罗列选项，官网会按平台显示按钮。',
    4: '请执行第四步：只提问「4. 您目前货物的出口方式是怎么样的？（可在下方点选）」；不要在正文列出选项。若发货为平台国内仓类，可直接记为「由平台安排出口」并进入第五步。',
    5: '请执行第五步：只提问「5. 您目前供应商发票情况如何？（可在下方点选）」；不要在正文罗列专票/普票等选项。',
    6: '请执行第六步：只提问「6. 您的产品属于以下哪种类别？（可在下方点选）」；不要在正文罗列选项。',
    7: '请执行第七步：只提问「7. 您目前年销售额约多少人民币？（可在下方点选）」；不要在正文罗列选项。',
    8: '第1-7步已齐：必须调用工具 generate_diagnosis_report，传入【诊断档案】，向用户只输出工具返回的 JSON（version=1）；工具不可用时才 fallback 写 Markdown 四章。不要再提问。',
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
/** --- diag-followup-helpers end --- */

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

function playAiSolutionJourney() {
  const root = document.getElementById('aiSolutionJourney');
  if (!root) return;
  const nodes = [...root.querySelectorAll('.process-card')];
  const lines = [...root.querySelectorAll('.process-arrow')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.remove('is-playing', 'is-done');
  nodes.forEach((n) => n.classList.remove('is-active', 'is-on'));
  lines.forEach((n) => n.classList.remove('is-on'));
  if (reduce) {
    root.classList.add('is-done');
    return;
  }
  root.classList.add('is-playing');
  nodes.forEach((node, i) => {
    setTimeout(() => {
      node.classList.add('is-on');
      if (i > 0) lines[i - 1]?.classList.add('is-on');
      if (i === nodes.length - 1) {
        setTimeout(() => root.classList.add('is-done'), 280);
      }
    }, 180 + i * 520);
  });
}

function initAiSolutionGuide() {
  const section = document.getElementById('ai-solution');
  if (!section) return;

  window.DAOITH_playAiSolutionJourney = playAiSolutionJourney;
  if (document.body.dataset.activeView === 'ai-solution') playAiSolutionJourney();

  section.addEventListener('click', (e) => {
    const hint = e.target.closest('[data-ai-scroll]');
    if (!hint) return;
    e.preventDefault();
    const id = hint.getAttribute('data-ai-scroll') || '';
    const target = document.getElementById(id);
    if (!target) return;
    if (id === 'diagServiceRecs') target.hidden = false;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
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
    setLastDiagFollowUpChanges([]);
  };

  /** Track mode/step so diagnosis keeps clickable answer chips each turn. */
  const trackUserWizardAnswer = (text) => {
    const t = String(text || '').trim();
    if (/开启专属合规诊断/.test(t)) {
      clearDiagSlots();
      resetResultPlanPanel();
      setUiWizard('diagnosis', 1, '');
      return;
    }
    if (/我有特定问题想直接提问|特定问题想直接提问|特定问题直接咨询/.test(t)) {
      setUiWizard('qa', 0, '');
      return;
    }
    if (/重新诊断|换个模式|我要逐步诊断/.test(t)) {
      clearDiagSlots();
      resetResultPlanPanel();
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
    label.textContent = '请点击选项继续';
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
      `<p class="welcome-ask">请在下方选择：` +
      `<span class="welcome-option"><strong>开启专属合规诊断</strong><span class="diag-ask-hint">（需微信登录，按步骤生成诊断报告）</span></span>` +
      `，或 ` +
      `<span class="welcome-option"><strong>特定问题直接咨询</strong><span class="diag-ask-hint">（基于知识库即时解答）</span></span>` +
      `。</p>`;
    messages.appendChild(greetEl);

    showQuickReplies('请在下方选择：开启专属合规诊断（需微信登录，按步骤生成诊断报告），或 特定问题直接咨询（基于知识库即时解答）。');
    scrollDiagChatToBottom();
  };

  const startNewConversation = () => {
    resetConversation();
    clearMessages();
    clearQuickReplies();
    resetResultPlanPanel();
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
      /开启专属合规诊断/.test(text) || /我有特定问题想直接提问|特定问题想直接提问|特定问题直接咨询/.test(text);
    if (isModeSelect || wantsExclusiveDiagnosis) {
      resetConversation();
    }

    const prevMode = getUiMode();
    const prevStep = getUiStep();
    const isPostReportFollowUp = prevMode === 'diagnosis' && prevStep >= 8;
    let followUpBaselineSlots = null;
    let followUpChanges = [];
    if (isPostReportFollowUp) {
      followUpBaselineSlots = { ...getDiagSlots() };
      const overrides = extractDiagnosisFactOverrides(text);
      const merged = { ...followUpBaselineSlots, ...overrides };
      followUpChanges = diffDiagSlots(followUpBaselineSlots, merged);
      if (overrides.productCategoryNote) {
        const hit = followUpChanges.find((c) => c.key === 'productCategory');
        if (hit) hit.note = overrides.productCategoryNote;
        else {
          followUpChanges.push({
            key: 'productCategory',
            label: '产品类别',
            from: followUpBaselineSlots.productCategory || '未填写',
            to: overrides.productCategory || followUpBaselineSlots.productCategory || '普货',
            note: overrides.productCategoryNote,
          });
        }
      }
      // Only rewrite slots on affirmative statements; questions like「我能走1039吗」keep old archive
      if (!looksLikeDiagnosisFactQuestion(text) && Object.keys(overrides).length) {
        applyDiagSlotOverrides(overrides);
        if (overrides.platform) setUiWizard('diagnosis', 8, overrides.platform);
      }
      setLastDiagFollowUpChanges(followUpChanges);
    } else if (!(prevMode === 'diagnosis' && prevStep === 7)) {
      setLastDiagFollowUpChanges([]);
    }
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
    const expectFollowUpPlan =
      isPostReportFollowUp &&
      !looksLikeDiagnosisFactQuestion(text) &&
      (followUpChanges.length > 0 || looksLikeDiagnosisScenarioRestate(text));
    const forcePlanWhileThinking = shouldGeneratePlanNow || expectFollowUpPlan;
    const planBusyMsg = isPostReportFollowUp ? DIAG_PLAN_UPDATE_STATUS_MSG : DIAG_PLAN_STATUS_MSG;
    const planDoneMsg = isPostReportFollowUp ? DIAG_PLAN_UPDATE_DONE_MSG : DIAG_PLAN_DONE_MSG;
    if (shouldGeneratePlanNow || expectFollowUpPlan) {
      showResultWorking();
      typing.classList.add('is-plan-status');
      const loggedInNow = Boolean(window.DAOITH_AUTH?.isLoggedIn?.());
      typing.textContent = loggedInNow
        ? planBusyMsg
        : `${planBusyMsg}。请先微信登录以保存方案并继续`;
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
      const apiQuery =
        shouldGeneratePlanNow && !isPostReportFollowUp
          ? buildDiagnosisPlanApiQuery(text)
          : buildDiagnosisApiQuery(text, getUiMode(), getUiStep(), getUiPlatform(), {
              isPostReportFollowUp,
              baselineSlots: followUpBaselineSlots,
              changes: followUpChanges,
            });

      const hsForRefund = extractHsFromRefundQuestion(text);
      if (hsForRefund) {
        const resolved = await resolveExportRefundRate(hsForRefund);
        if (resolved?.ok && resolved.rate != null) {
          const reply = formatStructuredRefundReply(resolved, hsForRefund);
          setAskCount(askCount + 1);
          setBotBubble(typing, reply);
          showQuickReplies(reply);
          maybeShowServiceRecsAfterAnswer(reply);
          return;
        }
        setAskCount(askCount + 1);
        const miss = `未查到海关编码 ${hsForRefund} 的出口退税率，请核对编码后重试，或以国家税务总局出口退税率文库为准。`;
        setBotBubble(typing, miss);
        showQuickReplies(miss);
        maybeShowServiceRecsAfterAnswer(miss);
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
          maybeShowServiceRecsAfterAnswer(aluminumReply);
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
            ? planBusyMsg
            : `${planBusyMsg}。请先微信登录以保存方案并继续`;
          return;
        }
        streamingPlan = true;
        showResultWorking();
        typing.classList.add('is-plan-status');
        const loggedInNow = Boolean(window.DAOITH_AUTH?.isLoggedIn?.());
        typing.textContent = loggedInNow
          ? planBusyMsg
          : `${planBusyMsg}。请先微信登录以保存方案并继续`;
        if (!loginPromptedForPlan && !loggedInNow) {
          loginPromptedForPlan = true;
          window.DAOITH_AUTH?.requireLogin?.(
            'ai_plan',
            `${window.location.pathname}${window.location.search}#ai-solution`
          );
        }
      };
      if (forcePlanWhileThinking) beginPlanRouting();

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
          if (forcePlanWhileThinking) {
            beginPlanRouting();
          }
          return;
        }
        const clean = prepareDiagnosisPlanMarkdown(stripDiagnosisIntroBoilerplate(cleaned));
        if (!clean) {
          if (forcePlanWhileThinking) beginPlanRouting();
          return;
        }
        // Keep the working logo until the full report is ready — do not paint half-written plans
        if (
          streamingPlan ||
          forcePlanWhileThinking ||
          shouldRouteDiagnosisToPlanPanel(clean) ||
          /【核心风险诊断】|【合规方案】/.test(clean) ||
          (/"version"\s*:\s*1/.test(cleaned) && /"risk"\s*:/.test(cleaned)) ||
          /"report_json"\s*:/.test(cleaned)
        ) {
          beginPlanRouting();
          return;
        }
        // Mid-report CoT that slipped past sanitize: still never show in chat
        if (
          forcePlanWhileThinking &&
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
        const rawJson = extractDiagnosisReportJson(result.text);
        if (rawJson && isDiagnosisReportJsonReady(rawJson)) {
          answer = JSON.stringify(rawJson);
        } else {
          // Do NOT fall back to raw result.text (often still contains think / CoT)
          const retry = sanitizeAiAnswer(result.text);
          const salvaged = salvageDiagnosisPlanFromRaw(result.text);
          // Never substitute the local “请先填写业务信息” help blurb as a diagnosis plan
          if (
            streamingPlan ||
            shouldGeneratePlanNow ||
            (getUiMode() === 'diagnosis' && getUiStep() >= 8)
          ) {
            answer = retry || salvaged || '';
          } else {
            answer = retry || salvaged || buildLocalChatReply(text, ctx) || '';
          }
        }
      }
      answer = sanitizeAiAnswer(answer);
      answer = stripDiagnosisIntroBoilerplate(answer || '');
      answer = correctAluminumRefundHallucinations(answer);
      if (looksLikeLocalGenericHelp(answer)) {
        answer = '';
      }
      if ((!answer || answer.length < 4) && result?.text) {
        answer = salvageDiagnosisPlanFromRaw(result.text) || '';
      }
      if (!answer || answer.length < 4) {
        if (streamingPlan || forcePlanWhileThinking) {
          beginPlanRouting();
          typing.classList.add('is-plan-status');
          typing.textContent =
            '方案生成未得到可用正文（可能被模型思考过程占用）。请点击「新建对话」后重试；若多次失败请检查 Dify 诊断助手是否已发布最新提示词。';
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
        // Prefer sanitized answer; also try raw API text (wrapper JSON may be stripped by sanitize)
        const jsonReport =
          extractDiagnosisReportJson(answer) ||
          extractDiagnosisReportJson(result?.text || '');
        if (jsonReport && isDiagnosisReportJsonReady(jsonReport)) {
          publishDiagnosisPlanToResultPanel(answer, { kind: 'diagnosis', jsonReport });
          if (!planCountedThisTurn && !isPostReportFollowUp) {
            planCountedThisTurn = true;
            bumpDiagnosisPlanCount();
          }
          persistDiagnosisReport(JSON.stringify(jsonReport));
          typing.classList.add('is-plan-status');
          const loggedInNow = Boolean(window.DAOITH_AUTH?.isLoggedIn?.());
          typing.textContent = loggedInNow
            ? planDoneMsg
            : `${planDoneMsg}。请先微信登录以保存方案并继续`;
          clearQuickReplies();
        } else {
          answer = prepareDiagnosisPlanMarkdown(answer);
          if (looksLikeDiagnosisPlanScaffold(answer) || looksLikeEnglishPromptMeta(answer)) {
            const salvaged = prepareDiagnosisPlanMarkdown(salvageDiagnosisPlanFromRaw(result.text) || '');
            if (salvaged && isDiagnosisPlanReadyToShow(salvaged)) answer = salvaged;
          }
          if (!isDiagnosisPlanReadyToShow(answer) && !isDiagnosisPlanReadyToShow(result?.text || '')) {
            typing.classList.add('is-plan-status');
            typing.textContent =
              '方案正文不完整或含无效草稿。请点击「新建对话」后重试；并确认 Dify 已发布最新诊断提示词与报告工具。';
            clearQuickReplies();
            return;
          }
          if (!isDiagnosisPlanReadyToShow(answer) && isDiagnosisPlanReadyToShow(result?.text || '')) {
            answer = prepareDiagnosisPlanMarkdown(result.text);
          }
          publishDiagnosisPlanToResultPanel(answer, { kind: 'diagnosis' });
          if (!planCountedThisTurn && !isPostReportFollowUp) {
            planCountedThisTurn = true;
            bumpDiagnosisPlanCount();
          }
          persistDiagnosisReport(answer);
          typing.classList.add('is-plan-status');
          const loggedInNow = Boolean(window.DAOITH_AUTH?.isLoggedIn?.());
          typing.textContent = loggedInNow
            ? planDoneMsg
            : `${planDoneMsg}。请先微信登录以保存方案并继续`;
          clearQuickReplies();
        }
      } else if (streamingLongQa || shouldRouteLongAnswerToPlanPanel(answer)) {
        beginLongQaRouting();
        publishDiagnosisPlanToResultPanel(answer, { kind: 'qa' });
        typing.classList.add('is-plan-status');
        typing.textContent = QA_LONG_ANSWER_CHAT_TIP;
        clearQuickReplies();
      } else {
        setBotBubble(typing, answer);
        showQuickReplies(answer);
        maybeShowServiceRecsAfterAnswer(answer);
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
  if (extractDiagnosisReportJson(t)) return true;
  if (t.length < 160) return false;
  if (looksLikeDiagnosisPlanScaffold(t)) return false;
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

function looksLikeLocalGenericHelp(text) {
  const t = String(text || '');
  return (
    /我可以协助的实务方向/.test(t) ||
    /请先在左侧填写业务信息并生成方案/.test(t)
  );
}

/** Reset the right-hand plan panel back to the empty AI placeholder. */
function resetResultPlanPanel() {
  const placeholder = document.getElementById('resultPlaceholder');
  const content = document.getElementById('resultContent');
  const items = document.getElementById('resultItems');
  const working = document.getElementById('resultWorking');
  const serviceHost = document.getElementById('diagServiceRecs');
  if (working) working.remove();
  if (items) items.innerHTML = '';
  if (content) content.classList.remove('active');
  if (placeholder) placeholder.style.display = '';
  if (serviceHost) {
    serviceHost.innerHTML = '';
    serviceHost.hidden = true;
  }
}

function countDiagnosisCjk(text) {
  return (String(text || '').match(/[\u4e00-\u9fff]/g) || []).length;
}

function countDiagnosisThinkingLatin(text) {
  return (
    String(text || '')
      .replace(
        /\b(?:Shopee|Lazada|Temu|SHEIN|Amazon|Walmart|FBA|FBL|POP|VAT|GST|HS|DAOITH|Daoith)\b/gi,
        ''
      )
      .replace(/\b(?:0110|9610|9710|9810|1210|1039)\b/g, '')
      .match(/[A-Za-z]/g) || []
  ).length;
}

function diagnosisHasLeakedEnglish(text) {
  const t = String(text || '');
  if (!t) return false;
  if (looksLikeEnglishPromptMeta(t)) return true;
  const latin = countDiagnosisThinkingLatin(t);
  const cjk = countDiagnosisCjk(t);
  if (latin >= 24 && (cjk < 40 || latin * 4 > cjk)) return true;
  return false;
}

/** Model meta-commentary about prompt numbering / structure (must never show). */
function looksLikeEnglishPromptMeta(text) {
  return /Note there'?s a jump|re-reading more carefully|intended structure|internal inconsistency|So the prompt uses|Actually re-reading|in the prompt[, ]|missing 第三|jump from 第|I think this is likely|which labels to use|Wait,\s*I need|Let me re-read|Hmm,?\s*actually|No Markdown tables|No URLs?\/?links|No naked|must be paired|same level|业务流程 written as|standard architecture|need to be careful|Import\/Export Company|Overseas Consumer|I have \d+ items|Titles only|no dash|no bullet|For the 业务流程/i.test(
    String(text || '')
  );
}

/** Prompt echoes, English CoT, and format checklists that must never enter the plan panel. */
function isDiagnosisJunkLine(line) {
  const raw = String(line || '').trim();
  if (!raw) return false;
  const s = raw
    .replace(/^[-*•>]\s+/, '')
    .replace(/\*\*/g, '')
    .replace(/^[_*]+\s*|\s*[_*]+$/g, '')
    .replace(/^[✓✔☑✅]\s*/, '')
    .trim();
  if (!s) return true;
  if (
    /^(?:业务流程一行|主要风险一行|3\s*[-–—~～]?\s*5\s*条风险|3\s*[-–—~～]?\s*6\s*条对症卡片|一段画像|对症卡片|方案卡片|风险条目|合规方案画像)\b/.test(
      s
    )
  ) {
    return true;
  }
  // Format scaffolding / outline leftovers from the new three-stage prompt
  if (/^01\s*\/\s*02\s*\/\s*03/.test(s)) return true;
  if (/环节下\s*1\s*[.．、]?\s*2\s*[.．、]?\s*3/.test(s)) return true;
  if (/^结尾句$/.test(s) || /^报告结尾/.test(s)) return true;
  if (/^环节(?:概览|细则)\s*[:：]?$/.test(s) || /^细则\s*[:：]?$/.test(s) || /^整改(?:概览|细则)\s*[:：]?$/.test(s)) {
    return true;
  }
  if (/概览\s*[:：].*(?:细则|->|→)/.test(s) || /细则\s*[:：].*概览/.test(s)) return true;
  if (/三大环节/.test(s) && /(必须|强制|展开|follow|must)/i.test(s)) return true;
  if (/^方案进【|^风险进【|^行动进【/.test(s)) return true;
  if (/NOT\s+write/i.test(s) || /don'?t\s+write/i.test(s) || /prohibit writing/i.test(s)) return true;
  if (/hard\s*constraint/i.test(s) || /And hard constraint/i.test(s)) return true;
  if (/needs\s+正式报关/i.test(s) || /\bwhich is\b/i.test(s) && /路径|标识|采购/.test(s)) return true;
  if (/路径[ABCD].*禁止写/.test(s) && /(采购再销售|链路|架构)/.test(s) && s.length < 80) return true;
  if (/^实际上我应该注意|^让我先(?:写|检索|通读)|^根据提示词|^硬约束[:：]/.test(s)) return true;
  if (
    /用户本轮明确给出的新事实优先于旧档案|禁止原样复用上一份诊断报告|请先审视本轮问题与上一轮|【诊断已完成[·.]后续追问】|【本轮已识别的变化点】|【作答要求】|【前端识别的变化点/.test(
      s
    )
  ) {
    return true;
  }
  if (/^No Markdown tables\b/i.test(s)) return true;
  if (/^No URLs?\b/i.test(s)) return true;
  if (/^No naked\b/i.test(s) || /must be paired/i.test(s)) return true;
  if (/\bonly\s+[-`']?\s*短标题/i.test(s)) return true;
  if (/\bonly\s+1\.\s*2\.\s*3/i.test(s) && /行动建议|same level/i.test(s)) return true;
  if (/风险条 and|use bullet points/i.test(s)) return true;
  if (/^Titles?\s*【/i.test(s)) return true;
  if (/业务流程 written as/i.test(s)) return true;
  if (/【合规方案】/.test(s) && /短标题/.test(s) && /only/i.test(s)) return true;
  if (/same level/i.test(s) && /行动建议|1\.\s*2\.\s*3/.test(s)) return true;
  if (
    /[✓✔]/.test(String(line || '')) &&
    /only|Titles|no dash|no bullet|items|短标题|1\.2\.3|业务流程|三大环节|must follow|note uses|\bGood\b|hard constraint|禁止写|概览|细则/i.test(
      s
    )
  ) {
    return true;
  }
  if (/I have \d+ items/i.test(s)) return true;
  if (/^For (?:the )?业务流程\b/i.test(s) || /^For 合规方案\b/i.test(s)) return true;
  if (/开篇一段普通正文/.test(s)) return true;
  if (/强制两段结构|短事项概览|官网会把|不再用卡片|渲染为/.test(s)) return true;
  if (
    /\b(Wait|Hmm+|Uh|Okay|Let me|I need to|I'll|I'm going to|need to be careful|re-read path|let me think|standard architecture)\b/i.test(
      s
    )
  ) {
    return true;
  }
  if (
    /^(Wait|Hmm+|Uh|Okay|Ok|So|Actually|But wait|Let me|I need to|I'll|I'm going to)\b/i.test(
      s
    )
  ) {
    return true;
  }
  if (/Import\/Export Company|Overseas Consumer|overseas warehouse/i.test(s) && /→|->/.test(s)) {
    return true;
  }
  if (/→\s*great\.?$/i.test(s) || /^If not\s*→/i.test(s) || /works with local tax bureau/i.test(s)) {
    return true;
  }
  const latin = (s.match(/[A-Za-z]/g) || []).length;
  const cjk = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  if (latin >= 20 && cjk <= 4) return true;
  if (latin >= 28 && cjk < latin * 0.35) return true;
  if (/^(If|When|Then|But|The|This|That|In this|First|Now|For)\b/.test(s) && latin >= 10) {
    return true;
  }
  // Mixed EN/CN instructional residue
  if (latin >= 8 && cjk >= 2 && /\b(needs|write|note|says|for|path|which|follow|must|don't|dont)\b/i.test(s)) {
    return true;
  }
  return false;
}

function stripEnglishPromptMeta(text) {
  let t = String(text || '');
  // Drop English paragraphs that discuss the prompt itself
  t = t.replace(
    /(?:^|\n)[^\nA-Za-z【]*[A-Za-z][^\n]*(?:prompt|re-reading|intended structure|internal inconsistency|jump from|Note there|So the prompt|Actually re-reading|missing 第三|labels to use|Let me write|write carefully|Wait,\s*I need|Let me re-read|Hmm,?\s*actually)[^\n]*(?:\n(?![【\-#*•]|业务流程|主要风险)[^\n]*)*/gi,
    '\n'
  );
  // Drop long Latin-only runs (likely CoT leftovers)
  t = t.replace(/(?:^|\n)[ \t]*[A-Za-z][A-Za-z0-9 ,.'"()\/:;_\-]{40,}[ \t]*(?=\n|$)/g, '\n');
  t = t
    .split('\n')
    .map((ln) => {
      if (isDiagnosisJunkLine(ln)) return '';
      const parts = String(ln).split(/(?<=[。！？.!?])\s+/);
      if (parts.length <= 1) return ln;
      return parts
        .filter((p) => {
          const latin = (p.match(/[A-Za-z]/g) || []).length;
          const cjk = (p.match(/[\u4e00-\u9fff]/g) || []).length;
          if (latin >= 12 && cjk < 8) return false;
          if (latin >= 16 && cjk < latin) return false;
          if (isDiagnosisJunkLine(p)) return false;
          return true;
        })
        .join('');
    })
    .filter((ln) => !isDiagnosisJunkLine(ln))
    .join('\n');
  // Drop English CoT paragraphs mixed into Chinese reports
  t = t.replace(
    /(?:^|\n)[ \t]*(?:Actually|But wait|First address|Then explain|The answer depends|Wait,|Hmm,|Let me|If the shop|In this scenario)[^\n]*(?:\n(?![【\-#*•]|业务流程|主要风险)[^\n]*)*/gi,
    '\n'
  );
  // Normalize bogus section labels into nothing or nearest real title context
  t = t.replace(/(?:^|\n)\s*\*{0,2}(?:风险条目|方案卡片|合规方案画像)\*{0,2}\s*(?=\n|$)/g, '\n');
  return t.replace(/\n{3,}/g, '\n\n').trim();
}

/** Map model variants like「第一部分：核心风险提示」to fixed report titles. */
function normalizeDiagnosisSectionTitles(text) {
  let t = String(text || '');
  t = t.replace(/【\s*第一部分[^】]*】/g, (m) =>
    /风险/.test(m) ? '【核心风险诊断】' : /方案|合规/.test(m) ? '【合规方案】' : m
  );
  t = t.replace(/【\s*第二部分[^】]*】/g, (m) =>
    /方案|合规/.test(m) ? '【合规方案】' : /风险/.test(m) ? '【核心风险诊断】' : /行动/.test(m) ? '【行动建议】' : m
  );
  t = t.replace(/【\s*第三部分[^】]*】/g, (m) =>
    /行动/.test(m) ? '【行动建议】' : /方案|合规/.test(m) ? '【合规方案】' : /注意/.test(m) ? '【注意事项】' : '【行动建议】'
  );
  t = t.replace(/【\s*第四部分[^】]*】/g, (m) =>
    /注意/.test(m) ? '【注意事项】' : /行动/.test(m) ? '【行动建议】' : '【行动建议】'
  );
  t = t.replace(/【\s*第五部分[^】]*】/g, '【注意事项】');
  t = t.replace(/【\s*核心风险提示\s*】/g, '【核心风险诊断】');
  t = t.replace(/【\s*合规方案建议\s*】/g, '【合规方案】');
  return t;
}

function diagnosisHasChapter(text, name) {
  const t = String(text || '');
  const escaped = String(name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    new RegExp(`【\\s*${escaped}\\s*】`).test(t) ||
    new RegExp(`^#{1,4}\\s*(?:[0-9]+[）).、]\\s*)?${escaped}\\s*$`, 'm').test(t) ||
    new RegExp(`^\\*{0,2}${escaped}\\*{0,2}\\s*$`, 'm').test(t)
  );
}

function stripDiagnosisExpertTip(text) {
  return String(text || '')
    .replace(
      /(?:^|\n)\s*可以选择页面下方「专家1v1财税咨询服务」进行深度沟通。[。．]?\s*/g,
      '\n'
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildFallbackActionAdvice(slots) {
  const s = slots && typeof slots === 'object' ? slots : getDiagSlots();
  const platform = s.platform || '当前平台';
  const shipping = s.shipping || '当前发货方式';
  const exportMode = resolveDiagExportMode(s) || s.exportMode || '当前出口方式';
  const invoice = s.invoice || '供应商发票情况';
  const product = s.productCategory || '所售产品';
  const entity = s.entity || '店铺主体';
  const items = [
    `按【合规方案】落实报关与出口路径：以「${exportMode}」和「${shipping}」为准，优先把报关抬头与经营主体对齐。`,
    `核对「${entity}」与「${platform}」店铺主体是否一致，并整理订单流、资金流、物流凭证，避免申报主体与平台报送脱节。`,
    `对照「${invoice}」盘点开票缺口；能改专票的优先改，报关品名、单位与发票保持一致。`,
    `就「${product}」在本页左侧「查询出口退税率」核实税号与退税率后再报关，不要把增值税税率当成出口退税率。`,
    '需要落地搭建或与税局沟通时，选择页面下方「专家1v1财税咨询服务」。',
  ];
  return `【行动建议】\n${items.map((x, i) => `${i + 1}. ${x}`).join('\n')}`;
}

function buildFallbackNotes(slots) {
  const s = slots && typeof slots === 'object' ? slots : getDiagSlots();
  const bullets = [
    '公司注册、海关备案、退免税资格等事项均有办理周期，请预留时间，不要按即时生效估算。',
    '出口申报不实、少缴税款可能面临税务稽查、滞纳金与罚款，请以真实交易和完整单证申报。',
    '本报告为基于您所填信息的一般性合规参考，不构成法律意见或具体办税承诺。',
    '本次诊断仅针对当前填写的一个销售平台；其他平台或另一套货盘需另行诊断。',
  ];
  if (/中国大陆公司|中国个人|个体户/.test(String(s.entity || ''))) {
    bullets.push('各地税局审核要点有差异，搭建前可咨询专家。');
  }
  return `【注意事项】\n${bullets.map((x) => `- ${x}`).join('\n')}`;
}

/** Model often stops after 合规方案; keep 行动建议 / 注意事项 visible. */
function ensureDiagnosisClosingChapters(text) {
  let t = String(text || '').trim();
  if (!t) return t;
  if (!/【核心风险诊断】|【合规方案】/.test(t)) return t;
  t = stripDiagnosisExpertTip(t);
  if (!diagnosisHasChapter(t, '行动建议')) {
    t = `${t}\n\n${buildFallbackActionAdvice()}`;
  }
  if (!diagnosisHasChapter(t, '注意事项')) {
    t = `${t}\n\n${buildFallbackNotes()}`;
  }
  return t;
}

/**
 * Only paint the right panel when the plan has real Chinese body under sections.
 * Avoids flashing empty headers / English meta during streaming.
 */
function isDiagnosisPlanReadyToShow(text) {
  const jsonReport = extractDiagnosisReportJson(text);
  if (jsonReport && isDiagnosisReportJsonReady(jsonReport)) return true;

  const t = normalizeDiagnosisSectionTitles(stripEnglishPromptMeta(String(text || '')));
  if (!t || looksLikeDiagnosisPlanScaffold(t) || looksLikeLocalGenericHelp(t)) return false;
  if (looksLikeEnglishPromptMeta(t) && countDiagnosisCjk(t) < 280) return false;
  if (diagnosisHasLeakedEnglish(t) && countDiagnosisCjk(t) < 280) return false;

  const markers = [
    /【核心风险诊断】/,
    /【合规方案】/,
    /【行动建议】/,
    /【注意事项】/,
  ];
  const hit = markers.filter((re) => re.test(t)).length;
  if (hit < 2) return false;
  if (countDiagnosisCjk(t) < 160) return false;

  // Body between titles must not be empty (headers-only drafts)
  const bodyOnly = t
    .replace(/【[^】]+】/g, '\n')
    .replace(/^\s*(?:业务流程|主要风险)\s*[:：]?\s*$/gm, '')
    .replace(/诊断档案确认[：:][^\n]*/g, '');
  if (countDiagnosisCjk(bodyOnly) < 100) return false;
  return true;
}

function prepareDiagnosisPlanMarkdown(text) {
  let t = String(text || '');
  t = stripEnglishPromptMeta(t);
  t = normalizeDiagnosisSectionTitles(t);
  t = stripDiagnosisArchivePreamble(t);
  t = t.replace(/(?:^|\n)\s*Path\s*[A-D](?:\.\d+)?[^\n]*/gi, '\n');
  t = t.replace(/(?:^|\n)\s*属于路径[A-D][^\n]*/g, '\n');
  t = ensureDiagnosisClosingChapters(t);
  return t.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * English / meta writing outlines that reuse report headers but are not a real plan.
 * e.g. "line", "bullet risks (3-5)", "opening sentence describing business profile"
 */
function looksLikeDiagnosisPlanScaffold(text) {
  const t = String(text || '').trim();
  if (!t) return false;

  const cleaned = stripEnglishPromptMeta(t);
  const cleanedCjk = countDiagnosisCjk(cleaned);
  const hasFormal =
    /【核心风险诊断】/.test(cleaned) &&
    /【合规方案】/.test(cleaned) &&
    cleanedCjk >= 160;

  // Chinese fill-in-the-blank skeletons — only treat as scaffold if no real formal body remains
  if (
    !hasFormal &&
    /业务流程一行|主要风险一行|3\s*[-–—~～]?\s*5\s*条风险|3\s*[-–—~～]?\s*6\s*条对症|一段画像[（(]|对症卡片|合规方案画像/.test(
      t
    )
  ) {
    return true;
  }
  if (
    !hasFormal &&
    /实际上我应该注意|让我先(?:写|检索|通读)|根据提示词|输出骨架/.test(t) &&
    cleanedCjk < 160
  ) {
    return true;
  }

  const latin = (cleaned.match(/[A-Za-z]/g) || []).length;
  const cjk = (cleaned.match(/[\u4e00-\u9fff]/g) || []).length;
  // Substantial Chinese body → treat as real content, not an English outline
  if (cjk >= 80 && cjk >= latin) return false;

  if (
    /opening sentence|business profile|bullet risks|only the matched path|Let me write|write (?:the )?(?:report|plan|it)|placeholder|lorem ipsum|TODO[:：]|write carefully/i.test(
      cleaned
    )
  ) {
    return true;
  }
  // Bare English stubs under Chinese section titles
  if (
    /【核心风险诊断】|【合规方案】|【行动建议】|【注意事项】/.test(cleaned) &&
    /(?:^|\n)\s*[-*•]?\s*\*{0,2}\s*line\s*\*{0,2}\s*(?:\n|$)/im.test(cleaned) &&
    cjk < 40
  ) {
    return true;
  }
  // Section headers present but body is Latin-heavy / Chinese-thin
  if (/【核心风险诊断】|【合规方案】/.test(cleaned)) {
    if (latin >= 36 && cjk < Math.max(24, Math.floor(latin * 0.7))) return true;
  }
  return false;
}

/** Pull a usable Chinese diagnosis body out of mixed CoT / path-template output. */
function salvageDiagnosisPlanFromRaw(raw) {
  const s = String(raw || '');
  if (!s.trim()) return '';

  const cjkCount = (x) => (String(x).match(/[\u4e00-\u9fff]/g) || []).length;

  const withChanges = s.match(/【变化点】[\s\S]*/);
  if (
    withChanges &&
    /【核心风险诊断】|【合规方案】/.test(withChanges[0]) &&
    cjkCount(withChanges[0]) >= 60 &&
    !looksLikeDiagnosisPlanScaffold(withChanges[0])
  ) {
    return withChanges[0].trim();
  }

  const formal = s.match(/【核心风险诊断】[\s\S]*/);
  if (formal && cjkCount(formal[0]) >= 60 && !looksLikeDiagnosisPlanScaffold(formal[0])) {
    return formal[0].trim();
  }

  const planOnly = s.match(/【合规方案】[\s\S]*/);
  if (planOnly && cjkCount(planOnly[0]) >= 80 && !looksLikeDiagnosisPlanScaffold(planOnly[0])) {
    return `【核心风险诊断】\n主要风险：\n- 详见下方合规方案结合业务画像评估\n\n${planOnly[0].trim()}`;
  }

  const path = s.match(/\*{0,2}【?\s*路径[ABC][·.．][^】\n]*】?\*{0,2}[\s\S]*/);
  if (path && cjkCount(path[0]) >= 80) {
    const body = path[0]
      .replace(/\*{0,2}【?\s*路径[ABC][·.．][^】\n]*】?\*{0,2}/g, '【合规方案】')
      .replace(/属于路径[ABC]/g, '当前业务路径')
      .trim();
    if (body && !looksLikeDiagnosisPlanScaffold(body)) return body;
  }

  return '';
}

/** Earlier mid-stream hint that the Agent started a formal plan (before all sections arrive). */
function looksLikeDiagnosisPlanStreaming(text) {
  const t = String(text || '');
  if (t.length < 80) return false;
  if (/"version"\s*:\s*1/.test(t) && /"risk"\s*:/.test(t)) return true;
  if (looksLikeDiagnosisPlanScaffold(t)) return false;
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
  if (extractDiagnosisReportJson(t)) return true;
  if (/"report_json"\s*:/.test(t) && /"version"\s*:/.test(t)) return true;
  if (looksLikeDiagnosisPlanScaffold(t)) return false;
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
  if (looksLikeLocalGenericHelp(t) || looksLikeDiagnosisPlanScaffold(t)) return false;
  // Diagnosis wizard Q&A must stay in the left chat
  if (isDiagnosisWizardCollecting() || looksLikeDiagnosisWizardAsk(t)) return false;
  return t.length > 100;
}

const DIAG_PLAN_STATUS_MSG = '道一合规助手正在为您生成专属合规方案，请查看右侧方案生成区';
const DIAG_PLAN_DONE_MSG = '道一合规助手已为您生成专属合规方案，请查看右侧方案生成区';
const DIAG_PLAN_UPDATE_STATUS_MSG =
  '道一合规助手正在对照上一轮诊断审视变化并更新方案，请查看右侧方案生成区';
const DIAG_PLAN_UPDATE_DONE_MSG = '已根据您本轮补充或变更的条件更新方案，请查看右侧方案生成区';
const QA_LONG_ANSWER_CHAT_TIP =
  '由于内容较多，道一合规助手已将回复展示在右侧方案生成区，请查看。';
const DIAG_PLAN_LIMIT = 3;
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
  showDiagnosisServiceRecs('', {
    ids: ['consult-1v1'],
    lead: '',
  });
}

function showDiagnosisServiceRecs(markdown, options = {}) {
  const serviceHost = document.getElementById('diagServiceRecs');
  if (!serviceHost) return;
  const html = buildDiagnosisServiceRecsHtml(markdown, options);
  if (!html) {
    serviceHost.innerHTML = '';
    serviceHost.hidden = true;
    return;
  }
  serviceHost.innerHTML = html;
  serviceHost.hidden = false;
  window.DAOITH_CART?.bindAddButtons?.(serviceHost);
}

/** After a substantive bot reply (not wizard slot prompts), always show service cards. */
function maybeShowServiceRecsAfterAnswer(answer) {
  const t = String(answer || '').trim();
  if (!t) return;
  if (isDiagnosisWizardCollecting() || looksLikeDiagnosisWizardAsk(t)) return;
  if (looksLikeLocalGenericHelp(t)) return;
  showDiagnosisServiceRecs(t);
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

/** Persist finished diagnosis plan to PM analytics (best-effort). */
function persistDiagnosisReport(markdown) {
  try {
    const auth = window.DAOITH_AUTH;
    if (!auth?.isLoggedIn?.()) return;
    const token = auth.getToken?.();
    if (!token) return;
    const cleanRaw = stripDiagnosisArchivePreamble(sanitizeAiAnswer(markdown));
    const jsonReport = extractDiagnosisReportJson(cleanRaw);
    const clean = jsonReport && isDiagnosisReportJsonReady(jsonReport)
      ? diagnosisReportJsonToMarkdown(jsonReport)
      : prepareDiagnosisPlanMarkdown(cleanRaw);
    if (!clean || !isDiagnosisPlanReadyToShow(clean)) return;

    const slots = typeof getDiagSlots === 'function' ? getDiagSlots() : {};
    const slotKey = [
      slots.platform,
      slots.entity,
      slots.shipping,
      slots.exportMode,
      slots.invoice,
      slots.productCategory,
      slots.revenue,
    ]
      .map((v) => String(v || '').trim())
      .join('|');
    const fingerprint = `${slotKey}::${clean.slice(0, 240)}`;
    const dedupeKey = 'daoith_diag_report_fp';
    if (sessionStorage.getItem(dedupeKey) === fingerprint) return;
    sessionStorage.setItem(dedupeKey, fingerprint);

    const reportId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `diag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const user = auth.getUser?.() || {};
    // Prefer Aliyun notify API (has PM_SYNC_SECRET); fall back to same-origin Vercel
    const base = (
      window.DAOITH_CONFIG?.notifyApiBase ||
      window.DAOITH_CONFIG?.authApiBase ||
      'https://api.daoith.com'
    ).replace(/\/$/, '');
    const recIds =
      typeof pickDiagnosisServiceIds === 'function' ? pickDiagnosisServiceIds(clean) : [];

    fetch(`${base}/api/diagnosis/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reportId,
        slots,
        reportMarkdown: clean,
        nickname: user.nickname || null,
        conversationId: localStorage.getItem('daoith_diagnosis_conversation_id') || null,
        recommendedServiceIds: Array.isArray(recIds) ? recIds : [],
        kind: 'diagnosis',
      }),
      keepalive: true,
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.warn('[diagnosis-report]', res.status, data.error || data);
        }
      })
      .catch((err) => {
        console.warn('[diagnosis-report]', err?.message || err);
      });
  } catch {
    /* never block diagnosis UX */
  }
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
  const slots = getDiagSlots();
  const shipping = String(slots.shipping || '');
  const exportMode =
    String(slots.exportMode || '').trim() ||
    (isPlatformDomesticWarehouseShipping(shipping) ? '由平台安排出口' : '');
  const invoice = String(slots.invoice || '');
  const product = String(slots.productCategory || '');
  const platform = String(slots.platform || '');
  const entity = String(slots.entity || '');
  // Slots first — plans often say「免税／清单」而不写「退税」，纯正文匹配会落到只剩专家1v1
  const t = [action, full, platform, entity, shipping, exportMode, invoice, product]
    .filter(Boolean)
    .join('\n');

  const ids = [];
  const add = (id) => {
    if (id && !ids.includes(id)) ids.push(id);
  };

  // 合规诊断完成后：专家1v1 固定第一位，其后才是路径套餐
  add('consult-1v1');

  const isDomesticWh =
    isPlatformDomesticWarehouseShipping(shipping) || /由平台安排出口/.test(exportMode);
  // Prefer slot shipping; only fall back to explicit overseas cues when shipping empty
  const isOverseasWh = shipping
    ? /亚马逊\s*FBA|FBA|FBL|Shopee海外仓|海外仓发货|半托管（海外仓）|POP（海外仓|自发货（海外仓|发货到平台海外仓|供货\s*SHEIN（保税仓）/.test(
        shipping
      )
    : !isDomesticWh &&
      /亚马逊\s*FBA|FBA|FBL|Shopee海外仓|海外仓发货|半托管（海外仓）|POP（海外仓|自发货（海外仓|发货到平台海外仓/.test(
        t
      );
  const isParcelExport =
    /小包快递出口|9610|1210|未报关/.test(exportMode) ||
    (/国内直发|POP（国内直发）|自发货（国内直发）/.test(shipping) &&
      /9610|1210|小包|未报关|保税|一日游/.test(t + exportMode));
  const noInvoice = /无法提供|无票|不能提供/.test(invoice) || /无法提供发票|无票出口/.test(t);
  const hasSpecialInvoice = /专用发票|专票/.test(invoice) || /专用发票|专票/.test(t);
  const mentions0110Hk = /0110/.test(t) && /香港/.test(t);
  const mentions1039Hk = /1039/.test(t) && /香港/.test(t);
  const wantsRebateHelp = /退税|免抵退|出口退|退免税|免税|征退差|报关退税|报关清单|报关单/.test(t);

  // ——— 路径套餐（第 2～4 位）———
  // 平台国内仓与海外仓互斥：国内仓不走 0110/9810 海外仓套餐
  if (
    !isDomesticWh &&
    (isOverseasWh || /正式报关出口（0110|正式报关出口（9810|9810|0110/.test(exportMode + t))
  ) {
    if (noInvoice || /1039|市场采购/.test(exportMode + t)) {
      add('domestic-arch-1039-hk');
      add('domestic-1039-sole');
    } else if (/9810/.test(exportMode) || (/9810/.test(t) && /退税|海外仓|陪跑|不确定/.test(t))) {
      add('domestic-rebate-9810');
      if (mentions0110Hk || /香港公司|0110出口\s*\+?\s*香港/.test(t)) add('domestic-arch-0110-hk');
    } else {
      add('domestic-arch-0110-hk');
    }
  }

  if (isParcelExport || /1210|9610|保税|一日游|分送集报/.test(t)) {
    add('domestic-rebate-1210-9610');
  }

  if (isDomesticWh) {
    // 平台国内仓：阿里系常涉及 9610 清单；普遍需要合规代账
    if (
      /速卖通|AliExpress|阿里|SHEIN|菜鸟|全托管|半托管/.test(platform + shipping + t) ||
      /9610|报关清单|退免税|免税/.test(t)
    ) {
      add('domestic-rebate-1210-9610');
    }
    add('domestic-compliance-bookkeeping');
  }

  if (mentions0110Hk) add('domestic-arch-0110-hk');
  if (mentions1039Hk) add('domestic-arch-1039-hk');
  if (/1039|市场采购/.test(exportMode + t) && (noInvoice || /个体户|核定/.test(t + entity))) {
    add('domestic-1039-sole');
    add('domestic-arch-1039-hk');
  }

  // ——— 通用配套 ———
  if (wantsRebateHelp) add('domestic-rebate');
  if (/VAT|Oss|IOSS|增值税注册|远程销售|欧盟.*税/.test(t)) add('overseas-vat');
  if (/销售税|Sales\s*Tax|Wayfair|经济关联/.test(t)) add('overseas-us-sales-tax');
  if (/ODI|境外投资|境外直接/.test(t)) add('overseas-odi');
  if (/香港公司|香港主体|香港审计|双层架构|0110出口\s*\+?\s*香港|1039出口\s*\+?\s*香港/.test(t)) {
    add('hk-company');
  }
  if (/记账|账务|做账|汇算清缴|账册/.test(t)) add('domestic-bookkeeping');
  if (/合规体检|全面诊断|架构诊断|风险排查/.test(t)) add('domestic-diagnosis');
  if (/全年陪跑|持续跟进|常年顾问|财税合规陪跑/.test(t)) add('consult-annual');

  // 若除专家外仍无套餐：按出口方式兜底
  if (ids.length <= 1) {
    if (/9810/.test(exportMode)) add('domestic-rebate-9810');
    else if (/9610|1210|小包/.test(exportMode)) add('domestic-rebate-1210-9610');
    else if (/1039|市场采购/.test(exportMode)) add('domestic-arch-1039-hk');
    else if (/0110|9710|正式报关/.test(exportMode) || isOverseasWh) add('domestic-arch-0110-hk');
    else if (isDomesticWh) add('domestic-compliance-bookkeeping');
    else if (hasSpecialInvoice || wantsRebateHelp) add('domestic-rebate');
    else add('domestic-diagnosis');
  }

  return ids.slice(0, 4);
}

function buildDiagnosisServiceRecsHtml(markdown, options = {}) {
  const ids = Array.isArray(options.ids) && options.ids.length
    ? options.ids
    : pickDiagnosisServiceIds(markdown);
  const lead =
    options.lead != null
      ? options.lead
      : '根据回复内容为您匹配，可加入询价单由顾问继续落地。';
  // Tip lives at the bottom of the right-hand plan panel, not in this block
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

const DIAG_SERVICE_MATCH_TIP =
  '道一合规小助手已为您匹配最相关的服务，请在本页面下方进行选择。';

function buildServiceMatchTipHtml() {
  return `<p class="result-service-match-tip">${escapeHtml(DIAG_SERVICE_MATCH_TIP)}</p>`;
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

function collectDiagWorkingChipLabels() {
  const s = getDiagSlots();
  const exportMode =
    s.exportMode ||
    (isPlatformDomesticWarehouseShipping(s.shipping) ? '由平台安排出口' : '');
  return [s.platform, s.entity, s.shipping, exportMode, s.invoice, s.productCategory, s.revenue]
    .map((v) => String(v || '').trim())
    .filter(Boolean);
}

function diagBrandLogoHtml(extraClass) {
  const cls = extraClass
    ? `result-placeholder-logo ${extraClass}`
    : 'result-placeholder-logo';
  return `<img class="${cls}" src="/images/logo-mark.png" alt="DAOITH" width="72" height="78" decoding="async">`;
}

function buildResultWorkingHtml() {
  const labels = collectDiagWorkingChipLabels();
  const positions = [
    { right: '112%', top: '2%' },
    { left: '112%', top: '2%' },
    { right: '118%', top: '38%' },
    { left: '118%', top: '38%' },
    { right: '108%', top: '74%' },
    { left: '108%', top: '74%' },
    { left: '50%', top: '-34%' },
  ];
  const chipHtml = labels.length
    ? labels
        .map((label, i) => {
          const pos = positions[i % positions.length];
          const place = [
            pos.left != null ? `left:${pos.left}` : '',
            pos.right != null ? `right:${pos.right}` : '',
            `top:${pos.top}`,
            pos.left === '50%' ? 'transform:translateX(-50%)' : '',
          ]
            .filter(Boolean)
            .join(';');
          return (
            `<span class="rw-chip rw-chip-${(i % 7) + 1}" style="${place}">` +
            `${escapeHtml(label)}` +
            `</span>`
          );
        })
        .join('')
    : `<span class="rw-chip rw-chip-1" style="left:50%;top:-34%;transform:translateX(-50%)">梳理诊断要点</span>`;

  return (
    `<div class="result-working" id="resultWorking" role="status" aria-live="polite">` +
    `<div class="result-working-scene" aria-hidden="true">` +
    diagBrandLogoHtml('rw-figure') +
    `<div class="rw-thoughts">${chipHtml}</div>` +
    `</div>` +
    `<p class="result-working-title">` +
    `<span class="result-working-brand">道一合规助手</span>` +
    `<span class="result-working-ai-tag">AI</span>` +
    `<span class="result-working-title-rest">正在生成专属合规方案</span>` +
    `</p>` +
    `<p class="result-working-sub">正在根据您的选项梳理方案<span class="result-working-dots" aria-hidden="true"></span></p>` +
    `</div>`
  );
}

function showResultWorking() {
  const placeholder = document.getElementById('resultPlaceholder');
  const content = document.getElementById('resultContent');
  const items = document.getElementById('resultItems');
  const serviceHost = document.getElementById('diagServiceRecs');
  if (!items || !content) return;
  if (placeholder) placeholder.style.display = 'none';
  content.classList.add('active');
  if (serviceHost) {
    serviceHost.innerHTML = '';
    serviceHost.hidden = true;
  }
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

  const cleanRaw = stripDiagnosisArchivePreamble(sanitizeAiAnswer(markdown));
  const kind = options.kind === 'qa' ? 'qa' : 'diagnosis';
  const jsonReport =
    options.jsonReport ||
    (kind === 'diagnosis' ? extractDiagnosisReportJson(cleanRaw) : null);

  if (kind === 'diagnosis' && jsonReport && isDiagnosisReportJsonReady(jsonReport)) {
    const clean = diagnosisReportJsonToMarkdown(jsonReport);
    if (
      looksLikeLocalGenericHelp(clean) ||
      looksLikeDiagnosisPlanScaffold(clean) ||
      !isDiagnosisReportJsonReady(jsonReport)
    ) {
      return;
    }
    const body = renderDiagnosisReportJson(jsonReport);
    const fromChat = `以下方案由左侧<strong>道一合规助手</strong>生成：`;
    const archiveHtml = buildDiagnosisArchiveConfirmHtml();
    const changeHtml = buildDiagnosisChangePointsHtml(getLastDiagFollowUpChanges());
    const tipHtml = buildServiceMatchTipHtml();
    items.innerHTML =
      `<div class="result-body result-body-scroll">` +
      `<p class="result-paragraph result-greeting">${escapeHtml(SOLUTION_GREETING)}</p>` +
      `<p class="result-paragraph result-from-chat">${fromChat}</p>` +
      archiveHtml +
      changeHtml +
      body +
      tipHtml +
      `</div>`;
    if (serviceHost) {
      showDiagnosisServiceRecs(clean, {
        lead: '根据方案中的行动建议为您匹配，可加入询价单由顾问继续落地。',
      });
    }
    try {
      items.scrollTop = 0;
    } catch {
      /* ignore */
    }
    return;
  }

  const clean =
    kind === 'qa' ? cleanRaw : prepareDiagnosisPlanMarkdown(cleanRaw);
  // Never fall back to raw model text that still contains think / CoT
  if (!clean) return;
  // Local generic help / English scaffolds / prompt-meta are not diagnosis reports
  if (
    kind === 'diagnosis' &&
    (looksLikeLocalGenericHelp(clean) ||
      looksLikeDiagnosisPlanScaffold(clean) ||
      !isDiagnosisPlanReadyToShow(clean))
  ) {
    return;
  }
  if (kind === 'qa' && looksLikeLocalGenericHelp(clean)) {
    return;
  }
  const body = renderAIPlanHtml(clean) || `<p class="result-paragraph">${escapeHtml(clean)}</p>`;
  const fromChat =
    kind === 'qa'
      ? `以下回复由左侧<strong>道一合规助手</strong>生成：`
      : `以下方案由左侧<strong>道一合规助手</strong>生成：`;
  const archiveHtml = kind === 'diagnosis' ? buildDiagnosisArchiveConfirmHtml() : '';
  const changeHtml =
    kind === 'diagnosis' ? buildDiagnosisChangePointsHtml(getLastDiagFollowUpChanges()) : '';
  const tipHtml = buildServiceMatchTipHtml();
  items.innerHTML =
    `<div class="result-body result-body-scroll">` +
    `<p class="result-paragraph result-greeting">${escapeHtml(SOLUTION_GREETING)}</p>` +
    `<p class="result-paragraph result-from-chat">${fromChat}</p>` +
    archiveHtml +
    changeHtml +
    body +
    tipHtml +
    `</div>`;

  if (serviceHost) {
    // Full diagnosis plans and Mode B / long Q&A answers both get recommendations
    showDiagnosisServiceRecs(clean, {
      lead:
        kind === 'qa'
          ? '根据您的问题为您匹配，可加入询价单由顾问继续落地。'
          : '根据方案中的行动建议为您匹配，可加入询价单由顾问继续落地。',
    });
  }

  try {
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

硬规则：只输出知识库中的「出口退税率」字段；严禁把「增值税税率」当作出口退税率。例如其他银首饰7113119090出口退税13%；镶钻银饰71131110常见增值税13%、出口退税0%。退税率为0时必须同时读取「特殊商品标识」（旧称特殊标志）：1=出口征税/视同内销（进项可抵）；2=出口免税（进项转出）。含黄金、铂金成分货物及钻石及其饰品一般为标识2，禁止写成视同内销。

输出要求（中文，简洁）：
1. 第一行：出口退税率：X%
2. 第二行：特殊商品标识：1 或 2（并注明征税/免税含义；知识库无该字段则写未收录）
3. 第三行：数据来源：知识库 / 国家税务总局出口退税率文库（注明依据）
4. 第四行：简要说明（不超过40字；可同时注明增值税税率但不得与退税率混用）
不要编造无法核实的税率；不确定时明确写「需人工核对官方税则」。`,
  });
}

function hsRefundApiCandidates() {
  const cfg = getDifyConfig();
  const path = cfg.hsRefundApiPath || '/api/hs-refund-rate';
  const rel = path.startsWith('/') ? path : `/${path}`;
  const remoteBase = (cfg.notifyApiBase || cfg.difyApiBase || 'https://api.daoith.com').replace(
    /\/$/,
    ''
  );
  const remote = `${remoteBase}${rel}`;
  const host = typeof location !== 'undefined' ? location.hostname : '';
  if (host === 'localhost' || host === '127.0.0.1') return [rel, remote];
  return [remote];
}

/** Left-side HS refund lookup: Dataset Retrieve API (structured), not Chat LLM. */
async function lookupRefundRateFromKnowledgeBase(hsCode) {
  let lastError = null;
  for (const url of hsRefundApiCandidates()) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hs_code: hsCode }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        lastError = new Error(`退税率知识库返回异常（HTTP ${res.status}）`);
        continue;
      }
      if (!res.ok) {
        lastError = new Error(data.message || data.error || `知识库查询失败（HTTP ${res.status}）`);
        continue;
      }
      return data;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('知识库查询失败');
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
  const digits = String(matched).replace(/\D/g, '').slice(0, 10) || hsCode;
  const flagLabel = kb.special_goods_flag_label || '';
  if (flagLabel) {
    return `${digits} 的出口退税率为 ${rate}。特殊商品标识 ${flagLabel}。`;
  }
  return `${digits} 的出口退税率为 ${rate}。`;
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
  // Highlight common customs / regime codes (allow fullwidth digits / nearby punctuation)
  s = s.replace(
    /(?<![\d])(0110|9610|9810|9710|1210|1039|FBA|FBT|VOEC|IOSS|HS)(?![\d])/gi,
    '<span class="result-code">$1</span>'
  );
  s = s.replace(/([（(])\s*(<span class="result-code">)/g, '$1$2');
  s = s.replace(/(<\/span>)\s*([）)])/g, '$1$2');
  // Keep CJK corner brackets from sitting flush against code pills
  s = s.replace(/([「『])(<span class="result-code">)/g, '$1&#8201;$2');
  s = s.replace(/(<\/span>)([」』])/g, '$1&#8201;$2');
  return s;
}

function splitArrowFlowParts(text) {
  return String(text || '')
    .replace(/^[-*•]\s+/, '')
    .split(/\s*(?:→|⟶|->|➜|➔)\s*/)
    .map((s) =>
      s
        .replace(/^[\d]+[.)、．]\s*/, '')
        .replace(/^[\s"'“”「『]+/, '')
        .replace(/[\s"'“”」』]+$/, '')
        .trim()
    )
    .filter(Boolean);
}

function renderArrowFlowHtml(parts) {
  if (!parts || parts.length < 2) return '';
  return `<p class="result-paragraph result-process-text">${formatInline(parts.join(' → '))}</p>`;
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

/** Split a 合规方案 bullet into card title + body (legacy; plan now uses detail rows). */
function splitPlanCardContent(content) {
  const raw = String(content || '').trim();
  if (!raw) return null;

  const bold = raw.match(/^\*\*([^*]{1,40})\*\*\s*[:：]?\s*([\s\S]*)$/);
  if (bold) {
    const key = bold[1].replace(/\s+/g, ' ').trim();
    const val = String(bold[2] || '')
      .replace(/^\s*[:：]\s*/, '')
      .trim();
    if (key && val) return { key, val };
  }

  const plain = raw.match(/^([^：:\n＊*]{2,48})[:：]\s*([\s\S]{6,})$/);
  if (plain && !/→|⟶|->/.test(plain[1])) {
    return {
      key: plain[1].replace(/\*\*/g, '').replace(/\s+/g, ' ').trim(),
      val: plain[2].trim(),
    };
  }

  const lead = raw.match(/^(.{4,36}?)([。．])([\s\S]{16,})$/);
  if (lead && !/→|⟶|->/.test(lead[1]) && !/^\d+$/.test(lead[1])) {
    return {
      key: lead[1].replace(/\*\*/g, '').replace(/\s+/g, ' ').trim(),
      val: `${lead[3]}`.trim(),
    };
  }

  return null;
}

const DIAGNOSIS_REPORT_JSON_VERSION = 1;

/** Extract structured diagnosis report JSON from Agent / Workflow output. */
function extractDiagnosisReportJson(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const tryParse = (candidate) => {
    try {
      let obj = JSON.parse(String(candidate || '').trim());
      if (!obj || typeof obj !== 'object') return null;

      // Workflow tool often returns { report_json: "{...}" } or { report_json: {...} }
      for (let depth = 0; depth < 3; depth++) {
        if (obj.report_json != null) {
          if (typeof obj.report_json === 'string') {
            const inner = JSON.parse(obj.report_json);
            if (inner && typeof inner === 'object') obj = inner;
            else break;
            continue;
          }
          if (typeof obj.report_json === 'object') {
            obj = obj.report_json;
            continue;
          }
        }
        if (obj.structured_output && typeof obj.structured_output === 'object') {
          obj = obj.structured_output;
          continue;
        }
        if (obj.data && typeof obj.data === 'object' && (obj.data.risk || obj.data.plan || obj.data.report_json)) {
          obj = obj.data;
          continue;
        }
        break;
      }

      const ver = obj.version;
      const hasBody = Boolean(obj.risk || obj.plan || obj.actions || obj.notes);
      if (ver !== DIAGNOSIS_REPORT_JSON_VERSION && ver !== '1' && ver !== 1 && !hasBody) {
        return null;
      }
      if (!hasBody) return null;
      return normalizeDiagnosisReportJson(obj);
    } catch {
      return null;
    }
  };

  const direct = tryParse(raw);
  if (direct) return direct;

  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    const fromFence = tryParse(fence[1]);
    if (fromFence) return fromFence;
  }

  // Prefer object that contains report_json / version
  const wrappers = raw.match(/\{[\s\S]*?"report_json"\s*:[\s\S]*\}/g);
  if (wrappers) {
    for (let i = wrappers.length - 1; i >= 0; i--) {
      const hit = tryParse(wrappers[i]);
      if (hit) return hit;
    }
  }

  const brace = raw.match(/\{[\s\S]*"version"\s*:\s*1[\s\S]*\}/);
  if (brace) {
    const fromBrace = tryParse(brace[0]);
    if (fromBrace) return fromBrace;
  }

  // Greedy: last big JSON-looking blob
  const lastBrace = raw.lastIndexOf('{');
  if (lastBrace >= 0) {
    const fromLast = tryParse(raw.slice(lastBrace));
    if (fromLast) return fromLast;
  }

  return null;
}

function normalizeDiagnosisReportStageItem(item) {
  if (typeof item === 'string') return item.trim();
  if (item && typeof item === 'object') {
    const title = String(item.title || '').trim();
    const body = String(item.body || item.text || '').trim();
    if (title && body) return { title, body };
    if (title) return title;
    if (body) return body;
  }
  return '';
}

function normalizeDiagnosisReportJson(obj) {
  const src = obj && typeof obj === 'object' ? obj : {};
  const normStages = (stages) =>
    (Array.isArray(stages) ? stages : [])
      .map((stage, idx) => {
        if (!stage || typeof stage !== 'object') return null;
        const num = String(stage.num || String(idx + 1).padStart(2, '0')).trim();
        const title = String(stage.title || PLAN_STAGE_TITLES[idx] || '').trim();
        const items = (Array.isArray(stage.items) ? stage.items : [])
          .map(normalizeDiagnosisReportStageItem)
          .filter(Boolean);
        if (!title && !items.length) return null;
        return { num, title, items };
      })
      .filter(Boolean);

  const normDetails = (details) =>
    (Array.isArray(details) ? details : [])
      .map((d) => {
        if (typeof d === 'string') {
          const m = d.match(/^\*\*([^*]+)\*\*\s*[:：]\s*([\s\S]+)$/);
          if (m) return { title: m[1].trim(), body: m[2].trim() };
          return { title: '', body: d.trim() };
        }
        if (d && typeof d === 'object') {
          return {
            title: String(d.title || '').trim(),
            body: String(d.body || d.text || '').trim(),
          };
        }
        return null;
      })
      .filter((d) => d && (d.title || d.body));

  const normalized = {
    version: DIAGNOSIS_REPORT_JSON_VERSION,
    changes: (Array.isArray(src.changes) ? src.changes : [])
      .map((c) => ({
        field: String(c?.field || c?.label || '').trim(),
        from: String(c?.from || '').trim(),
        to: String(c?.to || '').trim(),
      }))
      .filter((c) => c.field),
    impact: String(src.impact || '').trim(),
    risk: {
      processFlow: (() => {
        const raw = String(src.risk?.processFlow || '').trim();
        if (!raw || isGenericDiagnosisProcessFlow(raw)) {
          return buildDiagnosisProcessFlowFromSlots(getDiagSlots());
        }
        return raw;
      })(),
      summary: String(src.risk?.summary || '')
        .trim()
        .replace(/^\s*[-*•]\s+/, '')
        .replace(/^当前最大瓶颈是[：:]\s*/, '当前最大瓶颈是'),
      stages: normStages(src.risk?.stages),
    },
    plan: {
      intro: String(src.plan?.intro || '').trim(),
      overview: normStages(src.plan?.overview),
      details: normDetails(src.plan?.details),
    },
    actions: (Array.isArray(src.actions) ? src.actions : [])
      .map((a) => stripDiagnosisActionStepPrefix(String(a || '')))
      .filter(Boolean),
    notes: (Array.isArray(src.notes) ? src.notes : [])
      .map((n) => String(n || '').trim())
      .filter(Boolean),
    closing: String(
      src.closing ||
        '可以选择页面下方「专家1v1财税咨询服务」进行深度沟通。'
    ).trim(),
  };
  return ensureDiagnosisReportArchitectures(normalized, getDiagSlots());
}

function isDiagnosisReportJsonReady(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const md = diagnosisReportJsonToMarkdown(obj);
  if (!md || looksLikeDiagnosisPlanScaffold(md)) return false;
  const hasRisk = Boolean(obj.risk?.processFlow || obj.risk?.stages?.length);
  const hasPlan = Boolean(
    obj.plan?.intro || obj.plan?.overview?.length || obj.plan?.details?.length
  );
  const hasActions = Array.isArray(obj.actions) && obj.actions.length >= 2;
  const hasNotes = Array.isArray(obj.notes) && obj.notes.length >= 2;
  const sections = [hasRisk, hasPlan, hasActions, hasNotes].filter(Boolean).length;
  if (sections < 3) return false;
  if (countDiagnosisCjk(md) < 160) return false;
  return true;
}

function diagnosisReportJsonToMarkdown(obj) {
  const report = normalizeDiagnosisReportJson(obj);
  const lines = [];

  if (report.changes?.length) {
    lines.push('【变化点】');
    report.changes.forEach((c) => {
      lines.push(`- ${c.field}：${c.from} → ${c.to}`);
    });
    lines.push('');
  }
  if (report.impact) {
    lines.push('【影响与注意事项】');
    lines.push(report.impact);
    lines.push('');
  }

  lines.push('【核心风险诊断】');
  if (report.risk.processFlow) lines.push(`业务流程：${report.risk.processFlow}`);
  if (report.risk.summary) lines.push(`主要风险：${report.risk.summary}`);
  (report.risk.stages || []).forEach((stage) => {
    lines.push(`${stage.num} ${stage.title}`);
    (stage.items || []).forEach((item) => {
      if (typeof item === 'string') lines.push(`- ${item}`);
      else lines.push(`- **${item.title}**：${item.body}`);
    });
  });
  lines.push('');

  lines.push('【合规方案】');
  if (report.plan.intro) lines.push(report.plan.intro);
  (report.plan.overview || []).forEach((stage) => {
    lines.push(`${stage.num} ${stage.title}`);
    (stage.items || []).forEach((it) => lines.push(`- ${it}`));
  });
  (report.plan.details || []).forEach((d) => {
    if (d.title) lines.push(`- **${d.title}**：${d.body}`);
    else if (d.body) lines.push(`- ${d.body}`);
  });
  lines.push('');

  lines.push('【行动建议】');
  report.actions.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  lines.push('');

  lines.push('【注意事项】');
  report.notes.forEach((n) => lines.push(`- ${n}`));
  lines.push('');
  if (report.closing) lines.push(report.closing);

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function renderDiagnosisReportJson(obj) {
  const report = normalizeDiagnosisReportJson(obj);
  let html = '';

  if (report.changes?.length) {
    html += `<h5 class="result-section-title">【变化点】</h5>`;
    html += `<ul class="result-list result-list-l2">`;
    report.changes.forEach((c) => {
      html += `<li>${escapeHtml(c.field)}：${escapeHtml(c.from)} → ${escapeHtml(c.to)}</li>`;
    });
    html += `</ul>`;
  }
  if (report.impact) {
    html += `<h5 class="result-section-title">【影响与注意事项】</h5>`;
    html += `<p class="result-paragraph">${formatInline(report.impact)}</p>`;
  }

  html += `<h5 class="result-section-title">【核心风险诊断】</h5>`;
  if (report.risk.processFlow) {
    html += `<h5 class="result-section-subtitle result-flow-heading">业务流程：</h5>`;
    const parts = splitArrowFlowParts(report.risk.processFlow);
    html +=
      parts.length >= 2
        ? renderArrowFlowHtml(parts)
        : `<p class="result-paragraph">${formatInline(report.risk.processFlow)}</p>`;
  }
  if (report.risk.summary) {
    html += `<h5 class="result-section-subtitle">主要风险：</h5>`;
    html += `<p class="result-paragraph result-risk-summary">${formatRiskOrBulletContent(report.risk.summary)}</p>`;
  }
  (report.risk.stages || []).forEach((stage) => {
    html += `<h6 class="result-stage-subtitle"><span class="result-plan-stage-num">${escapeHtml(stage.num || '01')}</span>${escapeHtml(stage.title)}</h6>`;
    html += `<ul class="result-list result-list-l2">`;
    (stage.items || []).forEach((item) => {
      if (typeof item === 'string') {
        html += `<li>${formatRiskOrBulletContent(item)}</li>`;
      } else {
        html += `<li><strong class="result-em">${escapeHtml(item.title)}</strong>：${formatInline(item.body || '')}</li>`;
      }
    });
    html += `</ul>`;
  });

  html += `<h5 class="result-section-title">【合规方案】</h5>`;
  if (report.plan.intro) {
    html += `<p class="result-paragraph">${formatInline(report.plan.intro)}</p>`;
  }
  if (report.plan.overview?.length) {
    html += renderPlanOverviewHtml(report.plan.overview);
  }
  if (report.plan.details?.length) {
    html += `<ul class="result-plan-details">`;
    report.plan.details.forEach((d) => {
      const content = d.title ? `**${d.title}**：${d.body || ''}` : d.body || '';
      html += renderPlanDetailItemHtml(content);
    });
    html += `</ul>`;
  }

  html += `<h5 class="result-section-title">【行动建议】</h5>`;
  html += `<ol class="result-list-actions-flat">`;
  report.actions.forEach((a, i) => {
    html +=
      `<li>` +
      `<span class="result-action-num" aria-hidden="true">${i + 1}.</span>` +
      `<span class="result-action-body">${formatInline(String(a))}</span>` +
      `</li>`;
  });
  html += `</ol>`;

  html += `<h5 class="result-section-title">【注意事项】</h5>`;
  html += `<ul class="result-list result-list-l2">`;
  report.notes.forEach((n) => {
    html += `<li>${formatInline(String(n))}</li>`;
  });
  html += `</ul>`;

  if (report.closing) {
    html += `<p class="result-paragraph">${formatInline(report.closing)}</p>`;
  }

  return html;
}

const PLAN_STAGE_TITLES = [
  '供应商发票和产品环节',
  '报关出口环节',
  '境外销售环节',
];

/** Match「01 供应商发票和产品环节」stage headings used across report chapters. */
function matchPlanStageHeading(line) {
  const t = String(line || '')
    .replace(/\*/g, '')
    .replace(/^[-*•]\s+/, '')
    .replace(/^\d+[.)、．]\s+/, '')
    .replace(/^【\s*/, '')
    .replace(/\s*】$/, '')
    .trim();
  if (!t) return null;
  if (/环节概览|整改概览|概览事项/.test(t) && !/细则/.test(t)) {
    return { kind: 'overviewLabel', num: '', title: t };
  }
  if (/环节细则|整改细则|细则说明/.test(t)) {
    return { kind: 'detailLabel', num: '', title: t };
  }
  for (let i = 0; i < PLAN_STAGE_TITLES.length; i++) {
    const title = PLAN_STAGE_TITLES[i];
    const re = new RegExp(
      `^(?:0?${i + 1}[.、．:\\s]*)?${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`
    );
    if (re.test(t)) {
      return { kind: 'stage', num: String(i + 1).padStart(2, '0'), title };
    }
  }
  return null;
}

function isPlanOverviewBullet(content) {
  const raw = String(content || '').trim();
  if (!raw) return false;
  const card = splitPlanCardContent(raw);
  if (card && String(card.val || '').length >= 28) return false;
  const plain = raw.replace(/\*/g, '').trim();
  if (plain.length <= 42 && !/[。；]/.test(plain)) return true;
  if (card && String(card.val || '').length < 28) return true;
  return plain.length <= 36;
}

function renderPlanOverviewHtml(stages) {
  const list = (stages || []).filter((s) => s && (s.items?.length || s.title));
  if (!list.length) return '';
  const parts = list.map((stage, idx) => {
    const items = (stage.items || [])
      .map((it) => `<li>${escapeHtml(String(it).replace(/\*/g, '').trim())}</li>`)
      .join('');
    const arrow =
      idx < list.length - 1
        ? `<span class="result-plan-overview-arrow" aria-hidden="true"></span>`
        : '';
    return (
      `<div class="result-plan-stage">` +
      `<div class="result-plan-stage-head">` +
      `<span class="result-plan-stage-num">${escapeHtml(stage.num || String(idx + 1).padStart(2, '0'))}</span>` +
      `<span class="result-plan-stage-title">${escapeHtml(stage.title)}</span>` +
      `</div>` +
      (items ? `<ul class="result-plan-stage-items">${items}</ul>` : '') +
      `</div>${arrow}`
    );
  });
  return `<div class="result-plan-overview" role="list">${parts.join('')}</div>`;
}

function renderPlanDetailItemHtml(content) {
  const card = splitPlanCardContent(content) || matchBoldKvContent(content);
  if (card) {
    const key = card.key || card[1];
    const val = card.val || card[2];
    return (
      `<li class="result-plan-detail">` +
      `<span class="result-plan-detail-title">${escapeHtml(key)}</span>` +
      `<span class="result-plan-detail-body">${formatInline(val)}</span>` +
      `</li>`
    );
  }
  return `<li class="result-plan-detail"><span class="result-plan-detail-body">${formatPlanListItem(content)}</span></li>`;
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
  const m = String(rawLine || '').match(
    /^([ \t]*)([-*•]|(?:\d+\.)+\d+[.)、．]?|\d+[.)、．]|[a-zA-Z][.)、．])\s+(.*)$/
  );
  if (!m) return null;
  const spaces = m[1].replace(/\t/g, '  ').length;
  let depth = Math.min(3, Math.floor(spaces / 2));
  const marker = m[2];
  const isLetter = /^[a-zA-Z][.)、．]$/.test(marker);
  // Letter sub-points (a./b.) are always nested under the current parent item
  if (isLetter && depth < 1) depth = 1;
  return {
    depth,
    ordered: /^(?:\d+\.)+\d+[.)、．]?$|^\d+[.)、．]$/.test(marker),
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
  // Drop lines that became empty after URL cleanup, plus leaked CoT / prompt checklists
  t = t
    .split('\n')
    .map((ln) => ln.replace(/\s+$/g, ''))
    .filter((ln) => !/^[-*•◆▪]\s*$/.test(ln))
    .filter((ln) => !/^\s*[✓✔☑✅]\s*$/.test(ln))
    .filter((ln) => !isDiagnosisJunkLine(ln))
    .join('\n');

  // Strip self-check mapping blocks: 「概览: … -> 细则: … ✓」
  t = t.replace(/(?:^|\n)\s*[-*•]?\s*概览\s*[:：][^\n]*(?:细则|->|→)[^\n]*/g, '\n');
  // Strip leftover bare「结尾句」placeholders
  t = t.replace(/(?:^|\n)\s*[-*•]?\s*结尾句\s*(?=\n|$)/g, '\n');
  t = t.replace(/\n{3,}/g, '\n\n');

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
    .replace(/^\*\*\s*\d+(?:\.\d+)*\s*[.、)）．]?\s*\*\*\s*/, '')
    .replace(/^\*\*\d+(?:\.\d+)*\*\*\s*[.、)）．]?\s*/, '')
    .replace(/^\d+\.\d+\s*[.)、．]?\s*/, '')
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
  '您好，我是您的AI合规助手，我将基于财税知识库给您提供合规方案，供您一般性参考。由于AI和知识库具有一定的局限性，如您需要更准确和更有针对性的解决方案，建议您预约我们的财税专家进行一对一咨询！';

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
  let flowPartsBuf = [];
  /** Open nested <ul> depths under the current top-level ul (1 = first nest / 三级). */
  let ulNestDepth = 0;
  let ulLiOpenAt = []; // bool per nest depth whether <li> is open
  /** planPhase: null | 'overview' | 'detail' — 合规方案概览行 + 细则 */
  let planPhase = null;
  let planOverviewStages = [];
  let planDetailOpen = false;

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

  const flushFlowBuffer = () => {
    if (flowPartsBuf.length >= 2) {
      html += renderArrowFlowHtml(flowPartsBuf);
    } else if (flowPartsBuf.length === 1) {
      html += `<p class="result-paragraph">${formatInline(flowPartsBuf[0])}</p>`;
    }
    flowPartsBuf = [];
  };

  const flushPlanOverview = () => {
    if (!planOverviewStages.length) return;
    html += renderPlanOverviewHtml(planOverviewStages);
    planOverviewStages = [];
  };

  const closePlanDetailList = () => {
    if (planDetailOpen) {
      html += '</ul>';
      planDetailOpen = false;
    }
  };

  const resetPlanLayout = () => {
    flushPlanOverview();
    closePlanDetailList();
    planPhase = null;
  };

  const closeList = () => {
    flushFlowBuffer();
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

  const appendActionTopItem = (contentHtml) => {
    closeLi();
    openList('ol');
    html += `<li>${contentHtml}`;
    liOpen = true;
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
    if (isDiagnosisJunkLine(rawLine) || isDiagnosisJunkLine(line)) continue;

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
          const arrowParts = splitArrowFlowParts(rest);
          html +=
            arrowParts.length >= 2
              ? renderArrowFlowHtml(arrowParts)
              : `<p class="result-paragraph">${formatInline(rest)}</p>`;
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
      resetPlanLayout();
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
      const level = (line.match(/^#+/) || ['##'])[0].length;
      const title = cleanSectionTitle(line.replace(/^#{1,4}\s+/, ''));
      const stageFromHash = matchPlanStageHeading(title);
      // 行动建议：忽略三大环节小标题，保持连续 1/2/3…（先跳过，勿 closeList）
      if (stageFromHash?.kind === 'stage' && sectionKind === 'actions') continue;
      closeList();
      if (stageFromHash?.kind === 'stage' && (sectionKind === 'plan' || sectionKind === 'risk')) {
        if (sectionKind === 'plan') {
          // 细则阶段：忽略环节小标题，项目连续排列
          if (planPhase === 'detail' || planDetailOpen) {
            flushPlanOverview();
            planPhase = 'detail';
            continue;
          }
          planPhase = 'overview';
          planOverviewStages.push({ num: stageFromHash.num, title: stageFromHash.title, items: [] });
        } else {
          html += `<h6 class="result-stage-subtitle"><span class="result-plan-stage-num">${escapeHtml(stageFromHash.num)}</span>${escapeHtml(stageFromHash.title)}</h6>`;
        }
        continue;
      }
      if (stageFromHash?.kind === 'overviewLabel' && sectionKind === 'plan') {
        flushPlanOverview();
        closePlanDetailList();
        planPhase = 'overview';
        continue;
      }
      if (stageFromHash?.kind === 'detailLabel' && sectionKind === 'plan') {
        flushPlanOverview();
        planPhase = 'detail';
        continue;
      }
      resetPlanLayout();
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
      resetPlanLayout();
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

    // Stage headings inside risk / plan / actions (plain or bold lines)
    const stageHit = matchPlanStageHeading(line);
    if (
      stageHit &&
      (sectionKind === 'plan' || sectionKind === 'risk' || sectionKind === 'actions') &&
      !/^[-*•]\s+/.test(line) &&
      !/^\d+[.)、．]\s+\S{20,}/.test(line)
    ) {
      // 行动建议：跳过环节标题，列表连续编号
      if (sectionKind === 'actions' && stageHit.kind === 'stage') continue;
      closeList();
      if (stageHit.kind === 'overviewLabel' && sectionKind === 'plan') {
        flushPlanOverview();
        closePlanDetailList();
        planPhase = 'overview';
        continue;
      }
      if (stageHit.kind === 'detailLabel' && sectionKind === 'plan') {
        flushPlanOverview();
        planPhase = 'detail';
        continue;
      }
      if (stageHit.kind === 'stage') {
        if (sectionKind === 'plan') {
          // 细则阶段：不插入 01/02/03 小标题，菱形项目一条条往下排
          if (planPhase === 'detail' || planDetailOpen) {
            flushPlanOverview();
            planPhase = 'detail';
            continue;
          }
          planPhase = 'overview';
          planOverviewStages.push({ num: stageHit.num, title: stageHit.title, items: [] });
        } else {
          html += `<h6 class="result-stage-subtitle"><span class="result-plan-stage-num">${escapeHtml(stageHit.num)}</span>${escapeHtml(stageHit.title)}</h6>`;
        }
        continue;
      }
    }

    const listInfo = parsePlanListMarker(rawLine);
    const orderedMatch = listInfo?.ordered
      ? [null, listInfo.content]
      : line.match(/^(?:\d+\.)+\d+[.)、．]?\s+(.*)$/) || line.match(/^\d+[.)、．]\s*(.*)$/);
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
        const step = content
          .replace(/^[\s"'“”「『]+/, '')
          .replace(/[\s"'“”」』]+$/, '')
          .trim();
        if (step) flowPartsBuf.push(step);
        continue;
      }

      // Under 行动建议: promote `- **标题**：说明` to next numbered peer
      // Never switch mid-section from bullets → numbers (avoids ○ then 1. mix).
      // 合规方案用概览+细则，不升成有序编号。
      if (
        bulletMatch &&
        depth === 0 &&
        listMode === 'ol' &&
        liOpen &&
        looksLikePeerActionItem(content) &&
        sectionKind === 'actions'
      ) {
        appendActionTopItem(formatPlanListItem(content));
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

      // 【合规方案】：概览短事项归入三列；细则用菱形列表（不再用卡片）
      if (sectionKind === 'plan' && (depth === 0 || !liOpen)) {
        if (listMode === 'ol' || listMode === 'flow') closeList();
        const plainItem = String(content || '')
          .replace(/^\*\*([^*]+)\*\*\s*[:：]?\s*$/, '$1')
          .replace(/\*/g, '')
          .trim();
        const inOverview =
          planPhase !== 'detail' &&
          (planPhase === 'overview' ||
            planOverviewStages.length > 0 ||
            isPlanOverviewBullet(content));
        if (inOverview && isPlanOverviewBullet(content) && planPhase !== 'detail') {
          planPhase = 'overview';
          if (!planOverviewStages.length) {
            planOverviewStages.push({
              num: '01',
              title: PLAN_STAGE_TITLES[0],
              items: [],
            });
          }
          const stage = planOverviewStages[planOverviewStages.length - 1];
          const split = splitPlanCardContent(content) || matchBoldKvContent(content);
          const label = split
            ? String(split.key || split[1] || '').trim()
            : plainItem;
          if (label) stage.items.push(label);
          continue;
        }
        flushPlanOverview();
        planPhase = 'detail';
        if (listMode === 'ul') closeList();
        if (!planDetailOpen) {
          html += `<ul class="result-plan-details">`;
          planDetailOpen = true;
        }
        html += renderPlanDetailItemHtml(content);
        continue;
      }

      // notes/risk: flat bullets only. actions: ordered. plan handled above.
      const useOrdered =
        depth === 0 &&
        listMode !== 'ul' &&
        content.length <= 220 &&
        sectionKind === 'actions' &&
        (Boolean(orderedMatch) ||
          (looksLikePeerActionItem(content) && listMode !== 'ul'));

      // notes: keep flat discs. risk/actions: honor markdown indent nesting.
      const effectiveDepth = sectionKind === 'notes' ? 0 : depth;

      if (useOrdered) {
        appendActionTopItem(formatPlanListItem(content));
      } else {
        if (listMode === 'ol' || listMode === 'flow') closeList();
        const kv = matchBoldKvContent(content);
        // Nested plan lines also use detail style (no cards)
        if (kv && sectionKind === 'plan') {
          flushPlanOverview();
          planPhase = 'detail';
          if (listMode === 'ul') closeList();
          if (!planDetailOpen) {
            html += `<ul class="result-plan-details">`;
            planDetailOpen = true;
          }
          html += renderPlanDetailItemHtml(content);
        } else {
          appendUlItem(effectiveDepth, formatPlanListItem(content), false);
        }
      }
      continue;
    }

    // Single-line arrow flow: 采购 → 报关 → 履约
    if ((flowMode || sectionKind === 'flow') && /→|⟶|->|➜|➔/.test(line) && !/^#{1,4}\s+/.test(line)) {
      const parts = line
        .replace(/^[-*•]\s+/, '')
        .split(/\s*(?:→|⟶|->|➜|➔)\s*/)
        .map((s) =>
          s
            .replace(/^[\d]+[.)、．]\s*/, '')
            .replace(/^[\s"'“”「『]+/, '')
            .replace(/[\s"'“”」』]+$/, '')
            .trim()
        )
        .filter(Boolean);
      const isFieldTemplate =
        parts.filter((p) =>
          /^(供应商发票|店铺主体|出口方式|发货方式|平台|境外消费者)\b/.test(p)
        ).length >= 4;
      if (parts.length >= 2 && !isFieldTemplate) {
        closeList();
        html += renderArrowFlowHtml(parts);
        flowMode = false;
        continue;
      }
    }

    closeList();
    if (sectionKind === 'plan') flushPlanOverview();
    html += `<p class="result-paragraph">${formatInline(line)}</p>`;
  }

  closeList();
  resetPlanLayout();
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

const HS_HINT_DEFAULT_ZH = '完整税号精确匹配；不足10位时按前8位尝试。';
const HS_HINT_DEFAULT_EN = 'Exact match on full HS; if fewer than 10 digits, try first 8.';
const SPECIAL_GOODS_FLAG_HINT = {
  '1': {
    zh: '特殊商品标识：1（视同内销征税，进项可抵）',
    en: 'Special goods flag: 1 (taxed as deemed domestic sales; input VAT creditable)',
  },
  '2': {
    zh: '特殊商品标识：2（出口免税，进项转出）',
    en: 'Special goods flag: 2 (export VAT-exempt; input VAT transferred out)',
  },
};

function isHsLocaleEn() {
  return (window.DAOITH_getLocale?.() || 'zh') === 'en';
}

function defaultHsHintText() {
  return isHsLocaleEn() ? HS_HINT_DEFAULT_EN : HS_HINT_DEFAULT_ZH;
}

function isZeroExportRefund(result) {
  if (!result || result.rate == null) return false;
  const n = Number(result.rate);
  if (Number.isFinite(n)) return n === 0;
  return /^0(?:\.0+)?%?$/.test(String(result.display || result.rate).trim());
}

function specialGoodsFlagHintText(result) {
  const en = isHsLocaleEn();
  const raw = String(result?.special_goods_flag || '').trim();
  const mapped = SPECIAL_GOODS_FLAG_HINT[raw];
  if (mapped) return en ? mapped.en : mapped.zh;
  const label = String(result?.special_goods_flag_label || '').trim();
  if (label) {
    return en ? `Special goods flag: ${label}` : `特殊商品标识：${label}`;
  }
  return en
    ? 'Special goods flag: not listed; please verify in the STA rebate schedule.'
    : '特殊商品标识：未收录，请核对出口退税率文库';
}

function setHsHint(text, isFlag) {
  const el = document.getElementById('hsHint');
  if (!el) return;
  const t = String(text || '').trim();
  el.classList.toggle('is-flag', Boolean(isFlag));
  if (!t) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.hidden = false;
  el.textContent = t;
}

function resetHsHint() {
  setHsHint(defaultHsHintText(), false);
}

function extractHsProductName(result) {
  const direct = String(result?.product_name || '').trim();
  if (direct) return direct;
  const blob = [result?.snippet, result?.message].filter(Boolean).join('\n');
  const field =
    blob.match(/\*\*商品名称\*\*\s*[:：]\s*([^\n]+)/) ||
    blob.match(/商品名称\s*[:：]\s*([^\n]+)/);
  if (field) return field[1].replace(/\*+/g, '').trim();
  const qa = blob.match(/问：\s*\d{8,10}[、,，]\s*(.+?)\s*的出口退税率/);
  if (qa) return firstHsNameSegment(qa[1]);
  return '';
}

function firstHsNameSegment(text) {
  let depth = 0;
  let out = '';
  for (const ch of String(text || '')) {
    if ('(（'.includes(ch)) depth += 1;
    else if (')）'.includes(ch)) depth = Math.max(0, depth - 1);
    else if (depth === 0 && /[、,]/.test(ch)) break;
    out += ch;
  }
  return out.trim();
}

function setHsProductName(name) {
  const el = document.getElementById('hsProductName');
  if (!el) return;
  const text = String(name || '').trim();
  if (!text) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  const label = isHsLocaleEn() ? 'Product name' : '商品名称';
  el.hidden = false;
  el.textContent = `${label}：${text}`;
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
    resetHsHint();
    setHsProductName('');

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
        if (isZeroExportRefund(result)) {
          setHsHint(specialGoodsFlagHintText(result), true);
        } else {
          setHsHint('');
        }
        setHsProductName(extractHsProductName(result));
      } else {
        resetHsHint();
        setHsProductName('');
        alert('未查到参考退税率，请核对海关编码后重试');
      }
    } catch (err) {
      if (rateBox) rateBox.value = '';
      setHsRateSource('refund', null);
      resetHsHint();
      setHsProductName('');
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
    const supplierPointPct =
      parseFloat(document.getElementById('taxSupplierInvoicePoint')?.value) || 0;
    const vatLevyRate = 13; // 国内货物增值税征税率（简化）
    const rebateBenefitEl = document.getElementById('taxRebateBenefit');
    const burdenRateEl = document.getElementById('taxBurdenRate');
    const resultPanel = document.getElementById('taxResultPanel') || resultEl.parentElement;

    resultEl.textContent = window.DAOITH_t('tax.calcLoading');
    if (burdenRateEl) burdenRateEl.textContent = '—';
    if (rebateBenefitEl) rebateBenefitEl.textContent = '—';
    setButtonLoading(calcBtn, true, window.DAOITH_t('tax.calcLoading'));

    try {
      let note = document.getElementById('taxResultNote');
      if (!note) {
        note = document.createElement('div');
        note.id = 'taxResultNote';
        note.className = 'tax-result-note';
        resultPanel.appendChild(note);
      }
      const profitRate = 1
        - (productCostRate / 100)
        - (marketingRate / 100)
        - (shippingRate / 100)
        - (staffRate / 100)
        - (otherRate / 100);
      const zeroRebate = refundRate === 0;
      const smallScale = revenue > 0 && revenue < 500;
      // 退税率 0% 或不满足退免税：按视同内销（区分 500 万上下）
      const useDeemedDomestic = zeroRebate || !refundEligible;
      // 视同内销时：企业所得税/税负率用销售额 = 出口销售额/(1+征税率)
      // 销售额低于 500 万按 1%，否则按 13%
      const citVatRate = smallScale ? 0.01 : vatLevyRate / 100;
      const salesForCit = useDeemedDomestic ? revenue / (1 + citVatRate) : revenue;
      const incomeTax = Math.max(0, salesForCit * profitRate * (incomeRate / 100));
      const costBase = revenue * (productCostRate / 100);
      const supplierPoint = supplierPointPct / 100;
      // 满足退免税且退税率>0：出口退税 = (年出口销售额×产品成本率)×(1+供应商取票税点)×出口退税率/(1+13%)
      // 退税率 0% 或不满足退免税：视同内销增值税（销售额<500万按 1%，否则按 13%）
      const exportRebate =
        costBase * (1 + supplierPoint) * (refundRate / 100) / (1 + vatLevyRate / 100);
      const deemedDomesticVat = smallScale
        ? (revenue / (1 + 0.01)) * 0.01
        : (revenue / (1 + vatLevyRate / 100)) * (vatLevyRate / 100);
      const vatOrRebate = useDeemedDomestic ? deemedDomesticVat : exportRebate;
      const total = useDeemedDomestic
        ? incomeTax + deemedDomesticVat
        : incomeTax - exportRebate;

      // 出口退税收益（销售额低于 500 万时不计算）
      // (年出口销售额×产品成本率)×(1+供应商取票税点)×出口退税率/(1+13%)
      // − (年出口销售额×产品成本率)×供应商取票税点
      const rebateBenefit = smallScale
        ? null
        : costBase * (1 + supplierPoint) * (refundRate / 100) / (1 + vatLevyRate / 100) -
          costBase * supplierPoint;
      // 税负率：视同内销时 =（企业所得税 + 视同内销增值税）/（出口销售额/(1+征税率)）
      // 销售额低于 500 万按 1%，否则按 13%；其余 = 企业所得税 / 销售额
      const burdenSalesBase = useDeemedDomestic
        ? revenue / (1 + citVatRate)
        : salesForCit;
      const burdenNumerator = useDeemedDomestic
        ? incomeTax + deemedDomesticVat
        : incomeTax;
      const burdenRatePct =
        burdenSalesBase > 0 ? (burdenNumerator / burdenSalesBase) * 100 : null;

      const locale = window.DAOITH_getLocale?.() || 'zh';
      const burdenNum = smallScale ? '3' : '4';
      const copy = locale === 'en'
        ? {
            income: '1) Corporate income tax',
            incomeFormula: useDeemedDomestic
              ? smallScale
                ? '(Export sales ÷ (1 + 1%)) × (1 − product − marketing − shipping − staff − other) × CIT rate'
                : '(Export sales ÷ (1 + 13%)) × (1 − product − marketing − shipping − staff − other) × CIT rate'
              : 'Sales × (1 − product − marketing − shipping − staff − other) × CIT rate',
            vatYes: '2) Export rebate',
            vatYesFormula:
              '(Sales × product cost) × (1 + supplier invoice VAT point) × export rebate rate / (1 + 13%)',
            vatDeemed: '2) Deemed domestic-sales VAT',
            vatDeemedFormula: smallScale
              ? 'Export sales ÷ (1 + 1%) × 1% (annual sales under RMB 5m)'
              : 'Export sales ÷ (1 + 13%) × 13%',
            rebateBenefit: '3) Export rebate net benefit',
            rebateBenefitFormula:
              '(Sales × product cost) × (1 + supplier invoice VAT point) × export rebate rate / (1 + 13%) − (Sales × product cost) × supplier invoice VAT point',
            burdenRate: `${burdenNum}) Tax burden rate`,
            burdenRateFormula: useDeemedDomestic
              ? smallScale
                ? '(Corporate income tax + deemed domestic-sales VAT) ÷ (export sales ÷ (1 + 1%))'
                : '(Corporate income tax + deemed domestic-sales VAT) ÷ (export sales ÷ (1 + 13%))'
              : 'Corporate income tax ÷ sales',
            total: 'Net domestic tax burden',
            disclaimer: 'Note: this calculation is based on simplified assumptions and should not be used directly for business decisions. For a precise tax-burden analysis, please consult a tax expert.',
          }
        : {
            income: '1）企业所得税',
            incomeFormula: useDeemedDomestic
              ? smallScale
                ? '（出口销售额 /（1 + 1%））×（1 − 产品成本率 − 营销费率 − 运输费率 − 员工成本率 − 其他费用率）× 适用所得税税率'
                : '（出口销售额 /（1 + 13%））×（1 − 产品成本率 − 营销费率 − 运输费率 − 员工成本率 − 其他费用率）× 适用所得税税率'
              : '销售额 × (1 − 产品成本率 − 营销费率 − 运输费率 − 员工成本率 − 其他费用率) × 适用所得税税率',
            vatYes: '2）出口退税',
            vatYesFormula:
              '（年出口销售额 × 产品成本率）×（1 + 供应商取票税点）× 出口退税率 /（1 + 13%）',
            vatDeemed: '2）视同内销增值税',
            vatDeemedFormula: smallScale
              ? '出口销售额 /（1 + 1%）× 1%（年销售额低于 500 万）'
              : '出口销售额 /（1 + 13%）× 13%',
            rebateBenefit: '3）出口退税收益',
            rebateBenefitFormula:
              '（年出口销售额 × 产品成本率）×（1 + 供应商取票税点）× 出口退税率 /（1 + 13%）−（年出口销售额 × 产品成本率）× 供应商取票税点',
            burdenRate: `${burdenNum}）税负率`,
            burdenRateFormula: useDeemedDomestic
              ? smallScale
                ? '（企业所得税 + 视同内销增值税）÷（出口销售额 /（1 + 1%））'
                : '（企业所得税 + 视同内销增值税）÷（出口销售额 /（1 + 13%））'
              : '企业所得税 ÷ 销售额',
            total: '国内税负合计（净额）',
            disclaimer: '注意说明：以上计算基于一定的假设，不能直接作为企业决策依据，如需精准的税负分析，可咨询财税专家。',
          };
      const vatLabel = useDeemedDomestic ? copy.vatDeemed : copy.vatYes;
      const vatFormula = useDeemedDomestic ? copy.vatDeemedFormula : copy.vatYesFormula;

      resultEl.textContent = formatWan(total);
      if (burdenRateEl) {
        burdenRateEl.textContent =
          burdenRatePct == null ? '—' : `${burdenRatePct.toFixed(2)}%`;
      }
      const rebateBenefitMetric = rebateBenefitEl?.closest('.tax-result-metric');
      if (rebateBenefitMetric) rebateBenefitMetric.hidden = !!smallScale;
      if (rebateBenefitEl) {
        rebateBenefitEl.textContent =
          rebateBenefit == null ? '—' : formatWan(rebateBenefit);
      }
      const rebateBenefitSection = smallScale
        ? ''
        : `
          <div class="tax-breakdown-section">
            <div><strong>${copy.rebateBenefit}</strong>：${formatWan(rebateBenefit)}</div>
            <div class="tax-breakdown-formula">${copy.rebateBenefitFormula}</div>
          </div>`;
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
          ${rebateBenefitSection}
          <div class="tax-breakdown-section">
            <div><strong>${copy.burdenRate}</strong>：${
              burdenRatePct == null ? '—' : `${burdenRatePct.toFixed(2)}%`
            }</div>
            <div class="tax-breakdown-formula">${copy.burdenRateFormula}</div>
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

/* Service Hub */
const HUB_INQUIRY_LIMIT = 3;
const HUB_ORDER_LIMIT = 5;
const HUB_PROGRESS_LIMIT = 5;
const HUB_BANK = {
  account: '15001942878943',
  name: '道一天成企业管理（深圳）有限责任公司',
  branch: '平安银行深圳梅龙支行',
  cnaps: '307584021509',
};
const HUB_DISCOUNT_ZH = '1 个服务项目按原价\n2 个服务项目享 9.5 折\n3 个及以上服务项目享 9 折\n最终成交价以顾问确认为准。';
const HUB_DISCOUNT_EN = '1 service: list price\n2 services: 5% off\n3 or more: 10% off\nFinal amount is confirmed by the advisor.';

let hubQuotesCache = [];
let hubServicesCache = [];
let hubQuotesExpanded = false;
let hubOrdersExpanded = false;
let hubProgressExpanded = false;
let hubEventsBound = false;
const serviceProgressExpandedIds = new Set();

function hubT(zh, en) {
  return (window.DAOITH_getLocale?.() || 'zh') === 'en' ? en : zh;
}

function hubItemCount(items) {
  return (items || []).reduce((n, it) => n + (Number(it.qty) || 1), 0);
}

function hubDiscountRate(itemCount) {
  const n = Number(itemCount) || 0;
  if (n >= 3) return 0.9;
  if (n === 2) return 0.95;
  return 1;
}

function hubQuoteTotals(q) {
  const items = Array.isArray(q?.items) ? q.items : [];
  let standard = 0;
  items.forEach((it) => {
    standard += (Number(it.priceValue) || 0) * (Number(it.qty) || 1);
  });
  if (standard <= 0) standard = Number(q?.total) || 0;
  const rate = hubDiscountRate(hubItemCount(items));
  const quoted = q?.quotedTotal != null && q.quotedTotal !== ''
    ? Number(q.quotedTotal)
    : Math.round(standard * rate * 100) / 100;
  return { standard, quoted, rate, items };
}

function hubYymmdd(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d)) return '000000';
  return `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function hubTwoCharFromSeed(seed) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let h = 2166136261;
  const s = String(seed || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  return chars[h % 36] + chars[Math.floor(h / 36) % 36];
}

function hubParseInquiryCode(inquiryId, createdAt) {
  const id = String(inquiryId || '').trim().toUpperCase();
  if (/^INQ\d{6}[0-9A-Z]{2}$/.test(id) && id.length === 11) {
    return { date: id.slice(3, 9), seq: id.slice(9, 11), inquiryNo: id };
  }
  const date = hubYymmdd(createdAt);
  const seq = hubTwoCharFromSeed(id || date);
  return { date, seq, inquiryNo: `INQ${date}${seq}` };
}

function hubDisplayInquiryNo(inquiryId, createdAt) {
  return hubParseInquiryCode(inquiryId, createdAt).inquiryNo;
}

function hubOrderNo(inquiryId, createdAt) {
  const { date, seq } = hubParseInquiryCode(inquiryId, createdAt);
  return `SO${date}${seq}`;
}

function hubSubOrderNo(inquiryId, index, createdAt) {
  const { date, seq } = hubParseInquiryCode(inquiryId, createdAt);
  const letter = String.fromCharCode(65 + (Number(index) || 0) % 26);
  return `SO${date}${seq[0]}${letter}`;
}

function playHubJourney() {
  const root = document.getElementById('hubJourney');
  if (!root) return;
  const nodes = [...root.querySelectorAll('.process-card')];
  const lines = [...root.querySelectorAll('.process-arrow')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.remove('is-playing', 'is-done');
  nodes.forEach((n) => n.classList.remove('is-active', 'is-on'));
  lines.forEach((n) => n.classList.remove('is-on'));
  if (reduce) {
    root.classList.add('is-done');
    return;
  }
  root.classList.add('is-playing');
  nodes.forEach((node, i) => {
    setTimeout(() => {
      node.classList.add('is-on');
      if (i > 0) lines[i - 1]?.classList.add('is-on');
      if (i === nodes.length - 1) {
        setTimeout(() => root.classList.add('is-done'), 280);
      }
    }, 180 + i * 720);
  });
}

function initServiceHub() {
  async function refreshHubData() {
    const quotes = await loadQuotesForHub();
    hubQuotesCache = quotes;
    const services = await loadServiceProgressForHub();
    hubServicesCache = services;
    renderHubInquiries(quotes);
    renderHubOrders(quotes, services);
    renderServiceProgress(services, quotes);
    return quotes;
  }

  bindHubUi();
  refreshHubData();
  window.DAOITH_refreshHub = refreshHubData;
  window.DAOITH_playHubJourney = playHubJourney;
  window.addEventListener('daoith-auth-change', () => {
    refreshHubData();
  });
  if (document.body.dataset.activeView === 'hub') playHubJourney();
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
    quotedTotal: q.quotedTotal,
    standardTotal: q.standardTotal,
    items: q.items || [],
    status,
    statusHistory,
    createdAt,
    openid: q.websiteOpenid || null,
    hasPaymentSlip: !!q.hasPaymentSlip,
    paymentSlipName: q.paymentSlipName || '',
    paidAt: q.paidAt || '',
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
  if (isNaN(d)) return iso || '—';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateCompact(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso || '—';
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateDay(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso || '—';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateMd(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso || '—';
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hubDateCell(iso) {
  if (!iso) return '—';
  const full = formatDate(iso);
  return `<time datetime="${escapeHtmlHub(iso)}" title="${escapeHtmlHub(full)}">${escapeHtmlHub(formatDateCompact(iso))}</time>`;
}

function hubEmptyHtml(title, desc) {
  return `<div class="empty-state hub-empty"><h4>${title}</h4><p>${desc}</p></div>`;
}

function hubServiceChipsHtml(items) {
  const chips = (items || []).map((it) => {
    const title = it.title || it.name || it.id || '';
    const qty = Number(it.qty) || 1;
    const label = qty > 1 ? `${title} × ${qty}` : title;
    return label ? `<span class="hub-chip">${escapeHtmlHub(label)}</span>` : '';
  }).filter(Boolean);
  return chips.length ? `<div class="hub-chips">${chips.join('')}</div>` : '—';
}

function hubProgressPct(card) {
  const reported = Number(card?.progress);
  if (Number.isFinite(reported) && reported > 0) return Math.max(0, Math.min(100, Math.round(reported)));
  const tasks = Array.isArray(card?.tasks) ? card.tasks : [];
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => isTaskDoneHub(t.status)).length;
  return Math.round((done / tasks.length) * 100);
}

function quoteStatusLabel(status) {
  return status || '已提交';
}

function formatYuanHub(v) {
  if (typeof window.formatServicePrice === 'function') {
    return window.formatServicePrice(v);
  }
  return `¥${(Number(v) || 0).toLocaleString('zh-CN')}`;
}

function hubStatusClass(status) {
  const map = {
    '已提交': 'hub-status-submitted',
    '处理中': 'hub-status-processing',
    '已报价': 'hub-status-quoted',
    '已成交': 'hub-status-won',
    '已关闭': 'hub-status-closed',
  };
  return map[status] || 'hub-status-submitted';
}

function hubBankHtml() {
  return `
    <div><strong>${hubT('账号', 'Account')}</strong> ${escapeHtmlHub(HUB_BANK.account)}</div>
    <div><strong>${hubT('账户名称', 'Account name')}</strong> ${escapeHtmlHub(HUB_BANK.name)}</div>
    <div><strong>${hubT('归属网点', 'Branch')}</strong> ${escapeHtmlHub(HUB_BANK.branch)}</div>
    <div><strong>${hubT('归属行行号', 'CNAPS')}</strong> ${escapeHtmlHub(HUB_BANK.cnaps)}</div>`;
}

function hubMoreButton(kind, hiddenCount) {
  if (hiddenCount <= 0) return '';
  return `<div class="hub-more-wrap"><button type="button" class="hub-more-btn" data-hub-more="${kind}">${hubT(`展开其余 ${hiddenCount} 条`, `Show ${hiddenCount} more`)}</button></div>`;
}

function renderHubInquiries(quotes) {
  const wrap = document.getElementById('quotesListWrap');
  if (!wrap) return;
  const list = Array.isArray(quotes) ? quotes : getQuotes();
  if (!list.length) {
    wrap.innerHTML = hubEmptyHtml(
      hubT('暂无询价记录', 'No inquiries yet'),
      hubT('在购物车提交询价后，记录将显示在这里', 'Submitted inquiries will appear here.'),
    );
    return;
  }
  const visible = hubQuotesExpanded ? list : list.slice(0, HUB_INQUIRY_LIMIT);
  const discountTip = hubT(HUB_DISCOUNT_ZH, HUB_DISCOUNT_EN);
  const rows = visible.map((q) => {
    const totals = hubQuoteTotals(q);
    const status = quoteStatusLabel(q.status);
    const slipStatus = q.hasPaymentSlip
      ? hubT('已上传', 'Uploaded')
      : hubT('未上传', 'Not uploaded');
    const rateNote = totals.rate < 1
      ? ` <span class="hub-price-old">(${totals.rate === 0.9 ? '9' : '9.5'}${hubT('折', ' off')})</span>`
      : '';
    return `
      <tr data-inquiry-id="${escapeHtmlHub(q.inquiryId || '')}">
        <td class="hub-cell-id"><span class="hub-record-no">${escapeHtmlHub(hubDisplayInquiryNo(q.inquiryId, q.createdAt))}</span></td>
        <td>${hubDateCell(q.createdAt)}</td>
        <td class="hub-cell-wrap hub-td-services">${hubServiceChipsHtml(totals.items)}</td>
        <td class="hub-price-old hub-num">${escapeHtmlHub(formatYuanHub(totals.standard))}</td>
        <td class="hub-price-deal hub-num">${escapeHtmlHub(formatYuanHub(totals.quoted))}${rateNote}</td>
        <td class="hub-cell-wrap hub-td-slip">
          <div class="hub-slip">
            <span class="hub-slip-status">${escapeHtmlHub(slipStatus)}</span>
            <div class="hub-slip-btns">
              <button type="button" class="hub-link-btn" data-hub-upload="${escapeHtmlHub(q.inquiryId || '')}">${q.hasPaymentSlip ? hubT('重传', 'Re-upload') : hubT('上传', 'Upload')}</button>
              <button type="button" class="hub-link-btn" data-hub-bank aria-expanded="false">${hubT('查看账号', 'View account')}</button>
            </div>
          </div>
          <div class="hub-bank" hidden>${hubBankHtml()}</div>
        </td>
        <td>${q.paidAt ? hubDateCell(q.paidAt) : '—'}</td>
        <td><span class="hub-status ${hubStatusClass(status)}">${escapeHtmlHub(status)}</span></td>
      </tr>`;
  }).join('');
  wrap.innerHTML = `
    <div class="hub-table-scroll">
      <table class="hub-table hub-inquiries-table">
        <thead>
          <tr>
            <th>${hubT('询价单号', 'Inquiry no.')}</th>
            <th>${hubT('提交时间', 'Submitted')}</th>
            <th>${hubT('服务项目', 'Services')}</th>
            <th>${hubT('标准收费', 'List price')}</th>
            <th>
              ${hubT('优惠报价', 'Quote')}
              <span class="hub-help-wrap">
                <button type="button" class="hub-help" data-hub-help aria-expanded="false" aria-label="${hubT('优惠报价说明', 'Quote discount rules')}">?</button>
                <span class="hub-help-tip" hidden>${escapeHtmlHub(discountTip)}</span>
              </span>
            </th>
            <th>${hubT('支付水单', 'Payment slip')}</th>
            <th>${hubT('支付时间', 'Paid at')}</th>
            <th>${hubT('状态', 'Status')}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>` + (hubQuotesExpanded
    ? (list.length > HUB_INQUIRY_LIMIT
      ? `<div class="hub-more-wrap"><button type="button" class="hub-more-btn" data-hub-more="quotes-collapse">${hubT('收起', 'Show less')}</button></div>`
      : '')
    : hubMoreButton('quotes', Math.max(0, list.length - HUB_INQUIRY_LIMIT)));
}

function projectsByInquiry(services) {
  const map = new Map();
  (Array.isArray(services) ? services : []).forEach((s) => {
    map.set(s.inquiryId, s);
  });
  return map;
}

function hubLineQuoted(q, it) {
  const totals = hubQuoteTotals(q);
  const lineStd = (Number(it?.priceValue) || 0) * (Number(it?.qty) || 1);
  if (totals.standard <= 0) return totals.quoted;
  return Math.round((lineStd / totals.standard) * totals.quoted * 100) / 100;
}

function hubStep01Time(tasks) {
  const list = Array.isArray(tasks) ? tasks.slice() : [];
  list.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  const first = list[0];
  if (!first) return '';
  return first.plannedDueDate || first.actualCompletedAt || '';
}

function collectOrderRows(quotes, services) {
  const svcMap = projectsByInquiry(services);
  const rows = [];
  (Array.isArray(quotes) ? quotes : []).filter((q) => q.status === '已成交').forEach((q) => {
    const totals = hubQuoteTotals(q);
    const svc = svcMap.get(q.inquiryId);
    const projects = Array.isArray(svc?.projects) ? svc.projects : [];
    const items = totals.items.length ? totals.items : [{ title: hubT('成交服务', 'Service') }];
    items.forEach((it, i) => {
      const p = projects[i] || projects.find((x) => x.serviceType === it.title) || null;
      rows.push({
        inquiryId: q.inquiryId,
        createdAt: q.createdAt,
        subNo: hubSubOrderNo(q.inquiryId, i, q.createdAt),
        title: it.title || p?.serviceType || '—',
        step: hubFormatCurrentStep(p?.tasks),
        amount: hubLineQuoted(q, it),
        startAt: hubStep01Time(p?.tasks) || '',
        owner: p?.ownerName || '',
      });
    });
  });
  return rows;
}

function renderHubOrders(quotes, services) {
  const wrap = document.getElementById('hubOrdersWrap');
  if (!wrap) return;
  const list = collectOrderRows(quotes, services);
  if (!list.length) {
    wrap.innerHTML = hubEmptyHtml(
      hubT('暂无服务订单', 'No service orders'),
      hubT('询价成交并完成支付后，订单将显示在这里', 'Orders appear here after an inquiry is closed-won.'),
    );
    return;
  }
  const visible = hubOrdersExpanded ? list : list.slice(0, HUB_ORDER_LIMIT);
  const rows = visible.map((row) => `
      <tr>
        <td class="hub-cell-id"><span class="hub-record-no">${escapeHtmlHub(row.subNo)}</span></td>
        <td class="hub-cell-wrap hub-td-services">${escapeHtmlHub(row.title)}</td>
        <td class="hub-td-step">${escapeHtmlHub(row.step)}</td>
        <td class="hub-price-deal hub-num">${escapeHtmlHub(formatYuanHub(row.amount))}</td>
        <td>${row.startAt ? hubDateCell(row.startAt) : '—'}</td>
        <td>${escapeHtmlHub(row.owner || hubT('待分配', 'Unassigned'))}</td>
      </tr>`).join('');
  wrap.innerHTML = `
    <div class="hub-table-scroll">
      <table class="hub-table hub-orders-table">
        <thead>
          <tr>
            <th>${hubT('订单号', 'Order no.')}</th>
            <th>${hubT('服务项目', 'Service')}</th>
            <th>${hubT('最新进度', 'Latest step')}</th>
            <th>${hubT('订单金额', 'Amount')}</th>
            <th>${hubT('项目启动时间', 'Project start')}</th>
            <th>${hubT('项目负责人', 'Owner')}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>` + (hubOrdersExpanded
    ? (list.length > HUB_ORDER_LIMIT
      ? `<div class="hub-more-wrap"><button type="button" class="hub-more-btn" data-hub-more="orders-collapse">${hubT('收起', 'Show less')}</button></div>`
      : '')
    : hubMoreButton('orders', Math.max(0, list.length - HUB_ORDER_LIMIT)));
}

function isTaskDoneHub(status) {
  return status === 'COMPLETED' || status === 'NOT_APPLICABLE';
}

async function loadServiceProgressForHub() {
  const token = window.DAOITH_AUTH?.getToken?.();
  if (!token) return [];
  try {
    const res = await fetch(`${notifyApiBase()}/api/service-progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return Array.isArray(data.services) ? data.services : [];
  } catch {
    return [];
  }
}

function serviceProgressCurrentStep(tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  const active = list.find((t) => t.status === 'IN_PROGRESS' || t.status === 'OVERDUE')
    || list.find((t) => !isTaskDoneHub(t.status));
  if (active) return active.title || hubT('进行中', 'In progress');
  if (list.length && list.every((t) => isTaskDoneHub(t.status))) return hubT('全部完成', 'Completed');
  return hubT('待启动', 'Pending start');
}

function hubFormatCurrentStep(tasks) {
  const list = Array.isArray(tasks) ? tasks.slice() : [];
  list.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  const name = serviceProgressCurrentStep(list);
  if (!list.length) return `Step ${name}`;
  let idx = list.findIndex((t) => t.status === 'IN_PROGRESS' || t.status === 'OVERDUE');
  if (idx < 0) idx = list.findIndex((t) => !isTaskDoneHub(t.status));
  if (idx < 0) idx = list.length - 1;
  return `Step ${String(idx + 1).padStart(2, '0')} ${name}`;
}

function collectProgressCards(services, quotes) {
  const cards = [];
  const covered = new Set();
  (Array.isArray(services) ? services : []).forEach((s) => {
    (s.projects || []).forEach((p, i) => {
      covered.add(s.inquiryId);
      cards.push({
        id: String(p.id || `${s.inquiryId}:${i}`),
        inquiryId: s.inquiryId,
        company: s.company || '',
        title: p.serviceType || p.name || hubT('服务', 'Service'),
        orderNo: hubOrderNo(s.inquiryId, s.createdAt),
        subOrderNo: hubSubOrderNo(s.inquiryId, i, s.createdAt),
        progress: Number(p.progress) || 0,
        tasks: Array.isArray(p.tasks) ? p.tasks : [],
      });
    });
  });
  (Array.isArray(quotes) ? quotes : []).forEach((q) => {
    if (q.status !== '已成交' || covered.has(q.inquiryId)) return;
    (q.items || []).forEach((it, i) => {
      cards.push({
        id: `${q.inquiryId}:${i}`,
        inquiryId: q.inquiryId,
        company: q.company || '',
        title: it.title || hubT('服务', 'Service'),
        orderNo: hubOrderNo(q.inquiryId, q.createdAt),
        subOrderNo: hubSubOrderNo(q.inquiryId, i, q.createdAt),
        progress: 0,
        tasks: [],
      });
    });
  });
  return cards;
}

function renderServiceProgress(services, quotes) {
  const wrap = document.getElementById('quoteProgressWrap');
  if (!wrap) return;
  const projects = collectProgressCards(services, quotes);

  if (!projects.length) {
    wrap.innerHTML = hubEmptyHtml(
      hubT('暂无进行中的服务', 'No active services'),
      hubT('询价成交后，顾问会按服务流程在此更新进度', 'Progress updates appear here after purchase.'),
    );
    return;
  }

  const visible = hubProgressExpanded ? projects : projects.slice(0, HUB_PROGRESS_LIMIT);
  const rows = visible.map((p) => {
    const tasks = Array.isArray(p.tasks) ? p.tasks : [];
    const progress = hubProgressPct(p);
    const currentStep = hubFormatCurrentStep(tasks);
    const compact = tasks.length >= 6 || /合规代账/.test(String(p.title || ''));
    const plannedLabel = compact ? hubT('预', 'ETA') : hubT('预计完成', 'Est. complete');
    const actualLabel = compact ? hubT('实', 'Done') : hubT('实际完成', 'Actual complete');
    const fmtDate = compact ? formatDateMd : formatDateDay;
    const nodeTasks = tasks.slice().sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    const nodes = nodeTasks.length
      ? `<ol class="hub-nodes${compact ? ' is-compact' : ''}">${nodeTasks.map((t, i) => {
          const done = isTaskDoneHub(t.status);
          const current = t.status === 'IN_PROGRESS' || t.status === 'OVERDUE';
          const cls = [done ? 'is-done' : '', current ? 'is-current' : ''].filter(Boolean).join(' ');
          const planned = t.plannedDueDate ? fmtDate(t.plannedDueDate) : '—';
          const actual = t.actualCompletedAt ? fmtDate(t.actualCompletedAt) : '—';
          const stepNo = `Step ${String(i + 1).padStart(2, '0')}`;
          const name = t.title || hubT('节点', 'Step');
          return `<li class="hub-node ${cls}">
            <span class="hub-node-step">${escapeHtmlHub(stepNo)}</span>
            <span class="hub-node-title">${escapeHtmlHub(name)}</span>
            <span class="hub-node-time" title="${escapeHtmlHub(t.plannedDueDate ? formatDate(t.plannedDueDate) : '')}">${plannedLabel} ${escapeHtmlHub(planned)}</span>
            <span class="hub-node-time" title="${escapeHtmlHub(t.actualCompletedAt ? formatDate(t.actualCompletedAt) : '')}">${actualLabel} ${escapeHtmlHub(actual)}</span>
          </li>`;
        }).join('')}</ol>`
      : `<p class="hub-nodes-empty">${hubT('服务流程尚未启动', 'Workflow not started yet')}</p>`;
    const open = serviceProgressExpandedIds.has(String(p.id));
    return `
      <tr data-service-id="${escapeHtmlHub(String(p.id))}">
        <td class="hub-cell-id"><span class="hub-record-no">${escapeHtmlHub(p.subOrderNo || '—')}</span></td>
        <td class="hub-cell-wrap hub-td-services"><span class="hub-progress-title">${escapeHtmlHub(p.title || hubT('服务', 'Service'))}</span></td>
        <td class="hub-td-bar">
          <div class="hub-bar-wrap" title="${progress}%">
            <div class="hub-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><i style="width:${progress}%"></i></div>
            <span class="hub-bar-pct">${progress}%</span>
          </div>
        </td>
        <td class="hub-progress-step hub-td-step">${escapeHtmlHub(currentStep)}</td>
        <td>
          <button type="button" class="hub-link-btn hub-detail-btn" data-hub-progress-toggle aria-expanded="${open ? 'true' : 'false'}">${open ? hubT('收起', 'Hide') : hubT('点击查看详情', 'Click to view details')}</button>
        </td>
      </tr>
      <tr class="hub-progress-detail-row" data-hub-progress-detail ${open ? '' : 'hidden'}>
        <td colspan="5">${nodes}</td>
      </tr>`;
  }).join('');

  wrap.innerHTML = `
    <div class="hub-table-scroll">
      <table class="hub-table hub-progress-table">
        <thead>
          <tr>
            <th>${hubT('服务单号', 'Service no.')}</th>
            <th>${hubT('服务项目', 'Service')}</th>
            <th>${hubT('服务进度', 'Progress')}</th>
            <th>${hubT('当前进展', 'Current step')}</th>
            <th>${hubT('更多功能', 'More')}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>` + (hubProgressExpanded
    ? (projects.length > HUB_PROGRESS_LIMIT
      ? `<div class="hub-more-wrap"><button type="button" class="hub-more-btn" data-hub-more="progress-collapse">${hubT('收起', 'Show less')}</button></div>`
      : '')
    : hubMoreButton('progress', Math.max(0, projects.length - HUB_PROGRESS_LIMIT)));
}

function closeHubHelpTips(exceptWrap) {
  document.querySelectorAll('.hub-help-wrap').forEach((wrap) => {
    if (exceptWrap && wrap === exceptWrap) return;
    const tip = wrap.querySelector('.hub-help-tip');
    const btn = wrap.querySelector('.hub-help');
    if (tip) tip.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  });
}

function toDatetimeLocalValue(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function guessPaidAtFromName(name) {
  const m = String(name || '').match(/(20\d{2})[-_.]?(\d{2})[-_.]?(\d{2})(?:[-_.]?(\d{2})(\d{2}))?/);
  if (!m) return '';
  return toDatetimeLocalValue(`${m[1]}-${m[2]}-${m[3]}T${m[4] || '12'}:${m[5] || '00'}:00`);
}

function openHubSlipModal(inquiryId) {
  const modal = document.getElementById('hubSlipModal');
  if (!modal) return;
  document.getElementById('hubSlipInquiryId').value = inquiryId || '';
  document.getElementById('hubSlipFile').value = '';
  document.getElementById('hubSlipPaidAt').value = toDatetimeLocalValue();
  const err = document.getElementById('hubSlipError');
  if (err) {
    err.hidden = true;
    err.textContent = '';
  }
  modal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeHubSlipModal() {
  const modal = document.getElementById('hubSlipModal');
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

async function viewHubSlip(inquiryId) {
  const token = window.DAOITH_AUTH?.getToken?.();
  if (!token) {
    window.DAOITH_CART?.showToast?.(hubT('请先微信登录', 'Please sign in with WeChat first.'));
    return;
  }
  try {
    const res = await fetch(`${notifyApiBase()}/api/inquiry/slip?inquiryId=${encodeURIComponent(inquiryId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
  } catch (err) {
    window.DAOITH_CART?.showToast?.(hubT(`查看失败：${err.message || '网络错误'}`, `Could not open slip: ${err.message || 'network error'}`));
  }
}

async function submitHubSlip(e) {
  e.preventDefault();
  const inquiryId = document.getElementById('hubSlipInquiryId')?.value.trim() || '';
  const file = document.getElementById('hubSlipFile')?.files?.[0];
  const paidAt = document.getElementById('hubSlipPaidAt')?.value || '';
  const err = document.getElementById('hubSlipError');
  const submitBtn = document.getElementById('hubSlipSubmit');
  const showErr = (msg) => {
    if (!err) return;
    err.hidden = false;
    err.textContent = msg;
  };
  if (!inquiryId) {
    showErr(hubT('缺少询价单号', 'Missing inquiry number'));
    return;
  }
  if (!file) {
    showErr(hubT('请选择银行水单文件', 'Please choose a payment slip file'));
    return;
  }
  if (!paidAt) {
    showErr(hubT('请填写水单上的支付时间', 'Please enter the payment time on the slip'));
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    showErr(hubT('文件不能超过 8MB', 'File must be 8MB or smaller'));
    return;
  }
  const token = window.DAOITH_AUTH?.getToken?.();
  if (!token) {
    showErr(hubT('请先微信登录', 'Please sign in with WeChat first.'));
    return;
  }
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = hubT('上传中…', 'Uploading…');
  }
  try {
    const content = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(file);
    });
    const res = await fetch(`${notifyApiBase()}/api/inquiry/slip`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inquiryId,
        filename: file.name,
        mimeType: file.type,
        content,
        paidAt: new Date(paidAt).toISOString(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    closeHubSlipModal();
    window.DAOITH_CART?.showToast?.(hubT('水单已上传', 'Payment slip uploaded'));
    if (typeof window.DAOITH_refreshHub === 'function') window.DAOITH_refreshHub();
  } catch (uploadErr) {
    showErr(hubT(`上传失败：${uploadErr.message || '网络错误'}`, `Upload failed: ${uploadErr.message || 'network error'}`));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = hubT('上传', 'Upload');
    }
  }
}

function bindHubUi() {
  if (hubEventsBound) return;
  hubEventsBound = true;
  const root = document.getElementById('hub');
  if (!root) return;

  root.addEventListener('click', (e) => {
    const scrollHint = e.target.closest('[data-hub-scroll]');
    if (scrollHint) {
      e.preventDefault();
      const target = document.getElementById(scrollHint.getAttribute('data-hub-scroll') || '');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const helpBtn = e.target.closest('[data-hub-help]');
    if (helpBtn) {
      const wrap = helpBtn.closest('.hub-help-wrap');
      const tip = wrap?.querySelector('.hub-help-tip');
      const willOpen = !!tip?.hidden;
      closeHubHelpTips(wrap);
      if (tip) tip.hidden = !willOpen;
      helpBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      e.stopPropagation();
      return;
    }

    const bankBtn = e.target.closest('[data-hub-bank]');
    if (bankBtn) {
      const box = bankBtn.closest('td')?.querySelector('.hub-bank')
        || bankBtn.parentElement?.querySelector('.hub-bank');
      if (box) {
        const open = box.hidden;
        box.hidden = !open;
        bankBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      return;
    }

    const uploadBtn = e.target.closest('[data-hub-upload]');
    if (uploadBtn) {
      openHubSlipModal(uploadBtn.getAttribute('data-hub-upload') || '');
      return;
    }

    const moreBtn = e.target.closest('[data-hub-more]');
    if (moreBtn) {
      const kind = moreBtn.getAttribute('data-hub-more');
      if (kind === 'quotes') hubQuotesExpanded = true;
      if (kind === 'quotes-collapse') hubQuotesExpanded = false;
      if (kind === 'orders') hubOrdersExpanded = true;
      if (kind === 'orders-collapse') hubOrdersExpanded = false;
      if (kind === 'progress') hubProgressExpanded = true;
      if (kind === 'progress-collapse') hubProgressExpanded = false;
      renderHubInquiries(hubQuotesCache);
      renderHubOrders(hubQuotesCache, hubServicesCache);
      renderServiceProgress(hubServicesCache, hubQuotesCache);
      return;
    }

    const progressBtn = e.target.closest('[data-hub-progress-toggle]');
    if (progressBtn) {
      const row = progressBtn.closest('tr');
      const detail = row?.nextElementSibling;
      if (!row || !detail?.hasAttribute('data-hub-progress-detail')) return;
      const id = row.getAttribute('data-service-id') || '';
      const willOpen = detail.hidden;
      detail.hidden = !willOpen;
      progressBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      progressBtn.textContent = willOpen ? hubT('收起', 'Hide') : hubT('点击查看详情', 'Click to view details');
      if (id) {
        if (willOpen) serviceProgressExpandedIds.add(id);
        else serviceProgressExpandedIds.delete(id);
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.hub-help-wrap')) closeHubHelpTips();
  });

  document.querySelectorAll('[data-close-hub-slip]').forEach((el) => {
    el.addEventListener('click', closeHubSlipModal);
  });
  document.getElementById('hubSlipForm')?.addEventListener('submit', submitHubSlip);
  document.getElementById('hubSlipFile')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    const paidInput = document.getElementById('hubSlipPaidAt');
    if (!file || !paidInput || paidInput.value) return;
    const guessed = guessPaidAtFromName(file.name);
    if (guessed) paidInput.value = guessed;
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeHubSlipModal();
  });
}

function escapeHtmlHub(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* WeChat Toggle */
function notifyApiBase() {
  const cfg = window.DAOITH_CONFIG || {};
  return (cfg.notifyApiBase || 'https://api.daoith.com').replace(/\/$/, '');
}

function wechatToggles() {
  return Array.from(document.querySelectorAll('.wechat-toggle'));
}

function setWechatToggleUi(on) {
  wechatToggles().forEach((toggle) => {
    toggle.classList.toggle('active', !!on);
    toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function setWechatTogglesDisabled(disabled) {
  wechatToggles().forEach((toggle) => {
    toggle.disabled = !!disabled;
  });
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
  const toggles = wechatToggles();
  if (!toggles.length) return;
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

  async function onToggleClick() {
    if (busy) return;
    if (!window.DAOITH_AUTH?.requireLogin?.('wechat_notify', window.location.href.split('#')[0] + '#hub')) {
      return;
    }

    const turningOn = !toggles.some((t) => t.classList.contains('active'));
    busy = true;
    setWechatTogglesDisabled(true);
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
      setWechatTogglesDisabled(false);
    }
  }

  toggles.forEach((toggle) => toggle.addEventListener('click', onToggleClick));
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
