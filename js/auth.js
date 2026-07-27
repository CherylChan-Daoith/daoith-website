/* WeChat OAuth login — no secrets in this file */
(function () {
  const TOKEN_KEY = 'daoith_auth_token';
  const USER_KEY = 'daoith_auth_user';
  const STATE_KEY = 'daoith_wechat_oauth_state';
  const RETURN_KEY = 'daoith_wechat_return_url';

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

  function buildWeChatAuthUrl() {
    const cfg = config();
    const state = crypto.randomUUID();
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(RETURN_KEY, window.location.pathname + window.location.search + window.location.hash);

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
        <svg class="btn-wechat-login-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M8.5 4C4.91 4 2 6.24 2 9.08c0 1.57.84 2.97 2.16 3.89l-.55 2.05 2.36-1.18c.66.18 1.36.28 2.08.28.22 0 .44-.01.65-.03C8.2 12.98 8 11.55 8 10.08 8 6.7 11.13 4 15 4c.34 0 .67.02 1 .06C15.2 3.4 13.95 3 12.5 3 10.07 3 8.5 4 8.5 4zm-3 3.25c-.55 0-1-.38-1-.85s.45-.85 1-.85.99.38.99.85-.44.85-.99.85zm4 0c-.55 0-1-.38-1-.85s.45-.85 1-.85 1 .38 1 .85-.45.85-1 .85zM22 14.42c0-2.49-2.46-4.5-5.5-4.5S11 11.93 11 14.42c0 2.49 2.46 4.5 5.5 4.5.88 0 1.7-.18 2.43-.5l2.07 1.04-.48-1.78c1.1-.86 1.98-2.12 1.98-3.26zM14.75 13.5c-.41 0-.75-.28-.75-.62s.34-.62.75-.62.74.28.74.62-.33.62-.74.62zm3 0c-.41 0-.75-.28-.75-.62s.34-.62.75-.62.74.28.74.62-.33.62-.74.62z"/>
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
