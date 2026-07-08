(function initArticlePage() {
  if (window.DAOITH_initI18n) window.DAOITH_initI18n();

  function renderArticle() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const viewEl = document.getElementById('articleView');
    const loadingEl = document.getElementById('articleLoading');
    const notFoundEl = document.getElementById('articleNotFound');
    const locale = window.DAOITH_getLocale?.() || 'zh';
    const enMap = window.DAOITH_I18N_EN?.articleTexts || {};

    if (!id || typeof window.getArticleById !== 'function') {
      showNotFound();
      return;
    }

    const article = window.getArticleById(id);
    if (!article) {
      showNotFound();
      return;
    }

    const en = enMap[id];
    const title = locale === 'en' && en?.title ? en.title : article.title;
    const excerpt = locale === 'en' && en?.excerpt ? en.excerpt : article.excerpt;

    document.title = `${title} — ${locale === 'en' ? 'DAOITH Consulting' : '道一跨境咨询'}`;
    setMetaDescription(excerpt);

    if (loadingEl) loadingEl.remove();

    const sections = (article.sections || []).map((block) => {
      if (block.type === 'h2') {
        return `<h2 class="article-view-h2">${escapeHtml(block.text)}</h2>`;
      }
      return `<p class="article-view-p">${escapeHtml(block.text)}</p>`;
    }).join('');

    viewEl.innerHTML = `
      <header class="article-view-header">
        <time class="article-view-date" datetime="${article.date}">${article.date}</time>
        <h1 class="article-view-title">${escapeHtml(title)}</h1>
        <div class="article-view-meta">
          <span class="article-view-author">${escapeHtml(article.author)}</span>
          <span class="article-view-tag">${window.DAOITH_t('article.tag')}</span>
        </div>
        <p class="article-view-lead">${escapeHtml(excerpt)}</p>
      </header>
      <div class="article-view-body">${sections}</div>
      <footer class="article-view-footer">
        <a href="/#policy-expert" class="btn btn-outline btn-sm">${window.DAOITH_t('article.back')}</a>
        <a href="/#ai-solution" class="btn btn-primary btn-sm">${window.DAOITH_t('article.ctaPlan')}</a>
      </footer>
    `;

    function showNotFound() {
      if (loadingEl) loadingEl.remove();
      if (viewEl) viewEl.classList.add('is-hidden');
      if (notFoundEl) notFoundEl.classList.remove('is-hidden');
      document.title = `${window.DAOITH_t('article.notFoundTitle')} — DAOITH`;
    }
  }

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

  renderArticle();
  window.addEventListener('localechange', renderArticle);
})();
