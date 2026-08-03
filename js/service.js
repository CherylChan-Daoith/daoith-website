(function initServicePage() {
  if (window.DAOITH_initI18n) window.DAOITH_initI18n();

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setMetaDescription(text) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = text;
  }

  function getEnService(id) {
    const list = window.DAOITH_I18N_EN?.servicesCatalog || [];
    return list.find((s) => s.id === id) || null;
  }

  function renderBlocks(details) {
    return (details || []).map((block) => {
      if (block.type === 'h2') {
        return `<h2 class="article-view-h2">${escapeHtml(block.text)}</h2>`;
      }
      if (block.type === 'ul' && Array.isArray(block.items)) {
        return `<ul class="service-detail-list">${block.items
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ul>`;
      }
      if (block.type === 'ol' && Array.isArray(block.items)) {
        return `<ol class="service-detail-list service-detail-list-ordered">${block.items
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ol>`;
      }
      if (block.type === 'faq' && Array.isArray(block.items)) {
        return `<div class="service-detail-faq">${block.items
          .map(
            (item) => `
          <details class="service-faq-item">
            <summary>${escapeHtml(item.q || '')}</summary>
            <p>${escapeHtml(item.a || '')}</p>
          </details>`
          )
          .join('')}</div>`;
      }
      return `<p class="article-view-p">${escapeHtml(block.text || '')}</p>`;
    }).join('');
  }

  function render() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const viewEl = document.getElementById('serviceView');
    const loadingEl = document.getElementById('serviceLoading');
    const notFoundEl = document.getElementById('serviceNotFound');
    const locale = window.DAOITH_getLocale?.() || 'zh';

    function showNotFound() {
      if (loadingEl) loadingEl.remove();
      if (viewEl) viewEl.classList.add('is-hidden');
      if (notFoundEl) notFoundEl.classList.remove('is-hidden');
      document.title = `${locale === 'en' ? 'Service not found' : '服务未找到'} — DAOITH`;
    }

    if (!id || typeof window.getServiceById !== 'function') {
      showNotFound();
      return;
    }

    const service = window.getServiceById(id);
    if (!service) {
      showNotFound();
      return;
    }

    const en = getEnService(id);
    const title = locale === 'en' && en?.title ? en.title : service.title;
    const desc = locale === 'en' && en?.desc ? en.desc : service.desc;
    const unit = locale === 'en' && en?.unit ? en.unit : service.unit;
    const detailBtn = locale === 'en' ? 'Add to inquiry list' : '加入询价单';
    const backLabel = locale === 'en' ? '← Back to marketplace' : '← 返回财税服务市场';
    const details = (locale === 'en' && en?.details?.length) ? en.details : service.details;

    document.title = `${title} — ${locale === 'en' ? 'DAOITH Consulting' : '道一跨境咨询'}`;
    setMetaDescription(desc);

    const backLink = document.querySelector('[data-i18n-service-back]');
    if (backLink) backLink.textContent = backLabel;

    if (loadingEl) loadingEl.remove();

    viewEl.innerHTML = `
      <header class="article-view-header">
        <span class="article-view-tag">${locale === 'en' ? 'Service detail' : '服务详情'}</span>
        <h1 class="article-view-title">${escapeHtml(title)}</h1>
        <p class="article-view-lead">${escapeHtml(desc)}</p>
        <div class="service-detail-price">
          ${escapeHtml(service.priceLabel)} <span>${escapeHtml(unit)}</span>
        </div>
      </header>
      <div class="article-view-body">${renderBlocks(details)}</div>
      <footer class="article-view-footer service-detail-actions">
        <a href="/#services" class="btn btn-outline btn-sm">${backLabel.replace(/^←\s*/, '')}</a>
        <button type="button" class="btn btn-primary btn-sm" data-action="add" data-service-id="${escapeHtml(service.id)}">${detailBtn}</button>
      </footer>
    `;

    window.DAOITH_CART?.bindAddButtons(viewEl);
    window.DAOITH_CART?.updateCartBadge();
  }

  render();
  window.addEventListener('localechange', render);
})();
