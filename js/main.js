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
  initAiChatbot();
  initTaxCalculator();
  initServicesMarketplace();
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

  // Initial view from URL hash
  showView(location.hash.slice(1) || 'hero', { updateHash: false });

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
          : (data.hint || '列表已同步公众号文章。')
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
  let t = String(text || '');

  // Build tag names at runtime so tooling cannot rewrite DeepSeek's "think" token
  const think = String.fromCharCode(116, 104, 105, 110, 107); // think
  const tagNames = [think, 'thinking', 'reason', 'reasoning', 'redacted_reasoning'];
  for (const name of tagNames) {
    t = t.replace(new RegExp(`<\\s*${name}\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*${name}\\s*>`, 'gi'), '');
    t = t.replace(new RegExp(`<\\s*\\/?\\s*${name}\\b[^>]*>`, 'gi'), '');
  }

  // Drop leading CoT if it ends with a short final refusal / conclusion
  if (
    /我们被要求回答|根据上下文|按照回答要求|必须严格按|所以回答[:：]/.test(t) &&
    /关于该问题，我目前的知识库尚未收录|建议查阅官方/.test(t)
  ) {
    const m = t.match(/关于该问题，我目前的知识库尚未收录[\s\S]*$/);
    if (m) t = m[0];
  }

  // Generic: remove a long Chinese reasoning preamble before the last short paragraph
  if (t.length > 280 && /我们被要求回答|根据上下文|所以回答[:：]|核心答案如下/.test(t)) {
    const parts = t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && parts[parts.length - 1].length < 220) {
      t = parts[parts.length - 1];
    }
  }

  t = t.replace(/^\s*thinking[:：].*$/gim, '');
  return t.replace(/\n{3,}/g, '\n\n').trim();
}

function isKnowledgeMissRefusal(text) {
  const t = String(text || '');
  return /知识库尚未收录|目前的知识库尚未|未在知识库|建议查阅官方税务局/.test(t);
}

function buildLocalChatReply(message, ctx) {
  const q = String(message || '').trim();

  // Product → HS classification (common references; final check with Customs)
  if (/海关编码|HS\s*编码|税号|归类/.test(q) || (/编码/.test(q) && /(手机|电脑|耳机|服装|玩具)/.test(q))) {
    if (/手机|智能手机|iPhone|安卓/.test(q)) {
      return '常见参考：智能手机多归入海关编码 8517.13（中国税则常见 85171300）。具体型号、是否带通信功能、是否成套等会影响归类，正式报关请以海关归类决定/预裁定为准。也可用左侧「HS 查询」核对退税率。';
    }
    if (/笔记本|电脑|平板/.test(q)) {
      return '常见参考：便携式自动数据处理设备（笔记本等）多归入 8471.30。正式报关请以海关归类决定为准，可用左侧「HS 查询」核对退税率。';
    }
    return '海关编码（HS）需按商品材质、功能、用途做归类。可在左侧填写大致编码后用「查询出口退税率」核对；拿不准时建议预约专家1v1或申请海关预裁定。';
  }

  if (!ctx?.platform) {
    return '我可以回答海关编码、出口方式、退税与税负等实务问题。若要结合您的店铺情况，请先在左侧填写业务信息并生成方案；复杂事项可预约专家1v1。';
  }
  if (/铝/.test(q) && /退税/.test(q) && /取消|停止|取消退税/.test(q)) {
    return '根据财政部、税务总局调整出口退税政策的相关公告，铝材等产品取消出口退税，政策自2024年12月1日起实施（以公告原文及附件产品清单为准）。建议核对附件清单是否覆盖您的具体税号，并以税局/海关最新公告终核。';
  }
  if (/退税|出口退税/.test(q)) {
    return `结合您的出口方式「${ctx.exportModeLabel}」与发票情况「${ctx.invoiceLabel}」，退税关键是票货款一致与监管方式匹配。可先用「查询出口退税率」核对 HS「${ctx.hsCode}」，再按方案行动建议补齐单证。`;
  }
  if (/关税|VAT|销售税|税负/.test(q)) {
    return `针对目的国「${ctx.countryLabel}」、发货模式「${ctx.shippingLabel}」，请重点看方案中的税负影响分析，并用下方税负计算器粗算。关税请参考该国海关官方税则对 HS「${ctx.hsCode}」终核。`;
  }
  if (/9610|9810|9710|0110|出口方式/.test(q)) {
    return `您当前选择的出口方式是「${ctx.exportModeLabel}」。不同监管方式的报关、清单与退税路径不同，详情见方案业务流程图与行动建议。`;
  }
  return `已结合您的业务背景（${ctx.platformLabel} / ${ctx.entityLabel} / ${ctx.countryLabel} / ${ctx.exportModeLabel}）理解您的问题。更复杂的落地路径建议点击「专家1v1」加入询价单，由顾问结合账套与单证给出定制方案。`;
}

