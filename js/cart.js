/* DAOITH shopping cart (localStorage) */
(function () {
  const CART_KEY = 'daoith_cart';
  const QUOTE_KEY = 'daoith_quotes';

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
      const price = Number(item.priceValue) || 0;
      const qty = Number(item.qty) || 0;
      return sum + price * qty;
    }, 0);
  }

  function addItem(serviceId, qty = 1) {
    const service = typeof window.getServiceById === 'function'
      ? window.getServiceById(serviceId)
      : null;
    if (!service) return false;

    const items = readCart();
    const existing = items.find((i) => i.id === service.id);
    const addQty = Math.max(1, Number(qty) || 1);
    if (existing) {
      existing.qty = (Number(existing.qty) || 0) + addQty;
    } else {
      items.push({
        id: service.id,
        title: service.title,
        priceLabel: service.priceLabel,
        priceValue: service.priceValue,
        unit: service.unit,
        qty: addQty,
      });
    }
    writeCart(items);
    return true;
  }

  function removeItem(serviceId) {
    writeCart(readCart().filter((i) => i.id !== serviceId));
  }

  function updateQty(serviceId, qty) {
    const next = Math.max(0, Math.floor(Number(qty) || 0));
    const items = readCart();
    const item = items.find((i) => i.id === serviceId);
    if (!item) return;
    if (next <= 0) {
      writeCart(items.filter((i) => i.id !== serviceId));
      return;
    }
    item.qty = next;
    writeCart(items);
  }

  function clearCart() {
    writeCart([]);
  }

  function saveQuote(payload) {
    let list = [];
    try {
      const raw = localStorage.getItem(QUOTE_KEY);
      list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }
    list.unshift({
      ...payload,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(QUOTE_KEY, JSON.stringify(list.slice(0, 50)));
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
        const ok = addItem(id, 1);
        if (ok) {
          updateCartBadge();
          const locale = window.DAOITH_getLocale?.() || 'zh';
          showToast(locale === 'en' ? 'Added to cart' : '已加入购物车');
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
    clearCart,
    saveQuote,
    updateCartBadge,
    showToast,
    bindAddButtons,
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    bindAddButtons();
  });

  window.addEventListener('daoith:cartchange', updateCartBadge);
})();
