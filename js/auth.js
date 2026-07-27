/* WeChat OAuth login — no secrets in this file */
(function () {
  const TOKEN_KEY = 'daoith_auth_token';
  const USER_KEY = 'daoith_auth_user';
  const STATE_KEY = 'daoith_wechat_oauth_state';
  const RETURN_KEY = 'daoith_wechat_return_url';
  const PENDING_KEY = 'daoith_pending_action';
  const FORM_STATE_KEY = 'daoith_pending_form_state';

  const DEFAULT_CONFIG = {
    wechatAppId: 'wx_placeholder_app_id',
    wechatRedirectUri: 'https://www.daoith.com/auth/wechat-callback.html',
    wechatScope: 'snsapi_login',
    authApiBase: '',
  };

  let currentUser = null;
  let initDone = false;

  function config() {
    return { ...DEFAULT_CONFIG, ...(window.DAOITH_CONFIG || {}) };
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    currentUser = user || null;
    renderAuthSlot();
    window.dispatchEvent(new CustomEvent('daoith-auth-change', { detail: { user: currentUser } }));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    currentUser = null;
    renderAuthSlot();
    window.dispatchEvent(new CustomEvent('daoith-auth-change', { detail: { user: null } }));
  }

  function getUser() {
    if (currentUser) return currentUser;
    try {
      const raw = localStorage.getItem(USER_KEY);
      currentUser = raw ? JSON.parse(raw) : null;
    } catch {
      currentUser = null;
    }
    return currentUser;
  }

  function t(key) {
    return window.DAOITH_t?.(key) || key;
  }

  function isLoggedIn() {
    return Boolean(getToken() && getUser());
  }

  function saveFormState() {
    const ids = [
      'platform', 'entity', 'country', 'hsCode', 'revenue', 'teamSize', 'invoice', 'shipping', 'notes',
      'taxRevenue', 'taxRefund', 'taxEntity', 'taxEntityCountry', 'taxIncome',
      'taxProductCostRate', 'taxMarketingRate', 'taxShippingRate', 'taxStaffRate', 'taxOtherRate',
      'taxCifPrice', 'taxDutyRate', 'taxVat',
    ];
    const state = {};
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) state[id] = el.value;
    });
    sessionStorage.setItem(FORM_STATE_KEY, JSON.stringify(state));
  }

  function restoreFormState() {
    const raw = sessionStorage.getItem(FORM_STATE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(FORM_STATE_KEY);
    try {
      const state = JSON.parse(raw);
      Object.entries(state).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    } catch {
      /* ignore */
    }
  }

  function requireLogin(action, returnUrl) {
    if (isLoggedIn()) return true;
    if (action) sessionStorage.setItem(PENDING_KEY, action);
    saveFormState();
    sessionStorage.setItem(RETURN_KEY, returnUrl || `${window.location.pathname}${window.location.search}${window.location.hash || '#ai-solution'}`);
    alert(t('auth.loginRequired'));
    startWeChatLogin();
    return false;
  }

  function consumePendingAction() {
    const action = sessionStorage.getItem(PENDING_KEY);
    if (!action || !isLoggedIn()) return null;
    sessionStorage.removeItem(PENDING_KEY);
    restoreFormState();
    return action;
  }

  function buildWeChatAuthUrl() {
    const cfg = config();
    const state = crypto.randomUUID();
    sessionStorage.setItem(STATE_KEY, state);
    if (!sessionStorage.getItem(RETURN_KEY)) {
      sessionStorage.setItem(RETURN_KEY, window.location.pathname + window.location.search + window.location.hash);
    }

    const params = new URLSearchParams({
      appid: cfg.wechatAppId,
      redirect_uri: cfg.wechatRedirectUri,
      response_type: 'code',
      scope: cfg.wechatScope,
      state,
    });

    return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
  }

  function startWeChatLogin() {
    const cfg = config();
    if (!cfg.wechatAppId || cfg.wechatAppId === 'wx_placeholder_app_id') {
      alert(t('auth.placeholderHint'));
      return;
    }
    window.location.href = buildWeChatAuthUrl();
  }

  async function exchangeCode(code) {
    const cfg = config();
    const base = cfg.authApiBase || '';
    const response = await fetch(`${base}/api/auth/wechat/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || t('auth.loginFailed'));
    }
    return data;
  }

  async function fetchCurrentUser() {
    const token = getToken();
    if (!token) return null;

    const cfg = config();
    const base = cfg.authApiBase || '';
    const response = await fetch(`${base}/api/auth/wechat/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const data = await response.json();
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      currentUser = data.user;
    }
    return currentUser;
  }

  function logout() {
    clearSession();
  }

  function renderAuthSlot() {
    const slot = document.getElementById('authSlot');
    if (!slot) return;

    const user = getUser();
    if (user?.nickname || user?.avatarUrl) {
      const name = user.nickname || t('auth.wechatUser');
      const avatar = user.avatarUrl
        ? `<img class="auth-avatar" src="${escapeHtml(user.avatarUrl)}" alt="" width="28" height="28">`
        : '<span class="auth-avatar auth-avatar-fallback" aria-hidden="true">微</span>';
      slot.innerHTML = `
        <div class="auth-user">
          ${avatar}
          <span class="auth-name">${escapeHtml(name)}</span>
          <button type="button" class="auth-logout" id="authLogoutBtn">${escapeHtml(t('auth.logout'))}</button>
        </div>
      `;
      slot.querySelector('#authLogoutBtn')?.addEventListener('click', logout);
      return;
    }

    slot.innerHTML = `
      <button type="button" class="btn-wechat-login" id="wechatLoginBtn" aria-label="${escapeHtml(t('auth.wechatLogin'))}">
        <svg class="btn-wechat-login-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12.5 3C7.81 3 4 6.13 4 10c0 2.2 1.21 4.15 3.1 5.4L6.4 18.5l3.35-1.68c.85.24 1.76.38 2.75.38.28 0 .55-.01.82-.04C12.9 16.05 12.5 14.6 12.5 13c0-4.14 3.92-7.5 8.75-7.5.38 0 .75.02 1.11.06C21.2 3.9 17.2 3 12.5 3zm-3.25 4.25a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4.5 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM21.25 7.25C17.6 7.25 14.5 9.7 14.5 12.75S17.6 18.25 21.25 18.25c.76 0 1.49-.12 2.16-.34l2.34 1.17-.52-1.95c1.1-.93 1.77-2.25 1.77-3.74 0-3.05-3.1-5.5-6.75-5.5zm-1.9 3.35a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7zm3.8 0a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7z"/>
        </svg>
        <span>${escapeHtml(t('auth.wechatLogin'))}</span>
      </button>
    `;
    slot.querySelector('#wechatLoginBtn')?.addEventListener('click', startWeChatLogin);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function initAuth() {
    if (initDone) return;
    initDone = true;

    const cached = getUser();
    if (cached && getToken()) {
      await fetchCurrentUser().catch(() => null);
    }
    renderAuthSlot();

    window.addEventListener('localechange', renderAuthSlot);
  }

  async function handleCallbackPage() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const savedState = sessionStorage.getItem(STATE_KEY);
    const returnUrl = sessionStorage.getItem(RETURN_KEY) || '/';

    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(RETURN_KEY);

    const statusEl = document.getElementById('wechatCallbackStatus');
    const setStatus = (msg) => {
      if (statusEl) statusEl.textContent = msg;
    };

    if (!code) {
      setStatus(t('auth.missingCode'));
      return;
    }

    if (!state || !savedState || state !== savedState) {
      setStatus(t('auth.invalidState'));
      return;
    }

    try {
      setStatus(t('auth.loggingIn'));
      const data = await exchangeCode(code);
      setSession(data.token, data.user);
      setStatus(t('auth.loginSuccess'));
      window.location.replace(returnUrl.startsWith('/') ? returnUrl : '/');
    } catch (err) {
      setStatus(err.message || t('auth.loginFailed'));
    }
  }

  window.DAOITH_AUTH = {
    init: initAuth,
    startWeChatLogin,
    handleCallbackPage,
    getToken,
    getUser,
    logout,
    fetchCurrentUser,
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body?.classList.contains('wechat-callback-page')) {
      handleCallbackPage();
    } else {
      initAuth();
    }
  });
})();
