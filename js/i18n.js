/* DAOITH i18n — Chinese default in HTML, English via locale bundle */
(function () {
  const STORAGE_KEY = 'daoith_locale';
  const SUPPORTED = ['zh', 'en'];

  const originalText = new Map();
  const originalHtml = new Map();
  let captured = false;

  function getLocale() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(saved) ? saved : 'zh';
  }

  function t(key) {
    const locale = getLocale();
    const dict = locale === 'en' ? window.DAOITH_I18N_EN?.strings : window.DAOITH_I18N_ZH?.strings;
    return dict?.[key] || key;
  }

  function captureOriginal(el, useHtml) {
    const id = el;
    if (useHtml) {
      if (!originalHtml.has(id)) originalHtml.set(id, el.innerHTML);
    } else if (!originalText.has(id)) {
      originalText.set(id, el.textContent);
    }
  }

  function restoreOriginal(el, useHtml) {
    if (useHtml && originalHtml.has(el)) {
      el.innerHTML = originalHtml.get(el);
    } else if (originalText.has(el)) {
      el.textContent = originalText.get(el);
    }
  }

  function setText(el, text, useHtml) {
    if (useHtml) el.innerHTML = text;
    else el.textContent = text;
  }

  function captureDefaults() {
    if (captured) return;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      captureOriginal(el, el.hasAttribute('data-i18n-html'));
    });
    const en = window.DAOITH_I18N_EN;
    if (en?.selectors) {
      Object.keys(en.selectors).forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => captureOriginal(el, en.selectors[sel].html));
      });
    }
    captured = true;
  }

  function applySelectors(locale) {
    const en = window.DAOITH_I18N_EN?.selectors;
    if (!en) return;
    Object.entries(en).forEach(([sel, cfg]) => {
      if (!cfg.text && !cfg.html) return;
      document.querySelectorAll(sel).forEach((el) => {
        captureOriginal(el, cfg.html);
        if (locale === 'en') setText(el, cfg.text, cfg.html);
        else restoreOriginal(el, cfg.html);
      });
    });
  }

  function applyDataI18n(locale) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      captureOriginal(el, el.hasAttribute('data-i18n-html'));
      if (locale === 'en') {
        const text = window.DAOITH_I18N_EN?.strings?.[key];
        if (text) setText(el, text, el.hasAttribute('data-i18n-html'));
      } else {
        restoreOriginal(el, el.hasAttribute('data-i18n-html'));
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!el.dataset.i18nPhDefault) el.dataset.i18nPhDefault = el.placeholder;
      if (locale === 'en' && window.DAOITH_I18N_EN?.strings?.[key]) {
        el.placeholder = window.DAOITH_I18N_EN.strings[key];
      } else {
        el.placeholder = el.dataset.i18nPhDefault;
      }
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (!el.dataset.i18nAriaDefault) el.dataset.i18nAriaDefault = el.getAttribute('aria-label') || '';
      if (locale === 'en' && window.DAOITH_I18N_EN?.strings?.[key]) {
        el.setAttribute('aria-label', window.DAOITH_I18N_EN.strings[key]);
      } else {
        el.setAttribute('aria-label', el.dataset.i18nAriaDefault);
      }
    });
  }

  function applyFormOptions(locale) {
    const opts = window.DAOITH_I18N_EN?.formOptions;
    if (opts) {
      Object.entries(opts).forEach(([selectId, map]) => {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.querySelectorAll('option').forEach((opt) => {
          if (!opt.dataset.i18nDefault) opt.dataset.i18nDefault = opt.textContent;
          if (locale === 'en' && map[opt.value] !== undefined) {
            opt.textContent = map[opt.value];
          } else {
            opt.textContent = opt.dataset.i18nDefault;
          }
        });
      });
    }

    const radios = window.DAOITH_I18N_EN?.radioLabels;
    if (radios) {
      document.querySelectorAll('.radio-item').forEach((label) => {
        const input = label.querySelector('input[type="radio"]');
        if (!input) return;
        let textSpan = label.querySelector('.radio-text');
        if (!textSpan) {
          const raw = label.textContent.trim();
          label.textContent = '';
          label.appendChild(input);
          textSpan = document.createElement('span');
          textSpan.className = 'radio-text';
          textSpan.textContent = raw;
          label.appendChild(textSpan);
        }
        if (!textSpan.dataset.i18nDefault) textSpan.dataset.i18nDefault = textSpan.textContent.trim();
        textSpan.textContent = locale === 'en' && radios[input.value]
          ? radios[input.value]
          : textSpan.dataset.i18nDefault;
      });
    }

    const phKeys = [
      ['#hsCode', 'form.hsPlaceholder'],
      ['#notes', 'form.notesPlaceholder'],
      ['#feedbackText', 'feedback.placeholder'],
    ];
    phKeys.forEach(([sel, key]) => {
      const el = document.querySelector(sel);
      if (!el) return;
      if (!el.dataset.i18nPhDefault) el.dataset.i18nPhDefault = el.placeholder;
      el.placeholder = locale === 'en' ? t(key) : el.dataset.i18nPhDefault;
    });
  }

  function applyListBlocks(locale) {
    const en = window.DAOITH_I18N_EN;
    if (!en) return;

    if (en.taxPolicies) {
      document.querySelectorAll('#policyTaxList .policy-item').forEach((item, i) => {
        const p = en.taxPolicies[i];
        if (!p) return;
        const h4 = item.querySelector('h4');
        const sum = item.querySelector('.policy-summary');
        if (h4) {
          captureOriginal(h4, false);
          setText(h4, locale === 'en' ? p.title : originalText.get(h4), false);
        }
        if (sum) {
          captureOriginal(sum, false);
          setText(sum, locale === 'en' ? p.summary : originalText.get(sum), false);
        }
      });
    }

    if (en.platformPolicies) {
      document.querySelectorAll('#policyPlatformList .policy-item').forEach((item, i) => {
        const p = en.platformPolicies[i];
        if (!p) return;
        const h4 = item.querySelector('h4');
        const sum = item.querySelector('.policy-summary');
        if (h4) {
          captureOriginal(h4, false);
          setText(h4, locale === 'en' ? p.title : originalText.get(h4), false);
        }
        if (sum) {
          captureOriginal(sum, false);
          setText(sum, locale === 'en' ? p.summary : originalText.get(sum), false);
        }
      });
    }

    if (en.services) {
      document.querySelectorAll('#servicesGrid .service-card').forEach((card, i) => {
        const s = en.services[i];
        if (!s) return;
        const h4 = card.querySelector('h4');
        const desc = card.querySelector('p');
        const btn = card.querySelector('.btn');
        const priceSpan = card.querySelector('.service-price span');
        if (h4) {
          captureOriginal(h4, false);
          setText(h4, locale === 'en' ? s.title : originalText.get(h4), false);
        }
        if (desc) {
          captureOriginal(desc, false);
          setText(desc, locale === 'en' ? s.desc : originalText.get(desc), false);
        }
        if (btn) {
          captureOriginal(btn, false);
          setText(btn, locale === 'en' ? s.btn : originalText.get(btn), false);
        }
        if (priceSpan && s.unit) {
          captureOriginal(priceSpan, false);
          setText(priceSpan, locale === 'en' ? s.unit : originalText.get(priceSpan), false);
        }
      });
    }

    if (en.faqs) {
      document.querySelectorAll('.faq-panel .faq-item').forEach((item, i) => {
        const f = en.faqs[i];
        if (!f) return;
        const q = item.querySelector('.faq-question');
        const a = item.querySelector('.faq-answer-inner');
        if (q) {
          captureOriginal(q, true);
          if (locale === 'en') {
            q.innerHTML = `${f.q}<span class="faq-arrow">▼</span>`;
          } else {
            restoreOriginal(q, true);
          }
        }
        if (a) {
          captureOriginal(a, false);
          setText(a, locale === 'en' ? f.a : originalText.get(a), false);
        }
      });
    }

    if (en.team) {
      document.querySelectorAll('.team-card').forEach((card, i) => {
        const tm = en.team[i];
        if (!tm) return;
        const title = card.querySelector('.team-title');
        const edu = card.querySelector('.team-edu');
        const lis = card.querySelectorAll('ul li');
        if (title) {
          captureOriginal(title, false);
          setText(title, locale === 'en' ? tm.title : originalText.get(title), false);
        }
        if (edu) {
          captureOriginal(edu, false);
          setText(edu, locale === 'en' ? tm.edu : originalText.get(edu), false);
        }
        lis.forEach((li, j) => {
          if (!tm.bullets?.[j]) return;
          captureOriginal(li, false);
          setText(li, locale === 'en' ? tm.bullets[j] : originalText.get(li), false);
        });
      });
    }
  }

  function applyMeta(locale) {
    const meta = locale === 'en' ? window.DAOITH_I18N_EN?.meta : window.DAOITH_I18N_ZH?.meta;
    if (meta?.title) document.title = meta.title;
    if (meta?.description) {
      let tag = document.querySelector('meta[name="description"]');
      if (tag) tag.content = meta.description;
    }
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
  }

  function updateLangButtons(locale) {
    document.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === locale);
      btn.setAttribute('aria-pressed', btn.dataset.lang === locale ? 'true' : 'false');
    });
  }

  function applyLocale(locale) {
    captureDefaults();
    applySelectors(locale);
    applyDataI18n(locale);
    applyFormOptions(locale);
    applyListBlocks(locale);
    applyMeta(locale);
    updateLangButtons(locale);
    window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
  }

  function setLocale(locale) {
    if (!SUPPORTED.includes(locale)) return;
    localStorage.setItem(STORAGE_KEY, locale);
    applyLocale(locale);
  }

  function initLanguageSwitcher() {
    document.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => setLocale(btn.dataset.lang));
    });
  }

  function initI18n() {
    initLanguageSwitcher();
    applyLocale(getLocale());
  }

  window.DAOITH_getLocale = getLocale;
  window.DAOITH_setLocale = setLocale;
  window.DAOITH_t = t;
  window.DAOITH_initI18n = initI18n;
})();
