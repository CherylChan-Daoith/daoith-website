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

  function formatCell(cell) {
    if (cell == null) return '';
    if (Array.isArray(cell)) {
      return `<ul class="svc-cell-list">${cell
        .map((item) => {
          if (typeof item === 'string') {
            return `<li class="is-plain"><span>${escapeHtml(item)}</span></li>`;
          }
          const mark = item?.mark;
          const cls = mark === 'ok' ? 'is-ok' : mark === 'no' ? 'is-no' : 'is-plain';
          const icon = mark === 'ok' ? '✓' : mark === 'no' ? '✗' : '';
          const text = escapeHtml(item?.text ?? '');
          return `<li class="${cls}">${
            icon ? `<span class="svc-mark" aria-hidden="true">${icon}</span>` : ''
          }<span>${text}</span></li>`;
        })
        .join('')}</ul>`;
    }
    return escapeHtml(String(cell)).replace(/\n/g, '<br>');
  }

  function renderTable(block) {
    const headers = Array.isArray(block.headers) ? block.headers : [];
    const rows = Array.isArray(block.rows) ? block.rows : [];
    const variant = block.variant ? ` service-detail-table--${escapeHtml(block.variant)}` : '';
    const caption = block.caption ? `<caption>${escapeHtml(block.caption)}</caption>` : '';
    let colgroup = '';
    if (block.variant === 'compare' && headers.length >= 4) {
      colgroup =
        '<colgroup><col class="compare-col-item"><col class="compare-col-managed"><col class="compare-col-traditional"><col class="compare-col-value"></colgroup>';
    }
    const thead = headers.length
      ? `<thead><tr>${headers.map((h) => `<th scope="col">${escapeHtml(h)}</th>`).join('')}</tr></thead>`
      : '';
    const tbody = `<tbody>${rows
      .map(
        (row) =>
          `<tr>${(row || [])
            .map((cell, i) => {
              const tag = i === 0 && block.firstColHeader ? 'th' : 'td';
              const scope = tag === 'th' ? ' scope="row"' : '';
              const colClass = i > 0 ? ` class="col-${i + 1}"` : '';
              return `<${tag}${scope}${colClass}>${formatCell(cell)}</${tag}>`;
            })
            .join('')}</tr>`
      )
      .join('')}</tbody>`;
    return `<div class="service-table-wrap${
      block.variant ? ` service-table-wrap--${escapeHtml(block.variant)}` : ''
    }"><table class="service-detail-table${variant}">${caption}${colgroup}${thead}${tbody}</table></div>`;
  }

  function renderTimeline(block) {
    const steps = Array.isArray(block.steps) ? block.steps : [];
    return `<ol class="service-timeline" style="--timeline-count:${steps.length}">${steps
      .map(
        (step, i) => `
      <li class="service-timeline-step">
        <div class="service-timeline-marker" aria-hidden="true">
          <span class="service-timeline-num">${String(i + 1).padStart(2, '0')}</span>
        </div>
        <div class="service-timeline-body">
          <h3 class="service-timeline-title">${escapeHtml(step.title || '')}</h3>
          ${step.time ? `<p class="service-timeline-time">${escapeHtml(step.time)}</p>` : ''}
          ${step.desc ? `<p class="service-timeline-desc">${escapeHtml(step.desc)}</p>` : ''}
        </div>
      </li>`
      )
      .join('')}</ol>`;
  }

  /** Preserve Excel wording; only structure for readability. */
  function renderRich(text) {
    const raw = String(text || '').replace(/\r\n/g, '\n').trim();
    if (!raw) return '';
    const lines = raw.split('\n').map((l) => l.trimEnd());
    const parts = [];
    let listBuf = [];

    function flushList() {
      if (!listBuf.length) return;
      parts.push(
        `<ul class="service-rich-list">${listBuf
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ul>`
      );
      listBuf = [];
    }

    lines.forEach((line) => {
      const t = line.trim();
      if (!t) {
        flushList();
        return;
      }
      if (/^[一二三四五六七八九十]+[、.．]/.test(t) || /^（[一二三四五六七八九十]+）/.test(t)) {
        flushList();
        parts.push(`<h3 class="service-rich-h3">${escapeHtml(t)}</h3>`);
        return;
      }
      if (/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫]/.test(t) || /^[0-9]+[\.、]/.test(t) || /^[•·●▪]/.test(t)) {
        listBuf.push(t.replace(/^[•·●▪]\s*/, ''));
        return;
      }
      if (/^[^：:\n]{1,24}[：:]/.test(t) && t.length < 220) {
        flushList();
        const idx = t.search(/[：:]/);
        const label = t.slice(0, idx + 1);
        const rest = t.slice(idx + 1).trim();
        parts.push(
          `<p class="service-rich-kv"><strong>${escapeHtml(label)}</strong>${
            rest ? `<span>${escapeHtml(rest)}</span>` : ''
          }</p>`
        );
        return;
      }
      if (/[；;]/.test(t) && t.length > 20 && t.split(/[；;]/).filter(Boolean).length >= 3) {
        flushList();
        const items = t.split(/[；;]/).map((s) => s.trim()).filter(Boolean);
        parts.push(
          `<ul class="service-rich-chips">${items
            .map((item) => `<li>${escapeHtml(item.replace(/[。．]+$/, ''))}</li>`)
            .join('')}</ul>`
        );
        return;
      }
      flushList();
      parts.push(`<p class="service-rich-p">${escapeHtml(t)}</p>`);
    });
    flushList();
    return `<div class="service-rich">${parts.join('')}</div>`;
  }

  function formatMoney(n) {
    const v = Math.round(Number(n) || 0);
    return `¥${v.toLocaleString('zh-CN')}`;
  }

  function calcBundle(bundle, selected) {
    const mods = (bundle?.modules || []).filter((_, i) => selected.has(i));
    const fixed = mods.filter((m) => Number(m.priceValue) > 0);
    const variable = mods.filter((m) => !(Number(m.priceValue) > 0));
    const subtotal = fixed.reduce((s, m) => s + (Number(m.priceValue) || 0), 0);
    const count = mods.length;
    const from = Number(bundle?.discountFrom) || 3;
    const rate = Number(bundle?.discountRate) || 1;
    const discounted = count >= from ? Math.round(subtotal * rate) : subtotal;
    return { mods, fixed, variable, subtotal, discounted, count, from, rate };
  }

  function renderBundlePicker(block) {
    const bundle = block.bundle;
    if (!bundle?.modules?.length) return '';
    const locale = window.DAOITH_getLocale?.() || 'zh';
    const tip =
      locale === 'en'
        ? 'Select modules to see the combined price. 10% off when 3+ modules are selected.'
        : bundle.discountLabel || '勾选模块后显示组合价格；3项及以上享9折';
    const items = bundle.modules
      .map(
        (m, i) => `
      <label class="bundle-module">
        <input type="checkbox" data-bundle-mod="${i}" />
        <span class="bundle-module-body">
          <span class="bundle-module-label">${escapeHtml(m.label)}</span>
          <span class="bundle-module-price">${escapeHtml(m.priceLabel || '')}</span>
        </span>
      </label>`
      )
      .join('');
    return `
      <div class="bundle-picker" data-bundle-id="${escapeHtml(bundle.id)}" data-bundle-root>
        <p class="bundle-picker-tip">${escapeHtml(tip)}</p>
        <div class="bundle-module-grid">${items}</div>
        <div class="bundle-price-bar" data-bundle-summary hidden>
          <div class="bundle-price-main">
            <span class="bundle-price-label">${locale === 'en' ? 'Selected total' : '已选合计'}</span>
            <strong data-bundle-total>—</strong>
          </div>
          <p class="bundle-price-note" data-bundle-note></p>
        </div>
      </div>`;
  }

  function renderBlocks(details) {
    return (details || [])
      .map((block) => {
        if (block.type === 'h2') {
          return `<h2 class="article-view-h2 service-detail-heading"><span>${escapeHtml(block.text)}</span></h2>`;
        }
        if (block.type === 'rich') {
          return renderRich(block.text);
        }
        if (block.type === 'bundle-picker') {
          return renderBundlePicker(block);
        }
        if (block.type === 'bundle-price') {
          return ''; // live total lives inside picker
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
        if (block.type === 'table') {
          return renderTable(block);
        }
        if (block.type === 'timeline' && Array.isArray(block.steps)) {
          return renderTimeline(block);
        }
        if (block.type === 'highlights' && Array.isArray(block.items)) {
          return `<ul class="service-highlights">${block.items
            .map((item) => {
              if (typeof item === 'string') return `<li>${escapeHtml(item)}</li>`;
              const title = escapeHtml(item?.title || item?.text || '');
              return `<li><strong>${title}</strong></li>`;
            })
            .join('')}</ul>`;
        }
        if (block.type === 'audience' && block.text) {
          const audienceLabel = (window.DAOITH_getLocale?.() || 'zh') === 'en' ? 'Best for' : '适合对象';
          return `<p class="service-audience"><span>${audienceLabel}</span>${escapeHtml(block.text)}</p>`;
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
        return `<p class="article-view-p">${escapeHtml(block.text || '').replace(/\n/g, '<br>')}</p>`;
      })
      .join('');
  }

  function bindBundlePicker(root, service) {
    const picker = root.querySelector('[data-bundle-root]');
    if (!picker) return;
    const bundleBlock = (service.details || []).find((b) => b.type === 'bundle-picker');
    const bundle = bundleBlock?.bundle;
    if (!bundle) return;

    const selected = new Set();
    const summary = picker.querySelector('[data-bundle-summary]');
    const totalEl = picker.querySelector('[data-bundle-total]');
    const noteEl = picker.querySelector('[data-bundle-note]');
    const heroPrice = root.querySelector('[data-hero-price]');
    const heroUnit = root.querySelector('[data-hero-unit]');
    const addBtn = root.querySelector('[data-action="add"]');

    function refresh() {
      const calc = calcBundle(bundle, selected);
      if (!calc.count) {
        summary.hidden = true;
        if (heroPrice) heroPrice.textContent = service.priceLabel;
        if (heroUnit) heroUnit.textContent = service.unit || '';
        if (addBtn) {
          addBtn.dataset.bundleSelection = '';
          addBtn.dataset.priceValue = String(service.priceValue || 0);
          addBtn.dataset.priceLabel = service.priceLabel || '';
        }
        return;
      }
      summary.hidden = false;
      const hasVar = calc.variable.length > 0;
      const show = calc.discounted;
      const ratePct = Math.round((1 - calc.rate) * 100);
      let main = hasVar && !calc.fixed.length ? '按报关金额另计' : formatMoney(show);
      if (hasVar && calc.fixed.length) main = `${formatMoney(show)} + 按量计费项`;
      totalEl.textContent = main;

      const notes = [];
      if (calc.count >= calc.from && calc.subtotal > 0) {
        notes.push(
          `已选 ${calc.count} 项，享${100 - ratePct}折（原价 ${formatMoney(calc.subtotal)}）`
        );
      } else if (calc.subtotal > 0) {
        notes.push(`已选 ${calc.count} 项；满 ${calc.from} 项可享${100 - ratePct}折`);
      } else {
        notes.push(`已选 ${calc.count} 项`);
      }
      if (calc.variable.length) {
        notes.push(
          `含按量计费：${calc.variable.map((m) => m.priceLabel || m.label).join('、')}`
        );
      }
      noteEl.textContent = notes.join('。');

      if (heroPrice) heroPrice.textContent = hasVar && !calc.fixed.length ? '按量计价' : formatMoney(show);
      if (heroUnit) {
        heroUnit.textContent =
          calc.count >= calc.from && calc.subtotal > 0 ? `／已享${100 - ratePct}折` : '／已选合计';
      }
      if (addBtn) {
        addBtn.dataset.bundleSelection = JSON.stringify(
          calc.mods.map((m) => ({ id: m.serviceId, label: m.label, priceValue: m.priceValue }))
        );
        addBtn.dataset.priceValue = String(show);
        addBtn.dataset.priceLabel = hasVar && !calc.fixed.length ? '按量计价' : formatMoney(show);
      }
    }

    picker.querySelectorAll('[data-bundle-mod]').forEach((input) => {
      input.addEventListener('change', () => {
        const i = Number(input.getAttribute('data-bundle-mod'));
        if (input.checked) selected.add(i);
        else selected.delete(i);
        input.closest('.bundle-module')?.classList.toggle('is-on', input.checked);
        refresh();
      });
    });
    refresh();
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
    // Detail body always follows Chinese Excel source; only title/lead/unit may switch for EN chrome.
    const title = locale === 'en' && en?.title ? en.title : service.title;
    const desc = service.desc;
    const unit = service.unit;
    const detailBtn = locale === 'en' ? 'Add to inquiry list' : '加入询价单';
    const backLabel = locale === 'en' ? '← Back to marketplace' : '← 返回财税服务市场';
    const details = service.details;
    const cat = (window.DAOITH_SERVICE_CATEGORIES || []).find((c) => c.id === service.category);
    const catLabel = cat
      ? locale === 'en'
        ? cat.en || cat.label
        : cat.label
      : locale === 'en'
        ? 'Service detail'
        : '服务详情';

    document.title = `${title} — ${locale === 'en' ? 'DAOITH Consulting' : '道一跨境咨询'}`;
    setMetaDescription(desc);

    const backLink = document.querySelector('[data-i18n-service-back]');
    if (backLink) backLink.textContent = backLabel;

    if (loadingEl) loadingEl.remove();

    viewEl.innerHTML = `
      <header class="service-product-hero">
        <span class="service-product-badge">${escapeHtml(catLabel)}</span>
        <h1 class="service-product-title">${escapeHtml(title)}</h1>
        <p class="service-product-lead">${escapeHtml(desc)}</p>
        <div class="service-product-bar">
          <div class="service-product-price">
            <strong data-hero-price>${escapeHtml(service.priceLabel)}</strong>
            <span data-hero-unit>${escapeHtml(unit || '')}</span>
          </div>
          <div class="service-product-actions">
            <a href="/#services" class="btn btn-outline btn-sm">${backLabel.replace(/^←\s*/, '')}</a>
            <button type="button" class="btn btn-primary btn-sm" data-action="add" data-service-id="${escapeHtml(service.id)}" data-price-value="${escapeHtml(String(service.priceValue || 0))}" data-price-label="${escapeHtml(service.priceLabel || '')}">${detailBtn}</button>
          </div>
        </div>
      </header>
      <div class="article-view-body service-product-body">${renderBlocks(details)}</div>
    `;

    bindBundlePicker(viewEl, service);
    window.DAOITH_CART?.bindAddButtons(viewEl);
    window.DAOITH_CART?.updateCartBadge();
  }

  render();
  window.addEventListener('localechange', render);
})();