function initAiChatbot() {
  const root = document.getElementById('aiChatbot');
  const fab = document.getElementById('aiChatbotFab');
  const panel = document.getElementById('aiChatbotPanel');
  const closeBtn = document.getElementById('aiChatbotClose');
  const form = document.getElementById('aiChatbotForm');
  const input = document.getElementById('aiChatbotInput');
  const messages = document.getElementById('aiChatbotMessages');
  if (!root || !fab || !panel || !form || !input || !messages) return;

  let conversationId = '';
  let busy = false;

  const appendBubble = (text, who) => {
    const div = document.createElement('div');
    div.className = `ai-chatbot-bubble ${who === 'user' ? 'is-user' : 'is-bot'}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  };

  const openChat = () => {
    root.dataset.state = 'open';
    panel.hidden = false;
    if (!messages.childElementCount) {
      appendBubble(
        '您好，我是道一合规助手。可就左侧方案中的出口方式、税负与行动建议继续提问；复杂事项建议预约专家1v1。',
        'bot'
      );
    }
    input.focus();
  };

  const closeChat = () => {
    root.dataset.state = 'collapsed';
    panel.hidden = true;
  };

  fab.addEventListener('click', openChat);
  closeBtn?.addEventListener('click', closeChat);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = '';
    appendBubble(text, 'user');
    busy = true;

    const typing = document.createElement('div');
    typing.className = 'ai-chatbot-bubble is-bot';
    typing.textContent = '正在思考…';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    const ctx = window.__daoithLastPlanCtx || null;
    const contextBlock = [
      '【回答规范】你是道一跨境电商财税合规助手。直接给出最终中文答案，禁止输出思考过程或推理草稿。',
      '可回答海关编码归类参考、出口监管方式、退税与目的国税负等实务问题；不确定时说明需官方终核，不要仅以「知识库未收录」结束。',
      '【出口退税硬规则】必须使用知识库字段「出口退税率」。严禁把「增值税税率」当成出口退税率。贵金属首饰（如镶钻银饰/金饰，税号71章）常见增值税13%、出口退税0%，二者不同。若知识库写出口退税率0%，必须答0%，不得改答13%。',
      ctx
        ? `客户业务背景：平台${ctx.platformLabel}，主体${ctx.entityLabel}，目的国${ctx.countryLabel}，HS${ctx.hsCode}，出口方式${ctx.exportModeLabel}，发货模式${ctx.shippingLabel}。`
        : '',
      `用户问题：${text}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const { difyChatEndpoint } = getDifyConfig();
      const result = await callDify({
        endpoint: difyChatEndpoint || '/v1/chatbot/chat-messages',
        query: contextBlock,
        inputs: { task: 'compliance_chat' },
        conversationId,
        returnMeta: true,
      });
      conversationId = result.conversationId || conversationId;
      let answer = sanitizeAiAnswer(result.text);
      if (!answer || isAskAgainOrGenericFramework(answer) || isKnowledgeMissRefusal(answer)) {
        answer = buildLocalChatReply(text, ctx);
      }
      typing.textContent = answer;
    } catch {
      typing.textContent = buildLocalChatReply(text, ctx);
    } finally {
      busy = false;
      messages.scrollTop = messages.scrollHeight;
    }
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
    difyChatEndpoint: '/v1/chatbot/chat-messages',
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

async function callDify({ endpoint, inputs, query, conversationId, returnMeta }) {
  const cfg = getDifyConfig();
  const path = endpoint || cfg.difyEndpoint || '/v1/chat-messages';
  const url = `${cfg.difyApiBase}${path}`;

  const payload = {
    inputs: inputs || {},
    query,
    response_mode: 'blocking',
    user: getDifyUserId(),
  };
  if (conversationId) payload.conversation_id = conversationId;

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

  if (returnMeta) {
    return {
      text,
      conversationId: data.conversation_id || conversationId || '',
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
  bonded_1210: '1210保税出口',
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
    entityLabel: entity ? (entityNames[entity] || entity) : '',
    countryLabel: country ? (countryNames[country] || country) : '',
    shippingLabel: shippingModes[shipping] || shipping,
    exportModeLabel: exportMode ? (exportModeNames[exportMode] || exportMode) : '',
    revenueLabel: revenueNames[document.getElementById('revenue').value] || '',
    teamSizeLabel: teamSizeNames[document.getElementById('teamSize').value] || '',
    invoiceLabel: invoiceNames[document.getElementById('invoice').value] || '',
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
      window.__daoithLastPlanCtx = ctx;
      renderPlanFaqs(ctx);
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
    namerica: 'North America',
    samerica: 'South America',
    africa: 'Africa',
    oceania: 'Oceania',
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
    } catch {
      setWechatToggleUi(false);
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
