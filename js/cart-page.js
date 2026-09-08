(function initCartPage() {
  if (window.DAOITH_initI18n) window.DAOITH_initI18n();

  const cartApi = window.DAOITH_CART;
  if (!cartApi) return;

  function t(zh, en) {
    return (window.DAOITH_getLocale?.() || 'zh') === 'en' ? en : zh;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function applyStaticI18n() {
    const set = (id, zh, en) => {
      const el = document.getElementById(id);
      if (el) el.textContent = t(zh, en);
    };
    set('cartPageTitle', '购物车', 'Cart');
    set('cartPageSub', '查看已选服务与预计总价，提交信息获取优惠报价', 'Review selected services and estimated total, then request a preferential quote.');
    set('cartEmptyTitle', '购物车是空的', 'Your cart is empty');
    set('cartEmptyDesc', '去财税服务市场挑选适合您的合规服务吧。', 'Browse the tax services marketplace to get started.');
    set('cartEmptyCta', '浏览服务市场', 'Browse marketplace');
    set('thService', '服务', 'Service');
    set('thPrice', '单价', 'Unit price');
    set('thQty', '数量', 'Qty');
    set('thSubtotal', '小计', 'Subtotal');
    set('cartTotalLabel', '预计服务总价', 'Estimated total');
    set('openQuoteBtn', '获取优惠报价', 'Get preferential quote');
    set('quoteModalTitle', '获取优惠报价', 'Get preferential quote');
    set('quoteModalLead', '留下联系方式，顾问将根据您选购的服务出具优惠方案。', 'Leave your contact details and an advisor will prepare a preferential proposal.');
    set('labelCompany', '公司名字', 'Company name');
    set('labelContact', '联系人', 'Contact person');
    set('labelPhone', '联系电话', 'Phone');
    set('quoteCancelBtn', '取消', 'Cancel');
    set('quoteSubmitBtn', '提交询价', 'Submit');
    document.title = `${t('购物车', 'Cart')} — DAOITH`;
  }

  function enTitle(id, fallback) {
    const list = window.DAOITH_I18N_EN?.servicesCatalog || [];
    const hit = list.find((s) => s.id === id);
    if ((window.DAOITH_getLocale?.() || 'zh') === 'en' && hit?.title) return hit.title;
    return fallback;
  }

  function formatMoney(value) {
    if (typeof window.formatServicePrice === 'function') {
      return window.formatServicePrice(value);
    }
    return `¥${(Number(value) || 0).toLocaleString('zh-CN')}`;
  }

  function volumeScopesFor(item) {
    const priced = window.DAOITH_pricing?.repriceCartItem?.(item) || item;
    if (Array.isArray(priced.volumeScopes) && priced.volumeScopes.length) return priced.volumeScopes;
    const mods = Array.isArray(item.bundleSelection) ? item.bundleSelection : [];
    const scopes = new Set();
    mods.forEach((m) => {
      if (window.DAOITH_pricing?.isVolumeModule?.(m) && m.volumeScope) scopes.add(m.volumeScope);
    });
    const rule = window.DAOITH_VOLUME_RULES?.[item.id];
    if (rule?.scope) scopes.add(rule.scope);
    return [...scopes];
  }

  function salesFieldHtml(item, scope) {
    const locale = window.DAOITH_getLocale?.() || 'zh';
    const ruleFromMod = (Array.isArray(item.bundleSelection) ? item.bundleSelection : [])
      .map((m) => window.DAOITH_pricing?.enrichModulePricing?.(m) || m)
      .find((m) => m.volumeScope === scope);
    const rule = window.DAOITH_VOLUME_RULES?.[ruleFromMod?.id || item.id] || window.DAOITH_VOLUME_RULES?.[item.id];
    const label =
      (locale === 'en' ? rule?.metricLabel?.en : rule?.metricLabel?.zh) ||
      (scope === 'hk'
        ? t('香港公司预计年营业额（港币）', 'Est. HK company annual turnover (HKD)')
        : t('预计年度出口/报关金额（人民币）', 'Est. annual export / customs value (RMB)'));
    const hint =
      (locale === 'en' ? rule?.hint?.en : rule?.hint?.zh) ||
      '';
    const val = item.salesByScope?.[scope];
    const display = val == null || val === '' ? '' : String(val);
    return `
      <label class="cart-sales-field">
        <span class="cart-sales-label">${escapeHtml(label)}</span>
        <input type="number" class="cart-sales-input" min="0" step="1" inputmode="decimal"
          data-sales-scope="${escapeHtml(scope)}"
          value="${escapeHtml(display)}"
          placeholder="0">
        ${hint ? `<span class="cart-sales-hint">${escapeHtml(hint)}</span>` : ''}
      </label>`;
  }

  function modulesHtml(item) {
    const mods = Array.isArray(item.bundleSelection) ? item.bundleSelection : [];
    if (!mods.length) return '';
    return `<ul class="cart-item-modules">${mods
      .map((m) => {
        const fee =
          m.computedFee != null && !m.pending
            ? formatMoney(m.computedFee)
            : m.priceLabel || (Number(m.priceValue) > 0 ? formatMoney(m.priceValue) : t('待计', 'TBD'));
        return `<li><span>${escapeHtml(m.label || m.id || '')}</span><em>${escapeHtml(fee)}</em></li>`;
      })
      .join('')}</ul>`;
  }

  function renderCart() {
    applyStaticI18n();
    const rawItems = cartApi.getCart();
    const items = rawItems.map((i) => window.DAOITH_pricing?.repriceCartItem?.(i) || i);
    const emptyEl = document.getElementById('cartEmpty');
    const contentEl = document.getElementById('cartContent');
    const body = document.getElementById('cartTableBody');
    const totalEl = document.getElementById('cartTotalValue');

    cartApi.updateCartBadge();

    if (!items.length) {
      emptyEl?.classList.remove('is-hidden');
      contentEl?.classList.add('is-hidden');
      if (body) body.innerHTML = '';
      if (totalEl) totalEl.textContent = formatMoney(0);
      return;
    }

    emptyEl?.classList.add('is-hidden');
    contentEl?.classList.remove('is-hidden');

    body.innerHTML = items.map((item) => {
      const title = enTitle(item.id, item.title);
      const rowKey = item.cartKey || item.id;
      const scopes = volumeScopesFor(item);
      const salesBlock = scopes.length
        ? `<div class="cart-sales-block">${scopes.map((s) => salesFieldHtml(item, s)).join('')}</div>`
        : '';
      const unitText = item.volumePending && !(Number(item.priceValue) > 0)
        ? t('填写销售额后计算', 'Enter sales to estimate')
        : item.priceLabel || formatMoney(item.priceValue);
      const sub = (Number(item.priceValue) || 0) * (Number(item.qty) || 0);
      const subText =
        item.volumePending && sub <= 0
          ? t('待计算', 'Pending')
          : formatMoney(sub);
      return `
        <tr data-id="${escapeHtml(item.id)}" data-cart-key="${escapeHtml(rowKey)}">
          <td>
            <a class="cart-item-title" href="/service.html?id=${encodeURIComponent(item.id)}">${escapeHtml(title || item.id || '')}</a>
            ${modulesHtml(item)}
            ${salesBlock}
            <div class="cart-item-unit">${escapeHtml(item.unit || '')}</div>
          </td>
          <td>${escapeHtml(unitText)}</td>
          <td>
            <div class="cart-qty">
              <button type="button" class="cart-qty-btn" data-qty-delta="-1" aria-label="减少">−</button>
              <input type="number" class="cart-qty-input" min="1" step="1" value="${Number(item.qty) || 1}">
              <button type="button" class="cart-qty-btn" data-qty-delta="1" aria-label="增加">+</button>
            </div>
          </td>
          <td>${escapeHtml(subText)}</td>
          <td><button type="button" class="cart-remove" data-remove>${t('删除', 'Remove')}</button></td>
        </tr>
      `;
    }).join('');

    if (totalEl) totalEl.textContent = formatMoney(cartApi.getTotal());
  }

  function openModal() {
    const modal = document.getElementById('quoteModal');
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    document.getElementById('quoteFormError').hidden = true;
    document.getElementById('quoteCompany')?.focus();
  }

  function closeModal() {
    const modal = document.getElementById('quoteModal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  document.getElementById('cartTableBody')?.addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    const key = row.dataset.cartKey || row.dataset.id;
    if (e.target.matches('[data-remove]')) {
      cartApi.removeItem(key);
      renderCart();
      return;
    }
    const deltaBtn = e.target.closest('[data-qty-delta]');
    if (deltaBtn) {
      const delta = Number(deltaBtn.dataset.qtyDelta) || 0;
      const input = row.querySelector('.cart-qty-input');
      const current = Number(input?.value) || 1;
      cartApi.updateQty(key, current + delta);
      renderCart();
    }
  });

  document.getElementById('cartTableBody')?.addEventListener('change', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    const key = row.dataset.cartKey || row.dataset.id;
    if (e.target.classList.contains('cart-qty-input')) {
      cartApi.updateQty(key, e.target.value);
      renderCart();
      return;
    }
    if (e.target.classList.contains('cart-sales-input')) {
      const scope = e.target.dataset.salesScope;
      const raw = e.target.value;
      const num = raw === '' ? null : Math.max(0, Number(raw) || 0);
      cartApi.updateItem?.(key, { salesByScope: { [scope]: num } });
      renderCart();
    }
  });

  document.getElementById('cartTableBody')?.addEventListener('input', (e) => {
    if (!e.target.classList.contains('cart-sales-input')) return;
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    const key = row.dataset.cartKey || row.dataset.id;
    const scope = e.target.dataset.salesScope;
    const raw = e.target.value;
    const num = raw === '' ? null : Math.max(0, Number(raw) || 0);
    cartApi.updateItem?.(key, { salesByScope: { [scope]: num } });
    // Soft refresh totals without stealing focus: update price cells only
    const priced = window.DAOITH_pricing?.repriceCartItem?.(
      (cartApi.getCart() || []).find((i) => (i.cartKey || i.id) === key)
    );
    if (!priced) return;
    const cells = row.querySelectorAll('td');
    if (cells[1]) {
      cells[1].textContent =
        priced.volumePending && !(Number(priced.priceValue) > 0)
          ? t('填写销售额后计算', 'Enter sales to estimate')
          : priced.priceLabel || formatMoney(priced.priceValue);
    }
    if (cells[3]) {
      const sub = (Number(priced.priceValue) || 0) * (Number(priced.qty) || 0);
      cells[3].textContent =
        priced.volumePending && sub <= 0 ? t('待计算', 'Pending') : formatMoney(sub);
    }
    const mods = row.querySelectorAll('.cart-item-modules li em');
    if (Array.isArray(priced.bundleSelection) && mods.length) {
      priced.bundleSelection.forEach((m, i) => {
        if (!mods[i]) return;
        mods[i].textContent =
          m.computedFee != null && !m.pending
            ? formatMoney(m.computedFee)
            : m.priceLabel || (Number(m.priceValue) > 0 ? formatMoney(m.priceValue) : t('待计', 'TBD'));
      });
    }
    const totalEl = document.getElementById('cartTotalValue');
    if (totalEl) totalEl.textContent = formatMoney(cartApi.getTotal());
    cartApi.updateCartBadge();
  });

  document.getElementById('openQuoteBtn')?.addEventListener('click', () => {
    if (!cartApi.getCart().length) return;
    if (window.DAOITH_AUTH?.requireLogin && !window.DAOITH_AUTH.requireLogin('quote_submit', '/cart.html')) {
      return;
    }
    openModal();
  });

  document.querySelectorAll('[data-close-quote]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  document.getElementById('quoteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const company = document.getElementById('quoteCompany')?.value.trim() || '';
    const contact = document.getElementById('quoteContact')?.value.trim() || '';
    const phone = document.getElementById('quotePhone')?.value.trim() || '';
    const err = document.getElementById('quoteFormError');
    const submitBtn = document.getElementById('quoteSubmitBtn');

    if (!company || !contact || !phone) {
      if (err) {
        err.hidden = false;
        err.textContent = t('请填写公司名字、联系人和联系电话', 'Please fill in company name, contact person, and phone.');
      }
      return;
    }

    const items = (cartApi.getCart() || []).map((i) => window.DAOITH_pricing?.repriceCartItem?.(i) || i);
    const payload = {
      company,
      contact,
      phone,
      total: cartApi.getTotal(),
      items: items.map((i) => ({
        id: i.id,
        title: i.title,
        qty: i.qty,
        priceValue: i.priceValue,
        priceLabel: i.priceLabel,
        salesByScope: i.salesByScope || {},
        bundleSelection: i.bundleSelection || null,
      })),
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = t('提交中…', 'Submitting…');
    }

    let serverOk = false;
    let inquiryId = '';
    let quotedTotal;
    let standardTotal;
    try {
      const cfg = window.DAOITH_CONFIG || {};
      const apiBase = (cfg.notifyApiBase || cfg.difyApiBase || 'https://api.daoith.com').replace(/\/$/, '');
      const headers = { 'Content-Type': 'application/json' };
      const token = window.DAOITH_AUTH?.getToken?.();
      if (!token) {
        throw new Error(t('请先微信登录后再提交询价', 'Please sign in with WeChat before submitting.'));
      }
      headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/inquiry`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      serverOk = true;
      inquiryId = data.inquiryId || '';
      quotedTotal = data.quotedTotal;
      standardTotal = data.standardTotal;
    } catch (submitErr) {
      if (err) {
        err.hidden = false;
        err.textContent = t(
          `提交失败：${submitErr.message || '网络错误'}，请稍后重试`,
          `Submit failed: ${submitErr.message || 'network error'}. Please try again.`
        );
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = t('提交询价', 'Submit');
      }
      return;
    }

    cartApi.saveQuote({
      ...payload,
      inquiryId,
      status: '已提交',
      statusHistory: { '已提交': new Date().toISOString() },
      createdAt: new Date().toISOString(),
      quotedTotal,
      standardTotal,
    });

    cartApi.clearCart();
    closeModal();
    document.getElementById('quoteForm')?.reset();
    cartApi.showToast(
      serverOk
        ? t('已提交，顾问将尽快联系您', 'Submitted — an advisor will contact you soon.')
        : t('已保存本地记录', 'Saved locally.')
    );
    // 提交成功后进入服务管理（用 sessionStorage + 绝对地址，避免微信内从 cart.html 跳 /#hub 失败）
    try { sessionStorage.setItem('daoith_open_view', 'hub'); } catch { /* ignore */ }
    window.location.replace(`${window.location.origin}/#hub`);
  });

  renderCart();
  window.addEventListener('localechange', renderCart);
  window.addEventListener('daoith:cartchange', () => {
    // Avoid double-render loops from our own writes during render; still sync badge.
    cartApi.updateCartBadge();
  });
})();
