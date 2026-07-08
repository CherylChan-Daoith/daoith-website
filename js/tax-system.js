(function initTaxSystemPage() {
  if (window.DAOITH_initI18n) window.DAOITH_initI18n();

  function renderTaxSystem() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const viewEl = document.getElementById('taxSystemView');
    const loadingEl = document.getElementById('taxSystemLoading');
    const notFoundEl = document.getElementById('taxSystemNotFound');
    const source = window.DAOITH_TAX_SOURCE || {};
    const locale = window.DAOITH_getLocale?.() || 'zh';

    if (!id || typeof window.getTaxSystemById !== 'function') {
      showNotFound();
      return;
    }

    const country = window.getTaxSystemById(id);
    if (!country) {
      showNotFound();
      return;
    }

    const name = locale === 'en' ? (country.nameEn || country.name) : country.name;
    const summary = locale === 'en'
      ? (window.DAOITH_I18N_EN?.taxSummaries?.[country.id] || country.summary)
      : country.summary;
    const tradeUnit = locale === 'en' ? 'USD bn' : country.tradeUnit;
    const tradeSource = locale === 'en' ? 'GACC Jan–Dec 2025' : country.tradeSource;
    const rankLabel = locale === 'en'
      ? `Trade partner #${country.rank} · ${country.trade2025} ${tradeUnit}`
      : `贸易伙伴第 ${country.rank} 位 · ${country.trade2025} ${tradeUnit}`;

    document.title = `${name} — ${locale === 'en' ? 'DAOITH Consulting' : '道一跨境咨询'}`;
    setMetaDescription(summary);

    if (loadingEl) loadingEl.remove();

    const taxRows = (country.taxes || []).map((t) => `
      <tr>
        <th scope="row">${escapeHtml(locale === 'en' ? (t.labelEn || t.label) : t.label)}</th>
        <td>${escapeHtml(t.value)}</td>
      </tr>
    `).join('');

    const tips = (country.tips || []).map((tip) => `<li>${escapeHtml(tip)}</li>`).join('');

    const sections = (country.sections || []).map((block) => {
      if (block.type === 'h2') {
        return `<h2 class="article-view-h2">${escapeHtml(block.text)}</h2>`;
      }
      return `<p class="article-view-p">${escapeHtml(block.text)}</p>`;
    }).join('');

    const sectionTitles = locale === 'en'
      ? { taxes: 'Key taxes', treaty: 'Bilateral tax arrangements', tips: 'Cross-border compliance tips', source: 'Authoritative source' }
      : { taxes: '主要税种一览', treaty: '双边税收安排要点', tips: '跨境合规提示', source: '权威来源' };

    viewEl.innerHTML = `
      <header class="article-view-header">
        <div class="tax-system-view-badge">${escapeHtml(rankLabel)}</div>
        <h1 class="article-view-title">${country.flag} ${escapeHtml(name)}${locale !== 'en' && country.nameEn ? ` <span class="tax-system-name-en">${escapeHtml(country.nameEn)}</span>` : ''}</h1>
        <div class="article-view-meta">
          <span>${window.DAOITH_t('tax.tradeMeta')}：${escapeHtml(tradeSource)}</span>
          <span class="article-view-tag">${window.DAOITH_t('tax.tag')}</span>
        </div>
        <p class="article-view-lead">${escapeHtml(summary)}</p>
      </header>
      <div class="article-view-body">
        <h2 class="article-view-h2">${sectionTitles.taxes}</h2>
        <table class="tax-system-table"><tbody>${taxRows}</tbody></table>
        ${sections}
        <h2 class="article-view-h2">${sectionTitles.treaty}</h2>
        <p class="article-view-p">${escapeHtml(country.treaty)}</p>
        ${tips ? `<h2 class="article-view-h2">${sectionTitles.tips}</h2><ul class="tax-system-tips">${tips}</ul>` : ''}
        <div class="tax-system-source">
          <p><strong>${sectionTitles.source}：</strong>${escapeHtml(source.name || '')}</p>
          <p>${escapeHtml(source.note || '')}</p>
          ${source.url ? `<a href="${escapeHtml(source.url)}" class="tax-system-source-link" target="_blank" rel="noopener noreferrer">${locale === 'en' ? 'View official SAT guides →' : '前往税路通专栏查阅官方指南 →'}</a>` : ''}
        </div>
      </div>
      <footer class="article-view-footer">
        <a href="/#tax-systems" class="btn btn-outline btn-sm">${window.DAOITH_t('tax.back')}</a>
        <a href="/#ai-solution" class="btn btn-primary btn-sm">${window.DAOITH_t('tax.ctaPlan')}</a>
      </footer>
    `;

    function showNotFound() {
      if (loadingEl) loadingEl.remove();
      if (viewEl) viewEl.classList.add('is-hidden');
      if (notFoundEl) notFoundEl.classList.remove('is-hidden');
      document.title = `${window.DAOITH_t('tax.notFoundTitle')} — DAOITH`;
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

  renderTaxSystem();
  window.addEventListener('localechange', renderTaxSystem);
})();
