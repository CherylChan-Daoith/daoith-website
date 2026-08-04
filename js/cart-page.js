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

  function renderCart() {
    applyStaticI18n();
    const items = cartApi.getCart();
    const emptyEl = document.getElementById('cartEmpty');
    const contentEl = document.getElementById('cartContent');
    const body = document.getElementById('cartTableBody');
    const totalEl = document.getElementById('cartTotalValue');

    cartApi.updateCartBadge();

    if (!items.length) {
      emptyEl?.classList.remove('is-hidden');
      contentEl?.classList.add('is-hidden');
      if (body) body.innerHTML = '';
      if (totalEl) totalEl.textContent = window.formatServicePrice?.(0) || '¥0';
      return;
    }

    emptyEl?.classList.add('is-hidden');
    contentEl?.classList.remove('is-hidden');

    body.innerHTML = items.map((item) => {
      const title = enTitle(item.id, item.title);
      const subtotal = (Number(item.priceValue) || 0) * (Number(item.qty) || 0);
      return `
        <tr data-id="${escapeHtml(item.id)}">
          <td>
            <a class="cart-item-title" href="/service.html?id=${encodeURIComponent(item.id)}">${escapeHtml(title)}</a>
            <div class="cart-item-unit">${escapeHtml(item.unit || '')}</div>
          </td>
          <td>${escapeHtml(item.priceLabel || window.formatServicePrice(item.priceValue))}</td>
          <td>
            <div class="cart-qty">
              <button type="button" class="cart-qty-btn" data-qty-delta="-1" aria-label="减少">−</button>
              <input type="number" class="cart-qty-input" min="1" step="1" value="${Number(item.qty) || 1}">
              <button type="button" class="cart-qty-btn" data-qty-delta="1" aria-label="增加">+</button>
            </div>
          </td>
          <td>${window.formatServicePrice(subtotal)}</td>
          <td><button type="button" class="cart-remove" data-remove>${t('删除', 'Remove')}</button></td>
        </tr>
      `;
    }).join('');

    if (totalEl) totalEl.textContent = window.formatServicePrice(cartApi.getTotal());
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
    const id = row.dataset.id;
    if (e.target.matches('[data-remove]')) {
      cartApi.removeItem(id);
      renderCart();
      return;
    }
    const deltaBtn = e.target.closest('[data-qty-delta]');
    if (deltaBtn) {
      const delta = Number(deltaBtn.dataset.qtyDelta) || 0;
      const input = row.querySelector('.cart-qty-input');
      const current = Number(input?.value) || 1;
      cartApi.updateQty(id, current + delta);
      renderCart();
    }
  });

  document.getElementById('cartTableBody')?.addEventListener('change', (e) => {
    if (!e.target.classList.contains('cart-qty-input')) return;
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    cartApi.updateQty(row.dataset.id, e.target.value);
    renderCart();
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

    const items = cartApi.getCart();
    const payload = {
      company,
      contact,
      phone,
      total: cartApi.getTotal(),
      items: items.map((i) => ({ id: i.id, title: i.title, qty: i.qty, priceValue: i.priceValue })),
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = t('提交中…', 'Submitting…');
    }

    let serverOk = false;
    let inquiryId = '';
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
    });

    cartApi.clearCart();
    closeModal();
    document.getElementById('quoteForm')?.reset();
    cartApi.showToast(
      serverOk
        ? t('已提交，顾问将尽快联系您', 'Submitted — an advisor will contact you soon.')
        : t('已保存本地记录', 'Saved locally.')
    );
    // 提交成功后进入服务管理查看询价进度
    window.location.href = '/#hub';
  });

  renderCart();
  window.addEventListener('localechange', renderCart);
  window.addEventListener('daoith:cartchange', () => {
    // Avoid double-render loops from our own writes during render; still sync badge.
    cartApi.updateCartBadge();
  });
})();
