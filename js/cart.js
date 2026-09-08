/* DAOITH shopping cart (localStorage) */
(function () {
  const CART_KEY = 'daoith_cart';
  const QUOTE_KEY_LEGACY = 'daoith_quotes';

  function currentOpenid() {
    try {
      return String(window.DAOITH_AUTH?.getUser?.()?.openid || '').trim();
    } catch {
      return '';
    }
  }

  function quoteStorageKey(openid) {
    const oid = openid != null ? String(openid).trim() : currentOpenid();
    return oid ? `daoith_quotes:${oid}` : 'daoith_quotes:anon';
  }

  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('daoith:cartchange'));
  }

  function getCart() {
    return readCart();
  }

  function getCount() {
    return readCart().reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }

  function getTotal() {
    return readCart().reduce((sum, item) => {
      const priced = window.DAOITH_pricing?.repriceCartItem?.(item) || item;
      const price = Number(priced.priceValue) || 0;
      const qty = Number(item.qty) || 0;
      return sum + price * qty;
    }, 0);
  }

  function addItem(serviceId, qty = 1, overrides = null) {
    const service = typeof window.getServiceById === 'function'
      ? window.getServiceById(serviceId)
      : null;
    if (!service) return false;

    const items = readCart();
    const addQty = Math.max(1, Number(qty) || 1);
    let bundleSelection = overrides?.bundleSelection || null;
    if (Array.isArray(bundleSelection) && window.DAOITH_pricing?.enrichModulePricing) {
      bundleSelection = bundleSelection.map((m) => window.DAOITH_pricing.enrichModulePricing(m));
    }
    const priceValue = overrides?.priceValue != null
      ? Number(overrides.priceValue) || 0
      : service.priceValue;
    const priceLabel = overrides?.priceLabel || service.priceLabel;
    const title = overrides?.title || service.title;
    const unit = overrides?.unit != null ? overrides.unit : service.unit;
    const selectionKey = overrides?.selectionKey || '';
    const cartKey = selectionKey ? `${service.id}::${selectionKey}` : service.id;
    const existing = items.find((i) => (i.cartKey || i.id) === cartKey);
    if (existing) {
      existing.qty = (Number(existing.qty) || 0) + addQty;
      existing.priceValue = priceValue;
      existing.priceLabel = priceLabel;
      if (title) existing.title = title;
      if (bundleSelection) existing.bundleSelection = bundleSelection;
    } else {
      const row = {
        id: service.id,
        cartKey,
        title,
        priceValue,
        priceLabel,
        unit,
        qty: addQty,
        bundleSelection,
        salesByScope: {},
      };
      const priced = window.DAOITH_pricing?.repriceCartItem?.(row) || row;
      items.push(priced);
    }
    writeCart(items.map((i) => window.DAOITH_pricing?.repriceCartItem?.(i) || i));
    return true;
  }

  function removeItem(serviceId) {
    const key = String(serviceId || '');
    writeCart(readCart().filter((i) => (i.cartKey || i.id) !== key));
  }

  function updateQty(serviceId, qty) {
    const key = String(serviceId || '');
    const next = Math.max(0, Math.floor(Number(qty) || 0));
    const items = readCart();
    const item = items.find((i) => (i.cartKey || i.id) === key);
    if (!item) return;
    if (next <= 0) {
      writeCart(items.filter((i) => (i.cartKey || i.id) !== key));
      return;
    }
    item.qty = next;
    writeCart(items.map((i) => window.DAOITH_pricing?.repriceCartItem?.(i) || i));
  }

  function updateItem(cartKey, patch) {
    const key = String(cartKey || '');
    const items = readCart();
    const item = items.find((i) => (i.cartKey || i.id) === key);
    if (!item) return false;
    Object.assign(item, patch || {});
    if (patch?.salesByScope) {
      item.salesByScope = { ...(item.salesByScope || {}), ...patch.salesByScope };
    }
    const priced = window.DAOITH_pricing?.repriceCartItem?.(item) || item;
    Object.assign(item, priced);
    writeCart(items);
    return true;
  }

  function clearCart() {
    writeCart([]);
  }

  function getQuotes(openid) {
    try {
      const raw = localStorage.getItem(quoteStorageKey(openid));
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function setQuotes(list, openid) {
    const key = quoteStorageKey(openid);
    localStorage.setItem(key, JSON.stringify((list || []).slice(0, 50)));
    // Drop legacy shared key so accounts never leak across logins on this browser
    try { localStorage.removeItem(QUOTE_KEY_LEGACY); } catch { /* ignore */ }
  }

  function saveQuote(payload) {
    const openid = currentOpenid();
    const list = getQuotes(openid);
    list.unshift({
      ...payload,
      openid: openid || null,
      createdAt: payload?.createdAt || new Date().toISOString(),
    });
    setQuotes(list, openid);
  }

  function updateCartBadge() {
    const count = getCount();
    document.querySelectorAll('[data-cart-badge]').forEach((el) => {
      el.textContent = String(count);
      el.hidden = count <= 0;
      el.classList.toggle('is-empty', count <= 0);
    });
  }

  function showToast(message) {
    let toast = document.getElementById('daoithToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'daoithToast';
      toast.className = 'daoith-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2200);
  }

  function bindAddButtons(root = document) {
    root.querySelectorAll('[data-action="add"]').forEach((btn) => {
      if (btn.dataset.cartBound === '1') return;
      btn.dataset.cartBound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.serviceId
          || btn.closest('[data-service-id]')?.dataset.serviceId;
        if (!id) return;
        let overrides = null;
        if (btn.dataset.priceLabel || btn.dataset.priceValue || btn.dataset.bundleSelection) {
          let bundleSelection = null;
          try {
            bundleSelection = btn.dataset.bundleSelection
              ? JSON.parse(btn.dataset.bundleSelection)
              : null;
          } catch {
            bundleSelection = null;
          }
          const labels = Array.isArray(bundleSelection)
            ? bundleSelection.map((m) => m.label).filter(Boolean)
            : [];
          const service = window.getServiceById?.(id);
          overrides = {
            priceValue: btn.dataset.priceValue,
            priceLabel: btn.dataset.priceLabel,
            title: labels.length && service
              ? `${service.title}（${labels.join('、')}）`
              : undefined,
            unit: labels.length ? '' : undefined,
            selectionKey: labels.length ? labels.join('|') : '',
            bundleSelection,
          };
        }
        const ok = addItem(id, 1, overrides);
        if (ok) {
          updateCartBadge();
          const locale = window.DAOITH_getLocale?.() || 'zh';
          const needsVol =
            btn.dataset.needsVolume === '1' ||
            (Array.isArray(overrides?.bundleSelection) &&
              overrides.bundleSelection.some((m) => window.DAOITH_pricing?.isVolumeModule?.(m))) ||
            !!window.DAOITH_VOLUME_RULES?.[id];
          showToast(
            locale === 'en'
              ? needsVol
                ? 'Added — enter sales in the cart to estimate fees'
                : 'Added to inquiry list'
              : needsVol
                ? '已加入询价单，请在购物车填写销售额以计算费用'
                : '已加入询价单'
          );
        }
      });
    });
  }

  window.DAOITH_CART = {
    getCart,
    getCount,
    getTotal,
    addItem,
    removeItem,
    updateQty,
    updateItem,
    clearCart,
    getQuotes,
    setQuotes,
    quoteStorageKey,
    saveQuote,
    updateCartBadge,
    showToast,
    bindAddButtons,
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    bindAddButtons();
  });
})();
